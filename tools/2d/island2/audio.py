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
end = 4.0; total = t + end
segs.append({"shot": "end", "start": t, "dur": end, "words": []})
v = np.concatenate(parts); N = int(total * sr); voice = np.zeros(N); voice[:len(v)] = v
# warmth + gentle compression + small room, so it sounds less synthetic
lo = np.convolve(voice, np.ones(24) / 24, 'same'); voice = voice + 0.35 * lo
voice = np.tanh(voice * 1.6) / 1.6
ir = np.random.default_rng(3).standard_normal(int(0.35 * sr)) * np.exp(-np.arange(int(0.35 * sr)) / sr * 14); ir /= np.abs(ir).sum() / 6
wet = np.convolve(voice, ir)[:N]; voice = voice * 0.9 + wet * 0.12
tt = np.arange(N) / sr; mus = np.zeros(N)
g = lambda n: next(x for x in segs if x["shot"] == n)
def note(t0, f, amp, dec=2.2, dur=3.0):
    i0 = int(t0 * sr); n = min(int(dur * sr), N - i0)
    if n <= 0: return
    x = np.arange(n) / sr; env = np.exp(-x * dec) * np.minimum(1, x * 200)
    mus[i0:i0 + n] += (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(4 * np.pi * f * x) * np.exp(-x * 3) + 0.12 * np.sin(6 * np.pi * f * x) * np.exp(-x * 5)) * env * amp
def noise(t0, dur, amp, smooth=6, shape=None):
    i0 = int(t0 * sr); n = min(int(dur * sr), N - i0)
    if n <= 0: return
    x = np.arange(n) / sr; nz = np.convolve(np.random.default_rng(int(t0 * 100)).standard_normal(n), np.ones(smooth) / smooth, 'same')
    mus[i0:i0 + n] += nz * (shape(x) if shape else 1) * amp
A = [220.0, 261.6, 329.6]; F = [174.6, 220.0, 261.6]; Cc = [196.0, 261.6, 329.6]; G = [196.0, 246.9, 293.7]
prog = [A, F, Cc, G]; beat = 60 / 72
sec = lambda n: g(n)["start"]
# 1) tense: low drone + heartbeat until the photo
# night ambience: waves + crickets the whole way
noise(0, total, 0.025, 60, lambda x: 0.6 + 0.4 * np.sin(2 * np.pi * x / 4.5))
for t0 in np.arange(0.3, total, 0.37):
    if sec("t_net") <= t0 < sec("t_wait"): continue
    i0 = int(t0 * sr); n = int(0.06 * sr); xx = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * 4200 * xx) * np.sin(np.pi * xx / 0.06) * 0.012
# tense pulse in the hook/recap
for t0 in np.arange(0.1, sec("t_net"), 0.55): note(t0, 55.0, 0.09, 6, 0.4)
# build music: marimba 100 bpm while you build the trap
bt = 60 / 100; scale = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3]; k_ = 0
for t0 in np.arange(sec("t_net"), sec("t_wait"), bt / 2):
    f = scale[[0, 2, 4, 3, 1, 3, 5, 4][k_ % 8]] * (1 if (k_ // 8) % 2 == 0 else 1.122); note(t0, f, 0.05, 9, 0.6)
    if k_ % 4 == 0: note(t0, f / 2, 0.05, 5, 0.8)
    k_ += 1
# waiting: low drone
tw, th, ts, tr, tsd, tdn, ta = sec("t_wait"), sec("t_hum"), sec("t_snap"), sec("t_run"), sec("t_sand"), sec("t_dont"), sec("t_ask")
i0 = int(tw * sr); n = int((total - tw) * sr); xx = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * 46 * xx) * np.minimum(1, xx) * 0.08
# someone humming in the dark: a soft, slow, simple tune (original melody)
mel = [392.0, 440.0, 392.0, 329.6, 293.7, 329.6, 392.0, 0, 349.2, 329.6, 293.7, 261.6]
for i, f in enumerate(mel):
    if f: note(th + 1.2 + i * 0.42, f, 0.035, 2.5, 0.9)
# shells rattle + net drop
for q in range(10): noise(ts + 0.05 + q * 0.06, 0.05, 0.12, 2, lambda x: np.exp(-x * 60))
i0 = int((ts + 0.9) * sr); n = int(0.7 * sr); xx = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (50 + 60 * np.exp(-xx * 10)) * xx) * np.exp(-xx * 6) * 0.55
# running heartbeat
for t0 in np.arange(tr, tsd, 0.75):
    for d, a in ((0, 0.22), (0.2, 0.14)):
        i0 = int((t0 + d) * sr); n = int(0.15 * sr); xx = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (48 + 30 * np.exp(-xx * 30)) * xx) * np.exp(-xx * 22) * a
# DON'T: everything drops out, one deep hit
mus[int(tdn * sr):int(ta * sr)] *= 0.15
i0 = int((tdn + 0.15) * sr); n = int(2.5 * sr); xx = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (36 + 30 * np.exp(-xx * 4)) * xx) * np.exp(-xx * 1.5) * 0.6
for f in (110, 116.5, 155.6): note(ta, f, 0.06, 0.8, 4)
mus[int((total - 1.5) * sr):] *= np.linspace(1, 0, N - int((total - 1.5) * sr))
mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.8); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
