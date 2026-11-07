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
pr = g("problem"); a0, a1 = pr["start"] + 1.0, g("breath")["start"]          # music drops out for the twist
env = np.ones(N); i0, i1 = int(a0 * sr), int(a1 * sr); env[i0:i1] = 0.08; env[i0 - int(0.3 * sr):i0] = np.linspace(1, 0.08, int(0.3 * sr)); env[i1:i1 + int(0.4 * sr)] = np.linspace(0.08, 1, int(0.4 * sr)); mus *= env
i0 = int((pr["start"] + 1.0) * sr); n = int(3 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * 46 * x) * np.minimum(1, x * 2) * np.exp(-x * 0.8) * 0.18   # low drone
dg = g("dig")
for q in range(5):
    i0 = int((dg["start"] + 0.4 + q * 0.55) * sr); n = int(0.25 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.random.default_rng(q).standard_normal(n) * np.exp(-x * 25) * 0.15 + np.sin(2 * np.pi * 70 * x) * np.exp(-x * 20) * 0.2
for q, f in enumerate([784, 988, 1175, 1568]):
    i0 = int((g("harvest")["start"] + 0.2 + q * 0.12) * sr); n = int(0.5 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * f * x) * np.exp(-x * 7) * 0.08
kn = g("knock")
for q, dt in enumerate([0.9, 1.25, 1.6, 2.6, 2.95]):
    i0 = int((kn["start"] + kn["dur"] - 3.2 + dt) * sr) if False else int((kn["start"] + dt + 0.9) * sr); n = int(0.35 * sr); x = np.arange(n) / sr
    mus[i0:i0 + n] += (np.sin(2 * np.pi * 180 * x) * 0.5 + np.sin(2 * np.pi * 410 * x) * 0.3 + np.random.default_rng(q + 50).standard_normal(n) * 0.3) * np.exp(-x * 18) * 0.5
i0, i1 = int(kn["start"] * sr), int((kn["start"] + kn["dur"]) * sr); mus[i0:i1] *= 0.25
mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.8); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
