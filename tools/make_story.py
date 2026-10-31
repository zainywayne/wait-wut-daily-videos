#!/usr/bin/env python3
"""Flat 2D horror-story short renderer (original art drawn in code, Kokoro narration, synth sound design).
usage: make_story.py story.json out.mp4
story.json: {"series": "THE QUIET HOUR", "part": 1, "voice": "am_onyx", "speed": 0.92,
  "scenes": [{"text": "...", "scene": "<type>", ...params}]}
scene types + params:
  town      {lights: 1.0->0.0 fade over scene if "lights_out": true}
  sign      {name, pop}
  room      {dark: 0..1, clock: "2:58 AM", curtains: "open"|"closed", face: "calm"|"scared", lights_out: bool}
  phone     {time: "2:58", title: "MESSAGE", lines: ["...", "..."], sender: "Landlord"}
  door      {knocks: 3}
  peephole  {figure: bool}
  window    {figure: bool, curtains: "open"|"closed"}
  street    {figure: bool}
  end       {}  (shows "PART N+1 TOMORROW")
optional on any scene: sfx: "knock"|"buzz"|"hit"|"none"
"""
import json, math, os, random, subprocess, sys
import numpy as np, soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 720, 1280, 30
WORK = os.environ.get("SHORTS_DIR", "/home/claude/shorts_work")
FONT = WORK + "/Poppins-Bold.ttf"
S = json.load(open(sys.argv[1])); OUT = sys.argv[2]
work = os.path.splitext(OUT)[0] + "_work"; os.makedirs(work, exist_ok=True)
rnd = random.Random(7)

# ---------------- palette ----------------
SKY_T, SKY_B = (14, 18, 34), (38, 46, 72)
SNOW = (226, 232, 242); SNOW_SH = (176, 186, 206)
HOUSE = (52, 58, 78); HOUSE_D = (40, 45, 62); ROOF = (230, 236, 245)
WIN_ON = (240, 196, 110); WIN_OFF = (30, 34, 48)
WALL = (58, 64, 84); WALL_LIT = (196, 176, 140); FLOOR = (90, 70, 56); FLOOR_LIT = (150, 116, 84)
DOOR = (96, 64, 44); DOOR_D = (70, 46, 32)
SKIN = (238, 206, 170); HAIR = (40, 30, 26); SHIRT = (52, 70, 110); PANTS = (40, 44, 60)

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def grad(w, h, top, bot):
    y = np.linspace(0, 1, h)[:, None, None]
    a = np.array(top)[None, None] * (1 - y) + np.array(bot)[None, None] * y
    return Image.fromarray(np.repeat(a, w, axis=1).astype(np.uint8))

BW, BH = int(W * 1.08), int(H * 1.08)  # background drawn larger for slow push-in

def stars(d, w, h, n=90, ymax=0.5):
    r = random.Random(3)
    for _ in range(n):
        x, y = r.random() * w, r.random() * h * ymax; s = r.choice([1, 1, 2])
        d.ellipse([x, y, x + s, y + s], fill=(200, 210, 230))

def house(d, x, y, w, h, lit, roof=ROOF, body=HOUSE):
    d.rectangle([x, y, x + w, y + h], fill=body)
    d.polygon([(x - 14, y + 4), (x + w / 2, y - h * 0.55), (x + w + 14, y + 4)], fill=roof)
    d.polygon([(x - 4, y + 4), (x + w / 2, y - h * 0.42), (x + w + 4, y + 4)], fill=body)
    ww = w * 0.22
    for i, wx in enumerate([x + w * 0.15, x + w * 0.63]):
        on = lit[i] if isinstance(lit, (list, tuple)) else lit
        d.rectangle([wx, y + h * 0.25, wx + ww, y + h * 0.25 + ww * 1.1], fill=lerp(WIN_OFF, WIN_ON, on))
        d.line([wx + ww / 2, y + h * 0.25, wx + ww / 2, y + h * 0.25 + ww * 1.1], fill=body, width=2)
    d.rectangle([x + w * 0.42, y + h * 0.5, x + w * 0.58, y + h], fill=DOOR_D)

def person(d, cx, base, scale=1.0, face="calm", dark=0.0, turned=False, coat=None, skin=None, hair=None):
    k = scale; sk = lerp(skin or SKIN, (70, 66, 74), dark); sh = lerp(coat or SHIRT, (24, 28, 40), dark); pa = lerp(PANTS, (18, 20, 28), dark)
    d.rectangle([cx - 22 * k, base - 110 * k, cx - 4 * k, base], fill=pa)
    d.rectangle([cx + 4 * k, base - 110 * k, cx + 22 * k, base], fill=pa)
    d.rounded_rectangle([cx - 38 * k, base - 260 * k, cx + 38 * k, base - 100 * k], radius=int(16 * k), fill=sh)
    d.rectangle([cx - 52 * k, base - 250 * k, cx - 38 * k, base - 140 * k], fill=sh)
    d.rectangle([cx + 38 * k, base - 250 * k, cx + 52 * k, base - 140 * k], fill=sh)
    d.ellipse([cx - 52 * k, base - 150 * k, cx - 38 * k, base - 132 * k], fill=sk)
    d.ellipse([cx + 38 * k, base - 150 * k, cx + 52 * k, base - 132 * k], fill=sk)
    hy = base - 330 * k
    d.ellipse([cx - 40 * k, hy, cx + 40 * k, hy + 84 * k], fill=sk)
    d.chord([cx - 42 * k, hy - 6 * k, cx + 42 * k, hy + 60 * k], 180, 360, fill=hair or HAIR)
    if not turned:
        ey = hy + 40 * k
        for ex in (-14, 14):
            d.ellipse([cx + (ex - 4) * k, ey - 4 * k, cx + (ex + 4) * k, ey + 4 * k], fill=(30, 26, 26))
        if face == "smile":
            d.arc([cx - 26 * k, ey, cx + 26 * k, ey + 34 * k], 20, 160, fill=(70, 30, 30), width=max(2, int(4 * k)))
        elif face == "scared":
            d.ellipse([cx - 7 * k, ey + 16 * k, cx + 7 * k, ey + 32 * k], fill=(60, 30, 30))
        else:
            d.line([cx - 9 * k, ey + 22 * k, cx + 9 * k, ey + 22 * k], fill=(90, 50, 44), width=max(2, int(3 * k)))

def figure(d, cx, base, k=1.0, col=(8, 10, 16)):
    # tall featureless silhouette
    d.rounded_rectangle([cx - 36 * k, base - 300 * k, cx + 36 * k, base], radius=int(30 * k), fill=col)
    d.ellipse([cx - 32 * k, base - 380 * k, cx + 32 * k, base - 300 * k], fill=col)

def snowground(d, y, w, h):
    d.rectangle([0, y, w, h], fill=SNOW)
    d.rectangle([0, y, w, y + 10], fill=SNOW_SH)

# ---------------- scene backgrounds (static, drawn once) ----------------
def bg_town(p, lights):
    im = grad(BW, BH, SKY_T, SKY_B); d = ImageDraw.Draw(im); stars(d, BW, BH)
    d.polygon([(0, BH * 0.62), (BW * 0.3, BH * 0.45), (BW * 0.55, BH * 0.6), (BW * 0.8, BH * 0.43), (BW, BH * 0.57), (BW, BH * 0.72), (0, BH * 0.72)], fill=(70, 80, 108))
    snowground(d, BH * 0.72, BW, BH)
    r = random.Random(5)
    for i, x in enumerate(range(-40, BW, 190)):
        lit = [lights if r.random() < 0.7 else 0.0, lights if r.random() < 0.6 else 0.0]
        house(d, x + 20, BH * 0.72 - 170, 160, 170, lit)
    d.rectangle([0, BH * 0.82, BW, BH * 0.87], fill=(150, 160, 182))
    for x in range(0, BW, 90): d.rectangle([x, BH * 0.843, x + 44, BH * 0.849], fill=SNOW)
    return im

def bg_sign(p):
    im = grad(BW, BH, SKY_T, SKY_B); d = ImageDraw.Draw(im); stars(d, BW, BH)
    d.polygon([(0, BH * 0.5), (BW * 0.5, BH * 0.32), (BW, BH * 0.5), (BW, BH), (0, BH)], fill=(176, 186, 208))
    r = random.Random(9)
    for _ in range(26):
        x, y = r.random() * BW, BH * (0.42 + r.random() * 0.2); s = 30 + r.random() * 40
        d.polygon([(x, y - s * 1.6), (x - s * 0.5, y), (x + s * 0.5, y)], fill=(30, 40, 56))
    for i, x in enumerate(range(60, BW, 150)): house(d, x, BH * 0.62 - 90 + (i % 2) * 40, 90, 90, 0.9 if i % 2 == 0 else 0.0)
    snowground(d, BH * 0.7, BW, BH)
    sx, sy = BW * 0.12, BH * 0.78
    d.rectangle([sx + 40, sy, sx + 56, sy + 170], fill=(40, 40, 44)); d.rectangle([sx + 200, sy, sx + 216, sy + 170], fill=(40, 40, 44))
    d.rectangle([sx, sy - 40, sx + 256, sy + 70], fill=(236, 232, 214)); d.rectangle([sx + 8, sy - 32, sx + 248, sy + 62], outline=(60, 60, 60), width=3)
    f1, f2 = ImageFont.truetype(FONT, 34), ImageFont.truetype(FONT, 22)
    d.text((sx + 128, sy + 0), p.get("name", "ALDER CREEK"), font=f1, fill=(40, 40, 44), anchor="mm")
    d.text((sx + 128, sy + 38), f"POP. {p.get('pop', '900')}", font=f2, fill=(40, 40, 44), anchor="mm")
    return im

def bg_room(p):
    dark = p.get("dark", 0.0)
    im = Image.new("RGB", (BW, BH), lerp(WALL_LIT, WALL, dark)); d = ImageDraw.Draw(im)
    d.rectangle([0, BH * 0.74, BW, BH], fill=lerp(FLOOR_LIT, FLOOR, dark))
    d.rectangle([0, BH * 0.735, BW, BH * 0.745], fill=lerp((120, 96, 70), (50, 40, 34), dark))
    # window
    wx, wy, ww, wh = BW * 0.08, BH * 0.2, BW * 0.36, BH * 0.3
    win = grad(int(ww), int(wh), SKY_T, SKY_B); wd = ImageDraw.Draw(win); stars(wd, int(ww), int(wh), 25, 0.6)
    snowground(wd, wh * 0.72, ww, wh); house(wd, ww * 0.1, wh * 0.72 - 70, 80, 70, 0.0); house(wd, ww * 0.6, wh * 0.72 - 60, 70, 60, 0.0)
    if p.get("figure"): figure(wd, ww * 0.5, wh * 0.8, 0.28)
    im.paste(win, (int(wx), int(wy)))
    fr = lerp((240, 236, 226), (90, 92, 104), dark)
    d.rectangle([wx - 10, wy - 10, wx + ww + 10, wy + wh + 10], outline=fr, width=12)
    d.line([wx + ww / 2, wy, wx + ww / 2, wy + wh], fill=fr, width=8); d.line([wx, wy + wh / 2, wx + ww, wy + wh / 2], fill=fr, width=8)
    if p.get("curtains", "closed") == "closed":
        cc = lerp((150, 60, 54), (60, 30, 32), dark)
        cd = lerp(cc, (0, 0, 0), 0.25)
        for (a, b) in ((wx - 26, wx + ww * 0.47), (wx + ww * 0.53, wx + ww + 26)):
            d.rectangle([a, wy - 30, b, wy + wh + 30], fill=cc)
            for fx_ in np.linspace(a + 14, b - 14, 4): d.rectangle([fx_, wy - 30, fx_ + 6, wy + wh + 30], fill=cd)
        d.rectangle([wx - 40, wy - 44, wx + ww + 40, wy - 30], fill=lerp((90, 80, 70), (40, 36, 34), dark))
    else:
        cc = lerp((150, 60, 54), (60, 30, 32), dark)
        d.rectangle([wx - 40, wy - 30, wx + 20, wy + wh + 30], fill=cc); d.rectangle([wx + ww - 20, wy - 30, wx + ww + 40, wy + wh + 30], fill=cc)
    # door
    dx, dy = BW * 0.62, BH * 0.33
    d.rectangle([dx - 12, dy - 12, dx + 232, BH * 0.74], fill=lerp((236, 230, 220), (70, 72, 84), dark))
    d.rectangle([dx, dy, dx + 220, BH * 0.74], fill=lerp(DOOR, DOOR_D, dark))
    for yy in (dy + 40, dy + 300): d.rectangle([dx + 30, yy, dx + 190, yy + 210], outline=lerp((120, 82, 56), (54, 36, 26), dark), width=5)
    d.ellipse([dx + 180, BH * 0.55, dx + 200, BH * 0.55 + 20], fill=(200, 170, 90))
    d.ellipse([dx + 102, dy + 120, dx + 118, dy + 136], fill=(30, 30, 30))
    # lamp
    if dark < 0.5:
        lx = BW * 0.5
        d.rectangle([lx - 4, BH * 0.52, lx + 4, BH * 0.735], fill=(60, 56, 52)); d.polygon([(lx - 40, BH * 0.52), (lx + 40, BH * 0.52), (lx + 26, BH * 0.46), (lx - 26, BH * 0.46)], fill=(238, 226, 190))
    person(d, BW * 0.36, BH * 0.74, 1.15, p.get("face", "calm"), dark)
    if dark > 0.5:  # moonlight from window
        glow = Image.new("L", (BW, BH), 0); gd = ImageDraw.Draw(glow)
        gd.polygon([(wx, wy + wh), (wx + ww, wy + wh), (wx + ww * 1.6, BH), (wx - ww * 0.2, BH)], fill=40)
        im = Image.composite(Image.new("RGB", (BW, BH), (120, 140, 190)), im, glow.filter(ImageFilter.GaussianBlur(30)))
    return im

