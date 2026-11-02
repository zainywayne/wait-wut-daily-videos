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


// ---------------- glass / window world ----------------
const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const V = (a) => new THREE.Vector3(...a);
// ROOM (interior) at origin area x:-3..3 z:-3..3, wall with opening facing +z? -> window wall at z=-3
const ROOM = new THREE.Group(); scene.add(ROOM);
const WALLM = M(0xd9c7a6, { side: THREE.DoubleSide }), FLOORM = M(0x8a6a48);
mesh(new THREE.BoxGeometry(6, 0.1, 6), FLOORM, 0, 0, 0, ROOM);
mesh(new THREE.BoxGeometry(6, 0.1, 6), M(0xc9b796), 0, 3, 0, ROOM);
mesh(new THREE.BoxGeometry(0.2, 3, 6), WALLM, -3, 1.5, 0, ROOM); mesh(new THREE.BoxGeometry(0.2, 3, 6), WALLM, 3, 1.5, 0, ROOM);
mesh(new THREE.BoxGeometry(6, 3, 0.2), WALLM, 0, 1.5, 3, ROOM);
// window wall z=-3 with hole x:-0.9..0.9 y:1.0..2.2
const solidWall = mesh(new THREE.BoxGeometry(6, 3, 0.2), WALLM, 0, 1.5, -3, ROOM);
const holeWall = new THREE.Group(); ROOM.add(holeWall);
mesh(new THREE.BoxGeometry(2.1, 3, 0.2), WALLM, -1.95, 1.5, -3, holeWall); mesh(new THREE.BoxGeometry(2.1, 3, 0.2), WALLM, 1.95, 1.5, -3, holeWall);
mesh(new THREE.BoxGeometry(1.8, 1.0, 0.2), WALLM, 0, 0.5, -3, holeWall); mesh(new THREE.BoxGeometry(1.8, 0.8, 0.2), WALLM, 0, 2.6, -3, holeWall);
// furniture: table, rug, bed
mesh(new THREE.BoxGeometry(1.4, 0.08, 0.9), M(0x7a5232), 1.6, 0.8, 0.5, ROOM); for (const [a, b] of [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]]) mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), M(0x6a4428), 1.6 + a, 0.4, 0.5 + b, ROOM);
mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.02, 24), M(0xa83f3a), -0.6, 0.06, 0.8, ROOM);
mesh(new THREE.BoxGeometry(1.4, 0.5, 2.2), M(0x6f8fbf), -2.1, 0.3, 1.6, ROOM); mesh(new THREE.BoxGeometry(1.2, 0.2, 0.5), M(0xf2f2f2), -2.1, 0.62, 0.7, ROOM);
// what fills the hole
const skin = mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshStandardMaterial({ color: 0x9a6a3a, side: THREE.DoubleSide, roughness: 1 }), 0, 1.6, -3.0, ROOM);
const wavy = mesh(new THREE.PlaneGeometry(1.8, 1.2, 30, 20), new THREE.MeshStandardMaterial({ color: 0xbfe0d8, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide, flatShading: false }), 0, 1.6, -3.0, ROOM);
{ const p = wavy.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.09 * Math.sin(p.getX(i) * 11) * Math.cos(p.getY(i) * 9)); wavy.geometry.computeVertexNormals(); }
const flat = mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.18, roughness: 0.0, metalness: 0.5, side: THREE.DoubleSide }), 0, 1.6, -3.0, ROOM);
const winFrame = new THREE.Group(); ROOM.add(winFrame); const FR = M(0xf4f4f4);
mesh(new THREE.BoxGeometry(1.95, 0.08, 0.26), FR, 0, 1.0, -3, winFrame); mesh(new THREE.BoxGeometry(1.95, 0.08, 0.26), FR, 0, 2.2, -3, winFrame); mesh(new THREE.BoxGeometry(0.08, 1.25, 0.26), FR, -0.95, 1.6, -3, winFrame); mesh(new THREE.BoxGeometry(0.08, 1.25, 0.26), FR, 0.95, 1.6, -3, winFrame); mesh(new THREE.BoxGeometry(0.05, 1.2, 0.2), FR, 0, 1.6, -3, winFrame);
// light beam through hole + interior lamp-less ambience
const beam = mesh(new THREE.BoxGeometry(1.7, 1.1, 4), new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.12, depthWrite: false }), 0, 1.2, -1.0, ROOM); beam.rotation.x = -0.35; beam.castShadow = false; beam.receiveShadow = false;
const roomLight = new THREE.PointLight(0xfff0d0, 0, 12); roomLight.position.set(0, 2, -1.8); ROOM.add(roomLight);
// snow blowing in
const flakes = []; for (let i = 0; i < 70; i++) { const f = mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0, 0, ROOM); f.castShadow = false; f.userData.ph = rnd(); f.userData.x = (rnd() - 0.5) * 1.6; f.userData.y = 1.1 + rnd() * 1.0; flakes.push(f); }
// outside view behind window: snowy/green ground already from world; put a little tree outside
const tWin = pine(-2, -9, 1.4); pine(2.5, -10, 1.1);


