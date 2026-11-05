# How many times would you have to fold paper to reach the Moon? Each fold doubles the thickness.
import numpy as np, cv2, json, subprocess, sys, math
W, H, FPS = 1080, 1920, 30
T0 = 0.1e-3                      # paper thickness, metres
NF = 42; FOLD_T = 0.5; START = 1.2; TOTAL = START + NF * FOLD_T + 4.5
GY = 1560                        # ground line on screen
COL_X, COL_W = 330, 150          # paper column
TARGET_PX = 1000.0               # paper column height on screen
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(im, s_, y, fs, color, th, x=None):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); x = int(W / 2 - tw / 2) if x is None else int(x - tw / 2)
    cv2.putText(im, s_, (x + 3, y + 4), FONT, fs, (0, 0, 0), th + 5, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
def fmt(m):
    if m < 0.01: return f'{m * 1000:.1f} mm'
    if m < 1: return f'{m * 100:.1f} cm'
    if m < 1000: return f'{m:,.0f} m' if m >= 10 else f'{m:.1f} m'
    return f'{m / 1000:,.0f} km'
def folds_at(t):
    if t < START: return 0.0
    k = (t - START) / FOLD_T; i = int(k); u = k - i
    if i >= NF: return float(NF)
    return i + (u * u * (3 - 2 * u))  # eased doubling each fold
# reference objects: (name, height m, fold index where caption shows, drawer)
def d_coin(im, x, y, s):
    r = max(2, int(0.012 * s)); cv2.circle(im, (x, y - r), r, (70, 160, 215), -1, cv2.LINE_AA); cv2.circle(im, (x, y - r), r, (40, 110, 170), max(1, r // 10), cv2.LINE_AA); cv2.circle(im, (x, y - r), int(r * 0.78), (40, 110, 170), max(1, r // 30), cv2.LINE_AA)
    if r > 40:
        (tw, th_), _ = cv2.getTextSize('1', FONT, r / 40, max(1, r // 12)); cv2.putText(im, '1', (x - tw // 2, y - r + th_ // 2), FONT, r / 40, (40, 110, 170), max(1, r // 12), cv2.LINE_AA)
def d_phone(im, x, y, s): h = int(0.147 * s); w = int(0.071 * s); cv2.rectangle(im, (x - w // 2, y - h), (x + w // 2, y), (40, 40, 45), -1, cv2.LINE_AA); cv2.rectangle(im, (x - w // 2 + max(1, w // 12), y - h + max(1, h // 14)), (x + w // 2 - max(1, w // 12), y - max(1, h // 14)), (170, 120, 60), -1)
def d_person(im, x, y, s):
    h = 1.75 * s; hr = int(h * 0.07); cv2.circle(im, (x, int(y - h + hr)), max(1, hr), (190, 200, 210), -1, cv2.LINE_AA)
    cv2.rectangle(im, (int(x - h * 0.11), int(y - h * 0.82)), (int(x + h * 0.11), int(y - h * 0.45)), (200, 140, 70), -1)
    cv2.rectangle(im, (int(x - h * 0.1), int(y - h * 0.45)), (int(x + h * 0.1), y), (90, 70, 60), -1)
def d_house(im, x, y, s):
    h = 9 * s; w = 10 * s; cv2.rectangle(im, (int(x - w / 2), int(y - h * 0.6)), (int(x + w / 2), y), (150, 200, 230), -1)
    pts = np.array([(x - w * 0.6, y - h * 0.6), (x + w * 0.6, y - h * 0.6), (x, y - h)], np.int32); cv2.fillPoly(im, [pts], (60, 70, 180), cv2.LINE_AA)
def d_burj(im, x, y, s):
    h = 828 * s; pts = np.array([(x - h * 0.06, y), (x + h * 0.06, y), (x + h * 0.025, y - h * 0.6), (x + h * 0.006, y - h * 0.85), (x, y - h), (x - h * 0.006, y - h * 0.85), (x - h * 0.025, y - h * 0.6)], np.int32)
    cv2.fillPoly(im, [pts], (200, 190, 175), cv2.LINE_AA)
def d_everest(im, x, y, s):
    h = 8849 * s; pts = np.array([(x - h * 1.1, y), (x + h * 1.1, y), (x, y - h)], np.int32); cv2.fillPoly(im, [pts], (110, 105, 100), cv2.LINE_AA)
    sn = np.array([(x - h * 0.28, y - h * 0.75), (x + h * 0.28, y - h * 0.75), (x, y - h)], np.int32); cv2.fillPoly(im, [sn], (245, 245, 250), cv2.LINE_AA)
def d_plane(im, x, y, s):
    yy = int(y - 11000 * s); L = 60; cv2.ellipse(im, (x, yy), (L, 9), 0, 0, 360, (230, 230, 235), -1, cv2.LINE_AA)
    cv2.fillPoly(im, [np.array([(x - 5, yy), (x + 15, yy), (x - 15, yy + 40), (x - 30, yy + 40)], np.int32)], (200, 200, 210), cv2.LINE_AA)
    cv2.line(im, (x, yy + 4), (x, y), (90, 90, 100), 1)
def d_iss(im, x, y, s):
    yy = int(y - 408000 * s); cv2.rectangle(im, (x - 50, yy - 4), (x + 50, yy + 4), (200, 200, 205), -1)
    for dx in (-45, 35): cv2.rectangle(im, (x + dx, yy - 26), (x + dx + 10, yy + 26), (140, 90, 40), -1)
    cv2.line(im, (x, yy + 30), (x, y), (90, 90, 100), 1)
OBJS = [('Coin', 0.024, 8, d_coin), ('Phone', 0.147, 11, d_phone), ('You', 1.75, 14, d_person), ('House', 9, 17, d_house), ('Burj Khalifa', 828, 23, d_burj), ('Mount Everest', 8849, 27, d_everest), ('Planes fly here', 11000, 27, d_plane), ('Space Station', 408000, 32, d_iss)]
CAPS = {8: 'Taller than a coin', 11: 'Taller than a phone', 14: 'Taller than YOU', 17: 'Taller than a house', 23: 'Taller than the Burj Khalifa', 27: 'Higher than planes fly', 30: "You're in space now", 32: 'Past the Space Station', 36: 'Still going...', 40: 'Almost there...'}
MOON_D = 384400e3; EARTH_R = 6371e3
rs = np.random.default_rng(3); STARS = [(int(rs.uniform(0, W)), int(rs.uniform(0, H)), rs.uniform(0.3, 1)) for _ in range(260)]
def frame(t):
    f = folds_at(t); hgt = T0 * 2 ** f; s = min(TARGET_PX, 30 * 2 ** f) / hgt   # pixels per metre (zoom out once the stack is tall)
    space = min(1, max(0, (math.log10(hgt) - 3.5) / 1.5))
    top = np.array((40, 25, 18)) * (1 - space) + np.array((12, 6, 6)) * space; bot = np.array((70, 50, 35)) * (1 - space) + np.array((20, 12, 10)) * space
    im = (np.linspace(0, 1, H)[:, None, None] * (bot - top) + top).repeat(W, 1).astype(np.uint8)
    if space > 0:
        for x, y, b in STARS: v = int(255 * b * space); cv2.circle(im, (x, y), 1 if b < 0.7 else 2, (v, v, v), -1)
    # Earth below the ground once we're high up (curvature shows)
    er = EARTH_R * s
    if er < 60000:
        cv2.circle(im, (W // 2, int(GY + er)), int(er), (150, 95, 40), -1, cv2.LINE_AA); cv2.circle(im, (W // 2, int(GY + er)), int(er), (255, 200, 120), 3, cv2.LINE_AA)
    else: cv2.rectangle(im, (0, GY), (W, H), (40, 60, 45), -1); cv2.line(im, (0, GY), (W, GY), (90, 130, 100), 3)
    # Moon
    my = GY - MOON_D * s; mr = max(34, 1737e3 * s)
    if my > -mr: cv2.circle(im, (W // 2 + 170, int(my)), int(mr), (215, 215, 220), -1, cv2.LINE_AA); cv2.circle(im, (W // 2 + 160, int(my) - 8), int(mr * 0.25), (180, 180, 185), -1, cv2.LINE_AA); text_c(im, 'THE MOON', int(my - mr - 18), 1.3, (230, 230, 235), 4, x=W // 2 + 170)
    # reference objects
    for name, h, fi, fn in OBJS:
        ph = h * s
        if 30 < ph < 1050 or name in ('Planes fly here', 'Space Station') and 0 < h * s < 1450:
            fn(im, 760, GY, s)
            ly = int(GY - min(h * s, 1300) - 26)
            if name in ('Planes fly here', 'Space Station'): ly = int(GY - h * s - 50)
            if 60 < ly < GY: text_c(im, name, ly, 0.95, (230, 230, 235), 2, x=760)
    # paper stack with visible layers while it's thin
    ph = hgt * s; layers = 2 ** int(f)
    cv2.rectangle(im, (COL_X - COL_W // 2, int(GY - ph)), (COL_X + COL_W // 2, GY), (235, 242, 245), -1)
    if layers < 260:
        for k in range(1, layers): yk = int(GY - ph * k / layers); cv2.line(im, (COL_X - COL_W // 2, yk), (COL_X + COL_W // 2, yk), (170, 180, 185), 1)
    # the fold itself: a flap swinging over the top
    if START <= t < START + NF * FOLD_T:
        u = ((t - START) / FOLD_T) % 1
        if u < 0.5:
            a = u / 0.5 * math.pi; w2 = COL_W * math.cos(a) / 2; ytop = int(GY - ph)
            cv2.rectangle(im, (int(COL_X - COL_W / 2), ytop - 6), (int(COL_X - COL_W / 2 + COL_W * (1 - u)), ytop), (255, 255, 255), -1)
    glow = cv2.GaussianBlur(im, (0, 0), 10); im = cv2.addWeighted(im, 1, glow, 0.25, 0)
    # text
    n = int(min(NF, round(f) if f > 0 else 0))
    text_c(im, 'How many folds to', 120, 1.6, (255, 255, 255), 5); text_c(im, 'reach the Moon?', 185, 1.6, (255, 255, 255), 5)
    done = t >= START + NF * FOLD_T
    if done: text_c(im, f'Just {NF} folds!', 270, 1.8, (90, 235, 140), 5)
    else: text_c(im, f'{n} folds = {fmt(T0 * 2 ** n)}', 270, 1.6, (90, 235, 140), 5)
    cap = 'Each fold DOUBLES it' if f < 6.5 else None
    for k in sorted(CAPS):
        if n >= k: cap = CAPS[k]
    if done: cap = 'Paper 0.1 mm thick. 42 folds. Moon.'
    if cap: text_c(im, cap, 1740, 1.3, (255, 255, 255), 4)
    return im, n
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'fold.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    for fi in range(int(TOTAL * FPS)):
        t = fi / FPS; im, n = frame(t)
        if ff: ff.stdin.write(im.tobytes())
        elif any(abs(t - float(x)) < 0.5 / FPS for x in mode.split(',')): cv2.imwrite(f'/tmp/np/fo_{t:.1f}.jpg', im)
    if ff: ff.stdin.close(); ff.wait()
    json.dump({'start': START, 'fold_t': FOLD_T, 'nf': NF, 'total': TOTAL}, open('fold_meta.json', 'w')); print('done', TOTAL)
