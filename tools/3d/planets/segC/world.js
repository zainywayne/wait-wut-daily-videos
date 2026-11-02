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
for (let i = 0; i < 70; i++) { const x = -40 + rnd() * 70, z = -30 + rnd() * 34; if (Math.hypot(x + 6, z + 1) < 9 || (z > -9 && z < 3 && x > -18 && x < 12)) continue; pine(x, z, 0.8 + rnd() * 0.9); }
for (let i = 0; i < 30; i++) rock(-30 + rnd() * 50, -14 + rnd() * 24, 0.5 + rnd());

// lake
const LAKE = new THREE.Vector3(-20, 0.04, -6);
const lake = mesh(new THREE.CircleGeometry(7, 40), M(0x3b88c8, { roughness: 0.2, metalness: 0.1, flatShading: false })); lake.rotation.x = -Math.PI / 2; lake.position.copy(LAKE); lake.receiveShadow = true;
const shore = mesh(new THREE.RingGeometry(7, 7.8, 40), M(0xcdb98a)); shore.rotation.x = -Math.PI / 2; shore.position.set(LAKE.x, 0.03, LAKE.z);

// house builder
function house(x, z, ry = 0, wall = 0xe8dcc6, roof = 0xa8473a) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  mesh(new THREE.BoxGeometry(4, 2.6, 3.4), M(wall), 0, 1.3, 0, g); const r = mesh(new THREE.ConeGeometry(3.3, 1.8, 4), M(roof), 0, 3.5, 0, g); r.rotation.y = Math.PI / 4; r.scale.z = 0.85;
  mesh(new THREE.BoxGeometry(0.9, 1.6, 0.08), M(0x7a4e30), -0.9, 0.8, 1.72, g); const win = mesh(new THREE.BoxGeometry(1, 0.8, 0.06), M(0x9fd0f0, { emissive: 0x000000 }), 0.9, 1.5, 1.72, g);
  mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), M(0x9a5a44), 1.1, 4.0, -0.4, g); g.userData.win = win; return g; }
const HOME = house(2, 0, 0);
// outdoor tap + basin on the front wall
const tapG = new THREE.Group(); tapG.position.set(1.0, 0, 1.72); HOME.add(tapG);
mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 10), M(0xb8b8c0, { metalness: 0.8, roughness: 0.3 }), 0, 1.1, 0.2, tapG).rotation.x = Math.PI / 2;
mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 10), M(0xb8b8c0, { metalness: 0.8, roughness: 0.3 }), 0, 1.0, 0.38, tapG);
const handle = mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 12), M(0xc0392b), 0, 1.25, 0.25, tapG); handle.rotation.x = Math.PI / 2;
mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.35, 16, 1, true), M(0x9aa3ad, { side: THREE.DoubleSide }), 0, 0.18, 0.4, tapG);
const STREAM_MAT = new THREE.MeshStandardMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.75, roughness: 0.1 });
const stream = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.85, 8), STREAM_MAT, 0, 0.5, 0.38, tapG); stream.castShadow = false;
const drops = []; for (let i = 0; i < 8; i++) { const d = mesh(new THREE.SphereGeometry(0.04, 6, 6), STREAM_MAT, 0, 0.2, 0.4, tapG); d.castShadow = false; drops.push(d); }
const basinWater = mesh(new THREE.CircleGeometry(0.4, 20), STREAM_MAT, 0, 0.12, 0.4, tapG); basinWater.rotation.x = -Math.PI / 2;

