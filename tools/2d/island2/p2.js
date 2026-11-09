// Island Part 2: you set a trap for whoever keeps switching off the beacon.
const NET_X = BEACON_X, PALM_TOP = [690 + 0.2 * 340 * 1.4, bY(690) - 340], STAKE_L = 760, STAKE_R = 905, HIDE_X = 1490;
function sh2(n) { return T.segs.find(q => q.shot === n); }
window.p2night = (n, u) => { if (['t_net', 't_hang', 't_wire', 't_bell'].includes(n)) return 0; if (n === 't_bait') return sm((u - 0.2) / 0.6) * 0.9; return 1; };
window.p2cam = (n, u, t) => {
  let cx = 1110, cy = 975, cs = 1.3;
  if (n === 't_recap') { cx = lerp(1110, 840, sm(u)); cy = lerp(975, 930, sm(u)); cs = lerp(1.3, 1.7, sm(u)); }
  if (n === 't_net') { cx = 1150; cy = 900; cs = 1.9; }
  if (n === 't_hang') { cx = 800; cy = 840; cs = 1.5; }
  if (n === 't_wire') { cx = 840; cy = 960; cs = 2.2; }
  if (n === 't_bell') { cx = lerp(900, 1300, sm(u)); cy = 920; cs = 1.5; }
  if (n === 't_bait') { cx = 840; cy = 900; cs = 1.8; }
  if (n === 't_snap') { const z = sm((u - 0.3) / 0.15); cx = lerp(1110, 850, z); cy = lerp(975, 950, z); cs = lerp(1.3, 1.8, z); }
  if (n === 't_run') { cx = lerp(HIDE_X - 100, 980, sm(u)); cy = 900; cs = 1.4; }
  if (n === 't_net2' || n === 't_gift') { cx = 850; cy = 960; cs = 2.2; }
  if (n === 't_sand') { cx = 760; cy = 1040; cs = 2.4; }
  return { cx, cy, cs };
};
function dropT() { return sh2('t_snap').start + 0.9; }
window.p2world = (t, n, u, night) => {
  const k = ORDER.indexOf(n), from = m => k >= ORDER.indexOf(m), byB = bY(BEACON_X);
  window.BEACON_ON = ['t_hook', 't_recap', 't_wait', 't_hum'].includes(n) || (n === 't_bait' && u > 0.45);
  window.NOCAP = n === 't_dont' || n === 'end' || (n === 't_ask' && u > 0.38);
  const dropped = t >= dropT(), dp = cl((t - dropT()) / 0.35);
  const built = (m) => from(m) || ['t_hook', 't_recap'].includes(n);
  // net being woven (by the fire)
  if (n === 't_net') { const g = sm(u / 0.85); X.strokeStyle = '#c9a66a'; X.lineWidth = 3; const x0 = 1040, y0 = bY(1040) - 150; for (let i = 0; i <= 8; i++) { const f = cl(g * 9 - i); if (f <= 0) continue; X.beginPath(); X.moveTo(x0, y0 + i * 16); X.lineTo(x0 + 130 * f, y0 + i * 16); X.stroke(); X.beginPath(); X.moveTo(x0 + i * 16, y0); X.lineTo(x0 + i * 16, y0 + 128 * f); X.stroke(); } }
  // tripwire + stakes
  if (built('t_wire') && !(n === 't_net' || n === 't_hang')) { const a = n === 't_wire' ? sm((u - 0.2) / 0.3) : 1; X.fillStyle = '#7a5a38'; for (const x of [STAKE_L, STAKE_R]) X.fillRect(x - 4, bY(x) - 26, 8, 30);
    X.strokeStyle = `rgba(235,225,200,${0.9 * a})`; X.lineWidth = 2; X.beginPath(); X.moveTo(STAKE_L, bY(STAKE_L) - 18); X.lineTo(STAKE_L + (STAKE_R - STAKE_L) * a, bY(STAKE_R) - 18); X.stroke();
    if (n === 't_wire' && u > 0.5) { const gx = lerp(STAKE_L, STAKE_R, (t * 0.6) % 1); X.fillStyle = 'rgba(255,255,255,.9)'; X.beginPath(); X.arc(gx, bY(gx) - 18, 3, 0, 7); X.fill(); } }
  // shells on a string to the shelter
  if (built('t_bell') && !['t_net', 't_hang', 't_wire'].includes(n)) { const a = n === 't_bell' ? sm(u / 0.5) : 1, ex = lerp(STAKE_R, 1250, a), ey = lerp(bY(STAKE_R) - 18, bY(1250) - 130, a);
    X.strokeStyle = 'rgba(235,225,200,.8)'; X.lineWidth = 2; X.beginPath(); X.moveTo(STAKE_R, bY(STAKE_R) - 18); X.quadraticCurveTo((STAKE_R + ex) / 2, bY(1000) - 30, ex, ey); X.stroke();
    if (a >= 1) { const sh = n === 't_snap' ? Math.sin(t * 60) * 8 * Math.exp(-Math.max(0, t - sh2('t_snap').start - 0.05) * 1.5) : (n === 't_bell' ? Math.sin(t * 20) * 3 : 0); for (let q = 0; q < 5; q++) { X.save(); X.translate(1250 + (q - 2) * 14 + sh * (q % 2 ? 1 : -1), ey + 18 + (q % 2) * 8); X.fillStyle = night > 0.5 ? '#bfb6a6' : '#f4ead8'; X.beginPath(); X.moveTo(0, -10); X.lineTo(8, 6); X.lineTo(-8, 6); X.fill(); X.restore(); } } }
  // the net: hung in the palm over the beacon, then dropped
  if (built('t_hang') && n !== 't_net') { const hang = n === 't_hang' ? back((u - 0.25) / 0.2) : 1;
    if (!dropped) { const bx = NET_X, byy = byB - 270; X.strokeStyle = 'rgba(235,225,200,.85)'; X.lineWidth = 2; X.beginPath(); X.moveTo(PALM_TOP[0], PALM_TOP[1] + 10); X.lineTo(bx, byy - 30 * hang); X.stroke();
      X.save(); X.translate(bx, byy); X.scale(hang, hang); X.fillStyle = night > 0.5 ? '#6e5a3a' : '#c9a66a'; X.beginPath(); X.ellipse(0, 0, 55, 34, 0, 0, 7); X.fill(); X.strokeStyle = night > 0.5 ? '#4a3a24' : '#9a7a44'; X.lineWidth = 2; for (let i = -3; i <= 3; i++) { X.beginPath(); X.moveTo(i * 14, -30); X.lineTo(i * 14, 30); X.stroke(); X.beginPath(); X.moveTo(-50, i * 9); X.lineTo(50, i * 9); X.stroke(); } X.restore(); }
    else { const w = lerp(60, 150, dp), h = lerp(300, 120, dp) * (dp < 1 ? 1 : 1); const y0 = byB; X.strokeStyle = night > 0.5 ? '#8a7450' : '#c9a66a'; X.lineWidth = 3;
      const top = y0 - lerp(270, 130, dp); for (let i = 0; i <= 10; i++) { const f = i / 10; X.beginPath(); X.moveTo(NET_X, top); X.quadraticCurveTo(NET_X + (f - 0.5) * w * 1.2, top + 20, NET_X + (f - 0.5) * w * 2, y0 + 4); X.stroke(); }
      for (let j = 1; j <= 5; j++) { const yy = lerp(top, y0, j / 5.5); const ww = w * (j / 5.5) * 1.05; X.beginPath(); X.moveTo(NET_X - ww, yy); X.quadraticCurveTo(NET_X, yy + 10, NET_X + ww, yy); X.stroke(); }
      if (dp < 1) for (let q = 0; q < 10; q++) { X.fillStyle = 'rgba(210,190,150,.7)'; X.beginPath(); X.arc(NET_X - 130 + q * 28, y0 - Math.sin(dp * Math.PI) * 30 - (q % 3) * 6, 4, 0, 7); X.fill(); } } }
  // fish in a leaf under the net + limping footprints out to the jungle
  if (from('t_net2') && !['t_ask', 'end'].includes(n) || ['t_ask', 'end'].includes(n)) {
    for (let q = 0; q < 22; q++) { const x = NET_X + 90 + q * 44, by = bY(x); X.fillStyle = 'rgba(30,25,15,.55)'; X.save(); X.translate(x, by + 18 + (q % 2 ? 16 : 0)); X.rotate(0.15); X.beginPath(); X.ellipse(0, 0, 22, 9, 0, 0, 7); X.fill(); if (q % 2) { X.globalAlpha = 0.5; X.beginPath(); X.ellipse(-26, 1, 18, 4, 0, 0, 7); X.fill(); X.globalAlpha = 1; } X.restore(); } }
  if (from('t_gift')) { const a = n === 't_gift' ? back((u - 0.1) / 0.2) : 1; X.save(); X.translate(NET_X + 60, byB - 10); X.scale(a, a); X.fillStyle = '#3e8a3e'; X.beginPath(); X.ellipse(0, 0, 46, 16, 0, 0, 7); X.fill(); X.fillStyle = '#c98a4a'; X.beginPath(); X.ellipse(-4, -2, 30, 10, 0, 0, 7); X.fill(); X.fillStyle = '#a86a34'; X.beginPath(); X.moveTo(26, -2); X.lineTo(44, -14); X.lineTo(44, 10); X.fill(); X.fillStyle = '#222'; X.beginPath(); X.arc(-24, -4, 2.5, 0, 7); X.fill(); X.restore();
    const st = X.createRadialGradient(NET_X + 60, byB - 40, 2, NET_X + 60, byB - 40, 40); st.addColorStop(0, 'rgba(255,255,255,.25)'); st.addColorStop(1, 'rgba(255,255,255,0)'); if (n === 't_gift') { for (let q = 0; q < 3; q++) { const ph = (t * 0.5 + q / 3) % 1; X.fillStyle = `rgba(230,230,230,${0.35 * (1 - ph)})`; X.beginPath(); X.arc(NET_X + 50 + q * 8, byB - 30 - ph * 70, 6 + ph * 10, 0, 7); X.fill(); } } }
  // a few scratch marks in the sand (seen side-on) before the close-up
  if (n === 't_sand') { X.strokeStyle = 'rgba(40,30,15,.7)'; X.lineWidth = 3; for (let q = 0; q < 6; q++) { X.beginPath(); X.moveTo(690 + q * 22, bY(700) + 14); X.lineTo(700 + q * 22, bY(700) + 26); X.stroke(); } }
  // music notes drifting out of the jungle while someone hums
  if (n === 't_hum' && u > 0.3) for (let q = 0; q < 4; q++) { const ph = (t * 0.25 + q / 4) % 1; txt('♪', 1820 - ph * 160 + Math.sin(ph * 6 + q) * 20, 940 - ph * 140, 34, `rgba(220,230,255,${0.45 * Math.sin(ph * Math.PI)})`, 'center', 1); }
  // you
  if (n === 't_hook' || n === 't_recap' || n === 't_wait' || n === 't_hum' || (n === 't_snap' && u < 0.3)) person(HIDE_X, bY(HIDE_X), 1.05, 'breath', t);
  if (n === 't_net') person(1210, bY(1210), 1.15, 'saw', t);
  if (n === 't_hang') person(890, bY(890), 1.15, 'hands', t);
  if (n === 't_wire') person(STAKE_R + 80, bY(STAKE_R + 80), 1.15, u < 0.5 ? 'dig' : 'stand', t);
  if (n === 't_bell') person(lerp(1000, 1320, sm(u)), bY(lerp(1000, 1320, sm(u))), 1.15, 'stand', t);
  if (n === 't_bait') person(BEACON_X + 120, bY(BEACON_X + 120), 1.15, 'stand', t);
  if (n === 't_run') { const x = lerp(HIDE_X, 980, sm(u)); person(x, bY(x), 1.15, 'stand', t * 2); X.fillStyle = '#d0d8de'; X.beginPath(); X.moveTo(x - 40, bY(x) - 80); X.lineTo(x - 70, bY(x) - 86); X.lineTo(x - 40, bY(x) - 74); X.fill(); }
  if (n === 't_net2' || n === 't_gift' || n === 't_sand') person(980, bY(980), 1.15, 'breath', t);
  if (n === 't_ask' || n === 'end') person(980, bY(980), 1.15, 'breath', t);
  // knife glint while waiting
  if (n === 't_wait' || n === 't_hum') { const g = Math.max(0, Math.sin(t * 1.3)) ** 8; X.fillStyle = `rgba(255,255,255,${g})`; X.beginPath(); X.arc(HIDE_X + 34, bY(HIDE_X) - 30, 5 + g * 6, 0, 7); X.fill(); }
};
function sandCloseup(t, u) { const a = sm(u / 0.12); X.save(); X.globalAlpha = a; const g = X.createRadialGradient(540, 960, 100, 540, 960, 1100); g.addColorStop(0, '#7a6a48'); g.addColorStop(1, '#2e2718'); X.fillStyle = g; X.fillRect(0, 0, W, H);
  for (let q = 0; q < 900; q++) { const x = (q * 137.5) % W, y = (q * 271.3) % H; X.fillStyle = q % 3 ? 'rgba(255,240,200,.08)' : 'rgba(0,0,0,.12)'; X.fillRect(x, y, 3, 3); }
  const word = "DON'T", reveal = sm((u - 0.12) / 0.35); X.font = '260px P'; X.textAlign = 'center';
  X.save(); X.beginPath(); X.rect(0, 0, 160 + 820 * reveal, H); X.clip(); X.fillStyle = 'rgba(255,240,200,.25)'; X.fillText(word, 546, 1066); X.fillStyle = 'rgba(25,18,8,.85)'; X.fillText(word, 540, 1058); X.restore();
  X.strokeStyle = 'rgba(25,18,8,.5)'; X.lineWidth = 10; X.lineCap = 'round'; X.beginPath(); X.moveTo(850 + 0 * reveal, 1110); X.quadraticCurveTo(940, 1160, 990, 1250); X.stroke();
  X.fillStyle = 'rgba(20,15,8,.6)'; X.save(); X.translate(250, 1400); X.rotate(-0.4); X.beginPath(); X.ellipse(0, 0, 70, 30, 0, 0, 7); X.fill(); X.globalAlpha = a * 0.5; X.beginPath(); X.ellipse(-80, 4, 60, 12, 0, 0, 7); X.fill(); X.restore();
  X.restore(); }