def bg_phone(p):
    im = Image.new("RGB", (BW, BH), (14, 16, 24)); d = ImageDraw.Draw(im)
    cx = BW / 2; L, R = cx - 270, cx + 270
    d.rounded_rectangle([L, BH * 0.08, R, BH * 0.95], radius=60, fill=(10, 10, 12))
    d.rounded_rectangle([L + 16, BH * 0.08 + 16, R - 16, BH * 0.95 - 16], radius=48, fill=(34, 38, 56))
    f = lambda s: ImageFont.truetype(FONT, s)
    d.text((cx, BH * 0.17), p.get("time", "2:58"), font=f(110), fill=(236, 238, 246), anchor="mm")
    y0 = BH * 0.25
    lines = p.get("lines", []); hgt = 130 + 58 * len(lines)
    d.rounded_rectangle([L + 40, y0, R - 40, y0 + hgt], radius=26, fill=(238, 238, 242))
    hdr = (200, 50, 50) if p.get("alert") else (60, 120, 220)
    d.rounded_rectangle([L + 40, y0, R - 40, y0 + 62], radius=26, fill=hdr); d.rectangle([L + 40, y0 + 36, R - 40, y0 + 62], fill=hdr)
    d.text((cx, y0 + 32), p.get("title", "MESSAGE").upper(), font=f(30), fill=(255, 255, 255), anchor="mm")
    if p.get("sender"): d.text((L + 64, y0 + 76), p["sender"], font=f(28), fill=(110, 110, 120))
    yy = y0 + 150
    for ln in lines:
        d.text((cx, yy), ln, font=f(40), fill=(26, 26, 32), anchor="mm"); yy += 58
    for sgn in (-1, 1):
        d.polygon([(cx + sgn * 230, BH * 0.78), (cx + sgn * 300, BH * 0.74), (cx + sgn * 400, BH), (cx + sgn * 200, BH)], fill=SHIRT)
        d.ellipse([cx + sgn * 268 - 48, BH * 0.68, cx + sgn * 268 + 48, BH * 0.82], fill=SKIN)
    return im

def bg_door(p):
    im = Image.new("RGB", (BW, BH), (34, 36, 48)); d = ImageDraw.Draw(im)
    d.rectangle([BW * 0.12, BH * 0.06, BW * 0.88, BH], fill=(60, 62, 76))
    d.rectangle([BW * 0.16, BH * 0.09, BW * 0.84, BH], fill=DOOR_D)
    for yy in (0.14, 0.52): d.rectangle([BW * 0.24, BH * yy, BW * 0.76, BH * (yy + 0.32)], outline=(54, 36, 26), width=8)
    d.ellipse([BW * 0.72, BH * 0.5, BW * 0.78, BH * 0.53], fill=(170, 146, 80))
    d.ellipse([BW * 0.49, BH * 0.3, BW * 0.51, BH * 0.31], fill=(16, 16, 16))
    d.rectangle([0, BH * 0.985, BW, BH], fill=(240, 220, 160))  # light under door
    return im

def bg_peephole(p):
    im = Image.new("RGB", (BW, BH), (6, 6, 10)); d = ImageDraw.Draw(im)
    view = grad(560, 560, SKY_T, (60, 66, 90)); vd = ImageDraw.Draw(view); stars(vd, 560, 560, 20, 0.4)
    snowground(vd, 400, 560, 560); vd.rectangle([180, 120, 380, 420], fill=(46, 50, 66))
    vd.ellipse([262, 150, 298, 186], fill=(240, 220, 150))
    if p.get("figure"): figure(vd, 280, 470, 0.95)
    mask = Image.new("L", (560, 560), 0); ImageDraw.Draw(mask).ellipse([0, 0, 560, 560], fill=255)
    view = view.filter(ImageFilter.GaussianBlur(1.2))
    vig = Image.new("L", (560, 560), 0); ImageDraw.Draw(vig).ellipse([60, 60, 500, 500], fill=255); vig = vig.filter(ImageFilter.GaussianBlur(60))
    view = Image.composite(view, Image.new("RGB", (560, 560), (0, 0, 0)), vig)
    im.paste(view, (int(BW / 2 - 280), int(BH * 0.42 - 280)), mask)
    d.ellipse([BW / 2 - 290, BH * 0.42 - 290, BW / 2 + 290, BH * 0.42 + 290], outline=(40, 40, 46), width=16)
    return im

def bg_window(p):
    im = Image.new("RGB", (BW, BH), (40, 34, 30)); d = ImageDraw.Draw(im)
    wx, wy, ww, wh = BW * 0.1, BH * 0.12, BW * 0.8, BH * 0.62
    win = grad(int(ww), int(wh), SKY_T, SKY_B); wd = ImageDraw.Draw(win); stars(wd, int(ww), int(wh), 40, 0.5)
    snowground(wd, wh * 0.68, ww, wh); house(wd, 20, wh * 0.68 - 130, 150, 130, 0.0); house(wd, ww - 190, wh * 0.68 - 120, 140, 120, 0.0)
    if p.get("figure"): figure(wd, ww * 0.52, wh * 0.86, 0.75)
    im.paste(win, (int(wx), int(wy)))
    d.rectangle([wx - 14, wy - 14, wx + ww + 14, wy + wh + 14], outline=(70, 72, 84), width=20)
    d.line([wx + ww / 2, wy, wx + ww / 2, wy + wh], fill=(70, 72, 84), width=12)
    d.line([wx, wy + wh / 2, wx + ww, wy + wh / 2], fill=(70, 72, 84), width=12)
    cc = (60, 30, 32)
    if p.get("curtains", "open") == "open":
        d.rectangle([wx - 50, wy - 40, wx + 40, wy + wh + 40], fill=cc); d.rectangle([wx + ww - 40, wy - 40, wx + ww + 50, wy + wh + 40], fill=cc)
    return im

def bg_street(p):
    im = grad(BW, BH, SKY_T, SKY_B); d = ImageDraw.Draw(im); stars(d, BW, BH)
    snowground(d, BH * 0.55, BW, BH)
    d.polygon([(BW * 0.42, BH * 0.55), (BW * 0.58, BH * 0.55), (BW * 0.95, BH), (BW * 0.05, BH)], fill=(150, 160, 182))
    house(d, BW * 0.06, BH * 0.55 - 120, 140, 120, 0.0); house(d, BW * 0.68, BH * 0.55 - 130, 150, 130, 0.0)
    d.rectangle([BW * 0.8, BH * 0.3, BW * 0.81, BH * 0.55], fill=(30, 30, 36)); d.ellipse([BW * 0.78, BH * 0.28, BW * 0.83, BH * 0.31], fill=(250, 220, 150))
    if p.get("figure"): figure(d, BW * 0.5, BH * 0.62, 0.42)
    for i in range(6): d.ellipse([BW * 0.5 - 8 + (i % 2) * 18, BH * (0.66 + i * 0.05), BW * 0.5 + 8 + (i % 2) * 18, BH * (0.675 + i * 0.05)], fill=(120, 128, 150))
    return im

def bg_end(p):
    im = Image.new("RGB", (BW, BH), (8, 9, 14)); return im

BG = {"town": lambda p: bg_town(p, 1.0), "sign": bg_sign, "room": bg_room, "phone": bg_phone, "door": bg_door,
      "peephole": bg_peephole, "window": bg_window, "street": bg_street, "end": bg_end}


# ---------------- desert / gas station set ----------------
D_SKY_T, D_SKY_B = (16, 14, 34), (64, 44, 70)
SAND = (120, 86, 64); SAND_D = (92, 64, 50); MESA = (72, 46, 52); ROAD = (44, 42, 48)
def desert_base(sky=True):
    im = grad(BW, BH, D_SKY_T, D_SKY_B); d = ImageDraw.Draw(im); stars(d, BW, BH, 140, 0.55)
    d.ellipse([BW * 0.72, BH * 0.1, BW * 0.82, BH * 0.1 + BW * 0.1], fill=(236, 226, 200))
    d.polygon([(0, BH * 0.6), (BW * 0.08, BH * 0.5), (BW * 0.3, BH * 0.5), (BW * 0.36, BH * 0.6)], fill=MESA)
    d.polygon([(BW * 0.6, BH * 0.6), (BW * 0.66, BH * 0.46), (BW * 0.94, BH * 0.46), (BW, BH * 0.54), (BW, BH * 0.6)], fill=MESA)
    d.rectangle([0, BH * 0.6, BW, BH], fill=SAND)
    return im, d
def cactus(d, x, y, k=1.0, col=(46, 70, 54)):
    d.rounded_rectangle([x - 12 * k, y - 140 * k, x + 12 * k, y], radius=int(12 * k), fill=col)
    d.rounded_rectangle([x - 46 * k, y - 100 * k, x - 28 * k, y - 50 * k], radius=int(9 * k), fill=col); d.rectangle([x - 46 * k, y - 60 * k, x, y - 46 * k], fill=col)
    d.rounded_rectangle([x + 28 * k, y - 120 * k, x + 46 * k, y - 70 * k], radius=int(9 * k), fill=col); d.rectangle([x, y - 80 * k, x + 46 * k, y - 66 * k], fill=col)
def car(d, cx, y, k=1.0, col=(120, 40, 40), lights=False):
    d.rounded_rectangle([cx - 110 * k, y - 50 * k, cx + 110 * k, y], radius=int(14 * k), fill=col)
    d.polygon([(cx - 60 * k, y - 50 * k), (cx - 36 * k, y - 92 * k), (cx + 46 * k, y - 92 * k), (cx + 70 * k, y - 50 * k)], fill=col)
    d.polygon([(cx - 50 * k, y - 52 * k), (cx - 32 * k, y - 84 * k), (cx + 4 * k, y - 84 * k), (cx + 4 * k, y - 52 * k)], fill=(40, 50, 70))
    d.polygon([(cx + 10 * k, y - 52 * k), (cx + 10 * k, y - 84 * k), (cx + 42 * k, y - 84 * k), (cx + 60 * k, y - 52 * k)], fill=(40, 50, 70))
    for wx in (-64, 64): d.ellipse([cx + (wx - 24) * k, y - 22 * k, cx + (wx + 24) * k, y + 24 * k], fill=(22, 22, 26))
    if lights: d.ellipse([cx + 96 * k, y - 40 * k, cx + 116 * k, y - 22 * k], fill=(255, 240, 180))
