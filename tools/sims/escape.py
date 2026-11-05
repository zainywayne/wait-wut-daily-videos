# Every ball that escapes the spinning ring = 2 new balls. Real physics, nothing scripted.
import numpy as np, cv2, json, subprocess, sys, math
W, H, FPS, SUB = 1080, 1920, 30, 4
DT = 1 / (FPS * SUB)
CX, CY, RR, RT = 540, 1040, 400, 16     # ring centre, radius, thickness
G = 1500.0
GAPS = [0.0, math.pi]; GAPW = 1.05    # two gaps (radians wide)
SPIN = 1.1
MAXIN = 10000
TOTAL = 30.0
PAL = np.array([(255, 70, 70), (255, 160, 40), (255, 230, 60), (90, 230, 90), (40, 210, 230), (70, 120, 255), (170, 80, 255), (255, 80, 200)], np.float32)
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 4)
CAP = 26000
pos = np.zeros((CAP, 2), np.float32); vel = np.zeros((CAP, 2), np.float32); col = np.zeros(CAP, np.int32); alive = np.zeros(CAP, bool); out = np.zeros(CAP, bool)
n = 1; pos[0] = (CX, CY); vel[0] = (950, -120); col[0] = 5; alive[0] = True
events = []; hist = []; state = {'shatter': None, 'won_t': None}
def ring_angle(t): return SPIN * t
def in_gap(theta, t):
    for g in GAPS:
        d = (theta - (g + ring_angle(t)) + math.pi) % (2 * math.pi) - math.pi
        if np.isscalar(d): pass
    return None
def step(t):
    global n
    idx = np.nonzero(alive[:n])[0]
    p = pos[idx]; v = vel[idx]
    v[:, 1] += G * DT; p += v * DT
    ins = ~out[idx]
    rx, ry = p[:, 0] - CX, p[:, 1] - CY; r = np.hypot(rx, ry) + 1e-6
    rad = ball_r()
    hitw = ins & (r > RR - RT / 2 - rad) & (state['shatter'] is None)
    if hitw.any():
        th = np.arctan2(ry[hitw], rx[hitw]); gap = np.zeros(len(th), bool)
        for g in GAPS:
            d = (th - (g + ring_angle(t)) + math.pi) % (2 * math.pi) - math.pi; gap |= np.abs(d) < GAPW / 2
        hi = np.nonzero(hitw)[0]
        esc = hi[gap]; bnc = hi[~gap]
        if len(bnc):
            nx, ny = rx[bnc] / r[bnc], ry[bnc] / r[bnc]; vn = v[bnc, 0] * nx + v[bnc, 1] * ny; vn = np.maximum(vn, 0)
            v[bnc, 0] -= 2 * vn * nx; v[bnc, 1] -= 2 * vn * ny
            # tiny energy kick so the bouncing never dies out
            tx, ty = -ny, nx; v[bnc, 0] += tx * 30 * np.sign(rng.uniform(-1, 1, len(bnc))); v[bnc, 1] += ty * 30
            lim = RR - RT / 2 - rad; p[bnc, 0] = CX + nx * lim; p[bnc, 1] = CY + ny * lim
            events.append((t, 'bounce', int(len(bnc))))
        if len(esc):
            gi = idx[esc]; out[gi] = True
            # each escapee spawns two new balls in the middle
            k = min(2 * len(gi), CAP - n)
            if k > 0:
                new = slice(n, n + k); a = rng.uniform(0, 2 * np.pi, k); sp = rng.uniform(500, 950, k)
                pos[new, 0] = CX + rng.uniform(-30, 30, k); pos[new, 1] = CY + rng.uniform(-30, 30, k)
                vel[new, 0] = np.cos(a) * sp; vel[new, 1] = np.sin(a) * sp - 200; col[new] = rng.integers(0, len(PAL), k); alive[new] = True; out[new] = False
                n += k
            events.append((t, 'escape', int(len(gi))))
    # keep the bouncing lively: anything inside that slows down gets a small push
    sp = np.hypot(v[:, 0], v[:, 1]); slow = ins & (sp < 350); v[slow] *= 1.02
    pos[idx] = p; vel[idx] = v
    # escaped balls that leave the screen are gone
    gone = out[idx] & ((p[:, 1] > H + 40) | (p[:, 0] < -40) | (p[:, 0] > W + 40)); alive[idx[gone]] = False
    inside = int((alive[:n] & ~out[:n]).sum())
    if inside >= MAXIN and state['shatter'] is None:
        state['shatter'] = t; events.append((t, 'shatter', 1))
        # ring breaks: everything inside gets released
        rel = np.nonzero(alive[:n] & ~out[:n])[0]; out[rel] = True
    return inside
