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
pine(0.6, -7, 1.2); pine(-2, -9, 1.4); pine(2.5, -10, 1.1);

// FURNACE area at (14,0,0)
const FURN = new THREE.Group(); FURN.position.set(14, 0, 0); scene.add(FURN);
const BRICK = M(0x9c4a32);
mesh(new THREE.BoxGeometry(3.2, 2.6, 2.6), BRICK, 0, 1.3, 0, FURN); mesh(new THREE.BoxGeometry(3.4, 0.3, 2.8), M(0x7d3a28), 0, 2.75, 0, FURN);
mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 10), BRICK, 0.9, 3.9, -0.6, FURN);
const mouth = mesh(new THREE.BoxGeometry(1.4, 1.0, 0.1), new THREE.MeshBasicMaterial({ color: 0xff7a1a }), 0, 1.0, 1.31, FURN);
const fireL = new THREE.PointLight(0xff8a2a, 6, 10); fireL.position.set(0, 1.2, 2.2); FURN.add(fireL);
const sand = mesh(new THREE.ConeGeometry(1.0, 0.8, 20), M(0xe6cf8f), -2.6, 0.4, 1.6, FURN);
const crucible = new THREE.Group(); crucible.position.set(1.5, 0, 2.4); FURN.add(crucible);
mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.7, 16), M(0x444444), 0, 0.35, 0, crucible);
const melt = mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 16), new THREE.MeshBasicMaterial({ color: 0xffa040 }), 0, 0.68, 0, crucible);
// TIN BATH at (14,0,14): long bath, silver molten tin, glowing glass ribbon spreading
const BATH = new THREE.Group(); BATH.position.set(14, 0, 14); scene.add(BATH);
mesh(new THREE.BoxGeometry(3.6, 0.6, 9), M(0x5c5f66), 0, 0.3, 0, BATH);
const tin = mesh(new THREE.BoxGeometry(3.2, 0.05, 8.6), new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 1.0, roughness: 0.12 }), 0, 0.6, 0, BATH);
const ribbon = mesh(new THREE.BoxGeometry(2.6, 0.04, 1), new THREE.MeshStandardMaterial({ color: 0xffb060, emissive: 0xff7a20, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 }), 0, 0.65, -4.3, BATH);
const spout = mesh(new THREE.BoxGeometry(2.8, 0.5, 0.6), BRICK, 0, 1.0, -4.6, BATH);
const pour = mesh(new THREE.BoxGeometry(2.4, 0.4, 0.05), new THREE.MeshBasicMaterial({ color: 0xffa040 }), 0, 0.8, -4.25, BATH);
const bathL = new THREE.PointLight(0xff9a40, 4, 8); bathL.position.set(0, 1.4, -2); BATH.add(bathL);
const sheet = mesh(new THREE.BoxGeometry(2.6, 0.04, 1.6), new THREE.MeshStandardMaterial({ color: 0xcfeaf2, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.3 }), 0, 0.65, 5.6, BATH);
// HOUSE exterior w/ window glow (for final) at (0,0,-3) is ROOM; add roof + exterior shell
const shell = new THREE.Group(); scene.add(shell);
const roof = mesh(new THREE.ConeGeometry(4.8, 2.2, 4), M(0xa8473a), 0, 4.1, 0, shell); roof.rotation.y = Math.PI / 4;

