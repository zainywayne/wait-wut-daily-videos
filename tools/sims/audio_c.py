import json, numpy as np, soundfile as sf, math
J = json.load(open('chaos_events.json')); B = J['bounces']; G = J['gaps']; TOTAL = len(B) / 30
sr = 44100; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(6); tt = np.arange(N) / sr
pent = [0, 3, 5, 7, 10]
def tone(t, f, dur, dec, amp):
    i0 = int(t * sr); m = int(dur * sr); y = np.arange(m) / sr
    if i0 + m >= N: return
    out[i0:i0 + m] += (np.sin(2 * np.pi * f * y) + 0.3 * np.sin(4 * np.pi * f * y)) * np.exp(-y * dec) * amp
for f, k in enumerate(B):
    if k == 0: continue
    spread = G[f] > 0.01
    m = min(k, 4) if spread else 1
    for j in range(m):
        o = rng.integers(0, 15) if spread else 7
        tone((f + rng.random() * (1 if spread else 0)) / 30, 220 * 2 ** ((pent[o % 5] + 12 * (o // 5)) / 12), 0.7, 6, (0.25 if not spread else 0.08 / math.sqrt(max(1, k / 40))))
pad = sum(np.sin(2 * np.pi * f * tt) for f in [55, 110, 164.8]) * 0.02 * (0.5 + 0.5 * np.clip((tt - 8) / 6, 0, 1))
mix = np.tanh((out + pad) * 1.4) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.8)
sf.write('chaos.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
