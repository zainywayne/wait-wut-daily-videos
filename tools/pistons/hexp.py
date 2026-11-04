# Six pistons take turns in a hexagon. Every ball a piston hits splits in two. 1 -> 10,000.
import numpy as np, cv2, json, subprocess, sys, math
W, H, FPS, SUB = 1080, 1920, 30, 3
DT = 1 / (FPS * SUB)
CX, CY, AP = 540, 1060, 432          # hexagon centre and apothem (centre to edge)
TOTAL, GOAL_T, GOLD_T, END = 20.5, 15.8, 16.0, 20.5
R = 7.5
NORM = [(math.cos(a), math.sin(a)) for a in [math.pi / 2 + k * math.pi / 3 for k in range(6)]]  # outward edge normals, k=0 bottom
HW, TH, SMAX = 115, 28, AP - 90     # piston head half-width, thickness, max stroke
PAL = np.array([(255, 70, 70), (255, 160, 40), (255, 230, 60), (90, 230, 90), (40, 210, 230), (70, 120, 255), (170, 80, 255), (255, 80, 200), (240, 240, 240)], np.float32)
rng = np.random.default_rng(7)
MAXN = 10000
pos = np.zeros((MAXN, 2), np.float32); vel = np.zeros((MAXN, 2), np.float32); col = np.zeros(MAXN, np.int32); cool = np.zeros(MAXN, np.float32)
n = 1; pos[0] = (CX + 30, CY - 20); vel[0] = (260, 180); col[0] = 5
TK = [(0, 1), (1.2, 2), (2.5, 7), (4, 30), (5.5, 120), (7, 380), (8.5, 800), (10, 1600), (11.5, 2900), (13, 4800), (14.5, 7200), (15.8, 10000)]
def target(t):
    for (t0, a0), (t1, a1) in zip(TK, TK[1:]):
        if t <= t1: u = (t - t0) / (t1 - t0); return math.exp(math.log(a0) + (math.log(a1) - math.log(a0)) * max(0, u))
    return MAXN
def stroke(t):  # which piston is firing and its face distance from the wall
    out = [0.0] * 6; vel_ = [0.0] * 6
    # stroke period shrinks over time
    T = 0.62 - 0.36 * min(1, t / 13)
    if t < 0.4: return out, vel_
    tt = t - 0.4; k = int(tt / T); ph = (tt - k * T) / T; i = k % 6
    if ph < 0.38: s = (ph / 0.38) ** 2; v = 2 * (ph / 0.38) / (0.38 * T)
    else: q = (ph - 0.38) / 0.62; s = 1 - q * q * (3 - 2 * q); v = -6 * q * (1 - q) / (0.62 * T)
    out[i] = s * SMAX; vel_[i] = v * SMAX
    # a second piston opposite joins in later for the frenzy
    if t > 9.5:
        j = (i + 3) % 6; ph2 = (ph + 0.5) % 1
        if ph2 < 0.38: s2 = (ph2 / 0.38) ** 2; v2 = 2 * (ph2 / 0.38) / (0.38 * T)
        else: q = (ph2 - 0.38) / 0.62; s2 = 1 - q * q * (3 - 2 * q); v2 = -6 * q * (1 - q) / (0.62 * T)
        out[j] = s2 * SMAX * 0.9; vel_[j] = v2 * SMAX * 0.9
    return out, vel_
