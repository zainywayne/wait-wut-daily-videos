#!/usr/bin/env python3
"""usage: preview_shots.py script.json sheet.png
For EVERY shot in the script, shows 4 frames across its 3.3s window exactly as the renderer will crop them (fill mode).
LOOK at the sheet: reject any shot that has text banners, graphs/chart overlays, logos, people/interviews, cartoon diagrams, black frames. Fix ss and re-run until clean."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw
WORK = os.environ.get("SHORTS_DIR", "/home/claude/shorts_work")
sc = json.load(open(sys.argv[1]))["scenes"]
rows = []
w, h = 90, 160
for si, s in enumerate(sc):
    for hi, sh in enumerate(s.get("shots") or [{"clip": s["clip"], "ss": s.get("ss", 0)}]):
        row = Image.new("RGB", (w * 4, h))
        for k in range(4):
            t = sh.get("ss", 0) + k * 1.1
            out = f"/tmp/pv_{si}_{hi}_{k}.png"
            vf = f"scale=-2:{h},crop={w}:{h}:(iw-{w})*{sh.get('x', 0.5)}:0" if sh.get("mode", "fill") == "fill" else f"scale={w}:-2,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", f"{WORK}/clips/{sh['clip']}.mp4", "-frames:v", "1", "-vf", vf, out], check=True)
            im = Image.open(out); ImageDraw.Draw(im).text((2, 2), f"{k*1.1:.1f}", fill=(255, 255, 0)); row.paste(im, (k * w, 0))
        d = ImageDraw.Draw(row); d.text((3, h - 12), f"S{si+1}.{hi+1} {sh['clip'][:12]} @{sh.get('ss',0)}", fill=(0, 255, 255))
        rows.append(row)
cols = 4
rw = w * 4
rr = (len(rows) + cols - 1) // cols
sheet = Image.new("RGB", (rw * cols, h * rr))
for i, r in enumerate(rows): sheet.paste(r, ((i % cols) * rw, (i // cols) * h))
sheet.save(sys.argv[2]); print("saved", sys.argv[2], len(rows), "shots")
