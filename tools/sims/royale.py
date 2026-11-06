# Pick a ball. 12 balls bounce in a shrinking ring with a spinning laser. Touch the laser = eliminated. Last one alive wins.
import numpy as np, cv2, json, subprocess, sys, math
W, H, FPS, SUB = 1080, 1920, 30, 4
DT = 1 / (FPS * SUB)
CX, CY = 540, 1040
R0, R1 = 480, 175
BR = 38; SPEED = 430
NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PINK', 'ORANGE', 'PURPLE', 'CYAN', 'WHITE', 'LIME', 'BROWN', 'GOLD']
COLS = [(60, 60, 235), (235, 120, 40), (70, 200, 70), (40, 220, 245), (180, 90, 255), (30, 140, 255), (200, 70, 150), (230, 210, 40), (240, 240, 240), (60, 240, 170), (40, 80, 140), (40, 190, 230)]  # BGR
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1
rng = np.random.default_rng(seed)
N = len(NAMES)
ang = np.linspace(0, 2 * np.pi, N, endpoint=False) + rng.uniform(0, 1)
pos = np.stack([CX + np.cos(ang) * 300, CY + np.sin(ang) * 300], 1)
va = rng.uniform(0, 2 * np.pi, N); vel = np.stack([np.cos(va), np.sin(va)], 1) * SPEED
alive = np.ones(N, bool); dead_t = np.full(N, -1.0)
events = []; parts = []; LAST = [-9.0]
COOL = 1.7
def armed(t): return t > 2.6 and t - LAST[0] > COOL
def ring_r(t): return R1 + (R0 - R1) * max(0, 1 - t / 24) ** 1.3
def arms(t): return 1 if t < 9 else (2 if t < 17 else 3)
def laser_ang(t): return 0.6 + 0.9 * t + 0.025 * t * t
def step(t):
    global pos, vel
    pos[alive] += vel[alive] * DT
    rr = ring_r(t)
    idx = np.nonzero(alive)[0]
    # ball-ball elastic bumps
    for a in range(len(idx)):
        for b in range(a + 1, len(idx)):
            i, j = idx[a], idx[b]; d = pos[j] - pos[i]; dist = math.hypot(*d)
            if dist < 2 * BR and dist > 1e-6:
                nrm = d / dist; rv = (vel[j] - vel[i]) @ nrm
                if rv < 0: vel[i] += rv * nrm; vel[j] -= rv * nrm; events.append((t, 'bump', 1))
                ov = (2 * BR - dist) / 2; pos[i] -= nrm * ov; pos[j] += nrm * ov
    # ring wall
    for i in idx:
        d = pos[i] - (CX, CY); dist = math.hypot(*d)
        if dist > rr - BR:
            nrm = d / dist; vn = vel[i] @ nrm
            if vn > 0: vel[i] -= 2 * vn * nrm; events.append((t, 'wall', 1))
            pos[i] = np.array((CX, CY)) + nrm * (rr - BR)
        sp = math.hypot(*vel[i]); vel[i] *= SPEED / max(sp, 1)
    # laser arms from the centre hub out to the ring
    for k in range(arms(t)):
        a = laser_ang(t) + k * 2 * math.pi / arms(t); ux, uy = math.cos(a), math.sin(a)
        for i in np.nonzero(alive)[0]:
            rx, ry = pos[i, 0] - CX, pos[i, 1] - CY; along = rx * ux + ry * uy
            if along < 40: continue
            perp = abs(-rx * uy + ry * ux)
            if perp < BR - 4 and alive.sum() > 1 and armed(t):
                LAST[0] = t; alive[i] = False; dead_t[i] = t; events.append((t, 'out', int(i)))
                for q in range(40):
                    aa = rng.uniform(0, 2 * np.pi); sp = rng.uniform(150, 700)
                    parts.append([pos[i, 0], pos[i, 1], math.cos(aa) * sp, math.sin(aa) * sp, t, i])
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(im, s_, y, fs, color, th, x=None):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); x = int(W / 2 - tw / 2) if x is None else int(x - tw / 2)
    cv2.putText(im, s_, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
BG = (np.array((14, 10, 12), np.float32) + (np.clip(1 - np.hypot(xx - CX, yy - CY) / 1100, 0, 1) ** 1.6)[..., None] * np.array((34, 26, 30), np.float32)).astype(np.uint8); del yy, xx
def draw(t, shake, winner, win_t):
    im = BG.copy(); rr = ring_r(t)
    cv2.circle(im, (CX, CY), int(rr + 8), (80, 80, 90), 18, cv2.LINE_AA); cv2.circle(im, (CX, CY), int(rr + 8), (240, 240, 245), 5, cv2.LINE_AA)
    # lasers with glow
    lay = np.zeros_like(im)
    if winner is None:
        for k in range(arms(t)):
            a = laser_ang(t) + k * 2 * math.pi / arms(t); ex, ey = CX + math.cos(a) * rr, CY + math.sin(a) * rr
            on = armed(t); chg = min(1, max(0, (t - LAST[0]) / COOL)) if t > 2.6 else min(1, t / 2.6)
            c1 = (40, 40, 255) if on else (int(60 * chg), int(60 * chg), int(120 + 80 * chg)); c2 = (200, 200, 255) if on else (90, 90, 140)
            cv2.line(lay, (CX, CY), (int(ex), int(ey)), c1, 26 if on else 10, cv2.LINE_AA)
            cv2.line(lay, (CX, CY), (int(ex), int(ey)), c2, 8 if on else 3, cv2.LINE_AA)
    glow = cv2.GaussianBlur(lay, (0, 0), 14); im = cv2.add(im, cv2.addWeighted(lay, 0.9, glow, 1.2, 0))
    cv2.circle(im, (CX, CY), 40, (60, 60, 70), -1, cv2.LINE_AA); cv2.circle(im, (CX, CY), 40, (200, 200, 210), 4, cv2.LINE_AA)
    # particles
    for p_ in parts:
        u = t - p_[4]
        if 0 <= u < 0.9:
            x = p_[0] + p_[2] * u; y = p_[1] + p_[3] * u + 300 * u * u; c = COLS[p_[5]]
            cv2.circle(im, (int(x), int(y)), max(1, int(9 * (1 - u))), c, -1, cv2.LINE_AA)
    # balls
    for i in range(N):
        if not alive[i]: continue
        x, y = int(pos[i, 0]), int(pos[i, 1]); c = COLS[i]
        big = 1.0 if winner is None else 1 + 0.6 * min(1, (t - win_t) / 0.6)
        r = int(BR * big)
        cv2.circle(im, (x + 4, y + 6), r, (8, 8, 10), -1, cv2.LINE_AA)
        cv2.circle(im, (x, y), r, (int(c[0] * 0.7), int(c[1] * 0.7), int(c[2] * 0.7)), -1, cv2.LINE_AA)
        cv2.circle(im, (x - r // 4, y - r // 4), int(r * 0.6), c, -1, cv2.LINE_AA)
        cv2.circle(im, (x - r // 3, y - r // 3), max(3, r // 5), (255, 255, 255), -1, cv2.LINE_AA)
        fs = 0.62 * big; (tw, th_), _ = cv2.getTextSize(NAMES[i], FONT, fs, 2)
        cv2.putText(im, NAMES[i], (x - tw // 2 + 2, y + r + 30 + 2), FONT, fs, (0, 0, 0), 5, cv2.LINE_AA); cv2.putText(im, NAMES[i], (x - tw // 2, y + r + 30), FONT, fs, (255, 255, 255), 2, cv2.LINE_AA)
    # header
    left = int(alive.sum())
    if winner is None:
        text_c(im, f'{left} LEFT', 300, 3.2, (255, 255, 255), 10)
        last = [e for e in events if e[1] == 'out']
        if last and t - last[-1][0] < 1.0: text_c(im, f'{NAMES[last[-1][2]]} IS OUT', 410, 1.7, COLS[last[-1][2]], 5)
        elif t < 3.2: text_c(im, 'Pick a ball.', 410, 1.8, (120, 210, 255), 5)
        if t < 3.2: text_c(im, 'Touch the laser = OUT', 1680, 1.6, (255, 255, 255), 5); text_c(im, 'Last one alive wins', 1760, 1.6, (255, 255, 255), 5)
        else: text_c(im, 'Comment who you picked', 1740, 1.3, (190, 190, 200), 4)
    else:
        text_c(im, f'{NAMES[winner]} WINS!', 330, 3.0, COLS[winner], 10)
        text_c(im, 'Did your ball win?', 1740, 1.6, (255, 255, 255), 5)
    if shake > 0.01:
        dx, dy = int(rng.normal(0, 14 * shake)), int(rng.normal(0, 14 * shake)); im = np.roll(im, (dy, dx), (0, 1))
    return im
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    stills = None if mode in ('full', 'sim') else [float(x) for x in mode.split(',')]
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'royale.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    winner = None; win_t = None; t = 0; outs = []
    for f in range(int(40 * FPS)):
        t = f / FPS
        if winner is None:
            for s in range(SUB): step(t + s * DT)
            if alive.sum() == 1: winner = int(np.nonzero(alive)[0][0]); win_t = t; events.append((t, 'win', winner))
        last = [e for e in events if e[1] == 'out']; shake = math.exp(-(t - last[-1][0]) * 8) if last else 0
        if ff: ff.stdin.write(draw(t, shake, winner, win_t).tobytes())
        elif stills and any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/ro_{t:.1f}.jpg', draw(t, shake, winner, win_t))
        if winner is not None and t > win_t + 3.0: break
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'win_t': win_t, 'end': t}, open('royale_events.json', 'w'))
    outs = [round(e[0], 1) for e in events if e[1] == 'out']
    print('seed', seed, 'winner', NAMES[winner] if winner is not None else None, 'at', round(win_t or 0, 1), 'outs', outs)
