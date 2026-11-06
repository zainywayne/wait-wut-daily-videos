import json, numpy as np, soundfile as sf
A = json.load(open('race_audio.json')); TOTAL = A[-1][0] + 0.2; sr = 44100; N = int(TOTAL * sr); out = np.zeros((N, 2))
spf = sr // 30; y = np.arange(spf * 2) / sr
for t, tones in A:
    i0 = int(t * sr)
    for side, v in tones:
        f = 180 + 1000 * (v / 110) ** 1.1
        w = (np.sign(np.sin(2 * np.pi * f * y)) * 0.3 + np.sin(2 * np.pi * f * y) * 0.7) * np.minimum(1, y / 0.003) * np.exp(-y * 35) * 0.25
        m = min(len(w), N - i0)
        if m > 0: out[i0:i0 + m, side] += w[:m] * 0.85; out[i0:i0 + m, 1 - side] += w[:m] * 0.3
mix = np.tanh(out * 2.2) * 0.85; tt = np.arange(N) / sr; mix *= np.minimum(1, (TOTAL - tt) / 0.5)[:, None]
sf.write('race.wav', mix.astype(np.float32), sr); print('peak', np.abs(mix).max())