// pipes
const PIPE_M = M(0x5d6670, { metalness: 0.4, roughness: 0.5 });
function pipe(a, b, r = 0.14) { const d = new THREE.Vector3().subVectors(b, a); const m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), PIPE_M); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return m; }
const P = (x, y, z) => new THREE.Vector3(x, y, z);
const pipeLake = [pipe(P(-13.5, 0.15, -5), P(-10, 0.15, -3)), pipe(P(-10, 0.15, -3), P(-2, 0.15, -1)), pipe(P(-2, 0.15, -1), P(3.0, 0.15, 1.9)), pipe(P(3.0, 0.15, 1.9), P(3.0, 1.1, 1.9), 0.07)];
// water tower
const TOWER = new THREE.Group(); TOWER.position.set(-6, 0, -2.5); scene.add(TOWER);
for (const [lx, lz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 8), M(0x7d8792), lx, 4, lz, TOWER);
mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 24), M(0x86b6d6, { flatShading: false }), 0, 9.5, 0, TOWER); mesh(new THREE.ConeGeometry(2.4, 1.2, 24), M(0x6c97b4), 0, 11.6, 0, TOWER);
mesh(new THREE.CylinderGeometry(0.14, 0.14, 8, 8), PIPE_M, 0, 4, 0, TOWER);
const towerPipes = [pipe(P(-6, 0.15, -2.5), P(-2, 0.15, -1))];
// filter tank (glass cylinder with layers) + chlorine jug
const FILTER = new THREE.Group(); FILTER.position.set(-11, 0, -1.2); scene.add(FILTER);
const layers = [[0x6b6b6b, 0.5], [0x9a9a92, 0.5], [0xd9c48c, 0.7], [0x2c2c2c, 0.3]]; let ly = 0.1;
for (const [c, h] of layers) { mesh(new THREE.CylinderGeometry(1.05, 1.05, h, 24), M(c), 0, ly + h / 2, 0, FILTER); ly += h; }
const fwater = mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.8, 24), new THREE.MeshStandardMaterial({ color: 0x7a5a30, transparent: true, opacity: 0.8 }), 0, ly + 0.4, 0, FILTER);
const glass = mesh(new THREE.CylinderGeometry(1.15, 1.15, 3.2, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide }), 0, 1.6, 0, FILTER); glass.castShadow = false;
const JUG = new THREE.Group(); JUG.position.set(-9, 0, 0.6); scene.add(JUG);
mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), M(0xf4f6f8), 0, 0.45, 0, JUG); mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 10), M(0x2e86de), 0.15, 1.0, 0, JUG);
mesh(new THREE.BoxGeometry(0.5, 0.25, 0.02), M(0x2e86de), 0, 0.5, 0.26, JUG);
const filterPipes = [pipe(P(-11, 0.15, -1.2), P(-10, 0.15, -3))];
// town
const TOWN = [], townPipes = [];
[[8, -2, 0xf1e3c8, 0x3f6fa8], [8, 5, 0xdfe8d8, 0xa8473a], [-1, 7, 0xe8d0c0, 0x4f7f4f], [14, 1.5, 0xe8e0d0, 0x8a4fa0], [3, 11, 0xf0e8d8, 0x3f6fa8]].forEach(([x, z, w, r]) => { TOWN.push(house(x, z, (rnd() - 0.5) * 0.6, w, r)); townPipes.push(pipe(P(-2, 0.15, -1), P(x, 0.15, z))); });

// character (low-poly person)
const SKIN = 0xe0b08a, SHIRT = 0x3d7cc9, PANTS = 0x3a3f52;
const guy = new THREE.Group(); scene.add(guy);
const body = mesh(new THREE.CapsuleGeometry(0.32, 0.55, 6, 12), M(SHIRT), 0, 1.25, 0, guy);
const head = mesh(new THREE.SphereGeometry(0.27, 16, 12), M(SKIN, { flatShading: false }), 0, 1.92, 0, guy);
const hair = mesh(new THREE.SphereGeometry(0.29, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), M(0x3b2618), 0, 1.99, -0.03, guy);
for (const sx of [-1, 1]) { mesh(new THREE.SphereGeometry(0.06, 10, 10), M(0xffffff), sx * 0.09, 1.93, 0.22, guy); mesh(new THREE.SphereGeometry(0.035, 8, 8), M(0x1d1410), sx * 0.09, 1.93, 0.27, guy); }
mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12, Math.PI), M(0x7a2a20), 0, 1.84, 0.25, guy).rotation.z = Math.PI;
const legs = [], arms = [];
for (const sx of [-1, 1]) { const lg = new THREE.Group(); lg.position.set(sx * 0.15, 0.85, 0); guy.add(lg); mesh(new THREE.CapsuleGeometry(0.11, 0.5, 4, 8), M(PANTS), 0, -0.38, 0, lg); mesh(new THREE.BoxGeometry(0.2, 0.12, 0.32), M(0x2a2a2a), 0, -0.78, 0.06, lg); legs.push(lg);
  const ar = new THREE.Group(); ar.position.set(sx * 0.42, 1.55, 0); guy.add(ar); mesh(new THREE.CapsuleGeometry(0.09, 0.45, 4, 8), M(SHIRT), 0, -0.3, 0, ar); mesh(new THREE.SphereGeometry(0.1, 8, 8), M(SKIN), 0, -0.62, 0, ar); arms.push(ar); }
const bucket = mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.35, 12), M(0x8d99a6, { metalness: 0.5 }), 0, -0.8, 0.05, arms[1]);
function pose(walk, t) { const s = walk ? Math.sin(t * 9) * 0.6 : 0; legs[0].rotation.x = s; legs[1].rotation.x = -s; arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = walk ? s * 0.3 : 0; guy.position.y = walk ? Math.abs(Math.sin(t * 9)) * 0.05 : 0; }

