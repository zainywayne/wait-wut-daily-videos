import json,sys,os,numpy as np,soundfile as sf
from kokoro_onnx import Kokoro
d=sys.argv[1]; s=json.load(open(f'{d}/script.json'))
T='/home/claude/shorts_work/tts'; k=Kokoro(f'{T}/kokoro-v1.0.onnx',f'{T}/voices-v1.0.bin')
sr=24000; out=[]; tl=[]; t=0.0
for i,sc in enumerate(s['scenes']):
    a,sr=k.create(sc['text'],voice=s.get('voice','am_puck'),speed=float(s.get("speed",1.12)),lang='en-us')
    # trim silence
    nz=np.where(np.abs(a)>0.01)[0]; a=a[max(0,nz[0]-400):nz[-1]+800]
    gap=float(s.get('gap',0.55)) if sc.get('id',sc.get('scene')) not in('total',) else 0.9
    gap+=float(sc.get('hold',0))
    if i==len(s['scenes'])-1: gap=0.15+float(sc.get('hold',0))
    dur=len(a)/sr
    tl.append({'start':round(t,3),'speech':round(dur,3),'end':round(t+dur+gap,3)})
    out.append(a); out.append(np.zeros(int(gap*sr),dtype=a.dtype)); t+=dur+gap
pre=0.25
v=np.concatenate([np.zeros(int(pre*sr),dtype=out[0].dtype)]+out)
for x in tl:
    for kk in('start','end'): x[kk]=round(x[kk]+pre,3)
tl[0]['start']=0.0
sf.write(f'{d}/voice.wav',v,sr)
s['timeline']=tl; s['duration']=round(len(v)/sr,3)
json.dump(s,open(f'{d}/timed.json','w'),indent=1)
print(s['duration'],[ (x['start'],x['end']) for x in tl])
