// "You invented the fridge" v2 — slower story beats, metal box with real inside/outside cutaway.
thief.visible = false; LOCK.visible = false; latch.visible = false; loops.forEach(l => l.visible = false); lidHasp.visible = false;
gold.forEach(g => g.visible = false); ropes.forEach(r => r.visible = false); boulder.visible = false;
const P1 = new THREE.Vector3(1.9, 0, 0.9);
// ---------- food ----------
const FOOD = new THREE.Group(); scene.add(FOOD);
mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.04, 32), SM(0xf2f2f2, { roughness: 0.3 }), 0, 0.02, 0, FOOD);
const meatM = SM(0xa0522d, { roughness: 0.6 }), cheeseM = SM(0xf2c230, { roughness: 0.5 }), boneM = SM(0xf4ecd8);
const meat = mesh(new THREE.SphereGeometry(0.13, 20, 14), meatM, -0.05, 0.12, 0, FOOD); meat.scale.set(1.3, 0.8, 0.9);
mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 10), boneM, 0.13, 0.1, 0, FOOD).rotation.z = Math.PI / 2;
mesh(new THREE.SphereGeometry(0.035, 10, 8), boneM, 0.22, 0.1, 0.02, FOOD); mesh(new THREE.SphereGeometry(0.035, 10, 8), boneM, 0.22, 0.1, -0.02, FOOD);
const cheese = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.09, 3), cheeseM, 0.1, 0.085, 0.14, FOOD); cheese.rotation.y = 0.4;
const ROT = new THREE.Color(0x5f6b3a), MEAT0 = new THREE.Color(0xa0522d), CH0 = new THREE.Color(0xf2c230), CHR = new THREE.Color(0x9aa04a), FROSTC = new THREE.Color(0xd8e8f4);
const stink = []; for (let k = 0; k < 3; k++) { const pts = Array.from({ length: 12 }, (_, j) => new THREE.Vector3(Math.sin(j * 0.9 + k) * 0.05, j * 0.05, 0)); const s = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.008, 5), new THREE.MeshBasicMaterial({ color: 0x8fc23a, transparent: true }), 0, 0, 0, FOOD); s.castShadow = false; stink.push(s); }
const flies = []; for (let k = 0; k < 6; k++) { const b = new THREE.Group(); FOOD.add(b); mesh(new THREE.SphereGeometry(0.022, 8, 6), SM(0x111111), 0, 0, 0, b); const wm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide }); b.userData.w = [mesh(new THREE.PlaneGeometry(0.035, 0.02), wm, 0.025, 0.01, 0, b), mesh(new THREE.PlaneGeometry(0.035, 0.02), wm, -0.025, 0.01, 0, b)]; flies.push(b); }
const frost = []; const frostPos = []; let fs = 9; const fr = () => (fs = (fs * 16807) % 2147483647) / 2147483647;
for (let k = 0; k < 50; k++) { const m = mesh(new THREE.SphereGeometry(0.01 + fr() * 0.012, 6, 5), new THREE.MeshBasicMaterial({ color: 0xf2f8ff }), 0, 0, 0, FOOD); m.castShadow = false; frost.push(m); frostPos.push(new THREE.Vector3((fr() - 0.5) * 0.4, 0.09 + fr() * 0.11, (fr() - 0.5) * 0.28)); }
// ---------- snow, puddles, ice ----------
const snow = mesh(new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), 0, 0, 0);
const flakes = []; for (let k = 0; k < 120; k++) { const m = mesh(new THREE.SphereGeometry(0.018, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0, 0); m.castShadow = false; m.userData.s = [fr(), fr(), fr()]; flakes.push(m); }
const puddleM = () => new THREE.MeshStandardMaterial({ color: 0x7fa2c0, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.8 });
const puddle1 = mesh(new THREE.CircleGeometry(0.7, 32), puddleM(), 0, 0.012, 0); puddle1.rotation.x = -Math.PI / 2; puddle1.castShadow = false;
const puddle2 = mesh(new THREE.CircleGeometry(1.0, 32), puddleM(), 0.2, 0.012, 0.6); puddle2.rotation.x = -Math.PI / 2; puddle2.castShadow = false;
const ice = mesh(new THREE.RoundedBoxGeometry(0.55, 0.5, 0.6, 3, 0.05), new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: 0.05, transparent: true, opacity: 0.7, clearcoat: 1 }), -0.4, 1.05, 0, CHEST);
const drips = []; for (let k = 0; k < 10; k++) { const m = mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshStandardMaterial({ color: 0x9fd0ff, roughness: 0.05 }), 0, 0, 0, CHEST); m.castShadow = false; drips.push(m); }
// ---------- metal box (hollow, front wall can open for the cutaway) ----------
const BW = 1.4, BH = 1.0, BD = 1.0, TW = 0.04;
const BOX = new THREE.Group(); scene.add(BOX);
const steel = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.9, roughness: 0.28 });
const steelIn = new THREE.MeshStandardMaterial({ color: 0xe8eef4, metalness: 0.3, roughness: 0.4 });
const wall = (w, h, d, x, y, z, m = steel) => mesh(new THREE.RoundedBoxGeometry(w, h, d, 2, 0.015), m, x, y, z, BOX);
wall(BW, TW, BD, 0, TW / 2, 0, steelIn); wall(BW, TW, BD, 0, BH - TW / 2, 0); wall(TW, BH, BD, -BW / 2 + TW / 2, BH / 2, 0); wall(TW, BH, BD, BW / 2 - TW / 2, BH / 2, 0); wall(BW, BH, TW, 0, BH / 2, -BD / 2 + TW / 2);
mesh(new THREE.PlaneGeometry(BW - 0.1, BH - 0.1), steelIn, 0, BH / 2, -BD / 2 + TW + 0.002, BOX);
const frontM = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.9, roughness: 0.28, transparent: true });
const front = mesh(new THREE.RoundedBoxGeometry(BW, BH, TW, 2, 0.015), frontM, 0, BH / 2, BD / 2 - TW / 2, BOX);
const handle = mesh(new THREE.RoundedBoxGeometry(0.5, 0.05, 0.05, 2, 0.02), SM(0x5a5f68, { metalness: 0.9, roughness: 0.2 }), 0, BH - 0.15, BD / 2 + 0.03, BOX);
// pipes (closed loop): inside serpentine on the back wall (cold side), outside coil behind it (hot side), pump bottom back
const ZI = -0.44, ZO = -0.6;
const loopPts = [[0.5, 0.14, -0.72], [0.6, 0.3, ZO], [-0.6, 0.3, ZO], [-0.6, 0.45, ZO], [0.6, 0.45, ZO], [0.6, 0.6, ZO], [-0.6, 0.6, ZO], [-0.6, 0.78, ZO], [-0.6, 0.86, -0.52], [-0.58, 0.82, ZI], [0.58, 0.82, ZI], [0.58, 0.66, ZI], [-0.58, 0.66, ZI], [-0.58, 0.5, ZI], [0.58, 0.5, ZI], [0.58, 0.34, ZI], [0.32, 0.2, ZI], [0.32, 0.1, -0.52], [0.36, 0.08, -0.72]].map(p => new THREE.Vector3(...p));
const curve = new THREE.CatmullRomCurve3(loopPts, true, 'catmullrom', 0.05);
const PIPES = new THREE.Group(); BOX.add(PIPES);
const tube = mesh(new THREE.TubeGeometry(curve, 500, 0.022, 8, true), SM(0xc8874a, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0, PIPES); const tubeN = tube.geometry.index.count;
const pump = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.24, 24), SM(0x2a2d33, { metalness: 0.6, roughness: 0.35 }), 0.45, 0.12, -0.75, PIPES);
const pumpFan = mesh(new THREE.BoxGeometry(0.2, 0.02, 0.03), SM(0x8a9098, { metalness: 0.8 }), 0.45, 0.25, -0.75, PIPES);
const NS = 400, inside = []; for (let k = 0; k < NS; k++) inside.push(curve.getPointAt(k / NS).z > -0.52);
const a0 = inside.indexOf(true), a1 = inside.lastIndexOf(true);
const BLUE = new THREE.Color(0x3fb4ff), ORANGE = new THREE.Color(0xff9a2a), RED = new THREE.Color(0xff3a14);
function heatAt(s) { const k = Math.floor((((s % 1) + 1) % 1) * NS) % NS; if (k >= a0 && k <= a1) return new THREE.Color().copy(BLUE).lerp(ORANGE, (k - a0) / (a1 - a0)); const span = NS - (a1 - a0); const d = (k > a1 ? k - a1 : k + NS - a1) / span; return new THREE.Color().copy(RED).lerp(BLUE, sstep(0.15, 0.9, d)); }
const NPT = 160, parts = []; const pg = new THREE.SphereGeometry(0.03, 10, 8);
for (let k = 0; k < NPT; k++) { const m = mesh(pg, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0, 0, PIPES); m.castShadow = false; parts.push(m); }
const heat = []; for (let k = 0; k < 6; k++) { const pts = Array.from({ length: 14 }, (_, j) => new THREE.Vector3(Math.sin(j * 0.8 + k) * 0.06, j * 0.06, 0)); const s = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.012, 5), new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true }), -0.6 + k * 0.24, 0.8, -0.66, PIPES); s.castShadow = false; heat.push(s); }
const wisps = []; for (let k = 0; k < 18; k++) { const m = mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true }), 0, 0, 0, BOX); m.castShadow = false; m.userData.s = [fr(), fr(), fr()]; wisps.push(m); }
const mist = []; for (let k = 0; k < 40; k++) { const m = mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.25, depthWrite: false }), 0, 0, 0, BOX); m.castShadow = false; m.userData.s = [fr(), fr(), fr()]; mist.push(m); }
// ---------- fridge reveal ----------
const FRIDGE = new THREE.Group(); scene.add(FRIDGE);
const fwM = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.25, metalness: 0.1, transparent: true });
mesh(new THREE.RoundedBoxGeometry(1.1, 2.2, 1.0, 4, 0.08), fwM, 0, 1.1, 0, FRIDGE);
mesh(new THREE.BoxGeometry(1.08, 0.015, 0.02), SM(0x9aa0a8), 0, 1.45, 0.505, FRIDGE);
for (const [y, h] of [[1.85, 0.5], [0.95, 0.7]]) mesh(new THREE.RoundedBoxGeometry(0.05, h, 0.06, 2, 0.02), SM(0xb8bec8, { metalness: 0.9, roughness: 0.2 }), -0.42, y, 0.54, FRIDGE);
const FPIPE = new THREE.Group(); FRIDGE.add(FPIPE); FPIPE.scale.set(0.75, 2.0, 0.9); FPIPE.position.set(0, 0.05, 0.02);
mesh(new THREE.TubeGeometry(curve, 400, 0.016, 6, true), SM(0xc8874a, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0, FPIPE);
const fparts = []; for (let k = 0; k < 120; k++) { const m = mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0, 0, FPIPE); m.castShadow = false; fparts.push(m); }
// ---------- labels ----------
const FL = { rot: labelS('✕ ROTTING', '#ff4a3a'), summer: labelS('SUMMER', '#ffd23f'), day1: labelS('DAY 1', '#ffffff'), day2: labelS('DAY 2', '#ffffff'), day3: labelS('DAY 3', '#ffffff'), melt: labelS('✕ MELTED', '#ff4a3a'), metal: labelS('METAL BOX', '#ffffff'), liquid: labelS('LIQUID', '#3fb4ff'), heatL: labelS('HEAT', '#ff8a3a'), pumpL: labelS('PUMP', '#ffd23f'), out: labelS('HEAT OUT', '#ff7a2a'), back: labelS('COLD AGAIN', '#3fb4ff') };
const L = (k, x, y, z, s = 0.7) => { const l = FL[k]; l.visible = true; l.position.set(x, y, z); l.scale.set(s, s / 4, 1); };
const SH = {
  rot:    { cam: [[3.7, 1.5, 3.6], [3.1, 1.2, 2.8]], look: [[1.9, 0.3, 0.9], [1.9, 0.25, 0.9]], food: 'plate', guy: [0.9, 1.5, 1.0] },
  snow1:  { cam: [[3.1, 1.3, 2.9], [3.3, 1.45, 3.2]], look: [[1.9, 0.3, 0.9], [1.9, 0.3, 0.9]], food: 'plate', snow: 'grow' },
  snow2:  { cam: [[3.3, 1.45, 3.2], [2.9, 1.2, 2.7]], look: [[1.9, 0.3, 0.9], [1.9, 0.25, 0.9]], food: 'plate', snow: 'melt' },
  ice:    { cam: [[2.6, 3.4, 3.2], [2.0, 2.9, 2.5]], look: [[-0.1, 0.8, 0], [-0.1, 0.8, 0]], food: 'chest', chest: true, lid: 'open', ice: 'set' },
  ice2:   { cam: [[2.0, 2.9, 2.5], [1.7, 2.6, 2.1]], look: [[-0.1, 0.8, 0], [-0.1, 0.8, 0]], food: 'chest', chest: true, lid: 'open', ice: 'melt' },
  metal:  { cam: [[2.6, 1.6, 3.2], [1.9, 1.35, 2.6]], look: [[0, 0.5, 0], [0, 0.5, 0]], morph: true },
  pipes:  { cam: [[1.9, 1.35, 2.6], [1.2, 1.0, 2.2]], look: [[0, 0.5, -0.1], [0, 0.5, -0.2]], box: true, open: [0, 0.25], draw: [0.2, 0.85], food: 'box' },
  absorb: { cam: [[1.2, 1.0, 2.2], [0.6, 0.75, 1.6]], look: [[0, 0.45, -0.2], [0.1, 0.35, -0.1]], box: true, food: 'box', flow: true, wisps: true },
  pump:   { cam: [[2.6, 1.3, -2.4], [2.0, 1.0, -1.9]], look: [[0.1, 0.45, -0.6], [0.2, 0.4, -0.65]], box: true, food: 'box', flow: true, hot: true },
  loop:   { cam: [[1.9, 1.7, 2.5], [1.0, 1.2, 1.9]], look: [[0, 0.5, -0.2], [0, 0.4, -0.2]], box: true, food: 'box', flow: true, hot: true, frost: true },
  done:   { cam: [[2.2, 1.6, 3.0], [3.4, 2.1, 4.4]], look: [[0, 0.7, 0], [0, 1.1, 0]], fridge: 'grow', guy: [-1.3, 0.6, 0.8] },
  tail:   { cam: [[3.4, 2.1, 4.4], [2.4, 1.7, 3.2]], look: [[0, 1.1, 0], [0, 1.1, 0]], fridge: 'xray', guy: [-1.3, 0.6, 0.8] },
  end:    { cam: [[2.4, 1.7, 3.2], [2.4, 1.7, 3.2]], look: [[0, 1.1, 0], [0, 1.1, 0]], fridge: 'xray', guy: [-1.3, 0.6, 0.8] },
};
let TIMING2 = null; const _st = window.setTiming; window.setTiming = (t) => { TIMING2 = t; _st(t); };
window.renderAt = (t) => {
  const segs = TIMING2.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SH[sg.shot], lt = t - sg.start, D = sg.dur, u = Math.min(1, lt / D), e = ease(u);
  Object.values(FL).forEach(l => l.visible = false); Object.values(LB).forEach(l => l.visible = false);
  scene.background = window.SKYTEX; sun.intensity = 2.9; hemi.intensity = 0.55;
  const mo = sh.morph ? sstep(0.15, 0.7, u) : (sh.box ? 1 : 0);
  CHEST.visible = !!sh.chest || (!!sh.morph && mo < 0.99); BOX.visible = !!sh.box || (!!sh.morph && mo > 0.01);
  CHEST.scale.setScalar(sh.morph ? Math.max(0.001, 1 - mo) : 1); BOX.scale.setScalar(sh.morph ? Math.max(0.001, mo) : 1);
  BOX.rotation.y = sh.morph ? (1 - mo) * 1.5 : 0; if (sh.morph && u > 0.6) L('metal', 0, 1.35, 0.2);
  lid.rotation.x = sh.lid === 'open' ? -1.25 : 0;
  const op = sh.open ? sstep(sh.open[0], sh.open[1], u) : (sh.box ? 1 : 0); front.visible = op < 0.99; frontM.opacity = 1 - op; handle.visible = op < 0.5;
  PIPES.visible = BOX.visible && !!sh.box;
  const dr = sh.draw ? sstep(sh.draw[0], sh.draw[1], u) : 1; tube.geometry.setDrawRange(0, Math.floor(tubeN * dr / 3) * 3); pump.visible = dr > 0.05;
  // food
  FOOD.visible = !!sh.food; if (sh.food === 'plate') FOOD.position.copy(P1); else if (sh.food === 'chest') FOOD.position.set(0.3, 0.8, 0.05); else FOOD.position.set(0.15, TW, 0.1);
  let rot = 0; if (sg.shot === 'rot') rot = sstep(0.05, 0.6, u); if (sg.shot === 'snow1') rot = 1 - sstep(0.0, 0.5, u); if (sg.shot === 'snow2') rot = sstep(0.7, 1.0, u) * 0.9; if (sh.ice) rot = sh.ice === 'melt' ? sstep(0.75, 1, u) * 0.6 : 0; if (sh.box) rot = sg.shot === 'pipes' ? 0.6 : (sh.frost ? 0 : 0.6 * (1 - sstep(0.2, 0.9, u) * 0.6));
  meatM.color.copy(MEAT0).lerp(ROT, rot); cheeseM.color.copy(CH0).lerp(CHR, rot);
  stink.forEach((s, k) => { const ph = (t * 0.3 + k * 0.33) % 1; s.visible = rot > 0.35; s.position.set(-0.1 + k * 0.1, 0.18 + ph * 0.15, 0); s.material.opacity = Math.min(1, rot) * (1 - ph); });
  flies.forEach((f, k) => { f.visible = rot > 0.5 && sh.food !== 'box'; const a = t * (2.5 + k * 0.3) + k; f.position.set(Math.cos(a) * 0.3, 0.3 + Math.sin(a * 1.7) * 0.08, Math.sin(a) * 0.25); const w = Math.sin(t * 60 + k) * 0.6; f.userData.w[0].rotation.y = w; f.userData.w[1].rotation.y = -w; });
  if (sg.shot === 'rot' && u > 0.45) L('rot', P1.x, 0.85, P1.z, 0.8);
  // snow
  snow.visible = !!sh.snow; puddle1.visible = sh.snow === 'melt'; flakes.forEach(f => f.visible = sh.snow === 'grow');
  if (sh.snow === 'grow') { const g = sstep(0.05, 0.9, u); snow.position.copy(P1); snow.scale.set(0.3 + 0.7 * g, 0.8 * g + 0.01, 0.3 + 0.7 * g); FOOD.visible = g < 0.6;
    flakes.forEach(f => { const s = f.userData.s; f.position.set(P1.x - 1.2 + s[0] * 2.4, 2.2 - ((s[1] * 2.2 + t * 0.5) % 2.2), P1.z - 1 + s[2] * 2); }); }
  if (sh.snow === 'melt') { const m = sstep(0.25, 0.85, u); snow.position.copy(P1); snow.scale.set(1 - m * 0.95, 0.8 * (1 - m * 0.97), 1 - m * 0.95); snow.visible = m < 0.99; puddle1.position.set(P1.x, 0.012, P1.z); puddle1.scale.setScalar(0.2 + m * 0.9); FOOD.visible = m > 0.7;
    sun.intensity = 2.9 + 1.6 * sstep(0.05, 0.3, u); hemi.intensity = 0.55 + 0.3 * sstep(0.05, 0.3, u); if (u > 0.1) L('summer', P1.x, 1.0, P1.z, 0.75); }
  // ice
  ice.visible = !!sh.ice; puddle2.visible = sh.ice === 'melt' || (!!sh.morph && mo < 0.5); drips.forEach(d => d.visible = sh.ice === 'melt');
  if (sh.ice === 'set') { const d = sstep(0.1, 0.7, u); ice.scale.setScalar(1); ice.position.y = 0.8 + 0.25 + (1 - d) * 1.2; }
  if (sh.ice === 'melt') { const c = Math.min(2.999, u * 3), ph = c % 1, d = Math.floor(c); const s = 1 - sstep(0.05, 0.85, ph) * 0.88; ice.scale.set(s, s, s); ice.position.y = 0.8 + 0.25 * s; L(['day1', 'day2', 'day3'][d], -0.1, 1.55, 0.1, 0.6); puddle2.scale.setScalar(0.3 + u * 0.7); if (u > 0.88) L('melt', -0.1, 1.33, 0.1, 0.75);
    drips.forEach((dp, k) => { const ph2 = (t * 1.4 + k * 0.1) % 1; dp.position.set(-0.75 + (k % 5) * 0.06, 0.8 - ph2 * 0.8, 0.52); }); }
  if (sh.morph) puddle2.scale.setScalar(Math.max(0.001, 1 - mo));
  // flow + heat
  const flowOn = !!sh.flow; parts.forEach((m, k) => { m.visible = PIPES.visible && flowOn; const s = (k / NPT + t * 0.07) % 1; m.position.copy(curve.getPointAt(s)); m.material.color.copy(heatAt(s)); });
  pumpFan.rotation.y = flowOn ? t * 12 : 0; pumpFan.visible = pump.visible; pump.scale.setScalar(flowOn ? 1 + Math.sin(t * 20) * 0.015 : 1);
  heat.forEach((h, k) => { h.visible = PIPES.visible && !!sh.hot; const ph = (t * 0.5 + k * 0.17) % 1; h.position.y = 0.8 + ph * 0.45; h.material.opacity = 1 - ph; });
  wisps.forEach((w) => { w.visible = !!sh.wisps; if (!sh.wisps) return; const s = w.userData.s; const ph = (t * 0.45 + s[0]) % 1; const a = new THREE.Vector3(0.15 + (s[1] - 0.5) * 0.3, 0.2, 0.1 + (s[2] - 0.5) * 0.2), b = new THREE.Vector3(-0.4 + s[1] * 0.9, 0.45 + s[2] * 0.35, ZI + 0.03); w.position.lerpVectors(a, b, ph); w.position.y += Math.sin(ph * Math.PI) * 0.1; w.material.opacity = Math.sin(ph * Math.PI) * 0.9; });
  mist.forEach((m, k) => { m.visible = BOX.visible && (!!sh.frost || (!!sh.wisps && u > 0.5)); const s = m.userData.s; m.position.set(-0.6 + s[0] * 1.2 + Math.sin(t * 0.5 + k) * 0.05, 0.1 + s[1] * 0.8 + Math.sin(t * 0.7 + k) * 0.03, -0.4 + s[2] * 0.8); });
  const fz = sh.frost ? 1 : (sg.shot === 'absorb' ? sstep(0.5, 1, u) * 0.4 : 0); frost.forEach((f, k) => { f.visible = FOOD.visible && fz > k / 50; f.position.copy(frostPos[k]); }); if (fz > 0) { meatM.color.lerp(FROSTC, fz * 0.3); cheeseM.color.lerp(FROSTC, fz * 0.2); }
  if (sg.shot === 'pipes' && u > 0.5) L('liquid', -0.1, 1.22, -0.3, 0.6);
  if (sg.shot === 'absorb' && u > 0.15) L('heatL', 0.15, 0.62, 0.15, 0.45);
  if (sg.shot === 'pump') { if (u > 0.1) L('pumpL', 0.45, 0.52, -1.0, 0.5); if (u > 0.45) L('out', -0.1, 1.5, -0.7, 0.75); }
  if (sg.shot === 'loop' && u > 0.45) L('back', -0.1, 1.2, 0, 0.6);
  // fridge
  FRIDGE.visible = !!sh.fridge; if (sh.fridge) { const g = sh.fridge === 'grow' ? sstep(0.0, 0.4, u) : 1; const b = 1 + Math.sin(Math.min(1, g) * Math.PI) * 0.05; FRIDGE.scale.set(b * (0.5 + 0.5 * g), 0.45 + 0.55 * g, b * (0.5 + 0.5 * g)); FRIDGE.rotation.y = (1 - g) * 0.8 + 0.1;
    const xr = sh.fridge === 'xray' ? (sg.shot === 'end' ? 1 : sstep(0.15, 0.5, u)) : 0; const trn = xr > 0; if (fwM.transparent !== trn) { fwM.transparent = trn; fwM.needsUpdate = true; } fwM.opacity = 1 - 0.7 * xr; fwM.depthWrite = xr < 0.5; FPIPE.visible = xr > 0.05;
    fparts.forEach((m, k) => { const s = (k / 120 + t * 0.07) % 1; m.position.copy(curve.getPointAt(s)); m.material.color.copy(heatAt(s)); }); }
  // you
  guy.visible = !!sh.guy; if (sh.guy) { guy.position.set(sh.guy[0], 0, sh.guy[1]); guy.rotation.y = sh.guy[2]; pose(false, t); guy.position.y = Math.sin(t * 2.2) * 0.008; arms[0].rotation.set(0, 0, 0); arms[1].rotation.set(0, 0, 0); head.rotation.set(0, Math.sin(t * 0.8) * 0.12, 0);
    if (sg.shot === 'rot' && u > 0.45) { arms[1].rotation.x = -2.2; arms[1].rotation.z = 0.5; head.rotation.x = -0.15; }
    if (sh.fridge && (sg.shot !== 'done' || u > 0.35)) { arms[0].rotation.z = -2.6; arms[1].rotation.z = 2.6; } }
  // camera + smoothing
  cam.position.lerpVectors(new THREE.Vector3(...sh.cam[0]), new THREE.Vector3(...sh.cam[1]), e); cam.position.x += Math.sin(t * 0.6) * 0.02; cam.position.y += Math.sin(t * 0.8) * 0.012;
  const look = new THREE.Vector3(...sh.look[0]).lerp(new THREE.Vector3(...sh.look[1]), e);
  window._shot = sg.shot; const J = window._J || (window._J = new Map());
  [[arms[0], 0.15], [arms[1], 0.15], [head, 0.12]].forEach(([o, k]) => { const p = J.get(o); const tg = [o.rotation.x, o.rotation.y, o.rotation.z]; if (!p) { J.set(o, tg); return; } for (let q = 0; q < 3; q++) p[q] += (tg[q] - p[q]) * k; o.rotation.set(p[0], p[1], p[2]); });
  cam.lookAt(look); R.render(scene, cam); return sg.shot;
};
