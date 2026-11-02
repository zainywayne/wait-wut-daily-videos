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
for (let i = 0; i < 70; i++) { const x = -40 + rnd() * 70, z = -30 + rnd() * 34; if (Math.abs(z) < 10 && Math.abs(x) < 26) continue; pine(x, z, 0.8 + rnd() * 0.9); }
for (let i = 0; i < 30; i++) { const x = -30 + rnd() * 50, z = -14 + rnd() * 24; if (Math.abs(z) < 5) continue; rock(x, z, 0.5 + rnd()); }

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
// ---------------- river (along x), banks at z = -3 / +3 ----------------
const WATER = new THREE.MeshStandardMaterial({ color: 0x3a86c4, roughness: 0.15, metalness: 0.1, flatShading: false });
const river = mesh(new THREE.PlaneGeometry(220, 6.2, 80, 6), WATER, 0, 0.04, 0); river.rotation.x = -Math.PI / 2; river.receiveShadow = true;
for (const z of [-3.2, 3.2]) { const b = mesh(new THREE.PlaneGeometry(220, 0.7), M(0x8a6a44), 0, 0.03, z); b.rotation.x = -Math.PI / 2; }
const foam = []; for (let i = 0; i < 40; i++) { const f = mesh(new THREE.BoxGeometry(0.5 + rnd(), 0.02, 0.06), new THREE.MeshBasicMaterial({ color: 0xdff2ff }), 0, 0.06, -2.6 + rnd() * 5.2); f.castShadow = false; f.userData.o = rnd() * 60; foam.push(f); }
// village (z>0 side) and forest beyond (z<0)
[[-8, 9], [-3, 11], [3, 9.5], [8, 11.5]].forEach(([x, z], k) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI + (k - 1.5) * 0.15; scene.add(g); mesh(new THREE.BoxGeometry(3, 2, 2.6), M(0xd8c4a0), 0, 1, 0, g); const r = mesh(new THREE.ConeGeometry(2.5, 1.5, 4), M(0x8a4a2a), 0, 2.75, 0, g); r.rotation.y = Math.PI / 4; r.scale.z = 0.85; });
for (let i = 0; i < 26; i++) pine(-22 + rnd() * 44, -5 - rnd() * 8, 0.9 + rnd() * 0.7);
// labels (yellow tags as sprites)
function label(txt) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.font = 'bold 72px sans-serif'; const w = g.measureText(txt).width + 50; g.fillStyle = 'rgba(0,0,0,0.0)'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#ffd23f'; g.strokeStyle = '#111'; g.lineWidth = 10; g.textAlign = 'center'; g.strokeText(txt, 256, 90); g.fillText(txt, 256, 90); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(4, 1, 1); s.renderOrder = 10; scene.add(s); s.visible = false; return s; }
const L = { keystone: label('KEYSTONE'), arch: label('ARCH'), tower: label('TOWER'), cable: label('CABLE'), road: label('ROAD') };
// tree that falls into a log bridge (pivot at its base on far bank)
const TREE = new THREE.Group(); TREE.position.set(2, 0, -3.6); scene.add(TREE);
const trunk = mesh(new THREE.CylinderGeometry(0.22, 0.3, 8, 10), M(0x6b4a2f), 0, 4, 0, TREE);
const crown = new THREE.Group(); TREE.add(crown); for (let i = 0; i < 3; i++) mesh(new THREE.ConeGeometry(1.6 - i * 0.4, 2.2, 8), M(0x3a7a48), 0, 6 + i * 0.9, 0, crown);
// rope bridge
const ROPE = new THREE.Group(); scene.add(ROPE); const ropeM = M(0xb59a6a), plankM = M(0x9a6a40);
const planks = []; for (let i = 0; i <= 16; i++) { const z = -4 + i * 0.5; const y = 1.0 - 0.6 * (1 - Math.pow(z / 4, 2)); const p = mesh(new THREE.BoxGeometry(1.1, 0.06, 0.38), plankM, 0, y, z, ROPE); planks.push(p); }
for (const x of [-0.6, 0.6]) for (const h of [0, 0.9]) { const pts = Array.from({ length: 17 }, (_, i) => { const z = -4 + i * 0.5; return new THREE.Vector3(x, 1.0 - 0.6 * (1 - Math.pow(z / 4, 2)) + h, z); }); mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.03, 6), ropeM, 0, 0, 0, ROPE); }
for (const z of [-4, 4]) for (const x of [-0.6, 0.6]) mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 8), M(0x6b4a2f), x, 1.1, z, ROPE);
// falling stacked stones
const STONE = M(0xa8a29a), STONE_D = M(0x8c867e);
const drops = []; for (let i = 0; i < 6; i++) { const b = mesh(new THREE.BoxGeometry(1.4, 0.6, 1.0), i % 2 ? STONE : STONE_D, 0, 0, 0); b.userData.z = -2.5 + i * 1.0; drops.push(b); }
// stone arch (in yz-plane, centre at z=0, spring at y=0)
const ARCH = new THREE.Group(); scene.add(ARCH); const vous = []; const N = 13, Rr = 3.4;
for (let i = 0; i < N; i++) { const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N; const shape = new THREE.Shape(); const ri = Rr, ro = Rr + 0.9;
  shape.moveTo(Math.cos(a0) * ri, Math.sin(a0) * ri); shape.lineTo(Math.cos(a0) * ro, Math.sin(a0) * ro); shape.lineTo(Math.cos(a1) * ro, Math.sin(a1) * ro); shape.lineTo(Math.cos(a1) * ri, Math.sin(a1) * ri); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }); g.translate(0, 0, -0.8);
  const m = mesh(g, i === 6 ? M(0xc8b890) : (i % 2 ? STONE : STONE_D), 0, 0, 0, ARCH); m.rotation.y = Math.PI / 2; vous.push(m); }
