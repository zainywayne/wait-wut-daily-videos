# A spinning gear with three hooked arms. Every ball an arm hits splits in two. Fills the arena.
import numpy as np, cv2, json, subprocess, sys, math
from scipy.spatial import cKDTree
W, H, FPS, SUB = 1080, 1920, 30, 6
DT = 1 / (FPS * SUB)
CX, CY, AR = 540, 1020, 470            # arena centre + radius (px)
BR = 13.0                              # ball radius
MAXN = 900; TOTAL = 30.0
ARM_R, ARM_T, SPIN = 125.0, 9.0, 1.15  # arm arc radius, half thickness, gear spin rad/s
PAL = [(255, 230, 60), (190, 80, 255), (90, 235, 90), (255, 70, 70), (60, 110, 255), (255, 80, 200), (50, 220, 230), (255, 175, 40), (240, 240, 240)]
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 2)
pos = np.zeros((MAXN, 2)); vel = np.zeros((MAXN, 2)); gen = np.zeros(MAXN, int); cool = np.zeros(MAXN)
n = 1; pos[0] = (CX - 210, CY - 260); vel[0] = (260, 330)
events = []; state = {'full': None}
def gear_pos(t):  # the gear drifts slowly around the middle
    return np.array([CX + 150 * math.sin(t * 0.37), CY + 130 * math.sin(t * 0.53 + 1.0)])
def arms(t):
    g = gear_pos(t); out = []
    for k in range(3):
        a = SPIN * t + k * 2 * math.pi / 3
        c = g + ARM_R * np.array([math.cos(a), math.sin(a)])
        # arc: half circle around c, starting at the gear and sweeping outward
        start = a + math.pi; out.append((c, start, start + math.pi * 0.95))
    return g, out
