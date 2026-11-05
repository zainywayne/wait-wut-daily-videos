# Sorting algorithms on a sunflower spiral of 600 coloured dots. Ends with the Stalin Sort gag.
import numpy as np, cv2, json, subprocess, sys, math, colorsys
W, H, FPS = 1080, 1920, 30
N = 600; CX, CY = 540, 1000
rng = np.random.default_rng(11)
# sunflower layout
K = np.arange(N); RAD = 14.8 * np.sqrt(K + 0.6); TH = K * math.radians(137.508)
PX = (CX + RAD * np.cos(TH)).astype(int); PY = (CY + RAD * np.sin(TH)).astype(int); DOT = 13
HUE = np.array([[int(c * 255) for c in colorsys.hsv_to_rgb(0.83 * v / N, 0.85, 1.0)][::-1] for v in range(N)], np.uint8)
class Rec:
    def __init__(self, a, samples):
        self.a = a; self.ops = 0; self.samples = samples; self.snaps = []; self.next = 0
    def tick(self, *idx):
        self.ops += 1
        while self.next < len(self.samples) and self.ops >= self.samples[self.next]:
            self.snaps.append((self.a.copy(), list(idx), self.ops)); self.next += 1
def bubble(a, r):
    n = len(a)
    for i in range(n):
        sw = False
        for j in range(n - 1 - i):
            r.tick(j, j + 1)
            if a[j] > a[j + 1]: a[j], a[j + 1] = a[j + 1], a[j]; sw = True
        if not sw: break
def insertion(a, r):
    for i in range(1, len(a)):
        j = i
        while j > 0 and a[j - 1] > a[j]: a[j - 1], a[j] = a[j], a[j - 1]; r.tick(j, j - 1); j -= 1
        r.tick(j)
def shell(a, r):
    g = len(a) // 2
    while g:
        for i in range(g, len(a)):
            j = i
            while j >= g and a[j - g] > a[j]: a[j - g], a[j] = a[j], a[j - g]; r.tick(j, j - g); j -= g
            r.tick(j)
        g //= 2