const fill = new THREE.Group(); ARCH.add(fill); for (const s of [-1, 1]) { const b = mesh(new THREE.BoxGeometry(1.6, 4.3, 1.4), STONE_D, 0, 2.15, s * 4.0, fill); }
const deck = mesh(new THREE.BoxGeometry(1.8, 0.25, 9.6), M(0x9a948a), 0, 4.42, 0, fill);
const CART = new THREE.Group(); scene.add(CART); mesh(new THREE.BoxGeometry(1.0, 0.5, 1.4), M(0x8a5a30), 0, 0.55, 0, CART); for (const [x, z] of [[-0.55, 0.4], [0.55, 0.4], [-0.55, -0.4], [0.55, -0.4]]) { const w = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 14), M(0x5a3a20), x, 0.28, z, CART); w.rotation.z = Math.PI / 2; }
// wide river + suspension bridge at x = 120
const WIDE = new THREE.Group(); WIDE.position.set(120, 0, 0); scene.add(WIDE);
const wideW = mesh(new THREE.PlaneGeometry(90, 60), WATER, 0, 0.05, 0, WIDE); wideW.rotation.x = -Math.PI / 2;
for (const z of [-31, 31]) { const bk = mesh(new THREE.BoxGeometry(90, 0.6, 4), M(0x6f9e4c), 0, 0.1, z, WIDE); }
const SUS = new THREE.Group(); WIDE.add(SUS); const TOW = [], steel = M(0xb04a3a), cableM = M(0x2b2b30);
for (const z of [-14, 14]) { const t = new THREE.Group(); t.position.set(0, 0, z); SUS.add(t); for (const x of [-1.6, 1.6]) mesh(new THREE.BoxGeometry(0.7, 22, 0.9), steel, x, 11, 0, t); for (const y of [9, 16, 21.6]) mesh(new THREE.BoxGeometry(3.9, 0.7, 0.9), steel, 0, y, 0, t); mesh(new THREE.BoxGeometry(4.4, 1.2, 3), M(0x8c867e), 0, 0.3, 0, t); TOW.push(t); }
const cab = []; for (const x of [-1.6, 1.6]) { const pts = []; for (let i = 0; i <= 60; i++) { const z = -30 + i; let y; if (Math.abs(z) <= 14) y = 7 + 14.6 * Math.pow(z / 14, 2); else y = 21.6 - (Math.abs(z) - 14) * (21.6 - 3.5) / 16; pts.push(new THREE.Vector3(x, y, z)); } const c = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.12, 6), cableM, 0, 0, 0, SUS); cab.push(c); }
const hangers = []; for (const x of [-1.6, 1.6]) for (let z = -13; z <= 13; z += 1.3) { const top = 7 + 14.6 * Math.pow(z / 14, 2); const h = mesh(new THREE.CylinderGeometry(0.03, 0.03, top - 4.5, 4), cableM, x, 4.5 + (top - 4.5) / 2, z, SUS); h.userData.z = z; hangers.push(h); }
const sdeck = mesh(new THREE.BoxGeometry(3.6, 0.5, 60), M(0x6c6c70), 0, 4.4, 0, SUS); mesh(new THREE.BoxGeometry(0.1, 0.02, 60), new THREE.MeshBasicMaterial({ color: 0xffd23f }), 0, 4.66, 0, SUS);
const CAR = new THREE.Group(); WIDE.add(CAR); mesh(new THREE.BoxGeometry(1.4, 0.6, 2.6), M(0xd03030, { roughness: 0.4 }), 0, 5.1, 0, CAR); mesh(new THREE.BoxGeometry(1.2, 0.45, 1.3), M(0x222a33), 0, 5.6, -0.1, CAR);
// shots
const SHOTS = {
  river:  { cam: [[1, 7, 18], [0.5, 4.5, 12]], look: [[0, 0.5, 0], [0, 0.4, -2]], guy: { p: [0, 0, 4.2], ry: Math.PI } },
  swim:   { cam: [[6, 3.2, 8], [-2, 2.6, 7]], look: [[0, 0, 0], [-6, 0, 0]], guy: { swim: true } },
  log:    { cam: [[-8, 3, 9], [-7, 2.6, 7]], look: [[2, 1, -1], [2, 0.6, 0]], fall: true, guy: { p: [1.4, 0, 4.4], ry: Math.PI } },
  roll:   { cam: [[-7, 2.6, 7], [-6, 2.2, 6]], look: [[2, 0.6, 0], [2, 0.2, 0]], logDown: true, roll: true, guy: { onlog: true } },
  rope:   { cam: [[7, 3.4, 8], [5, 2.6, 6]], look: [[0, 0.8, 0], [0, 0.8, 0]], rope: true, guy: { walkRope: true } },
  sway:   { cam: [[5, 2.2, 5], [4, 2.0, 3]], look: [[0, 0.8, 0], [0, 0.9, 0]], rope: true, sway: true, guy: { onRope: true } },
  stack:  { cam: [[8, 4, 8], [7, 3.5, 7]], look: [[0, 0.5, 0], [0, 0.5, 0]], drops: true, guy: { p: [1.8, 0, 4.4], ry: Math.PI - 0.5 } },
  arch:   { cam: [[-13, 3.2, 3.5], [-12, 3.6, 2]], look: [[0, 2.4, 0], [0, 2.6, 0]], arch: 'build', guy: { p: [1.8, 0, 6.2], ry: Math.PI - 0.6 } },
  cart:   { cam: [[-9, 4.5, 6], [-7, 5.5, 2]], look: [[0, 3.5, 2], [0, 3.8, -3]], arch: 'done', cart: true, guy: { p: [1.8, 0, 6.2], ry: Math.PI - 0.6 } },
  wide:   { cam: [[160, 14, 30], [158, 18, 40]], look: [[120, 0, 0], [120, 0, 0]], wide: true, sus: 0 },
  sus:    { cam: [[150, 10, 34], [146, 14, 30]], look: [[120, 9, 0], [120, 10, 0]], wide: true, sus: 'build' },
  done:   { cam: [[128, 7, 22], [126, 6.5, 10]], look: [[120, 6, 0], [120, 5.5, -10]], wide: true, sus: 1, car: true },
  fact:   { cam: [[170, 30, 45], [175, 40, 60]], look: [[120, 6, 0], [120, 6, 0]], wide: true, sus: 1, car: true },
  end:    { cam: [[175, 40, 60], [175, 40, 60]], look: [[120, 6, 0], [120, 6, 0]], wide: true, sus: 1 },
};
let TIMING = null; window.setTiming = (t) => { TIMING = t; };
window.renderAt = (t) => {
  const segs = TIMING.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SHOTS[sg.shot], lt = t - sg.start, pr = Math.min(1, lt / sg.dur), e = ease(pr);
  Object.values(L).forEach(l => { l.visible = false; l.scale.set(sh.wide ? 14 : 4, sh.wide ? 3.5 : 1, 1); });
  scene.fog.far = sh.wide ? 400 : 90; scene.fog.near = sh.wide ? 120 : 30;
  foam.forEach(f => { f.position.x = 40 - ((t * 3 + f.userData.o) % 80); });
  // tree / log
  const treeVisible = sh.fall || sh.logDown; TREE.visible = !!treeVisible;
  if (sh.fall) { const a = Math.min(1, Math.max(0, (lt - 1.0) / 1.3)); TREE.rotation.x = (Math.PI / 2) * a * a; TREE.rotation.z = 0; TREE.position.set(2, 0, -3.6); }
  if (sh.logDown) { TREE.rotation.x = Math.PI / 2; const r = sh.roll ? Math.max(0, lt - 1.6) : 0; TREE.rotation.y = 0; TREE.position.set(2 - r * 1.2, -Math.min(0.5, r * 0.6), -3.6); TREE.rotation.z = r * 2.5; }
  ROPE.visible = !!sh.rope; ROPE.rotation.z = sh.sway ? Math.sin(t * 3) * 0.12 : 0; ROPE.position.set(0, 0, 0);
  drops.forEach((b, k) => { b.visible = !!sh.drops; if (sh.drops) { const t0 = k * 0.45; const tt = Math.max(0, lt - t0); const placed = b.userData.z; const fallStart = 1.2; let y = 0.3 + Math.min(k, 2) * 0.6; let zz = placed; if (Math.abs(placed) < 2.9) { const ft = Math.max(0, tt - 0.2); y = Math.max(-0.6, 1.6 - 4.9 * ft * ft); } b.position.set(0, tt > 0 ? y : 10, zz); b.rotation.x = Math.abs(placed) < 2.9 ? tt * 1.5 : 0; } });
  ARCH.visible = !!sh.arch; CART.visible = !!sh.cart;
  if (sh.arch === 'build') { const order = [0, 12, 1, 11, 2, 10, 3, 9, 4, 8, 5, 7, 6]; vous.forEach((v, k) => { const idx = order.indexOf(k); const ta = idx * (sg.dur * 0.75 / 13); const tt = lt - ta; v.visible = tt > 0; v.position.y = tt > 0 ? Math.max(0, 3 * (1 - tt / 0.35)) : 0; }); fill.visible = false;
    if (lt > sg.dur * 0.78) { L.keystone.visible = true; L.keystone.position.set(0, 6.4, 0); } if (lt > sg.dur * 0.2 && lt < sg.dur * 0.7) { L.arch.visible = true; L.arch.position.set(0, 6.4, 0); } }
  else { vous.forEach(v => { v.visible = true; v.position.y = 0; }); fill.visible = true; }
  if (sh.cart) { CART.position.set(0, 4.5, 6 - pr * 12); }
  // wide river
  WIDE.visible = !!sh.wide;
  if (sh.wide) { const b = sh.sus === 'build' ? pr : (sh.sus || 0); TOW.forEach(tw => { tw.scale.y = Math.min(1, Math.max(0.001, b * 3)); tw.visible = b > 0; }); cab.forEach(c => c.visible = b > 0.35); hangers.forEach((h, k) => h.visible = b > 0.55 + (k % 21) * 0.01); sdeck.visible = b > 0.7; SUS.children.forEach(c => { if (c.geometry && c.geometry.parameters && c.geometry.parameters.depth === 60) c.visible = b > 0.7; });
    if (sh.sus === 'build') { if (pr > 0.15 && pr < 0.45) { L.tower.visible = true; L.tower.position.set(120, 25, 14); } if (pr > 0.4 && pr < 0.7) { L.cable.visible = true; L.cable.position.set(120, 16, 4); } if (pr > 0.72) { L.road.visible = true; L.road.position.set(120, 7, 6); } }
    CAR.visible = !!sh.car; CAR.position.set(0.8, 0, 28 - ((lt * 5) % 56)); }
  // character
  guy.visible = !sh.wide; guy.rotation.set(0, 0, 0); arms[0].rotation.set(0, 0, 0); arms[1].rotation.set(0, 0, 0);
  const g = sh.guy || {};
  if (g.p) { guy.position.set(...g.p); guy.rotation.y = g.ry; pose(false, t); }
  if (g.swim) { guy.position.set(3 - pr * 10, -1.25 + Math.sin(t * 5) * 0.06, 1.8 - pr * 1.5); guy.rotation.y = Math.PI; guy.rotation.z = Math.sin(t * 4) * 0.2; arms[0].rotation.x = Math.sin(t * 8) * 2.4; arms[1].rotation.x = -Math.sin(t * 8) * 2.4; }
  if (g.onlog) { const r = Math.max(0, lt - 1.6); guy.position.set(2, 0.35 - Math.min(1.6, r * r * 4), -0.5 + Math.min(0, -r)); guy.rotation.y = Math.PI; guy.rotation.z = Math.min(1.4, r * 2.2); pose(false, t); arms[0].rotation.z = -1.2; arms[1].rotation.z = 1.2; }
  if (g.walkRope) { const z = 4 - pr * 4.5; guy.position.set(0, 1.0 - 0.6 * (1 - Math.pow(z / 4, 2)), z); guy.rotation.y = Math.PI; pose(true, t * 0.7); }
  if (g.onRope) { guy.position.set(Math.sin(t * 3) * 0.2, 0.42, 0); guy.rotation.y = Math.PI; guy.rotation.z = Math.sin(t * 3) * 0.15; pose(false, t); arms[0].rotation.z = -1.3; arms[1].rotation.z = 1.3; }
  cam.position.lerpVectors(V(sh.cam[0]), V(sh.cam[1]), e); cam.position.x += Math.sin(t * 0.7) * 0.05; cam.position.y += Math.sin(t * 0.9) * 0.03;
  cam.lookAt(new THREE.Vector3().lerpVectors(V(sh.look[0]), V(sh.look[1]), e));
  R.render(scene, cam); return sg.shot;
};
