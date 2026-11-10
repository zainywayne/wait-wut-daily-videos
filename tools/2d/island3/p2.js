// Island Part 3: you write back in the sand. They answer.
const LP = (() => { const x = 2000, h = 420, l = 0.1, by = bY(x); return { x, by, tx: x + l * h * 1.4, ty: by - h, cx: x + l * h * 0.2, cy: by - h * 0.6 }; })();
const PLAT_Y = LP.ty + 60;
function trunkAt(f) { const a = (1 - f) * (1 - f), b = 2 * (1 - f) * f, c = f * f; return [a * LP.x + b * LP.cx + c * LP.tx, a * LP.by + b * LP.cy + c * LP.ty]; }
function s3(n) { return T.segs.find(q => q.shot === n); }
window.p2night = (n, u) => { if (['u_night', 'u_light', 'u_sleep'].includes(n)) return 1; if (n === 'u_dawn') return lerp(1, 0.2, sm(u / 0.6)); return 0; };
window.p2cam = (n, u, t) => {
  let cx = 900, cy = 930, cs = 1.4;
  if (n === 'u_recap') { cx = lerp(840, 1000, sm(u)); cy = 920; cs = lerp(1.8, 1.25, sm(u)); }
  if (n === 'u_look' || n === 'u_steps') { cx = 2030; cy = 860; cs = 1.35; }
  if (n === 'u_night') { cx = 1850; cy = 860; cs = 1.15; }
  if (n === 'u_light') { cx = lerp(1850, 2350, sm(u / 0.35)); cy = 880; cs = lerp(1.15, 1.1, sm(u / 0.35)); }
  if (n === 'u_sleep') { cx = LP.tx - 20; cy = PLAT_Y - 20; cs = 2.0; }
  if (n === 'u_dawn') { const p = dawnPos(u); cx = Math.max(1150, Math.min(2000, p[0])); cy = Math.min(900, p[1] - 150); cs = 1.15; }
  if (n === 'u_ask' || n === 'end') { cx = 1500; cy = 900; cs = 0.9; }
  return { cx, cy, cs };
};
function dawnPos(u) { const c = sm(u / 0.45); if (c < 1) { const [x, y] = trunkAt(1 - c * 0.92); return [x - 10, y + 40]; } const w = sm((u - 0.45) / 0.5); const x = lerp(LP.x - 20, 1050, w); return [x, bY(x)]; }
window.p2world = (t, n, u, night) => {
  window.BEACON_ON = false;
  window.NOCAP = n === 'u_msg' || n === 'end' || (n === 'u_ask' && u > 0.38);
  const k = ORDER.indexOf(n), from = m => k >= ORDER.indexOf(m);
  // lookout: notches, platform, roof
  if (from('u_look')) { const p = n === 'u_look' ? 0.15 * u : n === 'u_steps' ? u : 1;
    const notch = cl(p / 0.45); X.strokeStyle = night > 0.5 ? '#3a2c1c' : '#5a3e22'; X.lineWidth = 5; for (let q = 0; q < 12; q++) { if (q / 12 > notch) break; const [x, y] = trunkAt(0.06 + q * 0.072); X.beginPath(); X.moveTo(x - 16, y); X.lineTo(x + 16, y - 2); X.stroke(); }
    const plat = back((p - 0.45) / 0.2); if (plat > 0) { X.save(); X.translate(LP.tx, PLAT_Y); X.scale(plat, plat); X.fillStyle = night > 0.5 ? '#4a3a26' : '#9a7448'; X.fillRect(-90, 0, 180, 14); X.strokeStyle = night > 0.5 ? '#3a2c1c' : '#7a5a38'; X.lineWidth = 3; for (let i = -80; i <= 80; i += 20) { X.beginPath(); X.moveTo(i, 0); X.lineTo(i, 14); X.stroke(); } X.lineWidth = 6; X.beginPath(); X.moveTo(-85, 14); X.lineTo(-20, 70); X.moveTo(85, 14); X.lineTo(20, 70); X.stroke(); X.restore(); }
    const roof = cl((p - 0.68) / 0.25); for (let q = 0; q < 6; q++) { const f = cl(roof * 6 - q); if (f <= 0) continue; X.save(); X.translate(LP.tx - 90 + q * 36, PLAT_Y - 130); X.rotate(0.35); X.scale(f, f); X.fillStyle = night > 0.5 ? '#16301c' : (q % 2 ? '#3e9a46' : '#358a3e'); X.beginPath(); X.ellipse(30, 0, 50, 12, 0, 0, 7); X.fill(); X.restore(); }
    if (roof > 0) { X.strokeStyle = night > 0.5 ? '#3a2c1c' : '#7a5a38'; X.lineWidth = 6; X.beginPath(); X.moveTo(LP.tx - 85, PLAT_Y); X.lineTo(LP.tx - 85, PLAT_Y - 120 * roof); X.moveTo(LP.tx + 85, PLAT_Y); X.lineTo(LP.tx + 85, PLAT_Y - 120 * roof); X.stroke(); } }
  // a tiny light deep in the jungle
  if (n === 'u_light' && u > 0.35 && u < 0.62) { const a = Math.sin(((u - 0.35) / 0.27) * Math.PI) * (0.75 + 0.25 * Math.sin(t * 20)); const g = X.createRadialGradient(2640, 985, 2, 2640, 985, 70); g.addColorStop(0, `rgba(255,190,90,${a})`); g.addColorStop(1, 'rgba(255,190,90,0)'); X.fillStyle = g; X.fillRect(2560, 905, 160, 160); X.fillStyle = `rgba(255,230,160,${a})`; X.beginPath(); X.arc(2640, 985, 5, 0, 7); X.fill(); }
  // you
  if (n === 'u_recap') person(980, bY(980), 1.15, 'breath', t);
  if (n === 'u_look') person(LP.x - 70, bY(LP.x - 70), 1.15, u < 0.5 ? 'breath' : 'saw', t);
  if (n === 'u_steps') { const c = cl(u / 0.45); const [x, y] = trunkAt(c * 0.85); person(x - 24, Math.min(bY(LP.x), y + 40), 1.1, c < 1 ? 'hands' : 'saw', t); }
  if (n === 'u_night' || n === 'u_light') person(LP.tx - 30, PLAT_Y, 1.0, 'breath', t);
  if (n === 'u_sleep') { const d = sm((u - 0.2) / 0.3); if (d < 1) person(LP.tx - 30, PLAT_Y, 1.0, 'breath', t); else { X.save(); X.translate(LP.tx + 50, PLAT_Y - 22); X.rotate(-Math.PI / 2); person(0, 0, 0.95, 'stand', 0); X.restore(); for (let q = 0; q < 3; q++) { const ph = (t * 0.5 + q / 3) % 1; txt('z', LP.tx - 30 + ph * 30, PLAT_Y - 60 - ph * 70, 28 + q * 5, '#cfd8ff', 'center', 1 - ph); } } }
  if (n === 'u_dawn') { const [x, y] = dawnPos(u); person(x, y, 1.1, u < 0.45 ? 'hands' : 'stand', t); }
  if (n === 'u_ask' || n === 'end') person(1050, bY(1050), 1.15, 'breath', t);
};
// ---- sand close-ups ----
function sandBase(a) { X.save(); X.globalAlpha = a; const g = X.createRadialGradient(540, 960, 100, 540, 960, 1100); g.addColorStop(0, '#c9ae78'); g.addColorStop(1, '#6e5a38'); X.fillStyle = g; X.fillRect(0, 0, W, H); for (let q = 0; q < 900; q++) { const x = (q * 137.5) % W, y = (q * 271.3) % H; X.fillStyle = q % 3 ? 'rgba(255,245,215,.12)' : 'rgba(60,40,10,.12)'; X.fillRect(x, y, 3, 3); } X.restore(); }
function carve(s, x, y, size, reveal, a, rot = 0, dark = 'rgba(60,40,15,.85)') { if (reveal <= 0) return; X.save(); X.globalAlpha = a; X.translate(x, y); X.rotate(rot); X.font = `${size}px P`; X.textAlign = 'center'; const w = X.measureText(s).width;
  X.beginPath(); X.rect(-w / 2 - 20, -size, (w + 40) * reveal, size * 1.4); X.clip(); X.fillStyle = 'rgba(255,248,225,.45)'; X.fillText(s, 5, 6); X.fillStyle = dark; X.fillText(s, 0, 0); X.restore(); return -w / 2 + w * reveal; }
