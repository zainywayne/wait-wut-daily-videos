import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
W = "/home/claude/shorts_work"
S = json.load(open("script.json")); k = Kokoro(W + "/tts/kokoro-v1.0.onnx", W + "/tts/voices-v1.0.bin")
sr = 24000
TARGET = {"J": 4.2, "M": 3.3, "K": 3.9}; SPD = {"J": 1.0, "M": 1.0, "K": 1.15}
def squeeze(a):
    # shorten Kokoro's long pauses at punctuation inside a line
    fr = 240; e = np.array([np.sqrt(np.mean(a[i:i + fr] ** 2)) for i in range(0, len(a), fr)]); quiet = e < 0.008; out = []; i = 0
    while i < len(e):
        if quiet[i]:
            j = i
            while j < len(e) and quiet[j]: j += 1
            n = j - i; keep = n if n * fr / sr < 0.14 else int(0.1 * sr / fr); out.append(a[i * fr:(i + keep) * fr]); i = j
        else: out.append(a[i * fr:(i + 1) * fr]); i += 1
    return np.concatenate(out)
def gen(sc, sp):
    vs = k.get_voice_style("am_fenrir") * 0.75 + k.get_voice_style("am_onyx") * 0.25 if sc["spk"] == "M" else sc["voice"]
    a, _ = k.create(sc["text"], voice=vs, speed=sp, lang="en-us")
    nz = np.where(np.abs(a) > 0.004)[0]
    if len(nz): a = a[max(0, nz[0] - 1500): nz[-1] + 2400]
    a = squeeze(a); core = a[np.abs(a) > 0.004]; r = np.sqrt(np.mean(core ** 2)) if len(core) else 1
    return (a * (0.11 / r)).astype(np.float32)
def wps(sc, a): return len(sc["text"].split()) / max(0.2, len(a) / sr - 0.16)
for it in range(2):
    rates = {q: [] for q in "JMK"}
    for sc in S["scenes"]:
        if len(sc["text"].split()) >= 4: rates[sc["spk"]].append(wps(sc, gen(sc, SPD[sc["spk"]])))
    for q in "JMK": SPD[q] = float(np.clip(SPD[q] * TARGET[q] / np.median(rates[q]), 0.8, 1.4))
    print("speeds", {q: round(SPD[q], 2) for q in SPD}, {q: round(float(np.median(rates[q])), 2) for q in rates})
t = 0.1; clips = []; segs = []
for sc in S["scenes"]:
    sp = SPD[sc["spk"]] * (1.06 if sc["text"].endswith("!") and sc["spk"] != "M" else 1.0)
    a = gen(sc, sp); d = len(a) / sr; pause = sc.get("pause", 0.15)
    words = sc["text"].split(); lens = [len(w) + 1 for w in words]; tot = sum(lens); acc = 0; wt = []
    for w, l in zip(words, lens): wt.append([w, t + 0.06 + (d - 0.16) * acc / tot]); acc += l
    segs.append({"shot": sc["shot"], "spk": sc["spk"], "start": t, "dur": d + pause, "talk": d, "words": wt, "fx": sc.get("fx", {}), "zoom": sc.get("zoom"), "ev": sc.get("ev")})
    clips.append((t, sc["spk"], a)); t += d + pause
end = 0.6; total = t + end
segs.append({"shot": "end", "spk": "", "start": t, "dur": end, "talk": 0, "words": [], "fx": {}, "zoom": None, "ev": None})
N = int(total * sr) + sr; voice = np.zeros(N); tracks = {q: np.zeros(N) for q in "JMK"}
for t0, spk, a in clips:
    i0 = int(t0 * sr); voice[i0:i0 + len(a)] += a; tracks[spk][i0:i0 + len(a)] += a
N = int(total * sr); voice = voice[:N]
hop = sr // 30; env = {}
for q, tr in tracks.items():
    e = [float(np.sqrt(np.mean(tr[i:i + hop] ** 2))) for i in range(0, N, hop)]; p = np.percentile([x for x in e if x > 1e-4], 90); env[q] = [round(min(1.0, x / p), 3) for x in e]

ir = np.random.default_rng(3).standard_normal(int(0.25 * sr)) * np.exp(-np.arange(int(0.25 * sr)) / sr * 22); ir /= np.abs(ir).sum() / 5
voice = voice * 0.96 + np.convolve(voice, ir)[:N] * 0.04
tt = np.arange(N) / sr; mus = np.zeros(N); EV = {}
seg = {s["shot"]: s for s in segs}
def note(t0, f, amp, dec=9, dur=0.5):
    i0 = int(t0 * sr); n = min(int(dur * sr), N - i0)
    if n <= 0: return
    x = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * f * x) * np.exp(-x * dec) * amp * np.minimum(1, x * 200)
def noise(t0, dur, amp, smooth, envf):
    i0 = int(t0 * sr); n = min(int(dur * sr), N - i0)
    if n <= 0: return
    x = np.arange(n) / sr; z = np.convolve(np.random.default_rng(int(t0 * 97)).standard_normal(n), np.ones(smooth) / smooth, 'same'); mus[i0:i0 + n] += z * envf(x) * amp
def ding(t0, amp=0.1): note(t0, 1046.5, amp, 4, 1.0); note(t0 + 0.08, 1568, amp * 0.8, 4, 1.0); note(t0 + 0.16, 2093, amp * 0.5, 4, 1.0)
def cheer(t0, amp=0.07): noise(t0, 1.4, amp, 3, lambda x: np.minimum(1, x * 6) * np.exp(-x * 1.6))
for s in segs:
    e = s.get("ev")
    if not e: continue
    t0 = s["start"] + s["talk"]; EV[e] = s["start"]
    if e in ("gotK", "gotJ"): ding(t0 + 0.05); cheer(t0 + 0.05)
    if e == "winM": ding(t0 + 0.1, 0.12); ding(t0 + 0.35, 0.1); cheer(t0 + 0.1, 0.1)
    if e == "cta": note(s["start"], 784, 0.05, 6, 0.4); note(s["start"] + 0.1, 1047, 0.05, 6, 0.4)
rt = np.convolve(np.random.default_rng(9).standard_normal(N), np.ones(400) / 400, 'same'); mus += rt * 0.004
envs = np.repeat(np.maximum.reduce([np.array(env[q]) for q in "JMK"]), hop)[:N]; envs = np.pad(envs, (0, max(0, N - len(envs)))); duck = 1 - 0.45 * np.convolve(np.minimum(1, envs * 3), np.ones(4800) / 4800, 'same')
mix = voice + mus * duck; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs, "env": env}, open("timing.json", "w")); print("total", round(total, 1))
