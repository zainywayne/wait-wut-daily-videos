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
mus += nz * (0.09 + 0.05 * np.sin(2 * np.pi * xs / 5.5))
def splash(t0, amp=0.25): noise(t0, 0.6, amp, 6, lambda x: np.exp(-x * 7))
def buzzer(t0, amp=0.09):
    i0 = int(t0 * sr); n = int(0.45 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sign(np.sin(2 * np.pi * 110 * x)) * np.minimum(1, x * 60) * np.exp(-x * 3) * amp
def whomp(t0, amp=0.5):
    i0 = int(t0 * sr); n = int(0.5 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (60 + 140 * np.exp(-x * 10)) * x) * np.exp(-x * 6) * amp
EV["spit"] = 0.0; whomp(0.0, 0.4); splash(0.02, 0.2); noise(0.05, 0.9, 0.06, 30, lambda x: np.sin(np.pi * np.minimum(1, x / 0.9)))
EV["land"] = 1.35; bonk(EV["land"], 0.45); noise(EV["land"], 0.3, 0.12, 3, lambda x: np.exp(-x * 14))
EV["tiny"] = wt("d_tiny", "smallest"); noise(EV["tiny"] - 0.3, 0.6, 0.06, 30, lambda x: np.sin(np.pi * np.minimum(1, x / 0.6)) ** 2)
EV["swim"] = T_["d_swim"]
for q in range(7): splash(EV["swim"] + 0.1 + q * 0.26, 0.05)
EV["fin"] = T_["d_nope1"] - 0.35; note(EV["fin"], 82.4, 0.2, 3, 0.35); note(EV["fin"] + 0.4, 87.3, 0.2, 3, 0.35)
EV["n1"] = wt("d_nope1", "nope") + 0.3; buzzer(EV["n1"])
for q in range(8): splash(EV["n1"] - 0.1 + q * 0.09, 0.05)
EV["coco"] = wt("d_coco", "coconut") + 0.5; EV["n2"] = wt("d_nope2", "nope"); bonk(EV["n2"] - 0.05, 0.5); buzzer(EV["n2"] + 0.3)
EV["help"] = wt("d_help", "help"); for_ = [noise(EV["help"] + 0.1 + q * 0.28, 0.2, 0.04, 8, lambda x: np.sin(np.pi * x / 0.2)) for q in range(4)]
EV["wave"] = T_["d_nope3"] - 0.4; noise(EV["wave"], 1.2, 0.16, 4, lambda x: np.sin(np.pi * np.minimum(1, x / 1.2)) ** 1.5); EV["n3"] = wt("d_nope3", "nope") + 0.35; buzzer(EV["n3"])
EV["you"] = wt("d_you", "you"); note(EV["you"], 523.3, 0.05, 3, 1.2); note(EV["you"] + 0.15, 659.3, 0.04, 3, 1.2); note(EV["you"] + 0.3, 784, 0.04, 3, 1.2)
EV["top"] = wt("d_rule", "top"); EV["built"] = wt("d_rule", "built"); pop(EV["top"], 784); ching(EV["built"], 0.07)
EV["terr"] = wt("d_troll", "terrible"); whomp(EV["terr"], 0.35); noise(EV["terr"], 1.0, 0.07, 2, lambda x: np.exp(-x * 3))
EV["end"] = T_["d_end"]; EV["get"] = wt("d_end", "get"); pop(EV["get"], 988); pop(EV["get"] + 0.08, 1175)
bt = 60 / 108; bass = [130.8, 174.6, 196.0, 130.8]; mel = [659.3, 784.0, 880.0, 784.0, 659.3, 587.3, 523.3, 587.3]
mute = [(EV["fin"] - 0.1, EV["n1"] + 0.3), (EV["terr"] - 0.05, EV["terr"] + 0.8)]
k_ = 0
for t0 in np.arange(0.0, total, bt / 2):
    k_ += 1
    if any(a0 <= t0 < a1 for a0, a1 in mute): continue
    if k_ % 2 == 0: note(t0, bass[(k_ // 16) % 4] / 2, 0.07, 6, 0.45)
    if k_ % 2 == 1: note(t0, mel[(k_ // 2) % 8], 0.028, 9, 0.25); note(t0 + bt / 4, mel[(k_ // 2 + 2) % 8], 0.016, 9, 0.2)

mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
