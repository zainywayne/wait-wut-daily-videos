#!/usr/bin/env python3
"""Free what-if shorts renderer: Kokoro TTS + PIL/numpy frames + ffmpeg.
usage: make_short.py script.json out.mp4
script.json: {"title": str, "voice": str, "scenes": [{"text": str, "visual": str}]}
visuals: moon, earth, tide, night, wobble, question, end
"""
import json, math, subprocess, sys, os, random
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from kokoro_onnx import Kokoro

W, H, FPS = 720, 1280, 30
WORK = os.environ.get("SHORTS_DIR", "/home/claude/shorts_work")
TTS_DIR = WORK + "/tts"
FONT = WORK + "/Poppins-Bold.ttf"

script = json.load(open(sys.argv[1]))
out_path = sys.argv[2]
work = os.path.splitext(out_path)[0] + "_work"
os.makedirs(work, exist_ok=True)

# ---------- voice ----------
kokoro = Kokoro(os.path.join(TTS_DIR, "kokoro-v1.0.onnx"), os.path.join(TTS_DIR, "voices-v1.0.bin"))
voice = script.get("voice", "am_michael")
GAP = 0.12
segs, audio_parts, t = [], [], 0.0
for sc in script["scenes"]:
    samples, sr = kokoro.create(sc["text"], voice=voice, speed=1.14, lang="en-us")
    dur = len(samples) / sr
    segs.append({"start": t, "dur": dur + GAP, "speech": dur, **sc})
    audio_parts.append(samples)
    audio_parts.append(np.zeros(int(GAP * sr), dtype=samples.dtype))
    t += dur + GAP
audio = np.concatenate(audio_parts)
wav = os.path.join(work, "voice.wav")
total = t + 0.5
# ---- sound design: drone bed + whoosh per cut + boom on hook ----
rng = np.random.default_rng(3)
N = int(total * sr)
tt = np.arange(N) / sr
drone = (0.5 * np.sin(2 * np.pi * 55 * tt) + 0.3 * np.sin(2 * np.pi * 82.4 * tt + 1.0) + 0.2 * np.sin(2 * np.pi * 110 * tt * (1 + 0.004 * np.sin(tt * 0.7))))
drone *= (0.75 + 0.25 * np.sin(2 * np.pi * 0.35 * tt)) * 0.11
fx = np.zeros(N)
def whoosh(at, length=0.35, amp=0.22):
    n = int(length * sr); i0 = int(at * sr)
    if i0 + n > N: return
    noise = rng.standard_normal(n)
    k = np.ones(40) / 40
    noise = np.convolve(noise, k, mode="same")
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    fx[i0:i0 + n] += noise * env * amp * 6
for sg in segs[1:]:
    whoosh(max(0, sg["start"] - 0.12))
nb = int(1.2 * sr)
fx[:nb] += 0.55 * np.sin(2 * np.pi * 48 * np.arange(nb) / sr) * np.exp(-np.arange(nb) / (0.35 * sr))
for sg in segs[1:]:
    if sg.get("flash"):
        i0 = int(sg["start"] * sr); nb2 = int(0.9 * sr)
        if i0 + nb2 < N: fx[i0:i0 + nb2] += 0.45 * np.sin(2 * np.pi * 52 * np.arange(nb2) / sr) * np.exp(-np.arange(nb2) / (0.25 * sr))
v = np.zeros(N); v[:len(audio)] = audio[:N] * 1.15
mix = v * 0.95 + drone + fx
mix = mix / max(1.0, np.abs(mix).max() / 0.95)
sf.write(wav, mix.astype(np.float32), sr)
nframes = int(total * FPS)


import random
font_cap = ImageFont.truetype(FONT, 62)
font_title = ImageFont.truetype(FONT, 66)
CLIPS = WORK + "/clips"
def wrap(draw, text, font, maxw):
    lines, cur = [], ""
    for w in text.split():
        t2 = (cur + " " + w).strip()
        if draw.textlength(t2, font=font) <= maxw:
            cur = t2
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