window.p2over = (t, n, u) => {
  if (n === 't_dont') sandCloseup(t, u);
  if (t < 3.6) { const a = 1 - sm((t - 3.2) / 0.4), p = 1 + 0.05 * Math.sin(t * 6); X.save(); X.globalAlpha = a; X.translate(540, 1690); X.scale(p, p); X.fillStyle = '#d42d2d'; X.beginPath(); X.roundRect(-380, -50, 760, 96, 22); X.fill(); X.restore(); txt('THE TRAP IS SET', 540, 1708, 50, '#fff', 'center', a);
    X.save(); X.globalAlpha = a; X.fillStyle = '#ffd23f'; X.beginPath(); X.roundRect(160, 1770, 760, 90, 45); X.fill(); X.restore(); txt('PART 2 · YOU VOTED: SET A TRAP', 540, 1830, 42, '#10141c', 'center', a); }
  if (n === 't_hum') { const a = sm(u / 0.1); X.fillStyle = `rgba(0,0,0,${0.55 * a})`; X.beginPath(); X.roundRect(330, 1560, 420, 120, 26); X.fill(); txt('2:00 AM', 540, 1644, 76, '#cfd8ff', 'center', a); }
  if (n === 't_ask' || n === 'end') { const a = n === 't_ask' ? sm((u - 0.38) / 0.12) : 1; if (a > 0) { X.fillStyle = `rgba(6,8,14,${0.84 * a})`; X.fillRect(0, 0, W, H);
    txt('PART 3: YOU DECIDE', 540, 420, 70, '#ffd23f', 'center', a); txt('They left you food.', 540, 505, 46, '#ffffff', 'center', a); txt("And a warning: DON'T.", 540, 570, 46, '#ff6a5a', 'center', a);
    const opts = [['1', 'Turn the beacon back on', '#ff8a5e'], ['2', 'Write back in the sand', '#5ec3ff'], ['3', 'Track them into the jungle', '#6af0a8']];
    opts.forEach(([nn, s2, col], i) => { const b = n === 't_ask' ? back((u - 0.45 - i * 0.07) / 0.15) : 1; if (b <= 0) return; X.save(); X.translate(540, 790 + i * 240); X.scale(b, b); X.globalAlpha = a; X.fillStyle = 'rgba(255,255,255,.08)'; X.beginPath(); X.roundRect(-470, -95, 940, 190, 36); X.fill(); X.strokeStyle = col; X.lineWidth = 6; X.stroke();
      X.fillStyle = col; X.beginPath(); X.arc(-370, 0, 62, 0, 7); X.fill(); txt(nn, -370, 26, 76, '#10141c'); txt(s2, -275, 18, 44, '#fff', 'left'); X.restore(); });
    txt('Comment 1, 2 or 3', 540, 1560, 54, '#fff', 'center', a); txt('Top comment decides.', 540, 1640, 48, '#ffd23f', 'center', a); } }
};
