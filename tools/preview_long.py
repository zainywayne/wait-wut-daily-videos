#!/usr/bin/env python3
"""Preview every planned shot of a long-form script (3 frames across each ~4s window). LOOK at it before rendering.
usage: preview_long.py script.json plan.jpg"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
LONG = os.environ.get("LONG_DIR", "/home/claude/longform")
F = ImageFont.truetype(os.environ.get("FONT", "/home/claude/shorts_work/Poppins-Bold.ttf"), 20)
s = json.load(open(sys.argv[1])); tiles = []
for i, sc in enumerate(s["scenes"]):
    for sh in sc["shots"]:
        row = []
        for dt in (0.3, 2.0, 3.8):
            o = "/tmp/_pv.jpg"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(sh["ss"] + dt), "-i", f"{LONG}/clips/c{sh['clip']:02d}.mp4", "-frames:v", "1", "-vf", "scale=192:108", o])
            row.append(Image.open(o).copy())
        ImageDraw.Draw(row[0]).text((3, 2), f"s{i+1} c{sh['clip']}@{sh['ss']}", font=F, fill=(255, 255, 0), stroke_width=2, stroke_fill=(0, 0, 0))
        tiles.append(row)
cols = 3; rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGB", (192 * 3 * cols + (cols - 1) * 8, 108 * rows), (40, 40, 40))
for k, row in enumerate(tiles):
    for j, im in enumerate(row): sheet.paste(im, ((k % cols) * (192 * 3 + 8) + j * 192, (k // cols) * 108))
sheet.save(sys.argv[2], quality=80); print("wrote", sys.argv[2], len(tiles), "shots")
