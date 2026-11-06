import json, numpy as np, soundfile as sf, math
J = json.load(open('gates_events.json')); E = J['events']; RCH = J['reach']; TOTAL = J['end'] + 0.05
sr = 44100; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(3); tt = np.arange(N) / sr
def tone(t, f, dur, dec, amp):
    i0 = int(t * sr); m = int(dur * sr); y = np.arange(m) / sr
    if i0 < 0 or i0 + m >= N: return
    out[i0:i0 + m] += (np.sin(2 * np.pi * f * y) + 0.3 * np.sin(4 * np.pi * f * y)) * np.exp(-y * dec) * amp
pent = [0, 2, 4, 7, 9]; per = {}; half = {}
for t, k, c in E:
    f = int(t * 30)
    if k == 'mult': per[f] = per.get(f, 0) + c
    else: half[f] = half.get(f, 0) + c
for f, c in per.items():
    for j in range(min(c, 4)):
        o = rng.integers(0, 12); tone((f + rng.random()) / 30, 440 * 2 ** ((pent[o % 5] + 12 * (o // 5)) / 12), 0.25, 14, 0.13 / math.sqrt(max(1, c / 2)))
for f, c in half.items(): tone(f / 30, 110, 0.25, 12, min(0.25, 0.05 * math.sqrt(c)))
# steady beat underneath (120 bpm) for drive
bt = 0.5; k = 0
while k * bt < TOTAL - 0.5:
    i0 = int(k * bt * sr); m = int(0.3 * sr); y = np.arange(m) / sr
    if i0 + m < N: out[i0:i0 + m] += np.sin(2 * np.pi * np.cumsum(45 + 100 * np.exp(-y * 28)) / sr) * np.exp(-y * 8) * 0.45
    k += 1
if RCH:
    for j, f in enumerate([523.3, 659.3, 784, 1046.5]): tone(RCH + 0.05 + j * 0.08, f, 2.5, 1.5, 0.14)
mix = np.tanh(out * 1.4) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.6)
sf.write('gates.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
