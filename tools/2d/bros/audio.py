import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
W = "/home/claude/shorts_work"
S = json.load(open("script.json")); k = Kokoro(W + "/tts/kokoro-v1.0.onnx", W + "/tts/voices-v1.0.bin")
sr = 24000; t = 0.12; parts = [np.zeros(int(0.12 * sr), np.float32)]; segs = []
for sc in S["scenes"]:
    a, sr = k.create(sc["text"], voice=sc["voice"], speed=sc["speed"], lang="en-us")
    # trim TTS leading/trailing silence so the back-and-forth is snappy
    nz = np.where(np.abs(a) > 0.01)[0]
    if len(nz): a = a[max(0, nz[0] - 600): nz[-1] + 1200]
    d = len(a) / sr; pause = sc.get("pause", 0.2)
    words = sc["text"].split(); lens = [len(w) + 1 for w in words]; tot = sum(lens); acc = 0; wt = []
    for w, l in zip(words, lens): wt.append([w, t + d * acc / tot]); acc += l
    segs.append({"shot": sc["shot"], "spk": sc["spk"], "start": t, "dur": d + pause, "talk": d, "words": wt, "fx": sc.get("fx", {}), "zoom": sc.get("zoom"), "ev": sc.get("ev")})
    parts += [a.astype(np.float32), np.zeros(int(pause * sr), np.float32)]; t += d + pause
end = 0.6; total = t + end
segs.append({"shot": "end", "spk": "", "start": t, "dur": end, "talk": 0, "words": [], "fx": {}, "zoom": None, "ev": None})
v = np.concatenate(parts); N = int(total * sr); voice = np.zeros(N); voice[:len(v)] = v
# lip-sync envelope, 30 per second
hop = sr // 30; env = [float(np.sqrt(np.mean(voice[i:i + hop] ** 2))) for i in range(0, N, hop)]; p95 = np.percentile([e for e in env if e > 1e-4], 90); env = [round(min(1.0, e / p95), 3) for e in env]
lo = np.convolve(voice, np.ones(20) / 20, 'same'); voice = voice + 0.25 * lo; voice = np.tanh(voice * 1.5) / 1.5
ir = np.random.default_rng(3).standard_normal(int(0.25 * sr)) * np.exp(-np.arange(int(0.25 * sr)) / sr * 22); ir /= np.abs(ir).sum() / 5
voice = voice * 0.92 + np.convolve(voice, ir)[:N] * 0.08
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
    if e in ("gotK", "gotM"): ding(s["start"] + 0.05); cheer(s["start"] + 0.05)
    if e == "crown": note(s["start"] + 0.1, 1318, 0.05, 3, 1); note(s["start"] + 0.2, 1760, 0.04, 3, 1)
    if e == "wait": note(s["start"] + 0.35, 98, 0.18, 3, 0.4); note(s["start"] + 0.8, 92.5, 0.2, 2.5, 0.6)
    if e == "gotJ": ding(t0 + 0.05, 0.12); cheer(t0 + 0.05, 0.09)
    if e == "cta": note(s["start"], 784, 0.05, 6, 0.4); note(s["start"] + 0.1, 1047, 0.05, 6, 0.4)
# soft lo-fi bed: muted chords + brushed hats, ducked under speech
bt = 60 / 86; ch = [[261.6, 329.6, 392.0, 493.9], [220.0, 261.6, 329.6, 392.0], [174.6, 220.0, 261.6, 329.6], [196.0, 246.9, 293.7, 349.2]]
for i, t0 in enumerate(np.arange(0, total, bt)):
    c = ch[(i // 4) % 4]
    if i % 4 == 0:
        for f in c: note(t0, f, 0.012, 1.2, bt * 4)
        note(t0, c[0] / 2, 0.04, 2, bt * 2)
    if i % 2 == 1: note(t0, c[0] / 2, 0.025, 4, bt)
    noise(t0 + bt / 2, 0.05, 0.012, 2, lambda x: np.exp(-x * 60))
envs = np.repeat(np.array(env), hop)[:N]; envs = np.pad(envs, (0, max(0, N - len(envs)))); duck = 1 - 0.45 * np.convolve(np.minimum(1, envs * 3), np.ones(4800) / 4800, 'same')
mix = voice + mus * duck; mix *= np.minimum(1, (total - tt) / 0.08); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "ev": EV, "segs": segs, "env": env}, open("timing.json", "w")); print("total", round(total, 1))