def sign_board(d, x, y, num, k=1.0, glow=True):
    d.rectangle([x - 8 * k, y, x + 8 * k, y + 260 * k], fill=(50, 50, 56))
    d.rectangle([x - 90 * k, y - 170 * k, x + 90 * k, y], fill=(30, 30, 34)); d.rectangle([x - 84 * k, y - 164 * k, x + 84 * k, y - 120 * k], fill=(200, 60, 50))
    d.text((x, y - 142 * k), "GAS", font=ImageFont.truetype(FONT, int(30 * k)), fill=(255, 255, 255), anchor="mm")
    d.rectangle([x - 84 * k, y - 112 * k, x + 84 * k, y - 8 * k], fill=(12, 12, 14))
    d.text((x, y - 60 * k), num, font=ImageFont.truetype(FONT, int(70 * k)), fill=(255, 70, 60) if glow else (70, 30, 30), anchor="mm")
def bg_desert(p):
    im, d = desert_base()
    d.polygon([(BW * 0.47, BH * 0.6), (BW * 0.53, BH * 0.6), (BW * 0.9, BH), (BW * 0.1, BH)], fill=ROAD)
    for i in range(7):
        y0 = BH * (0.62 + i * 0.055); w0 = 3 + i * 3
        d.rectangle([BW / 2 - w0 / 2, y0, BW / 2 + w0 / 2, y0 + 10 + i * 6], fill=(220, 190, 80))
    cactus(d, BW * 0.15, BH * 0.8, 1.2); cactus(d, BW * 0.86, BH * 0.72, 0.8)
    if p.get("headlights"):
        d.ellipse([BW * 0.48, BH * 0.595, BW * 0.495, BH * 0.605], fill=(255, 245, 200)); d.ellipse([BW * 0.505, BH * 0.595, BW * 0.52, BH * 0.605], fill=(255, 245, 200))
    if p.get("sign"): sign_board(d, BW * 0.74, BH * 0.5, p["sign"], 1.3)
    return im
def bg_station(p):
    im, d = desert_base()
    d.rectangle([0, BH * 0.78, BW, BH], fill=ROAD)
    d.rectangle([BW * 0.05, BH * 0.36, BW * 0.95, BH * 0.4], fill=(220, 220, 226)); d.rectangle([BW * 0.05, BH * 0.4, BW * 0.95, BH * 0.415], fill=(200, 60, 50))
    for x in (0.14, 0.86): d.rectangle([BW * x - 10, BH * 0.415, BW * x + 10, BH * 0.7], fill=(200, 200, 206))
    glow = Image.new("L", (BW, BH), 0); ImageDraw.Draw(glow).rectangle([BW * 0.1, BH * 0.415, BW * 0.9, BH * 0.72], fill=60)
    im = Image.composite(Image.new("RGB", (BW, BH), (250, 240, 210)), im, glow.filter(ImageFilter.GaussianBlur(40))); d = ImageDraw.Draw(im)
    for x in (0.34, 0.66):
        d.rounded_rectangle([BW * x - 34, BH * 0.56, BW * x + 34, BH * 0.7], radius=8, fill=(220, 70, 60)); d.rectangle([BW * x - 22, BH * 0.575, BW * x + 22, BH * 0.61], fill=(30, 30, 36))
    d.rectangle([BW * 0.05, BH * 0.7, BW * 0.95, BH * 0.715], fill=(150, 150, 156))
    if p.get("car"): car(d, BW * 0.5, BH * 0.86, 1.3, (120, 40, 40))
    if p.get("sign"): sign_board(d, BW * 0.9, BH * 0.5, p["sign"], 0.8)
    return im
def bg_store(p):
    dark = p.get("dark", 0.0)
    im = Image.new("RGB", (BW, BH), lerp((214, 220, 210), (60, 66, 70), dark)); d = ImageDraw.Draw(im)
    d.rectangle([0, BH * 0.76, BW, BH], fill=lerp((170, 170, 160), (60, 60, 60), dark))
    for i, x in enumerate(np.linspace(0, BW, 12)): d.rectangle([x, BH * 0.76, x + 3, BH], fill=lerp((150, 150, 140), (50, 50, 50), dark))
    # big window onto the pumps / highway
    wx, wy, ww, wh = BW * 0.04, BH * 0.14, BW * 0.48, BH * 0.34
    win = grad(int(ww), int(wh), D_SKY_T, D_SKY_B); wd = ImageDraw.Draw(win); stars(wd, int(ww), int(wh), 30, 0.5)
    wd.rectangle([0, wh * 0.66, ww, wh], fill=SAND_D); wd.rectangle([0, wh * 0.8, ww, wh], fill=ROAD)
    if p.get("sign"): sign_board(wd, ww * 0.62, wh * 0.66, p["sign"], 0.75)
    if p.get("headlights"): wd.ellipse([ww * 0.05, wh * 0.82, ww * 0.12, wh * 0.86], fill=(255, 245, 200)); wd.ellipse([ww * 0.14, wh * 0.82, ww * 0.21, wh * 0.86], fill=(255, 245, 200))
    if p.get("car_outside"): car(wd, ww * 0.35, wh * 0.95, 0.5, (120, 40, 40))
    im.paste(win, (int(wx), int(wy))); d.rectangle([wx - 8, wy - 8, wx + ww + 8, wy + wh + 8], outline=(90, 94, 100), width=10)
    # shelves
    for r in range(3):
        y = BH * (0.2 + r * 0.12); d.rectangle([BW * 0.64, y, BW * 0.98, y + 10], fill=(120, 120, 126))
        rr = random.Random(r)
        for x in np.arange(BW * 0.65, BW * 0.97, 26): d.rectangle([x, y - 50 - rr.random() * 20, x + 20, y], fill=rr.choice([(200, 70, 60), (60, 120, 200), (230, 190, 60), (80, 160, 90)]))
    # counter + register
    d.rectangle([BW * 0.0, BH * 0.62, BW * 0.7, BH * 0.78], fill=lerp((110, 90, 70), (50, 42, 36), dark)); d.rectangle([0, BH * 0.6, BW * 0.72, BH * 0.625], fill=lerp((150, 128, 100), (70, 60, 50), dark))
    d.rectangle([BW * 0.08, BH * 0.54, BW * 0.24, BH * 0.6], fill=(50, 50, 56)); d.rectangle([BW * 0.1, BH * 0.55, BW * 0.22, BH * 0.575], fill=(60, 200, 120))
    person(d, BW * 0.57, BH * 0.62, 1.0, p.get("face", "calm"), dark)
    if dark > 0.5:
        glow = Image.new("L", (BW, BH), 0); ImageDraw.Draw(glow).rectangle([wx, wy, wx + ww, wy + wh], fill=70)
        im = Image.composite(Image.new("RGB", (BW, BH), (255, 90, 70)), im, glow.filter(ImageFilter.GaussianBlur(50)))
    return im
def bg_cctv(p):
    im, d = desert_base()
    d.rectangle([0, BH * 0.72, BW, BH], fill=ROAD)
    d.rectangle([BW * 0.0, BH * 0.36, BW * 1.0, BH * 0.4], fill=(220, 220, 226))
    for x in (0.3, 0.7): d.rounded_rectangle([BW * x - 34, BH * 0.56, BW * x + 34, BH * 0.7], radius=8, fill=(220, 70, 60))
    if p.get("car"): car(d, BW * 0.62, BH * 0.76, 1.6, (120, 40, 40), lights=p.get("car_lights", False))
    if p.get("sign"): sign_board(d, BW * 0.25, BH * 0.5, p["sign"], 1.25)
    if p.get("figure"): figure(d, BW * 0.52, BH * 0.72, 0.6)
    a = np.asarray(im.convert("L")).astype(np.float32)
    a = np.clip(a * 1.25 + 18, 0, 255) + np.random.default_rng(4).normal(0, 9, a.shape)
    g = np.stack([a * 0.55, a * 0.95, a * 0.6], -1).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(g); d = ImageDraw.Draw(im)
    for y in range(0, BH, 6): d.line([0, y, BW, y], fill=(0, 0, 0), width=1)
    d.text((40, 60), "CAM 02  PUMPS", font=ImageFont.truetype(FONT, 34), fill=(230, 255, 230))
    d.text((40, 104), p.get("stamp", "03:12:44"), font=ImageFont.truetype(FONT, 34), fill=(230, 255, 230))
    d.ellipse([BW - 90, 70, BW - 60, 100], fill=(230, 40, 40))
    return im
BG.update({"desert": bg_desert, "station": bg_station, "store": bg_store, "cctv": bg_cctv})


# ---------------- school bus set ----------------
BUS_Y = (238, 178, 36); BUS_YD = (196, 140, 24)
def snow_trees(d, w, y, n=9, seed=2, col=(26, 36, 46)):
    r = random.Random(seed)
    for _ in range(n):
        x = r.random() * w; s_ = 60 + r.random() * 70
        d.polygon([(x, y - s_ * 2.2), (x - s_ * 0.6, y), (x + s_ * 0.6, y)], fill=col)
        d.polygon([(x, y - s_ * 2.2), (x - s_ * 0.25, y - s_ * 1.4), (x + s_ * 0.25, y - s_ * 1.4)], fill=(220, 228, 240))
def bus_side(d, x, y, k=1.0):
    d.rounded_rectangle([x, y - 220 * k, x + 560 * k, y], radius=int(26 * k), fill=BUS_Y)
    d.rectangle([x, y - 70 * k, x + 560 * k, y - 50 * k], fill=(30, 30, 30))
    for i in range(6): d.rectangle([x + (40 + i * 82) * k, y - 190 * k, x + (100 + i * 82) * k, y - 120 * k], fill=(40, 48, 66))
    d.rectangle([x + 530 * k, y - 160 * k, x + 560 * k, y - 120 * k], fill=(255, 245, 200))
    for wx in (110, 450): d.ellipse([x + (wx - 44) * k, y - 44 * k, x + (wx + 44) * k, y + 44 * k], fill=(24, 24, 28))
    d.text((x + 300 * k, y - 95 * k), "SCHOOL BUS", font=ImageFont.truetype(FONT, int(30 * k)), fill=(30, 30, 30), anchor="mm")
    d.rectangle([x - 6, y - 10 * k, x + 560 * k + 6, y + 30 * k], fill=SNOW)  # buried in snow
def bg_road(p):
    im = grad(BW, BH, SKY_T, SKY_B); d = ImageDraw.Draw(im); stars(d, BW, BH, 40, 0.3)
    snowground(d, BH * 0.6, BW, BH); snow_trees(d, BW, BH * 0.62, 11)
    d.polygon([(BW * 0.0, BH * 0.78), (BW, BH * 0.7), (BW, BH * 0.8), (0, BH * 0.9)], fill=(196, 204, 220))
    bus_side(d, BW * 0.12, BH * 0.8, 1.15)
    if p.get("headlights"): d.ellipse([BW * 0.86, BH * 0.62, BW * 0.9, BH * 0.64], fill=(255, 245, 200)); d.ellipse([BW * 0.92, BH * 0.62, BW * 0.96, BH * 0.64], fill=(255, 245, 200))
    return im
