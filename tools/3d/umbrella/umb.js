// "You invented the umbrella" — rain problem loop. Loaded after world.js (reuses its scene, guy, house).
CHEST.visible = false; thief.visible = false; LOCK.visible = false;
const shirtMats = []; guy.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() === SHIRT) shirtMats.push(o.material); });
const DRY = new THREE.Color(SHIRT), WET = new THREE.Color(0x1d3f6e);
// ---- umbrella ----
const L = 0.85, NR = 8, SHAFT = 0.85;
const UMB = new THREE.Group(); scene.add(UMB);
const metal = SM(0x30333a, { metalness: 0.8, roughness: 0.35 });
mesh(new THREE.CylinderGeometry(0.014, 0.014, SHAFT, 8), metal, 0, SHAFT / 2, 0, UMB);
const hook = mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16, Math.PI), SM(0x5a3520, { roughness: 0.5 }), -0.06, 0, 0, UMB); hook.rotation.z = Math.PI;
mesh(new THREE.SphereGeometry(0.025, 10, 8), metal, 0, SHAFT + 0.02, 0, UMB);
const TOP = new THREE.Group(); TOP.position.y = SHAFT; UMB.add(TOP);
const cloth = new THREE.MeshStandardMaterial({ color: 0xd8342f, roughness: 0.55, side: THREE.DoubleSide });
const canopy = mesh(new THREE.ConeGeometry(1, 1, NR, 1, true), cloth, 0, 0, 0, TOP);
const ribs = [], strs = [];
for (let k = 0; k < NR; k++) { const th = k * Math.PI * 2 / NR; const g = new THREE.Group(); g.rotation.y = th - Math.PI / 2; TOP.add(g);
  const p = new THREE.Group(); g.add(p); mesh(new THREE.CylinderGeometry(0.008, 0.008, L, 5), metal, 0, -L / 2, 0, p); ribs.push(p);
  strs.push(mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 5), metal, 0, 0, 0, g)); }
const runner = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 12), metal, 0, 0, 0, UMB);
const ls = 0.3 * L, Ls = 0.35 * L;
let umbA = 1.25, umbR = 0;
function setUmb(a) { umbA = a; const h = L * Math.cos(a), r = L * Math.sin(a); umbR = Math.abs(r);
  canopy.scale.set(r, h, r); canopy.position.y = -h / 2; ribs.forEach(p => p.rotation.z = a);
  const ca = Math.min(a, 1.4), yr = -ls * Math.cos(ca) - Math.sqrt(Math.max(0, Ls * Ls - (ls * Math.sin(ca)) ** 2));
  runner.position.y = SHAFT + yr; const p2x = ls * Math.sin(ca), p2y = -ls * Math.cos(ca);
  strs.forEach(s => { const dx = p2x, dy = p2y - yr; s.position.set(dx / 2, (yr + p2y) / 2, 0); s.scale.y = Math.hypot(dx, dy); s.rotation.z = Math.atan2(-dx, dy); s.visible = a < 1.5; }); }
// ---- leaf and board ----
const leaf = mesh(new THREE.SphereGeometry(1, 16, 8), SM(0x3f8f3a, { roughness: 0.6 }), 0, -0.68, 0, arms[1]); leaf.scale.set(0.24, 0.02, 0.15);
const BOARD = mesh(new THREE.RoundedBoxGeometry(1.7, 0.07, 1.2, 2, 0.02), new THREE.MeshStandardMaterial({ map: null, color: 0x9a6a3c, roughness: 0.8 }), 0, 2.2, 0);
// doorway (dark opening) + door hidden in the door shots
const doorway = mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshBasicMaterial({ color: 0x1c140e }), 1.2, 1.05, 2.006, HOUSE); doorway.castShadow = false;
const door = HOUSE.children[2];
// ---- rain ----
const NRAIN = 2600; const drop = new THREE.BoxGeometry(0.01, 0.28, 0.01);
const rain = new THREE.InstancedMesh(drop, new THREE.MeshBasicMaterial({ color: 0xcfe0f0, transparent: true, opacity: 0.55 }), NRAIN); rain.castShadow = false; scene.add(rain);
const rseed = []; let rs = 3; const rr = () => (rs = (rs * 16807) % 2147483647) / 2147483647; for (let k = 0; k < NRAIN; k++) rseed.push([rr(), rr(), rr(), rr()]);
const dm2 = new THREE.Object3D();
function doRain(t, F, covers, wind) { const tilt = wind * 0.35; for (let k = 0; k < NRAIN; k++) { const s = rseed[k]; const x = F.x - 5 + s[0] * 10, z = F.z - 5 + s[1] * 9; let y = 6 - ((s[2] * 6 + t * (11 + s[3] * 3)) % 6); const xx = x + (6 - y) * tilt;
    let hid = false; for (const c of covers) if (y < c.y && Math.hypot(xx - c.x, z - c.z) < c.r) { hid = true; break; }
    dm2.position.set(xx, y, z); dm2.rotation.set(0, 0, tilt); dm2.scale.setScalar(hid ? 0 : 1); dm2.updateMatrix(); rain.setMatrixAt(k, dm2.matrix); } rain.instanceMatrix.needsUpdate = true; }