const G = (p, ry) => ({ p, ry });
const SHOTS = {
  dark:   { cam: [[2.2, 1.7, 2.6], [1.8, 1.6, 2.0]], look: [[-0.5, 1.2, -2], [-0.5, 1.2, -2]], room: 'solid', light: 0.0, guy: G([-0.4, 0, -0.6], 0.5) },
  hole:   { cam: [[2.2, 1.7, 2.6], [1.6, 1.5, 1.6]], look: [[0, 1.4, -3], [0, 1.5, -3]], room: 'hole', light: 1.0, beam: true, guy: G([-0.4, 0, -1.0], Math.PI), cheer: true },
  cold:   { cam: [[1.6, 1.5, 1.2], [1.3, 1.4, 0.6]], look: [[0, 1.4, -3], [0, 1.3, -2.5]], room: 'hole', light: 0.7, snow: true, guy: G([-0.5, 0, -0.4], 0.2), shiver: true },
  skin:   { cam: [[1.8, 1.6, 1.4], [1.4, 1.5, 0.8]], look: [[0, 1.5, -3], [0, 1.5, -3]], room: 'skin', light: 0.12, guy: G([-0.5, 0, -1.2], 0.3) },
  sand:   { cam: [[18, 2.4, 7], [16.5, 2.0, 5.8]], look: [[14, 1.0, 1.5], [14, 0.8, 1.8]], guy: G([12.2, 0, 3.4], 2.2), melt: true },
  wavy:   { cam: [[1.4, 1.6, 0.4], [0.9, 1.6, -0.6]], look: [[0, 1.6, -3], [0, 1.6, -3.2]], room: 'wavy', light: 0.6, guy: G([1.6, 0, 0.4], -0.6) },
  tin:    { cam: [[18.5, 4.5, 8], [17.2, 3.4, 12]], look: [[14, 0.6, 12], [14, 0.6, 15]], guy: G([11.5, 0, 13], 1.6), pour: true },
  cool:   { cam: [[17.5, 2.4, 21], [16.2, 1.8, 20.4]], look: [[14, 0.6, 19.6], [14, 0.6, 19.6]], guy: G([12.0, 0, 19.2], 1.4), cooled: true },
  done:   { cam: [[1.8, 1.6, 1.6], [1.0, 1.5, 0.6]], look: [[0, 1.6, -3], [0, 1.7, -3.2]], room: 'flat', light: 1.0, beam: true, guy: G([-0.6, 0, -1.6], Math.PI * 0.95), cheer: true },
  fact:   { cam: [[0, 6, 12], [0, 4, 8]], look: [[0, 1.6, -3], [0, 1.8, -3]], room: 'flat', light: 1.0, outside: true, guy: G([-0.6, 0, -1.6], Math.PI) },
  end:    { cam: [[0, 4, 8], [0, 4, 8]], look: [[0, 1.8, -3], [0, 1.8, -3]], room: 'flat', light: 1.0, outside: true, guy: G([-0.6, 0, -1.6], Math.PI) },
};
let TIMING = null; window.setTiming = (t) => { TIMING = t; };
window.renderAt = (t) => {
  const segs = TIMING.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SHOTS[sg.shot], lt = t - sg.start, pr = Math.min(1, lt / sg.dur), e = ease(pr);
  const r = sh.room || 'flat';
  solidWall.visible = r === 'solid'; holeWall.visible = r !== 'solid';
  skin.visible = r === 'skin'; wavy.visible = r === 'wavy'; flat.visible = r === 'flat'; winFrame.visible = r === 'flat';
  beam.visible = !!sh.beam; beam.material.opacity = 0.12 * Math.min(1, lt * 2);
  roomLight.intensity = (sh.light ?? 1) * 7; hemi.intensity = sh.room ? 0.25 + 0.6 * (sh.light ?? 1) : 1.1;
  if (r === 'solid') { hemi.intensity = 0.22; sun.intensity = 0.4; roomLight.intensity = 0.6; } else sun.intensity = 2.6;
  shell.visible = !!sh.outside;
  ROOM.children.forEach(c => { if (c.geometry && c.geometry.type === 'BoxGeometry' && Math.abs(c.position.y - 3) < 0.01) c.visible = !sh.outside; });
  if (sh.outside) { roomLight.intensity = 9; }
  // snow
  const winter = !!sh.snow; scene.background.set(winter ? 0xc8d4e2 : 0x9cc8ec);
  flakes.forEach(f => { f.visible = winter; if (winter) { const ph = (t * 0.7 + f.userData.ph) % 1; f.position.set(f.userData.x + Math.sin(ph * 6 + f.userData.ph * 9) * 0.3, f.userData.y - ph * 1.2, -3.2 + ph * 4.5); } });
  // furnace + melt
  mouth.material.color.setHSL(0.07, 1, 0.5 + 0.08 * Math.sin(t * 13)); fireL.intensity = 5 + Math.sin(t * 11) * 1.2;
  melt.material.color.set(sh.melt && pr > 0.45 ? 0xffc060 : 0xe6cf8f); sand.scale.setScalar(sh.melt ? Math.max(0.2, 1 - pr * 0.8) : 1);
  // tin bath pour
  const L = sh.pour ? 0.3 + e * 8.0 : (sh.cooled ? 8.3 : 0.3); ribbon.scale.z = L; ribbon.position.z = -4.3 + L / 2;
  ribbon.material.emissiveIntensity = sh.cooled ? 0.9 * (1 - e) : 0.9; ribbon.material.color.set(sh.cooled && pr > 0.5 ? 0xcfeaf2 : 0xffb060);
  pour.visible = !!sh.pour; sheet.visible = !!sh.cooled && pr > 0.6;
  // camera
  cam.position.lerpVectors(V(sh.cam[0]), V(sh.cam[1]), e); cam.position.x += Math.sin(t * 0.7) * 0.03; cam.position.y += Math.sin(t * 0.9) * 0.02;
  cam.lookAt(new THREE.Vector3().lerpVectors(V(sh.look[0]), V(sh.look[1]), e));
  // character
  guy.position.set(...sh.guy.p); guy.rotation.y = sh.guy.ry; pose(false, t); bucket.visible = false;
  arms[0].rotation.set(0, 0, 0); arms[1].rotation.set(0, 0, 0);
  if (sh.cheer && pr > 0.4) { arms[0].rotation.z = -2.6; arms[1].rotation.z = 2.6; guy.position.y = Math.abs(Math.sin(t * 7)) * 0.12; }
  if (sh.shiver) { guy.position.x += Math.sin(t * 60) * 0.02; arms[0].rotation.x = -1.2; arms[1].rotation.x = -1.2; arms[0].rotation.z = 0.6; arms[1].rotation.z = -0.6; }
  R.render(scene, cam); return sg.shot;
};
