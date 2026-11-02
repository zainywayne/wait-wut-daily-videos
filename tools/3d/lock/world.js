// 3D world for "how tap water works". Runs in the page; exposes window.renderAt(t).
const W = 720, H = 1280;
const canvas = document.getElementById('c');
const R = new THREE.WebGLRenderer({ canvas, antialias: true });
R.setSize(W, H, false); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const SKY = new THREE.Color(0x9cc8ec), NIGHT = new THREE.Color(0x0e1630);
scene.background = SKY.clone(); scene.fog = new THREE.Fog(0xb8d6ee, 30, 90);
const cam = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.6); sun.position.set(-12, 20, 14); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 }); sun.shadow.bias = -0.0005;
scene.add(sun); const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5a6b3a, 1.1); scene.add(hemi);
const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9, flatShading: true }, o));
function mesh(g, m, x = 0, y = 0, z = 0, parent = scene) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ground, hills, mountains
const ground = mesh(new THREE.PlaneGeometry(220, 220, 60, 60), M(0x6f9e4c)); ground.rotation.x = -Math.PI / 2;
{ const p = ground.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.hypot(x + 8, y - 0); p.setZ(i, d > 26 ? (Math.sin(x * 0.15) + Math.cos(y * 0.13)) * 0.9 : 0); } ground.geometry.computeVertexNormals(); }
for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.25; const r = 70 + rnd() * 15; const h = 14 + rnd() * 12; const m = mesh(new THREE.ConeGeometry(12 + rnd() * 8, h, 6), M(i % 2 ? 0x8a97a8 : 0x7a889a), Math.sin(a) * r - 8, h / 2 - 1, -Math.cos(a) * r); m.castShadow = false;
  const cap = mesh(new THREE.ConeGeometry((12 + 4) * 0.32, h * 0.3, 6), M(0xf2f5fa), m.position.x, h - 1 - h * 0.15, m.position.z); cap.castShadow = false; }
function pine(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); mesh(new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 1 * s, 6), M(0x6b4a2f), 0, 0.5 * s, 0, g);
  for (let i = 0; i < 3; i++) mesh(new THREE.ConeGeometry((1.2 - i * 0.3) * s, 1.6 * s, 7), M(i % 2 ? 0x2f6b3f : 0x3a7a48), 0, (1.3 + i * 0.75) * s, 0, g); return g; }
function rock(x, z, s = 1) { const r = mesh(new THREE.DodecahedronGeometry(0.5 * s, 0), M(0x8d8a86)); r.position.set(x, 0.25 * s, z); r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); r.scale.y = 0.6; return r; }
for (let i = 0; i < 70; i++) { const x = -40 + rnd() * 70, z = -30 + rnd() * 34; if (Math.abs(x) < 14 && z > -12) continue; pine(x, z, 0.8 + rnd() * 0.9); }


