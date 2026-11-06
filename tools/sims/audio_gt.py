import json, numpy as np, soundfile as sf, math
J = json.load(open('galton_events.json')); E = J['events']; D = J['done']; TOTAL = J['end'] + 0.05
sr = 44100; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(1); tt = np.arange(N) / sr
def put(t, w, a):
    i0 = int(t * sr); m = min(len(w), N - i0)
    if i0 >= 0 and m > 0: out[i0:i0 + m] += w[:m] * a
def tone(f, dur, dec, h=(1, .3)):
    y = np.arange(int(dur * sr)) / sr; return sum(a * np.sin(2 * np.pi * f * (i + 1) * y) for i, a in enumerate(h)) * np.exp(-y * dec)
pent = [0, 2, 4, 7, 9]; per = {}
for t, k, v in E:
    if k == 'peg': f = int(t * 60); per.setdefault(f, []).append(v)
for f, rows in per.items():
    for r in rows[:3]: put(f / 60 + rng.random() / 60, tone(523.3 * 2 ** ((pent[r % 5] + 12 * (r // 5)) / 12) / 2, 0.08, 45, (1,)), 0.07 / math.sqrt(max(1, len(rows) / 3)))
# soft pulse
k = 0
while k * 0.5 < (D or TOTAL):
    y = np.arange(int(.3 * sr)) / sr; put(k * 0.5, np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-y * 28)) / sr) * np.exp(-y * 9), 0.3); k += 1
if D:
    for j, f in enumerate([261.6, 329.6, 392, 523.3, 659.3]): put(D + 0.05 + j * 0.07, tone(f, 4.0, 0.8), 0.13)
mix = np.tanh(out * 1.6) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.6)
sf.write('galton.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
