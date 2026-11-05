import json, numpy as np, soundfile as sf, math
J = json.load(open('events.json')); E = J['events']; SH = J['shatter']; TOTAL = J['end'] + 0.1
sr = 44100; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(2)
def tone(i0, f, dur, dec, amp):
    m = int(dur * sr); y = np.arange(m) / sr
    if i0 < 0 or i0 + m >= N: return
    out[i0:i0 + m] += np.sin(2 * np.pi * f * y) * np.exp(-y * dec) * amp
scale = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5]
bf = {}; ef = {}
for t, k, c in E:
    f = int(t * 60)
    if k == 'bounce': bf[f] = bf.get(f, 0) + c
    if k == 'escape': ef[f] = ef.get(f, 0) + c
for f, c in bf.items():
    for j in range(min(c, 3)): tone(int((f + rng.random()) / 60 * sr), rng.uniform(1800, 2600), 0.03, 120, 0.08 / math.sqrt(max(1, c / 3)))
for f, c in ef.items():
    for j in range(min(c, 4)): tone(int((f + rng.random()) / 60 * sr), scale[rng.integers(0, 8)] * (1 if rng.random() < 0.7 else 2), 0.25, 14, 0.18 / math.sqrt(max(1, c / 2)))
if SH:
    i0 = int(SH * sr); m = int(1.5 * sr); y = np.arange(m) / sr
    if i0 + m < N: out[i0:i0 + m] += rng.standard_normal(m) * np.exp(-y * 4) * 0.35
    for j, fr in enumerate([523.3, 659.3, 784, 1046.5, 1318.5]): tone(int((SH + 0.05 + j * 0.08) * sr), fr, 2.2, 1.6, 0.14)
tt = np.arange(N) / sr
pad = sum(np.sin(2 * np.pi * f * tt) for f in [130.8, 196, 261.6]) * 0.012
mix = np.tanh((out + pad) * 1.3) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.6)
sf.write('audio.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max(), TOTAL)