function stick(x, y, a) { X.save(); X.globalAlpha = a; X.strokeStyle = '#5a3e22'; X.lineWidth = 16; X.lineCap = 'round'; X.beginPath(); X.moveTo(x + 6, y - 6); X.lineTo(x + 170, y - 380); X.stroke(); X.fillStyle = '#f1c7a4'; X.beginPath(); X.ellipse(x + 130, y - 300, 34, 26, -1, 0, 7); X.fill(); X.restore(); }
function reefDrawing(x, y, rev, a) { if (rev <= 0) return; X.save(); X.globalAlpha = a; X.strokeStyle = 'rgba(60,40,15,.85)'; X.lineWidth = 9; X.lineCap = 'round';
  X.beginPath(); X.ellipse(x, y, 90, 60, 0, 0, Math.PI * 2 * cl(rev / 0.3)); X.stroke();
  X.setLineDash([22, 18]); X.beginPath(); X.ellipse(x, y, 190, 130, 0, 0, Math.PI * 2 * cl((rev - 0.3) / 0.35)); X.stroke(); X.setLineDash([]);
  const b = cl((rev - 0.65) / 0.35); if (b > 0) { X.translate(x - 200, y - 70); X.rotate(0.5); X.globalAlpha = a * b; X.beginPath(); X.moveTo(-40, 0); X.lineTo(40, 0); X.lineTo(26, 22); X.lineTo(-26, 22); X.closePath(); X.stroke(); X.beginPath(); X.moveTo(0, 0); X.lineTo(0, -50); X.stroke(); X.beginPath(); X.moveTo(-10, 30); X.lineTo(10, 46); X.moveTo(10, 30); X.lineTo(-10, 46); X.stroke(); }
  X.restore(); }
