#!/usr/bin/env python3
"""Thumbnail 1280x720: thumb_long.py <clip_index> <seconds> "SMALL LINE" "BIG LINE" "park name" out.jpg
Pick the most colourful, eye-catching frame (water, lava, ice, sunset). Big line 1-3 words. LOOK at the result."""
import os, re, subprocess, sys, collections
from PIL import Image, ImageDraw, ImageFont
LONG = os.environ.get("LONG_DIR", "/home/claude/longform")
FONT = os.environ.get("FONT", "/home/claude/shorts_work/Poppins-Bold.ttf")
ci, t, small, big, name, out = sys.argv[1:7]
f = f"{LONG}/clips/c{int(ci):02d}.mp4"
r = subprocess.run(["ffmpeg", "-ss", t, "-i", f, "-t", "3", "-vf", "cropdetect=24:2:0", "-f", "null", "-"], capture_output=True, text=True).stderr
c = collections.Counter(re.findall(r"crop=(\d+:\d+:\d+:\d+)", r)).most_common(1)
crop = c[0][0] if c else "iw:ih:0:0"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", t, "-i", f, "-frames:v", "1", "-vf",
                f"crop={crop},crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',scale=1280:720,eq=contrast=1.12:saturation=1.35:gamma=1.04", "/tmp/_tb.png"], check=True)
im = Image.open("/tmp/_tb.png").convert("RGB"); d = ImageDraw.Draw(im); Fn = lambda s: ImageFont.truetype(FONT, s)
def fit(text, size, maxw=1180):
    while d.textlength(text, font=Fn(size)) > maxw and size > 40: size -= 4
    return Fn(size)
d.text((50, 170), small, font=fit(small, 92), fill=(255, 255, 255), stroke_width=8, stroke_fill=(0, 0, 0))
d.text((50, 275), big, font=fit(big, 132), fill=(255, 226, 64), stroke_width=10, stroke_fill=(0, 0, 0))
d.text((56, 450), name, font=Fn(46), fill=(255, 255, 255), stroke_width=5, stroke_fill=(0, 0, 0))
im.save(out, quality=92); print("wrote", out)