// ---------------- light sources (on the table at (1.6, 0.84, 0.5) and floor) ----------------
const T = new THREE.Vector3(1.6, 0.84, 0.5);
const flameMat = () => new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.95 });
// campfire in room centre
const FIRE = new THREE.Group(); FIRE.position.set(-0.3, 0, 0.6); ROOM.add(FIRE);
for (let i = 0; i < 6; i++) { const l = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), M(0x5a3a22), 0, 0.08, 0, FIRE); l.rotation.z = Math.PI / 2; l.rotation.y = i * Math.PI / 3; }
const fireFl = []; for (let i = 0; i < 5; i++) { const f = mesh(new THREE.ConeGeometry(0.16 - i * 0.02, 0.6 - i * 0.05, 8), flameMat(), (i % 2 - 0.5) * 0.15, 0.4, ((i % 3) - 1) * 0.12, FIRE); f.castShadow = false; fireFl.push(f); }
const fireL = new THREE.PointLight(0xff8a30, 0, 9); fireL.position.set(0, 0.8, 0); FIRE.add(fireL);
const smoke = []; for (let i = 0; i < 40; i++) { const sm = mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshStandardMaterial({ color: 0x777777, transparent: true, opacity: 0.45, depthWrite: false }), 0, 0, 0, ROOM); sm.castShadow = false; sm.userData.ph = rnd(); sm.userData.dx = (rnd() - 0.5) * 2; sm.userData.dz = (rnd() - 0.5) * 2; smoke.push(sm); }
// candle
const CANDLE = new THREE.Group(); CANDLE.position.copy(T).add(new THREE.Vector3(-0.3, 0, 0)); ROOM.add(CANDLE);
mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 16), M(0x9a9aa0, { metalness: 0.6 }), 0, 0.02, 0, CANDLE);
const wax = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 14), M(0xf3ead8, { flatShading: false, emissive: 0x6a5530 }), 0, 0.2, 0, CANDLE);
for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.025, 6, 6), M(0xf3ead8), Math.cos(i * 2) * 0.06, 0.25 - i * 0.07, Math.sin(i * 2) * 0.06, CANDLE);
const cFlame = mesh(new THREE.SphereGeometry(0.035, 8, 8), flameMat(), 0, 0.42, 0, CANDLE); cFlame.scale.y = 2;
const candleL = new THREE.PointLight(0xffb060, 0, 5); candleL.position.set(0, 0.5, 0); CANDLE.add(candleL);
// oil lamp
const LAMP = new THREE.Group(); LAMP.position.copy(T).add(new THREE.Vector3(0.25, 0, 0)); ROOM.add(LAMP);
mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.18, 16), M(0xb08a3a, { metalness: 0.3, roughness: 0.4, emissive: 0x3a2a10 }), 0, 0.09, 0, LAMP);
mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 12), M(0x8c6a2a, { metalness: 0.7 }), 0, 0.21, 0, LAMP);
const chim = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.32, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xeef6ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }), 0, 0.4, 0, LAMP); chim.castShadow = false;
const lFlame = mesh(new THREE.SphereGeometry(0.045, 8, 8), flameMat(), 0, 0.33, 0, LAMP); lFlame.scale.y = 2.2;
const lampL = new THREE.PointLight(0xffc070, 0, 7); lampL.position.set(0, 0.45, 0); LAMP.add(lampL);
// bare filament demo: two posts + glowing wire
const WIRE = new THREE.Group(); WIRE.position.copy(T).add(new THREE.Vector3(0, 0, 0.1)); ROOM.add(WIRE);
mesh(new THREE.BoxGeometry(0.5, 0.05, 0.18), M(0x3a3a3a), 0, 0.025, 0, WIRE);
for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), M(0xb0b0b0, { metalness: 0.8 }), sx * 0.18, 0.18, 0, WIRE);
const wireMat = new THREE.MeshBasicMaterial({ color: 0x553322 }); const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 60 }, (_, i) => new THREE.Vector3(-0.18 + i * 0.006, 0.32 + 0.025 * Math.sin(i * 1.3), 0.025 * Math.cos(i * 1.3)))), 120, 0.007, 6), wireMat); wire.position.set(0, 0, 0); WIRE.add(wire);
const wglow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0, depthWrite: false })); wglow.position.set(0, 0.32, 0); wglow.scale.set(1.6, 0.6, 0.6); WIRE.add(wglow);
const wireL = new THREE.PointLight(0xffd090, 0, 4); wireL.position.set(0, 0.4, 0.1); WIRE.add(wireL);
const sparks = []; for (let i = 0; i < 14; i++) { const s_ = mesh(new THREE.SphereGeometry(0.012, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffe080 }), 0, 0.32, 0, WIRE); s_.castShadow = false; s_.userData.v = new THREE.Vector3((rnd() - 0.5), rnd() * 1.5, (rnd() - 0.5)); sparks.push(s_); }
// glass bulb (incandescent) and LED bulb
function bulbBase(g) { mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 12), M(0xc8c8d0, { metalness: 0.2, roughness: 0.4, emissive: 0x303038 }), 0, 0.05, 0, g); mesh(new THREE.BoxGeometry(0.3, 0.02, 0.3), M(0x3a3a3a), 0, -0.0, 0, g); }
const BULB = new THREE.Group(); BULB.position.copy(T).add(new THREE.Vector3(0, 0, 0.1)); ROOM.add(BULB); bulbBase(BULB);
const glassB = mesh(new THREE.SphereGeometry(0.14, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.45, depthWrite: false }), 0, 0.22, 0, BULB); glassB.castShadow = false;
const bfil = mesh(new THREE.TorusGeometry(0.04, 0.006, 6, 16, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffd080 }), 0, 0.22, 0, BULB);
const bulbL = new THREE.PointLight(0xffc880, 0, 8); bulbL.position.set(0, 0.3, 0.1); BULB.add(bulbL);
const LED = new THREE.Group(); LED.position.copy(T).add(new THREE.Vector3(0, 0, 0.1)); ROOM.add(LED); bulbBase(LED);
mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.08, 16), M(0xf2f2f2), 0, 0.12, 0, LED);
const ledDome = mesh(new THREE.SphereGeometry(0.13, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), new THREE.MeshBasicMaterial({ color: 0xfffaf0 }), 0, 0.14, 0, LED);
const chips = []; for (let i = 0; i < 6; i++) { const c = mesh(new THREE.BoxGeometry(0.025, 0.006, 0.025), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }), Math.cos(i) * 0.06, 0.17, Math.sin(i) * 0.06, LED); chips.push(c); }
const ledL = new THREE.PointLight(0xfff6ea, 0, 12); ledL.position.set(0, 1.4, 0.3); LED.add(ledL);
const heatW = []; for (let i = 0; i < 6; i++) { const h = mesh(new THREE.TorusGeometry(0.06, 0.006, 4, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff6040, transparent: true, opacity: 0.8 }), 0, 0.4, 0, BULB); h.userData.ph = i / 6; heatW.push(h); }


