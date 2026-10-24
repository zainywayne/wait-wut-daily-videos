#!/usr/bin/env python3
"""usage: check_video.py video.mp4  -> flags repeated shots (same picture >=3s apart), black frames, duration.
Exit 1 if repeats found. Heuristic: if a flagged pair looks like a false positive (e.g. two dark space frames), LOOK at both frames before dismissing."""
import glob, os, subprocess, sys, tempfile
from PIL import Image
v = sys.argv[1]
d = tempfile.mkdtemp()
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", v, "-vf", "fps=2,crop=720:640:0:240,scale=16:16", "-pix_fmt", "gray", d + "/f_%03d.png"], check=True)
hs, means = [], []
for f in sorted(glob.glob(d + "/f_*.png")):
    px = list(Image.open(f).convert("L").resize((8, 8)).tobytes())
    m = sum(px) / 64; means.append(m)
    hs.append(sum((1 << i) for i, p in enumerate(px) if p > m))
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", v], capture_output=True, text=True).stdout)
bad = []
for i in range(len(hs)):
    if means[i] < 14: continue
    for j in range(i + 6, len(hs)):
        if means[j] < 14: continue
        if bin(hs[i] ^ hs[j]).count("1") <= 5:
            bad.append((i / 2, j / 2))
black = [i / 2 for i, m in enumerate(means) if m < 6]
print(f"duration {dur:.1f}s, frames checked {len(hs)}")
print(f"near-black frames at: {black}" if black else "no black frames")
if bad:
    print("REPEATED SHOTS (time A, time B):", bad[:12]); sys.exit(1)
print("no repeated shots")
