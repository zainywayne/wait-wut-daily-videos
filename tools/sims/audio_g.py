import json, numpy as np, soundfile as sf, math
J = json.load(open('gear_events.json')); E = J['events']; F = J['full']; TOTAL = J['end'] + 0.05
sr = 44100; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(8); tt = np.arange(N) / sr
pent = [0, 2, 4, 7, 9]
def tone(t, f, dur, dec, amp):
    i0 = int(t * sr); m = int(dur * sr); y = np.arange(m) / sr
    if i0 + m >= N: return
    out[i0:i0 + m] += (np.sin(2 * np.pi * f * y) + 0.3 * np.sin(4 * np.pi * f * y)) * np.exp(-y * dec) * amp
per = {}
for t, k, c in E: f = int(t * 30); per[f] = per.get(f, 0) + c
for f, c in per.items():
    for j in range(min(c, 4)):
        o = rng.integers(0, 12); tone((f + rng.random()) / 30, 392 * 2 ** ((pent[o % 5] + 12 * (o // 5)) / 12), 0.35, 12, 0.14 / math.sqrt(max(1, c / 2)))
if F:
    for j, fr in enumerate([523.3, 659.3, 784, 1046.5]): tone(F + 0.05 + j * 0.08, fr, 2.5, 1.5, 0.13)
mix = np.tanh(out * 1.4) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.6)
sf.write('gear.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
