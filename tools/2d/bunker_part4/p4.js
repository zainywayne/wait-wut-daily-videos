// Part 4: you build a steel wall. They hit it. Then they block your air vent and send a note.
const PL = 6, PH = (FLOOR - FY0) / PL;
function mirror(x, y, s, pose, t, a = 1, shirt) { X.save(); X.translate(x, y); X.scale(-1, 1); person(0, 0, s, pose, t, a, shirt); X.restore(); }
function q4() { return window.Q4; }
function digProg(t) { const { sh } = q4(); const hit = T.segs.find(q => q.shot === 'q_hit'); const tHit = hit.start + 1.0; return cl(t / tHit) ** 0.8; }
function tunnelEnd(t) { return lerp(-190, 20, digProg(t)); }
window.p4cam = (qat, qfrom, u) => {
  let cx = 60, cy = 2080, cs = 1.25;
  window.SHOW_M = (qat('q_hook') ? 1 - sm((u - 0.8) / 0.2) : 0); window.M_X0 = tunnelEnd(q4().sh.t0 + u * q4().sh.d) + 65;
  if (qat('q_recap')) { cx = 300; cy = 1650; cs = 0.82; }
  if (qat('q_build') || qat('q_thick') || qat('q_brace')) { cx = 200; cy = 2030; cs = 1.35; }
  if (qat('q_hit')) { cx = 80; cy = 2060; cs = 1.45; }
  if (qat('q_stop')) { cx = 120; cy = 2000; cs = lerp(1.45, 1.2, sm(u)); }
  if (qat('q_sleep')) { cx = 550; cy = 1418; cs = 1.5; }
  if (qat('q_peri')) { cx = 600; cy = 1300; cs = 1.3; }
  if (qat('q_head')) { cx = 560; cy = 1440; cs = lerp(1.5, 1.8, sm(u)); }
  if (qat('q_smell')) { cx = 660; cy = 1040; cs = 1.35; }
  if (qat('q_vent')) { cx = 700; cy = 930; cs = 1.3; }
  if (qat('q_co2')) { cx = 550; cy = 1418; cs = 1.5; }
  if (qat('q_note') || qat('q_read')) { cx = 640; cy = 1420; cs = 1.6; }
  if (qat('q_ask') || qat('end')) { cx = 300; cy = 1650; cs = 0.82; }
  return { cx, cy, cs };
};
window.p4bang = (t, qat, sh) => {
  let b = 0;
  if (qfromQ('q_hook') && !qfromQ('q_hit')) b = 0.12 * (Math.sin(t * 10) > 0.6 ? 1 : 0);
  if (qat('q_build')) for (let q = 0; q < PL; q++) { const e = t - (sh.t0 + 0.5 + q * 0.42); if (e >= 0) b = Math.max(b, 0.5 * Math.exp(-e * 14)); }
  if (qat('q_hit')) { const e = t - (sh.t0 + 1.0); if (e >= 0) b = Math.max(b, Math.exp(-e * 6)); }
  return b;
};
function qfromQ(n) { return q4().qfrom(n); }
window.p4tunnel = (t) => {
  const { qat, qfrom, u } = q4(); const ex = tunnelEnd(t);
  X.strokeStyle = '#140d07'; X.lineWidth = 130; X.lineCap = 'round'; X.beginPath(); X.moveTo(-190, 2150); X.lineTo(ex, 2150); X.stroke();
  const lg = X.createRadialGradient(ex - 120, 2130, 10, ex - 120, 2130, 260); lg.addColorStop(0, 'rgba(255,170,60,.5)'); lg.addColorStop(1, 'rgba(255,170,60,0)'); X.fillStyle = lg; X.fillRect(ex - 420, 1860, 600, 520);
  const leave = qat('q_smell') ? sm(u / 0.4) : qfrom('q_vent') ? 1 : 0, a = 1 - leave; if (a <= 0) return;
  const digging = !qfrom('q_hit') || (qat('q_hit') && u < 0.37);
  person(ex - 20, 2205, 0.95, digging ? 'dig' : 'stand', t + 0.4, a, '#c0563a'); person(ex - 95, 2205, 0.95, digging ? 'dig' : 'stand', t, a, '#6a8f3a'); person(ex - 160, 2205, 0.6, 'stand', t, a, '#e0b030');
  X.globalAlpha = a; X.fillStyle = '#ffcf6a'; X.beginPath(); X.arc(ex - 145, 2135, 10, 0, 7); X.fill(); X.globalAlpha = 1;
  if (digging) for (let q = 0; q < 5; q++) { const ph = (t * 1.8 + q / 5) % 1; X.fillStyle = '#6b4a2e'; X.beginPath(); X.arc(ex + 30 - ph * 150, 2120 + ph * 70 - Math.sin(ph * Math.PI) * 60, 8, 0, 7); X.fill(); }
};
function sparks(x, y, t0, t, n = 14, col = '#ffd23f') { const e = t - t0; if (e < 0 || e > 0.6) return; for (let q = 0; q < n; q++) { const an = q * 2.4 + t0, sp = 120 + (q * 53) % 200; const px = x + Math.cos(an) * sp * e, py = y + Math.sin(an) * sp * e + 500 * e * e; X.fillStyle = col; X.globalAlpha = 1 - e / 0.6; X.beginPath(); X.arc(px, py, 4, 0, 7); X.fill(); } X.globalAlpha = 1; }
window.p4world = (t, qat, qfrom, u, bang, sh) => {
 window.FAM_DIG = false;
  // steel plates on the inside of the farm wall
  if (qfrom('q_build')) { const b0 = T.segs.find(q => q.shot === 'q_build').start;
    for (let q = 0; q < PL; q++) { const s = qat('q_build') ? back((t - b0 - 0.5 - q * 0.42) / 0.15) : 1; if (s <= 0) continue; const y = FY0 + q * PH;
      X.save(); X.translate(FX0 + 15, y + PH / 2); X.scale(s, s); const mg = X.createLinearGradient(-15, 0, 15, 0); mg.addColorStop(0, '#6f7a84'); mg.addColorStop(0.5, '#d9e0e6'); mg.addColorStop(1, '#7d8891'); X.fillStyle = mg; X.fillRect(-15, -PH / 2 + 2, 32, PH - 4); X.restore();
      sparks(FX0 + 30, y + PH / 2, b0 + 0.5 + q * 0.42, t, 10); }
    // bolts + corner gussets
    if (qfrom('q_brace')) { const br = qat('q_brace') ? u : 1;
      for (let q = 0; q < PL * 2; q++) { const s = back((br - 0.1 - q * 0.035) / 0.1); if (s <= 0) continue; X.fillStyle = '#3c434a'; X.beginPath(); X.arc(FX0 + 15, FY0 + (q + 0.5) * PH / 2, 5 * s, 0, 7); X.fill(); }
      const gs = sm((br - 0.5) / 0.2); X.fillStyle = '#59626b'; for (const [y, d] of [[FY0, 1], [FLOOR, -1]]) { X.beginPath(); X.moveTo(FX0 + 30, y); X.lineTo(FX0 + 30 + 70 * gs, y); X.lineTo(FX0 + 30, y + d * 90 * gs); X.fill(); }
      X.strokeStyle = '#59626b'; X.lineWidth = 12; X.beginPath(); X.moveTo(FX0 + 30, FY0 + 140); X.lineTo(FX0 + 30 + 120 * gs, FY0 + 140); X.moveTo(FX0 + 30, SHELF_Y - 40); X.lineTo(FX0 + 30 + 20 * gs, SHELF_Y - 40); X.stroke(); } }
  if (qat('q_hit')) { const h0 = sh.t0 + 1.0; sparks(70, 2150, h0, t, 26, '#fff3a0'); const fl = Math.exp(-(t - h0) * 6) * (t > h0 ? 1 : 0); if (fl > 0.02) { X.fillStyle = `rgba(255,255,255,${fl * 0.7})`; X.fillRect(FX0, FY0, 32, FLOOR - FY0); } }
  // air flowing down the vent, then stopping
  const flow = qat('q_smell') ? 1 - sm((u - 0.3) / 0.3) : qfrom('q_vent') ? 0 : 1;
  if (flow > 0 && (qat('q_smell'))) for (let q = 0; q < 8; q++) { const ph = (t * 0.9 * flow + q / 8) % 1; X.fillStyle = `rgba(220,240,255,${0.8 * flow})`; X.beginPath(); X.arc(RX1 - 63, lerp(GY - 110, RY0 + 10, ph), 6, 0, 7); X.fill(); }
  // tarp over the vent + the family up top
  if (qfrom('q_vent')) { const tg = qat('q_vent') ? sm((u - 0.15) / 0.4) : 1; X.fillStyle = '#3d5a3a'; X.beginPath(); X.ellipse(RX1 - 63, GY - 130, 30 + 30 * tg, 20 + 28 * tg, 0, 0, 7); X.fill(); X.fillStyle = '#2f472d'; X.beginPath(); X.ellipse(RX1 - 50, GY - 112, 20 + 24 * tg, 10 + 12 * tg, 0.3, 0, 7); X.fill();
    if (!qfrom('q_note')) { person(RX1 - 160, GY - 6, 1.25, 'stand', t, 1, '#c0563a'); mirror(RX1 + 40, GY - 6, 1.2, 'stand', t, 1, '#6a8f3a'); person(RX1 - 230, GY - 4, 0.72, 'stand', t, 1, '#e0b030'); } }
  // the note falling out of the vent filter
  if (qat('q_note')) { const f = sm((u - 0.2) / 0.5), x = lerp(RX1 - 63, 680, f) + Math.sin(f * 12) * 30, y = lerp(RY0 + 60, RY1 - 26, f); X.save(); X.translate(x, y); X.rotate(Math.sin(f * 12) * 0.5); X.fillStyle = '#f4ecd2'; X.fillRect(-22, -15, 44, 30); X.strokeStyle = '#a33'; X.lineWidth = 2; for (let q = 0; q < 3; q++) { X.beginPath(); X.moveTo(-16, -7 + q * 7); X.lineTo(14, -7 + q * 7); X.stroke(); } X.restore(); }
  // you
  if (qat('q_hook') || qat('q_recap')) person(FX0 + 70, FLOOR, 1.3, 'breath', t);
  if (qat('q_build') || qat('q_brace')) mirror(FX0 + 110, FLOOR, 1.3, 'dig', t);
  if (qat('q_hit') || qat('q_stop')) person(FX0 + 150, FLOOR, 1.3, 'breath', t);
  if (qat('q_smell') || qat('q_co2') || qat('q_peri') || qat('q_head')) person(600, RY1 - 18, 1.15, qat('q_head') ? 'breath' : 'stand', t);
  if (qat('q_build') && false) {}
  if (qat('q_thick')) mirror(FX0 + 110, FLOOR, 1.3, 'stand', t);
  if (qat('q_sleep')) lying(590, RY1 - 112, 1.0, 0);
  if (qat('q_note') || qat('q_read')) person(620, RY1 - 18, 1.15, 'stand', t);
  if (qat('q_ask') || qat('end')) person(560, RY1 - 18, 1.15, 'stand', t);
  label('STEEL', FX0 + 20, FY0 + 120, 330, FY0 - 40, qat('q_build') ? cl((u - 0.75) / 0.15) : 0); label('BOLTED + BRACED', FX0 + 40, FY0 + 150, FX0 + 100, FY0 - 60, qat('q_brace') ? cl((u - 0.6) / 0.15) : 0);
  label('YOUR AIR VENT', RX1 - 63, GY - 140, RX1 - 200, GY - 330, qat('q_vent') ? cl((u - 0.3) / 0.15) : 0);
};
window.p4over = (t, qat, qfrom, u, sh) => {
  if (t < 3.9) { const a = 1 - sm((t - 3.5) / 0.4), p = 1 + 0.05 * Math.sin(t * 6); X.save(); X.globalAlpha = a; X.translate(540, 190); X.scale(p, p); X.fillStyle = '#d42d2d'; X.beginPath(); X.roundRect(-430, -62, 860, 104, 22); X.fill(); X.restore(); txt("THE WALL ISN'T BUILT YET", 540, 205, 56, '#fff', 'center', a);
    X.save(); X.globalAlpha = a; X.fillStyle = '#ffd23f'; X.beginPath(); X.roundRect(130, 1650, 820, 100, 50); X.fill(); X.restore(); txt('PART 4 · YOU VOTED: STEEL WALL', 540, 1718, 48, '#10141c', 'center', a); }
  if (qat('q_co2') || qat('q_head') || qat('q_note') || qat('q_read')) { const lv = qat('q_co2') ? lerp(0.25, 0.6, sm(u)) : qat('q_head') ? lerp(0.6, 0.75, u) : qat('q_note') ? lerp(0.75, 0.82, u) : lerp(0.82, 0.92, u); const red = lv > 0.6, gx = 540, gy = 1640, gw = 640;
    X.fillStyle = 'rgba(0,0,0,.65)'; X.beginPath(); X.roundRect(gx - gw / 2 - 20, gy - 30, gw + 40, 60, 30); X.fill(); X.fillStyle = red ? '#ff4a4a' : '#6af0a8'; X.beginPath(); X.roundRect(gx - gw / 2, gy - 16, gw * lv, 32, 16); X.fill(); txt(red ? 'CO₂ LEVEL: DANGER' : 'CO₂ LEVEL', gx, gy - 52, 48, red ? '#ff6a5a' : '#fff'); }
  if (qat('q_head')) { const p = 0.5 + 0.5 * Math.sin(t * 7); const vg = X.createRadialGradient(540, 960, 300, 540, 960, 1100); vg.addColorStop(0, 'rgba(160,0,0,0)'); vg.addColorStop(1, `rgba(160,0,0,${0.25 + 0.3 * p * sm(u)})`); X.fillStyle = vg; X.fillRect(0, 0, W, H); }
  if (qat('q_peri')) { const a = sm((u - 0.25) / 0.2); if (a > 0) { X.save(); X.globalAlpha = a; X.fillStyle = '#000'; X.beginPath(); X.rect(0, 0, W, H); X.arc(540, 1000, 420, 0, 7, true); X.fill();
      X.beginPath(); X.arc(540, 1000, 420, 0, 7); X.clip(); const sk = X.createLinearGradient(0, 580, 0, 1120); sk.addColorStop(0, '#5a4a6a'); sk.addColorStop(1, '#c49080'); X.fillStyle = sk; X.fillRect(0, 560, W, 560);
      X.fillStyle = '#c9a77a'; for (let x = 100; x < 1000; x += 70) X.fillRect(x, 900, 50, 220); X.fillRect(100, 940, 900, 16); X.fillStyle = '#4f9b3f'; X.fillRect(0, 1100, W, 360);
      X.fillStyle = '#b5bcc3'; X.fillRect(560, 900, 60, 230); X.fillStyle = '#3d5a3a'; X.beginPath(); X.ellipse(590, 900, 110, 80, 0, 0, 7); X.fill();
      person(420, 1150, 2.1, 'stand', t, 1, '#c0563a'); person(800, 1150, 2.0, 'stand', t, 1, '#6a8f3a'); person(320, 1160, 1.25, 'stand', t, 1, '#e0b030');
      X.strokeStyle = 'rgba(0,0,0,.6)'; X.lineWidth = 3; X.beginPath(); X.moveTo(540, 580); X.lineTo(540, 1420); X.moveTo(120, 1000); X.lineTo(960, 1000); X.stroke(); X.restore();
      X.strokeStyle = `rgba(150,160,170,${a})`; X.lineWidth = 18; X.beginPath(); X.arc(540, 1000, 428, 0, 7); X.stroke(); } }
  if (qat('q_read')) { const a = sm(u / 0.15); X.save(); X.globalAlpha = a; X.translate(540, 980); X.rotate(-0.05); X.scale(0.9 + 0.1 * a, 0.9 + 0.1 * a); X.shadowColor = 'rgba(0,0,0,.6)'; X.shadowBlur = 40; X.fillStyle = '#f4ecd2'; X.fillRect(-380, -260, 760, 520); X.shadowBlur = 0;
    X.strokeStyle = 'rgba(120,150,200,.35)'; X.lineWidth = 3; for (let y = -180; y < 240; y += 70) { X.beginPath(); X.moveTo(-340, y); X.lineTo(340, y); X.stroke(); }
    X.fillStyle = '#9b1c1c'; X.font = '96px P'; X.textAlign = 'center'; X.fillText('OPEN THE', 0, -80); X.fillText('HATCH.', 0, 30); X.font = '80px P'; X.fillStyle = '#2a2a2a'; X.fillText('OR NO AIR.', 0, 160); X.restore(); }
  if (qat('q_ask') || qat('end')) { const a = qat('q_ask') ? sm((u - 0.3) / 0.12) : 1; if (a > 0) { X.fillStyle = `rgba(6,8,14,${0.84 * a})`; X.fillRect(0, 0, W, H);
    txt('PART 5: YOU DECIDE', 540, 420, 70, '#ffd23f', 'center', a); txt('They blocked your air.', 540, 505, 48, '#ffffff', 'center', a); txt('"Open the hatch. Or no air."', 540, 570, 44, '#ff6a5a', 'center', a);
    const opts = [['1', 'Open the hatch', '#ff8a5e'], ['2', 'Dig a secret air vent', '#5ec3ff'], ['3', 'Trade food for air', '#6af0a8']];
    opts.forEach(([n, s2, col], i) => { const b = qat('q_ask') ? back((u - 0.38 - i * 0.09) / 0.2) : 1; if (b <= 0) return; X.save(); X.translate(540, 790 + i * 240); X.scale(b, b); X.globalAlpha = a; X.fillStyle = 'rgba(255,255,255,.08)'; X.beginPath(); X.roundRect(-450, -95, 900, 190, 36); X.fill(); X.strokeStyle = col; X.lineWidth = 6; X.stroke();
      X.fillStyle = col; X.beginPath(); X.arc(-350, 0, 62, 0, 7); X.fill(); txt(n, -350, 26, 76, '#10141c'); txt(s2, -255, 20, 50, '#fff', 'left'); X.restore(); });
    txt('Comment 1, 2 or 3', 540, 1560, 54, '#fff', 'center', a); txt('Top comment decides.', 540, 1640, 48, '#ffd23f', 'center', a); } }
};