// character v2 (smooth, detailed)
const SKIN = 0xe3b48e, SHIRT = 0x3f7fd0, PANTS = 0x37405a, HAIRC = 0x3a2416;
const SM = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75, flatShading: false }, o));
const guy = new THREE.Group(); scene.add(guy);
const torso = mesh(new THREE.LatheGeometry([[0.001, 0], [0.22, 0.0], [0.25, 0.12], [0.24, 0.36], [0.29, 0.55], [0.25, 0.64], [0.12, 0.7], [0.001, 0.71]].map(([x, y]) => new THREE.Vector2(x, y)), 28), SM(SHIRT), 0, 0.84, 0, guy); torso.scale.z = 0.72;
mesh(new THREE.TorusGeometry(0.225, 0.025, 8, 28), SM(0x2b2b30), 0, 0.88, 0, guy).rotation.x = Math.PI / 2;
mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.12, 12), SM(SKIN), 0, 1.58, 0, guy);
const head = mesh(new THREE.SphereGeometry(0.2, 32, 24), SM(SKIN), 0, 1.81, 0, guy); head.scale.set(0.92, 1.05, 0.96);
for (const sx of [-1, 1]) { mesh(new THREE.SphereGeometry(0.045, 12, 10), SM(0xd9a47c), sx * 0.185, 1.8, -0.01, guy).scale.set(0.5, 1, 0.8); }
mesh(new THREE.SphereGeometry(0.032, 12, 10), SM(0xd9a47c), 0, 1.78, 0.195, guy).scale.set(1, 1.2, 1);
for (const sx of [-1, 1]) {
  mesh(new THREE.SphereGeometry(0.036, 14, 12), SM(0xffffff, { roughness: 0.3 }), sx * 0.07, 1.84, 0.17, guy);
  mesh(new THREE.SphereGeometry(0.02, 12, 10), SM(0x23170f, { roughness: 0.2 }), sx * 0.07, 1.84, 0.2, guy);
  mesh(new THREE.SphereGeometry(0.007, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), sx * 0.07 + 0.006, 1.848, 0.218, guy);
  const brow = mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 8), SM(HAIRC), sx * 0.07, 1.9, 0.18, guy); brow.rotation.z = Math.PI / 2 + sx * 0.12;
}
const mouth = mesh(new THREE.TorusGeometry(0.04, 0.009, 8, 16, Math.PI), SM(0x8a3a30), 0, 1.735, 0.18, guy); mouth.rotation.z = Math.PI;
const hairG = new THREE.Group(); hairG.position.set(0, 1.81, 0); guy.add(hairG);
const hm = SM(HAIRC, { roughness: 0.9 });
mesh(new THREE.SphereGeometry(0.21, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), hm, 0, 0.03, -0.01, hairG).scale.set(0.98, 1.05, 1.02);
[[-0.1, 0.17, 0.12, 0.08], [0.0, 0.19, 0.13, 0.085], [0.1, 0.16, 0.12, 0.08], [-0.15, 0.1, 0.05, 0.07], [0.15, 0.1, 0.05, 0.07], [0, 0.12, -0.15, 0.1], [-0.12, 0.06, -0.12, 0.08], [0.12, 0.06, -0.12, 0.08]].forEach(([x, y, z, r]) => mesh(new THREE.SphereGeometry(r, 14, 12), hm, x, y, z, hairG));
const legs = [], arms = [];
for (const sx of [-1, 1]) {
  const lg = new THREE.Group(); lg.position.set(sx * 0.12, 0.86, 0); guy.add(lg);
  mesh(new THREE.CapsuleGeometry(0.1, 0.62, 6, 14), SM(PANTS), 0, -0.4, 0, lg);
  const shoe = mesh(new THREE.CapsuleGeometry(0.075, 0.14, 6, 12), SM(0xf2f2f2, { roughness: 0.5 }), 0, -0.82, 0.05, lg); shoe.rotation.x = Math.PI / 2; shoe.scale.set(1.15, 1, 0.75);
  mesh(new THREE.BoxGeometry(0.17, 0.02, 0.27), SM(0x30303a), 0, -0.86, 0.05, lg);
  legs.push(lg);
  const ar = new THREE.Group(); ar.position.set(sx * 0.29, 1.48, 0); guy.add(ar);
  mesh(new THREE.CapsuleGeometry(0.08, 0.2, 6, 12), SM(SHIRT), 0, -0.14, 0, ar);
  mesh(new THREE.CapsuleGeometry(0.058, 0.3, 6, 12), SM(SKIN), 0, -0.42, 0, ar);
  mesh(new THREE.SphereGeometry(0.068, 14, 12), SM(SKIN), 0, -0.64, 0.01, ar).scale.set(0.9, 1.1, 0.75);
  arms.push(ar);
}
const bucket = mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.35, 16), SM(0x8d99a6, { metalness: 0.5 }), 0, -0.8, 0.05, arms[1]);
function pose(walk, t) { const s = walk ? Math.sin(t * 9) * 0.6 : 0; legs[0].rotation.x = s; legs[1].rotation.x = -s; arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = walk ? s * 0.3 : 0; guy.position.y = walk ? Math.abs(Math.sin(t * 9)) * 0.05 : 0; }

