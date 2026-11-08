// Part 5: dig a secret air vent sideways under the fence into the neighbour's yard. Then the kid finds it.
const TY = 2195, TH = 120, TX0 = FX1 + 30, HX = 1560, SHT = 1100, FENCE = 1250;
function tp(rfrom, rat, u) {   // dig progress
  let hx = TX0, sy = TY, pipe = 0, bush = 0;
  if (rat('r_side')) hx = lerp(TX0, FENCE + 40, sm(u)); else if (rat('r_quiet')) hx = lerp(FENCE + 40, HX + TH / 2, sm(u)); else if (rfrom('r_up')) hx = HX + TH / 2;
  if (rat('r_up')) sy = lerp(TY, SHT, sm(u)); else if (rfrom('r_pipe')) sy = SHT;
  if (rat('r_pipe')) { pipe = sm(u / 0.5); bush = sm((u - 0.5) / 0.3); } else if (rfrom('r_fan')) { pipe = 1; bush = 1; }
  return { hx, sy, pipe, bush, started: rfrom('r_side') };
}
function airPath() { return [[HX, GY - 30], [HX, TY], [TX0 + 10, TY], [FX1 - 60, TY]]; }
function along(P, f) { const L = []; let tot = 0; for (let i = 0; i < P.length - 1; i++) { const d = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); L.push(d); tot += d; } let r = f * tot; for (let i = 0; i < L.length; i++) { if (r <= L[i]) { const k = r / L[i]; return [lerp(P[i][0], P[i + 1][0], k), lerp(P[i][1], P[i + 1][1], k)]; } r -= L[i]; } return P[P.length - 1]; }
window.p5cam = (rat, rfrom, u) => {
  let cx = 640, cy = 1230, cs = 1.08;
  if (rat('r_recap')) { cx = 640; cy = lerp(1230, 1500, sm(u)); cs = lerp(1.08, 0.86, sm(u)); }
  if (rat('r_plan')) { cx = 800; cy = 1980; cs = 1.25; }
  if (rat('r_side') || rat('r_quiet') || rat('r_up') || rat('r_pipe')) { cx = 1260; cy = 1720; cs = 0.95; }
  if (rat('r_fan') || rat('r_breathe')) { cx = 860; cy = 2040; cs = 1.18; }
  if (rat('r_fool')) { cx = 1150; cy = 860; cs = 0.95; }
  if (rat('r_night')) { cx = 1300; cy = 820; cs = 0.95; }
  if (rat('r_clue')) { cx = lerp(1150, 850, sm(u / 0.5)); cy = lerp(860, 800, sm(u / 0.5)); cs = lerp(0.95, 1.6, sm(u / 0.5)); }
  if (rat('r_but')) { cx = 1330; cy = 1480; cs = 0.8; }
  if (rat('r_kid')) { cx = 1470; cy = 780; cs = 1.65; }
  if (rat('r_ask') || rat('end')) { cx = 1000; cy = 1500; cs = 0.7; }
  return { cx, cy, cs };
};
window.p5world = (t, rat, rfrom, u, sh) => {
  const night = rfrom('r_night');
  if (night) { X.fillStyle = 'rgba(10,15,45,.55)'; X.fillRect(-500, GY - 1300, 2600, 1300); X.fillStyle = '#fff'; for (let q = 0; q < 40; q++) { X.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + q); X.fillRect((q * 137) % 2400 - 300, GY - 300 - (q * 89) % 900, 3, 3); } X.globalAlpha = 1; }
  // neighbour's house (plain)
  X.fillStyle = '#d9c7a8'; X.fillRect(1640, GY - 420, 380, 420); X.fillStyle = '#8a4a3a'; X.beginPath(); X.moveTo(1610, GY - 420); X.lineTo(1830, GY - 590); X.lineTo(2050, GY - 420); X.fill();
  X.fillStyle = night ? '#3a4058' : '#7fb9e0'; X.fillRect(1690, GY - 330, 100, 90); X.fillRect(1860, GY - 330, 100, 90);
  // set dressing (clues): a kid's swing set beside the hatch, a kid's bike, a mailbox with a family name
  X.strokeStyle = '#c0563a'; X.lineWidth = 10; X.lineCap = 'round'; X.beginPath(); X.moveTo(120, GY - 4); X.lineTo(170, GY - 200); X.lineTo(220, GY - 4); X.moveTo(300, GY - 4); X.lineTo(350, GY - 200); X.lineTo(400, GY - 4); X.moveTo(165, GY - 200); X.lineTo(355, GY - 200); X.stroke();
  const sw = Math.sin(t * 1.6) * 0.18; X.save(); X.translate(260, GY - 200); X.rotate(sw); X.strokeStyle = '#555'; X.lineWidth = 3; X.beginPath(); X.moveTo(-26, 0); X.lineTo(-26, 140); X.moveTo(26, 0); X.lineTo(26, 140); X.stroke(); X.fillStyle = '#e0b030'; X.fillRect(-34, 136, 68, 12); X.restore();
  X.strokeStyle = '#3f8fd8'; X.lineWidth = 5; X.beginPath(); X.arc(470, GY - 22, 18, 0, 7); X.moveTo(530, GY - 22); X.arc(530, GY - 22, 18, 0, 7); X.moveTo(470, GY - 22); X.lineTo(500, GY - 50); X.lineTo(530, GY - 22); X.moveTo(500, GY - 50); X.lineTo(492, GY - 62); X.stroke();
  X.fillStyle = '#6d5236'; X.fillRect(1100, GY - 130, 12, 130); X.fillStyle = '#3a5f8f'; X.beginPath(); X.roundRect(1068, GY - 175, 76, 48, [24, 24, 4, 4]); X.fill(); X.fillStyle = '#d42d2d'; X.fillRect(1140, GY - 175, 6, 30); X.fillStyle = '#fff'; X.font = '15px P'; X.textAlign = 'center'; X.fillText('MILLER', 1106, GY - 144);
  const P = tp(rfrom, rat, u);
  // front fence post (property line)
  X.fillStyle = '#8a6a48'; X.fillRect(FENCE - 14, GY - 220, 28, 220); X.fillStyle = '#6d5236'; X.fillRect(FENCE - 20, GY - 230, 40, 14);
  // tunnel + shaft
  if (P.started) { X.fillStyle = '#140d07'; X.fillRect(TX0 - 30, TY - TH / 2, P.hx - TX0 + 30, TH); if (P.hx > TX0 + 20) { X.beginPath(); X.arc(P.hx, TY, TH / 2, -Math.PI / 2, Math.PI / 2); X.fill(); }
    X.fillStyle = '#7a5a38'; for (let x = TX0 + 80; x < P.hx - 30; x += 140) { X.fillRect(x, TY - TH / 2, 10, TH); X.fillRect(x - 20, TY - TH / 2, 50, 10); }
    if (P.sy < TY) { X.fillStyle = '#140d07'; X.fillRect(HX - TH / 2, P.sy, TH, TY - P.sy); X.beginPath(); X.arc(HX, P.sy, TH / 2, Math.PI, 0); X.fill(); X.strokeStyle = '#b07a3a'; X.lineWidth = 5; for (let y = TY - 40; y > P.sy + 30; y -= 44) { X.beginPath(); X.moveTo(HX - 30, y); X.lineTo(HX + 30, y); X.stroke(); } } }
  if (P.pipe > 0) { const top = lerp(SHT, GY - 40, P.pipe); X.fillStyle = '#7d8790'; X.fillRect(HX - 13, top, 26, SHT - top + 20); }
  if (P.bush > 0) { X.save(); X.translate(HX, GY - 10); X.scale(P.bush, P.bush); X.fillStyle = '#3f8a3a'; for (const [x, y, r] of [[-50, -30, 48], [40, -34, 52], [0, -66, 56], [-10, -20, 50]]) { X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); } X.fillStyle = '#4fa448'; X.beginPath(); X.arc(-20, -70, 30, 0, 7); X.fill(); X.restore(); }
  // wall opening + fan
  if (P.started) { X.fillStyle = '#140d07'; X.fillRect(FX1 - 2, TY - TH / 2, 34, TH); }
  if (rfrom('r_fan')) { const a = rat('r_fan') ? back(u / 0.25) : 1, spin = rat('r_fan') ? t * 14 * sm((u - 0.2) / 0.2) : t * 14; X.save(); X.translate(FX1 - 40, TY); X.scale(a, a); X.fillStyle = '#2d3238'; X.beginPath(); X.arc(0, 0, 52, 0, 7); X.fill(); X.fillStyle = '#9aa4ad'; X.rotate(spin); for (let q = 0; q < 4; q++) { X.rotate(Math.PI / 2); X.beginPath(); X.ellipse(0, -24, 12, 24, 0, 0, 7); X.fill(); } X.restore();
    X.strokeStyle = '#111'; X.lineWidth = 5; X.beginPath(); X.moveTo(870, FLOOR - 50); X.quadraticCurveTo(900, TY + 60, FX1 - 60, TY + 30); X.stroke();
    const on = rat('r_fan') ? sm((u - 0.3) / 0.2) : 1; if (on > 0) for (let q = 0; q < 26; q++) { const f = (t * 0.22 + q / 26) % 1, [x, y] = along(airPath(), f); X.fillStyle = `rgba(190,235,255,${0.85 * on})`; X.beginPath(); X.arc(x + Math.sin(q * 3 + t * 3) * 14, y + Math.cos(q * 5 + t * 3) * 14, 7, 0, 7); X.fill(); }
    if (on > 0) for (let q = 0; q < 6; q++) { const ph = (t * 0.8 + q / 6) % 1; X.globalAlpha = (1 - ph) * on; X.strokeStyle = '#bfe9ff'; X.lineWidth = 4; X.beginPath(); X.arc(FX1 - 90 - ph * 260, TY + (q - 2.5) * 22, 12, -0.8, 0.8); X.stroke(); } X.globalAlpha = 1; }
  // buckets of dirt back to the farm
  if (rat('r_quiet')) for (let q = 0; q < 3; q++) { const f = (t * 0.25 + q / 3) % 1; const x = lerp(P.hx - 80, FX1 - 40, f); X.fillStyle = '#5d666f'; X.fillRect(x - 14, TY + 30, 28, 26); X.fillStyle = '#6b4a2e'; X.beginPath(); X.ellipse(x, TY + 30, 15, 7, 0, 0, 7); X.fill(); }
  if ((rat('r_side') || rat('r_quiet') || rat('r_up')) && Math.sin(t * 9) > 0) for (let q = 0; q < 4; q++) { const ph = (t * 2 + q / 4) % 1; X.fillStyle = '#6b4a2e'; X.beginPath(); X.arc(rat('r_up') ? HX + Math.sin(q) * 30 : P.hx - 20 - ph * 60, rat('r_up') ? P.sy + 30 + ph * 80 : TY + 20 - Math.sin(ph * Math.PI) * 40, 6, 0, 7); X.fill(); }
  // the family up top
  const kidX = rat('r_but') ? lerp(RX1 - 230, HX - 80, sm((u - 0.15) / 0.6)) : rfrom('r_kid') ? HX - 80 : RX1 - 230;
  if (!rfrom('r_ask')) { const sleepy = night; person(RX1 - 160, GY - 6, 1.25, 'stand', t, 1, '#c0563a'); mirror(RX1 + 40, GY - 6, 1.2, 'stand', t, 1, '#6a8f3a'); person(kidX, GY - 4, 0.72, rat('r_kid') ? 'breath' : 'stand', t, 1, '#e0b030');
    if (sleepy && !rat('r_kid')) { txt('z', RX1 - 140, GY - 190 - (t * 20) % 30, 34, '#cfd8ff'); txt('z', RX1 + 60, GY - 180 - (t * 20 + 15) % 30, 30, '#cfd8ff'); } }
  if (rat('r_kid')) { const a = sm(u / 0.15); X.globalAlpha = a; X.fillStyle = 'rgba(255,255,255,.96)'; X.beginPath(); X.roundRect(HX - 330, GY - 380, 380, 150, 34); X.fill(); X.beginPath(); X.moveTo(HX - 170, GY - 232); X.lineTo(HX - 150, GY - 190); X.lineTo(HX - 130, GY - 232); X.fill(); X.globalAlpha = 1;
    txt('Hello?', HX - 140, GY - 318, 44, '#2a2a2a', 'center', a); txt("I'm so hungry...", HX - 140, GY - 262, 36, '#c42d2d', 'center', cl((u - 0.35) / 0.1)); }
  // you
  if (rat('r_hook') || rat('r_recap')) person(600, RY1 - 18, 1.15, 'breath', t);
  if (rat('r_plan')) person(FX1 - 80, FLOOR, 1.3, 'stand', t);
  if (rat('r_side') || rat('r_quiet')) person(P.hx - 70, TY + TH / 2 - 4, 0.9, 'dig', t);
  if (rat('r_up')) person(HX, Math.min(TY + TH / 2 - 4, P.sy + 200), 0.9, 'dig', t);
  if (rat('r_pipe')) person(HX - 20, SHT + 190, 0.9, 'stand', t);
  if (rat('r_fan')) person(792, FLOOR - 58, 1.05, 'bike', t);
  if (rat('r_breathe')) person(FX1 - 160, FLOOR, 1.3, 'breath', t);
  if (rat('r_but') || rat('r_kid')) person(HX, TY + TH / 2 - 4, 0.9, 'stand', t);
  if (rat('r_plan')) { const a = cl((u - 0.3) / 0.15); X.globalAlpha = a; X.strokeStyle = '#ff4a4a'; X.lineWidth = 10; X.beginPath(); X.moveTo(FX1 - 30, TY - 40); X.lineTo(FX1 + 30, TY + 40); X.moveTo(FX1 + 30, TY - 40); X.lineTo(FX1 - 30, TY + 40); X.stroke(); X.globalAlpha = 1; label('DIG HERE', FX1, TY - 50, FX1 - 120, FY0 + 60, a, '#ff6a5a'); }
  label('UNDER THE FENCE', FENCE, GY + 20, FENCE + 40, GY + 300, rat('r_side') ? cl((u - 0.5) / 0.2) : 0);
  label("NEIGHBOR'S YARD", 1650, GY - 40, 1780, GY - 380, rat('r_up') ? cl((u - 0.4) / 0.2) : 0);
  label('SECRET VENT', HX, GY - 60, HX + 60, GY - 330, rat('r_pipe') ? cl((u - 0.75) / 0.15) : 0);
  label('YOUR OLD VENT', RX1 - 63, GY - 140, RX1 + 10, GY - 420, rat('r_fool') ? cl((u - 0.2) / 0.15) : 0);
  label('NEW VENT', HX, GY - 60, HX - 20, GY - 330, rat('r_fool') ? cl((u - 0.45) / 0.15) : 0, '#6af0a8');
};
window.p5over = (t, rat, rfrom, u, sh) => {
  // CO2 gauge: high until the fan, then it drops
  if (!rfrom('r_fool') && t > 3.9) { let lv = 0.92; if (rat('r_fan')) lv = lerp(0.92, 0.8, sm((u - 0.4) / 0.6)); if (rat('r_breathe')) lv = lerp(0.8, 0.25, sm(u / 0.6)); const red = lv > 0.6, gx = 540, gy = 1820, gw = 600;
    X.fillStyle = 'rgba(0,0,0,.65)'; X.beginPath(); X.roundRect(gx - gw / 2 - 20, gy - 28, gw + 40, 56, 28); X.fill(); X.fillStyle = red ? '#ff4a4a' : '#6af0a8'; X.beginPath(); X.roundRect(gx - gw / 2, gy - 14, gw * lv, 28, 14); X.fill(); txt(red ? 'CO₂: DANGER' : 'CO₂: SAFE', gx, gy - 44, 42, red ? '#ff6a5a' : '#6af0a8'); }
  if (rat('r_hook') || rat('r_recap') || rat('r_plan')) { const p = 0.5 + 0.5 * Math.sin(t * 7); const vg = X.createRadialGradient(540, 960, 320, 540, 960, 1100); vg.addColorStop(0, 'rgba(160,0,0,0)'); vg.addColorStop(1, `rgba(160,0,0,${0.22 + 0.25 * p})`); X.fillStyle = vg; X.fillRect(0, 0, W, H); }
  if (t < 4.0) { const a = 1 - sm((t - 3.6) / 0.4), p = 1 + 0.05 * Math.sin(t * 6); X.save(); X.globalAlpha = a; X.translate(540, 1520); X.scale(p, p); X.fillStyle = '#d42d2d'; X.beginPath(); X.roundRect(-400, -62, 800, 104, 22); X.fill(); X.restore(); txt('NO AIR. NO WAY OUT.', 540, 1536, 60, '#fff', 'center', a);
    X.save(); X.globalAlpha = a; X.fillStyle = '#ffd23f'; X.beginPath(); X.roundRect(110, 1630, 860, 96, 48); X.fill(); X.restore(); txt('PART 5 · YOU VOTED: SECRET AIR VENT', 540, 1695, 44, '#10141c', 'center', a); }
  if (rat('r_night')) { const a = sm(u / 0.3); X.fillStyle = `rgba(0,0,0,${0.55 * a})`; X.beginPath(); X.roundRect(330, 1500, 420, 120, 26); X.fill(); txt('2:00 AM', 540, 1584, 76, '#cfd8ff', 'center', a); }
  if (rat('r_ask') || rat('end')) { const a = rat('r_ask') ? sm((u - 0.35) / 0.12) : 1; if (a > 0) { X.fillStyle = `rgba(6,8,14,${0.84 * a})`; X.fillRect(0, 0, W, H);
    txt('FINAL PART: YOU DECIDE', 540, 420, 66, '#ffd23f', 'center', a); txt('The kid found your secret vent.', 540, 505, 46, '#ffffff', 'center', a); txt('"I\'m so hungry..."', 540, 570, 44, '#ff6a5a', 'center', a);
    const opts = [['1', 'Send food up the pipe', '#6af0a8'], ['2', 'Stay silent', '#ff6a5a'], ['3', 'Make a deal with the kid', '#5ec3ff']];
    opts.forEach(([n, s2, col], i) => { const b = rat('r_ask') ? back((u - 0.42 - i * 0.08) / 0.18) : 1; if (b <= 0) return; X.save(); X.translate(540, 790 + i * 240); X.scale(b, b); X.globalAlpha = a; X.fillStyle = 'rgba(255,255,255,.08)'; X.beginPath(); X.roundRect(-460, -95, 920, 190, 36); X.fill(); X.strokeStyle = col; X.lineWidth = 6; X.stroke();
      X.fillStyle = col; X.beginPath(); X.arc(-360, 0, 62, 0, 7); X.fill(); txt(n, -360, 26, 76, '#10141c'); txt(s2, -265, 20, 48, '#fff', 'left'); X.restore(); });
    txt('Comment 1, 2 or 3', 540, 1560, 54, '#fff', 'center', a); txt('Top comment decides.', 540, 1640, 48, '#ffd23f', 'center', a); } }
};
