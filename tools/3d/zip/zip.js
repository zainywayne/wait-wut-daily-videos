// "You invented the zipper" — tent story + macro zipper cutaway. Loaded after base.js.
thief.visible = false;
const TW = 2.2, TH = 1.6, TL = 2.6, ZF = TL / 2; // tent width, height, length; front z
const TENT = new THREE.Group(); scene.add(TENT);
const nylon = new THREE.MeshStandardMaterial({ color: 0xe8742c, roughness: 0.8, side: THREE.DoubleSide });
const nylonD = new THREE.MeshStandardMaterial({ color: 0xc95a1c, roughness: 0.8, side: THREE.DoubleSide });
const slope = Math.hypot(TW / 2, TH), ang = Math.atan2(TH, TW / 2);
for (const sx of [-1, 1]) { const p = mesh(new THREE.BoxGeometry(slope, 0.03, TL), nylon, sx * TW / 4, TH / 2, 0, TENT); p.rotation.z = -sx * ang; }
// back wall
{ const s = new THREE.Shape(); s.moveTo(-TW / 2, 0); s.lineTo(TW / 2, 0); s.lineTo(0, TH); s.closePath(); mesh(new THREE.ShapeGeometry(s), nylonD, 0, 0, -ZF, TENT); }
// dark interior floor
mesh(new THREE.BoxGeometry(TW, 0.02, TL), new THREE.MeshStandardMaterial({ color: 0x3a2a20 }), 0, 0.01, 0, TENT);
// ridge pole + stakes
mesh(new THREE.CylinderGeometry(0.03, 0.03, TL + 0.3, 8), SM(0x555a60, { metalness: 0.7 }), 0, TH + 0.01, 0, TENT).rotation.x = Math.PI / 2;
for (const z of [-ZF - 0.15]) mesh(new THREE.CylinderGeometry(0.03, 0.03, TH + 0.05, 8), SM(0x555a60, { metalness: 0.7 }), 0, TH / 2, z, TENT);
// front flaps: two right triangles hinged on the sloped edges
const flaps = [];
for (const sx of [-1, 1]) {
  const hA = new THREE.Group(); hA.position.set(0, TH, ZF + 0.005); hA.rotation.z = sx * Math.atan2(TW / 2, TH); TENT.add(hA); hA.updateMatrix();
  const hB = new THREE.Group(); hA.add(hB);
  const s = new THREE.Shape(); s.moveTo(sx * 0.03, TH - 0.06); s.lineTo(sx * TW / 2, 0); s.lineTo(sx * 0.015, 0); s.closePath();
  const g = new THREE.ShapeGeometry(s); g.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, ZF + 0.005)); g.applyMatrix4(hA.matrix.clone().invert());
  const m = mesh(g, nylonD, 0, 0, 0, hB); m.userData.sx = sx; flaps.push({ hB, sx, m });
}
const setFlaps = (a) => flaps.forEach(f => { f.hB.rotation.y = -f.sx * a; });
// knots, buttons, zipper line along the seam (x=0, y 0..TH)
const seamY = k => 0.12 + k * (TH - 0.35) / 9;
const knots = []; for (let k = 0; k < 10; k++) { const n = mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16), SM(0xd8c69a), 0, seamY(k), ZF + 0.03, TENT); n.scale.set(1.3, 0.8, 1); knots.push(n); }
const buttons = []; for (let k = 0; k < 4; k++) { const b = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), SM(0xf2e6c8, { roughness: 0.4 }), 0, 0.25 + k * 0.32, ZF + 0.03, TENT); b.rotation.x = Math.PI / 2; buttons.push(b); }
const zipLine = mesh(new THREE.BoxGeometry(0.05, TH - 0.12, 0.02), SM(0x2a2a30, { metalness: 0.6, roughness: 0.4 }), 0, (TH - 0.12) / 2, ZF + 0.02, TENT);
const zipPull = mesh(new THREE.RoundedBoxGeometry(0.09, 0.16, 0.05, 2, 0.02), SM(0xc0c4cc, { metalness: 0.9, roughness: 0.25 }), 0, 1.2, ZF + 0.05, TENT);
// rock for the rock fix
const rockZ = mesh(new THREE.DodecahedronGeometry(0.22, 1), new THREE.MeshStandardMaterial({ color: 0x8d8a86, roughness: 0.9, flatShading: true }), 0, 0.2, ZF + 0.2, TENT);
// campfire
const FIRE = new THREE.Group(); FIRE.position.set(2.6, 0, 2.2); scene.add(FIRE);
for (let k = 0; k < 4; k++) { const l = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 10), SM(0x6b4426), 0, 0.12, 0, FIRE); l.rotation.set(Math.PI / 2 - 0.35, k * Math.PI / 2, 0, 'YXZ'); }
for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; mesh(new THREE.DodecahedronGeometry(0.1, 0), SM(0x7d7a76), Math.cos(a) * 0.42, 0.05, Math.sin(a) * 0.42, FIRE); }
const flames = [0xffd040, 0xff8a20, 0xff5a10].map((c, k) => { const f = mesh(new THREE.ConeGeometry(0.16 - k * 0.03, 0.5 - k * 0.08, 10), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }), 0, 0.35, 0, FIRE); f.castShadow = false; return f; });
const fireLight = new THREE.PointLight(0xff8a30, 2, 5); fireLight.position.set(0, 0.6, 0); FIRE.add(fireLight);
// bugs
const bugs = []; for (let k = 0; k < 14; k++) { const b = new THREE.Group(); scene.add(b); mesh(new THREE.SphereGeometry(0.035, 10, 8), SM(0x151515, { roughness: 0.3 }), 0, 0, 0, b).scale.set(1, 0.8, 1.4);
  const wm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide }); const w1 = mesh(new THREE.PlaneGeometry(0.06, 0.035), wm, 0.04, 0.02, 0, b), w2 = mesh(new THREE.PlaneGeometry(0.06, 0.035), wm, -0.04, 0.02, 0, b); b.userData = { w1, w2, ph: k * 1.7, r: 0.5 + (k % 5) * 0.2 }; bugs.push(b); }