frames = int(TOTAL * FPS); events = []  # (time, kind, amount)
hist = []
def step(t):
    global n
    p = pos[:n]; v = vel[:n]
    p += v * DT
    # walls
    for (nx, ny) in NORM:
        d = (p[:, 0] - CX) * nx + (p[:, 1] - CY) * ny; m = d > AP - R
        if m.any():
            vn = v[m, 0] * nx + v[m, 1] * ny; vn = np.maximum(vn, 0)
            v[m, 0] -= 2 * vn * nx; v[m, 1] -= 2 * vn * ny
            p[m, 0] -= (d[m] - (AP - R)) * nx; p[m, 1] -= (d[m] - (AP - R)) * ny
    S, SV = stroke(t)
    want = int(target(t)); budget = max(0, want - n)
    cool[:n] -= DT
    for i, (nx, ny) in enumerate(NORM):
        if S[i] <= 0.5: continue
        face = AP - S[i]                       # face distance from centre along the outward normal
        rx, ry = p[:, 0] - CX, p[:, 1] - CY
        a = rx * nx + ry * ny; b = -rx * ny + ry * nx
        hit = (np.abs(b) < HW + R) & (a > face - R) & (a < face + TH + R)
        if not hit.any(): continue
        idx = np.nonzero(hit)[0]
        p[idx, 0] -= (a[idx] - (face - R)) * nx; p[idx, 1] -= (a[idx] - (face - R)) * ny
        pv = SV[i]                              # piston speed inward (positive when extending)
        vn = v[idx, 0] * nx + v[idx, 1] * ny
        newvn = np.minimum(-np.abs(vn) * 0.9, -max(pv, 0) * 1.05 - 120)
        v[idx, 0] += (newvn - vn) * nx; v[idx, 1] += (newvn - vn) * ny
        kick = rng.uniform(-220, 220, len(idx)); v[idx, 0] += kick * -ny; v[idx, 1] += kick * nx
        # split: balls hit while the piston pushes forward clone (within the budget)
        if pv > 0 and budget > 0:
            ready = idx[cool[idx] <= 0][:budget]
            k = len(ready)
            if k:
                cool[ready] = 0.25
                new = slice(n, n + k); pos[new] = pos[ready] + rng.uniform(-5, 5, (k, 2)); ang = rng.uniform(-1.6, 1.6, k)
                c, s = np.cos(ang), np.sin(ang); vx, vy = vel[ready, 0], vel[ready, 1]
                sp = np.hypot(vx, vy) * rng.uniform(0.85, 1.15, k)
                vel[new, 0] = (vx * c - vy * s); vel[new, 1] = (vx * s + vy * c)
                nrm = np.hypot(vel[new, 0], vel[new, 1]) + 1e-6; vel[new, 0] *= sp / nrm; vel[new, 1] *= sp / nrm
                col[new] = rng.integers(0, len(PAL), k); cool[new] = 0.25
                n += k; budget -= k; events.append((t, 'pop', k)); p = pos[:n]; v = vel[:n]
    # if we fall well behind the curve early on, let wall bounces split too (keeps the count moving)
    if n < want * 0.6 and n < MAXN and t > 1.0:
        k = min(MAXN - n, max(1, int((want * 0.6 - n) * 0.1)))
        src = rng.integers(0, n, k); new = slice(n, n + k); pos[new] = pos[src] + rng.uniform(-5, 5, (k, 2)); ang = rng.uniform(-1.2, 1.2, k)
        c, s = np.cos(ang), np.sin(ang); vel[new, 0] = vel[src, 0] * c - vel[src, 1] * s; vel[new, 1] = vel[src, 0] * s + vel[src, 1] * c
        col[new] = rng.integers(0, len(PAL), k); n += k; events.append((t, 'pop', k))
    # keep speeds lively
    sp = np.hypot(vel[:n, 0], vel[:n, 1]) + 1e-6; f = np.clip(sp, 260, 900) / sp; vel[:n] *= f[:, None]
    return S
# ---------- drawing ----------
def bg_img():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); d = np.hypot(xx - CX, yy - CY) / 1100
    g = np.clip(1 - d, 0, 1) ** 1.6; img = np.zeros((H, W, 3), np.float32)
    img[:] = (10, 10, 14); img += g[..., None] * np.array((30, 26, 22), np.float32)
    return img.astype(np.uint8)
BG = bg_img()
HEX = np.array([(CX + AP / math.cos(math.pi / 6) * math.cos(a), CY + AP / math.cos(math.pi / 6) * math.sin(a)) for a in [k * math.pi / 3 for k in range(6)]], np.int32)
def metal_rect(img, center, along, half_len, half_w, shade=1.0):
    # draws a shaded metal bar (rotated rectangle) with a vertical gradient across its width
    cx, cy = center; ux, uy = along; px, py = -uy, ux
    steps = max(2, int(half_w * 2))
    for j in range(steps):
        o = -half_w + (2 * half_w) * j / (steps - 1); g = 1 - abs((j / (steps - 1)) - 0.35) * 1.3
        c = int(np.clip((70 + 150 * g) * shade, 0, 255))
        a = (int(cx + px * o - ux * half_len), int(cy + py * o - uy * half_len)); b = (int(cx + px * o + ux * half_len), int(cy + py * o + uy * half_len))
        cv2.line(img, a, b, (c, c, int(c * 1.04)), 2, cv2.LINE_AA)