def quick(a, r, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    while lo < hi:
        p = a[(lo + hi) // 2]; i, j = lo, hi
        while i <= j:
            while a[i] < p: i += 1; r.tick(i)
            while a[j] > p: j -= 1; r.tick(j)
            if i <= j: a[i], a[j] = a[j], a[i]; r.tick(i, j); i += 1; j -= 1
        if j - lo < hi - i: quick(a, r, lo, j); lo = i
        else: quick(a, r, i, hi); hi = j
def merge(a, r, lo=0, hi=None):
    if hi is None: hi = len(a)
    if hi - lo < 2: return
    m = (lo + hi) // 2; merge(a, r, lo, m); merge(a, r, m, hi)
    left, right = a[lo:m].copy(), a[m:hi].copy(); i = j = 0; k = lo
    while i < len(left) or j < len(right):
        if j >= len(right) or (i < len(left) and left[i] <= right[j]): a[k] = left[i]; i += 1
        else: a[k] = right[j]; j += 1
        r.tick(k); k += 1
def heap(a, r):
    n = len(a)
    def sift(s, e):
        root = s
        while 2 * root + 1 <= e:
            c = 2 * root + 1
            if c + 1 <= e and a[c] < a[c + 1]: c += 1
            r.tick(root, c)
            if a[root] < a[c]: a[root], a[c] = a[c], a[root]; root = c
            else: return
    for s in range((n - 2) // 2, -1, -1): sift(s, n - 1)
    for e in range(n - 1, 0, -1): a[0], a[e] = a[e], a[0]; r.tick(0, e); sift(0, e - 1)
def radix(a, r):
    exp = 1
    while N // exp > 0:
        out = np.zeros_like(a); cnt = [0] * 10
        for i in range(len(a)): cnt[(a[i] // exp) % 10] += 1; r.tick(i)
        for i in range(1, 10): cnt[i] += cnt[i - 1]
        for i in range(len(a) - 1, -1, -1): d = (a[i] // exp) % 10; cnt[d] -= 1; out[cnt[d]] = a[i]
        for i in range(len(a)): a[i] = out[i]; r.tick(i)
        exp *= 10
ALGOS = [('Quick Sort', quick), ('Merge Sort', merge), ('Radix Sort', radix), ('Heap Sort', heap), ('Shell Sort', shell), ('Insertion Sort', insertion), ('Bubble Sort', bubble)]
SEG = 3.6; SWEEP = 0.7
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(im, s_, y, fs, color, th):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); x = int(W / 2 - tw / 2)
    cv2.putText(im, s_, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
BG = None
def bg():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    return (np.array((14, 10, 12), np.float32) + (np.clip(1 - np.hypot(xx - CX, yy - CY) / 900, 0, 1) ** 1.8)[..., None] * np.array((30, 22, 26), np.float32)).astype(np.uint8)
def draw(a, hl, title, num, ops, green=0, alive=None, sub=''):
    im = BG.copy()
    for k in range(N):
        if alive is not None and not alive[k]: continue
        c = HUE[a[k]]
        cv2.circle(im, (PX[k], PY[k]), DOT, (int(c[0]), int(c[1]), int(c[2])), -1, cv2.LINE_AA)
    for k in range(min(green, N)):
        cv2.circle(im, (PX[k], PY[k]), DOT, (90, 235, 120), -1, cv2.LINE_AA)
    for k in hl:
        if 0 <= k < N: cv2.circle(im, (PX[k], PY[k]), DOT + 3, (255, 255, 255), -1, cv2.LINE_AA)
    text_c(im, str(num), 230, 1.3, (150, 150, 160), 3)
    text_c(im, title, 330, 2.6, (255, 255, 255), 8)
    text_c(im, sub if sub else f'{ops:,} operations', 1640, 1.8, (210, 210, 220), 5)
    return im
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    BG = bg(); frames = []; audio = []  # audio: (t, list of values) per frame
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'sort.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    t = 0.0; fi = 0
    def emit(im, vals, tag=''):
        global t, fi
        if ff: ff.stdin.write(im.tobytes())
        elif mode != 'sim' and any(abs(t - float(x)) < 0.5 / FPS for x in mode.split(',')): cv2.imwrite(f'/tmp/np/so_{t:.1f}.jpg', im)
        audio.append((t, vals, tag)); fi += 1; t = fi / FPS
    for num, (name, fn) in enumerate(ALGOS, 1):
        start = rng.permutation(N)
        cnt = Rec(start.copy(), []); fn(cnt.a, cnt); total = cnt.ops
        nf = int(SEG * FPS); samples = [max(1, int(round(total * (i + 1) / nf))) for i in range(nf)]
        r = Rec(start.copy(), samples); fn(r.a, r)
        while len(r.snaps) < nf: r.snaps.append((r.a.copy(), [], r.ops))
        emit(draw(start, [], name, num, 0), [])
        for a, hl, ops in r.snaps: emit(draw(a, hl, name, num, ops), [int(a[i]) for i in hl if 0 <= i < N])
        final = r.snaps[-1][0]
        ns = int(SWEEP * FPS)
        for s in range(ns): g = int(N * (s + 1) / ns); emit(draw(final, [], name, num, total, green=g), [int(final[min(N - 1, g - 1)])], 'sweep')
        print(name, total, flush=True)
    # the gag: Stalin Sort -- anything out of order gets deleted
    start = rng.permutation(N); alive = np.ones(N, bool); mx = -1; nf = int(3.2 * FPS); keep = []
    for k in range(N):
        if start[k] >= mx: mx = start[k]; keep.append(k)
    order = np.arange(N)
    for f in range(nf):
        upto = int(N * (f + 1) / nf)
        al = np.ones(N, bool); al[:upto] = np.isin(np.arange(upto), keep)
        emit(draw(start, [upto - 1] if upto < N else [], 'Stalin Sort', 8, upto, alive=al, sub='deletes anything out of order'), [int(start[min(N - 1, upto - 1)])])
    for f in range(int(2.6 * FPS)):
        emit(draw(start, [], 'Stalin Sort', 8, 0, alive=al, sub=f'sorted. only {len(keep)} survived.'), [])
    if ff: ff.stdin.close(); ff.wait()
    json.dump(audio, open('sort_audio.json', 'w')); print('frames', fi, 'secs', round(t, 1))
