// Island Part 4: you swim out to check the reef. The wreck. The current. Someone saves you.
const WX = -1050, WY = SEA - 6;
function s4(n) { return T.segs.find(q => q.shot === n); }
function swimmer(x, y, t, a = 1) { X.save(); X.globalAlpha = a; X.fillStyle = '#f1c7a4'; X.beginPath(); X.arc(x, y - 18, 22, 0, 7); X.fill(); X.strokeStyle = '#3d7bd9'; X.lineWidth = 12; X.lineCap = 'round'; const s = Math.sin(t * 6); X.beginPath(); X.moveTo(x + 10, y); X.lineTo(x - 30 - s * 20, y - 28 + Math.abs(s) * 18); X.stroke(); X.beginPath(); X.moveTo(x + 6, y + 4); X.lineTo(x + 40 + s * 20, y - 10); X.stroke(); X.fillStyle = 'rgba(255,255,255,.8)'; X.beginPath(); X.ellipse(x + 50, y + 4, 30, 6, 0, 0, 7); X.fill(); X.restore(); }
function swimX(n, u) { if (n === 'v_swim') return lerp(640, -60, sm(u)); if (n === 'v_reef') return -80; if (n === 'v_wreck' || n === 'v_closer' || n === 'v_inside') return -860; if (n === 'v_current') return lerp(-860, -760, u); if (n === 'v_drag') return lerp(-760, -520, sm(u)); if (n === 'v_cut') return -470; return 640; }
window.p2night = (n, u) => 0;
window.p2cam = (n, u, t) => {
  let cx = -700, cy = 1100, cs = 1.3;
  if (n === 'v_recap') { cx = lerp(820, 1000, sm(u)); cy = 920; cs = lerp(1.7, 1.3, sm(u)); }
  if (n === 'v_float') { cx = 780; cy = 960; cs = 2.0; }
  if (n === 'v_swim') { cx = swimX(n, u); cy = 1110; cs = 1.7; }
  if (n === 'v_reef') { cx = lerp(-150, -420, sm(u / 0.5)); cy = 1120; cs = 1.6; }
  if (n === 'v_wreck') { cx = lerp(-700, -960, sm(u)); cy = 1080; cs = 1.3; }
  if (n === 'v_closer') { cx = -1050; cy = 1040; cs = 2.2; }
  if (n === 'v_inside') { cx = -1000; cy = 1065; cs = lerp(2.4, 3.2, sm(u / 0.4)); }
  if (n === 'v_current' || n === 'v_drag' || n === 'v_cut') { cx = swimX(n, u) - 80; cy = 1120; cs = 1.8; }
  if (n === 'v_wake') { cx = 740; cy = 990; cs = 2.0; }
  if (n === 'v_bandage') { cx = lerp(740, 700, sm(u / 0.3)); cy = bY(700) - 30; cs = lerp(2.0, 3.4, sm(u / 0.3)); }
  if (n === 'v_figure') { cx = lerp(800, 1850, sm((u - 0.1) / 0.35)); cy = 920; cs = 1.55; }
  if (n === 'v_ask' || n === 'end') { cx = 1300; cy = 920; cs = 1.0; }
  return { cx, cy, cs };
};
function bigWreck(t, hole) { X.save(); X.translate(WX, WY); X.rotate(-0.22);
  X.fillStyle = '#6b3f26'; X.beginPath(); X.moveTo(-180, -50); X.lineTo(180, -50); X.lineTo(130, 46); X.lineTo(-130, 46); X.fill();
  X.fillStyle = '#a8432f'; X.fillRect(-170, -38, 340, 12); star(-120, -6, 13, 'rgba(255,255,255,.75)');
  X.fillStyle = 'rgba(150,80,40,.7)'; for (const [x, y, r] of [[-60, 10, 18], [40, -10, 14], [110, 20, 20], [-140, 26, 12], [80, 30, 10]]) { X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); }
  X.fillStyle = 'rgba(230,225,210,.7)'; for (const [x, y] of [[-100, 34], [-90, 30], [20, 36], [30, 32], [140, 18]]) { X.beginPath(); X.arc(x, y, 4, 0, 7); X.fill(); }
  // faded name, unreadable under the barnacles
  X.fillStyle = 'rgba(255,255,255,.18)'; X.font = '20px P'; X.textAlign = 'center'; X.fillText('M  _ _ _ _', 20, -2);
  X.strokeStyle = '#4a3a2a'; X.lineWidth = 10; X.beginPath(); X.moveTo(-10, -50); X.lineTo(-40, -250); X.stroke(); X.beginPath(); X.moveTo(-40, -250); X.lineTo(10, -320); X.stroke();
  X.fillStyle = 'rgba(220,210,190,.5)'; X.beginPath(); X.moveTo(-30, -230); X.lineTo(40, -120); X.lineTo(-20, -90); X.fill();
  if (hole > 0) { X.fillStyle = '#1a120c'; X.beginPath(); X.ellipse(30, 4, 70 * hole, 34 * hole, 0, 0, 7); X.fill();
    // a dead beacon inside, same kind as yours
    X.save(); X.translate(40, 22); X.rotate(0.5); X.globalAlpha = hole; X.fillStyle = '#9a7d34'; X.beginPath(); X.roundRect(-12, -46, 24, 46, 6); X.fill(); X.fillStyle = '#2a2a2a'; X.fillRect(-12, -30, 24, 6); X.fillStyle = '#4a1c1c'; X.beginPath(); X.arc(-3, -52, 7, Math.PI, 0); X.fill(); X.strokeStyle = '#555'; X.lineWidth = 2; X.beginPath(); X.moveTo(6, -46); X.lineTo(4, -64); X.lineTo(12, -70); X.stroke(); X.fillStyle = 'rgba(160,90,40,.6)'; X.beginPath(); X.arc(4, -14, 6, 0, 7); X.fill(); X.restore(); }
  X.restore(); }