bucket.visible = false;
const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const V = (a) => new THREE.Vector3(...a);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// thief = recoloured clone of the character
const thief = guy.clone(true); scene.add(thief);
thief.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); const c = o.material.color.getHex(); if (c === SHIRT) o.material.color.set(0x22252b); if (c === PANTS) o.material.color.set(0x15161a); if (c === HAIRC) o.material.color.set(0x111111); } });
const mask = mesh(new THREE.BoxGeometry(0.42, 0.09, 0.05), SM(0x111111), 0, 1.84, 0.205, thief);
const knife = mesh(new THREE.BoxGeometry(0.03, 0.04, 0.32), SM(0xd8d8e0, { metalness: 0.9, roughness: 0.2 }), 0.3, 0.86, 0.2, thief); knife.visible = false;
// house
const HOUSE = new THREE.Group(); HOUSE.position.set(0, 0, -5); scene.add(HOUSE);
mesh(new THREE.BoxGeometry(7, 3.4, 5), M(0xe0cfae), 0, 1.7, 0, HOUSE); const roof = mesh(new THREE.ConeGeometry(5.4, 2.4, 4), M(0x9a4a32), 0, 4.6, 0, HOUSE); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.75;
const door = new THREE.Group(); door.position.set(-0.6, 0, 2.52); HOUSE.add(door); mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), M(0x7a4e30), 0.6, 1.1, 0, door);
const bracket = mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), M(0x5a3a22), 1.5, 1.2, 0.12, HOUSE); bracket.position.set(0.9, 1.2, 2.62);
const bolt = mesh(new THREE.BoxGeometry(1.0, 0.16, 0.12), M(0xb08050), 0, 1.2, 2.66, HOUSE);
const handle = mesh(new THREE.SphereGeometry(0.06, 10, 8), SM(0xd4af37, { metalness: 0.9, roughness: 0.3 }), 1.05, 1.0, 0.07, door);
mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), M(0x9fd0f0), 2.1, 1.9, 2.52, HOUSE);
// chest with gold
const CHEST = new THREE.Group(); CHEST.position.set(1.2, 0, 0.5); scene.add(CHEST);
const wood = M(0x8a5a30), band = SM(0x5a5a62, { metalness: 0.8, roughness: 0.4 });
mesh(new THREE.BoxGeometry(1.4, 0.7, 0.9), wood, 0, 0.35, 0, CHEST); for (const x of [-0.5, 0.5]) mesh(new THREE.BoxGeometry(0.08, 0.72, 0.92), band, x, 0.36, 0, CHEST);
const lid = new THREE.Group(); lid.position.set(0, 0.7, -0.45); CHEST.add(lid); const lidm = mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.4, 16, 1, false, 0, Math.PI), wood, 0, 0, 0.45, lid); lidm.rotation.z = Math.PI / 2; lidm.rotation.y = 0;
const gold = []; for (let i = 0; i < 9; i++) { const g = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 14), SM(0xffcc33, { metalness: 0.9, roughness: 0.25, emissive: 0x332200 }), -0.45 + (i % 3) * 0.45, 0.72 + Math.floor(i / 3) * 0.05, -0.2 + (i % 2) * 0.3, CHEST); gold.push(g); }
const ropes = []; for (const x of [-0.3, 0.3]) { const r = mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 24), M(0xb59a6a), x, 0.55, 0, CHEST); r.rotation.y = Math.PI / 2; r.scale.set(1, 1, 0.75); ropes.push(r); }
const boulder = mesh(new THREE.DodecahedronGeometry(0.75, 1), M(0x8d8a86), 0, 1.6, 0, CHEST);
// ---------- lock cutaway (macro, far away) ----------
const LOCK = new THREE.Group(); LOCK.position.set(0, 0, 200); scene.add(LOCK);
const lockLight = new THREE.DirectionalLight(0xffffff, 2.2); lockLight.position.set(3, 6, 210); lockLight.target = LOCK; scene.add(lockLight);
const housing = mesh(new THREE.BoxGeometry(4.6, 2.6, 1.3), new THREE.MeshStandardMaterial({ color: 0xc9c9cf, metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0.35, depthWrite: false }), 0, 0.5, 0, LOCK); housing.castShadow = false;
const PLUG = new THREE.Group(); LOCK.add(PLUG);
const plug = mesh(new THREE.CylinderGeometry(0.62, 0.62, 4.4, 40), new THREE.MeshStandardMaterial({ color: 0xd4a23a, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.55, depthWrite: false }), 0, 0, 0, PLUG); plug.rotation.z = Math.PI / 2; plug.castShadow = false;
const shear = mesh(new THREE.BoxGeometry(4.8, 0.035, 1.35), new THREE.MeshBasicMaterial({ color: 0xffd23f }), 0, 0.62, 0, LOCK); shear.castShadow = false;
const PX = [-1.6, -0.8, 0, 0.8, 1.6], KP = [0.55, 0.3, 0.7, 0.4, 0.62], DP = 0.55, FLOOR = -0.35;
const keyPins = [], drvPins = [], springs = [];
PX.forEach((x, i) => { const kp = mesh(new THREE.CylinderGeometry(0.13, 0.13, KP[i], 20), SM(0xd84a3a, { metalness: 0.4 }), x, 0, 0, PLUG); keyPins.push(kp);
  const dp = mesh(new THREE.CylinderGeometry(0.13, 0.13, DP, 20), SM(0x3a7ad8, { metalness: 0.4 }), x, 0, 0, LOCK); drvPins.push(dp);
  const pts = Array.from({ length: 60 }, (_, j) => new THREE.Vector3(0.11 * Math.cos(j * 0.9), j / 59, 0.11 * Math.sin(j * 0.9))); const sp = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.018, 5), SM(0xbfc3c8, { metalness: 0.9, roughness: 0.3 }), x, 0, 0, LOCK); springs.push(sp); });
