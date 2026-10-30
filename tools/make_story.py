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

def person(d, cx, base, scale=1.0, face="calm", dark=0.0, turned=False):
    k = scale; sk = lerp(SKIN, (70, 66, 74), dark); sh = lerp(SHIRT, (24, 28, 40), dark); pa = lerp(PANTS, (18, 20, 28), dark)
    d.rectangle([cx - 22 * k, base - 110 * k, cx - 4 * k, base], fill=pa)
    d.rectangle([cx + 4 * k, base - 110 * k, cx + 22 * k, base], fill=pa)
    d.rounded_rectangle([cx - 38 * k, base - 260 * k, cx + 38 * k, base - 100 * k], radius=int(16 * k), fill=sh)
    d.rectangle([cx - 52 * k, base - 250 * k, cx - 38 * k, base - 140 * k], fill=sh)
    d.rectangle([cx + 38 * k, base - 250 * k, cx + 52 * k, base - 140 * k], fill=sh)
    d.ellipse([cx - 52 * k, base - 150 * k, cx - 38 * k, base - 132 * k], fill=sk)
    d.ellipse([cx + 38 * k, base - 150 * k, cx + 52 * k, base - 132 * k], fill=sk)
    hy = base - 330 * k
    d.ellipse([cx - 40 * k, hy, cx + 40 * k, hy + 84 * k], fill=sk)
    d.chord([cx - 42 * k, hy - 6 * k, cx + 42 * k, hy + 60 * k], 180, 360, fill=HAIR)
    if not turned:
        ey = hy + 40 * k
        for ex in (-14, 14):
            d.ellipse([cx + (ex - 4) * k, ey - 4 * k, cx + (ex + 4) * k, ey + 4 * k], fill=(30, 26, 26))
        if face == "scared":
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
OUTDOOR = {"town", "sign", "street", "window", "peephole"}
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
    z = 1.03 + 0.05 * prog
    cw, ch = BW / z, BH / z
    x0, y0 = (BW - cw) / 2, (BH - ch) / 2
    if sg["scene"] == "door" and sg.get("knocks"):
        for i in range(sg.get("knocks", 3)):
            dt = lt - (0.1 + i * 0.55)
            if 0 <= dt < 0.12: x0 += 10 * math.sin(dt * 120); y0 += 6 * math.cos(dt * 90)
    x0 = max(0, min(BW - cw, x0)); y0 = max(0, min(BH - ch, y0))
    im = bg.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))
    d = ImageDraw.Draw(im)
    if sg["scene"] in OUTDOOR or sg.get("snow"):
        for fl in flakes:
            y = (fl[1] + ft * fl[3]) % H; x = (fl[0] + 12 * math.sin(ft * 0.8 + fl[1])) % W
            d.ellipse([x, y, x + fl[2], y + fl[2]], fill=(235, 240, 250))
    if sg.get("clock"):
        d.rounded_rectangle([W / 2 - 92, 120, W / 2 + 92, 168], radius=24, fill=(20, 20, 26))
        d.ellipse([W / 2 - 76, 136, W / 2 - 60, 152], fill=(220, 50, 50))
        d.text((W / 2 + 10, 144), sg["clock"], font=ImageFont.truetype(FONT, 28), fill=(240, 240, 240), anchor="mm")
    # fade from black at each scene start (dread pacing)
    if lt < 0.18:
        im = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), im, lt / 0.18); d = ImageDraw.Draw(im)
    if sg["scene"] == "end":
        d.text((W / 2, H * 0.42), S.get("series", "").upper(), font=TITLE, fill=(236, 238, 246), anchor="mm")
        d.text((W / 2, H * 0.5), f"PART {S.get('part', 1) + 1} TOMORROW", font=PART, fill=(200, 60, 60), anchor="mm")
    if sg.get("text") and lt < sg["speech"] + 0.25:
        cs = chunks(sg["text"]); lens = [len(c) for c in cs]; acc = 0; ci = len(cs) - 1
        for i, l in enumerate(lens):
            acc += l
            if lt <= sg["speech"] * acc / sum(lens): ci = i; break
        lines = wrap(d, cs[ci].upper(), CAP, W - 110); y = H * 0.6 - 33 * len(lines)
        for ln in lines:
            d.text((W / 2, y), ln, font=CAP, fill=(255, 255, 255), anchor="mm", stroke_width=6, stroke_fill=(0, 0, 0)); y += 66
    if sg["scene"] != "end":
        d.text((W / 2, H * 0.85), f"Part {S.get('part', 1)}", font=PART, fill=(255, 255, 255), anchor="mm", stroke_width=4, stroke_fill=(0, 0, 0))
    ff.stdin.write(im.tobytes())
ff.stdin.close(); ff.wait()
print(f"OK {OUT} {total:.1f}s")
