# 120 bpm track: every fold lands on a beat. Am - F - C - G, kick/clap/hats, bass, pad, pluck arps, riser, final hit.
import numpy as np, soundfile as sf
sr = 44100; TOTAL = 26.0; N = int(TOTAL * sr); out = np.zeros(N); BEAT = 0.5; START = 1.0; END = START + 42 * BEAT
rng = np.random.default_rng(2); tt = np.arange(N) / sr
def put(t, w, amp=1.0):
    i0 = int(t * sr); m = min(len(w), N - i0)
    if i0 >= 0 and m > 0: out[i0:i0 + m] += w[:m] * amp
def env(n, a=0.004, d=8.0): y = np.arange(n) / sr; return np.minimum(1, y / a) * np.exp(-y * d)
def kick():
    n = int(0.35 * sr); y = np.arange(n) / sr; f = 45 + 110 * np.exp(-y * 28); return np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-y * 7.5)
def clap():
    n = int(0.22 * sr); y = np.arange(n) / sr; nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(6) / 6, 'same'); return nz * np.exp(-y * 18) * 0.8
def hat():
    n = int(0.06 * sr); nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(3) / 3, 'same'); return nz * env(n, 0.001, 70) * 0.5
def tone(f, dur, d=4.0, harm=(1, 0.5, 0.25), a=0.005):
    n = int(dur * sr); y = np.arange(n) / sr; w = sum(h * np.sin(2 * np.pi * f * (i + 1) * y) for i, h in enumerate(harm)); return w * env(n, a, d)
def saw_pad(freqs, dur):
    n = int(dur * sr); y = np.arange(n) / sr; w = np.zeros(n)
    for f in freqs:
        for det in (-0.6, 0, 0.6): w += np.sin(2 * np.pi * (f + det) * y) + 0.4 * np.sin(4 * np.pi * (f + det) * y)
    return w * np.minimum(1, y / 0.3) * np.minimum(1, (dur - y) / 0.3) / (len(freqs) * 3)
CH = [(220.0, [220, 261.6, 329.6]), (174.6, [174.6, 220, 261.6]), (130.8, [261.6, 329.6, 392]), (196.0, [196, 246.9, 293.7])]  # Am F C G
bar = 4 * BEAT
nbars = int((END - START) / bar) + 1
# intro: soft pad + riser into the first fold
put(0, saw_pad(CH[0][1], START + 0.1), 0.18)
for b in range(nbars):
    t0 = START + b * bar; root, ch = CH[b % 4]
    if t0 >= END: break
    put(t0, saw_pad(ch, bar), 0.22 if b > 1 else 0.14)
    for q in range(4):
        tb = t0 + q * BEAT
        if tb >= END: break
        put(tb, kick(), 0.9)
        if q in (1, 3) and b >= 1: put(tb, clap(), 0.35)
        for e in range(2): put(tb + e * BEAT / 2, hat(), 0.18 if b >= 2 else 0.08)
        put(tb, tone(root / 2, BEAT * 0.95, 5.0, (1, 0.6, 0.3)), 0.35)                       # bass
        arp = ch[(q * 2) % 3] * 2; put(tb + BEAT / 2, tone(arp, 0.3, 9.0, (1, 0.3)), 0.16 if b >= 3 else 0.08)  # pluck
# riser into the final reveal
n = int(2.0 * sr); y = np.arange(n) / sr; nz = rng.standard_normal(n); nz = nz - np.convolve(nz, np.ones(4) / 4, 'same'); put(END - 2.0, nz * (y / 2.0) ** 2 * 0.25)
# final hit + big chord
put(END, kick(), 1.2); put(END, clap(), 0.6)
for f in [220, 261.6, 329.6, 440, 523.3]: put(END, tone(f, 3.6, 1.0, (1, 0.4, 0.2), 0.01), 0.12)
put(END, saw_pad([220, 261.6, 329.6], 3.8), 0.25)
mix = np.tanh(out * 1.1) * 0.85; mix *= np.minimum(1, (TOTAL - tt) / 1.0)
sf.write('audio.wav', mix.astype(np.float32), sr); print('peak', np.abs(mix).max())