// ---------- zipper macro cutaway (far away) ----------
const ZIP = new THREE.Group(); ZIP.position.set(0, 0, 200); scene.add(ZIP);
const zl = new THREE.DirectionalLight(0xffffff, 2.4); zl.position.set(3, 6, 208); zl.target = ZIP; scene.add(zl);
const NT = 26, SP = 0.28, teeth = [];
const toothM = SM(0xc9ccd4, { metalness: 0.85, roughness: 0.28 }), tapeM = new THREE.MeshStandardMaterial({ color: 0xa8481a, roughness: 0.9 }), bumpM = SM(0xffd23f, { metalness: 0.6, roughness: 0.3 }), holeM = new THREE.MeshBasicMaterial({ color: 0x111111 });
for (let k = 0; k < NT; k++) for (const sx of [-1, 1]) {
  const g = new THREE.Group(); ZIP.add(g); const y = k * SP * 2 + (sx > 0 ? SP : 0);
  mesh(new THREE.RoundedBoxGeometry(0.62, 0.2, 0.16, 2, 0.04), toothM, sx * 0.31, 0, 0, g);
  mesh(new THREE.BoxGeometry(0.6, SP * 2 + 0.02, 0.05), tapeM, sx * 0.9, 0, -0.06, g);
  const bump = mesh(new THREE.SphereGeometry(0.075, 14, 10), bumpM, sx * 0.12, 0.1, 0, g); bump.scale.set(1, 0.6, 1);
  const hole = mesh(new THREE.CircleGeometry(0.06, 14), holeM, sx * 0.12, -0.04, 0.085, g); hole.castShadow = false;
  teeth.push({ g, sx, y });
}
const slider = new THREE.Group(); ZIP.add(slider);
mesh(new THREE.RoundedBoxGeometry(1.0, 0.7, 0.36, 3, 0.08), SM(0x9aa0aa, { metalness: 0.9, roughness: 0.25 }), 0, 0, 0.05, slider);
const wedge = mesh(new THREE.ConeGeometry(0.16, 0.4, 3), SM(0x5a5f68, { metalness: 0.9 }), 0, 0.42, 0.25, slider); wedge.rotation.x = 0;
const pullTab = mesh(new THREE.RoundedBoxGeometry(0.32, 0.8, 0.07, 2, 0.03), SM(0xb8bec8, { metalness: 0.9, roughness: 0.2 }), 0, -0.6, 0.3, slider);
function placeTeeth(sy, dir) { // sy: slider y; teeth below slider are joined (when zipping up)
  teeth.forEach(t => { const d = t.y - sy; const open = Math.min(0.75, Math.max(0, d - 0.1) * 0.45) + (d > 0.1 ? 0.12 : 0); t.g.position.set(t.sx * (open > 0 ? open - 0.1 : -0.22), t.y, 0); t.g.rotation.z = t.sx * Math.min(0.25, open * 0.4); });
  slider.position.set(0, sy, 0.0); }