KIDHAIR = [(40, 30, 26), (200, 150, 70), (110, 60, 30), (20, 20, 20), (160, 90, 40), (230, 200, 120)]
KIDSKIN = [(238, 206, 170), (196, 150, 110), (120, 84, 60), (230, 190, 150)]
def bg_busin(p):
    dark = p.get("dark", 0.3)
    im = Image.new("RGB", (BW, BH), lerp((150, 150, 140), (40, 42, 50), dark)); d = ImageDraw.Draw(im)
    # ceiling + windows both sides in perspective
    vx, vy = BW / 2, BH * 0.36
    d.polygon([(0, 0), (BW, 0), (vx + 90, vy - 60), (vx - 90, vy - 60)], fill=lerp((220, 220, 210), (60, 62, 70), dark))
    d.polygon([(0, BH), (BW, BH), (vx + 90, vy + 90), (vx - 90, vy + 90)], fill=lerp((90, 90, 96), (30, 30, 36), dark))
    for side in (-1, 1):
        for i in range(5):
            t0, t1 = i / 5, (i + 0.7) / 5
            x0 = BW / 2 + side * (BW / 2 - (BW / 2 - 90) * t0); x1 = BW / 2 + side * (BW / 2 - (BW / 2 - 90) * t1)
            ya0, yb0 = BH * 0.12 + (vy - 50 - BH * 0.12) * t0, BH * 0.4 + (vy + 20 - BH * 0.4) * t0
            ya1, yb1 = BH * 0.12 + (vy - 50 - BH * 0.12) * t1, BH * 0.4 + (vy + 20 - BH * 0.4) * t1
            d.polygon([(x0, ya0), (x1, ya1), (x1, yb1), (x0, yb0)], fill=(30, 38, 58))
    d.rectangle([vx - 90, vy - 60, vx + 90, vy + 90], fill=(28, 34, 52))
    # seats rows (back to front) with kids
    r = random.Random(11); kid = 0
    for row in range(5, -1, -1):
        t = row / 6; sc = 1 - t * 0.75
        y = BH * 0.95 - (BH * 0.95 - vy - 90) * t
        for side in (-1, 1):
            cx = BW / 2 + side * (150 + 120 * (1 - t)) * sc * 1.6
            sw = 230 * sc
            d.rounded_rectangle([cx - sw / 2, y - 210 * sc, cx + sw / 2, y], radius=int(20 * sc), fill=lerp((60, 90, 140), (26, 34, 52), dark))
            if r.random() < 0.85 and kid < 12:
                kid += 1; hx = cx + (r.random() - 0.5) * sw * 0.4; hs = 46 * sc
                hy = y - 210 * sc - hs * 0.9
                sk = lerp(r.choice(KIDSKIN), (60, 56, 64), dark)
                d.ellipse([hx - hs, hy - hs, hx + hs, hy + hs], fill=sk)
                d.chord([hx - hs * 1.05, hy - hs * 1.1, hx + hs * 1.05, hy + hs * 0.6], 180, 360, fill=lerp(r.choice(KIDHAIR), (20, 20, 24), dark))
                if row < 3:
                    for ex in (-0.35, 0.35): d.ellipse([hx + ex * hs - 4 * sc, hy - 2, hx + ex * hs + 4 * sc, hy + 8 * sc], fill=(26, 22, 22))
            d.rounded_rectangle([cx - sw / 2, y - 160 * sc, cx + sw / 2, y], radius=int(16 * sc), fill=lerp((70, 104, 160), (30, 40, 60), dark))
    return im
def bg_busdoor(p):
    im = Image.new("RGB", (BW, BH), (30, 32, 40)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, BW, BH], fill=BUS_YD)
    gx0, gx1, gy0, gy1 = BW * 0.14, BW * 0.86, BH * 0.1, BH * 0.86
    view = grad(int(gx1 - gx0), int(gy1 - gy0), SKY_T, SKY_B); vd = ImageDraw.Draw(view); vw, vh = view.size
    snowground(vd, vh * 0.62, vw, vh); snow_trees(vd, vw, vh * 0.64, 6, 5)
    if p.get("man"):
        person(vd, vw * 0.5, vh * 0.98, 2.2, "smile", 0.25, coat=(170, 36, 40))
    im.paste(view, (int(gx0), int(gy0)))
    for gx in (gx0, (gx0 + gx1) / 2, gx1): d.rectangle([gx - 14, gy0, gx + 14, gy1], fill=(40, 40, 46))
    d.rectangle([gx0, gy0 - 14, gx1, gy0 + 14], fill=(40, 40, 46)); d.rectangle([gx0, gy0 + (gy1 - gy0) * 0.7 - 10, gx1, gy0 + (gy1 - gy0) * 0.7 + 10], fill=(40, 40, 46))
    d.rectangle([gx0, gy1 - 14, gx1, gy1 + 14], fill=(40, 40, 46))
    d.rectangle([0, BH * 0.9, BW, BH], fill=(50, 50, 56))
    if p.get("lever"):
        d.line([BW * 0.06, BH * 1.0, BW * 0.2, BH * 0.72], fill=(160, 160, 166), width=18); d.ellipse([BW * 0.16, BH * 0.68, BW * 0.26, BH * 0.75], fill=(30, 30, 30))
        d.ellipse([BW * 0.13, BH * 0.7, BW * 0.27, BH * 0.79], fill=SKIN)
    return im
def bg_kidclose(p):
    im = Image.new("RGB", (BW, BH), (34, 38, 52)); d = ImageDraw.Draw(im)
    d.rectangle([0, BH * 0.15, BW, BH * 0.4], fill=(26, 32, 48))
    cx, cy, hs = BW * 0.5, BH * 0.42, 230
    d.rounded_rectangle([cx - 260, cy + 160, cx + 260, BH], radius=80, fill=(150, 90, 140))
    d.ellipse([cx - hs, cy - hs, cx + hs, cy + hs], fill=(230, 196, 160))
    d.chord([cx - hs * 1.08, cy - hs * 1.15, cx + hs * 1.08, cy + hs * 0.55], 180, 360, fill=(110, 60, 30))
    d.rectangle([cx - hs * 1.08, cy - hs * 0.3, cx - hs * 0.8, cy + hs * 1.2], fill=(110, 60, 30)); d.rectangle([cx + hs * 0.8, cy - hs * 0.3, cx + hs * 1.08, cy + hs * 1.2], fill=(110, 60, 30))
    for ex in (-80, 80):
        d.ellipse([cx + ex - 24, cy - 10, cx + ex + 24, cy + 38], fill=(255, 255, 255)); d.ellipse([cx + ex - 12, cy + 2, cx + ex + 12, cy + 30], fill=(30, 24, 24))
    d.ellipse([cx - 18, cy + 100, cx + 18, cy + 130], fill=(90, 40, 40))
    return im
BG.update({"road": bg_road, "busin": bg_busin, "busdoor": bg_busdoor, "kidclose": bg_kidclose})


# ---------------- caveman / invention set (supersampled 2x, richer art) ----------------
SS = 2
class SD:
    """ImageDraw proxy that scales every coordinate/width/font by SS (draw at 2x, downsample = smooth edges)."""
    def __init__(self, im): self.d = ImageDraw.Draw(im)
    def _c(self, xy):
        if isinstance(xy, (list, tuple)) and xy and isinstance(xy[0], (list, tuple)): return [(a * SS, b * SS) for a, b in xy]
        return [v * SS for v in xy]
    def _k(self, kw):
        for key in ("width", "radius"):
            if key in kw: kw[key] = int(kw[key] * SS)
        if "font" in kw: kw["font"] = kw["font"].font_variant(size=int(kw["font"].size * SS))
        if "stroke_width" in kw: kw["stroke_width"] = int(kw["stroke_width"] * SS)
        return kw
    def rectangle(self, xy, **kw): self.d.rectangle(self._c(xy), **self._k(kw))
    def rounded_rectangle(self, xy, **kw): self.d.rounded_rectangle(self._c(xy), **self._k(kw))
    def ellipse(self, xy, **kw): self.d.ellipse(self._c(xy), **self._k(kw))
    def polygon(self, xy, **kw): self.d.polygon(self._c(xy), **self._k(kw))
    def line(self, xy, **kw): self.d.line(self._c(xy), **self._k(kw))
    def chord(self, xy, a, b, **kw): self.d.chord(self._c(xy), a, b, **self._k(kw))
    def pieslice(self, xy, a, b, **kw): self.d.pieslice(self._c(xy), a, b, **self._k(kw))
    def arc(self, xy, a, b, **kw): self.d.arc(self._c(xy), a, b, **self._k(kw))
    def point(self, xy, **kw): self.d.point(self._c(xy), **kw)
    def text(self, xy, t, **kw): self.d.text(self._c(xy), t, **self._k(kw))
