# Balls scratch off silver foil to reveal a hidden picture. Every wall bounce adds a ball. Real physics.
import numpy as np, cv2, json, subprocess, sys, math
W, H, FPS, SUB = 1080, 1920, 30, 3
DT = 1 / (FPS * SUB)
X0, X1, Y0, Y1 = 60, 1020, 470, 1590
BR, BRUSH, MAXB = 14, 17, 70
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 3)
# hidden picture: crop to the play area
img = cv2.imread('hdf.png'); ih, iw = img.shape[:2]; aw, ah = X1 - X0, Y1 - Y0
s = max(aw / iw, ah / ih) * 1.0; big = cv2.resize(img, (int(iw * s) + 1, int(ih * s) + 1), interpolation=cv2.INTER_CUBIC)
ox = (big.shape[1] - aw) // 2; oy = (big.shape[0] - ah) // 2; PIC = big[oy:oy + ah, ox:ox + aw].copy()
# silver scratch-card foil
foil = np.full((ah, aw, 3), 178, np.float32); foil += rng.normal(0, 9, (ah, aw, 1)); yy, xx = np.mgrid[0:ah, 0:aw]
foil += (np.sin(xx * 0.02 + yy * 0.013) * 14)[..., None]; foil = cv2.GaussianBlur(foil, (0, 0), 1.2)
foil = np.clip(foil, 0, 255).astype(np.uint8)
for k in range(9):  # faint question marks pattern
    cv2.putText(foil, '?', (int(60 + (k % 3) * 320), int(260 + (k // 3) * 360)), cv2.FONT_HERSHEY_DUPLEX, 7, (150, 150, 155), 18, cv2.LINE_AA)
FOIL = np.clip(foil, 0, 255).astype(np.uint8)
mask = np.zeros((ah, aw), np.uint8)
pos = np.zeros((MAXB, 2)); vel = np.zeros((MAXB, 2)); n = 1
pos[0] = (aw * 0.3, ah * 0.25); vel[0] = (760, 560)
events = []
def step(t):
    global n
    p, v = pos[:n], vel[:n]
    p += v * DT
    born = 0
    for ax, lo, hi in ((0, BR, aw - BR), (1, BR, ah - BR)):
        lo_m = p[:, ax] < lo; hi_m = p[:, ax] > hi; m = lo_m | hi_m
        if m.any():
            v[m, ax] *= -1; p[lo_m, ax] = lo; p[hi_m, ax] = hi
            cand = np.nonzero(m)[0]; cand = cand[rng.random(len(cand)) < 0.3]
            k = min(len(cand), MAXB - n)
            if k > 0:
                src = cand[:k]; new = slice(n, n + k)
                a = rng.uniform(0, 2 * np.pi, k); sp = rng.uniform(600, 900, k)
                pos[new] = pos[src]; vel[new, 0] = np.cos(a) * sp; vel[new, 1] = np.sin(a) * sp
                n += k; born += k; p, v = pos[:n], vel[:n]
            events.append((t, 'bounce', int(m.sum())))
    for k in range(n): cv2.circle(mask, (int(p[k, 0]), int(p[k, 1])), BRUSH, 255, -1)
    return born
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(im, s_, y, fs, color, th):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); x = int(W / 2 - tw / 2)
    cv2.putText(im, s_, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
BG = np.full((H, W, 3), 14, np.uint8)
def frame(t, pct, done):
    im = BG.copy()
    if done is None:
        m3 = (mask > 0)[..., None]; area = np.where(m3, PIC, FOIL)
        im[Y0:Y1, X0:X1] = area
        for k in range(n):
            x, y = int(pos[k, 0] + X0), int(pos[k, 1] + Y0)
            cv2.circle(im, (x + 3, y + 4), BR, (10, 10, 10), -1, cv2.LINE_AA)
            cv2.circle(im, (x, y), BR, (215, 220, 228), -1, cv2.LINE_AA); cv2.circle(im, (x - 4, y - 5), 6, (255, 255, 255), -1, cv2.LINE_AA)
        cv2.rectangle(im, (X0 - 4, Y0 - 4), (X1 + 4, Y1 + 4), (230, 230, 235), 4, cv2.LINE_AA)
        text_c(im, f'{pct}%', 300, 4.0, (240, 240, 240), 11)
        text_c(im, "What's under the foil?", 405, 1.7, (120, 210, 255), 5)
    else:
        # full reveal: slow push in on the real photo, then the twist
        u = t - done; z = 1 + 0.18 * min(1, u / 6); zw, zh = int(aw / z), int(ah / z); cx, cy = int(aw * 0.555), int(ah * 0.52)
        x0 = int(np.clip(cx - zw / 2, 0, aw - zw)); y0 = int(np.clip(cy - zh / 2, 0, ah - zh))
        im[Y0:Y1, X0:X1] = cv2.resize(PIC[y0:y0 + zh, x0:x0 + zw], (aw, ah), interpolation=cv2.INTER_CUBIC)
        fl = max(0, 1 - u * 3);
        if fl > 0: im = cv2.addWeighted(im, 1, np.full_like(im, 255), fl * 0.6, 0)
        cv2.rectangle(im, (X0 - 4, Y0 - 4), (X1 + 4, Y1 + 4), (230, 230, 235), 4, cv2.LINE_AA)
        text_c(im, '100%', 300, 4.0, (60, 215, 255), 11)
        if u > 0.6: text_c(im, 'This is a real photo of space.', 405, 1.45, (255, 255, 255), 4)
        if u > 2.4: text_c(im, 'Almost every dot', 1700, 1.9, (255, 255, 255), 5)
        if u > 3.3: text_c(im, 'is a whole GALAXY.', 1790, 1.9, (60, 215, 255), 5)
    return im
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    stills = None if mode in ('full', 'sim') else [float(x) for x in mode.split(',')]
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'scratch.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    done = None; t = 0; hist = []
    for f in range(int(60 * FPS)):
        t = f / FPS
        if done is None:
            for s_ in range(SUB): step(t + s_ * DT)
            pct = int(min(100, (mask > 0).mean() * 100 / 0.985))
            if pct >= 100: done = t; events.append((t, 'done', 1))
        hist.append((n, pct))
        if ff: ff.stdin.write(frame(t, pct, done).tobytes())
        elif stills and any(abs(t - x) < 0.5 / FPS for x in stills): cv2.imwrite(f'/tmp/np/s2_{t:.1f}.jpg', frame(t, pct, done))
        if done is not None and t > done + 7.0: break
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'events': events, 'done': done, 'end': t, 'hist': hist}, open('scratch_events.json', 'w')); print('done at', done, 'balls', n, 'end', t)
