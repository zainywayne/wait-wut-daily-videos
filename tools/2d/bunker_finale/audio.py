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
t_ph, t_mir, t_yard, t_light, t_climb, t_endc = sec("s_photo"), sec("s_mirror"), sec("s_yard"), sec("s_light"), sec("s_climb"), sec("s_end")
i1 = int(t_ph * sr); x = np.arange(i1) / sr; mus[:i1] += np.sin(2 * np.pi * 55 * x) * 0.07 * np.minimum(1, x / 0.5)
for t0 in np.arange(0.2, sec("s_stay"), 1.1):
    for d, a in ((0, 0.25), (0.22, 0.16)):
        i0 = int((t0 + d) * sr); n = int(0.15 * sr); xx = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (48 + 30 * np.exp(-xx * 30)) * xx) * np.exp(-xx * 22) * a
# dirt trickle in hook + dig, thud on the drop
for t0 in np.arange(0.0, sec("s_stay") - 2.6, 0.9): noise(t0, 0.6, 0.05, 3, lambda x: np.sin(np.pi * x / 0.6))
td = sec("s_stay") - 1.2; i0 = int(td * sr); n = int(0.6 * sr); xx = np.arange(n) / sr; mus[i0:i0 + n] += np.sin(2 * np.pi * (40 + 70 * np.exp(-xx * 12)) * xx) * np.exp(-xx * 7) * 0.6; noise(td, 0.5, 0.12, 4, lambda x: np.exp(-x * 9))
# 2) photo: soft piano starts
for k_, t0 in enumerate(np.arange(t_ph, t_mir, beat * 2)):
    for j, f in enumerate(prog[k_ % 4]): note(t0 + j * 0.12, f, 0.05)
# 3) mirror: silence, one low piano note
note(t_mir + 0.3, 110.0, 0.12, 0.8, 4.0); note(t_mir + 0.3, 220.0, 0.06, 0.9, 4.0)
# 4) reframe: arpeggios
k_ = 0
for t0 in np.arange(t_yard, t_light, beat):
    ch = prog[(k_ // 4) % 4]; note(t0, ch[k_ % 3] * (2 if k_ % 4 == 3 else 1), 0.045); 
    if k_ % 4 == 0: note(t0, ch[0] / 2, 0.06, 1.2)
    k_ += 1
# rain under the "listening" line
tb = sec("s_breath"); noise(tb, g("s_breath")["dur"] + 0.3, 0.06, 2, lambda x: np.minimum(1, x * 2) * np.minimum(1, (g("s_breath")["dur"] + 0.3 - x) * 2))
# flashlight click
i0 = int((t_light - 0.2) * sr); n = int(0.03 * sr); mus[i0:i0 + n] += np.random.default_rng(9).standard_normal(n) * 0.25
# 5) light + climb + swing: brighter swell
k_ = 0
for t0 in np.arange(t_light, t_endc + 6, beat):
    ch = prog[(k_ // 4) % 4]; sw = min(1, (t0 - t_light) / 6) if t0 < t_climb + 3 else 1
    note(t0, ch[k_ % 3] * 2, 0.04 + 0.03 * sw); note(t0 + beat / 2, ch[(k_ + 1) % 3] * 2, 0.025 + 0.02 * sw)
    if k_ % 4 == 0: [note(t0, f, 0.04 + 0.03 * sw, 0.9, 4) for f in ch]
    k_ += 1
mus[int((total - 1.5) * sr):] *= np.linspace(1, 0, N - int((total - 1.5) * sr))
mix = voice + mus; mix *= np.minimum(1, (total - tt) / 0.8); mix /= max(1, np.abs(mix).max() / 0.95)
sf.write("audio.wav", mix.astype(np.float32), sr)
json.dump({"total": total, "segs": segs}, open("timing.json", "w"), indent=1); print("total", round(total, 1))
