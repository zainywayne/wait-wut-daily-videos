# Sorting tournament: two algorithms race on the same shuffled bars, side by side. Winner advances. Final crowns a champion.
import numpy as np, cv2, json, subprocess, sys, math, colorsys
W, H, FPS = 1080, 1920, 30
N = 110; Y0, Y1 = 470, 1630; MIDX = 540; MAXL = 500
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 4)
HUE = [tuple(int(c * 255) for c in colorsys.hsv_to_rgb(0.83 * v / N, 0.85, 1.0))[::-1] for v in range(N)]
# ---- algorithms as generators: yield (touched indices) after each operation, mutating a ----
def bubble(a):
    n = len(a)
    for i in range(n):
        sw = False
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]: a[j], a[j + 1] = a[j + 1], a[j]; sw = True
            yield (j, j + 1)
        if not sw: return
def selection(a):
    n = len(a)
    for i in range(n):
        m = i
        for j in range(i + 1, n):
            if a[j] < a[m]: m = j
            yield (j, m)
        a[i], a[m] = a[m], a[i]; yield (i, m)
def insertion(a):
    for i in range(1, len(a)):
        j = i
        while j > 0 and a[j - 1] > a[j]: a[j - 1], a[j] = a[j], a[j - 1]; yield (j, j - 1); j -= 1
        yield (j,)
