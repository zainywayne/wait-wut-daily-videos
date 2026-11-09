// FINALE (Still Down There): the kid digs down. The man in the bunker is his grandpa.
const DAUGHTER = '#c0563a', SONINLAW = '#6a8f3a', KID = '#e0b030';
const HOLE_X = HX + 46, CH_X0 = HX - 190, CH_X1 = HX + 90, CH_Y0 = TY - 190, CH_Y1 = TY + TH / 2;   // the kid's hole + a dug-out chamber at the shaft bottom
const FEET = CH_Y1 - 4;
function seg(n) { return T.segs.find(q => q.shot === n); }
function holeDepth(sat, u) { if (sat('s_hook')) return lerp(0.55, 0.88, u); if (sat('s_recap')) return 0.9; if (sat('s_dig')) return lerp(0.9, 1, sm(u / 0.3)); return 1; }
function kidPos(sat, sfrom, u) {   // where the kid is (feet)
  if (sat('s_hook') || sat('s_recap')) return [HOLE_X, GY + holeDepth(sat, u) * (SHT - GY), 'dig'];
  if (sat('s_dig')) { if (u < 0.3) return [HOLE_X, lerp(GY + 0.9 * (SHT - GY), SHT, u / 0.3), 'dig']; const f = sm((u - 0.3) / 0.55); return [lerp(HOLE_X, HX + 40, sm((u - 0.3) / 0.1)), lerp(SHT + 60, FEET, f), 'stand']; }
  return [HX + 40, FEET, 'stand'];
}
window.p6pre = (t, sat, sfrom, u) => {
  window.NIGHT_ON = sat('s_hook') || sat('s_recap') || sat('s_dig') || sat('s_breath');
  window.TARP = sat('s_breath');
  window.OLD = sat('s_mirror') ? sm((u - 0.15) / 0.4) : sfrom('s_mirror') ? 1 : 0;
  window.NOCAP = sat('s_mirror') || sat('s_noteread') || sat('s_climb') || sat('s_end') || sat('s_next') || sat('end') || sat('s_photo') && false;
};
window.p6cam = (sat, sfrom, u, sh) => {
  let cx = HX - 10, cy = 1200, cs = 1.6;
  if (sat('s_recap')) { cx = lerp(HX - 10, 900, sm(u / 0.5)); cy = lerp(1200, 1480, sm(u / 0.5)); cs = lerp(1.6, 0.62, sm(u / 0.5)); }
  if (sat('s_dig')) { const [, ky] = kidPos(sat, sfrom, u); cx = HX - 40; cy = Math.max(1250, ky - 150); cs = 1.3; }
  if (sat('s_stay') || sat('s_me') || sat('s_photo') || sat('s_mirror') || sat('s_alert')) { cx = HX - 50; cy = TY - 70; cs = 2.0; }
  if (sat('s_yard')) { cx = 380; cy = lerp(720, 700, u); cs = lerp(0.64, 0.6, u); }
  if (sat('s_bang')) { cx = 520; cy = 760; cs = 1.3; }
  if (sat('s_tunnel')) { cx = 0; cy = 2110; cs = 1.4; }
  if (sat('s_note') || sat('s_noteread')) { cx = 700; cy = 1300; cs = 1.0; }
  if (sat('s_breath')) { cx = RX1 - 63; cy = 800; cs = 1.6; }
  if (sat('s_light')) { cx = HX - 20; cy = 1560; cs = 0.82; }
  if (sat('s_climb')) { const y = climbY(u); cx = HX - 20; cy = Math.min(1700, Math.max(860, y - 220)); cs = 1.15; }
  if (sat('s_pancake') || sat('s_end') || sat('s_next') || sat('end')) { cx = 300; cy = 760; cs = 1.35; }
  if (window._lastShot !== sh.name) { if (['s_stay', 's_yard', 's_bang', 's_tunnel', 's_breath', 's_alert', 's_light', 's_pancake'].includes(sh.name)) window._c = null; window._lastShot = sh.name; }
  return { cx, cy, cs };
};
function climbY(u) { return lerp(FEET, GY - 6, sm(u / 0.75)); }
window.p6bg = (t) => {   // the daughter's house (off to the left all series)
  X.fillStyle = '#2b2a4a'; X.fillRect(-1200, GY - 2600, 4000, 1402);
  X.fillStyle = '#e3d3b6'; X.fillRect(-470, GY - 520, 430, 520); X.fillStyle = '#7a4636'; X.beginPath(); X.moveTo(-500, GY - 520); X.lineTo(-255, GY - 700); X.lineTo(-10, GY - 520); X.fill();
  const S = window.S6, lit = S && (S.sat('s_hook') || S.sat('s_recap') || S.sat('s_dig') || S.sat('s_breath'));
  X.fillStyle = lit ? '#ffd97a' : '#8fc3e6'; for (const [x, y] of [[-420, GY - 440], [-180, GY - 440], [-420, GY - 250]]) X.fillRect(x, y, 110, 100);
  X.fillStyle = '#6a4a30'; X.fillRect(-220, GY - 200, 90, 200);
  // kid's drawing taped in the upstairs window
  X.fillStyle = '#fff'; X.fillRect(-170, GY - 430, 60, 70); X.strokeStyle = '#d42d2d'; X.lineWidth = 3; X.beginPath(); X.arc(-140, GY - 405, 9, 0, 7); X.moveTo(-140, GY - 396); X.lineTo(-140, GY - 375); X.stroke();
};
window.p6world = (t, sat, sfrom, u, sh) => {
  // moon + dawn during the dig
  if (sat('s_hook') || sat('s_recap') || sat('s_dig')) { const p = sat('s_hook') ? 0.05 * u : sat('s_recap') ? 0.05 + 0.1 * u : 0.15 + 0.85 * u; const mx = lerp(800, 2100, p), my = GY - 260 - Math.sin(p * Math.PI) * 300;
    X.save(); X.shadowColor = '#fff7d0'; X.shadowBlur = 40; X.fillStyle = '#fff7d0'; X.beginPath(); X.arc(mx, my, 40, 0, 7); X.fill(); X.restore();
    if (sat('s_dig')) { const d = sm((u - 0.5) / 0.4); X.fillStyle = `rgba(255,170,110,${0.45 * d})`; X.fillRect(-600, GY - 1300, 2800, 1300); } }
  if (sat('s_breath')) { X.fillStyle = 'rgba(10,15,45,.25)'; X.fillRect(-600, GY - 1300, 2800, 1300); }
  // the kid's hole beside the pipe
  const dp = holeDepth(sat, u), hb = GY + dp * (SHT - GY);
  X.fillStyle = '#140d07'; X.beginPath(); X.roundRect(HOLE_X - 30, GY - 6, 60, hb - GY + 8, 14); X.fill(); X.fillStyle = '#6b4a2e'; X.beginPath(); X.ellipse(HOLE_X + 70, GY - 6, 50, 16, 0, Math.PI, 0); X.fill();
  if (dp >= 1) { X.fillStyle = '#140d07'; X.fillRect(HOLE_X - 30, SHT - 10, 60, 30); }
  // the dug-out chamber at the bottom of the shaft (room for the two of you)
  X.fillStyle = '#140d07'; X.beginPath(); X.roundRect(CH_X0, CH_Y0, CH_X1 - CH_X0, CH_Y1 - CH_Y0, 40); X.fill(); X.fillStyle = '#5a4430'; X.fillRect(CH_X0 + 10, CH_Y1 - 14, CH_X1 - CH_X0 - 20, 14);
  X.fillStyle = '#7a5a38'; X.fillRect(CH_X0 + 30, CH_Y0 + 20, 10, CH_Y1 - CH_Y0 - 20); X.fillRect(CH_X0 + 20, CH_Y0 + 20, 120, 10);
  const lamp = X.createRadialGradient(HX - 40, TY - 60, 10, HX - 40, TY - 60, 240); lamp.addColorStop(0, 'rgba(255,200,120,.28)'); lamp.addColorStop(1, 'rgba(255,200,120,0)'); X.fillStyle = lamp; X.fillRect(CH_X0 - 60, CH_Y0 - 60, CH_X1 - CH_X0 + 120, CH_Y1 - CH_Y0 + 80);
  // shovel tip + dirt trickling into the shaft
  if (sat('s_hook') || sat('s_recap') || (sat('s_dig') && u < 0.3)) {
    if (dp > 0.8) { const pk = Math.max(0, Math.sin(t * 7)) * 14; X.fillStyle = '#e8392f'; X.beginPath(); X.moveTo(HOLE_X - 14, hb - 4 + pk); X.lineTo(HOLE_X + 14, hb - 4 + pk); X.lineTo(HOLE_X, hb + 22 + pk); X.fill(); }
    for (let q = 0; q < 9; q++) { const ph = (t * 1.3 + q / 9) % 1; X.fillStyle = '#7a5434'; X.beginPath(); X.arc(HOLE_X - 18 + (q % 3) * 14, lerp(hb, hb + 420, ph), 4 + (q % 2) * 2, 0, 7); X.fill(); } }
  if (sat('s_dig')) { const e = t - (seg('s_stay').start - 1.2); if (e > 0 && e < 0.8) for (let q = 0; q < 14; q++) { const an = q * 2.3; X.fillStyle = `rgba(122,84,52,${1 - e / 0.8})`; X.beginPath(); X.arc(HX + 40 + Math.cos(an) * 120 * e, FEET - 10 - Math.abs(Math.sin(an)) * 80 * e + 200 * e * e, 6, 0, 7); X.fill(); } }
  // the kid
  if (!sfrom('s_yard') || sat('s_alert') || sat('s_light')) { const [kx, ky, kp] = kidPos(sat, sfrom, u); person(kx, ky, 0.62, kp, t, 1, KID);
    X.fillStyle = 'rgba(255,240,200,.9)'; if (sfrom('s_stay')) { X.beginPath(); X.arc(kx - 20, ky - 40, 5, 0, 7); X.fill(); } }
  // you
  if (sat('s_hook') || sat('s_recap')) person(HX - 18, 1460, 0.9, 'breath', t);
  if (sat('s_dig')) person(HX - 70, u < 0.2 ? lerp(1460, FEET, sm(u / 0.2)) : FEET, 0.9, 'breath', t);
  if (sat('s_stay') || sat('s_me')) person(HX - 80, FEET, 0.95, 'hands', t);
  if (sat('s_photo') || sat('s_mirror') || sat('s_alert')) person(HX - 80, FEET, 0.95, 'stand', t + Math.sin(t * 20) * 0.02);
  if (sat('s_light')) { person(HX - 50, FEET, 0.95, 'stand', t); X.strokeStyle = '#f1c7a4'; X.lineWidth = 6; X.beginPath(); X.moveTo(HX - 20, FEET - 40); X.lineTo(HX + 18, FEET - 40); X.stroke();
    const a = sm(u / 0.3); const cg = X.createLinearGradient(0, GY, 0, FEET); cg.addColorStop(0, `rgba(255,250,215,${0.55 * a})`); cg.addColorStop(1, `rgba(255,250,215,${0.12 * a})`); X.fillStyle = cg; X.beginPath(); X.moveTo(HOLE_X - 10, GY); X.lineTo(HOLE_X + 10, GY); X.lineTo(HX + 110, FEET); X.lineTo(HX - 150, FEET); X.fill();
    person(HOLE_X + 40, GY - 6, 1.15, 'breath', t, 1, DAUGHTER); X.fillStyle = '#ddd'; X.fillRect(HOLE_X + 2, GY - 64, 22, 10); }
  // climbing out together, family waiting with a blanket
  if (sat('s_climb')) { const y = climbY(u), x = y > SHT + 20 ? HX - 10 : HOLE_X; person(x, y, 0.95, 'stand', t); person(x + 26, Math.min(y + 70, FEET), 0.62, 'stand', t, 1, KID);
    person(HOLE_X - 150, GY - 6, 1.2, 'stand', t, 1, DAUGHTER); mirror(HOLE_X + 190, GY - 6, 1.25, 'stand', t, 1, SONINLAW);
    const bl = sm((u - 0.78) / 0.15); if (bl > 0) { X.globalAlpha = bl; X.fillStyle = '#c9a15a'; X.beginPath(); X.roundRect(HOLE_X - 40, GY - 112, 80, 96, 22); X.fill(); X.strokeStyle = '#a07d3e'; X.lineWidth = 3; for (let q = 0; q < 3; q++) { X.beginPath(); X.moveTo(HOLE_X - 30, GY - 90 + q * 25); X.lineTo(HOLE_X + 30, GY - 90 + q * 25); X.stroke(); } X.globalAlpha = 1; } }
  // the swing: kid on it, you pushing
  if (sfrom('s_pancake')) { const sw = Math.sin(t * 1.6) * 0.18, sx = 260 + Math.sin(sw) * 140, sy = GY - 200 + Math.cos(sw) * 140; person(sx, sy - 2, 0.62, 'stand', t, 1, KID); mirror(150 - Math.max(0, -Math.sin(t * 1.6)) * 12, GY - 6, 1.0, 'breath', t);
    person(500, GY - 6, 1.2, 'stand', t, 1, DAUGHTER); person(570, GY - 6, 1.25, 'stand', t, 1, SONINLAW); }
  // FLASHBACK: the banging was "come inside"
  if (sat('s_bang')) { person(430, GY - 6, 1.25, 'stand', t, 1, DAUGHTER); person(505, GY - 4, 0.72, 'stand', t, 1, KID); person(580, GY - 6, 1.2, 'stand', t, 1, SONINLAW);
    const m = sm((u - 0.4) / 0.15), bw = lerp(300, 520, m); X.fillStyle = 'rgba(255,255,255,.96)'; X.beginPath(); const bx = 520 - bw / 2; X.roundRect(bx, GY - 330, bw, 90, 30); X.fill(); X.beginPath(); X.moveTo(450, GY - 244); X.lineTo(440, GY - 205); X.lineTo(480, GY - 244); X.fill();
    txt('OPEN UP!', 520, GY - 268, 46, '#c42d2d', 'center', 1 - m); txt('COME INSIDE, DAD!', 520, GY - 268, 44, '#2a6a3a', 'center', m); }
  // FLASHBACK: the tunnel stopped at your wall
  if (sat('s_tunnel')) { const ex = 20; person(ex - 20, 2205, 0.95, 'breath', t, 1, DAUGHTER); person(ex - 95, 2205, 0.95, 'stand', t, 1, SONINLAW); person(ex - 160, 2205, 0.6, 'stand', t, 1, KID);
    X.strokeStyle = '#f1c7a4'; X.lineWidth = 8; X.beginPath(); X.moveTo(ex - 10, 2150); X.lineTo(ex + 50, 2140); X.stroke(); }
  // FLASHBACK: the storm night, listening at the vent
  if (sat('s_breath')) { const vx = RX1 - 63; person(vx - 110, GY - 6, 1.2, 'breath', t, 1, DAUGHTER); person(vx - 40, GY - 4, 0.7, 'stand', t, 1, KID); mirror(vx + 110, GY - 6, 1.2, 'stand', t, 1, SONINLAW);
    X.fillStyle = 'rgba(150,110,70,.92)'; X.beginPath(); X.roundRect(vx - 170, GY - 190, 340, 90, 40); X.fill(); X.strokeStyle = 'rgba(100,70,40,.9)'; X.lineWidth = 3; for (let q = 0; q < 4; q++) { X.beginPath(); X.moveTo(vx - 150 + q * 90, GY - 185); X.lineTo(vx - 140 + q * 90, GY - 105); X.stroke(); } }
};
// ---------------- screen-space overlays ----------------
function sepia(a) { if (a <= 0) return; X.save(); X.globalAlpha = a; X.globalCompositeOperation = 'saturation'; X.fillStyle = '#888'; X.fillRect(0, 0, W, H); X.globalCompositeOperation = 'multiply'; X.fillStyle = '#e8c890'; X.fillRect(0, 0, W, H); X.restore();
  X.save(); X.globalAlpha = 0.18 * a; X.strokeStyle = '#fff'; X.lineWidth = 2; for (let q = 0; q < 3; q++) { const x = (Math.sin(performance.now ? q * 91 + Math.floor(Date.now() / 1e9) : q) * 0.5 + 0.5) * W; } X.restore();
  const vg = X.createRadialGradient(540, 960, 400, 540, 960, 1150); vg.addColorStop(0, 'rgba(40,20,0,0)'); vg.addColorStop(1, `rgba(40,20,0,${0.6 * a})`); X.fillStyle = vg; X.fillRect(0, 0, W, H); }
