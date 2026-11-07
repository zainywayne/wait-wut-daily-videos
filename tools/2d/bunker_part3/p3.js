// Part 3: you kept the hatch shut. Periscope, silence, then scraping through the wall.
const TUN = [[-250, GY - 4], [-330, 1480], [-300, 1900], [-190, 2150]];   // secret tunnel from the yard to just outside the farm wall
function lying(x, y, s, t) { X.save(); X.translate(x, y); X.rotate(-Math.PI / 2); person(0, 0, s, 'stand', t); X.restore(); }
window.p3world = (t, sh, pat, pfrom, u, bang) => {
  // family on the surface (start)
  if (pat('p_hook') || pat('p_bang')) { const a = pat('p_bang') ? 1 - sm((u - 0.35) / 0.25) : 1, wob = Math.sin(t * 20) * 4 * bang;
    person(430 + wob, GY - 6, 1.25, 'stand', t, a, '#c0563a'); person(505, GY - 4, 0.72, 'stand', t, a, '#e0b030'); person(580, GY - 6, 1.2, 'stand', t, a, '#6a8f3a');
    if (a > 0.3) { X.globalAlpha = a; X.fillStyle = 'rgba(255,255,255,.95)'; X.beginPath(); X.roundRect(620, GY - 300, 300, 90, 30); X.fill(); X.beginPath(); X.moveTo(640, GY - 214); X.lineTo(620, GY - 180); X.lineTo(670, GY - 214); X.fill(); X.globalAlpha = 1; txt('OPEN UP!', 770, GY - 238, 46, '#c42d2d', 'center', a); } }
  // steel bar across the hatch shaft
  if (pfrom('p_lock')) { const sl = pat('p_lock') ? back((u - 0.4) / 0.25) : 1; if (sl > 0) { X.save(); X.translate(RX0 + 92, GY + 51); X.scale(sl, sl); X.fillStyle = '#c8ced4'; X.fillRect(-72, -11, 144, 22); X.fillStyle = '#7a828a'; X.fillRect(-72, 7, 144, 4); X.restore(); } X.fillStyle = '#555c63'; X.fillRect(RX0 + 22, GY + 32, 10, 38); X.fillRect(RX0 + 152, GY + 32, 10, 38); }
  label('STEEL BAR', RX0 + 150, GY + 51, RX0 + 330, GY + 200, pat('p_lock') ? cl((u - 0.6) / 0.15) : 0);
  // periscope
  if (pfrom('p_peri')) { const gr = pat('p_peri') ? sm(u / 0.35) : 1, top = lerp(1470, GY - 150, gr);
    X.fillStyle = '#7d8790'; X.fillRect(690, top, 24, 1470 - top); X.fillRect(640, 1446, 74, 24);
    if (gr >= 1) { X.fillRect(690, GY - 150, 72, 24); X.strokeStyle = '#e8f6ff'; X.lineWidth = 6; X.beginPath(); X.moveTo(692, GY - 152); X.lineTo(714, GY - 124); X.moveTo(692, 1446); X.lineTo(714, 1470); X.stroke(); }
    const ray = pat('p_peri') ? sm((u - 0.45) / 0.35) : pat('p_look') ? 1 : 0;
    if (ray > 0) { const P = [[900, GY - 138], [702, GY - 138], [702, 1458], [620, 1458]]; const L0 = [198, 1458 - GY + 138, 82], tot = L0.reduce((a, b) => a + b); let rem = tot * ray;
      X.strokeStyle = '#ffd23f'; X.lineWidth = 6; X.setLineDash([18, 12]); X.lineDashOffset = -t * 60; X.beginPath(); X.moveTo(...P[0]);
      for (let q = 0; q < 3 && rem > 0; q++) { const f = Math.min(1, rem / L0[q]); X.lineTo(lerp(P[q][0], P[q + 1][0], f), lerp(P[q][1], P[q + 1][1], f)); rem -= L0[q]; } X.stroke(); X.setLineDash([]); }
    label('MIRROR', 702, GY - 138, 900, GY - 260, pat('p_peri') ? cl((u - 0.55) / 0.15) : 0); label('MIRROR', 702, 1458, 860, 1380, pat('p_peri') ? cl((u - 0.65) / 0.15) : 0); }
  // the tunnel (it was there all along, we only see it on the reveal)
  if (pfrom('p_reveal')) { const a = pat('p_reveal') ? sm(u / 0.3) : 1; X.globalAlpha = a; X.strokeStyle = '#140d07'; X.lineWidth = 130; X.lineCap = 'round'; X.lineJoin = 'round'; X.beginPath(); X.moveTo(...TUN[0]); for (const p of TUN.slice(1)) X.lineTo(...p); X.stroke();
    X.strokeStyle = 'rgba(90,60,35,.6)'; X.lineWidth = 6; X.setLineDash([4, 26]); X.stroke(); X.setLineDash([]);
    const lg = X.createRadialGradient(-260, 2120, 10, -260, 2120, 260); lg.addColorStop(0, 'rgba(255,170,60,.55)'); lg.addColorStop(1, 'rgba(255,170,60,0)'); X.fillStyle = lg; X.fillRect(-560, 1840, 600, 560);
    person(-200, 2205, 0.95, 'dig', t + 0.4, a, '#c0563a'); person(-275, 2205, 0.95, 'dig', t, a, '#6a8f3a'); person(-340, 2205, 0.6, 'stand', t, a, '#e0b030');
    X.fillStyle = '#ffcf6a'; X.beginPath(); X.arc(-325, 2135, 10, 0, 7); X.fill();
    for (let q = 0; q < 6; q++) { const ph = (t * 1.8 + q / 6) % 1; X.fillStyle = '#6b4a2e'; X.beginPath(); X.arc(-150 - ph * 160, 2120 + ph * 70 - Math.sin(ph * Math.PI) * 60, 8, 0, 7); X.fill(); }
    X.globalAlpha = 1; }
  // cracks + dust on the farm wall
  if (pfrom('p_scrape')) { const sc = pat('p_scrape') ? sm(u / 0.7) : 1, jit = Math.sin(t * 30) * 2; X.strokeStyle = 'rgba(30,30,30,.85)'; X.lineWidth = 4;
    X.beginPath(); X.moveTo(FX0 - 30, 2140); X.lineTo(FX0 - 18 + jit, 2110 - 40 * sc); X.lineTo(FX0 - 6, 2090 - 80 * sc); X.moveTo(FX0 - 30, 2150); X.lineTo(FX0 - 10, 2190 + 30 * sc); X.moveTo(FX0 - 22, 2120); X.lineTo(FX0 + 2, 2130 + jit); X.stroke();
    for (let q = 0; q < 10; q++) { const ph = (t * 0.9 + q / 10) % 1; X.fillStyle = 'rgba(200,190,170,.7)'; X.beginPath(); X.arc(FX0 + 6 + (q % 3) * 8, lerp(2080, FLOOR, ph), 3, 0, 7); X.fill(); } }
  // you
  if (pat('p_hook')) person(400, RY1 - 18, 1.15, 'stand', t);
  if (pat('p_bang')) person(lerp(400, 520, sm(u)), RY1 - 18, 1.15, 'stand', t);
  if (pat('p_lock')) person(RX0 + 92, lerp(RY1 - 18, GY + 230, sm(u / 0.4)), 1.0, 'stand', t);
  if (pat('p_peri') || pat('p_look') || pat('p_gone')) person(pat('p_peri') ? lerp(500, 600, sm(u / 0.4)) : 600, RY1 - 18, 1.15, 'stand', t);
  if (pat('p_fine')) person(690, FLOOR, 1.3, 'stand', t);
  if (pat('p_sound')) lying(590, RY1 - 112, 1.0, 0);
  if (pat('p_scrape') || pat('p_reveal') || pat('p_close') || pat('p_ask') || pat('end')) person(FX0 + 60, FLOOR, 1.3, 'breath', t);
  if (pfrom('p_close')) { const a = pat('p_close') ? cl((u - 0.2) / 0.2) : 1; if (a > 0) { X.globalAlpha = a; X.strokeStyle = '#ffd23f'; X.lineWidth = 6; const y = 2040, x0 = -125, x1 = FX0 - 30;
      X.beginPath(); X.moveTo(x0, y); X.lineTo(x1, y); X.moveTo(x0, y - 22); X.lineTo(x0, y + 22); X.moveTo(x1, y - 22); X.lineTo(x1, y + 22); X.stroke(); X.globalAlpha = 1; txt('1 METER', (x0 + x1) / 2, y - 30, 52, '#ffd23f', 'center', a); } }
};
window.p3over = (t, sh, pat, pfrom, u) => {
  if (t < 5.6) { const a = 1 - sm((t - 5.2) / 0.4), p = 1 + 0.05 * Math.sin(t * 6); X.save(); X.globalAlpha = a; X.translate(540, 190); X.scale(p, p); X.fillStyle = '#d42d2d'; X.beginPath(); X.roundRect(-420, -62, 840, 104, 22); X.fill(); X.restore(); txt("THEY'RE STILL OUT THERE", 540, 205, 56, '#fff', 'center', a);
    X.save(); X.globalAlpha = a; X.fillStyle = '#ffd23f'; X.beginPath(); X.roundRect(150, 1650, 780, 100, 50); X.fill(); X.restore(); txt('PART 3 · YOU KEPT IT SHUT', 540, 1718, 50, '#10141c', 'center', a); }
  if (pat('p_look') || pat('p_gone')) { const a = pat('p_look') ? sm((u - 0.3) / 0.3) : 1; if (a > 0) { X.save(); X.globalAlpha = a; X.fillStyle = '#000'; X.beginPath(); X.rect(0, 0, W, H); X.arc(540, 1000, 420, 0, 7, true); X.fill();
      X.beginPath(); X.arc(540, 1000, 420, 0, 7); X.clip(); const sk = X.createLinearGradient(0, 580, 0, 1120); sk.addColorStop(0, '#5a4a6a'); sk.addColorStop(1, '#c49080'); X.fillStyle = sk; X.fillRect(0, 560, W, 560);
      X.fillStyle = '#c9a77a'; for (let x = 100; x < 1000; x += 70) X.fillRect(x + Math.sin(t * 0.6) * 10, 900, 50, 220); X.fillRect(100, 940, 900, 16); X.fillStyle = '#4f9b3f'; X.fillRect(0, 1100, W, 360);
      X.fillStyle = 'rgba(40,60,30,.5)'; for (let q = 0; q < 7; q++) { X.beginPath(); X.ellipse(300 + q * 70, 1200 + (q % 2) * 30, 14, 9, 0.4, 0, 7); X.fill(); }
      X.strokeStyle = 'rgba(0,0,0,.6)'; X.lineWidth = 3; X.beginPath(); X.moveTo(540, 580); X.lineTo(540, 1420); X.moveTo(120, 1000); X.lineTo(960, 1000); X.stroke(); X.restore();
      X.strokeStyle = `rgba(150,160,170,${a})`; X.lineWidth = 18; X.beginPath(); X.arc(540, 1000, 428, 0, 7); X.stroke(); } }
  if (pat('p_fine')) { X.fillStyle = 'rgba(0,0,0,.55)'; X.beginPath(); X.roundRect(290, 1500, 500, 130, 26); X.fill(); txt('DAY 12', 540, 1590, 84, '#6af0a8'); }
  if (pat('p_sound') || pat('p_scrape')) { const a = pat('p_sound') ? sm(u / 0.2) : 1 - sm((u - 0.3) / 0.2); X.fillStyle = `rgba(5,8,20,${0.45 * (pat('p_sound') ? a : 1)})`; X.fillRect(0, 0, W, H); if (a > 0) { X.fillStyle = `rgba(0,0,0,${0.6 * a})`; X.beginPath(); X.roundRect(310, 1500, 460, 130, 26); X.fill(); txt('3:00 AM', 540, 1592, 84, '#ff6a5a', 'center', a); } }
  if (pfrom('p_reveal') && !pfrom('p_ask')) { X.fillStyle = 'rgba(5,8,20,.12)'; X.fillRect(0, 0, W, H); }
  if (pat('p_ask') || pat('end')) { const a = pat('p_ask') ? sm((u - 0.3) / 0.12) : 1; if (a > 0) { X.fillStyle = `rgba(6,8,14,${0.84 * a})`; X.fillRect(0, 0, W, H);
    txt('PART 4: YOU DECIDE', 540, 420, 70, '#ffd23f', 'center', a); txt("They're 1 meter", 540, 505, 48, '#ffffff', 'center', a); txt('from your food.', 540, 570, 48, '#ff6a5a', 'center', a);
    const opts = [['1', 'Break through and share', '#6af0a8'], ['2', 'Build a steel wall', '#5ec3ff'], ['3', 'Grab the food and run', '#ff8a5e']];
    opts.forEach(([n, s2, col], i) => { const b = pat('p_ask') ? back((u - 0.38 - i * 0.09) / 0.2) : 1; if (b <= 0) return; X.save(); X.translate(540, 790 + i * 240); X.scale(b, b); X.globalAlpha = a; X.fillStyle = 'rgba(255,255,255,.08)'; X.beginPath(); X.roundRect(-450, -95, 900, 190, 36); X.fill(); X.strokeStyle = col; X.lineWidth = 6; X.stroke();
      X.fillStyle = col; X.beginPath(); X.arc(-350, 0, 62, 0, 7); X.fill(); txt(n, -350, 26, 76, '#10141c'); txt(s2, -255, 20, 50, '#fff', 'left'); X.restore(); });
    txt('Comment 1, 2 or 3', 540, 1560, 54, '#fff', 'center', a); txt('Top comment decides.', 540, 1640, 48, '#ffd23f', 'center', a); } }
};
