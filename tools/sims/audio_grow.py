import json, numpy as np, soundfile as sf, math
J = json.load(open('grow_events.json')); E = J['events']; D = J['done']; TOTAL = J['end'] + 0.1
sr = 44100; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(1)
pent = [0, 2, 4, 7, 9]
def note(k):  # climbs a pentatonic scale, wraps over 2.5 octaves
    i = k % 13; return 261.63 * 2 ** ((pent[i % 5] + 12 * (i // 5)) / 12)
def tone(t, f, dur, dec, amp):
    i0 = int(t * sr); m = int(dur * sr); y = np.arange(m) / sr
    if i0 + m >= N: m = N - i0 - 1; y = y[:m]
    if m <= 0: return
    w = np.sin(2 * np.pi * f * y) + 0.35 * np.sin(2 * np.pi * 2 * f * y) + 0.12 * np.sin(2 * np.pi * 3 * f * y)
    out[i0:i0 + m] += w * np.exp(-y * dec) * amp
for t, b in E: tone(t, note(b), 0.6, 7, 0.16)
if D:
    i0 = int(D * sr); m = int(1.2 * sr); y = np.arange(m) / sr
    if i0 + m < N: out[i0:i0 + m] += rng.standard_normal(m) * np.exp(-y * 5) * 0.3
    for j, f in enumerate([523.3, 659.3, 784, 1046.5, 1318.5]): tone(D + 0.04 + j * 0.07, f, 2.2, 1.7, 0.13)
tt = np.arange(N) / sr
mix = np.tanh(out * 1.4) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.6)
sf.write('grow.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
