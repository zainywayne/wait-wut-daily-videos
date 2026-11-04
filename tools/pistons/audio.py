import json, numpy as np, soundfile as sf, math
sr = 44100; TOTAL = 18.0; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(3)
J = json.load(open('events.json')); E = J['events']; REACH = next(i for i, v in enumerate(J['hist']) if v >= 10000) / 30
n = int(0.05 * sr); x = np.arange(n) / sr
per = {}
clamps = [t for t, kind, k in E if kind == 'clamp']
for t, kind, k in E:
    if kind != 'squish': continue
    for j in range(min(k, 400)): f = int((t + j * 0.0006 + rng.random() * 0.05) * 60); per[f] = per.get(f, 0) + max(1, k // 400)
for f, k in per.items():
    m = min(k, 5); amp = 0.35 / math.sqrt(max(1, k / 2))
    for j in range(m):
        i0 = int((f / 60 + rng.random() / 60) * sr)
        if i0 + n >= N: continue
        fr = rng.uniform(900, 1700) * (1 + min(1, f / 60 / 16) * 0.6)
        out[i0:i0 + n] += np.sin(2 * np.pi * fr * x * (1 + 0.6 * np.exp(-x * 60))) * np.exp(-x * 70) * amp
# piston thunks
for t in clamps:
    i0 = int(t * sr); m = int(0.16 * sr); y = np.arange(m) / sr
    if i0 + m < N: out[i0:i0 + m] += np.sin(2 * np.pi * (60 + 140 * np.exp(-y * 40)) * y) * np.exp(-y * 26) * 0.45 + rng.standard_normal(m) * np.exp(-y * 160) * 0.08
# finale chime at 10,000
for j, fr in enumerate([523.3, 659.3, 784, 1046.5]):
    i0 = int((REACH + 0.2 + j * 0.09) * sr); m = int(2.2 * sr); y = np.arange(m) / sr
    out[i0:i0 + m] += (np.sin(2 * np.pi * fr * y) + 0.3 * np.sin(2 * np.pi * fr * 2 * y)) * np.exp(-y * 1.6) * 0.16
tt = np.arange(N) / sr
pad = sum(np.sin(2 * np.pi * f * tt) for f in [110, 165, 220]) * 0.01
mix = np.tanh((out + pad) * 1.2) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.8)
sf.write('audio.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
