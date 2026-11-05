import json, numpy as np, soundfile as sf, math
J = json.load(open('scratch_events.json')); E = J['events']; D = J['done']; TOTAL = J['end'] + 0.1; Hh = J['hist']
sr = 44100; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(5); tt = np.arange(N) / sr
# scratching: filtered noise, louder with more balls, stops at the reveal
nb = np.interp(tt, np.arange(len(Hh)) / 30, [h[0] for h in Hh]); act = (tt < (D or 99)).astype(float)
nz = rng.standard_normal(N); nz = nz - np.convolve(nz, np.ones(4) / 4, 'same')
out += nz * 0.05 * np.sqrt(np.minimum(nb, 40) / 40 + 0.08) * act
def tone(t, f, dur, dec, amp):
    i0 = int(t * sr); m = int(dur * sr); y = np.arange(m) / sr
    if i0 + m >= N: return
    out[i0:i0 + m] += (np.sin(2 * np.pi * f * y) + 0.3 * np.sin(4 * np.pi * f * y)) * np.exp(-y * dec) * amp
pent = [0, 2, 4, 7, 9]
for t, k, c in E:
    if k == 'bounce' and t < (D or 99): tone(t, 523.3 * 2 ** (pent[rng.integers(0, 5)] / 12) * (2 if rng.random() < 0.3 else 1), 0.18, 20, 0.05 / math.sqrt(max(1, c)))
if D:
    m = int(1.0 * sr); i0 = int(D * sr); y = np.arange(m) / sr; out[i0:i0 + m] += rng.standard_normal(m) * np.exp(-y * 6) * 0.25
    for j, f in enumerate([261.6, 329.6, 392, 523.3, 659.3]): tone(D + j * 0.06, f, 4.5, 0.7, 0.12)
    pad = sum(np.sin(2 * np.pi * f * tt) for f in [130.8, 196, 246.9]) * 0.03 * np.clip((tt - D) / 1.5, 0, 1); out += pad
mix = np.tanh(out * 1.3) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.8)
sf.write('scratch.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