function toyBoat(x, y, s) { if (s <= 0) return; X.save(); X.translate(x, y); X.scale(s, s); X.fillStyle = 'rgba(40,25,10,.35)'; X.beginPath(); X.ellipse(10, 70, 150, 22, 0, 0, 7); X.fill();
  X.fillStyle = '#8a5a30'; X.beginPath(); X.moveTo(-140, 10); X.lineTo(140, 10); X.lineTo(100, 70); X.lineTo(-100, 70); X.fill(); X.fillStyle = '#6e4624'; X.fillRect(-120, 26, 240, 6); X.strokeStyle = '#6e4624'; X.lineWidth = 8; X.beginPath(); X.moveTo(0, 10); X.lineTo(0, -230); X.stroke();
  X.fillStyle = '#d9c7a0'; X.beginPath(); X.moveTo(8, -220); X.lineTo(8, -10); X.lineTo(130, -10); X.fill(); star(60, -60, 13, '#ffffff'); X.restore(); }
window.p2over = (t, n, u) => {
  const L = (s) => s3(s);
  if (n === 'u_hook' || n === 'u_write') { sandBase(1); carve("DON'T", 540, 640, 220, 1, 1);
    const rev = n === 'u_hook' ? lerp(0.12, 0.4, u) : lerp(0.35, 1, sm(u / 0.8)); const ex = carve('WHO ARE YOU?', 540, 980, 120, rev, 1); stick(540 + ex, 960, rev < 1 ? 1 : 1 - sm((u - 0.85) / 0.1)); }
  if (n === 'u_view') { aerial(t, lerp(1.0, 1.15, u), 0, 0, sm(u / 0.12)); const a = sm((u - 0.45) / 0.12); X.fillStyle = `rgba(0,0,0,${0.55 * a})`; X.beginPath(); X.roundRect(340, 1600, 400, 100, 24); X.fill(); txt('THE REEF', 540, 1668, 52, '#fff', 'center', a); }
  if (n === 'u_msg' || n === 'u_boat') { sandBase(1); const sh = n === 'u_msg' ? sm(u / 0.15) : 1; carve("DON'T", 540, 520, 110, 1, 0.75); carve('WHO ARE YOU?', 540, 660, 76, 1, 0.75);
    carve('BOATS DIE HERE', 540, 900, 130, n === 'u_msg' ? sm((u - 0.2) / 0.3) : 1, sh, -0.03, 'rgba(70,25,10,.9)'); X.save(); X.translate(540, 1240); X.scale(1.3, 1.3); X.translate(-540, -1240); reefDrawing(540, 1240, n === 'u_msg' ? sm((u - 0.5) / 0.45) : 1, sh);
    X.restore(); if (n === 'u_boat') toyBoat(600, 1650, back((u - 0.05) / 0.2) * 1.0); }
  if (t < 3.6) { const a = 1 - sm((t - 3.2) / 0.4), p = 1 + 0.05 * Math.sin(t * 6); X.save(); X.globalAlpha = a; X.translate(540, 1690); X.scale(p, p); X.fillStyle = '#d42d2d'; X.beginPath(); X.roundRect(-380, -50, 760, 96, 22); X.fill(); X.restore(); txt("WHO'S OUT THERE?", 540, 1708, 50, '#fff', 'center', a);
    X.save(); X.globalAlpha = a; X.fillStyle = '#ffd23f'; X.beginPath(); X.roundRect(130, 1770, 820, 90, 45); X.fill(); X.restore(); txt('PART 3 · YOU VOTED: WRITE BACK', 540, 1830, 42, '#10141c', 'center', a); }
  if (n === 'u_dawn') { const a = sm(u / 0.12) * (1 - sm((u - 0.85) / 0.15)); X.fillStyle = `rgba(0,0,0,${0.5 * a})`; X.beginPath(); X.roundRect(340, 1560, 400, 110, 26); X.fill(); txt('SUNRISE', 540, 1636, 56, '#ffd9a8', 'center', a); }
  if (n === 'u_ask' || n === 'end') { const a = n === 'u_ask' ? sm((u - 0.38) / 0.12) : 1; if (a > 0) { X.fillStyle = `rgba(6,8,14,${0.84 * a})`; X.fillRect(0, 0, W, H);
    txt('PART 4: YOU DECIDE', 540, 420, 70, '#ffd23f', 'center', a); txt('"BOATS DIE HERE."', 540, 505, 50, '#ff6a5a', 'center', a); txt('They know something you don\'t.', 540, 570, 42, '#ffffff', 'center', a);
    const opts = [['1', 'Turn the beacon on anyway', '#ff8a5e'], ['2', 'Write: SHOW YOURSELF', '#5ec3ff'], ['3', 'Swim out and check the reef', '#6af0a8']];
    opts.forEach(([nn, s2, col], i) => { const b = n === 'u_ask' ? back((u - 0.45 - i * 0.07) / 0.15) : 1; if (b <= 0) return; X.save(); X.translate(540, 790 + i * 240); X.scale(b, b); X.globalAlpha = a; X.fillStyle = 'rgba(255,255,255,.08)'; X.beginPath(); X.roundRect(-470, -95, 940, 190, 36); X.fill(); X.strokeStyle = col; X.lineWidth = 6; X.stroke();
      X.fillStyle = col; X.beginPath(); X.arc(-370, 0, 62, 0, 7); X.fill(); txt(nn, -370, 26, 76, '#10141c'); txt(s2, -275, 18, 42, '#fff', 'left'); X.restore(); });
    txt('Comment 1, 2 or 3', 540, 1560, 54, '#fff', 'center', a); txt('Top comment decides.', 540, 1640, 48, '#ffd23f', 'center', a); } }
};
