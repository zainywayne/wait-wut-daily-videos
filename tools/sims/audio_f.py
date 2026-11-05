import json, numpy as np, soundfile as sf
M = json.load(open('fold_meta.json')); sr = 44100; TOTAL = M['total']; N = int(TOTAL * sr); out = np.zeros(N); rng = np.random.default_rng(1); tt = np.arange(N) / sr
def tone(t, f, dur, dec, amp):
    i0 = int(t * sr); m = int(dur * sr); y = np.arange(m) / sr
    if i0 + m >= N: return
    out[i0:i0 + m] += (np.sin(2 * np.pi * f * y) + 0.3 * np.sin(4 * np.pi * f * y)) * np.exp(-y * dec) * amp
pent = [0, 2, 4, 7, 9]
for k in range(M['nf']):
    t = M['start'] + k * M['fold_t']
    m = int(0.18 * sr); i0 = int(t * sr); y = np.arange(m) / sr; nz = rng.standard_normal(m); nz = nz - np.convolve(nz, np.ones(3) / 3, 'same')
    out[i0:i0 + m] += nz * np.sin(np.pi * y / 0.18) ** 2 * 0.12   # paper swish
    o = k; tone(t + 0.22, 196 * 2 ** ((pent[o % 5] + 12 * (o // 5)) / 12 / 2.2), 0.6, 6, 0.14)
end = M['start'] + M['nf'] * M['fold_t']
for j, f in enumerate([523.3, 659.3, 784, 1046.5, 1318.5]): tone(end + 0.05 + j * 0.08, f, 3.0, 1.2, 0.12)
pad = sum(np.sin(2 * np.pi * f * tt) for f in [65.4, 98, 130.8]) * 0.02 * np.clip(tt / 20, 0, 1)
mix = np.tanh((out + pad) * 1.6) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 0.8)
sf.write('fold.wav', mix.astype(np.float32), sr); print('peak', abs(mix).max())
