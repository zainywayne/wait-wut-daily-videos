const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const out = process.argv[2] || 'out.mp4'; const only = process.argv[3]; // optional comma list of times for stills
(async () => {
  const T = JSON.parse(fs.readFileSync('timing.json')); const FPS = 30;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5 });
  p.on('pageerror', e => console.log('ERR', e.message)); await p.goto('file://' + __dirname + '/page.html'); await p.evaluate(t => setTiming(t), T); await p.evaluate(() => document.fonts.ready);
  if (only) { for (const t of only.split(',')) { await p.evaluate(x => frame(x), +t); await p.screenshot({ path: `/tmp/np/s_${t}.jpg`, type: 'jpeg', quality: 85 }); } await b.close(); return; }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', 'audio.wav', '-vf', 'eq=saturation=1.1:contrast=1.04,vignette=PI/5', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', out]);
  const n = Math.floor(T.total * FPS);
  for (let f = 0; f < n; f++) { await p.evaluate(x => frame(x), f / FPS); const buf = await p.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 300 === 0) console.log('frame', f, '/', n); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('OK', out);
})();
