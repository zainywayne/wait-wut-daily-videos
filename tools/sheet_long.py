#!/usr/bin/env python3
"""Labelled contact sheets of every clip in $LONG_DIR/clips (one thumb every ~10-25s). LOOK at every sheet.
usage: sheet_long.py   -> $LONG_DIR/sheet0.jpg, sheet1.jpg ...  (labels like c03@120 = clip 3 at 120s)
Also reports baked-in letterbox bars per clip (make_long.py crops them automatically)."""
import glob, os, subprocess
from PIL import Image, ImageDraw, ImageFont
LONG = os.environ.get("LONG_DIR", "/home/claude/longform")
F = ImageFont.truetype(os.environ.get("FONT", "/home/claude/shorts_work/Poppins-Bold.ttf"), 22)
os.makedirs(LONG + "/thumbs", exist_ok=True); items = []
for f in sorted(glob.glob(LONG + "/clips/c*.mp4")):
    n = os.path.basename(f)[:-4]
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
    print(n, f"{d:.0f}s")
    step = max(8, d / 12) if d > 100 else max(5, d / 6); t = 2.0
    while t < d - 1:
        o = f"{LONG}/thumbs/{n}_{int(t)}.jpg"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", f, "-frames:v", "1", "-vf", "scale=256:144", o])
        if os.path.exists(o): items.append((f"{n}@{int(t)}", o))
        t += step
cols, per = 6, 36
for p in range(0, len(items), per):
    chunk = items[p:p + per]; rows = (len(chunk) + cols - 1) // cols
    sh = Image.new("RGB", (256 * cols, 144 * rows))
    for i, (lab, o) in enumerate(chunk):
        im = Image.open(o); d = ImageDraw.Draw(im)
        d.text((4, 2), lab, font=F, fill=(255, 255, 0), stroke_width=2, stroke_fill=(0, 0, 0))
        sh.paste(im, ((i % cols) * 256, (i // cols) * 144))
    sh.save(f"{LONG}/sheet{p // per}.jpg", quality=82); print("wrote", f"{LONG}/sheet{p // per}.jpg")
