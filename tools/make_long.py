#!/usr/bin/env python3
"""Long-form documentary renderer: Kokoro narration + NPS aerial clips + xfade + synth ambient pad.
usage: make_long.py script.json out.mp4 [--dry]
script: {"title","voice","speed","scenes":[{"text","shots":[{"clip":int,"ss":float}]}]}  clips in $LONG_DIR/clips/cNN.mp4
"""
import json, os, subprocess, sys, math
import numpy as np, soundfile as sf
from PIL import Image, ImageDraw, ImageFont
LONG = os.environ.get("LONG_DIR", "/home/claude/longform")
FONT = os.environ.get("FONT", "/home/claude/shorts_work/Poppins-Bold.ttf")
TTS = os.environ.get("TTS_DIR", "/home/claude/shorts_work/tts")
script = json.load(open(sys.argv[1])); out = sys.argv[2]; dry = "--dry" in sys.argv
work = os.path.splitext(out)[0] + "_work"; os.makedirs(work, exist_ok=True)
X = 0.7        # crossfade seconds
GAP = 0.8      # pause after each scene
MAXSHOT, MINSHOT = 8.5, 3.0
from kokoro_onnx import Kokoro
k = Kokoro(TTS + "/kokoro-v1.0.onnx", TTS + "/voices-v1.0.bin")
parts, scenes, t = [], [], 0.0
for sc in script["scenes"]:
    a, sr = k.create(sc["text"], voice=script.get("voice", "bm_george"), speed=script.get("speed", 0.97), lang="en-gb")
    d = len(a) / sr
    scenes.append({**sc, "start": t, "dur": d + GAP})
    parts += [a, np.zeros(int(GAP * sr), dtype=a.dtype)]
    t += d + GAP
tail = 4.0
total = t + tail
# ---- validate shot plan ----
errs, used, plan = [], {}, []
for i, sc in enumerate(scenes):
    n = len(sc["shots"]); per = sc["dur"] / n
    if i == len(scenes) - 1: per = (sc["dur"] + tail) / n
    if per > MAXSHOT: errs.append(f"scene {i+1}: {per:.1f}s/shot, needs {math.ceil(sc['dur']/MAXSHOT)}+ shots")
    if per < MINSHOT: errs.append(f"scene {i+1}: {per:.1f}s/shot is too short")
    for sh in sc["shots"]:
        f = f"{LONG}/clips/c{sh['clip']:02d}.mp4"
        cd = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
        L = per + X
        if sh["ss"] + L > cd - 0.2: errs.append(f"scene {i+1}: clip {sh['clip']} @ {sh['ss']} needs {L:.1f}s but clip is {cd:.1f}s")
        for (u0, u1) in used.get(sh["clip"], []):
            if sh["ss"] < u1 + 1.0 and sh["ss"] + L > u0 - 1.0: errs.append(f"scene {i+1}: clip {sh['clip']} window {sh['ss']:.0f}-{sh['ss']+L:.0f} overlaps earlier use {u0:.0f}-{u1:.0f}")
        used.setdefault(sh["clip"], []).append((sh["ss"], sh["ss"] + L))
        plan.append((f, sh["ss"], per))
print(f"narration {t:.0f}s, total {total:.0f}s ({total/60:.1f} min), {len(plan)} shots, {len(used)} source clips")
if errs: print("FIX:\n - " + "\n - ".join(errs)); sys.exit(2)
if dry: sys.exit(0)
# ---- audio: voice + synth ambient pad ----
voice = np.concatenate(parts); N = int(total * sr); v = np.zeros(N); v[:len(voice)] = voice[:N]
tt = np.arange(N) / sr
chords = [[220.0,261.63,329.63],[174.61,220.0,261.63],[196.0,246.94,293.66],[164.81,196.0,246.94]]
pad = np.zeros(N); seg = 10.0
for ci in range(int(total / seg) + 2):
    ch = chords[ci % 4]; s0 = int((ci * seg - 2) * sr); L = int((seg + 4) * sr)
    a0, a1 = max(0, s0), min(N, s0 + L)
    if a1 <= a0: continue
    x = tt[a0:a1]; env = np.sin(np.linspace(0, np.pi, L))[a0 - s0:a1 - s0] ** 2
    y = sum(np.sin(2*np.pi*f*x) + 0.5*np.sin(2*np.pi*f*1.003*x + 1) + 0.25*np.sin(2*np.pi*f*2*x) for f in ch) + 0.8*np.sin(2*np.pi*ch[0]/2*x)
    pad[a0:a1] += y * env
