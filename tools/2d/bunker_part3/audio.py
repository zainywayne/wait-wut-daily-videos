import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
W = "/home/claude/shorts_work"
S = json.load(open("script.json")); k = Kokoro(W + "/tts/kokoro-v1.0.onnx", W + "/tts/voices-v1.0.bin")
parts, t, segs, sr = [], 0.15, [], 24000
parts.append(np.zeros(int(0.15 * sr), np.float32))
for sc in S["scenes"]:
    a, sr = k.create(sc["text"], voice=S["voice"], speed=S["speed"], lang="en-us")
    d = len(a) / sr; pause = sc.get("pause", 0.2)
    words = sc["text"].split(); lens = [len(w) + 1 for w in words]; tot = sum(lens); acc = 0; wt = []
    for w, l in zip(words, lens): wt.append([w, t + d * acc / tot]); acc += l
    segs.append({"shot": sc["shot"], "start": t, "dur": d + pause, "words": wt})
    parts += [a.astype(np.float32), np.zeros(int(pause * sr), np.float32)]; t += d + pause
end = 3.5; total = t + end
segs.append({"shot": "end", "start": t, "dur": end, "words": []})
v = np.concatenate(parts); N = int(total * sr); voice = np.zeros(N); voice[:len(v)] = v
tt = np.arange(N) / sr; notes = [261.6, 329.6, 392.0, 523.3, 392.0, 329.6]; mus = np.zeros(N)
for i, t0 in enumerate(np.arange(0, total, 0.3)):
    n = int(0.28 * sr); i0 = int(t0 * sr)
    if i0 + n >= N: break
    x = np.arange(n) / sr; f = notes[i % 6] * (0.5 if (i // 12) % 2 else 1)
    mus[i0:i0 + n] += np.sin(2 * np.pi * f * x) * np.exp(-x * 9) * 0.045
bt = 60 / 128
for i, t0 in enumerate(np.arange(0, total - 1.0, bt)):
    i0 = int(t0 * sr); n = int(0.18 * sr); x = np.arange(n) / sr
    mus[i0:i0 + n] += np.sin(2 * np.pi * (55 + 90 * np.exp(-x * 30)) * x) * np.exp(-x * 14) * 0.12
    h0 = int((t0 + bt / 2) * sr); hn = int(0.04 * sr); mus[h0:h0 + hn] += np.random.default_rng(i).standard_normal(hn) * np.exp(-np.arange(hn) / sr * 90) * 0.03
for sg in segs[1:]:
    i0 = int(max(0, sg["start"] - 0.18) * sr); n = int(0.25 * sr); x = np.arange(n) / sr
    mus[i0:i0 + n] += np.random.default_rng(i0).standard_normal(n) * np.sin(np.pi * x / 0.25) ** 2 * 0.05
g = lambda n: next(x for x in segs if x["shot"] == n)
def bang(t0, q, amp=0.5):
    i0 = int(t0 * sr); n = int(0.35 * sr); x = np.arange(n) / sr
    mus[i0:i0 + n] += (np.sin(2 * np.pi * 180 * x) * 0.5 + np.sin(2 * np.pi * 410 * x) * 0.3 + np.random.default_rng(q + 50).standard_normal(n) * 0.3) * np.exp(-x * 18) * amp
def duck(a0, a1, lv):
    env = np.ones(N); i0, i1 = int(a0 * sr), int(a1 * sr); r = int(0.3 * sr); env[i0:i1] = lv; env[max(0, i0 - r):i0] = np.linspace(1, lv, len(env[max(0, i0 - r):i0])); env[i1:i1 + r] = np.linspace(lv, 1, len(env[i1:i1 + r])); return env
bg = g("p_bang"); lk = g("p_lock"); snd = g("p_sound"); sc = g("p_scrape"); rv = g("p_reveal"); ask = g("p_ask")
mus *= duck(0, bg["start"] + bg["dur"] - 1.4, 0.3) * duck(bg["start"] + bg["dur"] - 1.4, lk["start"], 0.02) * duck(snd["start"] + 0.6, rv["start"], 0.05) * duck(rv["start"], ask["start"], 0.35)
mus2 = mus.copy(); mus = np.zeros(N)
for q, dt in enumerate([0.0, 0.3, 0.6, 1.5, 1.8, 2.1]): bang(dt, q)
for q, dt in enumerate([0.2, 0.5, 1.4]): bang(bg["start"] + dt, q + 9, 0.35)
i0 = int((snd["start"] + 0.6) * sr); n = int((rv["start"] - snd["start"]) * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * 44 * x) * np.minimum(1, x) * 0.16
for q in range(14):
    t0 = sc["start"] + 0.1 + q * 0.62
    if t0 > ask["start"]: break
    i0 = int(t0 * sr); n = int(0.4 * sr); x = np.arange(n) / sr; nz = np.random.default_rng(q + 99).standard_normal(n); nz = np.convolve(nz, np.ones(6) / 6, 'same')
    mus[i0:i0 + n] += nz * np.sin(np.pi * x / 0.4) ** 2 * 0.22
i0 = int(rv["start"] * sr); n = int(1.6 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (40 + 60 * np.exp(-x * 6)) * x) * np.exp(-x * 2.5) * 0.5
mus += mus2
mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.8); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
