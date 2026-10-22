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
v = np.zeros(N); v[:len(audio)] = audio[:N]
mix = v * 0.95 + drone + fx
mix = mix / max(1.0, np.abs(mix).max() / 0.95)
sf.write(wav, mix.astype(np.float32), sr)
nframes = int(total * FPS)


import random
font_cap = ImageFont.truetype(FONT, 62)
font_title = ImageFont.truetype(FONT, 54)
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

def captions(im, seg, lt):
    d = ImageDraw.Draw(im)
    words = seg["text"].split()
    lens = [len(w) + 1 for w in words]
    tot = sum(lens)
    acc, idx = 0, len(words) - 1
    for i, l in enumerate(lens):
        acc += l
        if lt <= seg["speech"] * acc / tot:
            idx = i; break
    # show chunks of 4 words, highlight current
    chunk = idx // 3
    cw = words[chunk * 3: chunk * 3 + 3]
    ci = idx - chunk * 3
    y = 930
    lines = wrap(d, " ".join(cw), font_cap, W - 80)
    wi = 0
    for ln in lines:
        x = (W - d.textlength(ln, font=font_cap)) / 2
        for w in ln.split():
            col = (255, 235, 59) if wi == ci else (255, 255, 255)
            for ox, oy in [(-3, 0), (3, 0), (0, -3), (0, 3), (3, 3), (-3, -3)]:
                d.text((x + ox, y + oy), w, font=font_cap, fill=(0, 0, 0))
            d.text((x, y), w, font=font_cap, fill=col)
            x += d.textlength(w + " ", font=font_cap)
            wi += 1
        y += 80


# darken bottom for caption legibility
grad = np.ones((H, W, 1), dtype=np.float32)
ys = np.linspace(0, 1, H)[:, None, None]
grad = 1 - 0.55 * np.clip((ys - 0.55) / 0.45, 0, 1) - 0.25 * np.clip((0.2 - ys) / 0.2, 0, 1)

silent = os.path.join(work, "silent.mp4")
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                       "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", silent], stdin=subprocess.PIPE)
gf = 0
for si, seg in enumerate(segs):
    n = int(round(seg["dur"] * FPS))
    if si == len(segs) - 1:
        n = nframes - gf
    dec = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", str(seg.get("ss", 0)), "-stream_loop", "-1", "-i", os.path.join(CLIPS, seg["clip"] + ".mp4"),
                            "-filter_complex", f"[0:v]fps={FPS},split[a][b];[a]scale=-2:{H},crop={W}:{H},boxblur=25:3,eq=brightness=-0.15[bg];[b]scale={W}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2", "-frames:v", str(n), "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
                           stdout=subprocess.PIPE)
    for k in range(n):
        raw = dec.stdout.read(W * H * 3)
        if len(raw) < W * H * 3:
            break
        arr = (np.frombuffer(raw, dtype=np.uint8).reshape(H, W, 3).astype(np.float32) * grad).astype(np.uint8)
        im = Image.fromarray(arr)
        z = 1.0 + 0.14 * min(1.0, k / max(1, n))
        bw, bh = W / z, H / z
        im = im.resize((W, H), Image.BILINEAR, box=((W - bw) / 2, (H - bh) / 2, (W + bw) / 2, (H + bh) / 2))
        ft = gf / FPS
        lt = k / FPS
        d = ImageDraw.Draw(im)
        if ft < 2.2:
            for i, ln in enumerate(wrap(d, script["title"].upper(), font_title, W - 80)):
                d.text((W / 2, 130 + i * 70), ln, font=font_title, fill=(255, 235, 59), anchor="mm", stroke_width=4, stroke_fill=(0, 0, 0))
        if seg.get("flash") and lt < 1.0:
            pop = 1.0 + 0.25 * max(0, 1 - lt / 0.25)
            ff_big = ImageFont.truetype(FONT, int(150 * pop))
            d.text((W / 2, 560), seg["flash"], font=ff_big, fill=(255, 235, 59), anchor="mm", stroke_width=8, stroke_fill=(0, 0, 0))
        if lt < seg["speech"] + 0.05:
            captions(im, seg, lt)
        ff.stdin.write(im.tobytes())
        gf += 1
    dec.stdout.close(); dec.wait()
ff.stdin.close(); ff.wait()

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
                "-shortest", out_path], check=True)
print(f"OK {out_path} {total:.1f}s")
