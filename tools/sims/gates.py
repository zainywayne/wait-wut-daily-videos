# Balls rain through sliding multiplier gates (x2, x3, and one red /2). Balls that hit the floor drop again from the top.
import numpy as np, cv2, json, subprocess, sys, math
W, H, FPS, SUB = 1080, 1920, 30, 4
DT = 1 / (FPS * SUB)
X0, X1, YTOP, YBOT = 70, 1010, 470, 1700
G = 2600.0; BR = 7.0; MAXN = 10000; TOTAL = 22.0
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 3)
# peg lattice (staggered rows)
PEG_R = 9; PEG_ROWS = [(y, 70 if i % 2 else 35) for i, y in enumerate(range(800, 1000, 50))] + [(y, 70 if i % 2 else 35) for i, y in enumerate(range(1130, 1300, 50))] + [(y, 70 if i % 2 else 35) for i, y in enumerate(range(1430, 1640, 50))]
PEGS = np.array([(x, y) for y, off in PEG_ROWS for x in range(X0 + off, X1, 70)], float)
# gates: (y, width, mult, speed, phase, colour)
GATES = [(660, 500, 2, 0.9, 0.0, (80, 220, 120)), (1060, 430, 3, 1.25, 1.7, (60, 170, 255)), (1370, 170, 0.5, 1.6, 3.1, (60, 60, 235)), (1370, 360, 2, 1.1, 0.4, (80, 220, 120))]
def gate_x(g, t):
    y, w, m, sp, ph, c = g; span = (X1 - X0 - w) / 2; return (X0 + X1) / 2 + span * math.sin(t * sp + ph)
