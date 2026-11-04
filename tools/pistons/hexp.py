# Six pistons take turns in a hexagon. Every ball a piston hits splits in two. 1 -> 10,000.
import numpy as np, cv2, json, subprocess, sys, math
W, H, FPS, SUB = 1080, 1920, 30, 3
DT = 1 / (FPS * SUB)
CX, CY, AP = 540, 1060, 432          # hexagon centre and apothem (centre to edge)
TOTAL, GOAL_T, GOLD_T, END = 18.0, 15.8, 16.0, 18.0
R = 7.5
NORM = [(math.cos(a), math.sin(a)) for a in [math.pi / 2 + k * math.pi / 3 for k in range(6)]]  # outward edge normals, k=0 bottom
HW, TH, SMAX = 165, 28, AP - 90     # piston head half-width, thickness, max stroke
PAL = np.array([(255, 70, 70), (255, 160, 40), (255, 230, 60), (90, 230, 90), (40, 210, 230), (70, 120, 255), (170, 80, 255), (255, 80, 200), (240, 240, 240)], np.float32)
rng = np.random.default_rng(7)
MAXN = 10000
pos = np.zeros((MAXN, 2), np.float32); vel = np.zeros((MAXN, 2), np.float32); col = np.zeros(MAXN, np.int32); cool = np.zeros(MAXN, np.float32)
n = 1; pos[0] = (CX + 40, CY - 30); vel[0] = (230, 170); col[0] = 5
GAPMIN = 2 * R + 4
def period(t): return 0.95 - 0.5 * min(1, t / 15)
def stroke(t):
    """Opposite pistons close in pairs, taking turns. Returns face distance from centre for each piston, its inward speed, the active pair and phase."""
    face = [AP] * 6; spd = [0.0] * 6
    if t < 0.3: return face, spd, -1, 0, 0
    # integrate the period so strokes stay continuous as they speed up
    tt, k = 0.3, 0
    while True:
        T = period(tt)
        if tt + T > t: break
        tt += T; k += 1
    ph = (t - tt) / T; pr = k % 3
    CL = 0.42
    if ph < CL: q = ph / CL; s = q * q * (3 - 2 * q); v = 6 * q * (1 - q) / (CL * T)
    elif ph < CL + 0.08: s, v = 1.0, 0.0
    else: q = (ph - CL - 0.08) / (1 - CL - 0.08); s = 1 - q * q * (3 - 2 * q); v = -6 * q * (1 - q) / ((1 - CL - 0.08) * T)
    reach = AP - GAPMIN / 2
    for i in (pr, pr + 3): face[i] = AP - s * reach; spd[i] = v * reach
    return face, spd, pr, k, ph
frames = int(TOTAL * FPS); events = []
hist = []; last_k = [-1]; REACH = [None]
def step(t):
    global n
    p = pos[:n]; v = vel[:n]
    p += v * DT
    for (nx, ny) in NORM:
        d = (p[:, 0] - CX) * nx + (p[:, 1] - CY) * ny; m = d > AP - R
        if m.any():
            vn = np.maximum(v[m, 0] * nx + v[m, 1] * ny, 0)
            v[m, 0] -= 2 * vn * nx; v[m, 1] -= 2 * vn * ny
            p[m, 0] -= (d[m] - (AP - R)) * nx; p[m, 1] -= (d[m] - (AP - R)) * ny
    F, SP, pr, k, ph = stroke(t)
    for i, (nx, ny) in enumerate(NORM):
        if F[i] >= AP - 0.5 or SP[i] < 0: continue
        rx, ry = p[:, 0] - CX, p[:, 1] - CY
        a = rx * nx + ry * ny; b = -rx * ny + ry * nx
        hit = (np.abs(b) < HW + R) & (a > F[i] - R) & (a < F[i] + TH + R)
        if not hit.any(): continue
        idx = np.nonzero(hit)[0]
        p[idx, 0] -= (a[idx] - (F[i] - R)) * nx; p[idx, 1] -= (a[idx] - (F[i] - R)) * ny
        vn = v[idx, 0] * nx + v[idx, 1] * ny; newvn = np.minimum(-np.abs(vn) * 0.6, -max(SP[i], 0) * 1.0)
        v[idx, 0] += (newvn - vn) * nx; v[idx, 1] += (newvn - vn) * ny
    # SQUISH: when a pair fully closes, every ball trapped between the two heads doubles
    if pr >= 0 and ph >= 0.42 and last_k[0] != k:
        last_k[0] = k; nx, ny = NORM[pr]
        rx, ry = p[:, 0] - CX, p[:, 1] - CY; a = rx * nx + ry * ny; b = -rx * ny + ry * nx
        caught = np.nonzero((np.abs(b) < HW + R) & (np.abs(a) < GAPMIN / 2 + R + 2))[0]
        kk = min(len(caught), MAXN - n)
        if kk > 0:
            src = caught[:kk]; new = slice(n, n + kk)
            pos[new] = pos[src] + rng.uniform(-4, 4, (kk, 2)); col[new] = rng.integers(0, len(PAL), kk)
            n += kk; p = pos[:n]; v = vel[:n]
            events.append((t, 'squish', kk))
        # spray everything that was caught out of the gap
        allc = np.concatenate([caught, np.arange(n - kk, n)]) if kk > 0 else caught
        if len(allc):
            ang = rng.uniform(0, 2 * np.pi, len(allc)); spd = rng.uniform(450, 950, len(allc))
            tx, ty = -ny, nx  # mostly sideways, out of the open sides of the gap
            side = np.sign(rng.uniform(-1, 1, len(allc)))
            v[allc, 0] = (tx * side * 0.3 + np.cos(ang)) * spd; v[allc, 1] = (ty * side * 0.3 + np.sin(ang)) * spd
        events.append((t, 'clamp', 1))
    sp = np.hypot(v[:, 0], v[:, 1]) + 1e-6; f = np.clip(sp, 200, 950) / sp; v *= f[:, None]
    return F
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
    nn = n; gold = REACH[0] is not None and t >= REACH[0] + 0.2
    P = pos[:nn]; C = PAL[col[:nn]].copy()
    if gold:
        rr = np.hypot(P[:, 0] - CX, P[:, 1] - CY); wave = (t - REACH[0] - 0.2) * 1400
        m = rr < wave; C[m] = (255, 200, 50)
    rad = 9 if nn < 1500 else (8 if nn < 4000 else 7)
    for k in range(nn):
        x, y = int(P[k, 0]), int(P[k, 1]); c = C[k]
        cv2.circle(img, (x, y), rad, (int(c[2] * 0.75), int(c[1] * 0.75), int(c[0] * 0.75)), -1, cv2.LINE_AA)
        cv2.circle(img, (x - 2, y - 2), max(1, rad - 3), (int(min(255, c[2] * 1.1 + 40)), int(min(255, c[1] * 1.1 + 40)), int(min(255, c[0] * 1.1 + 40))), -1, cv2.LINE_AA)
    # pistons
    for i, (nx, ny) in enumerate(NORM):
        face = S[i]; ux, uy = -nx, -ny
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
    shown = n
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
        if n >= MAXN and REACH[0] is None: REACH[0] = t
        if ff: ff.stdin.write(draw(f, t, S).tobytes())
        elif any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/h_{t:.1f}.jpg', draw(f, t, S))
        if f % 60 == 0: print('frame', f, 'n', n, flush=True)
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'hist': hist}, open('events.json', 'w'))
    print('done n', n)