GRAIN = np.random.default_rng(9).normal(0, 5, (BH, BW, 1)).astype(np.float32)
VIG = None
def finish(im):
    global VIG
    im = im.resize((BW, BH), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    if VIG is None:
        yy, xx = np.mgrid[0:BH, 0:BW]; r = np.sqrt(((xx - BW / 2) / (BW / 2)) ** 2 + ((yy - BH / 2) / (BH / 2)) ** 2)
        VIG = (1 - 0.28 * np.clip(r - 0.55, 0, 1) ** 1.4)[..., None]
    return Image.fromarray(np.clip(a * VIG + GRAIN, 0, 255).astype(np.uint8))
DAY_T, DAY_B = (92, 156, 222), (198, 228, 244)
GRASS = (112, 172, 84); GRASS_L = (140, 196, 100); GRASS_D = (80, 136, 64); DIRT = (156, 118, 82); DIRT_D = (122, 90, 62)
ROCK = (136, 132, 130); ROCK_L = (164, 160, 156); ROCK_D = (98, 94, 94)
FUR = (182, 126, 64); FUR_D = (136, 88, 42); CSKIN = (226, 176, 132); CSKIN_D = (196, 146, 106); CHAIR = (52, 34, 24)
def shadow(d, cx, y, w):
    d.ellipse([cx - w, y - w * 0.16, cx + w, y + w * 0.16], fill=(0, 0, 0, 60))
def caveman(d, cx, base, k=1.0, face="calm", club=True):
    # soft ground shadow
    d.ellipse([cx - 80 * k, base - 12 * k, cx + 80 * k, base + 12 * k], fill=lerp(GRASS_D, (40, 50, 30), 0.4))
    # legs + feet
    for sx in (-1, 1):
        d.rounded_rectangle([cx + sx * 8 * k - (12 if sx > 0 else 22) * k, base - 120 * k, cx + sx * 8 * k + (22 if sx > 0 else 12) * k, base - 8 * k], radius=int(12 * k), fill=CSKIN_D)
        d.ellipse([cx + sx * 26 * k - 30 * k, base - 22 * k, cx + sx * 26 * k + 30 * k, base + 4 * k], fill=(120, 80, 50))
    # body tunic (one shoulder) with jagged hem
    d.rounded_rectangle([cx - 62 * k, base - 280 * k, cx + 62 * k, base - 110 * k], radius=int(40 * k), fill=CSKIN)
    hem = [(cx - 66 * k, base - 230 * k), (cx + 30 * k, base - 290 * k), (cx + 66 * k, base - 260 * k), (cx + 66 * k, base - 120 * k)]
    for i_ in range(9): hem.append((cx + 66 * k - i_ * 16.5 * k, base - (100 if i_ % 2 else 124) * k))
    d.polygon(hem, fill=FUR)
    for (ox, oy) in ((-30, -190), (20, -230), (30, -160), (-10, -140), (40, -200)): d.ellipse([cx + (ox - 10) * k, base + (oy - 7) * k, cx + (ox + 10) * k, base + (oy + 7) * k], fill=FUR_D)
    # arms
    d.rounded_rectangle([cx - 92 * k, base - 262 * k, cx - 56 * k, base - 150 * k], radius=int(18 * k), fill=CSKIN)
    d.rounded_rectangle([cx + 56 * k, base - 262 * k, cx + 92 * k, base - 150 * k], radius=int(18 * k), fill=CSKIN)
    if club:
        d.polygon([(cx + 70 * k, base - 150 * k), (cx + 86 * k, base - 156 * k), (cx + 120 * k, base - 330 * k), (cx + 150 * k, base - 330 * k), (cx + 150 * k, base - 290 * k)], fill=(120, 80, 46))
        d.ellipse([cx + 104 * k, base - 360 * k, cx + 162 * k, base - 280 * k], fill=(132, 88, 50))
    d.ellipse([cx - 98 * k, base - 166 * k, cx - 62 * k, base - 132 * k], fill=CSKIN); d.ellipse([cx + 62 * k, base - 166 * k, cx + 98 * k, base - 132 * k], fill=CSKIN)
    # head: wild hair behind, face, beard, brow
    hy = base - 300 * k
    for (ox, oy, r_) in ((-50, -70, 42), (0, -92, 46), (50, -70, 42), (-62, -20, 34), (62, -20, 34)):
        d.ellipse([cx + (ox - r_) * k, hy + (oy - r_) * k, cx + (ox + r_) * k, hy + (oy + r_) * k], fill=CHAIR)
    d.ellipse([cx - 58 * k, hy - 120 * k, cx + 58 * k, hy + 6 * k], fill=CSKIN)
    d.ellipse([cx - 66 * k, hy - 64 * k, cx - 46 * k, hy - 34 * k], fill=CSKIN_D); d.ellipse([cx + 46 * k, hy - 64 * k, cx + 66 * k, hy - 34 * k], fill=CSKIN_D)
    d.chord([cx - 56 * k, hy - 60 * k, cx + 56 * k, hy + 40 * k], 0, 180, fill=CHAIR)
    d.rounded_rectangle([cx - 44 * k, hy - 86 * k, cx + 44 * k, hy - 72 * k], radius=int(7 * k), fill=CHAIR)
    for ex in (-20, 20):
        d.ellipse([cx + (ex - 11) * k, hy - 70 * k, cx + (ex + 11) * k, hy - 46 * k], fill=(255, 255, 255))
        d.ellipse([cx + (ex - 5) * k, hy - 64 * k, cx + (ex + 5) * k, hy - 52 * k], fill=(30, 22, 20))
    d.ellipse([cx - 12 * k, hy - 50 * k, cx + 12 * k, hy - 30 * k], fill=CSKIN_D)
    if face == "scared": d.ellipse([cx - 12 * k, hy - 22 * k, cx + 12 * k, hy + 6 * k], fill=(90, 30, 30))
    elif face == "smile": d.chord([cx - 22 * k, hy - 30 * k, cx + 22 * k, hy - 2 * k], 0, 180, fill=(250, 250, 250))
    else: d.line([(cx - 14 * k, hy - 16 * k), (cx + 14 * k, hy - 16 * k)], fill=(90, 40, 30), width=max(3, int(5 * k)))
def steak(d, x, y, k=1.0, bad=False):
    col, fat = ((126, 146, 72), (170, 180, 110)) if bad else ((200, 64, 66), (246, 222, 204))
    d.ellipse([x - 54 * k, y - 32 * k, x + 54 * k, y + 32 * k], fill=lerp(col, (0, 0, 0), 0.25)); d.ellipse([x - 50 * k, y - 34 * k, x + 50 * k, y + 26 * k], fill=col)
    d.ellipse([x - 30 * k, y - 18 * k, x + 18 * k, y + 10 * k], fill=fat)
    d.rounded_rectangle([x + 40 * k, y - 7 * k, x + 92 * k, y + 7 * k], radius=int(7 * k), fill=(244, 238, 222))
    for oy in (-9, 9): d.ellipse([x + 82 * k, y + (oy - 10) * k, x + 104 * k, y + (oy + 10) * k], fill=(244, 238, 222))
    if bad:
        for i, ox in enumerate((-30, 0, 30)):
            pts = [(x + ox * k + 10 * math.sin(j * 1.2 + i) * k, y - 44 * k - j * 16 * k) for j in range(8)]
            d.line(pts, fill=(120, 210, 70), width=max(4, int(6 * k)))
        for fx_ in (-40, 30): d.ellipse([x + fx_ * k - 6, y - 90 * k - 6, x + fx_ * k + 6, y - 90 * k + 6], fill=(30, 30, 30))
def day_base(winter=False):
    im = grad(BW * SS, BH * SS, (150, 172, 200) if winter else DAY_T, (220, 228, 238) if winter else DAY_B); d = SD(im)
    sx, sy = BW * 0.8, BH * 0.1
    for r_, a_ in ((120, 0.15), (90, 0.3), (60, 1.0)): d.ellipse([sx - r_, sy - r_, sx + r_, sy + r_], fill=lerp((200, 228, 244), (255, 240, 170), a_))
    for cx_, cy_, sc_ in ((0.18, 0.12, 1.0), (0.52, 0.2, 0.8)):
        for dx, dy, rr in ((-60, 8, 46), (0, -10, 60), (60, 8, 46)): d.ellipse([BW * cx_ + (dx - rr) * sc_, BH * cy_ + (dy - rr * 0.7) * sc_, BW * cx_ + (dx + rr) * sc_, BH * cy_ + (dy + rr * 0.7) * sc_], fill=(252, 253, 255))
    far = (176, 196, 214) if winter else (130, 170, 150); mid = (210, 220, 232) if winter else (104, 152, 96)
    d.polygon([(0, BH * 0.56), (BW * 0.2, BH * 0.46), (BW * 0.42, BH * 0.54), (BW * 0.66, BH * 0.44), (BW, BH * 0.52), (BW, BH * 0.64), (0, BH * 0.64)], fill=far)
    d.polygon([(0, BH * 0.62), (BW * 0.3, BH * 0.56), (BW * 0.7, BH * 0.6), (BW, BH * 0.57), (BW, BH * 0.66), (0, BH * 0.66)], fill=mid)
    gtop, gbot = ((236, 240, 248), (206, 214, 230)) if winter else (GRASS_L, GRASS_D)
    g = grad(BW * SS, int(BH * 0.4 * SS), gtop, gbot); im.paste(g, (0, int(BH * 0.62 * SS)))
    r = random.Random(1)
    if not winter:
        for _ in range(60):
            x, y = r.random() * BW, BH * (0.64 + r.random() * 0.34)
            d.polygon([(x, y), (x + 5, y - 16), (x + 8, y), (x + 12, y - 12), (x + 14, y)], fill=GRASS_D)
    for _ in range(5):
        x, y = r.random() * BW, BH * (0.7 + r.random() * 0.25); w_ = 20 + r.random() * 30
        d.ellipse([x - w_, y - w_ * 0.6, x + w_, y + w_ * 0.4], fill=(200, 206, 216) if winter else ROCK_D); d.ellipse([x - w_ * 0.8, y - w_ * 0.6, x + w_ * 0.6, y + w_ * 0.1], fill=(226, 230, 238) if winter else ROCK_L)
    return im, d
def pines(d, y, seed=3, n=6, col=(46, 104, 66), snow=False):
    r = random.Random(seed)
    for _ in range(n):
        x = r.random() * BW; s_ = 46 + r.random() * 46
        d.rectangle([x - 5, y - 10, x + 5, y + 6], fill=(90, 60, 40))
        for t_ in range(3):
            yy = y - t_ * s_ * 0.7; ww = s_ * (0.75 - t_ * 0.18)
            d.polygon([(x, yy - s_ * 1.1), (x - ww, yy), (x + ww, yy)], fill=lerp(col, (0, 0, 0), 0.15 * (t_ % 2)))
            if snow: d.polygon([(x, yy - s_ * 1.1), (x - ww * 0.4, yy - s_ * 0.66), (x + ww * 0.4, yy - s_ * 0.66)], fill=SNOW)
def bg_cave(p):
    im, d = day_base(); pines(d, BH * 0.63, 3, 5)
    d.ellipse([-BW * 0.25, BH * 0.28, BW * 0.95, BH * 0.95], fill=ROCK); d.ellipse([-BW * 0.15, BH * 0.3, BW * 0.5, BH * 0.62], fill=ROCK_L); d.ellipse([BW * 0.45, BH * 0.5, BW * 0.9, BH * 0.8], fill=ROCK_D)
    d.chord([BW * 0.1, BH * 0.44, BW * 0.52, BH * 0.9], 180, 360, fill=(30, 24, 26)); d.chord([BW * 0.14, BH * 0.48, BW * 0.48, BH * 0.86], 180, 360, fill=(12, 10, 12))
    d.rectangle([0, BH * 0.66, BW, BH], fill=GRASS); d.polygon([(0, BH * 0.74), (BW, BH * 0.7), (BW, BH), (0, BH)], fill=DIRT); d.polygon([(0, BH * 0.8), (BW, BH * 0.78), (BW, BH), (0, BH)], fill=DIRT_D)
    caveman(d, BW * 0.62, BH * 0.88, 1.05, p.get("face", "calm"))
    if p.get("steak"): steak(d, BW * 0.24, BH * 0.84, 1.3, bad=p.get("bad", False))
    return finish(im)
def bg_river(p):
    im, d = day_base(); pines(d, BH * 0.63, 5, 7)
    d.polygon([(0, BH * 0.66), (BW, BH * 0.62), (BW, BH * 0.82), (0, BH * 0.88)], fill=(52, 120, 186)); d.polygon([(0, BH * 0.68), (BW, BH * 0.64), (BW, BH * 0.72), (0, BH * 0.76)], fill=(84, 156, 214))
    for i in range(12): x = (i * 97) % BW; y = BH * (0.7 + (i % 4) * 0.035); d.rounded_rectangle([x, y, x + 60, y + 6], radius=3, fill=(210, 236, 250))
    d.polygon([(0, BH * 0.86), (BW, BH * 0.8), (BW, BH * 0.84), (0, BH * 0.9)], fill=DIRT)
    caveman(d, BW * 0.74, BH * 0.98, 1.0, p.get("face", "calm"), club=False)
    d.line([(BW * 0.64, BH * 0.76), (BW * 0.4, BH * 0.73)], fill=(110, 82, 50), width=6)
    steak(d, BW * 0.32, BH * 0.74, 1.0)
    if p.get("fish"):
        fx, fy = BW * 0.36, BH * 0.68
        d.ellipse([fx - 70, fy - 30, fx + 70, fy + 30], fill=(124, 146, 170)); d.ellipse([fx - 60, fy - 10, fx + 60, fy + 26], fill=(196, 210, 222))
        d.polygon([(fx + 60, fy), (fx + 112, fy - 38), (fx + 112, fy + 38)], fill=(124, 146, 170))
        d.ellipse([fx - 50, fy - 14, fx - 34, fy + 2], fill=(255, 255, 255)); d.ellipse([fx - 46, fy - 10, fx - 38, fy - 2], fill=(20, 20, 20))
        d.chord([fx - 78, fy - 2, fx - 40, fy + 26], 0, 180, fill=(90, 30, 30))
        for dx in (-90, 130): d.ellipse([fx + dx - 8, fy + 30, fx + dx + 8, fy + 46], fill=(210, 236, 250))
    return finish(im)
def bg_snowfield(p):
    if p.get("summer"):
        im, d = day_base(); pines(d, BH * 0.63, 7, 7)
        d.ellipse([BW * 0.08, BH * 0.74, BW * 0.52, BH * 0.84], fill=(96, 150, 200)); d.ellipse([BW * 0.12, BH * 0.75, BW * 0.48, BH * 0.81], fill=(130, 180, 220))
        steak(d, BW * 0.3, BH * 0.77, 1.1, bad=True)
        for x in (0.1, 0.5): d.text((BW * x, BH * 0.4), "~", font=ImageFont.truetype(FONT, 80), fill=(255, 220, 140))
    else:
        im, d = day_base(winter=True); pines(d, BH * 0.63, 7, 7, (44, 90, 76), True)
        d.ellipse([BW * 0.06, BH * 0.64, BW * 0.54, BH * 0.86], fill=(206, 214, 230)); d.ellipse([BW * 0.08, BH * 0.62, BW * 0.52, BH * 0.82], fill=(246, 248, 252))
        d.rounded_rectangle([BW * 0.285, BH * 0.56, BW * 0.315, BH * 0.66], radius=8, fill=(244, 238, 222)); d.ellipse([BW * 0.27, BH * 0.54, BW * 0.33, BH * 0.58], fill=(244, 238, 222))
    caveman(d, BW * 0.72, BH * 0.9, 1.0, p.get("face", "calm"))
    return finish(im)
def bg_cellar(p):
    im, d = day_base(); pines(d, BH * 0.34, 2, 6)
    d.rectangle([0, BH * 0.34, BW, BH * 0.39], fill=GRASS)
    g = grad(BW * SS, int(BH * 0.62 * SS), (140, 104, 70), (86, 62, 44)); im.paste(g, (0, int(BH * 0.39 * SS)))
    r = random.Random(3)
    for _ in range(30): x, y = r.random() * BW, BH * (0.42 + r.random() * 0.55); w_ = 6 + r.random() * 14; d.ellipse([x - w_, y - w_ * 0.6, x + w_, y + w_ * 0.6], fill=(110, 80, 56))
    d.rounded_rectangle([BW * 0.2, BH * 0.39, BW * 0.8, BH * 0.88], radius=30, fill=(54, 40, 32)); d.rectangle([BW * 0.2, BH * 0.39, BW * 0.8, BH * 0.45], fill=(54, 40, 32))
    for y in np.arange(BH * 0.42, BH * 0.86, 46): d.rounded_rectangle([BW * 0.25, y, BW * 0.37, y + 9], radius=4, fill=(176, 134, 84))
    for x in (0.25, 0.36): d.rounded_rectangle([BW * x, BH * 0.38, BW * x + 10, BH * 0.87], radius=5, fill=(160, 120, 76))
    d.rounded_rectangle([BW * 0.5, BH * 0.8, BW * 0.76, BH * 0.86], radius=8, fill=(100, 76, 54)); steak(d, BW * 0.6, BH * 0.78, 1.0)
    caveman(d, BW * 0.66, BH * 0.35, 0.62, p.get("face", "calm"))
    d.rounded_rectangle([BW * 0.8, BH * 0.58, BW * 0.96, BH * 0.64], radius=14, fill=(40, 30, 24)); d.text((BW * 0.88, BH * 0.61), "-3 m", font=ImageFont.truetype(FONT, 32), fill=(240, 230, 210), anchor="mm")
    return finish(im)
def bg_icehouse(p):
    im, d = day_base(winter=True); pines(d, BH * 0.63, 9, 6, (44, 90, 76), True)
    x0, x1, y0, y1 = BW * 0.08, BW * 0.92, BH * 0.36, BH * 0.86
    d.polygon([(x0 - 40, y0 + 6), ((x0 + x1) / 2, BH * 0.2), (x1 + 40, y0 + 6)], fill=(96, 64, 42)); d.polygon([(x0 - 40, y0 + 6), ((x0 + x1) / 2, BH * 0.2), (x0 + 40, y0 + 6)], fill=SNOW)
    d.rectangle([x0, y0, x1, y1], fill=(140, 100, 64))
    for y in np.arange(y0, y1, 40): d.line([(x0, y), (x1, y)], fill=(120, 84, 54), width=3)
    d.rounded_rectangle([x0 + 24, y0 + 24, x1 - 24, y1 - 10], radius=12, fill=(222, 184, 126))
    r = random.Random(4)
    for _ in range(500): x = r.uniform(x0 + 30, x1 - 30); y = r.uniform(y0 + 30, y1 - 16); d.ellipse([x - 2, y - 1, x + 2, y + 1], fill=(176, 136, 84))
    for r_ in range(4):
        for c_ in range(4):
            bx = x0 + 64 + c_ * 142; by = y0 + 62 + r_ * 102
            d.rounded_rectangle([bx, by, bx + 122, by + 82], radius=10, fill=(176, 214, 238)); d.rounded_rectangle([bx + 6, by + 6, bx + 116, by + 70], radius=8, fill=(206, 232, 248))
            d.line([(bx + 16, by + 16), (bx + 50, by + 16)], fill=(255, 255, 255), width=5)
    caveman(d, BW * 0.82, BH * 0.99, 0.82, p.get("face", "smile"))
    return finish(im)
def clay_pot(d, cx, y, w, h, col=(190, 110, 70)):
    d.polygon([(cx - w * 0.5, y), (cx + w * 0.5, y), (cx + w * 0.38, y + h), (cx - w * 0.38, y + h)], fill=col)
    d.polygon([(cx + w * 0.2, y), (cx + w * 0.5, y), (cx + w * 0.38, y + h), (cx + w * 0.14, y + h)], fill=lerp(col, (0, 0, 0), 0.15))
    for t_ in (0.3, 0.6): d.line([(cx - w * (0.5 - 0.12 * t_), y + h * t_), (cx + w * (0.5 - 0.12 * t_), y + h * t_)], fill=lerp(col, (255, 255, 255), 0.18), width=5)
    d.ellipse([cx - w * 0.52, y - h * 0.08, cx + w * 0.52, y + h * 0.08], fill=lerp(col, (0, 0, 0), 0.3))
def bg_pots(p):
    im, d = day_base(); pines(d, BH * 0.63, 11, 4)
    d.rounded_rectangle([BW * 0.08, BH * 0.3, BW * 0.12, BH * 0.74], radius=8, fill=(110, 76, 50)); d.rounded_rectangle([BW * 0.6, BH * 0.3, BW * 0.64, BH * 0.74], radius=8, fill=(110, 76, 50))
    for i in range(9): d.polygon([(BW * (0.02 + i * 0.075), BH * 0.32), (BW * (0.06 + i * 0.075), BH * 0.22), (BW * (0.1 + i * 0.075), BH * 0.32)], fill=(196, 170, 90) if i % 2 else (176, 150, 76))
    d.polygon([(BW * 0.02, BH * 0.74), (BW * 0.7, BH * 0.74), (BW * 0.9, BH * 0.86), (BW * 0.02, BH * 0.86)], fill=(90, 140, 70))
    cx = BW * 0.36
    clay_pot(d, cx, BH * 0.5, 330, 230, (164, 92, 58) if p.get("wet") else (204, 124, 78))
    if p.get("inner"):
        d.ellipse([cx - 160, BH * 0.5 - 18, cx + 160, BH * 0.5 + 18], fill=(206, 184, 134)); clay_pot(d, cx, BH * 0.47, 210, 200, (218, 140, 88)); steak(d, cx - 20, BH * 0.45, 0.7)
    if p.get("wet"):
        for i in range(5): x_ = cx - 130 + i * 62; d.ellipse([x_ - 6, BH * 0.62 + (i % 2) * 30, x_ + 6, BH * 0.62 + (i % 2) * 30 + 16], fill=(170, 210, 240))
        for i in range(4): x_ = cx - 100 + i * 66; d.arc([x_ - 20, BH * 0.38, x_ + 20, BH * 0.44], 180, 360, fill=(240, 246, 252), width=4)
    caveman(d, BW * 0.8, BH * 0.93, 0.95, p.get("face", "calm"))
    return finish(im)
def bg_fridge(p):
    im, d = day_base(); pines(d, BH * 0.63, 13, 5)
    d.rounded_rectangle([BW * 0.1, BH * 0.3, BW * 0.5, BH * 0.86], radius=30, fill=(206, 212, 222)); d.rounded_rectangle([BW * 0.1, BH * 0.3, BW * 0.48, BH * 0.85], radius=30, fill=(246, 248, 252))
    d.line([(BW * 0.1, BH * 0.5), (BW * 0.48, BH * 0.5)], fill=(196, 202, 212), width=6)
    d.rounded_rectangle([BW * 0.42, BH * 0.35, BW * 0.445, BH * 0.46], radius=6, fill=(160, 166, 178)); d.rounded_rectangle([BW * 0.42, BH * 0.54, BW * 0.445, BH * 0.7], radius=6, fill=(160, 166, 178))
    for i in range(3): d.ellipse([BW * 0.52 + i * 18, BH * (0.3 + i * 0.04), BW * 0.52 + i * 18 + 14, BH * (0.3 + i * 0.04) + 14], fill=(255, 236, 140))
    if p.get("queue"):
        for x in (0.6, 0.74, 0.88): caveman(d, BW * x, BH * 0.92, 0.66, "smile", club=False); steak(d, BW * x - 8, BH * 0.68, 0.55)
    else:
        caveman(d, BW * 0.74, BH * 0.92, 1.0, "smile")
    return finish(im)
BG.update({"cave": bg_cave, "river": bg_river, "snowfield": bg_snowfield, "cellar": bg_cellar, "icehouse": bg_icehouse, "pots": bg_pots, "fridge": bg_fridge})


# ---------------- kitchen / how-it-works set (supersampled, animated overlays) ----------------
SHIRT_M = (66, 118, 196); PANTS_M = (52, 58, 78); HAIR_M = (60, 40, 28)
def guy(d, cx, base, k=1.0, face="calm"):
    d.ellipse([cx - 80 * k, base - 12 * k, cx + 80 * k, base + 12 * k], fill=(0, 0, 0))
    for sx in (-1, 1):
        d.rounded_rectangle([cx + sx * 6 * k - (16 if sx > 0 else 24) * k, base - 140 * k, cx + sx * 6 * k + (24 if sx > 0 else 16) * k, base - 8 * k], radius=int(12 * k), fill=PANTS_M)
        d.rounded_rectangle([cx + sx * 24 * k - 30 * k, base - 22 * k, cx + sx * 24 * k + 30 * k, base + 4 * k], radius=int(10 * k), fill=(240, 240, 244))
    d.rounded_rectangle([cx - 64 * k, base - 300 * k, cx + 64 * k, base - 120 * k], radius=int(40 * k), fill=SHIRT_M)
    d.rounded_rectangle([cx - 64 * k, base - 160 * k, cx + 64 * k, base - 120 * k], radius=int(14 * k), fill=lerp(SHIRT_M, (0, 0, 0), 0.15))
    for sx in (-1, 1):
        d.rounded_rectangle([cx + sx * 78 * k - 18 * k, base - 286 * k, cx + sx * 78 * k + 18 * k, base - 160 * k], radius=int(18 * k), fill=SHIRT_M)
        d.ellipse([cx + sx * 78 * k - 18 * k, base - 176 * k, cx + sx * 78 * k + 18 * k, base - 140 * k], fill=CSKIN)
    hy = base - 318 * k
    d.rounded_rectangle([cx - 14 * k, hy - 4 * k, cx + 14 * k, hy + 22 * k], radius=6, fill=CSKIN_D)
    d.ellipse([cx - 56 * k, hy - 116 * k, cx + 56 * k, hy + 4 * k], fill=CSKIN)
    d.ellipse([cx - 64 * k, hy - 66 * k, cx - 46 * k, hy - 38 * k], fill=CSKIN_D); d.ellipse([cx + 46 * k, hy - 66 * k, cx + 64 * k, hy - 38 * k], fill=CSKIN_D)
    d.chord([cx - 60 * k, hy - 132 * k, cx + 60 * k, hy - 40 * k], 180, 360, fill=HAIR_M); d.ellipse([cx - 40 * k, hy - 130 * k, cx + 70 * k, hy - 80 * k], fill=HAIR_M)
    for ex in (-20, 20):
        d.ellipse([cx + (ex - 10) * k, hy - 70 * k, cx + (ex + 10) * k, hy - 48 * k], fill=(255, 255, 255)); d.ellipse([cx + (ex - 5) * k, hy - 65 * k, cx + (ex + 5) * k, hy - 53 * k], fill=(30, 22, 20))
        d.line([(cx + (ex - 12) * k, hy - 80 * k), (cx + (ex + 12) * k, hy - (78 if face != "scared" else 86) * k)], fill=HAIR_M, width=max(3, int(5 * k)))
    if face == "scared": d.ellipse([cx - 12 * k, hy - 34 * k, cx + 12 * k, hy - 8 * k], fill=(90, 30, 30))
    elif face == "smile": d.chord([cx - 22 * k, hy - 40 * k, cx + 22 * k, hy - 12 * k], 0, 180, fill=(250, 250, 250))
    else: d.arc([cx - 16 * k, hy - 40 * k, cx + 16 * k, hy - 22 * k], 20, 160, fill=(120, 50, 40), width=max(3, int(4 * k)))
def kitchen_base():
    im = Image.new("RGB", (BW * SS, BH * SS), (238, 226, 206)); d = SD(im)
    for y in np.arange(BH * 0.36, BH * 0.62, 46):
        for x in np.arange(0, BW, 60): d.rectangle([x + 2, y + 2, x + 58, y + 44], fill=(246, 240, 228))
    d.rounded_rectangle([BW * 0.02, BH * 0.08, BW * 0.98, BH * 0.32], radius=10, fill=(150, 104, 70))
    for x in np.arange(BW * 0.04, BW * 0.96, BW * 0.235): d.rounded_rectangle([x, BH * 0.1, x + BW * 0.215, BH * 0.3], radius=8, fill=(172, 124, 86)); d.rounded_rectangle([x + BW * 0.09, BH * 0.25, x + BW * 0.125, BH * 0.265], radius=4, fill=(220, 210, 196))
    d.rectangle([0, BH * 0.62, BW, BH * 0.65], fill=(70, 74, 86)); d.rectangle([0, BH * 0.65, BW, BH * 0.86], fill=(150, 104, 70))
    for x in np.arange(BW * 0.03, BW, BW * 0.24): d.rounded_rectangle([x, BH * 0.67, x + BW * 0.22, BH * 0.84], radius=8, fill=(172, 124, 86))
    g = grad(BW * SS, int(BH * 0.14 * SS), (196, 176, 150), (170, 150, 126)); im.paste(g, (0, int(BH * 0.86 * SS)))
    return im, d
def microwave(d, x, y, w, h, door_open=False, on=False, mesh=True, plate_angle=0.0, food=True):
    d.rounded_rectangle([x, y, x + w, y + h], radius=18, fill=(60, 64, 74)); d.rounded_rectangle([x + 8, y + 8, x + w - 8, y + h - 8], radius=14, fill=(84, 90, 102))
    wx0, wy0, wx1, wy1 = x + 26, y + 26, x + w * 0.7, y + h - 26
    d.rounded_rectangle([wx0, wy0, wx1, wy1], radius=10, fill=(250, 210, 120) if on else (34, 36, 44))
    if food: d.ellipse([(wx0 + wx1) / 2 - 60, wy1 - 50, (wx0 + wx1) / 2 + 60, wy1 - 18], fill=(230, 230, 236)); d.ellipse([(wx0 + wx1) / 2 - 40, wy1 - 66, (wx0 + wx1) / 2 + 40, wy1 - 30], fill=(214, 120, 60))
    if mesh:
        for yy in np.arange(wy0 + 6, wy1, 12):
            for xx in np.arange(wx0 + 6, wx1, 12): d.ellipse([xx - 2, yy - 2, xx + 2, yy + 2], fill=(20, 20, 24) if not on else (190, 150, 80))
    d.rounded_rectangle([x + w * 0.75, y + 30, x + w - 24, y + 80], radius=8, fill=(20, 30, 24)); d.text((x + w * 0.75 + (w * 0.25 - 24) / 2, y + 55), "2:00" if on else "0:00", font=ImageFont.truetype(FONT, 28), fill=(120, 255, 140), anchor="mm")
    for i in range(3):
        for j in range(3): d.rounded_rectangle([x + w * 0.77 + j * 34, y + 100 + i * 34, x + w * 0.77 + j * 34 + 26, y + 100 + i * 34 + 26], radius=6, fill=(110, 116, 128))
def bg_kitchen(p):
    im, d = kitchen_base()
    if p.get("microwave", True): microwave(d, BW * 0.08, BH * 0.44, BW * 0.5, BH * 0.18, on=p.get("on", False))
    guy(d, BW * 0.76, BH * 0.95, 1.05, p.get("face", "calm"))
    if p.get("pizza"):
        d.ellipse([BW * 0.5, BH * 0.585, BW * 0.66, BH * 0.62], fill=(236, 236, 240)); d.polygon([(BW * 0.52, BH * 0.6), (BW * 0.64, BH * 0.59), (BW * 0.58, BH * 0.57)], fill=(230, 170, 70))
        for i in range(3): d.text((BW * (0.5 + i * 0.05), BH * 0.52), "*", font=ImageFont.truetype(FONT, 50), fill=(160, 210, 250))
    return finish(im)
BLUE_T, BLUE_B = (18, 40, 78), (10, 22, 48)
def blueprint():
    im = grad(BW * SS, BH * SS, BLUE_T, BLUE_B); d = SD(im)
    for x in np.arange(0, BW, 40): d.line([(x, 0), (x, BH)], fill=(30, 58, 104), width=1)
    for y in np.arange(0, BH, 40): d.line([(0, y), (BW, y)], fill=(30, 58, 104), width=1)
    return im, d
def bg_molecules(p): im, d = blueprint(); return finish(im)
def bg_magnetron(p):
    im, d = blueprint(); cx, cy = BW * 0.3, BH * 0.62
    d.ellipse([cx - 110, cy - 110, cx + 110, cy + 110], fill=(180, 186, 196)); d.ellipse([cx - 70, cy - 70, cx + 70, cy + 70], fill=(120, 126, 140))
    for a_ in range(8): ang = a_ * math.pi / 4; d.ellipse([cx + 52 * math.cos(ang) - 12, cy + 52 * math.sin(ang) - 12, cx + 52 * math.cos(ang) + 12, cy + 52 * math.sin(ang) + 12], fill=(40, 44, 56))
    d.ellipse([cx - 18, cy - 18, cx + 18, cy + 18], fill=(255, 150, 80))
    for sx in (-1, 1): d.rounded_rectangle([cx + sx * 130 - 26, cy - 120, cx + sx * 130 + 26, cy + 120], radius=10, fill=(200, 60, 60) if sx < 0 else (60, 90, 200))
    d.rounded_rectangle([cx + 100, cy - 20, BW * 0.62, cy + 20], radius=8, fill=(180, 186, 196))
    d.text((cx, cy + 170), "MAGNETRON", font=ImageFont.truetype(FONT, 40), fill=(230, 240, 255), anchor="mm")
    return finish(im)
def bg_box(p):
    im, d = blueprint(); x0, y0, x1, y1 = BW * 0.1, BH * 0.44, BW * 0.9, BH * 0.84
    d.rounded_rectangle([x0, y0, x1, y1], radius=20, outline=(200, 210, 226), width=14)
    d.ellipse([BW * 0.36, y1 - 70, BW * 0.64, y1 - 30], fill=(230, 230, 236)); d.ellipse([BW * 0.42, y1 - 90, BW * 0.58, y1 - 50], fill=(214, 120, 60))
    if p.get("hotspots"):
        for (hx, hy_, c_) in ((0.3, 0.55, (255, 90, 60)), (0.7, 0.55, (90, 160, 255)), (0.5, 0.66, (255, 90, 60)), (0.3, 0.76, (90, 160, 255)), (0.7, 0.76, (255, 90, 60))):
            d.ellipse([BW * hx - 50, BH * hy_ - 50, BW * hx + 50, BH * hy_ + 50], fill=lerp(BLUE_T, c_, 0.7))
        d.ellipse([BW * 0.36, y1 - 70, BW * 0.64, y1 - 30], fill=(230, 230, 236)); d.ellipse([BW * 0.42, y1 - 90, BW * 0.58, y1 - 50], fill=(214, 120, 60))
    return finish(im)
def bg_mwdoor(p):
    im, d = blueprint()
    microwave(d, BW * 0.06, BH * 0.42, BW * 0.88, BH * 0.32, on=True, mesh=True)
    d.ellipse([BW * 0.3 - 110, BH * 0.58 - 110, BW * 0.3 + 110, BH * 0.58 + 110], outline=(255, 255, 255), width=8)
    return finish(im)
def bg_spencer(p):
    im = grad(BW * SS, BH * SS, (60, 66, 70), (36, 40, 44)); d = SD(im)
    d.rounded_rectangle([BW * 0.06, BH * 0.4, BW * 0.5, BH * 0.7], radius=12, fill=(110, 116, 110)); d.ellipse([BW * 0.16, BH * 0.46, BW * 0.36, BH * 0.62], fill=(160, 166, 160))
    d.text((BW * 0.28, BH * 0.74), "RADAR LAB, 1945", font=ImageFont.truetype(FONT, 30), fill=(220, 220, 210), anchor="mm")
    guy(d, BW * 0.72, BH * 0.95, 1.05, "scared")
    d.rounded_rectangle([BW * 0.72 - 70, BH * 0.8, BW * 0.72 - 10, BH * 0.85], radius=10, fill=(110, 64, 36)); d.ellipse([BW * 0.72 - 80, BH * 0.84, BW * 0.72 - 40, BH * 0.87], fill=(110, 64, 36))
    return finish(im)
BG.update({"kitchen": bg_kitchen, "molecules": bg_molecules, "magnetron": bg_magnetron, "box": bg_box, "mwdoor": bg_mwdoor, "spencer": bg_spencer})

# per-frame animated overlays (drawn at 1x on top of the background)
def water(d, x, y, ang, s=1.0):
    ca, sa = math.cos(ang), math.sin(ang)
    for hx, hy in ((-34, 26), (34, 26)):
        px, py = x + (hx * ca - hy * sa) * s, y + (hx * sa + hy * ca) * s
        d.line([(x, y), (px, py)], fill=(220, 230, 240), width=int(8 * s)); d.ellipse([px - 16 * s, py - 16 * s, px + 16 * s, py + 16 * s], fill=(240, 244, 250))
        d.text((px, py), "+", font=ImageFont.truetype(FONT, int(24 * s)), fill=(200, 50, 50), anchor="mm")
    d.ellipse([x - 26 * s, y - 26 * s, x + 26 * s, y + 26 * s], fill=(220, 60, 60)); d.text((x, y - 2), "-", font=ImageFont.truetype(FONT, int(30 * s)), fill=(255, 255, 255), anchor="mm")
def anim_molecules(im, d, lt, p):
    r = random.Random(2); mode = p.get("mode", "still")
    flip = math.copysign(1, math.sin(lt * 9)) if mode != "still" else 0
    if mode != "still":
        for y in np.arange(H * 0.42, H * 0.9, 90):
            x0, x1 = (90, W - 90) if flip > 0 else (W - 90, 90)
            d.line([(x0, y), (x1, y)], fill=(255, 220, 90), width=4); d.polygon([(x1, y), (x1 - 20 * flip, y - 12), (x1 - 20 * flip, y + 12)], fill=(255, 220, 90))
    for i in range(9):
        x = W * (0.2 + (i % 3) * 0.3); y = H * (0.48 + (i // 3) * 0.14)
        base_ang = r.random() * 6.28
        ang = base_ang + lt * 0.4 if mode == "still" else (0 if flip > 0 else math.pi) + math.pi / 2 + 0.25 * math.sin(lt * 30 + i)
        water(d, x, y, ang, 0.9)
        if mode == "heat":
            for j in range(3): yy = y - 60 - ((lt * 80 + j * 30 + i * 13) % 90); d.arc([x - 20 + j * 14, yy, x + j * 14, yy + 20], 180, 360, fill=(255, 140, 80), width=3)
def anim_waves(im, d, lt, p):
    y0 = H * 0.62 if p.get("scene") == "magnetron" else H * 0.6
    xs = np.arange(W * 0.62 if p.get("scene") == "magnetron" else W * 0.12, W * 0.92, 4)
    for k in range(3):
        pts = [(x, y0 + (k - 1) * 50 + 22 * math.sin(x / 26 - lt * 9)) for x in xs]
        d.line(pts, fill=(255, 220, 90), width=4)
def anim_bounce(im, d, lt, p):
    x0, y0, x1, y1 = W * 0.13, H * 0.46, W * 0.87, H * 0.82
    for i in range(4):
        t = lt * 420 + i * 260; px = t % (2 * (x1 - x0)); py = (t * 0.73 + i * 90) % (2 * (y1 - y0))
        px = x0 + (px if px < x1 - x0 else 2 * (x1 - x0) - px); py = y0 + (py if py < y1 - y0 else 2 * (y1 - y0) - py)
        d.ellipse([px - 14, py - 14, px + 14, py + 14], fill=(255, 220, 90))
def anim_turntable(im, d, lt, p):
    cx, cy = W * 0.5, H * 0.74
    d.ellipse([cx - 170, cy - 40, cx + 170, cy + 40], fill=(210, 220, 236)); d.ellipse([cx - 150, cy - 32, cx + 150, cy + 32], fill=(236, 240, 248))
    a = lt * 2.2
    for j in range(3):
        aa = a + j * 2.09; d.ellipse([cx + 110 * math.cos(aa) - 10, cy + 26 * math.sin(aa) - 6, cx + 110 * math.cos(aa) + 10, cy + 26 * math.sin(aa) + 6], fill=(150, 160, 180))
    fx = cx + 50 * math.cos(a); fy = cy - 30 + 10 * math.sin(a)
    d.ellipse([fx - 60, fy - 24, fx + 60, fy + 24], fill=(214, 120, 60))
ANIM = {"molecules": anim_molecules, "magnetron": anim_waves, "box": lambda im, d, lt, p: (anim_bounce(im, d, lt, p) if not p.get("hotspots") else (anim_turntable(im, d, lt, p) if p.get("turntable") else None)), "mwdoor": None}

# ---------------- narration ----------------
from kokoro_onnx import Kokoro
k = Kokoro(WORK + "/tts/kokoro-v1.0.onnx", WORK + "/tts/voices-v1.0.bin")
segs, parts, t = [], [], 0.6
sr = 24000
parts.append(np.zeros(int(0.6 * sr), dtype=np.float32))
for sc in S["scenes"]:
    if sc.get("text"):
        a, sr = k.create(sc["text"], voice=S.get("voice", "am_onyx"), speed=S.get("speed", 0.92), lang="en-us")
    else:
        a = np.zeros(int(sr * sc.get("hold", 1.6)), dtype=np.float32)
    pause = sc.get("pause", 0.55)
    dur = len(a) / sr + pause
    segs.append({**sc, "start": t, "dur": dur, "speech": len(a) / sr})
    parts += [a.astype(np.float32), np.zeros(int(pause * sr), dtype=np.float32)]
    t += dur
total = t + 0.4
N = int(total * sr); tt = np.arange(N) / sr
voice = np.zeros(N); v = np.concatenate(parts); voice[:len(v)] = v[:N]
rng = np.random.default_rng(1)
wind = np.convolve(rng.standard_normal(N), np.ones(400) / 400, mode="same") * 3.0 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.08 * tt))
drone = (np.sin(2 * np.pi * 43.65 * tt) + 0.6 * np.sin(2 * np.pi * 65.4 * tt + 0.5) + 0.3 * np.sin(2 * np.pi * 92.5 * tt * (1 + 0.003 * np.sin(tt)))) * 0.06
fx = np.zeros(N)
def put(at, sig):
    i0 = int(at * sr); n = min(len(sig), N - i0)
    if n > 0: fx[i0:i0 + n] += sig[:n]
def knock():
    n = int(0.16 * sr); x = np.arange(n) / sr
    return (np.sin(2 * np.pi * 90 * x) + 0.5 * rng.standard_normal(n) * np.exp(-x * 60)) * np.exp(-x * 28) * 0.9
def buzz():
    n = int(0.9 * sr); x = np.arange(n) / sr
    return np.sin(2 * np.pi * 170 * x) * ((x % 0.3) < 0.18) * 0.18
def hit():
    n = int(2.2 * sr); x = np.arange(n) / sr
    return (np.sin(2 * np.pi * 38 * x) * 0.9 + rng.standard_normal(n) * 0.25 * np.exp(-x * 9)) * np.exp(-x * 1.6) * 0.7
for sg in segs:
    sfx = sg.get("sfx")
    if sfx is None:
        sfx = {"door": "knock", "phone": "buzz"}.get(sg["scene"], "hit" if sg.get("lights_out") else "none")
    if sfx == "knock":
        for i in range(sg.get("knocks", 3)): put(sg["start"] + 0.1 + i * 0.55, knock())
    elif sfx == "buzz": put(sg["start"], buzz())
    elif sfx == "hit": put(sg["start"] + sg.get("hit_at", 0.0), hit())
if S.get("mood") == "light":
    notes = [261.6, 329.6, 392.0, 523.3, 392.0, 329.6]; mus = np.zeros(N)
    for i, t0 in enumerate(np.arange(0, total, 0.32)):
        n = int(0.3 * sr); i0 = int(t0 * sr)
        if i0 + n >= N: break
        x = np.arange(n) / sr; f = notes[i % len(notes)] * (0.5 if (i // 12) % 2 else 1)
        mus[i0:i0 + n] += np.sin(2 * np.pi * f * x) * np.exp(-x * 9) * 0.05
    mix = voice * 1.0 + mus + fx * 0.5
else:
    mix = voice * 1.0 + drone + wind * 0.05 + fx
mix *= np.minimum(1, (total - tt) / 1.0)
mix /= max(1.0, np.abs(mix).max() / 0.95)
wav = work + "/audio.wav"; sf.write(wav, mix.astype(np.float32), sr)

# ---------------- video ----------------
CAP = ImageFont.truetype(FONT, 50); PART = ImageFont.truetype(FONT, 46); TITLE = ImageFont.truetype(FONT, 58)
def wrap(d, text, font, maxw):
    lines, cur = [], ""
    for w in text.split():
        t2 = (cur + " " + w).strip()
        if d.textlength(t2, font=font) <= maxw: cur = t2
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines
def chunks(text, n=6):
    w = text.split(); out = []
    i = 0
    while i < len(w):
        j = min(len(w), i + n)
        # prefer breaking after punctuation
        for k2 in range(j, i + 2, -1):
            if w[k2 - 1][-1] in ".,?!:;" : j = k2; break
        out.append(" ".join(w[i:j])); i = j
    return out

flakes = [[rnd.random() * W, rnd.random() * H, 1 + rnd.random() * 2.5, 20 + rnd.random() * 50] for _ in range(110)]
OUTDOOR = {"town", "sign", "street", "window", "peephole", "road", "busdoor"} if S.get("weather", "snow") == "snow" else set()
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
                       "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", OUT], stdin=subprocess.PIPE)
nfr = int(total * FPS); si = 0; cache = {}
for f in range(nfr):
    ft = f / FPS
    while si < len(segs) - 1 and ft >= segs[si + 1]["start"]: si += 1
    sg = segs[si]; lt = ft - sg["start"]; prog = min(1.0, lt / sg["dur"])
    key = si
    if sg["scene"] == "town" and sg.get("lights_out"):
        lv = 1.0 if lt < sg.get("hit_at", 0.0) else 0.0; key = (si, lv)
        if key not in cache: cache[key] = bg_town(sg, lv)
    elif sg["scene"] == "room" and sg.get("lights_out"):
        dk = 0.0 if lt < sg.get("hit_at", 0.0) else 1.0; key = (si, dk)
        if key not in cache: cache[key] = bg_room({**sg, "dark": dk})
    elif key not in cache:
        cache = {k_: v_ for k_, v_ in cache.items() if (k_ if isinstance(k_, int) else k_[0]) >= si - 1}
        cache[key] = BG[sg["scene"]](sg)
    bg = cache[key]
    z = 1.03 + 0.05 * prog + (0.06 * max(0.0, 1 - lt / 0.2) ** 2 if S.get("mood") == "light" else 0)
    cw, ch = BW / z, BH / z
    x0, y0 = (BW - cw) / 2, (BH - ch) / 2
    if sg["scene"] == "door" and sg.get("knocks"):
        for i in range(sg.get("knocks", 3)):
            dt = lt - (0.1 + i * 0.55)
            if 0 <= dt < 0.12: x0 += 10 * math.sin(dt * 120); y0 += 6 * math.cos(dt * 90)
    x0 = max(0, min(BW - cw, x0)); y0 = max(0, min(BH - ch, y0))
    im = bg.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))
    d = ImageDraw.Draw(im)
    _an = globals().get("ANIM", {}).get(sg["scene"])
    if _an: _an(im, d, lt, sg)
    if sg["scene"] in OUTDOOR or sg.get("snow"):
        for fl in flakes:
            y = (fl[1] + ft * fl[3]) % H; x = (fl[0] + 12 * math.sin(ft * 0.8 + fl[1])) % W
            d.ellipse([x, y, x + fl[2], y + fl[2]], fill=(235, 240, 250))
    if sg.get("clock"):
        d.rounded_rectangle([W / 2 - 92, 120, W / 2 + 92, 168], radius=24, fill=(20, 20, 26))
        d.ellipse([W / 2 - 76, 136, W / 2 - 60, 152], fill=(220, 50, 50))
        d.text((W / 2 + 10, 144), sg["clock"], font=ImageFont.truetype(FONT, 28), fill=(240, 240, 240), anchor="mm")
    if sg["scene"] == "store" and sg.get("flicker") and (int(ft * 7) % 9 == 0):
        im = Image.blend(im, Image.new("RGB", (W, H), (0, 0, 0)), 0.5); d = ImageDraw.Draw(im)
    # fade from black at each scene start (dread pacing)
    if lt < 0.18 and S.get("mood") != "light":
        im = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), im, lt / 0.18); d = ImageDraw.Draw(im)
    if sg["scene"] == "end":
        d.text((W / 2, H * 0.42), S.get("series", "").upper(), font=TITLE, fill=(236, 238, 246), anchor="mm")
        et = S.get("end_text") or f"PART {S.get('part', 1) + 1} TOMORROW"; fs = 46
        while fs > 24 and d.textlength(et, font=ImageFont.truetype(FONT, fs)) > W - 80: fs -= 2
        d.text((W / 2, H * 0.5), et, font=ImageFont.truetype(FONT, fs), fill=(200, 60, 60), anchor="mm")
    if sg.get("text") and lt < sg["speech"] + 0.25:
        cs = chunks(sg["text"], 4 if S.get("mood") == "light" else 6); lens = [len(c) for c in cs]; acc = 0; ci = len(cs) - 1
        for i, l in enumerate(lens):
            acc += l
            if lt <= sg["speech"] * acc / sum(lens): ci = i; break
        lines = wrap(d, cs[ci].upper(), CAP, W - 110); y = (H * 0.3 if S.get("mood") == "light" else H * 0.6) - 33 * len(lines)
        for ln in lines:
            d.text((W / 2, y), ln, font=CAP, fill=(255, 255, 255), anchor="mm", stroke_width=6, stroke_fill=(0, 0, 0)); y += 66
    if sg["scene"] != "end" and S.get("part"):
        d.text((W / 2, H * 0.85), f"Part {S.get('part', 1)}", font=PART, fill=(255, 255, 255), anchor="mm", stroke_width=4, stroke_fill=(0, 0, 0))
    ff.stdin.write(im.tobytes())
ff.stdin.close(); ff.wait()
print(f"OK {OUT} {total:.1f}s")
