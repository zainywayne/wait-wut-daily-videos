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
def brick(t0, amp=0.12):
    i0 = int(t0 * sr); n = int(0.08 * sr); x = np.arange(n) / sr
    if i0 + n < N: mus[i0:i0 + n] += (np.sin(2 * np.pi * 420 * x) * 0.6 + np.random.default_rng(int(t0 * 77)).standard_normal(n) * 0.5) * np.exp(-x * 50) * amp
EV["drop"] = 0.6; noise(0.0, 0.6, 0.07, 30, lambda x: np.sin(np.pi * np.minimum(1, x / 0.6)) ** 2); whomp(EV["drop"], 0.7); EV["burst"] = EV["drop"] + 0.25
for q in range(14): brick(EV["burst"] + q * 0.05 + (q % 3) * 0.02, 0.1)
EV["recap"] = T_["d4_recap"]; noise(EV["recap"] - 0.15, 0.4, 0.07, 30, lambda x: np.sin(np.pi * x / 0.4) ** 2); EV["rchain"] = wt("d4_recap", "leave"); clank(EV["rchain"], 0.1); EV["rrex"] = wt("d4_recap", "eats"); roar(EV["rrex"], 0.6, 0.1)
EV["back"] = T_["d4_card"]; noise(EV["back"] - 0.15, 0.4, 0.07, 30, lambda x: np.sin(np.pi * x / 0.4) ** 2); EV["card"] = wt("d4_card", "same"); pop(EV["card"], 784); EV["again"] = wt("d4_card", "again"); ching(EV["again"], 0.08)
EV["hl"] = wt("d4_read", "house")
EV["never"] = wt("d4_never", "never"); note(EV["never"], 392, 0.05, 4, 0.4); note(EV["never"] + 0.3, 330, 0.05, 3, 0.6)
EV["try1"] = T_["d4_try1"]
for q in range(8): brick(EV["try1"] + 0.3 + q * 0.16, 0.08)
EV["sneeze"] = T_["d4_sneeze"] + 0.35; noise(EV["sneeze"] - 0.3, 0.3, 0.05, 6, lambda x: np.sin(np.pi * x / 0.3)); noise(EV["sneeze"], 0.35, 0.3, 2, lambda x: np.exp(-x * 8)); whomp(EV["sneeze"], 0.3)
for q in range(10): brick(EV["sneeze"] + 0.15 + q * 0.07, 0.1)
EV["nope"] = EV["sneeze"] + 0.55; buzzer(EV["nope"]); EV["ha1"] = EV["nope"] + 0.3; cackle(EV["ha1"])
EV["mix"] = wt("d4_mix", "tail"); noise(EV["mix"], 1.6, 0.06, 20, lambda x: 0.5 + 0.5 * np.sin(2 * np.pi * 3 * x))
EV["nail"] = wt("d4_nail", "head")
for q in range(5): bonk(EV["nail"] + 0.15 + q * 0.32, 0.35)
EV["later"] = T_["d4_later"]
for q in range(10): brick(EV["later"] + 0.1 + q * 0.12, 0.05)
EV["done"] = wt("d4_done", "house"); ching(EV["done"], 0.09); pop(EV["done"] + 0.1, 988); pop(EV["done"] + 0.2, 1175)
EV["why"] = wt("d4_why", "not"); note(EV["why"] + 0.3, 330, 0.05, 3, 0.6)
EV["pantry"] = wt("d4_pantry", "food"); ching(EV["pantry"], 0.08)
EV["c14"] = T_["d4_day14"]; flip(EV["c14"], 0.08); EV["fourteen"] = wt("d4_day14", "fourteen"); note(EV["fourteen"] + 0.1, 82.4, 0.24, 2.5, 0.5); note(EV["fourteen"] + 0.55, 77.8, 0.26, 2, 0.8); roar(EV["fourteen"] + 0.5, 0.7, 0.12)
EV["fit"] = wt("d4_fit", "fit"); bonk(EV["fit"], 0.5); EV["fit2"] = EV["fit"] + 0.35; bonk(EV["fit2"], 0.4)
EV["arms"] = wt("d4_arms", "short"); note(EV["arms"], 523, 0.04, 6, 0.3); note(EV["arms"] + 0.25, 494, 0.04, 6, 0.3); note(EV["arms"] + 0.5, 466, 0.05, 4, 0.6)
EV["sad"] = T_["d4_sad"]; note(EV["sad"] + 0.1, 392, 0.05, 2, 1.2); note(EV["sad"] + 0.5, 370, 0.05, 2, 1.2)
EV["share"] = wt("d4_share", "fish"); ching(EV["share"] + 0.2, 0.08); EV["gulp"] = EV["share"] + 0.6; note(EV["gulp"], 220, 0.12, 14, 0.25)
EV["ask"] = T_["d4_ask"]; ching(EV["ask"] + 0.3, 0.06)
EV["jet"] = wt("d4_ideas", "penguin"); EV["gran"] = wt("d4_ideas", "pizza"); EV["rex2"] = wt("d4_ideas", "volcano")
for k_, f_ in (("jet", 784), ("gran", 988), ("rex2", 1175)): pop(EV[k_], f_, 0.08)
EV["end"] = T_["d4_end"]; EV["anything"] = wt("d4_end", "anything"); EV["word"] = wt("d4_end", "built"); pop(EV["word"], 988); pop(EV["word"] + 0.08, 1175); ching(EV["anything"], 0.07)
bt = 60 / 112; bass = [130.8, 174.6, 196.0, 130.8]; mel = [659.3, 784.0, 880.0, 784.0, 659.3, 587.3, 523.3, 587.3]
mute = [(EV["drop"] - 0.05, EV["drop"] + 0.9), (EV["sneeze"] - 0.4, EV["nope"] + 0.4), (EV["fourteen"], EV["share"] - 0.1)]
k_ = 0
for t0 in np.arange(0.0, total, bt / 2):
    k_ += 1
    if any(a0 <= t0 < a1 for a0, a1 in mute): continue
    fast = EV["mix"] <= t0 < EV["done"]
    if k_ % 2 == 0: note(t0, bass[(k_ // 16) % 4] / 2, 0.075, 6, 0.45)
    if k_ % 2 == 1 or fast: note(t0, mel[(k_ // 2) % 8] * (2 if fast and k_ % 2 == 0 else 1), 0.028, 9, 0.25)

mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