pos = np.zeros((MAXN, 2)); vel = np.zeros((MAXN, 2)); col = np.zeros(MAXN, int); n = 1
pos[0] = (gate_x(GATES[0], 0.36), YTOP); vel[0] = (0, 120)
PAL = [(70, 70, 255), (60, 180, 255), (60, 230, 255), (90, 230, 90), (255, 200, 60), (255, 110, 160), (230, 90, 220), (240, 240, 240)]
events = []; state = {'reach': None}; POPS = []
def step(t):
    global n
    p, v = pos[:n], vel[:n]
    py = p[:, 1].copy()
    v[:, 1] += G * DT; p += v * DT
    # side walls
    m = p[:, 0] < X0 + BR; v[m, 0] = np.abs(v[m, 0]); p[m, 0] = X0 + BR
    m = p[:, 0] > X1 - BR; v[m, 0] = -np.abs(v[m, 0]); p[m, 0] = X1 - BR
    # pegs: check the nearest pegs via a coarse grid
    for row_y, off in PEG_ROWS:
        near = np.abs(p[:, 1] - row_y) < PEG_R + BR
        if not near.any(): continue
        idx = np.nonzero(near)[0]
        px = X0 + off + np.round((p[idx, 0] - X0 - off) / 70) * 70
        dx, dy = p[idx, 0] - px, p[idx, 1] - row_y; d = np.hypot(dx, dy) + 1e-6; hit = d < PEG_R + BR
        if hit.any():
            h = idx[hit]; nx, ny = dx[hit] / d[hit], dy[hit] / d[hit]; vn = v[h, 0] * nx + v[h, 1] * ny
            m2 = vn < 0; h, nx, ny, vn = h[m2], nx[m2], ny[m2], vn[m2]
            v[h, 0] -= 1.55 * vn * nx; v[h, 1] -= 1.55 * vn * ny
            v[h, 0] += rng.uniform(-40, 40, len(h))
            p[h, 0] = px[hit][m2] + nx * (PEG_R + BR); p[h, 1] = row_y + ny * (PEG_R + BR)
    # gates: crossing the gate line inside the gate multiplies the ball
    newc = []
    kill = np.zeros(n, bool)
    for g in GATES:
        gy, w, mult, *_ = g; gx = gate_x(g, t)
        cross = (py < gy) & (p[:, 1] >= gy) & (np.abs(p[:, 0] - gx) < w / 2)
        if not cross.any(): continue
        idx = np.nonzero(cross)[0]
        if mult < 1 and t < 5.0: continue
        if n < 24:
            for i in idx[:2]: POPS.append((float(p[i, 0]), float(gy), ('x' + str(int(mult))) if mult >= 1 else '/2', t))
        if mult < 1:
            kill[idx[rng.random(len(idx)) < 0.5]] = True; events.append((t, 'half', int(len(idx))))
        else:
            newc.append((idx, int(mult) - 1)); events.append((t, 'mult', int(len(idx) * (mult - 1))))
    if kill.any():
        keep = ~kill; k = int(keep.sum()); pos[:k] = pos[:n][keep]; vel[:k] = vel[:n][keep]; col[:k] = col[:n][keep]
        remap = np.cumsum(keep) - 1; newc = [(remap[idx[keep[idx]]], c) for idx, c in newc]; n = k
    for idx, c in newc:
        for _ in range(c):
            k = min(len(idx), MAXN - n)
            if k <= 0: break
            src = idx[:k]; new = slice(n, n + k); pos[new] = pos[src]; pos[new, 0] += rng.uniform(-6, 6, k)
            vel[new, 0] = vel[src, 0] + rng.uniform(-160, 160, k); vel[new, 1] = vel[src, 1] * rng.uniform(0.8, 1.0, k); col[new] = rng.integers(0, len(PAL), k); n += k
    # floor: drop again from the top (keeps the loop going)
    m = pos[:n, 1] > YBOT
    if m.any():
        k = int(m.sum()); pos[:n][m, 1] = YTOP + rng.uniform(-30, 0, k); pos[:n][m, 0] = np.clip(pos[:n][m, 0] + rng.uniform(-60, 60, k), X0 + 10, X1 - 10); vel[:n][m] = np.stack([rng.uniform(-60, 60, k), rng.uniform(80, 220, k)], 1)
    if n >= MAXN and state['reach'] is None: state['reach'] = t
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(im, s_, y, fs, color, th, x=None):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); x = int(W / 2 - tw / 2) if x is None else int(x - tw / 2)
    cv2.putText(im, s_, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
BG = (np.array((14, 10, 12), np.float32) + (np.clip(1 - np.hypot(xx - W / 2, yy - 1100) / 1200, 0, 1) ** 1.6)[..., None] * np.array((34, 24, 26), np.float32)).astype(np.uint8); del yy, xx
def draw(t, pulse):
    im = BG.copy()
    cv2.rectangle(im, (X0 - 6, YTOP - 40), (X1 + 6, YBOT + 10), (200, 200, 210), 4, cv2.LINE_AA)
    for x, y in PEGS: cv2.circle(im, (int(x), int(y)), PEG_R, (175, 175, 185), -1, cv2.LINE_AA)
    gold = state['reach'] is not None and t >= state['reach']
    P = pos[:n]; rad = int(max(6, 17 - 3.2 * math.log10(max(1, n))))
    for k in range(n):
        c = (60, 200, 255) if gold else PAL[col[k]]
        cv2.circle(im, (int(P[k, 0]), int(P[k, 1])), rad, (int(c[0] * 0.75), int(c[1] * 0.75), int(c[2] * 0.75)), -1, cv2.LINE_AA)
        if n < 4000: cv2.circle(im, (int(P[k, 0]) - rad // 3, int(P[k, 1]) - rad // 3), max(2, rad // 2), (min(255, c[0] + 60), min(255, c[1] + 60), min(255, c[2] + 60)), -1, cv2.LINE_AA)
    for g in GATES:
        gy, w, mult, sp, ph, c = g; gx = gate_x(g, t)
        if mult < 1 and t < 5.0: continue
        ov = im.copy(); cv2.rectangle(ov, (int(gx - w / 2), gy - 26), (int(gx + w / 2), gy + 26), c, -1); im = cv2.addWeighted(ov, 0.35, im, 0.65, 0)
        cv2.rectangle(im, (int(gx - w / 2), gy - 26), (int(gx + w / 2), gy + 26), c, 4, cv2.LINE_AA)
        lab = ('x' + str(int(mult))) if mult >= 1 else '/2'
        text_c(im, lab, gy + 16, 1.5, (255, 255, 255), 4, x=gx)
    shown = n
    text_c(im, f'{shown:,}', 300, 4.0 * (1 + 0.12 * pulse), (60, 205, 255) if gold else (240, 240, 240), 11)
    if gold: text_c(im, 'GOAL REACHED', 405, 1.7, (255, 255, 255), 5)
    else: text_c(im, 'GOAL: 10,000', 405, 1.6, (120, 210, 255), 4)
    for (px, py, lab, t0) in POPS:
        u = t - t0
        if 0 <= u < 0.8: text_c(im, lab, int(py - 40 - u * 120), 1.6, (120, 255, 160) if lab != '/2' else (90, 90, 255), 4, x=px)
    if t < 4.8: text_c(im, 'Every gate MULTIPLIES the balls', 1815, 1.3, (255, 255, 255), 4)
    elif t < 8.0: text_c(im, 'Uh oh... a /2 gate appeared', 1815, 1.3, (120, 120, 255), 4)
    return im
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    stills = None if mode in ('full', 'sim') else [float(x) for x in mode.split(',')]
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'gates.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    hist = []; last = -9; t = 0
    for f in range(int(TOTAL * FPS)):
        t = f / FPS; n0 = n
        for s in range(SUB): step(t + s * DT)
        if n > n0: last = t
        hist.append(n); pulse = math.exp(-(t - last) * 10)
        if ff: ff.stdin.write(draw(t, pulse).tobytes())
        elif stills and any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/ga_{t:.1f}.jpg', draw(t, pulse))
        if state['reach'] is not None and t > state['reach'] + 3.0: break
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'hist': hist, 'reach': state['reach'], 'end': t}, open('gates_events.json', 'w'))
    print('reach', state['reach'], 'end', round(t, 2), [hist[int(x * 30)] for x in (1, 2, 4, 6, 8, 10, 12, 14, 16) if int(x * 30) < len(hist)])
