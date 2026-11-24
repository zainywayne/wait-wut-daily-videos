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
EV["fall"] = 0.0; noise(0.0, 0.8, 0.08, 30, lambda x: np.sin(np.pi * np.minimum(1, x / 0.8)) ** 2)
EV["splash"] = 0.78; whomp(EV["splash"], 0.55); splash(EV["splash"], 0.35, 1.0)
EV["yacht"] = wt("d2_drop", "yacht"); ching(EV["yacht"] + 0.1, 0.07)
EV["recap"] = T_["d2_recap"]; noise(EV["recap"] - 0.15, 0.4, 0.07, 30, lambda x: np.sin(np.pi * x / 0.4) ** 2)
EV["back"] = T_["d2_rule"]; noise(EV["back"] - 0.15, 0.4, 0.07, 30, lambda x: np.sin(np.pi * x / 0.4) ** 2)
EV["chain"] = wt("d2_rule", "rule") + 0.1; clank(EV["chain"]); clank(EV["chain"] + 0.3, 0.1); whomp(EV["chain"] + 0.3, 0.25)
EV["card"] = T_["d2_card"]; pop(EV["card"], 784); EV["chained"] = wt("d2_card", "chained")
EV["party"] = T_["d2_party"]; EV["fine"] = wt("d2_party", "fine")
EV["go"] = wt("d2_go", "full"); engine(EV["go"] - 0.1, 1.6, 0.09, 50, 95)
EV["snap"] = T_["d2_snap"] + 0.05; clank(EV["snap"], 0.18); whomp(EV["snap"], 0.5); bonk(EV["snap"] + 0.12, 0.5); buzzer(EV["snap"] + 0.5); EV["ha1"] = EV["snap"] + 0.6; cackle(EV["ha1"])
EV["try"] = T_["d2_try"]; EV["lever"] = wt("d2_try", "harder"); EV["circ"] = EV["lever"] + 0.35
EV["gas"] = T_["d2_gas"]; EV["out"] = wt("d2_gas", "out"); engine(EV["lever"], EV["out"] + 0.3 - EV["lever"], 0.1, 70, 140); engine(EV["out"] + 0.3, 0.8, 0.07, 140, 35)
for q in range(4): bonk(EV["out"] + 0.9 + q * 0.26 + (q % 2) * 0.06, 0.12)
for q in range(10): splash(EV["circ"] + q * 0.35, 0.04, 0.3)
EV["ha2"] = EV["out"] + 1.0; cackle(EV["ha2"], 0.06)
EV["stop"] = T_["d2_stop"]; note(EV["stop"], 392, 0.05, 3, 0.8); note(EV["stop"] + 0.4, 330, 0.05, 3, 1.0)
EV["home"] = wt("d2_home", "in")
for q in range(4): pop(EV["home"] + 0.1 + q * 0.2, [659, 784, 880, 1047][q], 0.07)
EV["fish"] = T_["d2_fish"]; EV["cast"] = wt("d2_fish", "back"); noise(EV["cast"], 0.3, 0.06, 20, lambda x: np.sin(np.pi * x / 0.3)); splash(EV["cast"] + 0.35, 0.06, 0.3)
EV["boot"] = EV["cast"] + 0.9; splash(EV["boot"], 0.1, 0.4); buzzer(EV["boot"] + 0.15, 0.06)
EV["catch"] = EV["boot"] + 1.0; splash(EV["catch"], 0.14, 0.5); ching(EV["catch"] + 0.15, 0.08)
EV["sunS"] = T_["d_sun"]; EV["dinner"] = wt("d_sun", "dinner"); ching(EV["dinner"], 0.07)
for q in range(5): note(EV["sunS"] + q * 0.45, [523.3, 659.3, 784, 659.3, 880][q], 0.04, 3, 0.9)
EV["night"] = T_["d_night"]; EV["circling"] = wt("d_night", "circling"); note(EV["circling"], 82.4, 0.2, 3, 0.4); note(EV["circling"] + 0.45, 87.3, 0.2, 3, 0.4); note(EV["circling"] + 0.9, 82.4, 0.2, 3, 0.4); note(EV["circling"] + 1.3, 87.3, 0.22, 3, 0.5)
EV["end"] = T_["d2_end"]; EV["word"] = wt("d2_end", "word"); pop(EV["word"], 988); pop(EV["word"] + 0.08, 1175)
bt = 60 / 112; bass = [130.8, 174.6, 196.0, 130.8]; mel = [659.3, 784.0, 880.0, 784.0, 659.3, 587.3, 523.3, 587.3]
mute = [(EV["snap"] - 0.05, EV["snap"] + 0.5), (EV["out"] + 0.3, EV["stop"] + 1.2), (EV["circling"] - 0.1, EV["end"] - 0.05)]
k_ = 0
for t0 in np.arange(0.0, total, bt / 2):
    k_ += 1
    if any(a0 <= t0 < a1 for a0, a1 in mute): continue
    fast = EV["circ"] <= t0 < EV["out"] + 0.3
    if k_ % 2 == 0: note(t0, bass[(k_ // 16) % 4] / 2, 0.075, 6, 0.45)
    if k_ % 2 == 1 or fast: note(t0, mel[(k_ // 2) % 8] * (2 if fast and k_ % 2 == 0 else 1), 0.028, 9, 0.25)

mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