def step(t):
    global n
    p, v = pos[:n], vel[:n]
    p += v * DT
    # arena wall
    d = np.hypot(p[:, 0] - CX, p[:, 1] - CY); m = d > AR - BR
    if m.any():
        nn = (p[m] - (CX, CY)) / d[m, None]; vn = (v[m] * nn).sum(1, keepdims=True); v[m] -= 2 * np.maximum(vn, 0) * nn; p[m] = (CX, CY) + nn * (AR - BR)
    # ball-ball
    if n > 1:
        pairs = cKDTree(p).query_pairs(2 * BR, output_type='ndarray')
        if len(pairs):
            i, j = pairs[:, 0], pairs[:, 1]; dv = p[j] - p[i]; dist = np.hypot(dv[:, 0], dv[:, 1]) + 1e-6; nn = dv / dist[:, None]
            ov = (2 * BR - dist)[:, None] * 0.5
            np.add.at(p, i, -nn * ov); np.add.at(p, j, nn * ov)
            rv = ((v[j] - v[i]) * nn).sum(1); app = rv < 0
            if app.any():
                imp = (rv[app])[:, None] * nn[app]
                np.add.at(v, i[app], imp); np.add.at(v, j[app], -imp)
    # gear hub
    g, A = arms(t)
    dg = np.hypot(p[:, 0] - g[0], p[:, 1] - g[1]); m = dg < 34 + BR
    if m.any():
        nn = (p[m] - g) / dg[m, None]; vn = (v[m] * nn).sum(1, keepdims=True); v[m] -= 2 * np.minimum(vn, 0) * nn; p[m] = g + nn * (34 + BR)
    # arms: hit -> bounce + split
    hits = []
    for (c, a0, a1) in A:
        rel = p - c; dc = np.hypot(rel[:, 0], rel[:, 1]) + 1e-6; ang = np.arctan2(rel[:, 1], rel[:, 0])
        da = (ang - a0) % (2 * math.pi); inside = da <= (a1 - a0)
        near = inside & (np.abs(dc - ARM_R) < ARM_T + BR)
        if near.any():
            idx = np.nonzero(near)[0]; sgn = np.sign(dc[idx] - ARM_R)[:, None]; sgn[sgn == 0] = 1
            nn = rel[idx] / dc[idx, None] * sgn
            # arm surface velocity from the spin (rigid rotation about the gear)
            r_g = p[idx] - g; sv = SPIN * np.stack([-r_g[:, 1], r_g[:, 0]], 1)
            rv = ((v[idx] - sv) * nn).sum(1, keepdims=True)
            v[idx] -= 2 * np.minimum(rv, 0) * nn
            p[idx] = c + rel[idx] / dc[idx, None] * (ARM_R + sgn[:, 0:1] * (ARM_T + BR))
            hits.extend(idx.tolist())
    # speed limits so it stays lively but readable
    sp = np.hypot(v[:, 0], v[:, 1]) + 1e-6; f = np.clip(sp, 220, 620) / sp; v *= f[:, None]
    cool[:n] -= DT
    if state['full'] is None and hits:
        hits = [h for h in dict.fromkeys(hits) if cool[h] <= 0]
        k = min(len(hits), MAXN - n)
        for h in hits[:k]:
            cool[h] = 0.3; gen[h] += 1
            pos[n] = pos[h] + rng.uniform(-3, 3, 2); a = rng.uniform(0, 2 * math.pi); vel[n] = np.array([math.cos(a), math.sin(a)]) * 420
            gen[n] = gen[h]; cool[n] = 0.3; n += 1
        if k: events.append((t, 'split', k))
        if n >= MAXN * 0.999: state['full'] = t
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(im, s_, y, fs, color, th):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); x = int(W / 2 - tw / 2)
    cv2.putText(im, s_, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
def draw(t, pulse):
    im = np.zeros((H, W, 3), np.uint8)
    cv2.circle(im, (CX, CY), AR + 4, (235, 235, 235), 4, cv2.LINE_AA)
    g, A = arms(t)
    for (c, a0, a1) in A:
        pts = [(c[0] + ARM_R * math.cos(a), c[1] + ARM_R * math.sin(a)) for a in np.linspace(a0, a1, 40)]
        pts = np.array(pts, np.int32)
        cv2.polylines(im, [pts], False, (95, 95, 100), int(ARM_T * 2 + 4), cv2.LINE_AA); cv2.polylines(im, [pts], False, (165, 165, 172), int(ARM_T * 2 - 2), cv2.LINE_AA)
    # gear hub with teeth
    ga = SPIN * t
    for k in range(12):
        a = ga + k * math.pi / 6; cv2.line(im, (int(g[0]), int(g[1])), (int(g[0] + 40 * math.cos(a)), int(g[1] + 40 * math.sin(a))), (200, 200, 205), 10, cv2.LINE_AA)
    cv2.circle(im, (int(g[0]), int(g[1])), 32, (210, 210, 215), -1, cv2.LINE_AA); cv2.circle(im, (int(g[0]), int(g[1])), 10, (60, 60, 64), -1, cv2.LINE_AA)
    for k in range(n):
        x, y = int(pos[k, 0]), int(pos[k, 1]); c = PAL[gen[k] % len(PAL)]
        cv2.circle(im, (x, y), int(BR), (int(c[2] * 0.75), int(c[1] * 0.75), int(c[0] * 0.75)), -1, cv2.LINE_AA)
        cv2.circle(im, (x - 3, y - 3), int(BR * 0.55), (min(255, c[2] + 40), min(255, c[1] + 40), min(255, c[0] + 40)), -1, cv2.LINE_AA)
    full = state['full'] is not None and t >= state['full']
    text_c(im, f'{n:,}', 330, 4.0 * (1 + 0.1 * pulse), (60, 215, 255) if full else (240, 240, 240), 11)
    if full: text_c(im, "IT'S FULL.", 440, 2.0, (255, 255, 255), 6)
    else: text_c(im, 'Every hit = 2 balls', 440, 1.5, (120, 210, 255), 4)
    if t < 2.5: text_c(im, 'Will it fill the circle?', 1660, 1.8, (255, 255, 255), 5)
    return im
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    stills = None if mode in ('full', 'sim') else [float(x) for x in mode.split(',')]
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'gear.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    last = -9; hist = []
    for f in range(int(TOTAL * FPS)):
        t = f / FPS; n0 = n
        for s in range(SUB): step(t + s * DT)
        if n > n0: last = t
        hist.append(n); pulse = math.exp(-(t - last) * 10)
        if ff: ff.stdin.write(draw(t, pulse).tobytes())
        elif stills and any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/gr_{t:.1f}.jpg', draw(t, pulse))
        if mode == 'sim' and f % 60 == 0: print(round(t), n, flush=True)
        if state['full'] is not None and t > state['full'] + 3.5: break
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'hist': hist, 'full': state['full'], 'end': t}, open('gear_events.json', 'w')); print('done', n, 'full at', state['full'], 'end', t)
