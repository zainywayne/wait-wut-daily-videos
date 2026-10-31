import json,sys,numpy as np,soundfile as sf
d=sys.argv[1]; s=json.load(open(f'{d}/timed.json'))
v,sr=sf.read(f'{d}/voice.wav'); N=len(v)+int(0.3*sr)
voice=np.zeros(N); voice[:len(v)]=v
mus=np.zeros(N); sfx=np.zeros(N); drm=np.zeros(N)
t=lambda n:np.arange(n)/sr
def add(buf,x,at,g):
    i=int(at*sr); j=min(N,i+len(x));
    if j>i: buf[i:j]+=x[:j-i]*g
rng=np.random.default_rng(1)
def lp(x,n): return np.convolve(x,np.ones(n)/n,'same')
def whoosh(L=0.34):
    n=int(L*sr); w=lp(rng.standard_normal(n),24); e=np.sin(np.pi*np.linspace(0,1,n))**2; return w*e
def ching():
    n=int(0.8*sr); tt=t(n); a=(np.sin(2*np.pi*1568*tt)+0.6*np.sin(2*np.pi*3136*tt))*np.exp(-tt*9)
    b=np.zeros(n); o=int(0.07*sr); b[o:]=(np.sin(2*np.pi*2093*tt[:n-o])+0.5*np.sin(2*np.pi*4186*tt[:n-o]))*np.exp(-tt[:n-o]*6)
    c=lp(rng.standard_normal(n),3)*np.exp(-tt*30)*0.6
    return (a+b+c)*0.45
def bonk():
    n=int(0.4*sr); tt=t(n); f=260*np.exp(-tt*4); return np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-tt*8)
def kick():
    n=int(0.3*sr); tt=t(n); f=120*np.exp(-tt*28)+44; return np.tanh(2*np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-tt*10))
def snare():
    n=int(0.22*sr); tt=t(n); return (lp(rng.standard_normal(n),2)*0.7+np.sin(2*np.pi*190*tt)*0.5)*np.exp(-tt*18)
def hat(o=False):
    n=int((0.12 if o else 0.04)*sr); w=np.diff(rng.standard_normal(n),prepend=0); return w*np.exp(-t(n)*(25 if o else 90))*0.35
def note(f,L,harm=6,dec=0.0):
    n=int(L*sr); tt=t(n); x=sum(np.sin(2*np.pi*f*h*tt)/h*(0.85**h) for h in range(1,harm+1))
    env=np.minimum(1,tt/0.02)*np.minimum(1,(L-tt)/0.08)*(np.exp(-tt*dec) if dec else 1); return x*env
A=lambda m:440*2**((m-69)/12)
CALM=s.get('calm',False) or s.get('story',False)
STORY=s.get('story',False)
bpm=68 if CALM else 100; beat=60/bpm; bar=4*beat
prog=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]  # Am F C G
roots=[45,41,36,43]
nb=int(N/sr/bar)+1
for b in range(nb):
    t0=b*bar; ch=prog[b%4]
    if CALM:
        for m_ in ch: add(mus,lp(note(A(m_-12),bar,3),60),t0,0.05)
        for q,ix in enumerate([0,1,2,1,2,1]):
            add(mus,note(A(ch[ix]+12),1.6,5,2.2),t0+q*bar/6,0.075)
        add(mus,note(A(roots[b%4]),bar,2,0.6),t0,0.12)
        if STORY:
            for q in (0,2): add(drm,kick(),t0+q*beat,0.22)
            add(drm,hat(True),t0+3*beat,0.08)
        continue
    for m in ch: add(mus,lp(note(A(m),bar,5),40),t0,0.05)
    for q in range(8):  # pluck arps on 8ths
        m=ch[[0,1,2,1,0,2,1,2][q]]+12; add(mus,note(A(m),0.25,4,14),t0+q*beat/2,0.05)
    for q in (0,1.5,2,3.5): add(mus,note(A(roots[b%4]),beat*0.9,3,3),t0+q*beat,0.16)
    for q in range(4):
        add(drm,kick(),t0+q*beat,0.0 if q in(1,3) else 0.32)
        if q in(1,3): add(drm,snare(),t0+q*beat,0.22)
        add(drm,hat(),t0+q*beat+beat/2,0.22); add(drm,hat(),t0+q*beat,0.12)
    if b%2==1: add(drm,hat(True),t0+3.5*beat,0.2)
tw=[x['start'] for sc,x in zip(s['scenes'],s['timeline']) if (sc.get('flash')=='BUT' if STORY else sc.get('counter'))]
if tw:
    i0=int(tw[0]*sr); mask=np.ones(N); mask[i0:]=0; mus[i0:]*=0.75
    drm*=lp(mask,int(0.05*sr))
mus=mus+drm
# duck music under voice
env=np.sqrt(lp(voice**2,int(0.05*sr))); env=env/env.max(); duck=1-0.55*np.clip(env*3,0,1); duck=lp(duck,int(0.08*sr))
for i,(sc,x) in enumerate(zip(s['scenes'],s['timeline'])):
    if i>0 and not CALM: add(sfx,whoosh(),x['start']-0.1,0.22)
    if i>0 and CALM and sc['scene']!=s['scenes'][i-1]['scene']: add(sfx,whoosh(0.9),x['start']-0.3,0.08)
    if sc['rich']['price']>0: add(sfx,ching(),x['start']+0.8,0.32 if sc['rich']['price']<1000 else 0.45)
    if sc['broke']['price']>0: add(sfx,bonk(),x['start']+0.85,0.25)
    if sc.get('flash'): add(sfx,kick(),x['start'],0.5)
out=voice*1.0+mus*duck*0.9+sfx
# fade tail of music for loop
out=out/np.max(np.abs(out))*0.89
sf.write(f'{d}/mix.wav',out,sr); print('ok')