// streetlight + figure outside the window
const STREET = new THREE.Group(); scene.add(STREET);
mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8), M(0x2a2a30), 1.6, 1.7, -9.5, STREET);
mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), M(0x2a2a30), 1.4, 3.4, -9.5, STREET);
const bulbS = mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe6a8 }), 1.3, 3.3, -9.5, STREET);
const streetL = new THREE.PointLight(0xffd79a, 14, 9, 1.4); streetL.position.set(1.3, 3.1, -9.5); STREET.add(streetL);
const FIG = new THREE.Group(); scene.add(FIG); const figM = new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 1 });
mesh(new THREE.CapsuleGeometry(0.28, 1.3, 6, 12), figM, 0, 1.0, 0, FIG); mesh(new THREE.SphereGeometry(0.22, 14, 12), figM, 0, 2.05, 0, FIG);
for (const sx of [-1, 1]) mesh(new THREE.CapsuleGeometry(0.07, 0.9, 4, 8), figM, sx * 0.33, 1.1, 0, FIG);
bucket.visible = false;

const G = (p, ry) => ({ p, ry });
const TC = [1.6, 1.0, 0.6];
const SHOTS = {
  p3a: { cam: [[2.6, 1.8, 2.8], [2.2, 1.7, 2.3]], look: [[0, 1.2, -1], [0, 1.2, -1]], show: ['led'], amb: 0.06, guy: G([0.3, 0, -0.4], 0.6), fig: 'none' },
  p3b: { cam: [[0.9, 1.6, 0.4], [0.5, 1.6, -0.6]], look: [[0.6, 1.4, -6], [0.8, 1.2, -9]], show: ['led'], amb: 0.06, guy: G([-0.6, 0, -1.6], Math.PI), fig: 'far' },
  p3c: { cam: [[0.5, 1.6, -0.6], [0.3, 1.6, -1.6]], look: [[0.8, 1.2, -9], [0.4, 1.4, -5]], show: ['led'], amb: 0.06, guy: G([-0.6, 0, -1.6], Math.PI), fig: 'near' },
  dark:   { cam: [[2.6, 1.7, 2.8], [2.2, 1.6, 2.2]], look: [[0, 1.2, -1], [0, 1.2, -1]], show: [], amb: 0.06, guy: G([0.3, 0, -0.4], 0.6) },
  fire:   { cam: [[2.4, 1.9, 3.0], [1.6, 2.3, 2.6]], look: [[-0.3, 0.6, 0.6], [-0.3, 1.6, 0.6]], show: ['fire'], smoke: true, amb: 0.1, guy: G([0.8, 0, -0.6], -0.6), cough: true },
  candle: { cam: [[2.4, 1.3, 1.6], [2.1, 1.15, 1.25]], look: [[1.3, 1.0, 0.5], [1.3, 1.0, 0.5]], show: ['candle'], amb: 0.06, guy: G([0.6, 0, 0.3], 1.5), melt: true },
  lamp:   { cam: [[2.6, 1.3, 1.7], [2.3, 1.2, 1.3]], look: [[1.85, 1.05, 0.5], [1.85, 1.05, 0.5]], show: ['lamp'], amb: 0.08, guy: G([0.7, 0, 0.2], 1.4) },
  wire:   { cam: [[2.3, 1.25, 1.4], [2.0, 1.2, 1.15]], look: [[1.6, 1.1, 0.6], [1.6, 1.12, 0.6]], show: ['wire'], wire: 'glow', amb: 0.05, guy: G([0.6, 0, 0.3], 1.5) },
  burn:   { cam: [[2.0, 1.2, 1.15], [1.95, 1.2, 1.05]], look: [[1.6, 1.12, 0.6], [1.6, 1.12, 0.6]], show: ['wire'], wire: 'burn', amb: 0.05, guy: G([0.6, 0, 0.3], 1.5) },
  bulb:   { cam: [[2.3, 1.3, 1.5], [2.0, 1.2, 1.15]], look: [[1.6, 1.05, 0.6], [1.6, 1.06, 0.6]], show: ['bulb'], amb: 0.06, guy: G([0.6, 0, 0.3], 1.5), cheerLate: true },
  heat:   { cam: [[2.0, 1.2, 1.15], [1.9, 1.15, 0.98]], look: [[1.6, 1.08, 0.6], [1.6, 1.08, 0.6]], show: ['bulb'], heat: true, amb: 0.06, guy: G([0.6, 0, 0.3], 1.5) },
  led:    { cam: [[2.0, 1.2, 1.15], [2.4, 1.5, 1.8]], look: [[1.6, 1.0, 0.6], [1.4, 1.0, 0.4]], show: ['led'], amb: 0.06, guy: G([0.6, 0, 0.3], 1.5) },
  done:   { cam: [[2.6, 1.8, 2.8], [2.2, 1.7, 2.3]], look: [[0, 1.2, -1], [0, 1.2, -1]], show: ['led'], amb: 0.06, guy: G([0.3, 0, -0.4], 0.6), cheer: true },
  end:    { cam: [[2.2, 1.7, 2.3], [2.2, 1.7, 2.3]], look: [[0, 1.2, -1], [0, 1.2, -1]], show: ['led'], amb: 0.06, guy: G([0.3, 0, -0.4], 0.6) },
};
let TIMING = null; window.setTiming = (t) => { TIMING = t; };
window.renderAt = (t) => {
  const segs = TIMING.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SHOTS[sg.shot], lt = t - sg.start, pr = Math.min(1, lt / sg.dur), e = ease(pr);
  // night room with a real window
  solidWall.visible = false; holeWall.visible = true; skin.visible = false; wavy.visible = false; flat.visible = true; winFrame.visible = true; beam.visible = false;
  flakes.forEach(f => f.visible = false); roomLight.intensity = 0;
  scene.background.set(0x0b1226); scene.fog.color.set(0x0b1226); sun.intensity = 0.25; sun.color.set(0x8fa8ff); hemi.intensity = sh.amb;
  const on = k => sh.show.includes(k);
  FIRE.visible = on('fire'); CANDLE.visible = on('candle'); LAMP.visible = on('lamp'); WIRE.visible = on('wire'); BULB.visible = on('bulb'); LED.visible = on('led');
  const fl = 1 + 0.15 * Math.sin(t * 23) + 0.1 * Math.sin(t * 37);
  fireL.intensity = on('fire') ? 9 * fl : 0; fireFl.forEach((f, k) => { f.scale.y = 1 + 0.3 * Math.sin(t * 15 + k * 2); f.material.color.setHSL(0.07 + 0.02 * Math.sin(t * 9 + k), 1, 0.55); });
  smoke.forEach(s_ => { s_.visible = !!sh.smoke; if (sh.smoke) { const ph = (t * 0.35 + s_.userData.ph) % 1; const grow = Math.min(1, lt / 2.5); s_.position.set(-0.3 + s_.userData.dx * ph * 1.5, 0.6 + ph * 2.3, 0.6 + s_.userData.dz * ph * 1.5); s_.scale.setScalar(0.6 + ph * 2.2 * grow); s_.material.opacity = 0.45 * grow; } });
  candleL.intensity = on('candle') ? 2.2 * fl : 0; cFlame.scale.set(1, 2 + 0.3 * Math.sin(t * 20), 1); if (sh.melt) { wax.scale.y = 1 - pr * 0.45; wax.position.y = 0.2 - pr * 0.07; cFlame.position.y = 0.42 - pr * 0.14; } else { wax.scale.y = 1; wax.position.y = 0.2; cFlame.position.y = 0.42; }
  lampL.intensity = on('lamp') ? 4.5 * fl : 0; lFlame.scale.set(1, 2.2 + 0.2 * Math.sin(t * 17), 1);
  // wire
  let wg = 0; if (sh.wire === 'glow') wg = Math.min(1, lt / 1.2); if (sh.wire === 'burn') wg = lt < 1.0 ? 1 : 0;
  wireMat.color.setRGB(0.33 + 0.67 * wg, 0.2 + 0.65 * wg, 0.13 + 0.4 * wg); wireL.intensity = 3.5 * wg;
  wire.visible = !(sh.wire === 'burn' && lt > 1.0); wglow.material.opacity = 0.35 * wg * (wire.visible ? 1 : 0);
  sparks.forEach((s_, k) => { const tt = lt - 1.0; s_.visible = sh.wire === 'burn' && tt > 0 && tt < 0.8; if (s_.visible) s_.position.set(s_.userData.v.x * tt * 0.6, 0.32 + s_.userData.v.y * tt * 0.5 - 1.5 * tt * tt, s_.userData.v.z * tt * 0.6); });
  bulbL.intensity = on('bulb') ? 3.4 : 0;
  heatW.forEach(h => { h.visible = !!sh.heat; if (sh.heat) { const ph = (t * 0.8 + h.userData.ph) % 1; h.position.set(Math.sin(h.userData.ph * 9) * 0.05, 0.4 + ph * 0.4, 0); h.material.opacity = 0.8 * (1 - ph); h.scale.setScalar(1 + ph); } });
  ledL.intensity = on('led') ? (sh.shot === 'led' ? Math.min(1, lt / 0.6) : 1) * 14 : 0; hemi.intensity = sh.amb + (on('led') ? 0.5 : 0);
  FIG.visible = !!sh.fig && sh.fig !== 'none'; if (sh.fig === 'far') FIG.position.set(1.0, 0, -9.3); if (sh.fig === 'near') FIG.position.set(0.5, 0, -9.3 + Math.min(1, lt / 2.5) * 3.6); FIG.rotation.y = 0;
  cam.position.lerpVectors(V(sh.cam[0]), V(sh.cam[1]), e); cam.position.x += Math.sin(t * 0.7) * 0.02; cam.position.y += Math.sin(t * 0.9) * 0.015;
  cam.lookAt(new THREE.Vector3().lerpVectors(V(sh.look[0]), V(sh.look[1]), e));
  guy.position.set(...sh.guy.p); guy.rotation.y = sh.guy.ry; pose(false, t); bucket.visible = false; arms[0].rotation.set(0, 0, 0); arms[1].rotation.set(0, 0, 0);
  if ((sh.cheer && pr > 0.35) || (sh.cheerLate && pr > 0.6)) { arms[0].rotation.z = -2.6; arms[1].rotation.z = 2.6; guy.position.y = Math.abs(Math.sin(t * 7)) * 0.1; }
  if (sh.cough) { arms[1].rotation.x = -2.2; guy.rotation.x = 0.15 * Math.max(0, Math.sin(t * 9)); }
  R.render(scene, cam); return sg.shot;
};
