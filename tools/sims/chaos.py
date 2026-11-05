# 1,000 balls dropped from the same spot, each one atom apart. Pure deterministic physics -> chaos.
import numpy as np, cv2, json, subprocess, sys, math, colorsys
W, H, FPS, SUB = 1080, 1920, 30, 40
DT = 1 / (FPS * SUB)
N = 1000; R = 1.0; GRAV = 9.81 * 0.55
PEGS = np.array([(-0.36, 0.22, 0.13), (0.36, 0.22, 0.13), (0.0, 0.52, 0.13)])  # x, y (down is +), radius, in metres
CX, CY, PX = 540, 1050, 470                         # screen centre, pixels per metre
TOTAL = 26.0
X0 = float(sys.argv[2]) if len(sys.argv) > 2 else 0.033
pos = np.zeros((N, 2)); vel = np.zeros((N, 2))
pos[:, 0] = X0 + (np.arange(N) - N / 2) * 1e-12      # 1 picometre apart (smaller than an atom)
pos[:, 1] = -0.78
def step():
    global pos, vel
    vel[:, 1] += GRAV * DT; pos += vel * DT
    # circular wall (inside)
    d = np.hypot(pos[:, 0], pos[:, 1]); m = d > R
    if m.any():
        n = pos[m] / d[m, None]; vn = (vel[m] * n).sum(1, keepdims=True); vel[m] -= 2 * np.maximum(vn, 0) * n; pos[m] = n * (2 * R - d[m, None])
    for px, py, pr in PEGS:
        dx, dy = pos[:, 0] - px, pos[:, 1] - py; d = np.hypot(dx, dy); m = d < pr
        if m.any():
            n = np.stack([dx[m], dy[m]], 1) / d[m, None]; vn = (vel[m] * n).sum(1, keepdims=True)
            vel[m] -= 2 * np.minimum(vn, 0) * n; pos[m] = np.array([px, py]) + n * (2 * pr - d[m, None])
def fmt_len(m):
    for u, s in [(1, 'm'), (1e-2, 'cm'), (1e-3, 'mm'), (1e-6, 'um'), (1e-9, 'nm'), (1e-12, 'pm')]:
        if m >= u: v = m / u; return (f'{v:.2f}' if v < 10 else f'{v:.1f}' if v < 100 else f'{v:.0f}') + ' ' + s
    return f'{m / 1e-12:.2f} pm'
HUE = np.array([[int(v * 255) for v in colorsys.hsv_to_rgb(0.95 * i / N, 0.85, 1.0)][::-1] for i in range(N)], np.float32)
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_l(im, s_, x, y, fs, color, th):
    cv2.putText(im, s_, (x + 2, y + 3), FONT, fs, (0, 0, 0), th + 4, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
def text_c(im, s_, y, fs, color, th):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); text_l(im, s_, int(W / 2 - tw / 2), y, fs, color, th)
CHAPTERS = [(0.0, '1,000 BALLS. SAME SPOT.', 'each one smaller than an ATOM apart'), (5.0, 'WATCH THE SPREAD', 'every bounce makes it bigger'), (11.0, 'THE BUTTERFLY EFFECT', 'tiny differences explode'), (17.0, 'NOTHING HERE IS RANDOM', 'same balls. same physics.'), (22.0, 'AND YET...', 'nobody could predict this')]
acc = np.zeros((H, W, 3), np.float32)
def scr(p): return np.stack([CX + p[:, 0] * PX, CY + p[:, 1] * PX], 1)
def frame(t, prev, cur, gap):
    global acc
    acc *= 0.86  # light trails fade
    a, b = scr(prev), scr(cur)
    lay = np.zeros((H, W, 3), np.float32)
    spread = gap > 0.004
    for i in range(0, N, 1 if spread else 25):
        cv2.line(lay, (int(a[i, 0]), int(a[i, 1])), (int(b[i, 0]), int(b[i, 1])), (HUE[i].tolist() if spread else [255, 255, 255]), 2, cv2.LINE_AA)
    acc += lay * (0.2 if spread else 1.0)
    im = np.clip(acc, 0, 255).astype(np.uint8)
    im = cv2.add(im, cv2.GaussianBlur(im, (0, 0), 6))
    cv2.circle(im, (CX, CY), int(R * PX), (90, 90, 100), 2, cv2.LINE_AA)
    for px, py, pr in PEGS: cv2.circle(im, (int(CX + px * PX), int(CY + py * PX)), int(pr * PX), (200, 200, 210), 2, cv2.LINE_AA)
    # balls
    for i in range(0, N, 1 if spread else 50):
        cv2.circle(im, (int(b[i, 0]), int(b[i, 1])), 5, (HUE[i].tolist() if spread else [255, 255, 255]), -1, cv2.LINE_AA)
    ch = [c for c in CHAPTERS if t >= c[0]][-1]
    text_c(im, ch[1], 300, 2.0, (255, 255, 255), 6); text_c(im, ch[2], 375, 1.15, (170, 170, 180), 3)
    # gap readout
    text_l(im, 'SPREAD', 120, 1700, 0.9, (140, 140, 150), 2)
    text_l(im, fmt_len(gap), 120, 1790, 2.2, (120, 230, 160), 6)
    bar = int(min(1, max(0, (math.log10(max(gap, 1e-9)) + 9) / 9.3)) * 840); cv2.line(im, (120, 1830), (960, 1830), (50, 50, 55), 6); cv2.line(im, (120, 1830), (120 + bar, 1830), (120, 230, 160), 6)
    return im
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    stills = None if mode in ('full', 'sim') else [float(x) for x in mode.split(',')]
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'chaos.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    gaps = []; bounces = []
    for f in range(int(TOTAL * FPS)):
        t = f / FPS; prev = pos.copy(); v0 = vel.copy()
        for s in range(SUB): step()
        gap = float(np.max(np.hypot(*(pos - pos.mean(0)).T)) * 2) if True else 0
        gap = min(2.0, max(gap, 1e-12 * N)); gaps.append(gap)
        bounces.append(int((np.sign(v0[:, 1]) != np.sign(vel[:, 1])).sum()))
        if ff: ff.stdin.write(frame(t, prev, pos, gap).tobytes())
        elif stills:
            im = frame(t, prev, pos, gap)
            if any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/ch_{t:.1f}.jpg', im)
        if mode == 'sim' and f % 30 == 0: print(round(t), fmt_len(gap))
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'gaps': gaps, 'bounces': bounces}, open('chaos_events.json', 'w')); print('done')