window.p2world = (t, n, u, night) => {
  window.BEACON_ON = false;
  window.NOCAP = n === 'v_black' || n === 'end' || (n === 'v_ask' && u > 0.38);
  // coral under the reef
  for (let q = 0; q < 26; q++) { const x = -780 + q * 25, h = 40 + (q * 37) % 40; X.fillStyle = ['#e2735a', '#f0a04a', '#c85a8a', '#7ac0a0'][q % 4]; X.beginPath(); X.moveTo(x - 14, SEA + 90); X.lineTo(x - 4, SEA + 90 - h); X.lineTo(x + 2, SEA + 90 - h * 0.6); X.lineTo(x + 8, SEA + 90 - h * 0.9); X.lineTo(x + 14, SEA + 90); X.fill(); }
  X.fillStyle = '#6a6458'; X.fillRect(-800, SEA + 86, 680, 60);
  // the wreck, up close
  if (['v_hook', 'v_wreck', 'v_closer', 'v_inside', 'v_current', 'v_drag', 'v_cut'].includes(n)) bigWreck(t, n === 'v_inside' ? sm(u / 0.25) : 0);
  // the float: bottle tied to driftwood
  const floatOn = ['v_float', 'v_swim', 'v_reef'].includes(n);
  if (n === 'v_float') { const a = back(u / 0.25), b = back((u - 0.3) / 0.2); X.save(); X.translate(720, bY(720) - 14); X.scale(a, a); X.fillStyle = '#8a6a44'; X.beginPath(); X.roundRect(-90, -10, 180, 22, 10); X.fill(); X.restore(); if (b > 0) { X.save(); X.translate(720, bY(720) - 40); X.scale(b, b); X.fillStyle = 'rgba(160,220,255,.85)'; X.beginPath(); X.roundRect(-18, -24, 36, 50, 8); X.fill(); X.fillStyle = '#2a7ab8'; X.fillRect(-8, -32, 16, 10); X.restore(); X.strokeStyle = '#c9a66a'; X.lineWidth = 3; X.beginPath(); X.moveTo(700, bY(720) - 20); X.lineTo(740, bY(720) - 8); X.moveTo(700, bY(720) - 8); X.lineTo(740, bY(720) - 20); X.stroke(); } }
  // current arrows on the water
  if (n === 'v_current' || n === 'v_drag') { const a = n === 'v_current' ? sm(u / 0.5) : 1; for (let q = 0; q < 8; q++) { const ph = (t * 0.9 + q / 8) % 1, x = lerp(-150, -650, ph) + (q % 2) * 30, y = SEA + 30 + (q % 3) * 26; X.strokeStyle = `rgba(255,255,255,${0.75 * a * Math.sin(ph * Math.PI)})`; X.lineWidth = 5; X.beginPath(); X.moveTo(x + 40, y); X.lineTo(x, y); X.lineTo(x + 14, y - 10); X.moveTo(x, y); X.lineTo(x + 14, y + 10); X.stroke(); } }
  // you
  if (n === 'v_hook') swimmer(lerp(-360, -470, u), SEA + 12 + Math.sin(t * 3) * 8, t);
  if (n === 'v_recap') person(980, bY(980), 1.15, 'breath', t);
  if (n === 'v_float') person(860, bY(860), 1.15, u < 0.5 ? 'saw' : 'stand', t);
  if (['v_swim', 'v_reef', 'v_wreck', 'v_closer', 'v_inside', 'v_current', 'v_drag', 'v_cut'].includes(n)) { const x = swimX(n, u), y = SEA + 12 + Math.sin(t * 3 + x * 0.01) * 8; swimmer(x, y, n === 'v_drag' || n === 'v_cut' ? t * 1.8 : t);
    if (floatOn) { X.fillStyle = '#8a6a44'; X.beginPath(); X.roundRect(x + 30, y - 12, 90, 14, 7); X.fill(); X.fillStyle = 'rgba(160,220,255,.85)'; X.beginPath(); X.roundRect(x + 64, y - 34, 22, 26, 6); X.fill(); } }
  // waking up on the beach, leg wrapped in an old piece of sail cloth
  if (n === 'v_wake' || n === 'v_bandage') { X.save(); X.translate(720, bY(720) - 22); X.rotate(-Math.PI / 2); person(0, 0, 1.0, 'stand', 0); X.fillStyle = '#d9c7a0'; X.fillRect(-28, -46, 24, 26); X.fillStyle = 'rgba(160,40,30,.35)'; X.fillRect(-26, -38, 18, 6); star(-16, -26, 6, 'rgba(255,255,255,.85)'); X.restore(); }
  if (n === 'v_figure' || n === 'v_ask' || n === 'end') { X.save(); X.translate(720, bY(720) - 6); person(0, 0, 1.1, 'breath', t); X.restore(); X.fillStyle = '#d9c7a0'; X.fillRect(708, bY(720) - 48, 24, 22); }
  // the man walking away into the jungle, limping
  if (n === 'v_figure') { const w = sm((u - 0.05) / 0.9), x = lerp(1700, 2050, w), limp = Math.abs(Math.sin(t * 3)) * 10 * (Math.sin(t * 3) > 0 ? 1 : 0.3), a = 1 - sm((u - 0.75) / 0.25);
    mirror(x, bY(x) - 4 + limp, 1.15, 'stand', t, a, '#b8a98a'); X.save(); X.globalAlpha = a; const hy = bY(x) - 4 + limp - 96 * 1.15; X.fillStyle = '#b9b5ae'; X.beginPath(); X.arc(x, hy, 31, 0, 7); X.fill(); X.fillStyle = '#d6d2cb'; for (let q = 0; q < 5; q++) { X.beginPath(); X.ellipse(x - 20 + q * 10, hy + 24, 5, 12, 0, 0, 7); X.fill(); } X.fillStyle = '#e8bf9c'; X.beginPath(); X.ellipse(x - 30, hy + 2, 6, 10, 0, 0, 7); X.ellipse(x + 30, hy + 2, 6, 10, 0, 0, 7); X.fill(); X.restore(); }
};
window.p2over = (t, n, u) => {
  if (n === 'v_cut') { const e = sm((u - 0.38) / 0.06) * (1 - sm((u - 0.5) / 0.5)); X.fillStyle = `rgba(200,0,0,${0.6 * e})`; X.fillRect(0, 0, W, H); const d = sm((u - 0.6) / 0.4); X.fillStyle = `rgba(0,0,0,${d})`; X.fillRect(0, 0, W, H); }
  if (n === 'v_black') { X.fillStyle = '#000'; X.fillRect(0, 0, W, H); }
  if (n === 'v_wake') { const a = 1 - sm(u / 0.5); X.fillStyle = `rgba(0,0,0,${a})`; X.fillRect(0, 0, W, H); }
  if (t < 3.6) { const a = 1 - sm((t - 3.2) / 0.4), p = 1 + 0.05 * Math.sin(t * 6); X.save(); X.globalAlpha = a; X.translate(540, 1690); X.scale(p, p); X.fillStyle = '#d42d2d'; X.beginPath(); X.roundRect(-380, -50, 760, 96, 22); X.fill(); X.restore(); txt('"BOATS DIE HERE"', 540, 1708, 50, '#fff', 'center', a);
    X.save(); X.globalAlpha = a; X.fillStyle = '#ffd23f'; X.beginPath(); X.roundRect(100, 1770, 880, 90, 45); X.fill(); X.restore(); txt('PART 4 · YOU VOTED: CHECK THE REEF', 540, 1830, 40, '#10141c', 'center', a); }
  if (n === 'v_ask' || n === 'end') { const a = n === 'v_ask' ? sm((u - 0.38) / 0.12) : 1; if (a > 0) { X.fillStyle = `rgba(6,8,14,${0.84 * a})`; X.fillRect(0, 0, W, H);
    txt('PART 5: YOU DECIDE', 540, 420, 70, '#ffd23f', 'center', a); txt('He saved your life.', 540, 505, 46, '#ffffff', 'center', a); txt("And he still won't be found.", 540, 570, 46, '#ff6a5a', 'center', a);
    const opts = [['1', 'Chase after him', '#ff8a5e'], ['2', 'Call out to him', '#5ec3ff'], ['3', 'Go back to the wreck', '#6af0a8']];
    opts.forEach(([nn, s2, col], i) => { const b = n === 'v_ask' ? back((u - 0.45 - i * 0.07) / 0.15) : 1; if (b <= 0) return; X.save(); X.translate(540, 790 + i * 240); X.scale(b, b); X.globalAlpha = a; X.fillStyle = 'rgba(255,255,255,.08)'; X.beginPath(); X.roundRect(-470, -95, 940, 190, 36); X.fill(); X.strokeStyle = col; X.lineWidth = 6; X.stroke();
      X.fillStyle = col; X.beginPath(); X.arc(-370, 0, 62, 0, 7); X.fill(); txt(nn, -370, 26, 76, '#10141c'); txt(s2, -275, 18, 44, '#fff', 'left'); X.restore(); });
    txt('Comment 1, 2 or 3', 540, 1560, 54, '#fff', 'center', a); txt('Top comment decides.', 540, 1640, 48, '#ffd23f', 'center', a); } }
};
function mirror(x, y, s, pose, t, a = 1, shirt) { X.save(); X.translate(x, y); X.scale(-1, 1); person(0, 0, s, pose, t, a, shirt); X.restore(); }
