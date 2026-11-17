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
snores(0.0, T_["d_pillow"] + 0.9, 0.15)
EV["slam"] = T_["d_pillow"] + g("d_pillow")["dur"] - 0.35; bonk(EV["slam"], 0.6)
EV["shred"] = wt("d_shred", "shreds"); snore(EV["shred"], 0.9, 0.3, 140); noise(EV["shred"], 0.8, 0.12, 6, lambda x: np.exp(-x * 4))
snores(T_["d_idea"], T_["d_feed"], 0.05)
EV["in"] = wt("d_feed", "log"); EV["chair"] = wt("d_feed", "chair"); snore(EV["in"], EV["chair"] - EV["in"], 0.26, 150); pop(EV["chair"], 1568, 0.1); pop(EV["chair"] + 0.08, 2093, 0.08)
EV["tree"] = wt("d_tree", "tree"); EV["table"] = wt("d_tree", "table"); EV["shelf"] = wt("d_tree", "bookshelf"); EV["set"] = wt("d_tree", "bedroom")
snore(EV["tree"], EV["set"] + 0.6 - EV["tree"], 0.2, 150)
for k_, f in (("table", 1175), ("shelf", 1397), ("set", 1760)): pop(EV[k_], f, 0.09)
EV["boom"] = wt("d_store", "blows"); ching(T_["d_store"] + 0.5); ching(EV["boom"]); ching(EV["boom"] + 0.3)
snores(T_["d_orders"], T_["d_wake"], 0.07)
EV["perfect"] = wt("d_orders", "perfect"); pop(EV["perfect"], 1047, 0.08)
# he wakes up: birds
for q in range(8):
    t0 = T_["d_wake"] + 0.2 + q * 0.33; i0 = int(t0 * sr); n = int(0.12 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (2600 + 900 * np.sin(2 * np.pi * 9 * x)) * x) * np.sin(np.pi * x / 0.12) * 0.03
# the factory stops: power-down + alarm
EV["stop"] = T_["d_stop"]; i0 = int(EV["stop"] * sr); n = int(1.0 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * np.cumsum(220 * np.exp(-x * 3.2)) / sr) * np.exp(-x * 1.5) * 0.25
for q in range(3):
    i0 = int((EV["stop"] + 1.15 + q * 0.42) * sr); n = int(0.26 * sr); x = np.arange(n) / sr
    if i0 + n < N: mus[i0:i0 + n] += np.sign(np.sin(2 * np.pi * 440 * x)) * 0.05
# lullaby (soft, original little tune)
for i_, f in enumerate([659.3, 587.3, 523.3, 587.3, 659.3, 659.3, 659.3, 0, 587.3, 587.3, 587.3, 0, 659.3, 784.0, 784.0]):
    if f: note(T_["d_lull"] + 0.2 + i_ * 0.3, f, 0.035, 4, 0.5)
bt = 60 / 140; bass = [130.8, 130.8, 174.6, 196.0]; mel = [523.3, 659.3, 784.0, 659.3, 587.3, 698.5, 784.0, 880.0]
mute = [(0, T_["d_pillow"]), (EV["slam"] - 0.25, T_["d_idea"]), (EV["chair"] - 0.2, T_["d_nice"] + 0.6), (T_["d_stop"] - 0.3, total)]
k_ = 0
for t0 in np.arange(T_["d_pillow"], total, bt / 2):
    k_ += 1
    if any(a0 <= t0 < a1 for a0, a1 in mute): continue
    if k_ % 2 == 0: note(t0, bass[(k_ // 16) % 4] / 2 * (1.5 if k_ % 8 == 6 else 1), 0.09, 7, 0.4)
    if k_ % 4 in (1, 3): note(t0, mel[(k_ // 2) % 8], 0.035, 12, 0.3)
    if k_ % 4 == 2: noise(t0, 0.05, 0.05, 2, lambda x: np.exp(-x * 80))
total_fade = 0.25

mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
