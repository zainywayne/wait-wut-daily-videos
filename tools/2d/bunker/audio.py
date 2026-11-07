import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
W = "/home/claude/shorts_work"
S = json.load(open("script.json")); k = Kokoro(W + "/tts/kokoro-v1.0.onnx", W + "/tts/voices-v1.0.bin")
parts, t, segs, sr = [], 0.3, [], 24000
parts.append(np.zeros(int(0.3 * sr), np.float32))
for sc in S["scenes"]:
    a, sr = k.create(sc["text"], voice=S["voice"], speed=S["speed"], lang="en-us")
    d = len(a) / sr; pause = sc.get("pause", 0.2)
    words = sc["text"].split(); lens = [len(w) + 1 for w in words]; tot = sum(lens); acc = 0; wt = []
    for w, l in zip(words, lens): wt.append([w, t + d * acc / tot]); acc += l
    segs.append({"shot": sc["shot"], "start": t, "dur": d + pause, "words": wt})
    parts += [a.astype(np.float32), np.zeros(int(pause * sr), np.float32)]; t += d + pause
end = 4.5; total = t + end
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
al = next(g for g in segs if g["shot"] == "alert")
i0 = int((al["start"] + 0.3) * sr); n = int(2.6 * sr); x = np.arange(n) / sr
mus[i0:i0 + n] += np.sign(np.sin(2 * np.pi * (850 + 150 * np.sign(np.sin(2 * np.pi * 4 * x))) * x)) * 0.05 * np.exp(-x * 0.6)   # emergency alert tone
sf_ = next(g for g in segs if g["shot"] == "safe"); i0 = int((sf_["start"] + 1.2) * sr); n = int(2.0 * sr); x = np.arange(n) / sr
mus[i0:i0 + n] += np.random.default_rng(1).standard_normal(n) * np.exp(-x * 2.5) * 0.12 + np.sin(2 * np.pi * 40 * x) * np.exp(-x * 2) * 0.25   # distant rumble
mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.8); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
