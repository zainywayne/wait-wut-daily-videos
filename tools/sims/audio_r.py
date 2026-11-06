import json, numpy as np, soundfile as sf, math
J = json.load(open('royale_events.json')); E = J['events']; WT = J['win_t']; TOTAL = J['end'] + 0.05
sr = 44100; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(4); tt = np.arange(N) / sr
def put(t, w, a=1.0):
    i0 = int(t * sr); m = min(len(w), N - i0)
    if i0 >= 0 and m > 0: out[i0:i0 + m] += w[:m] * a
def tone(f, dur, dec, h=(1, .3)):
    y = np.arange(int(dur * sr)) / sr; return sum(a * np.sin(2 * np.pi * f * (i + 1) * y) for i, a in enumerate(h)) * np.exp(-y * dec)
def kick(): y = np.arange(int(.3 * sr)) / sr; return np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-y * 28)) / sr) * np.exp(-y * 8)
def hat(): n = int(.05 * sr); z = rng.standard_normal(n); z -= np.convolve(z, np.ones(3) / 3, 'same'); return z * np.exp(-np.arange(n) / sr * 80)
# 120 bpm drive until the win
k = 0
while k * 0.5 < (WT or TOTAL):
    put(k * 0.5, kick(), 0.5); put(k * 0.5 + 0.25, hat(), 0.12); k += 1
# bass pulse rising as players drop
for t, kind, v in E:
    if kind == 'out':
        y = np.arange(int(.7 * sr)) / sr; z = rng.standard_normal(len(y)); put(t, z * np.exp(-y * 7) * 0.4 + np.sin(2 * np.pi * (60 + 80 * np.exp(-y * 9)) * y) * np.exp(-y * 4) * 0.6)
        put(t + 0.05, tone(880 * 2 ** (-(v % 5) / 12), 0.5, 6), 0.12)
    elif kind in ('bump', 'wall'):
        put(t, tone(1400 + rng.uniform(-300, 300), 0.06, 60, (1,)), 0.05)
# laser hum
out += np.sin(2 * np.pi * 110 * tt) * 0.03 * (tt < (WT or TOTAL))
if WT:
    for j, f in enumerate([523.3, 659.3, 784, 1046.5, 1318.5]): put(WT + 0.05 + j * 0.09, tone(f, 2.5, 1.4), 0.14)
mix = np.tanh(out * 1.3) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.6)
sf.write('royale.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