def cocktail(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        sw = False
        for j in range(lo, hi):
            if a[j] > a[j + 1]: a[j], a[j + 1] = a[j + 1], a[j]; sw = True
            yield (j, j + 1)
        hi -= 1
        for j in range(hi, lo, -1):
            if a[j - 1] > a[j]: a[j - 1], a[j] = a[j], a[j - 1]; sw = True
            yield (j, j - 1)
        lo += 1
        if not sw: return
def shell(a):
    g = len(a) // 2
    while g:
        for i in range(g, len(a)):
            j = i
            while j >= g and a[j - g] > a[j]: a[j - g], a[j] = a[j], a[j - g]; yield (j, j - g); j -= g
            yield (j,)
        g //= 2
def heap(a):
    n = len(a)
    def sift(s, e):
        root = s
        while 2 * root + 1 <= e:
            c = 2 * root + 1
            if c + 1 <= e and a[c] < a[c + 1]: c += 1
            if a[root] < a[c]: a[root], a[c] = a[c], a[root]; yield (root, c); root = c
            else: yield (root, c); return
    for s in range((n - 2) // 2, -1, -1): yield from sift(s, n - 1)
    for e in range(n - 1, 0, -1): a[0], a[e] = a[e], a[0]; yield (0, e); yield from sift(0, e - 1)
def merge(a, lo=0, hi=None):
    if hi is None: hi = len(a)
    if hi - lo < 2: return
    m = (lo + hi) // 2; yield from merge(a, lo, m); yield from merge(a, m, hi)
    left, right = list(a[lo:m]), list(a[m:hi]); i = j = 0; k = lo
    while i < len(left) or j < len(right):
        if j >= len(right) or (i < len(left) and left[i] <= right[j]): a[k] = left[i]; i += 1
        else: a[k] = right[j]; j += 1
        yield (k,); k += 1
def quick(a, lo=0, hi=None):
    if hi is None: hi = len(a) - 1
    if lo >= hi: return
    p = a[(lo + hi) // 2]; i, j = lo, hi
    while i <= j:
        while a[i] < p: i += 1; yield (i,)
        while a[j] > p: j -= 1; yield (j,)
        if i <= j: a[i], a[j] = a[j], a[i]; yield (i, j); i += 1; j -= 1
    yield from quick(a, lo, j); yield from quick(a, i, hi)
ALG = {'Bubble Sort': bubble, 'Selection Sort': selection, 'Insertion Sort': insertion, 'Cocktail Sort': cocktail, 'Shell Sort': shell, 'Heap Sort': heap, 'Merge Sort': merge, 'Quick Sort': quick}
def count_ops(name, start):
    a = list(start); return sum(1 for _ in ALG[name](a))
FONT = cv2.FONT_HERSHEY_DUPLEX
def text_c(im, s_, y, fs, color, th, x=None):
    (tw, _), _ = cv2.getTextSize(s_, FONT, fs, th); x = int(W / 2 - tw / 2) if x is None else int(x - tw / 2)
    cv2.putText(im, s_, (x + 3, y + 5), FONT, fs, (0, 0, 0), th + 6, cv2.LINE_AA); cv2.putText(im, s_, (x, y), FONT, fs, color, th, cv2.LINE_AA)
RH = (Y1 - Y0) / N
def draw(rnd_title, names, arrs, hls, ops, winner, wfade, champion=None):
    im = np.zeros((H, W, 3), np.uint8)
    for side in (0, 1):
        a = arrs[side]; sgn = -1 if side == 0 else 1
        hl = set(hls[side])
        for i in range(N):
            v = a[i]; L = int(14 + (MAXL - 18) * (v + 1) / N); y0 = int(Y0 + i * RH); y1 = int(Y0 + (i + 1) * RH) - 2
            c = (255, 255, 255) if i in hl else HUE[v]
            x0, x1 = (MIDX - 6 - L, MIDX - 6) if side == 0 else (MIDX + 6, MIDX + 6 + L)
            cv2.rectangle(im, (x0, y0), (x1, y1), c, -1)
        if winner == side and wfade > 0:
            ov = im.copy(); xs = (0, MIDX) if side == 0 else (MIDX, W); cv2.rectangle(ov, (xs[0], Y0 - 10), (xs[1], Y1 + 10), (60, 120, 40), -1); im = cv2.addWeighted(ov, 0.35 * wfade, im, 1 - 0.35 * wfade, 0)
    cv2.line(im, (MIDX, Y0 - 20), (MIDX, Y1 + 20), (40, 40, 40), 10)
    if not champion:
        text_c(im, rnd_title, 160, 1.6, (120, 210, 255), 4)
        text_c(im, names[0], 280, 1.75, (255, 255, 255), 5, x=270); text_c(im, 'vs', 280, 1.3, (170, 170, 180), 3); text_c(im, names[1], 280, 1.75, (255, 255, 255), 5, x=810)
        text_c(im, 'Which one is faster?', 380, 1.15, (170, 170, 180), 3)
    else: text_c(im, 'Which one did you pick?', 300, 1.5, (255, 255, 255), 4)
    text_c(im, f'{ops[0]:,}', 1720, 1.6, (255, 255, 255), 4, x=270); text_c(im, f'{ops[1]:,}', 1720, 1.6, (255, 255, 255), 4, x=810)
    text_c(im, 'operations', 1785, 0.9, (150, 150, 160), 2, x=270); text_c(im, 'operations', 1785, 0.9, (150, 150, 160), 2, x=810)
    if winner is not None and wfade > 0: text_c(im, f'{names[winner]} wins', 980, 2.2, (120, 255, 150), 7)
    if champion: text_c(im, 'CHAMPION', 860, 2.6, (60, 215, 255), 8); text_c(im, champion, 980, 2.4, (255, 255, 255), 7)
    return im
if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'full'
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', 'race.mp4'], stdin=subprocess.PIPE) if mode == 'full' else None
    rounds = [('ROUND 1', 'Bubble Sort', 'Insertion Sort'), ('ROUND 2', 'Selection Sort', 'Shell Sort'), ('ROUND 3', 'Heap Sort', 'Merge Sort'), ('FINAL', None, None)]
    winners = []; audio = []; t = 0.0; fi = 0
    def emit(im, tones):
        global t, fi
        if ff: ff.stdin.write(im.tobytes())
        elif mode != 'sim' and any(abs(t - float(x)) < 0.5 / FPS for x in mode.split(',')): cv2.imwrite(f'/tmp/np/ra_{t:.1f}.jpg', im)
        audio.append((t, tones)); fi += 1; t = fi / FPS
    for ri, (title, A, B) in enumerate(rounds):
        if A is None: A, B = winners[1], 'Quick Sort'
        start = [int(x) for x in rng.permutation(N)]
        oa, ob = count_ops(A, start), count_ops(B, start); fastest = min(oa, ob)
        per = max(1, int(round(fastest / (3.6 * FPS))))  # same speed for both sides: fair race
        arr = [list(start), list(start)]; gens = [ALG[A](arr[0]), ALG[B](arr[1])]; ops = [0, 0]; done = [False, False]; winner = None; wt = None
        for k in range(10): emit(draw(title, (A, B), arr, ([], []), ops, None, 0), [])
        while True:
            hls = [[], []]
            for s in (0, 1):
                if done[s]: continue
                for _ in range(per):
                    try: hl = next(gens[s]); ops[s] += 1
                    except StopIteration: done[s] = True; break
                    hls[s] = list(hl)
            if winner is None and any(done): winner = 0 if done[0] and (not done[1] or ops[0] <= ops[1]) else 1; wt = t
            wf = min(1, (t - wt) / 0.3) if winner is not None else 0
            tones = [(s, int(arr[s][hls[s][0]])) for s in (0, 1) if hls[s]]
            emit(draw(title, (A, B), arr, hls, ops, winner, wf), tones)
            if winner is not None and t - wt > 1.8: break
        winners.append((A, B)[winner]); print(title, A, oa, B, ob, 'winner', winners[-1])
    champ = winners[-1]
    for k in range(int(2.5 * FPS)): emit(draw('', ('', ''), arr, ([], []), ops, None, 0, champion=champ), [])
    if ff: ff.stdin.close(); ff.wait()
    json.dump(audio, open('race_audio.json', 'w')); print('secs', round(t, 1))
