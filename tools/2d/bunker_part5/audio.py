import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
W = "/home/claude/shorts_work"
S = json.load(open("script.json")); k = Kokoro(W + "/tts/kokoro-v1.0.onnx", W + "/tts/voices-v1.0.bin")
parts, t, segs, sr = [], 0.15, [], 24000
parts.append(np.zeros(int(0.15 * sr), np.float32))
for sc in S["scenes"]:
    vname = sc.get("voice", S["voice"])
    if vname == "blend": vs = k.get_voice_style("am_michael") * 0.65 + k.get_voice_style("am_fenrir") * 0.35
    else: vs = vname
    jit = [0, 0.03, -0.02, 0.04, -0.01, 0.02, -0.03][len(segs) % 7] if "speed" not in sc else 0   # natural pace variation line to line
    if sc["text"].rstrip().endswith("?"): jit -= 0.03
    a, sr = k.create(sc["text"], voice=vs, speed=sc.get("speed", S["speed"]) + jit, lang="en-us")
    if sc.get("pitch"):
        f = sc["pitch"]; a = np.interp(np.arange(0, len(a), f), np.arange(len(a)), a).astype(np.float32)
    d = len(a) / sr; pause = sc.get("pause", 0.2)
    words = sc["text"].split(); lens = [len(w) + 1 for w in words]; tot = sum(lens); acc = 0; wt = []
    for w, l in zip(words, lens): wt.append([w, t + d * acc / tot]); acc += l
    segs.append({"shot": sc["shot"], "start": t, "dur": d + pause, "words": wt})
    parts += [a.astype(np.float32), np.zeros(int(pause * sr), np.float32)]; t += d + pause
end = 4.0; total = t + end
segs.append({"shot": "end", "start": t, "dur": end, "words": []})
v = np.concatenate(parts); N = int(total * sr); voice = np.zeros(N); voice[:len(v)] = v
# warmth + gentle compression + small room, so it sounds less synthetic
lo = np.convolve(voice, np.ones(24) / 24, 'same'); voice = voice + 0.35 * lo
voice = np.tanh(voice * 1.6) / 1.6
ir = np.random.default_rng(3).standard_normal(int(0.35 * sr)) * np.exp(-np.arange(int(0.35 * sr)) / sr * 14); ir /= np.abs(ir).sum() / 6
wet = np.convolve(voice, ir)[:N]; voice = voice * 0.9 + wet * 0.12
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
def clang(t0, q, amp=0.4):
    i0 = int(t0 * sr); n = int(0.9 * sr); x = np.arange(n) / sr
    mus[i0:i0 + n] += (np.sin(2 * np.pi * 523 * x) * 0.4 + np.sin(2 * np.pi * 1340 * x) * 0.3 + np.sin(2 * np.pi * 2110 * x) * 0.2) * np.exp(-x * 7) * amp + np.random.default_rng(q + 70).standard_normal(n) * np.exp(-x * 40) * amp * 0.5
def scrape(t0, q, amp=0.2):
    i0 = int(t0 * sr); n = int(0.4 * sr); x = np.arange(n) / sr; nz = np.convolve(np.random.default_rng(q + 99).standard_normal(n), np.ones(6) / 6, 'same'); mus[i0:i0 + n] += nz * np.sin(np.pi * x / 0.4) ** 2 * amp
hk, sd, br, fl, nt, bt, kd, ask = [g(n) for n in ("r_hook", "r_side", "r_breathe", "r_fool", "r_night", "r_but", "r_kid", "r_ask")]
mus *= duck(0, sd["start"], 0.45) * duck(nt["start"], ask["start"], 0.04)
mus2 = mus.copy(); mus = np.zeros(N)
for q in range(22):
    t0 = sd["start"] + 0.3 + q * 0.75
    if t0 > g("r_pipe")["start"]: break
    scrape(t0, q, 0.12)
i0 = int(br["start"] * sr); n = int(3 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.convolve(np.random.default_rng(5).standard_normal(n), np.ones(40) / 40, 'same') * np.sin(np.pi * x / 3) * 0.5
for q, f in enumerate([523, 659, 784, 1047]):
    i0 = int((br["start"] + 0.2 + q * 0.12) * sr); n = int(0.5 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * f * x) * np.exp(-x * 7) * 0.07
i0 = int((nt["start"] + 0.5) * sr); n = int((ask["start"] - nt["start"]) * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * 44 * x) * np.minimum(1, x) * 0.13
mus += mus2
mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.8); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
