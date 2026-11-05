# The ball grows every time it bounces. Will it fill the circle? Real physics, musical bounces.
import numpy as np, cv2, json, subprocess, sys, math, colorsys
W, H, FPS, SUB = 1080, 1920, 30, 8
DT = 1 / (FPS * SUB)
CX, CY, RR = 540, 1040, 430
G = 2100.0
GROW = float(sys.argv[2]) if len(sys.argv) > 2 else 3.2
p = np.array([CX - 120.0, CY + 200.0]); v = np.array([420.0, 1100.0]); r = 26.0
bounces = 0; events = []; hue = 0.55; trail = []; done = None
def step(t):
    global p, v, r, bounces, hue, done
    if done is not None: return
    v[1] += G * DT; p += v * DT
    d = p - (CX, CY); dist = math.hypot(*d)
    if dist > RR - r:
        nrm = d / dist; vn = v @ nrm
        if vn > 0:
            v -= 2 * vn * nrm
            # keep it lively: restore a minimum speed so it never settles
            sp = math.hypot(*v)
            if sp < 1250: v *= 1250 / max(sp, 1)
            bounces += 1; hue = (hue + 0.037) % 1; r = min(RR, r + GROW); events.append((t, bounces))
        p = np.array((CX, CY)) + nrm * (RR - r)
    if r >= RR - 6: done = t
BG = None
def bg():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    g = (np.clip(1 - np.hypot(xx - CX, yy - CY) / 1150, 0, 1) ** 1.5)[..., None] * np.array((28, 30, 36), np.float32) + np.array((12, 12, 16), np.float32)
    return g.astype(np.uint8)
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(img, s, y, fs, color, th):
    (tw, _), _ = cv2.getTextSize(s, FONT, fs, th); x = int(W / 2 - tw / 2)
    cv2.putText(img, s, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(img, s, (x, y), FONT, fs, color, th, cv2.LINE_AA)
def hsv(h, s=0.85, v=1.0): c = colorsys.hsv_to_rgb(h, s, v); return (int(c[2] * 255), int(c[1] * 255), int(c[0] * 255))
def draw(t, pulse):
    img = BG.copy()
    cv2.circle(img, (CX, CY), RR + 10, (70, 70, 80), 18, cv2.LINE_AA); cv2.circle(img, (CX, CY), RR + 10, (240, 240, 245), 6, cv2.LINE_AA)
    if done is None or t - done < 0.05:
        # trail: past positions, fading
        ov = img.copy()
        for k, (tp, tr, th) in enumerate(trail[-28:]):
            cv2.circle(ov, (int(tp[0]), int(tp[1])), int(tr), hsv(th, 0.7, 0.55), -1, cv2.LINE_AA)
        img = cv2.addWeighted(ov, 0.35, img, 0.65, 0)
        rr = int(r * (1 + 0.05 * pulse))
        cv2.circle(img, (int(p[0]), int(p[1])), rr, hsv(hue), -1, cv2.LINE_AA)
        cv2.circle(img, (int(p[0] - rr * 0.3), int(p[1] - rr * 0.3)), max(2, int(rr * 0.35)), hsv(hue, 0.35, 1.0), -1, cv2.LINE_AA)
        cv2.circle(img, (int(p[0]), int(p[1])), rr, (255, 255, 255), 3, cv2.LINE_AA)
    else:
        # it filled the circle: burst into confetti
        u = t - done; rs = np.random.default_rng(1)
        for k in range(260):
            a = rs.uniform(0, 2 * math.pi); sp = rs.uniform(300, 1400); x = CX + math.cos(a) * sp * u; y = CY + math.sin(a) * sp * u + 900 * u * u
            cv2.circle(img, (int(x), int(y)), int(rs.uniform(6, 16)), hsv(rs.random()), -1, cv2.LINE_AA)
        f = math.exp(-u * 4); cv2.circle(img, (CX, CY), int(RR * (1 + u * 0.4)), (255, 255, 255), max(1, int(40 * f)), cv2.LINE_AA)
    pct = min(100, int(round((r - 26) / (RR - 6 - 26) * 100)))
    if done is not None and t >= done: text_c(img, '100%', 330, 4.4, (60, 215, 255), 12); text_c(img, 'IT FILLED THE CIRCLE', 440, 1.8, (255, 255, 255), 5)
    else:
        text_c(img, f'{pct}%', 330, 4.2 * (1 + 0.1 * pulse), (240, 240, 240), 12)
        text_c(img, 'It grows every bounce', 440, 1.5, (120, 210, 255), 4)
        if t < 2.4: text_c(img, 'Will it fill the circle?', 1660, 1.9, (255, 255, 255), 5)
    return img
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    BG = bg(); stills = None if mode in ('full', 'sim') else [float(x) for x in mode.split(',')]
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', 'grow.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    lastb = -9; t = 0
    for f in range(int(60 * FPS)):
        t = f / FPS
        for s in range(SUB):
            nb = bounces; step(t + s * DT)
            if bounces > nb: lastb = t
        trail.append((p.copy(), r, hue))
        pulse = math.exp(-(t - lastb) * 14)
        if ff: ff.stdin.write(draw(t, pulse).tobytes())
        elif stills and any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/g_{t:.1f}.jpg', draw(t, pulse))
        if done is not None and t > done + 2.6: break
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'done': done, 'end': t}, open('grow_events.json', 'w')); print('done at', done, 'bounces', bounces, 'end', t)
