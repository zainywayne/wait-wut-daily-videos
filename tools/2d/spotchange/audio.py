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
    if not sc["text"].strip(): a = np.zeros(1, np.float32)
    else: a, sr = k.create(sc["text"], voice=vs, speed=sc.get("speed", S["speed"]) + jit, lang="en-us")
    if sc.get("pitch"):
        f = sc["pitch"]; a = np.interp(np.arange(0, len(a), f), np.arange(len(a)), a).astype(np.float32)
    d = len(a) / sr; pause = sc.get("pause", 0.2)
    words = sc["text"].split(); lens = [len(w) + 1 for w in words]; tot = sum(lens); acc = 0; wt = []
    for w, l in zip(words, lens): wt.append([w, t + d * acc / tot]); acc += l
    segs.append({"shot": sc["shot"], "start": t, "dur": d + pause, "words": wt})
    parts += [a.astype(np.float32), np.zeros(int(pause * sr), np.float32)]; t += d + pause
end = 0.5; total = t + end
segs.append({"shot": "end", "start": t, "dur": end, "words": []})
v = np.concatenate(parts); N = int(total * sr); voice = np.zeros(N); voice[:len(v)] = v
# warmth + gentle compression + small room, so it sounds less synthetic
lo = np.convolve(voice, np.ones(24) / 24, 'same'); voice = voice + 0.35 * lo
voice = np.tanh(voice * 1.6) / 1.6
ir = np.random.default_rng(3).standard_normal(int(0.35 * sr)) * np.exp(-np.arange(int(0.35 * sr)) / sr * 14); ir /= np.abs(ir).sum() / 6
wet = np.convolve(voice, ir)[:N]; voice = voice * 0.9 + wet * 0.12
tt = np.arange(N) / sr; mus = np.zeros(N)
g = lambda n: next(x for x in segs if x["shot"] == n); sec = lambda n: g(n)["start"]
def wt(shot, word, nth=0):
    hits = [t0 for w, t0 in g(shot)["words"] if word in w.lower()]; return hits[nth]
def note(t0, f, amp, dec=9, dur=0.5):
    i0 = int(t0 * sr); n = min(int(dur * sr), N - i0)
    if n <= 0 or i0 < 0: return
    x = np.arange(n) / sr; mus[i0:i0 + n] += (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x) * np.exp(-x * 6)) * np.exp(-x * dec) * np.minimum(1, x * 300) * amp
def beep(t0, n_=3, amp=0.07, f=1760):
    for q in range(n_):
        i0 = int((t0 + q * 0.16) * sr); n = int(0.09 * sr)
        if i0 + n >= N: return
        x = np.arange(n) / sr; mus[i0:i0 + n] += np.sign(np.sin(2 * np.pi * f * x)) * amp * np.minimum(1, x * 400) * np.minimum(1, (0.09 - x) * 400)
def bonk(t0, amp=0.5):
    i0 = int(t0 * sr); n = int(0.25 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (90 + 160 * np.exp(-x * 30)) * x) * np.exp(-x * 16) * amp + np.random.default_rng(int(t0 * 50)).standard_normal(n) * np.exp(-x * 70) * amp * 0.4
def noise(t0, dur, amp, smooth, shape):
    i0 = int(t0 * sr); n = min(int(dur * sr), N - i0); x = np.arange(n) / sr; nz = np.convolve(np.random.default_rng(int(t0 * 100)).standard_normal(n), np.ones(smooth) / smooth, 'same'); mus[i0:i0 + n] += nz * shape(x) * amp
EV = {}
def snore(t0, dur, amp, f=92):
    i0 = int(t0 * sr); n = min(int(dur * sr), N - i0)
    if n <= 0: return
    x = np.arange(n) / sr; saw = 2 * ((f * x * (1 + 0.04 * np.sin(2 * np.pi * 3 * x))) % 1) - 1; saw = np.convolve(saw, np.ones(5) / 5, 'same')
    env = np.sin(np.pi * np.minimum(1, x / dur)) ** 0.6 * (0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 24 * x)))
    mus[i0:i0 + n] += saw * env * amp