function labelS(txt, col) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.font = 'bold 72px sans-serif'; g.fillStyle = col || '#ffd23f'; g.strokeStyle = '#111'; g.lineWidth = 10; g.textAlign = 'center'; g.strokeText(txt, 256, 90); g.fillText(txt, 256, 90); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.renderOrder = 10; s.scale.set(1.6, 0.4, 1); s.visible = false; scene.add(s); return s; }
const LB = { teeth: labelS('TEETH'), bump: labelS('BUMP'), hole: labelS('HOLE'), slider: labelS('SLIDER'), sealed: labelS('✓ SEALED', '#5aff7a'), wedge: labelS('WEDGE'), gaps: labelS('GAPS', '#ff4a3a'), knots: labelS('KNOT #1') };
const knotLabels = Array.from({ length: 10 }, (_, k) => labelS('KNOT #' + (k + 1), '#ffffff'));
// ---------- shots ----------
const CF = [[2.9, 1.7, 5.8], [2.4, 1.5, 5.0]], LF = [[0, 0.8, 1.2], [0, 0.75, 1.2]];
const SHOTS = {
  tent:    { cam: [[5.5, 2.8, 7.5], [3.4, 1.8, 5.2]], look: [[0.6, 0.8, 0.8], [0, 0.8, 1.0]], guy: [-1.9, 2.0, 0.5] },
  wind:    { cam: CF, look: LF, wind: true, bugs: 'in' },
  rock:    { cam: [[2.7, 1.3, 4.8], [2.2, 1.1, 4.1]], look: [[0.2, 0.6, 1.3], [0.2, 0.6, 1.3]], rock: true },
  string:  { cam: [[1.7, 1.3, 4.3], [1.2, 1.1, 3.6]], look: [[-0.2, 0.8, 1.3], [-0.2, 0.8, 1.3]], knots: true, guy: [-0.8, 2.2, 0.6] },
  buttons: { cam: [[1.4, 1.1, 3.9], [1.0, 1.0, 3.3]], look: [[0, 0.75, 1.3], [0, 0.75, 1.3]], buttons: true, bugs: 'gap' },
  teeth:   { zip: true, cam: [[0.6, 6.5, 207.5], [0, 3.2, 205.2]], look: [[0, 5.5, 200], [0, 2.8, 200]], sl: [0.6, 0.6] },
  slider:  { zip: true, cam: [[0.4, 1.2, 205], [0.4, 9, 205]], look: [[0, 1.0, 200], [0, 8.8, 200]], sl: [0.6, 10.5] },
  open:    { zip: true, cam: [[-0.8, 9, 205.4], [-0.8, 3.0, 205.4]], look: [[0, 8.8, 200], [0, 2.8, 200]], sl: [10.5, 2.6], down: true },
  done:    { cam: CF, look: LF, wind: true, zipped: true, bugs: 'bounce', guy: [1.45, 0.9, 0.3] },
  fact:    { cam: [[2.2, 1.3, 4.4], [6.5, 3.4, 9.5]], look: [[0, 0.8, 1.2], [0.8, 1.0, 0]], zipped: true, guy: [1.45, 0.9, 0.3], fire: true },
  end:     { cam: [[6.5, 3.4, 9.5], [6.5, 3.4, 9.5]], look: [[0.8, 1.0, 0], [0.8, 1.0, 0]], zipped: true, guy: [1.45, 0.9, 0.3] },
};
let TIMING = null; window.setTiming = (t) => { TIMING = t; };
window.renderAt = (t) => {
  const segs = TIMING.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SHOTS[sg.shot], lt = t - sg.start, D = sg.dur, u = Math.min(1, lt / D), e = ease(u);
  Object.values(LB).forEach(l => l.visible = false); knotLabels.forEach(l => l.visible = false);
  const inZip = !!sh.zip; ZIP.visible = inZip;
  scene.background = inZip ? new THREE.Color(0x101624) : (window.SKYTEX || new THREE.Color(0x9cc8ec)); scene.fog.color.set(inZip ? 0x101624 : 0xb8d6ee); scene.fog.near = inZip ? 9 : 30; scene.fog.far = inZip ? 14 : 90;
  // tent defaults
  setFlaps(0); knots.forEach(k => k.visible = false); buttons.forEach(b => b.visible = false); zipLine.visible = zipPull.visible = !!sh.zipped; rockZ.visible = !!sh.rock; bugs.forEach(b => b.visible = false);
  if (sh.zipped) { zipPull.position.y = sh.fire ? 1.25 : 1.25; }
  // wind: flaps billow open
  if (sh.wind && !sh.zipped) { const a = 0.9 * sstep(0.0, 0.25, u) + Math.sin(t * 7) * 0.12 + Math.sin(t * 13) * 0.05; setFlaps(a); }
  if (sh.zipped && sh.wind) { TENT.children.forEach(() => {}); }
  if (sh.rock) { const lift = sstep(0.45, 0.7, u); setFlaps(lift * 0.7 + (lift > 0 ? Math.sin(t * 8) * 0.06 : 0)); const r = sstep(0.5, 0.8, u); rockZ.position.set(r * 0.9, 0.2 + Math.sin(r * Math.PI) * 0.25, ZF + 0.2 + r * 0.8); rockZ.rotation.z = -r * 5; rockZ.rotation.x = r * 3; }
  if (sh.knots) { const n = Math.min(10, Math.floor(sstep(0.05, 0.85, u) * 10.999)); knots.forEach((k, j) => k.visible = j < n); if (n > 0) { const L = knotLabels[n - 1]; L.visible = true; L.position.set(-0.5, 0.22, ZF + 0.4); L.scale.set(0.9, 0.22, 1); } }
  if (sh.buttons) { buttons.forEach(b => b.visible = true); setFlaps(0.09 + Math.sin(t * 5) * 0.02); if (u > 0.35) { LB.gaps.visible = true; LB.gaps.position.set(0.35, 1.15, ZF + 0.3); LB.gaps.scale.set(0.8, 0.2, 1); } }
  // bugs
  if (sh.bugs) bugs.forEach((b, k) => { const d = b.userData; b.visible = true; const fl = Math.sin(t * 60 + k) * 0.6; d.w1.rotation.y = fl; d.w2.rotation.y = -fl; let p;
    if (sh.bugs === 'in') { const s = Math.min(1, Math.max(0, (u - 0.3 - k * 0.03) * 2.2)); const a = t * 2 + d.ph; p = new THREE.Vector3(Math.sin(a) * d.r * (1 - s) + Math.sin(a * 1.7) * 0.1, 0.7 + Math.cos(a * 1.3) * 0.35, ZF + 1.4 * (1 - s) - s * 1.2 + Math.cos(a) * 0.2 * (1 - s)); b.visible = s < 0.98 || true; }
    else if (sh.bugs === 'gap') { const s = ((u * 1.3 + k * 0.13) % 1); const gy = 0.4 + (k % 3) * 0.32; p = new THREE.Vector3(Math.sin(k) * 0.4 * (1 - s), gy + Math.sin(t * 9 + k) * 0.03, ZF + 0.6 * (1 - s) - s * 0.5); }
    else { const a = t * 2.4 + d.ph; const z = ZF + 0.25 + Math.abs(Math.sin(a * 1.3)) * 0.8; p = new THREE.Vector3(Math.sin(a) * 0.8, 0.7 + Math.cos(a * 1.1) * 0.4, z); }
    b.position.copy(p).add(TENT.position); b.lookAt(cam.position); });
  // zipper cutaway
  if (inZip) { const sy = sh.sl[0] + (sh.sl[1] - sh.sl[0]) * sstep(0.05, 0.9, u);
    if (sh.down) { teeth.forEach(tt => { const d = tt.y - sy; const open = d < -0.1 ? Math.min(0.75, (-d - 0.1) * 0.45) + 0.12 : 0; const o = Math.max(0, open); tt.g.position.set(tt.sx * (o > 0 ? o - 0.1 : -0.22), tt.y, 0); tt.g.rotation.z = tt.sx * Math.min(0.25, o * 0.4); }); slider.position.set(0, sy, 0); slider.rotation.z = Math.PI; }
    else { placeTeeth(sy); slider.rotation.z = 0; }
    if (sg.shot === 'teeth') { slider.visible = false; teeth.forEach(tt => { const o = 0.75; tt.g.position.x = tt.sx * (o - 0.1); tt.g.rotation.z = 0; });
      if (u > 0.15) { LB.teeth.visible = true; LB.teeth.position.set(0, 5.6, 200.6); }
      if (u > 0.5) { LB.bump.visible = true; LB.bump.position.set(-1.6, 3.15, 200.5); LB.bump.scale.set(1.0, 0.25, 1); }
      if (u > 0.7) { LB.hole.visible = true; LB.hole.position.set(1.6, 2.65, 200.5); LB.hole.scale.set(1.0, 0.25, 1); } }
    else slider.visible = true;
    if (sg.shot === 'slider') { LB.slider.visible = u < 0.5; LB.slider.position.set(1.4, sy + 0.4, 200.6); LB.slider.scale.set(1.2, 0.3, 1); if (u > 0.85) { LB.sealed.visible = true; LB.sealed.position.set(0, sy - 1.6, 200.8); } }
    if (sg.shot === 'open') { LB.wedge.visible = u > 0.2; LB.wedge.position.set(1.3, sy + 0.2, 200.6); LB.wedge.scale.set(1.2, 0.3, 1); }
    if (sg.shot === 'slider') sh.cam[0][1] = 1.2; }
  // fire flicker
  flames.forEach((f, k) => { f.scale.set(1, 0.85 + Math.sin(t * 11 + k * 2) * 0.15 + Math.sin(t * 23 + k) * 0.06, 1); f.rotation.y = t * (1 + k); }); fireLight.intensity = 1.6 + Math.sin(t * 17) * 0.3;
  // you
  guy.visible = !inZip && !!sh.guy; if (sh.guy) { guy.position.set(sh.guy[0], 0, sh.guy[1]); guy.rotation.y = sh.guy[2]; pose(false, t); guy.position.y = Math.sin(t * 2.2) * 0.008; arms[0].rotation.set(0, 0, 0); arms[1].rotation.set(0, 0, 0); head.rotation.y = Math.sin(t * 0.8) * 0.15;
    if (sh.knots) { arms[1].rotation.x = -1.1 + Math.sin(t * 14) * 0.25; arms[0].rotation.x = -1.0 - Math.sin(t * 14) * 0.25; }
    if (sg.shot === 'done' && u > 0.6) { arms[0].rotation.z = -2.6; arms[1].rotation.z = 2.6; } }
  cam.position.lerpVectors(V(sh.cam[0]), V(sh.cam[1]), e); cam.position.x += Math.sin(t * 0.7) * 0.03; cam.position.y += Math.sin(t * 0.9) * 0.02;
  cam.lookAt(new THREE.Vector3().lerpVectors(V(sh.look[0]), V(sh.look[1]), e));
  R.render(scene, cam); return sg.shot;
};
