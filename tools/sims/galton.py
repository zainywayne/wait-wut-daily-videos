# What happens if you drop 2,000 balls through 14 rows of pegs? (Galton board -> bell curve)
import numpy as np, cv2, json, subprocess, sys, math
W, H, FPS, SUB = 1080, 1920, 30, 5
DT = 1 / (FPS * SUB)
G = 2200.0; BR = 4.0; NB = 1500; DROP_T0, DROP_T1 = 1.0, 12.0
SP = 58; ROWS = 14; PEG_R = 6; PY0 = 560; RSP = SP * 0.86
PEGS = np.array([(W / 2 + (k - r / 2) * SP, PY0 + r * RSP) for r in range(ROWS) for k in range(r + 1)])
BIN_TOP = PY0 + (ROWS - 1) * RSP + 40; FLOOR = 1760
NBINS = ROWS + 1; BX0 = W / 2 - NBINS * SP / 2
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 2)
PER_ROW = int((SP - 6) // (2 * BR)); ROWH = 2 * BR - 0.4
HOP = 0.075; D0 = 0.2
TB = np.sort(rng.uniform(DROP_T0, DROP_T1, NB)); TB[0] = DROP_T0
CH = rng.integers(0, 2, (NB, ROWS))           # every peg is a coin flip: 0 = left, 1 = right
XS = np.zeros((NB, ROWS + 1))                 # x above peg row r (and after the last row)
for r in range(ROWS + 1): XS[:, r] = W / 2 + (CH[:, :r].sum(1) - r / 2) * SP if r else W / 2
BIN = CH.sum(1)                               # bin index 0..ROWS
LASTY = PY0 + (ROWS - 1) * RSP
# landing order -> stack slot (balls that land first go to the bottom)
FALL_T = np.sqrt(2 * (FLOOR - 200 - LASTY) / G)
TL = TB + D0 + ROWS * HOP + FALL_T
SLOT = np.zeros(NB, int)
for b in range(NBINS):
    ii = np.nonzero(BIN == b)[0]; ii = ii[np.argsort(TL[ii])]; SLOT[ii] = np.arange(len(ii))
def slot_xy(b, k): return (BX0 + b * SP + 5 + BR + (k % PER_ROW) * (2 * BR) + ((k // PER_ROW) % 2) * BR * 0.5, FLOOR - BR - (k // PER_ROW) * ROWH)
pos = np.zeros((NB, 2)); state = np.zeros(NB, int); nd = [0]; events = []; settle = [[] for _ in range(NBINS)]
def ball_xy(i, t):
    u = t - TB[i]
    if u < D0: f = (u / D0) ** 2; return (W / 2, 470 + (PY0 - PEG_R - BR - 470) * f), 1
    u -= D0; r = int(u // HOP)
    if r < ROWS:
        f = (u - r * HOP) / HOP; x = XS[i, r] + (XS[i, r + 1] - XS[i, r]) * f
        y0 = PY0 + r * RSP - PEG_R - BR; y1 = y0 + RSP; y = y0 + (y1 - y0) * f * f - 16 * math.sin(math.pi * f)
        return (x, y), 1
    u -= ROWS * HOP; sx, sy = slot_xy(BIN[i], SLOT[i]); y = LASTY - PEG_R + 0.5 * G * u * u + 240 * u
    if y >= sy: return (sx, sy), 2
    x = XS[i, ROWS] + (sx - XS[i, ROWS]) * min(1, u / 0.25)
    return (x, y), 1
def step(t):
    nd[0] = int(np.searchsorted(TB, t, 'right'))
    for i in range(nd[0]):
        if state[i] == 2: continue
        (x, y), st = ball_xy(i, t); pos[i] = (x, y)
        if st == 2 and state[i] != 2: settle[BIN[i]].append(i); events.append((t, 'land', int(BIN[i])))
        prev_r = int((t - 1 / FPS - TB[i] - D0) // HOP); cur_r = int((t - TB[i] - D0) // HOP)
        if 0 <= cur_r < ROWS and cur_r != prev_r: events.append((t, 'peg', cur_r))
        state[i] = st
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(im, s_, y, fs, color, th):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); x = int(W / 2 - tw / 2)
    cv2.putText(im, s_, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
BG = (np.array((16, 11, 10), np.float32) + (np.clip(1 - np.hypot(xx - W / 2, yy - 1100) / 1150, 0, 1) ** 1.7)[..., None] * np.array((40, 28, 22), np.float32)).astype(np.uint8); del yy, xx
def bcol(x):  # colour by horizontal position (warm in the middle, cool at the edges)
    u = abs(x - W / 2) / (NBINS * SP / 2); return (int(60 + 180 * u), int(200 - 60 * u), int(255 - 150 * u))
def draw(t, reveal):
    im = BG.copy()
    # funnel
    cv2.line(im, (int(W / 2 - 160), 400), (int(W / 2 - 18), 480), (200, 200, 210), 6, cv2.LINE_AA); cv2.line(im, (int(W / 2 + 160), 400), (int(W / 2 + 18), 480), (200, 200, 210), 6, cv2.LINE_AA)
    for x, y in PEGS: cv2.circle(im, (int(x), int(y)), PEG_R, (230, 230, 240), -1, cv2.LINE_AA)
    for b in range(NBINS + 1):
        x = int(BX0 + b * SP); cv2.line(im, (x, int(BIN_TOP)), (x, FLOOR), (110, 110, 120), 3)
    cv2.line(im, (int(BX0), FLOOR + 2), (int(BX0 + NBINS * SP), FLOOR + 2), (200, 200, 210), 4)
    for i in range(nd[0]):
        x, y = pos[i]; cv2.circle(im, (int(x), int(y)), int(BR + 0.5), bcol(x), -1, cv2.LINE_AA)
    # bell curve reveal
    if reveal > 0:
        tot = sum(len(s) for s in settle); mu = W / 2; sig = math.sqrt(ROWS) / 2 * SP
        pts = []
        for x in np.linspace(BX0, BX0 + NBINS * SP, 160):
            dens = tot * SP / (sig * math.sqrt(2 * math.pi)) * math.exp(-0.5 * ((x - mu) / sig) ** 2)
            h = (dens / PER_ROW) * (2 * BR - 0.6); pts.append((x, FLOOR - h))
        n = int(len(pts) * min(1, reveal))
        if n > 1:
            arr = np.array(pts[:n], np.int32); lay = np.zeros_like(im); cv2.polylines(lay, [arr], False, (120, 255, 255), 6, cv2.LINE_AA)
            im = cv2.add(im, cv2.addWeighted(lay, 1, cv2.GaussianBlur(lay, (0, 0), 10), 1.5, 0))
    left = nd[0]
    if t < 4.0: text_c(im, 'What happens if you drop', 150, 1.6, (255, 255, 255), 5); text_c(im, '1,500 balls through', 225, 1.6, (255, 255, 255), 5); text_c(im, '14 rows of pegs?', 300, 1.6, (255, 255, 255), 5)
    elif reveal <= 0: text_c(im, f'{left:,} / 1,500', 230, 2.4, (255, 255, 255), 7); text_c(im, 'Every peg is a 50/50 coin flip', 320, 1.2, (170, 200, 230), 3)
    else:
        text_c(im, 'It ALWAYS makes', 190, 2.0, (255, 255, 255), 6); text_c(im, 'THIS shape.', 290, 2.2, (120, 255, 255), 7)
        if reveal > 1.6: text_c(im, 'The bell curve.', 1855, 1.6, (255, 255, 255), 5)
    if 4.0 <= t < 7.5 and reveal <= 0: text_c(im, 'Guess the shape before it ends', 1855, 1.2, (200, 200, 210), 3)
    return im
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    stills = None if mode in ('full', 'sim') else [float(x) for x in mode.split(',')]
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'galton.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    done_t = None; t = 0
    for f in range(int(40 * FPS)):
        t = f / FPS
        step(t)
        if done_t is None and nd[0] >= NB and (state == 2).all(): done_t = t; events.append((t, 'done', 0))
        reveal = 0 if done_t is None else (t - done_t + 0.01) / 1.0
        if ff: ff.stdin.write(draw(t, reveal).tobytes())
        elif stills and any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/ga_{t:.1f}.jpg', draw(t, reveal))
        if done_t is not None and t > done_t + 4.0: break
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'done': done_t, 'end': t}, open('galton_events.json', 'w'))
    print('done', done_t, 'bins', [len(s) for s in settle])