const KEY = new THREE.Group(); PLUG.add(KEY);
function keyShape(lifts) { const sh = new THREE.Shape(); sh.moveTo(-5.2, -0.48); sh.lineTo(2.1, -0.48); sh.lineTo(2.3, FLOOR - 0.1); PX.forEach((x, i) => { const top = FLOOR + lifts[i] - 0.06; sh.lineTo(x + 0.2, top - 0.1); sh.lineTo(x, top); sh.lineTo(x - 0.2, top - 0.1); }); sh.lineTo(-2.1, FLOOR - 0.12); sh.lineTo(-5.2, FLOOR - 0.12); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }); g.translate(0, 0, -0.06); return g; }
const goodLift = KP.map(k => 0.62 - (FLOOR + k)), badLift = [0.2, 0.55, 0.05, 0.4, 0.1];
const keyGood = mesh(keyShape(goodLift), SM(0xd4af37, { metalness: 0.85, roughness: 0.3 }), 0, 0, 0, KEY);
const keyBad = mesh(keyShape(badLift), SM(0xb8bcc4, { metalness: 0.85, roughness: 0.3 }), 0, 0, 0, KEY);
const bow = mesh(new THREE.TorusGeometry(0.55, 0.16, 10, 24), SM(0xd4af37, { metalness: 0.85, roughness: 0.3 }), -5.6, -0.1, 0, KEY);
function labelS(txt, col) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.font = 'bold 72px sans-serif'; g.fillStyle = col || '#ffd23f'; g.strokeStyle = '#111'; g.lineWidth = 10; g.textAlign = 'center'; g.strokeText(txt, 256, 90); g.fillText(txt, 256, 90); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(2.6, 0.65, 1); s.renderOrder = 10; scene.add(s); s.visible = false; return s; }
const LB = { pins: labelS('PINS'), key: labelS('KEY'), shear: labelS('SHEAR LINE'), locked: labelS('✕ STUCK', '#ff4a3a'), open: labelS('✓ OPEN', '#5aff7a'), springs: labelS('SPRINGS') };
// ---------- shots ----------
const SHOTS = {
  gold:   { cam: [[4.5, 2.4, 5.5], [3.6, 2.0, 4.2]], look: [[1.2, 0.6, 0.5], [1.2, 0.6, 0.5]], lid: 1, guy: [ -0.6, 0, 2.2, 2.4] },
  steal:  { cam: [[4.5, 2.2, 5.0], [4.0, 2.0, 4.4]], look: [[1.2, 0.6, 0.5], [1.4, 0.6, 0.5]], steal: true },
  rope:   { cam: [[4.0, 1.8, 3.8], [3.4, 1.6, 3.2]], look: [[1.2, 0.5, 0.5], [1.2, 0.5, 0.5]], rope: true, cut: true },
  rock:   { cam: [[4.4, 2.2, 4.4], [3.8, 2.0, 3.8]], look: [[1.2, 0.8, 0.5], [1.2, 0.7, 0.5]], rock: true, push: true },
  bolt:   { cam: [[2.8, 1.7, 0.6], [2.2, 1.6, -0.4]], look: [[0.3, 1.2, -2.4], [0.3, 1.2, -2.4]], bolt: true, guy: [1.8, 0, -1.4, Math.PI * 0.95] },
  pins:   { lock: true, cam: [[0, 0.5, 212.5], [0, 0.4, 211.4]], look: [[0, 0.4, 200], [0, 0.3, 200]], key: 'none', wobble: true },
  key:    { lock: true, cam: [[0, 0.4, 211.4], [0, 0.3, 210.8]], look: [[0, 0.3, 200], [-0.3, 0.3, 200]], key: 'good' },
  bad:    { lock: true, cam: [[1.0, 0.9, 211.8], [0.5, 0.6, 211.0]], look: [[0, 0.4, 200], [0, 0.4, 200]], key: 'bad' },
  done:   { cam: [[0.6, 1.7, 3.6], [0.2, 1.6, 2.6]], look: [[-0.2, 1.2, -2.4], [-0.2, 1.1, -2.4]], doorOpen: true, guy: [-0.1, 0, -1.6, Math.PI] },
  fact:   { cam: [[3, 3, 9], [2, 3.4, 12]], look: [[0, 1.6, -3], [0, 1.8, -4]], thiefLeave: true, guy: [-0.1, 0, -1.6, Math.PI] },
  end:    { cam: [[2, 3.4, 12], [2, 3.4, 12]], look: [[0, 1.8, -4], [0, 1.8, -4]], guy: [-0.1, 0, -1.6, Math.PI] },
};
let TIMING = null; window.setTiming = (t) => { TIMING = t; };
function placePins(lifts, keyIn) { PX.forEach((x, i) => { const l = lifts[i] * keyIn[i]; const kb = FLOOR + l; keyPins[i].position.set(x, kb + KP[i] / 2, 0); const dt = kb + KP[i]; drvPins[i].position.set(x, dt + DP / 2, 0); const top = 1.75; const sb = dt + DP; springs[i].position.set(x, sb, 0); springs[i].scale.set(1, Math.max(0.05, top - sb), 1); }); }
window.renderAt = (t) => {
  const segs = TIMING.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SHOTS[sg.shot], lt = t - sg.start, pr = Math.min(1, lt / sg.dur), e = ease(pr);
  Object.values(LB).forEach(l => l.visible = false);
  const inLock = !!sh.lock; LOCK.visible = inLock; scene.background.set(inLock ? 0x101624 : 0x9cc8ec); scene.fog.color.set(inLock ? 0x101624 : 0xb8d6ee); scene.fog.near = inLock ? 14.5 : 30; scene.fog.far = inLock ? 18 : 90;
  // chest state
  lid.rotation.x = sh.lid ? -1.3 * Math.min(1, lt / 0.8) : 0;
  ropes.forEach((r, k) => { r.visible = !!sh.rope && !(sh.cut && lt > 2.2); });
  boulder.visible = !!sh.rock; if (sh.rock) { const p = sh.push ? sstep(1.6, 2.8, lt) : 0; boulder.position.set(p * 1.6, 1.6 - p * 1.2 * p, 0); boulder.rotation.z = -p * 3; }
  gold.forEach((g, k) => g.visible = !(sh.steal && lt > 0.9 + k * 0.05));
  thief.visible = !!(sh.steal || sh.cut || sh.push || sh.thiefLeave); knife.visible = !!sh.cut; thief.rotation.set(0, 0, 0);
  if (sh.steal) { const a = sstep(0, 0.6, lt), b = sstep(1.4, 2.1, lt); lid.rotation.x = -1.3 * sstep(0.6, 0.9, lt); thief.position.set(4 - a * 1.6 + b * 4, 0, 1.6 - a * 0.4); thief.rotation.y = b > 0 ? Math.PI / 2 : -Math.PI / 2 - 0.4; }
  if (sh.cut) { const a = sstep(0, 1.0, lt), b = sstep(2.4, 2.9, lt); thief.position.set(-2.4 + a * 2.0 - b * 3, 0, 0.6); thief.rotation.y = b > 0 ? -Math.PI / 2 : Math.PI / 2; knife.rotation.y = Math.sin(lt * 14) * 0.5 * (lt > 1.0 && lt < 2.2); }
  if (sh.push) { const a = sstep(0, 1.4, lt); thief.position.set(-1.8 + a * 1.6, 0, 0.6); thief.rotation.y = Math.PI / 2; }
  if (sh.thiefLeave) { thief.position.set(1.5 + pr * 6, 0, 3); thief.rotation.y = Math.PI / 2; }
  // house bolt + door
  bolt.position.x = sh.bolt ? 0.2 + 0.5 * sstep(0.6, 1.6, lt) : 0.7; door.rotation.y = sh.doorOpen ? -1.2 * sstep(2.0, 3.2, lt) : 0;
  CHEST.visible = !inLock && !sh.bolt;
  // lock cutaway
  if (inLock) { let keyX = -9, lifts = goodLift, rot = 0; keyGood.visible = sh.key === 'good'; keyBad.visible = sh.key === 'bad'; bow.visible = sh.key !== 'none';
    if (sh.key === 'none') { placePins(goodLift, [0, 0, 0, 0, 0]); rot = sh.wobble && lt > 2.5 ? Math.sin(lt * 30) * 0.03 : 0; LB.pins.visible = lt > 0.6; LB.pins.position.set(-1.2, 2.3, 200); LB.springs.visible = lt > 1.6; LB.springs.position.set(1.2, 2.3, 200); if (lt > 2.5) { LB.locked.visible = true; LB.locked.position.set(0, -1.3, 200); } }
    else { lifts = sh.key === 'good' ? goodLift : badLift; keyX = -9 + 9 * sstep(0.3, 2.4, lt); const kin = PX.map(x => sstep(0, 0.45, keyX + 2.2 - (x + 0.25)) ); placePins(lifts, kin);
      if (sh.key === 'good') { rot = -Math.PI / 2 * sstep(4.2, 5.4, lt); if (lt > 2.6) { LB.shear.visible = true; LB.shear.position.set(0.6, 2.3, 200); } LB.key.visible = lt > 0.6 && lt < 2.6; LB.key.position.set(-1.0, -1.3, 200); if (lt > 5.4) { LB.open.visible = true; LB.open.position.set(0, -1.4, 200); } }
      else { rot = lt > 2.6 ? Math.sin(lt * 30) * 0.03 : 0; if (lt > 2.6) { LB.locked.visible = true; LB.locked.position.set(0, -1.3, 200); } } }
    KEY.position.set(keyX, 0, 0); PLUG.rotation.x = rot; }
  // character
  guy.visible = !inLock && !!sh.guy; if (sh.guy) { guy.position.set(sh.guy[0], sh.guy[1], sh.guy[2]); guy.rotation.y = sh.guy[3]; pose(false, t); arms[0].rotation.set(0, 0, 0); arms[1].rotation.set(0, 0, 0); if (sh.bolt && lt < 1.8) arms[1].rotation.x = -1.4; if (sh.doorOpen && lt > 0.6 && lt < 2.4) arms[1].rotation.x = -1.2; }
  if (sh.bolt) { guy.position.set(-0.1, 0, -1.4); guy.rotation.y = Math.PI; }
  cam.position.lerpVectors(V(sh.cam[0]), V(sh.cam[1]), e); cam.position.x += Math.sin(t * 0.7) * 0.03; cam.position.y += Math.sin(t * 0.9) * 0.02;
  cam.lookAt(new THREE.Vector3().lerpVectors(V(sh.look[0]), V(sh.look[1]), e));
  R.render(scene, cam); return sg.shot;
};
