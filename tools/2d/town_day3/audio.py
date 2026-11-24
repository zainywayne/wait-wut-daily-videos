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
rng = np.random.default_rng(3)
nz = np.convolve(rng.standard_normal(N), np.ones(60) / 60, 'same'); xs = np.arange(N) / sr
mus += nz * (0.08 + 0.05 * np.sin(2 * np.pi * xs / 5.5))
def splash(t0, amp=0.25, d=0.6): noise(t0, d, amp, 6, lambda x: np.exp(-x * 7))
def buzzer(t0, amp=0.09):
    i0 = int(t0 * sr); n = int(0.45 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sign(np.sin(2 * np.pi * 110 * x)) * np.minimum(1, x * 60) * np.exp(-x * 3) * amp
def whomp(t0, amp=0.5):
    i0 = int(t0 * sr); n = int(0.5 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (60 + 140 * np.exp(-x * 10)) * x) * np.exp(-x * 6) * amp
def clank(t0, amp=0.12):
    for k in range(3):
        i0 = int((t0 + k * 0.07) * sr); n = int(0.12 * sr); x = np.arange(n) / sr
        mus[i0:i0 + n] += (np.sin(2 * np.pi * (1900 + k * 310) * x) + 0.6 * np.sin(2 * np.pi * (2870 + k * 170) * x)) * np.exp(-x * 40) * amp
def engine(t0, d, amp=0.08, f0=55, f1=55):
    i0 = int(t0 * sr); n = int(d * sr); x = np.arange(n) / sr
    if i0 + n >= N: n = N - i0 - 1; x = x[:n]
    f = f0 + (f1 - f0) * x / d; ph = 2 * np.pi * np.cumsum(f) / sr; saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    env = np.minimum(1, x * 8) * np.minimum(1, (d - x) * 6); mus[i0:i0 + n] += np.tanh(saw * 2 * (1 + 0.3 * np.sin(2 * np.pi * 9 * x))) * env * amp
def cackle(t0, amp=0.07):
    for k in range(4):
        i0 = int((t0 + k * 0.13) * sr); n = int(0.09 * sr); x = np.arange(n) / sr
        f = 1300 - 500 * x / 0.09 + 80 * np.sin(2 * np.pi * 60 * x); mus[i0:i0 + n] += np.tanh(2.5 * np.sin(2 * np.pi * np.cumsum(f) / sr)) * np.sin(np.pi * x / 0.09) * amp
def roar(t0, d=1.2, amp=0.22):
    i0 = int(t0 * sr); n = int(d * sr); x = np.arange(n) / sr
    f = 70 + 60 * np.sin(np.pi * x / d); ph = 2 * np.pi * np.cumsum(f) / sr; saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    nz2 = np.convolve(np.random.default_rng(int(t0 * 9)).standard_normal(n), np.ones(6) / 6, 'same'); env = np.minimum(1, x * 6) * np.minimum(1, (d - x) * 3)
    mus[i0:i0 + n] += np.tanh((saw * 0.8 + nz2 * 1.2) * 2.5 * (1 + 0.4 * np.sin(2 * np.pi * 23 * x))) * env * amp
def slurp(t0, amp=0.12): noise(t0, 0.7, amp, 4, lambda x: np.sin(np.pi * x / 0.7) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * x)))
def flip(t0, amp=0.06): noise(t0, 0.25, amp, 2, lambda x: np.sin(np.pi * x / 0.25) * np.exp(-x * 4))
EV["drop"] = 0.55; noise(0.0, 0.55, 0.07, 30, lambda x: np.sin(np.pi * np.minimum(1, x / 0.55)) ** 2); whomp(EV["drop"], 0.7); whomp(EV["drop"] + 0.05, 0.4); splash(EV["drop"] + 0.05, 0.3, 1.0); roar(EV["drop"] + 0.45, 1.3, 0.2)
EV["trex"] = wt("d3_drop", "t-rex")
EV["recap"] = T_["d3_recap"]; noise(EV["recap"] - 0.15, 0.4, 0.07, 30, lambda x: np.sin(np.pi * x / 0.4) ** 2); EV["chained"] = wt("d3_recap", "chained"); clank(EV["chained"], 0.12)
EV["back"] = T_["d3_card"]; noise(EV["back"] - 0.15, 0.4, 0.07, 30, lambda x: np.sin(np.pi * x / 0.4) ** 2)
EV["card"] = wt("d3_card", "comment"); pop(EV["card"], 784); EV["every"] = wt("d3_read", "every"); EV["anyall"] = wt("d3_read", "any")
EV["scared"] = T_["d3_scared"]; roar(EV["scared"] + 0.1, 0.8, 0.12)
EV["lick"] = wt("d3_lick", "licks") + 0.1; slurp(EV["lick"]); EV["ha1"] = EV["lick"] + 0.8; cackle(EV["ha1"])
EV["friends"] = wt("d3_friends", "best"); ching(EV["friends"], 0.08); pop(EV["friends"] + 0.2, 988); pop(EV["friends"] + 0.3, 1175)
for k_, sh in (("c1", "d3_day1"), ("c4", "d3_day4"), ("c6", "d3_day6")): EV[k_] = T_[sh]; flip(EV[k_])
EV["shark"] = wt("d3_day1", "scares"); roar(EV["shark"], 0.7, 0.12); splash(EV["shark"] + 0.4, 0.1, 0.6)
EV["catch"] = wt("d3_day4", "catches"); splash(EV["catch"], 0.15, 0.6); pop(EV["catch"] + 0.5, 660); pop(EV["catch"] + 0.62, 880)
EV["pile"] = wt("d3_day6", "pile"); ching(EV["pile"], 0.07)
EV["c7"] = T_["d3_day7"]; flip(EV["c7"], 0.08); EV["seven"] = wt("d3_day7", "seven"); note(EV["seven"], 82.4, 0.24, 2.5, 0.5); note(EV["seven"] + 0.45, 77.8, 0.26, 2, 0.8)
EV["eat"] = wt("d3_eat", "eats"); roar(EV["eat"] - 0.3, 0.6, 0.16); chomps(EV["eat"], EV["eat"] + 1.0, 0.2, 0.13) if False else None
EV["all"] = T_["d3_all"]; EV["hand"] = wt("d3_all", "hand")
for q in range(14): chomp_t = EV["eat"] + q * 0.17; noise(chomp_t, 0.08, 0.18, 2, lambda x: np.exp(-x * 40))
for w_ in ("fish", "coconuts", "hand"): t_ = wt("d3_all", w_) + 0.25; noise(t_, 0.1, 0.22, 2, lambda x: np.exp(-x * 30)); whomp(t_, 0.2)
EV["burp"] = T_["d3_burp"] + 0.2; i0 = int(EV["burp"] * sr); n = int(1.0 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.tanh(3 * np.sin(2 * np.pi * np.cumsum(75 + 18 * np.sin(2 * np.pi * 9 * x)) / sr)) * np.sin(np.pi * x / 1.0) * 0.28
EV["ha2"] = EV["burp"] + 0.95; cackle(EV["ha2"])
EV["again"] = T_["d3_again"]; EV["againw"] = wt("d3_again", "again"); for_ = [flip(EV["again"] + 0.2 + q * 0.12, 0.04) for q in range(7)]; note(EV["againw"], 98, 0.15, 2.5, 0.6)
EV["ask"] = T_["d3_ask"]; EV["hide"] = wt("d3_ask", "hide")
EV["end"] = T_["d3_end"]; EV["word"] = wt("d3_end", "word"); pop(EV["word"], 988); pop(EV["word"] + 0.08, 1175)
bt = 60 / 112; bass = [130.8, 174.6, 196.0, 130.8]; mel = [659.3, 784.0, 880.0, 784.0, 659.3, 587.3, 523.3, 587.3]
mute = [(EV["drop"] - 0.05, EV["drop"] + 1.2), (EV["seven"] - 0.3, EV["burp"] + 1.6)]
k_ = 0
for t0 in np.arange(0.0, total, bt / 2):
    k_ += 1
    if any(a0 <= t0 < a1 for a0, a1 in mute): continue
    fast = EV["c1"] <= t0 < EV["c7"] - 0.2
    if k_ % 2 == 0: note(t0, bass[(k_ // 16) % 4] / 2, 0.075, 6, 0.45)
    if k_ % 2 == 1 or fast: note(t0, mel[(k_ // 2) % 8] * (2 if fast and k_ % 2 == 0 else 1), 0.028, 9, 0.25)

mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
