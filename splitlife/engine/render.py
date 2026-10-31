import json,sys,subprocess,os
from playwright.sync_api import sync_playwright
d=sys.argv[1]; mode=sys.argv[2] if len(sys.argv)>2 else 'full'
s=json.load(open(f'{d}/timed.json')); FPS=30
html='file://'+os.path.abspath(os.environ.get('HTML','render2.html'))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1080,'height':1920})
    pg.add_init_script('window.SCRIPT='+json.dumps(s)); pg.goto(html); pg.wait_for_function('window.ready'); pg.evaluate('document.fonts.ready')
    if mode=='sheet':
        ts=[float(x) for x in sys.argv[3].split(',')]
        os.makedirs(f'{d}/sheet',exist_ok=True)
        for k,t in enumerate(ts):
            pg.evaluate(f'setT({t})'); pg.screenshot(path=f'{d}/sheet/{k:02d}.png')
    else:
        n=int(s['duration']*FPS)
        ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(FPS),'-i','-','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p',f'{d}/video_only.mp4'],stdin=subprocess.PIPE)
        for f in range(n):
            pg.evaluate(f'setT({f/FPS})'); ff.stdin.write(pg.screenshot(type='jpeg',quality=92))
        ff.stdin.close(); ff.wait()
    b.close()