def draw(f, t, S):
    img = BG.copy()
    # arena glow + edge
    cv2.polylines(img, [HEX], True, (90, 90, 100), 14, cv2.LINE_AA); cv2.polylines(img, [HEX], True, (225, 225, 235), 4, cv2.LINE_AA)
    # balls
    nn = n; gold = t >= GOLD_T
    P = pos[:nn]; C = PAL[col[:nn]].copy()
    if gold:
        rr = np.hypot(P[:, 0] - CX, P[:, 1] - CY); wave = (t - GOLD_T) * 1400
        m = rr < wave; C[m] = (255, 200, 50)
    rad = 9 if nn < 1500 else (8 if nn < 4000 else 7)
    for k in range(nn):
        x, y = int(P[k, 0]), int(P[k, 1]); c = C[k]
        cv2.circle(img, (x, y), rad, (int(c[2] * 0.75), int(c[1] * 0.75), int(c[0] * 0.75)), -1, cv2.LINE_AA)
        cv2.circle(img, (x - 2, y - 2), max(1, rad - 3), (int(min(255, c[2] * 1.1 + 40)), int(min(255, c[1] * 1.1 + 40)), int(min(255, c[0] * 1.1 + 40))), -1, cv2.LINE_AA)
    # pistons
    for i, (nx, ny) in enumerate(NORM):
        face = AP - S[i]; ux, uy = -nx, -ny
        wall = (CX + nx * (AP + 30), CY + ny * (AP + 30))
        head = (CX + nx * (face + TH / 2), CY + ny * (face + TH / 2))
        # rod from the housing to the head
        mid = ((wall[0] + head[0]) / 2, (wall[1] + head[1]) / 2); L = math.hypot(head[0] - wall[0], head[1] - wall[1]) / 2
        metal_rect(img, mid, (ux, uy), L, 11, 0.9)
        metal_rect(img, head, (-uy, ux), HW, TH / 2, 1.05)
        cv2.rectangle(img, (0, 0), (0, 0), (0, 0, 0))
        # housing on the wall
        metal_rect(img, (CX + nx * (AP + 34), CY + ny * (AP + 34)), (-uy, ux), 56, 22, 0.75)
    # counter
    shown = n if t < GOAL_T + 0.3 else MAXN
    txt = f'{shown:,}'; col_t = (60, 205, 255) if gold else (235, 235, 235)
    fs = 4.2; th = 12; (tw, tht), _ = cv2.getTextSize(txt, cv2.FONT_HERSHEY_DUPLEX, fs, th)
    org = (int(W / 2 - tw / 2), 400)
    cv2.putText(img, txt, (org[0] + 4, org[1] + 6), cv2.FONT_HERSHEY_DUPLEX, fs, (0, 0, 0), th + 6, cv2.LINE_AA)
    cv2.putText(img, txt, org, cv2.FONT_HERSHEY_DUPLEX, fs, col_t, th, cv2.LINE_AA)
    return img
if __name__ == '__main__':
    only = sys.argv[1] if len(sys.argv) > 1 else None
    ff = None
    if only is None:
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', 'video.mp4'], stdin=subprocess.PIPE)
    stills = [float(x) for x in only.split(',')] if only else []
    for f in range(frames):
        t = f / FPS
        for s in range(SUB): S = step(t + s * DT)
        hist.append(n)
        if ff: ff.stdin.write(draw(f, t, S).tobytes())
        elif any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/h_{t:.1f}.jpg', draw(f, t, S))
        if f % 60 == 0: print('frame', f, 'n', n, flush=True)
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'hist': hist}, open('events.json', 'w'))
    print('done n', n)