// splashes on the ground near the guy
const splashes = []; for (let k = 0; k < 40; k++) { const s = mesh(new THREE.TorusGeometry(0.05, 0.006, 4, 12), new THREE.MeshBasicMaterial({ color: 0xdde8f2, transparent: true }), 0, 0.01, 0); s.rotation.x = Math.PI / 2; s.castShadow = false; splashes.push(s); }
// puddles
for (let k = 0; k < 10; k++) { const p = mesh(new THREE.CircleGeometry(0.4 + rr() * 0.5, 20), new THREE.MeshStandardMaterial({ color: 0x5a6a7a, roughness: 0.05, metalness: 0.6 }), -4 + rr() * 10, 0.012, -2 + rr() * 5); p.rotation.x = -Math.PI / 2; p.scale.y = 0.6; p.castShadow = false; }
const ULB = { small: labelS('✕ TOO SMALL', '#ff4a3a'), heavy: labelS('✕ TOO HEAVY', '#ff4a3a'), dry: labelS('✓ DRY', '#5aff7a'), stuck: labelS('✕ STUCK', '#ff4a3a'), runner: labelS('RING'), hinge: labelS('HINGES'), wind: labelS('WIND!', '#ffffff'), snap: labelS('SNAP BACK', '#5aff7a') };
const GRAYSKY = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#5d6773'); gr.addColorStop(0.6, '#8f99a4'); gr.addColorStop(1, '#b8c0c8'); g.fillStyle = gr; g.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
// ---- shots ----
// mode: what you hold. path: [x0,z0,x1,z1,u0,u1] walking. cam: offsets relative to guy [start,end], look offsets.
const SH = {
  soaked: { hold: 'none', path: [6, 1.2, 3.6, 1.2, 0, 1], cam: [[-3.6, 1.8, 3.6], [-2.9, 1.7, 3.0]], look: [0, 1.3, 0], wet: [0.1, 0.9] },
  leaf:   { hold: 'leaf', path: [3.6, 1.2, 2.0, 1.2, 0, 1], cam: [[-2.8, 1.9, 3.0], [-2.4, 1.9, 2.6]], look: [0, 1.6, 0], wet: [0.9, 0.95], lab: ['small', 0.45, [0, 2.6, 0]] },
  board:  { hold: 'board', path: [2.0, 1.2, 1.3, 1.2, 0, 1], slow: true, cam: [[-3.6, 2.0, 3.8], [-3.1, 1.9, 3.3]], look: [0, 1.6, 0], wet: [0.95, 0.95], lab: ['heavy', 0.5, [0, 2.75, 0]] },
  cloth:  { hold: 'open', path: [6, 1.2, 3.8, 1.2, 0, 1], cam: [[-3.4, 1.7, 3.6], [-2.9, 1.7, 3.1]], look: [0, 1.7, 0], wet: [0.95, 0.4], lab: ['dry', 0.55, [0, 2.45, 0]] },
  door:   { hold: 'open', door: true, path: [-1.8, 0.8, -1.8, -2.55, 0, 0.72], cam: [[2.7, 2.4, 3.4], [2.3, 2.3, 2.8]], look: [0, 1.5, -1.0], wet: [0.4, 0.4], lab: ['stuck', 0.75, [0, 2.7, -1.0]] },
  fold:   { hold: 'fold', door: true, path: [-1.8, -2.35, -1.8, -4.6, 0.62, 1.0], cam: [[2.2, 2.2, 2.6], [2.6, 2.2, 3.4]], look: [0, 1.6, -0.8], wet: [0.4, 0.4] },
  wind:   { hold: 'wind', path: [3.0, 1.2, 3.0, 1.2, 0, 0], face: 0.35, cam: [[1.4, 1.8, 4.4], [1.1, 1.9, 3.8]], look: [0, 1.9, 0.4], wet: [0.4, 0.3] },
  done:   { hold: 'open', path: [1.0, -1.0, 1.0, 1.6, 0, 1], cam: [[2.4, 1.6, 2.4], [3.2, 3.0, 6.0]], look: [0, 1.4, 0], wet: [0.3, 0.1] },
  end:    { hold: 'open', path: [1.0, 1.6, 1.0, 1.6, 0, 0], face: 0, cam: [[1.8, 3.0, 4.2], [1.8, 3.0, 4.2]], look: [0, 1.4, -1.6], wet: [0.1, 0.1] },
};
window.renderAt = (t) => {
  const segs = TIMING.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SH[sg.shot], lt = t - sg.start, D = sg.dur, u = Math.min(1, lt / D), e = ease(u);
  Object.values(ULB).forEach(l => l.visible = false); Object.values(LB).forEach(l => l.visible = false);
  scene.background = GRAYSKY; scene.fog.color.set(0x9aa3ad); scene.fog.near = 10; scene.fog.far = 42; sun.intensity = 1.1; hemi.intensity = 1.0; hemi.color.set(0xc8d2dc);
  door.visible = !sh.door; doorway.visible = !!sh.door;
  // walk
  const p = sh.path, w = sstep(p[4], p[5], u); const moving = p[4] !== p[5] && u > p[4] && u < p[5];
  let gx = p[0] + (p[2] - p[0]) * w, gz = p[1] + (p[3] - p[1]) * w;
  if (sg.shot === 'door') { const b = sstep(0.72, 0.8, u) - sstep(0.8, 0.95, u) * 0.6; gz += b * 0.25; }
  guy.visible = true; guy.position.set(gx, 0, gz);
  guy.rotation.y = sh.face !== undefined ? sh.face : (p[0] !== p[2] || p[1] !== p[3] ? Math.atan2(p[2] - p[0], p[3] - p[1]) : 0);
  const spd = sh.slow ? 5 : 9; pose(moving, t * spd / 9); if (moving && sh.slow) guy.position.y = Math.abs(Math.sin(t * 5)) * 0.03;
  arms[0].rotation.set(moving ? arms[0].rotation.x : 0, 0, 0); arms[1].rotation.set(0, 0, 0); head.rotation.y = 0; head.rotation.x = 0;
  const wet = sh.wet[0] + (sh.wet[1] - sh.wet[0]) * u; shirtMats.forEach(m => m.color.copy(DRY).lerp(WET, wet));
  leaf.visible = sh.hold === 'leaf'; BOARD.visible = sh.hold === 'board'; UMB.visible = ['open', 'fold', 'wind'].includes(sh.hold);
  const covers = []; let wind = 0;
  if (sh.hold === 'none') { arms[0].rotation.x = -0.4 + Math.sin(t * 9) * 0.3; arms[1].rotation.x = -2.6; arms[1].rotation.z = 0.5; head.rotation.x = 0.25; } // shielding head with arm
  if (sh.hold === 'leaf') { arms[1].rotation.x = -2.95; const lp = new THREE.Vector3(); leaf.getWorldPosition(lp); covers.push({ x: lp.x, z: lp.z, y: lp.y, r: 0.2 }); head.rotation.x = 0.15; }
  if (sh.hold === 'board') { const sk = Math.sin(t * 7) * 0.04; arms[0].rotation.x = -3.0 + sk; arms[1].rotation.x = -3.0 - sk; BOARD.position.set(gx + sk * 0.3, 2.18 + Math.sin(t * 5) * 0.025, gz); BOARD.rotation.z = Math.sin(t * 3) * 0.05; covers.push({ x: gx, z: gz, y: 2.2, r: 0.8 }); head.rotation.x = 0.2; }
  let a = 1.25;
  if (sh.hold === 'fold') a = 1.25 - 1.13 * sstep(0.08, 0.45, u);
  if (sh.hold === 'wind') { const fl = sstep(0.08, 0.25, u), back = sstep(0.55, 0.72, u); a = 1.25 + (2.35 - 1.25) * fl * (1 - back) + Math.sin(Math.max(0, u - 0.72) * 22) * 0.18 * Math.exp(-Math.max(0, u - 0.72) * 7) * back; wind = fl * (1 - back);
    UMB.rotation.z = -0.25 * wind; if (u > 0.12 && u < 0.6) { ULB.wind.visible = true; } if (u > 0.68) ULB.snap.visible = true; }
  if (UMB.visible) { if (window._a === undefined || sg.shot !== window._shot && sh.hold !== 'open') window._a = a; window._a += (a - window._a) * 0.18; setUmb(window._a); arms[1].rotation.x = -1.3 + Math.sin(t * 1.7) * 0.03; arms[1].add(UMB); UMB.position.set(0, -0.64, 0.02); UMB.rotation.x = 1.3; if (sh.hold !== 'wind') UMB.rotation.z = 0;
    const tp = new THREE.Vector3(); TOP.getWorldPosition(tp); if (a < 1.5) covers.push({ x: tp.x, z: tp.z, y: tp.y - L * Math.cos(a), r: umbR * 0.95 }); }
  ['wind', 'snap'].forEach(k => { const l = ULB[k]; if (l.visible) { const tp = new THREE.Vector3(); TOP.getWorldPosition(tp); l.position.set(tp.x, tp.y + 0.55, tp.z); l.scale.set(1.0, 0.25, 1); } });
  if (sh.lab && u > sh.lab[1]) { const l = ULB[sh.lab[0]]; l.visible = true; const o = sh.lab[2]; l.position.set(gx + o[0], o[1], gz + o[2]); l.scale.set(1.2, 0.3, 1); }
  if (sg.shot === 'fold') { const rp = new THREE.Vector3(); runner.getWorldPosition(rp); if (u > 0.1 && u < 0.6) { ULB.runner.visible = true; ULB.runner.position.set(rp.x + 0.35, rp.y - 0.05, rp.z); ULB.runner.scale.set(0.7, 0.18, 1); }
    if (u > 0.3 && u < 0.6) { const tp = new THREE.Vector3(); TOP.getWorldPosition(tp); ULB.hinge.visible = true; ULB.hinge.position.set(tp.x + 0.45, tp.y + 0.2, tp.z); ULB.hinge.scale.set(0.75, 0.19, 1); } }
  if (sg.shot === 'done' && u > 0.55) { arms[0].rotation.z = -2.5; }
  // rain + splashes
  const F = new THREE.Vector3(gx, 0, gz); doRain(t, F, covers, wind);
  splashes.forEach((s, k) => { const ph = (t * 2.2 + k * 0.137) % 1; let x = gx - 3 + ((k * 0.618) % 1) * 6, z = gz - 2 + ((k * 0.377) % 1) * 4.5; let hid = false; for (const c of covers) if (Math.hypot(x - c.x, z - c.z) < c.r) hid = true; s.visible = !hid; s.position.set(x, 0.02, z); s.scale.setScalar(0.3 + ph * 1.6); s.material.opacity = (1 - ph) * 0.7; });
  // camera follows guy
  const c0 = V(sh.cam[0]), c1 = V(sh.cam[1]); cam.position.lerpVectors(c0, c1, e).add(F); cam.position.x += Math.sin(t * 0.7) * 0.03; cam.position.y += Math.sin(t * 0.9) * 0.02;
  cam.lookAt(V(sh.look).add(F));
  // smoothing: joints ease toward their targets, camera eases within a shot
  const cut = window._shot !== sg.shot; window._shot = sg.shot; const J = window._J || (window._J = new Map());
  [[legs[0], 0.45], [legs[1], 0.45], [arms[0], 0.2], [arms[1], 0.2], [head, 0.15]].forEach(([o, k]) => { const p = J.get(o); const tg = [o.rotation.x, o.rotation.y, o.rotation.z]; if (!p) { J.set(o, tg); return; } for (let q = 0; q < 3; q++) p[q] += (tg[q] - p[q]) * k; o.rotation.set(p[0], p[1], p[2]); });
  const look = V(sh.look).add(F); const CS = window._CS; if (cut || !CS) { window._CS = { p: cam.position.clone(), l: look.clone() }; } else { CS.p.lerp(cam.position, 0.15); CS.l.lerp(look, 0.15); cam.position.copy(CS.p); }
  cam.lookAt(window._CS.l);
  R.render(scene, cam); return sg.shot;
};