// visibility helpers
const show = (arr, v) => arr.forEach(o => o.visible = v);
function setWorld(state) {
  show(pipeLake, state.pipe); TOWER.visible = state.tower; show(towerPipes, state.tower); FILTER.visible = state.filter; show(filterPipes, state.filter); JUG.visible = state.chlorine;
  TOWN.forEach(h => h.visible = state.town); show(townPipes, state.town);
}
const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const V = (a) => new THREE.Vector3(...a);
// shots: camera from/to, look from/to, world state, character
const ALL = { pipe: true, tower: true, filter: true, chlorine: true, town: true };
const G0 = { p: [4.1, 0, 2.7], ry: -1.9 };
const SHOTS = {
  p2a: { cam: [[14, 18, 30], [8, 12, 20]], look: [[0, 0, -2], [1, 0, 0]], st: ALL, guy: { p: [2.2, 0, 4.5], ry: 0.3 }, water: 'none' },
  p2b: { cam: [[-2, 2.2, 10], [0.5, 1.8, 8]], look: [[2, 1.2, 0], [2, 1.2, 0]], st: ALL, guy: { p: [5.2, 0, 4.0], ry: -2.2 }, water: 'none' },
  p2c: { cam: [[9, 7, 15], [6, 5, 11]], look: [[2, 1.5, 2], [3, 1.5, 3]], st: ALL, guy: { p: [2.2, 0, 4.5], ry: 0.3 }, water: 'none', night: true, onelit: true },
  thirsty: { cam: [[1.2, 1.9, 7.2], [1.9, 1.7, 5.6]], look: [[3.4, 1.3, 2.2], [3.4, 1.1, 2.2]], st: {}, guy: G0, water: 'none', twist: true },
  lake: { cam: [[0, 4, 9], [-6, 3.2, 6]], look: [[-8, 1, -2], [-16, 0.5, -5]], st: {}, guy: { from: [3.5, 0, 3.0], to: [-12.5, 0, -3.5], walk: true, bucket: true } },
  pipe: { cam: [[-16, 7, 8], [-6, 6, 10]], look: [[-10, 0, -3], [0, 0, 0]], st: { pipe: true }, grow: 'pipe', guy: { p: [-12, 0, -2], ry: 1.2 } },
  dry: { cam: [[1.5, 1.6, 5.4], [1.9, 1.35, 4.5]], look: [[3.0, 0.8, 2.1], [3.0, 0.7, 2.1]], st: { pipe: true }, guy: G0, water: 'drip', twist: true },
  tower: { cam: [[3, 2.5, 10], [1, 3.5, 9]], look: [[-6, 4, -2.5], [-6, 8, -2.5]], st: { pipe: true, tower: true }, rise: true, guy: { p: [-1, 0, 2.5], ry: 3.6 } },
  flow: { cam: [[1.5, 1.6, 5.4], [1.9, 1.35, 4.5]], look: [[3.0, 0.8, 2.1], [3.0, 0.7, 2.1]], st: { pipe: true, tower: true }, guy: G0, water: 'brown' },
  dirty: { cam: [[2.4, 1.0, 3.5], [2.7, 0.9, 3.0]], look: [[3.0, 0.5, 2.1], [3.0, 0.45, 2.1]], st: { pipe: true, tower: true }, guy: G0, water: 'brown' },
  filter: { cam: [[-7.6, 2.5, 5.6], [-9.2, 2.3, 5.0]], look: [[-11, 1.3, -1.2], [-11, 1.2, -1.2]], st: { pipe: true, tower: true, filter: true }, rise: 'filter', guy: { p: [-8.2, 0, 2.4], ry: -2.7 }, clear: true },
  chlorine: { cam: [[-6.6, 1.5, 3.6], [-7.4, 1.3, 2.9]], look: [[-9, 0.6, 0.6], [-9, 0.5, 0.6]], st: { pipe: true, tower: true, filter: true, chlorine: true }, guy: { p: [-7.6, 0, 0.0], ry: -1.4 } },
  town: { cam: [[6, 14, 22], [10, 22, 26]], look: [[2, 0, 1], [1, 0, 0]], st: ALL, guy: G0, water: 'clear' },
  tap: { cam: [[2.0, 1.4, 4.5], [2.3, 1.3, 4.0]], look: [[3.2, 0.9, 2.1], [3.2, 0.9, 2.1]], st: ALL, guy: G0, water: 'clear', twist: true, cheer: true },
  blackout: { cam: [[9, 6, 14], [6, 4, 10]], look: [[-2, 3, -1], [1, 2, 1]], st: ALL, guy: G0, water: 'clear', night: true },
  end: { cam: [[9, 6, 14], [9, 6, 14]], look: [[0, 2, 0], [0, 2, 0]], st: ALL, guy: G0, water: 'clear', night: true },
};
let TIMING = null; window.setTiming = (t) => { TIMING = t; };
window.renderAt = (t) => {
  const segs = TIMING.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SHOTS[sg.shot], lt = t - sg.start, pr = Math.min(1, lt / sg.dur), e = ease(pr);
  setWorld(Object.assign({ pipe: false, tower: false, filter: false, chlorine: false, town: false }, sh.st));
  // grow / rise animations
  if (sh.grow === 'pipe') pipeLake.forEach((p, k) => { const s = Math.min(1, Math.max(0, pr * 1.6 - k * 0.25)); p.visible = s > 0.02; p.scale.set(1, Math.max(0.01, s), 1); }); else pipeLake.forEach(p => p.scale.set(1, 1, 1));
  TOWER.position.y = sh.rise === true ? -12 * (1 - ease(Math.min(1, pr * 1.6))) : 0; FILTER.position.y = sh.rise === 'filter' ? -3.4 * (1 - ease(Math.min(1, pr * 2))) : 0;
  fwater.material.color.set(sh.clear ? (pr > 0.5 ? 0x8fd0ff : 0x7a5a30) : 0x7a5a30);
  // camera (gentle push + slight handheld drift)
  cam.position.lerpVectors(V(sh.cam[0]), V(sh.cam[1]), e); cam.position.x += Math.sin(t * 0.7) * 0.05; cam.position.y += Math.sin(t * 0.9) * 0.03;
  const lk = new THREE.Vector3().lerpVectors(V(sh.look[0]), V(sh.look[1]), e); cam.lookAt(lk);
  // character
  const g = sh.guy; bucket.visible = !!g.bucket;
  if (g.walk) { const a = V(g.from), b = V(g.to); guy.position.lerpVectors(a, b, Math.min(1, pr * 1.1)); guy.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); pose(true, t); }
  else { guy.position.set(...g.p); guy.rotation.y = g.ry; pose(false, t); arms[1].rotation.x = sh.twist && lt > 0.3 ? -1.6 + Math.sin(lt * 6) * 0.15 : 0; arms[1].rotation.z = 0;
    if (sh.cheer && pr > 0.55) { arms[0].rotation.z = -2.6; arms[1].rotation.z = 2.6; arms[1].rotation.x = 0; guy.position.y = Math.abs(Math.sin(t * 7)) * 0.15; } else arms[0].rotation.z = 0; }
  handle.rotation.z = sh.twist ? lt * 3 : 0;
  // water
  const w = sh.water || 'none'; const on = w === 'brown' || w === 'clear';
  STREAM_MAT.color.set(w === 'brown' ? 0x8a5a2b : 0x8fd0ff); stream.visible = on; basinWater.visible = on;
  if (on) { stream.scale.x = stream.scale.z = 1 + Math.sin(t * 40) * 0.15; }
  drops.forEach((d, k) => { const ph = ((t * (on ? 2.2 : 0.6) + k / drops.length) % 1); d.visible = on || (w === 'drip' && k === 0 && ph < 0.5); d.position.set(Math.sin(k * 3) * (on ? 0.06 : 0), 0.95 - ph * 0.8, 0.38 + Math.cos(k * 2) * (on ? 0.06 : 0)); });
  // day / night
  const night = !!sh.night ? Math.min(1, lt / 1.2) : 0;
  scene.background.copy(SKY).lerp(NIGHT, night); scene.fog.color.copy(new THREE.Color(0xb8d6ee)).lerp(NIGHT, night);
  sun.intensity = 2.6 * (1 - night * 0.85); hemi.intensity = 1.1 * (1 - night * 0.6);
  [HOME, ...TOWN].forEach(h => h.userData.win.material.color.set(night > 0.3 ? 0x1c2333 : 0x9fd0f0));
  if (sh.onelit) { const lit = Math.min(1, Math.max(0, (lt - 2.5) * 2)); TOWN[1].userData.win.material.color.set(lit > 0.5 ? 0xffd27a : 0x1c2333); HOME.userData.win.material.color.set(0xffd27a); }
  R.render(scene, cam);
  return sg.shot;
};

bucket.visible = false;