def snores(t0, t1, amp, period=1.25):
    for q in np.arange(t0, t1 - 0.3, period): snore(q, min(0.8, t1 - q), amp)
def ching(t0, amp=0.09):
    for d, f in ((0, 1568), (0.09, 2093)): note(t0 + d, f, amp, 6, 0.6)
names = [x["shot"] for x in segs if x["shot"] != "end"]; T_ = {n: sec(n) for n in names}
def pop(t0, f, amp=0.07): note(t0, f, amp, 10, 0.35)
def tick(t0, amp=0.08, f=2400):
    i0 = int(t0 * sr); n = int(0.03 * sr)
    if i0 + n >= N: return
    x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * f * x) * np.exp(-x * 220) * amp + np.random.default_rng(int(t0 * 99)).standard_normal(n) * np.exp(-x * 300) * amp * 0.5
def whoosh(t0, amp=0.08): noise(t0, 0.45, amp, 30, lambda x: np.sin(np.pi * np.minimum(1, x / 0.45)) ** 2)
def ding(t0, amp=0.1): note(t0, 1318.5, amp, 4, 1.0); note(t0 + 0.07, 1975.5, amp * 0.7, 4, 1.0)
def buzz(t0, amp=0.06):
    i0 = int(t0 * sr); n = int(0.35 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sign(np.sin(2 * np.pi * 150 * x)) * np.exp(-x * 6) * amp
for r, c in (("r1", 8), ("r2", 8), ("r3", 10)):
    c0 = T_[r + "_c"]; EV[r + "c"] = c0
    for q in range(c): tick(c0 + q, 0.1, 2400); tick(c0 + q + 0.5, 0.05, 1800)
    for q in range(c):   # low pulse that speeds up near the end
        note(c0 + q, 73.4, 0.05 + 0.03 * q / c, 6, 0.6)
    for q in range(3): note(c0 + c - 3 + q, 440, 0.05, 8, 0.25)
    buzz(c0 + c, 0.07)
EV["w1"] = wt("r1_r", "white"); EV["n1"] = T_["r1_r2"]; whoosh(EV["w1"] - 0.15); ding(EV["n1"] + 0.1)
EV["p2"] = wt("r2_r", "painting"); EV["f2"] = wt("r2_r", "faded"); whoosh(EV["p2"] - 0.15); ding(EV["f2"] + 0.1)
EV["cat"] = wt("r3_r", "cat"); EV["dbl"] = wt("r3_r", "doubled"); whoosh(EV["cat"] - 0.15); ding(EV["dbl"] + 0.1)
EV["walls"] = wt("r3_r2", "walls"); whoosh(EV["walls"] - 0.15); EV["two"] = T_["r3_r3"]; ding(EV["two"] + 0.1); ding(EV["two"] + 0.35, 0.08)
EV["four"] = wt("out", "four"); EV["again"] = wt("out", "again")
for k, n_ in (("r1_in", "r1_c"), ("r2_in", "r2_c"), ("r3_in", "r3_c")): pop(T_[k] + 0.02, 784, 0.06); pop(T_[k] + 0.1, 1047, 0.05)
bt = 60 / 118; bass = [130.8, 110.0, 87.3, 98.0]; mel = [523.3, 659.3, 784.0, 659.3, 587.3, 698.5, 784.0, 880.0]
mute = [(T_[r + "_c"] - 0.1, T_[r + "_c"] + c + 0.3) for r, c in (("r1", 8), ("r2", 8), ("r3", 10))]
k_ = 0
for t0 in np.arange(0.0, total, bt / 2):
    k_ += 1
    if any(a0 <= t0 < a1 for a0, a1 in mute): continue
    if k_ % 2 == 0: note(t0, bass[(k_ // 16) % 4] / 2, 0.07, 7, 0.4)
    if k_ % 4 in (1, 3): note(t0, mel[(k_ // 2) % 8], 0.025, 12, 0.3)

mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