function grain(t, a) { X.save(); X.globalAlpha = a; X.fillStyle = 'rgba(255,240,210,.5)'; for (let q = 0; q < 3; q++) { const x = ((Math.sin(t * 13 + q * 7) * 0.5 + 0.5) * W) | 0; X.fillRect(x, 0, 2, H); } X.restore(); }
function torn(x0, y0, w, h, topTear, botTear, seed) { X.beginPath(); X.moveTo(x0, y0); const n = 18;
  for (let i = 0; i <= n; i++) { const x = x0 + w * i / n, y = y0 + (topTear ? Math.sin(i * 2.3 + seed) * 9 + ((i * 7 + seed) % 3) * 4 : 0); X.lineTo(x, y); }
  for (let i = n; i >= 0; i--) { const x = x0 + w * i / n, y = y0 + h + (botTear ? Math.sin(i * 1.9 + seed * 2) * 9 + ((i * 5 + seed) % 3) * 4 : 0); X.lineTo(x, y); } X.closePath(); }
const NOTE = [['Dad,', '#22305a', 0], ['A big storm is coming tonight.', '#22305a', 0], ['Rain will flood your vent,', '#22305a', 0], ['so we have to cover it. Please', '#22305a', 0], ['OPEN THE HATCH,', '#9b1c1c', 1], ['OR NO AIR', '#2a2a2a', 1], ['till it passes.', '#22305a', 0], ["We're right here.  ❤  M", '#22305a', 0]];
function drawNote(t, sat, u) { const px = 110, pw = 860, ly0 = 560, lh = 96; const scrapY0 = ly0 + 3.55 * lh, scrapY1 = ly0 + 5.45 * lh;
  const join = sat('s_noteread') ? sm(u / 0.12) : 0, offT = (1 - join) * -700, offB = (1 - join) * 900;
  X.save(); X.translate(540, 960); X.rotate(-0.025); X.translate(-540, -960); X.shadowColor = 'rgba(0,0,0,.55)'; X.shadowBlur = 40;
  const paper = '#f4ecd2';
  if (join > 0) { X.save(); X.translate(0, offT); X.fillStyle = paper; torn(px, 430, pw, scrapY0 - 430, false, true, 1); X.fill(); X.restore(); X.save(); X.translate(0, offB); X.fillStyle = paper; torn(px, scrapY1, pw, 1540 - scrapY1, true, false, 2); X.fill(); X.restore(); }
  X.fillStyle = paper; torn(px, scrapY0, pw, scrapY1 - scrapY0, true, true, 3); X.fill(); X.shadowBlur = 0;
  X.strokeStyle = 'rgba(120,150,200,.3)'; X.lineWidth = 3;
  NOTE.forEach(([s, col, onScrap], i) => { const y = ly0 + i * lh; const off = onScrap ? 0 : (i < 4 ? offT : offB); const a = onScrap ? 1 : join; if (a <= 0) return;
    X.beginPath(); X.moveTo(px + 50, y + off + 22); X.lineTo(px + pw - 50, y + off + 22); X.stroke(); X.save(); X.globalAlpha = a; X.translate(540, y + off); X.rotate(((i * 37) % 7 - 3) * 0.004); X.font = `${onScrap ? 74 : 54}px P`; X.textAlign = 'center'; X.fillStyle = col; X.fillText(s, 0, 0); X.restore(); });
  X.restore(); }