CAP_FONT = ImageFont.truetype(FONT, 86)
def captions(im, seg, lt):
    """2-word pop-in captions, current word yellow, centred in the lower-middle (clear of YouTube UI)."""
    words = seg["text"].split()
    lens = [len(w) + 1 for w in words]; tot = sum(lens)
    acc, idx = 0, len(words) - 1
    for i, l in enumerate(lens):
        acc += l
        if lt <= seg["speech"] * acc / tot:
            idx = i; break
    chunk = idx // 2
    cw = words[chunk * 2: chunk * 2 + 2]; ci = idx - chunk * 2
    # time since this chunk started -> pop scale
    c0 = seg["speech"] * sum(lens[:chunk * 2]) / tot
    pop = 1.0 + 0.22 * max(0.0, 1 - (lt - c0) / 0.12)
    layer = Image.new("RGBA", (W, 260), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    lines = wrap(d, " ".join(cw).upper(), CAP_FONT, W - 70)
    y = 130 - 52 * len(lines); wi = 0
    for ln in lines:
        x = (W - d.textlength(ln, font=CAP_FONT)) / 2
        for w in ln.split():
            col = (255, 226, 40) if wi == ci else (255, 255, 255)
            d.text((x, y), w, font=CAP_FONT, fill=col, stroke_width=9, stroke_fill=(0, 0, 0))
            x += d.textlength(w + " ", font=CAP_FONT); wi += 1
        y += 104
    if pop > 1.001:
        nw, nh = int(W * pop), int(260 * pop)
        layer = layer.resize((nw, nh), Image.BILINEAR).crop(((nw - W) // 2, (nh - 260) // 2, (nw - W) // 2 + W, (nh - 260) // 2 + 260))
    im.paste(layer, (0, 700), layer)


# darken bottom for caption legibility
grad = np.ones((H, W, 1), dtype=np.float32)
ys = np.linspace(0, 1, H)[:, None, None]
grad = 1 - 0.55 * np.clip((ys - 0.55) / 0.45, 0, 1) - 0.25 * np.clip((0.2 - ys) / 0.2, 0, 1)

# ---------- shot plan + quality validation ----------
# A scene is either {"clip","ss"} (single shot) or {"shots":[{"clip","ss","mode"?,"x"?},...]}.
# mode "fill" (default) crops the 16:9 source to fill the vertical frame; x (0-1) picks the crop centre.
# mode "fit" shows the whole frame over a blurred copy. Renderer REFUSES to render weak edits.
MAX_SHOT = 3.3      # seconds: longer than this must be split into more shots
MIN_CLIPS = 5       # distinct source files per video
MIN_GAP = 8.0       # seconds apart inside the same source file (else it looks like a repeat)
plan, used = [], 0
for si, seg in enumerate(segs):
    n = int(round(seg["dur"] * FPS))
    if si == len(segs) - 1:
        n = nframes - used
    shots = seg.get("shots") or [{"clip": seg["clip"], "ss": seg.get("ss", 0)}]
    per = n // len(shots)
    for hi, sh in enumerate(shots):
        cnt = per if hi < len(shots) - 1 else n - per * (len(shots) - 1)
        plan.append((si, sh, cnt))
    used += n
errs = []
for si, seg in enumerate(segs):
    ns = len(seg.get("shots") or [1])
    if seg["dur"] / ns > MAX_SHOT:
        errs.append(f"scene {si+1} ('{seg['text'][:30]}...'): {seg['dur']/ns:.1f}s per shot, needs at least {int(seg['dur']/MAX_SHOT)+1} shots")
seen = {}
for si, sh, cnt in plan:
    for ss2 in seen.get(sh["clip"], []):
        if abs(sh.get("ss", 0) - ss2) < MIN_GAP:
            errs.append(f"scene {si+1}: clip '{sh['clip']}' at {sh.get('ss',0)}s is within {MIN_GAP}s of an earlier shot from the same clip (repeat)")
    seen.setdefault(sh["clip"], []).append(sh.get("ss", 0))
if len(seen) < MIN_CLIPS:
    errs.append(f"only {len(seen)} distinct source clips; need at least {MIN_CLIPS}")
if errs:
    print("REFUSING TO RENDER, fix the script:\n - " + "\n - ".join(errs)); sys.exit(2)
print(f"plan ok: {len(plan)} shots, {len(seen)} source clips")

silent = os.path.join(work, "silent.mp4")
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                       "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", silent], stdin=subprocess.PIPE)
gf = 0
scene_start = {}
for si, sh, cnt in plan:
    seg = segs[si]
    scene_start.setdefault(si, gf)
    mode = sh.get("mode", "fill")
    if mode == "fit":
        vf = f"fps={FPS},split[a][b];[a]scale=-2:{H},crop={W}:{H},boxblur=25:3,eq=brightness=-0.15[bg];[b]scale={W}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2"
    else:
        vf = f"fps={FPS},scale=-2:{H},crop={W}:{H}:(iw-{W})*{sh.get('x', 0.5)}:0"
    dec = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", str(sh.get("ss", 0)), "-stream_loop", "-1", "-i", os.path.join(CLIPS, sh["clip"] + ".mp4"),
                            "-vf", vf, "-frames:v", str(cnt), "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    for k in range(cnt):
        raw = dec.stdout.read(W * H * 3)
        if len(raw) < W * H * 3:
            break
        arr = (np.frombuffer(raw, dtype=np.uint8).reshape(H, W, 3).astype(np.float32) * grad).astype(np.uint8)
        im = Image.fromarray(arr)
        tk = k / FPS
        z = 1.0 + 0.08 * min(1.0, k / max(1, cnt)) + 0.10 * max(0.0, 1 - tk / 0.22) ** 2
        bw, bh = W / z, H / z
        im = im.resize((W, H), Image.BILINEAR, box=((W - bw) / 2, (H - bh) / 2, (W + bw) / 2, (H + bh) / 2))
        ft = gf / FPS
        lt = (gf - scene_start[si]) / FPS
        d = ImageDraw.Draw(im)
        if ft < 2.2:
            for i, ln in enumerate(wrap(d, script["title"].upper(), font_title, W - 80)):
                d.text((W / 2, 150 + i * 82), ln, font=font_title, fill=(255, 255, 255), anchor="mm", stroke_width=7, stroke_fill=(0, 0, 0))
        if seg.get("flash") and lt < 0.08:
            im = Image.blend(im, Image.new("RGB", (W, H), (255, 255, 255)), 0.55); d = ImageDraw.Draw(im)
        if seg.get("flash") and lt < 0.35:
            sx, sy = int(12 * math.sin(lt * 90)), int(9 * math.cos(lt * 77))
            im = im.transform((W, H), Image.AFFINE, (1, 0, sx, 0, 1, sy)); d = ImageDraw.Draw(im)
        if seg.get("flash") and lt < 1.0:
            pop = 1.0 + 0.25 * max(0, 1 - lt / 0.25)
            fs = 150
            while fs > 60 and d.textlength(seg["flash"], font=ImageFont.truetype(FONT, fs)) > W - 70: fs -= 6
            d.text((W / 2, 560), seg["flash"], font=ImageFont.truetype(FONT, int(fs * pop)), fill=(255, 226, 40), anchor="mm", stroke_width=9, stroke_fill=(0, 0, 0))
        if lt < seg["speech"] + 0.05:
            captions(im, seg, lt)
        ff.stdin.write(im.tobytes())
        gf += 1
    dec.stdout.close(); dec.wait()
ff.stdin.close(); ff.wait()

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
                "-shortest", out_path], check=True)
print(f"OK {out_path} {total:.1f}s")