pad *= 0.045 * (0.85 + 0.15 * np.sin(2*np.pi*0.07*tt))
mix = v * 0.95 + pad
fade = np.minimum(1, (total - tt) / 3.0); mix *= fade
mix /= max(1.0, np.abs(mix).max() / 0.95)
wav = work + "/audio.wav"; sf.write(wav, mix.astype(np.float32), sr)
# ---- overlays ----
def card(text, sub, path):
    im = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text((960, 470), text, font=ImageFont.truetype(FONT, 96), fill=(255,255,255,255), anchor="mm", stroke_width=5, stroke_fill=(0,0,0,255))
    if sub: d.text((960, 570), sub, font=ImageFont.truetype(FONT, 42), fill=(255,220,150,255), anchor="mm", stroke_width=3, stroke_fill=(0,0,0,255))
    im.save(path)
card(script["title"].upper(), script.get("subtitle",""), work + "/title.png")
card("THANKS FOR WATCHING", "Footage: U.S. National Park Service", work + "/end.png")
_bars = {}
def bars(f):
    """detect baked-in letterbox bars once per clip"""
    if f not in _bars:
        import re, collections
        r = subprocess.run(["ffmpeg", "-ss", "20", "-i", f, "-t", "6", "-vf", "cropdetect=24:2:0", "-f", "null", "-"], capture_output=True, text=True).stderr
        c = collections.Counter(re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", r)).most_common(1)
        _bars[f] = tuple(int(x) for x in c[0][0]) if c else (1920, 1080, 0, 0)
    return _bars[f]
# ---- video: shots with xfade ----
inputs, fc, n = [], [], len(plan)
for i, (f, ss, per) in enumerate(plan):
    L = per + (X if i < n - 1 else 0)
    inputs += ["-ss", f"{ss:.3f}", "-t", f"{L:.3f}", "-i", f]
    cw, ch, cx, cy = bars(f)
    fc.append(f"[{i}:v]crop={cw}:{ch}:{cx}:{cy},crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',fps=30,scale=1920:1080,setsar=1,eq=contrast=1.07:saturation=1.14:gamma=1.06,format=yuv420p[v{i}]")
acc, A = "v0", plan[0][2] + X
for i in range(1, n):
    last = i == n - 1
    fc.append(f"[{acc}][v{i}]xfade=transition=fade:duration={X}:offset={A - X:.3f}[x{i}]")
    A += (plan[i][2] + (0 if last else X)) - X
    acc = f"x{i}"
ti, ei = n, n + 1
inputs += ["-loop", "1", "-i", work + "/title.png", "-loop", "1", "-i", work + "/end.png"]
fc.append(f"[{ti}:v]format=rgba,fade=t=in:st=0.8:d=1.0:alpha=1,fade=t=out:st=6.0:d=1.2:alpha=1[ti]")
fc.append(f"[{ei}:v]format=rgba,fade=t=in:st={total-9:.2f}:d=1.0:alpha=1[en]")
fc.append(f"[{acc}][ti]overlay=0:0:enable='lt(t,7.5)':shortest=1[o1]")
fc.append(f"[o1][en]overlay=0:0:enable='gt(t,{total-9:.2f})':shortest=1,fade=t=in:st=0:d=1.2,fade=t=out:st={total-2:.2f}:d=1.8[vout]")
open(work + "/fc.txt", "w").write(";\n".join(fc))
cmd = ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-i", wav, "-filter_complex_script", work + "/fc.txt", "-map", "[vout]", "-map", f"{n+2}:a",
       "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-maxrate", "2800k", "-bufsize", "6000k", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "160k", "-t", f"{total:.2f}", "-movflags", "+faststart", out]
subprocess.run(cmd, check=True)
print("OK", out, f"{total:.1f}s")