function alertCard(a) { if (a <= 0) return; X.save(); X.globalAlpha = a; X.fillStyle = 'rgba(30,8,8,.85)'; X.beginPath(); X.roundRect(160, 780, 760, 420, 40); X.fill(); X.strokeStyle = '#ff3b3b'; X.lineWidth = 8; X.stroke(); X.restore();
  txt('⚠ EMERGENCY ALERT', 540, 880, 56, '#ff5a4a', 'center', a); txt('Incoming threat.', 540, 980, 50, '#fff', 'center', a); txt('Take shelter', 540, 1060, 50, '#fff', 'center', a); txt('IMMEDIATELY.', 540, 1140, 56, '#ffd23f', 'center', a); }
window.p6over = (t, sat, sfrom, u, sh) => {
  if (sat('s_bang') || sat('s_tunnel') || sat('s_breath')) { sepia(sat('s_bang') ? sm(u / 0.1) : 1); grain(t, 0.25); }
  if (sat('s_breath')) { X.strokeStyle = 'rgba(200,220,255,.45)'; X.lineWidth = 3; for (let q = 0; q < 90; q++) { const x = (q * 97 + t * 900) % (W + 200) - 100, y = (q * 211 + t * 2400) % (H + 200) - 100; X.beginPath(); X.moveTo(x, y); X.lineTo(x - 14, y + 50); X.stroke(); } }
  // text hook (frame 0) — kept in the lower half so the top stays clear for a comment sticker
  if (t < 3.6) { const a = 1 - sm((t - 3.2) / 0.4), p = 1 + 0.05 * Math.sin(t * 6); X.save(); X.globalAlpha = a; X.translate(540, 1520); X.scale(p, p); X.fillStyle = '#d42d2d'; X.beginPath(); X.roundRect(-380, -62, 760, 104, 22); X.fill(); X.restore(); txt("HE'S ALMOST THROUGH", 540, 1536, 60, '#fff', 'center', a);
    X.save(); X.globalAlpha = a; X.fillStyle = '#ffd23f'; X.beginPath(); X.roundRect(120, 1640, 840, 96, 48); X.fill(); X.restore(); txt('FINAL PART · YOU VOTED: STAY SILENT', 540, 1705, 44, '#10141c', 'center', a); }
  if (sat('s_dig') && u > 0.55) { const a = sm((u - 0.55) / 0.08); X.fillStyle = `rgba(0,0,0,${0.55 * a})`; X.beginPath(); X.roundRect(330, 1560, 420, 120, 26); X.fill(); txt('6:12 AM', 540, 1645, 76, '#ffd9a8', 'center', a); }
  // the photo
  if (sat('s_photo')) { const a = sm(u / 0.15); X.fillStyle = `rgba(0,0,0,${0.7 * a})`; X.fillRect(0, 0, W, H);
    X.save(); X.globalAlpha = a; X.translate(540, 1010); X.rotate(-0.05 + (1 - a) * 0.2); X.scale(0.85 + 0.15 * a, 0.85 + 0.15 * a); X.shadowColor = 'rgba(0,0,0,.6)'; X.shadowBlur = 40; X.fillStyle = '#fbfaf5'; X.fillRect(-370, -420, 740, 840); X.shadowBlur = 0;
    X.save(); X.beginPath(); X.rect(-330, -380, 660, 640); X.clip(); const sk = X.createLinearGradient(0, -380, 0, 260); sk.addColorStop(0, '#8cc8f0'); sk.addColorStop(1, '#e8f4ff'); X.fillStyle = sk; X.fillRect(-330, -380, 660, 640);
      X.fillStyle = '#ffe58a'; X.beginPath(); X.arc(220, -270, 50, 0, 7); X.fill(); X.fillStyle = '#5fb24b'; X.fillRect(-330, 120, 660, 140);
      X.save(); X.translate(60, 120); X.scale(1.45, 1.45); X.strokeStyle = '#c0563a'; X.lineWidth = 9; X.lineCap = 'round'; X.beginPath(); X.moveTo(-140, 0); X.lineTo(-100, -190); X.lineTo(-60, 0); X.moveTo(60, 0); X.lineTo(100, -190); X.lineTo(140, 0); X.moveTo(-104, -190); X.lineTo(104, -190); X.stroke();
        const sw = 0.35; X.save(); X.translate(0, -190); X.rotate(-sw); X.strokeStyle = '#555'; X.lineWidth = 3; X.beginPath(); X.moveTo(-22, 0); X.lineTo(-22, 130); X.moveTo(22, 0); X.lineTo(22, 130); X.stroke(); X.fillStyle = '#e0b030'; X.fillRect(-30, 126, 60, 10); person(0, 126, 0.6, 'stand', 0, 1, KID); X.restore(); X.restore();
      window.OLD = 1; person(-215, 262, 1.75, 'breath', 0); window.OLD = 0; X.restore();
    X.fillStyle = '#555'; X.font = '40px P'; X.textAlign = 'center'; X.fillText('me + grandpa', 0, 350); X.restore(); }
  // the reflection
  if (sat('s_mirror')) { const a = sm(u / 0.12); X.save(); X.globalAlpha = a; const mg = X.createLinearGradient(0, 0, W, 0); mg.addColorStop(0, '#6f7a84'); mg.addColorStop(0.5, '#cfd6dc'); mg.addColorStop(1, '#7d8891'); X.fillStyle = mg; X.fillRect(0, 0, W, H);
    X.strokeStyle = 'rgba(255,255,255,.12)'; X.lineWidth = 2; for (let x = 0; x < W; x += 9) { X.beginPath(); X.moveTo(x, 0); X.lineTo(x + 30, H); X.stroke(); } X.fillStyle = '#3c434a'; for (const [x, y] of [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60]]) { X.beginPath(); X.arc(x, y, 14, 0, 7); X.fill(); }
    const o = window.OLD, j = Math.sin(t * 23) * 2 * o; X.translate(540 + j, 980); X.globalAlpha = a * 0.85;
    X.fillStyle = '#e9bf9c'; X.beginPath(); X.ellipse(0, 0, 250, 300, 0, 0, 7); X.fill(); X.beginPath(); X.ellipse(-250, 20, 40, 70, 0, 0, 7); X.ellipse(250, 20, 40, 70, 0, 0, 7); X.fill();
    if (o > 0) { X.globalAlpha = a * 0.85 * o; X.fillStyle = '#d9d6d0'; X.beginPath(); X.ellipse(-255, -40, 34, 70, 0.1, 0, 7); X.ellipse(255, -40, 34, 70, -0.1, 0, 7); X.fill(); X.fillStyle = 'rgba(170,165,158,.85)'; X.beginPath(); X.ellipse(0, 150, 215, 150, 0, 0, Math.PI); X.fill();
      X.strokeStyle = 'rgba(150,95,70,.55)'; X.lineWidth = 6; X.lineCap = 'round'; for (const y of [-210, -175, -140]) { X.beginPath(); X.moveTo(-120, y); X.quadraticCurveTo(0, y - 18, 120, y); X.stroke(); }
      for (const s of [-1, 1]) { X.beginPath(); X.moveTo(s * 70, 30); X.quadraticCurveTo(s * 105, 50, s * 135, 30); X.stroke(); X.beginPath(); X.moveTo(s * 175, -40); X.lineTo(s * 205, -20); X.moveTo(s * 175, -20); X.lineTo(s * 205, 0); X.stroke(); X.beginPath(); X.moveTo(s * 90, 110); X.quadraticCurveTo(s * 120, 160, s * 100, 200); X.stroke(); }
      X.fillStyle = 'rgba(160,110,80,.35)'; for (const [x, y, r] of [[-150, -120, 12], [130, -150, 9], [160, 90, 10]]) { X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); } }
    X.globalAlpha = a * 0.9; X.fillStyle = '#2b2f3a'; X.beginPath(); X.arc(-90, -10, 16, 0, 7); X.arc(90, -10, 16, 0, 7); X.fill(); X.strokeStyle = '#2b2f3a'; X.lineWidth = 7; X.beginPath(); X.moveTo(-70, 140); X.quadraticCurveTo(0, 120 + 10 * o, 70, 140); X.stroke();
    if (o > 0.8) { X.fillStyle = `rgba(190,225,255,${0.8 * (o - 0.8) / 0.2})`; X.beginPath(); X.ellipse(-92, 30 + (t * 30) % 80, 6, 10, 0, 0, 7); X.fill(); }
    X.restore(); const sh2 = X.createLinearGradient(0, 0, W, H); sh2.addColorStop(0, 'rgba(255,255,255,.12)'); sh2.addColorStop(0.5, 'rgba(255,255,255,0)'); X.fillStyle = sh2; X.fillRect(0, 0, W, H); }
  // MILLER ring
  if (sat('s_yard')) { const a = sm((u - 0.25) / 0.15); if (a > 0) { const c = window._c, sx = 540 + (1106 - c.x) * c.s, sy = 960 + (GY - 150 - c.y) * c.s; X.strokeStyle = `rgba(255,210,63,${a})`; X.lineWidth = 6; X.beginPath(); X.arc(sx, sy, 70 * c.s + 18, 0, 7); X.stroke(); label2(sx, sy, a); }
    const b = sm((u - 0.05) / 0.15); if (b > 0) { const c = window._c, hx = 540 + (-255 - c.x) * c.s, hy = 960 + (GY - 720 - c.y) * c.s; txt("YOUR DAUGHTER'S HOUSE", Math.max(330, hx + 60), hy, 40, '#ffd23f', 'center', b); } }
  // the note
  if (sat('s_note') || sat('s_noteread')) { const a = sat('s_note') ? sm(u / 0.2) : 1; X.fillStyle = `rgba(0,0,0,${0.72 * a})`; X.fillRect(0, 0, W, H); X.save(); X.globalAlpha = a; drawNote(t, sat, u); X.restore(); }
  // the alert that never stopped
  if (sat('s_alert')) { const fl = (Math.sin(t * 17) > 0.2 ? 1 : 0.4) * (1 - sm((u - 0.55) / 0.3)) * sm(u / 0.1); alertCard(0.42 * fl); }
  // warm morning glow
  if (sat('s_climb') || sfrom('s_pancake')) { const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,200,130,.22)'); g.addColorStop(1, 'rgba(255,200,130,0)'); X.fillStyle = g; X.fillRect(0, 0, W, H); }
  // THE END
  if (sat('s_end')) { const a = sm(u / 0.25); X.fillStyle = `rgba(6,8,14,${0.9 * a})`; X.fillRect(0, 0, W, H);
    txt('STILL DOWN THERE', 540, 640, 58, '#9aa6b8', 'center', a); txt('THE END', 540, 800, 120, '#ffffff', 'center', a); X.fillStyle = `rgba(255,255,255,${0.3 * a})`; X.fillRect(390, 870, 300, 3);
    const b = sm((u - 0.25) / 0.2); txt('Rewatch Part 1.', 540, 1000, 54, '#ffd23f', 'center', b); txt('The clues were there.', 540, 1070, 54, '#ffd23f', 'center', b);
    const c2 = sm((u - 0.5) / 0.2); txt('Call your grandparents  💛', 540, 1260, 50, '#ffffff', 'center', c2); }
  // THANK YOU + next series vote + full series on YouTube
  if (sat('s_next') || sat('end')) { X.fillStyle = 'rgba(6,8,14,.92)'; X.fillRect(0, 0, W, H); const a = sat('s_next') ? sm(u / 0.1) : 1;
    txt('THANK YOU FOR WATCHING', 540, 330, 62, '#ffffff', 'center', a); txt('Which series should we make next?', 540, 410, 44, '#ffd23f', 'center', a);
    const opts = [['1', 'Blizzard Cabin', 'Footprints around the cabin. Every night.', '#8fd3ff'], ['2', 'Desert Island', "Someone keeps erasing your SOS.", '#ffd23f'], ['3', 'Rising Flood', 'Your raft only holds one.', '#5ec3ff']];
    opts.forEach(([n, ti, sub, col], i) => { const b = sat('s_next') ? back((u - 0.12 - i * 0.07) / 0.15) : 1; if (b <= 0) return; X.save(); X.translate(540, 600 + i * 230); X.scale(b, b); X.fillStyle = 'rgba(255,255,255,.07)'; X.beginPath(); X.roundRect(-460, -95, 920, 190, 36); X.fill(); X.strokeStyle = col; X.lineWidth = 5; X.stroke();
      X.fillStyle = col; X.beginPath(); X.arc(-365, 0, 60, 0, 7); X.fill(); txt(n, -365, 26, 74, '#10141c'); txt(ti, -275, -8, 54, '#fff', 'left'); txt(sub, -275, 50, 32, '#b8c0cc', 'left'); X.restore(); });
    const c = sat('s_next') ? sm((u - 0.4) / 0.12) : 1; txt('Comment 1, 2 or 3', 540, 1360, 56, '#ffffff', 'center', c);
    const d = sat('s_next') ? sm((u - 0.6) / 0.12) : 1; if (d > 0) { const p = sat('end') ? 1 + 0.03 * Math.sin(t * 5) : 1; X.save(); X.globalAlpha = d; X.translate(540, 1570); X.scale(p, p); X.fillStyle = '#e02424'; X.beginPath(); X.roundRect(-410, -70, 820, 140, 70); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.moveTo(-330, -32); X.lineTo(-330, 32); X.lineTo(-275, 0); X.fill(); X.restore();
      txt('FULL SERIES ON MY YOUTUBE', 590, 1586, 42, '#ffffff', 'center', d); txt('wait wut daily', 540, 1700, 38, '#b8c0cc', 'center', d); } }
};
function label2(x, y, a) { txt('MILLER', x, y - 110, 44, '#ffd23f', 'center', a); }
