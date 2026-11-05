import json, numpy as np, soundfile as sf
A = json.load(open('sort_audio.json')); TOTAL = A[-1][0] + 1 / 30; sr = 44100; N = int(TOTAL * sr) + sr // 10; out = np.zeros(N)
spf = sr // 30
for t, vals, tag in A:
    i0 = int(t * sr); y = np.arange(spf * 2) / sr
    for v in vals[:2]:
        f = 160 + 1100 * (v / 600) ** 1.1
        w = np.sign(np.sin(2 * np.pi * f * y)) * 0.35 + np.sin(2 * np.pi * f * y) * 0.65  # retro square-ish tone
        env = np.minimum(1, y / 0.003) * np.exp(-y * (25 if tag == 'sweep' else 40))
        out[i0:i0 + len(y)] += w * env * (0.16 if tag == 'sweep' else 0.12)
tt = np.arange(N) / sr
mix = np.tanh(out * 1.3) * 0.8; mix *= np.minimum(1, (N / sr - tt) / 0.5)
sf.write('sort.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
