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
def chomp(t0, amp=0.18):
    i0 = int(t0 * sr); n = int(0.09 * sr)
    if i0 + n >= N: return
    x = np.arange(n) / sr; nz = np.random.default_rng(int(t0 * 1000)).standard_normal(n); nz = np.convolve(nz, np.ones(3) / 3, 'same')
    mus[i0:i0 + n] += (nz * 0.7 + np.sin(2 * np.pi * 180 * x)) * np.exp(-x * 45) * amp
def chomps(t0, t1, amp=0.16, per=0.2):
    for q in np.arange(t0, t1, per): chomp(q, amp)
def bark(t0, amp=0.42):
    i0 = int(t0 * sr); n = int(0.24 * sr); x = np.arange(n) / sr
    f = 520 - 260 * (x / 0.24); ph = 2 * np.pi * np.cumsum(f) / sr
    tone = np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.35 * np.sin(3 * ph) + 0.2 * np.sin(5 * ph)
    env = np.minimum(1, x * 120) * np.exp(-x * 9); nz = np.random.default_rng(int(t0 * 77)).standard_normal(n) * np.exp(-x * 40) * 0.5
    sig = np.tanh((tone + nz) * env * 2.2) * amp; mus[i0:i0 + n] += sig
def gavel(t0, amp=0.55):
    bonk(t0, amp); i0 = int(t0 * sr); n = int(0.06 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.random.default_rng(int(t0 * 31)).standard_normal(n) * np.exp(-x * 90) * amp * 0.6
def click(t0, amp=0.12):
    i0 = int(t0 * sr); n = int(0.05 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.random.default_rng(int(t0 * 913)).standard_normal(n) * np.exp(-x * 120) * amp
def thud(t0, amp=0.6):
    i0 = int(t0 * sr); n = int(0.5 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (55 + 90 * np.exp(-x * 18)) * x) * np.exp(-x * 7) * amp + np.convolve(np.random.default_rng(5).standard_normal(n), np.ones(20) / 20, 'same') * np.exp(-x * 10) * amp
EV["chomp0"] = 0.0; chomps(0.0, T_["d_prove"] - 0.05, 0.15, 0.19)
EV["prove"] = wt("d_prove", "prove"); pop(EV["prove"], 392, 0.09); pop(EV["prove"] + 0.1, 330, 0.08)
EV["evid"] = wt("d_evid", "evidence")
EV["burp"] = wt("d_inside", "dog") + 0.45; i0 = int(EV["burp"] * sr); n = int(0.3 * sr); x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * np.cumsum(110 + 25 * np.sin(2 * np.pi * 31 * x)) / sr) * np.sin(np.pi * x / 0.3) * 0.25
EV["slam"] = wt("d_eat", "slams"); thud(EV["slam"], 0.4)
EV["eatthis"] = wt("d_eat", "eat")
EV["eat"] = wt("d_gulp", "eats"); chomps(EV["eat"], EV["eat"] + 0.7, 0.2, 0.12); EV["gulp"] = EV["eat"] + 0.75; note(EV["gulp"], 220, 0.12, 14, 0.25)
EV["dism"] = wt("d_gulp", "dismissed"); gavel(EV["dism"]); gavel(EV["dism"] + 0.18, 0.4)
EV["bulb"] = wt("d_famous", "hold"); ching(EV["bulb"] + 0.05, 0.08); EV["never"] = wt("d_famous", "never")
EV["cookie"] = wt("d_cookie", "eats"); chomps(EV["cookie"], EV["cookie"] + 0.45, 0.17, 0.13); EV["ng1"] = wt("d_cookie", "not"); gavel(EV["ng1"])
EV["money"] = wt("d_bank", "eats"); chomps(EV["money"], EV["money"] + 0.45, 0.17, 0.13); EV["ng2"] = wt("d_bank", "not"); gavel(EV["ng2"]); ching(EV["money"] + 0.2, 0.06)
EV["star"] = T_["d_star"]
for q in range(9): click(EV["star"] + 0.15 + q * 0.27 + (q % 3) * 0.05, 0.1)
EV["famous"] = wt("d_star", "famous"); ching(EV["famous"], 0.08)
EV["hire"] = wt("d_hire", "hires"); pop(EV["hire"], 1047, 0.08); pop(EV["hire"] + 0.08, 1319, 0.07)
EV["sue"] = wt("d_sue", "sue"); thud(EV["sue"], 0.55); note(EV["sue"], 110, 0.18, 2, 1.2); note(EV["sue"], 116.5, 0.14, 2, 1.2)
EV["rule"] = T_["d_rule"]; EV["once"] = wt("d_rule", "once"); EV["twice"] = wt("d_rule", "twice")
EV["q"] = T_["d_q"]
for q in range(14): note(EV["q"] + q * 0.22, 55, 0.07 + q * 0.006, 14, 0.2)
EV["bark1"] = T_["d_bark"] + 0.3; EV["bark2"] = T_["d_bark"] + 0.95; bark(EV["bark1"]); bark(EV["bark2"])
EV["gasp"] = T_["d_bark"] + 1.35; noise(EV["gasp"], 0.5, 0.05, 12, lambda x: np.sin(np.pi * np.minimum(1, x / 0.5)))
EV["blank"] = wt("d_blank", "blank"); note(EV["blank"], 880, 0.06, 5, 0.8); note(EV["blank"], 1318, 0.04, 5, 0.8)
EV["never2"] = wt("d_blank", "never")
EV["stack"] = wt("d_sent", "thousand"); thud(EV["stack"], 0.6); EV["sgavel"] = wt("d_sent", "judge"); gavel(EV["sgavel"], 0.45)
EV["lick"] = wt("d_loop", "licking"); noise(EV["lick"], 0.5, 0.06, 4, lambda x: np.sin(np.pi * np.minimum(1, x / 0.5)) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * x)))
EV["tom"] = wt("d_loop", "tomorrow")
chomps(total - 0.35, total, 0.12, 0.19)
bt = 60 / 132; bass = [146.8, 146.8, 196.0, 220.0]; mel = [587.3, 740.0, 880.0, 740.0, 659.3, 784.0, 880.0, 987.8]
mute = [(EV["sue"] - 0.1, EV["sue"] + 1.0), (EV["q"] - 0.1, EV["blank"] - 0.3), (EV["stack"] - 0.15, EV["stack"] + 0.5)]
k_ = 0
for t0 in np.arange(0.0, total, bt / 2):
    k_ += 1
    if any(a0 <= t0 < a1 for a0, a1 in mute): continue
    if k_ % 2 == 0: note(t0, bass[(k_ // 16) % 4] / 2 * (1.5 if k_ % 8 == 6 else 1), 0.085, 7, 0.4)
    if k_ % 4 in (1, 3): note(t0, mel[(k_ // 2) % 8], 0.03, 12, 0.3)
    if k_ % 4 == 2: noise(t0, 0.05, 0.045, 2, lambda x: np.exp(-x * 80))

mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