def ball_r():
    if state['shatter'] is not None: return 4.5
    m = int((alive[:n] & ~out[:n]).sum()) if n else 1
    return max(4.5, 15 - 2.6 * math.log10(max(1, m)))
# ---------- drawing ----------
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
BG = (np.clip(1 - np.hypot(xx - CX, yy - CY) / 1150, 0, 1) ** 1.5)[..., None] * np.array((34, 26, 30), np.float32) + np.array((12, 10, 14), np.float32)
BG = BG.astype(np.uint8); del yy, xx
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(img, s, y, fs, color, th):
    (tw, _), _ = cv2.getTextSize(s, FONT, fs, th); x = int(W / 2 - tw / 2)
    cv2.putText(img, s, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(img, s, (x, y), FONT, fs, color, th, cv2.LINE_AA)
def draw(t, inside, pulse):
    img = BG.copy()
    sh = state['shatter']
    # ring with gaps
    if sh is None:
        a0 = math.degrees(ring_angle(t)); gw = math.degrees(GAPW)
        for g in GAPS:
            gd = math.degrees(g)
        segs = []
        starts = sorted([(math.degrees(g) + a0 + gw / 2) for g in GAPS])
        for k, s0 in enumerate(starts):
            e0 = s0 + 180 - gw
            cv2.ellipse(img, (CX, CY), (RR, RR), 0, s0, e0, (90, 80, 90), RT + 14, cv2.LINE_AA)
            cv2.ellipse(img, (CX, CY), (RR, RR), 0, s0, e0, (245, 240, 245), RT, cv2.LINE_AA)
    else:
        # shards fly out
        u = t - sh
        for k in range(24):
            a = k / 24 * 2 * math.pi; d = RR + u * (300 + 40 * (k % 5)) ; y = CY + math.sin(a) * d + 0.5 * G * u * u * 0.6
            x = CX + math.cos(a) * d
            cv2.ellipse(img, (int(x), int(y)), (40, 8), math.degrees(a) + 90 + u * 200 * (1 if k % 2 else -1), 0, 360, (245, 240, 245), -1, cv2.LINE_AA)
    rad = int(round(ball_r()))
    idx = np.nonzero(alive[:n])[0]
    P = pos[idx]; C = PAL[col[idx]]; O = out[idx]
    gold = sh is not None
    for k in range(len(idx)):
        x, y = int(P[k, 0]), int(P[k, 1])
        if x < -20 or x > W + 20 or y < -20 or y > H + 20: continue
        c = C[k] * (0.55 if (O[k] and not gold) else 1.0)
        if gold: c = np.array((255, 205, 60), np.float32)
        cv2.circle(img, (x, y), rad, (int(c[2] * 0.72), int(c[1] * 0.72), int(c[0] * 0.72)), -1, cv2.LINE_AA)
        if rad >= 5: cv2.circle(img, (x - rad // 4, y - rad // 4), max(1, rad // 2), (int(min(255, c[2] + 50)), int(min(255, c[1] + 50)), int(min(255, c[0] + 50))), -1, cv2.LINE_AA)
    # text
    if gold: text_c(img, '10,000', 330, 4.4, (60, 205, 255), 12); text_c(img, 'THE RING BROKE', 440, 1.9, (255, 255, 255), 5)
    else:
        fs = 4.2 * (1 + 0.12 * pulse); text_c(img, f'{inside:,}', 330, fs, (240, 240, 240), 12)
        text_c(img, 'Every escape = 2 new balls', 440, 1.45, (120, 210, 255), 4)
        if t < 2.2: text_c(img, 'Can it reach 10,000?', 1640, 1.9, (255, 255, 255), 5)
    return img
if __name__ == '__main__':
    stills = [float(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 and sys.argv[1] != 'full' else None
    ff = None if stills is not None else subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', 'video.mp4'], stdin=subprocess.PIPE)
    lastesc = -9; end_t = None
    for f in range(int(TOTAL * FPS)):
        t = f / FPS
        for s in range(SUB):
            ne = len(events); inside = step(t + s * DT)
            if any(e[1] == 'escape' for e in events[ne:]): lastesc = t
        hist.append(inside)
        if state['shatter'] is not None and end_t is None: end_t = state['shatter'] + 2.8
        pulse = math.exp(-(t - lastesc) * 10)
        if ff: ff.stdin.write(draw(t, inside, pulse).tobytes())
        elif any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/e_{t:.1f}.jpg', draw(t, inside, pulse))
        if f % 60 == 0: print('t', round(t, 1), 'inside', inside, 'total', n, flush=True)
        if end_t is not None and t >= end_t: break
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'hist': hist, 'shatter': state['shatter'], 'end': t}, open('events.json', 'w'))
    print('end', round(t, 2), 'shatter', state['shatter'])
