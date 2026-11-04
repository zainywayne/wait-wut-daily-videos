import json, numpy as np, soundfile as sf, math
sr = 44100; TOTAL = 20.5; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(3)
E = json.load(open('events.json'))['events']
n = int(0.05 * sr); x = np.arange(n) / sr
per = {}
for t, kind, k in E: f = int(t * 60); per[f] = per.get(f, 0) + k
for f, k in per.items():
    m = min(k, 5); amp = 0.35 / math.sqrt(max(1, k / 2))
    for j in range(m):
        i0 = int((f / 60 + rng.random() / 60) * sr)
        if i0 + n >= N: continue
        fr = rng.uniform(900, 1700) * (1 + min(1, f / 60 / 16) * 0.6)
        out[i0:i0 + n] += np.sin(2 * np.pi * fr * x * (1 + 0.6 * np.exp(-x * 60))) * np.exp(-x * 70) * amp
# piston thunks
def T(t): return 0.62 - 0.36 * min(1, t / 13)
t = 0.4
while t < 16:
    i0 = int(t * sr); m = int(0.12 * sr); y = np.arange(m) / sr
    if i0 + m < N: out[i0:i0 + m] += np.sin(2 * np.pi * (70 + 120 * np.exp(-y * 40)) * y) * np.exp(-y * 30) * 0.35 + rng.standard_normal(m) * np.exp(-y * 200) * 0.05
    t += T(t)
# finale chime at 10,000
for j, fr in enumerate([523.3, 659.3, 784, 1046.5]):
    i0 = int((16.0 + j * 0.09) * sr); m = int(2.2 * sr); y = np.arange(m) / sr
    out[i0:i0 + m] += (np.sin(2 * np.pi * fr * y) + 0.3 * np.sin(2 * np.pi * fr * 2 * y)) * np.exp(-y * 1.6) * 0.16
tt = np.arange(N) / sr
pad = sum(np.sin(2 * np.pi * f * tt) for f in [110, 165, 220]) * 0.01
mix = np.tanh((out + pad) * 1.2) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.8)
sf.write('audio.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
