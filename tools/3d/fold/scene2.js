// Fold paper to the Moon, real scale: the actual paper stack stands next to real-size objects while the camera zooms out.
const W = 720, H = 1280;
const R = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, logarithmicDepthBuffer: true });
R.setPixelRatio(window.devicePixelRatio || 1); R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.1;
const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(30, W / H, 0.01, 1e6); cam.position.set(0.0, 3.0, 16); cam.lookAt(0.0, 3.0, 0);
const bgTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#05101a'); gr.addColorStop(0.6, '#0c2232'); gr.addColorStop(1, '#0a1c28'); g.fillStyle = gr; g.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
scene.background = bgTex;
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x1a2a30, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(5, 8, 10); scene.add(key);
const rim = new THREE.DirectionalLight(0x7fd8ff, 2.0); rim.position.set(-6, 4, -6); scene.add(rim);
{ const es = new THREE.Scene(); const sg = new THREE.SphereGeometry(50, 32, 16); const cs = []; const p = sg.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k) / 50; const c = new THREE.Color(0x0a1820).lerp(new THREE.Color(0xd8ecff), Math.max(0, y)); cs.push(c.r, c.g, c.b); } sg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }))); scene.environment = new THREE.PMREMGenerator(R).fromScene(es, 0.04).texture; }
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.1, ...o });
const add = (g, m, x = 0, y = 0, z = 0, p) => { const k = new THREE.Mesh(g, m); k.position.set(x, y, z); (p || scene).add(k); return k; };
const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const glowTex = ctex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
// stars (fade in when we reach space)
const starG = new THREE.BufferGeometry(); const sp = []; for (let k = 0; k < 900; k++) sp.push((Math.random() - 0.5) * 60, -10 + Math.random() * 40, -20 - Math.random() * 5); starG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0 })); scene.add(stars);
// ---------- WORLD: everything in metres, scaled by s (screen units per metre) ----------
const WORLD = new THREE.Group(); scene.add(WORLD);
const EARTH_R = 6371e3;
const earthTex = ctex(1024, 512, (c, w, h) => { c.fillStyle = '#1f5fa8'; c.fillRect(0, 0, w, h); c.fillStyle = '#3c9a4a'; let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let k = 0; k < 26; k++) { const x = r() * w, y = h * 0.15 + r() * h * 0.7, rr = 30 + r() * 80; c.beginPath(); for (let a = 0; a < 6.3; a += 0.25) c.lineTo(x + Math.cos(a) * rr * (0.7 + 0.4 * Math.sin(a * 3 + k)), y + Math.sin(a) * rr * 0.7); c.fill(); } c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(0, 0, w, 26); c.fillRect(0, h - 26, w, 26); });
const earth = add(new THREE.SphereGeometry(EARTH_R, 128, 96), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.7 }), 0, -EARTH_R, 0, WORLD); earth.rotation.x = 0.4;
const atmo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x6fc0ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); atmo.scale.set(EARTH_R * 2.6, EARTH_R * 2.6, 1); atmo.position.set(0, -EARTH_R, -EARTH_R * 1.1); WORLD.add(atmo);
// near-ground grid floor (screen space, fades out as we go up)
const grid = new THREE.GridHelper(40, 40, 0x2d6a7a, 0x16404c); grid.material.transparent = true; scene.add(grid);
// moon
const moonTex = ctex(1024, 512, (c, w, h) => { c.fillStyle = '#a8a8ac'; c.fillRect(0, 0, w, h); let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let k = 0; k < 140; k++) { c.fillStyle = `rgba(${r() < 0.5 ? '120,120,125' : '190,190,195'},0.6)`; c.beginPath(); c.arc(r() * w, r() * h, 4 + r() * 34, 0, 7); c.fill(); } });
const MOON_D = 384400e3, MOON_R = 1737e3;
const moon = add(new THREE.SphereGeometry(MOON_R, 64, 48), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.95 }), 3.2 * MOON_R, MOON_D, 0, WORLD);
// paper stack: real height, but drawn with a fixed on-screen width so it stays visible
const paperM = new THREE.MeshStandardMaterial({ color: 0xfffdf2, emissive: 0xfff2c0, emissiveIntensity: 0.45, roughness: 0.6 });
const STACK = add(new THREE.BoxGeometry(1, 1, 1), paperM, 0, 0, 0, scene);
const lineTex = ctex(16, 512, (g, w, h) => { g.fillStyle = '#fffdf2'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(140,130,100,0.7)'; for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 2); }); lineTex.wrapS = lineTex.wrapT = THREE.RepeatWrapping;
const STF = add(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: lineTex, transparent: true }), 0, 0, 0, scene);
const FLAP = add(new THREE.BoxGeometry(1, 1, 1), paperM, 0, 0, 0, scene);
const pglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0c0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pglow);
// ---------- real-size objects (each built at unit height, then scaled to metres) ----------
const gold = M(0xd8a640, { metalness: 0.9, roughness: 0.3 });
const coinTex = ctex(512, 512, (g) => { g.fillStyle = '#d8a640'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#a77a22'; g.lineWidth = 18; g.beginPath(); g.arc(256, 256, 200, 0, 7); g.stroke(); g.fillStyle = '#a77a22'; g.font = 'bold 260px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', 256, 270); }); coinTex.center.set(0.5, 0.5); coinTex.rotation = Math.PI / 2;
function unit(builder) { const g = new THREE.Group(); builder(g); const b = new THREE.Box3().setFromObject(g); const hgt = b.max.y - b.min.y; g.children.forEach(c => c.position.y -= b.min.y); const w = new THREE.Group(); w.add(g); g.scale.setScalar(1 / hgt); scene.add(w); w.visible = false; return w; }
const OB = [
  { name: 'A coin', size: '2.4 cm', h: 0.024, o: unit(g => { const c = add(new THREE.CylinderGeometry(1, 1, 0.14, 64), [gold, new THREE.MeshStandardMaterial({ map: coinTex, metalness: 0.85, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: coinTex, metalness: 0.85, roughness: 0.3 })], 0, 0, 0, g); c.rotation.x = Math.PI / 2; }) },
  { name: 'A phone', size: '15 cm', h: 0.147, o: unit(g => { add(new THREE.RoundedBoxGeometry(1.5, 3.1, 0.16, 4, 0.18), M(0x1a1c22, { metalness: 0.6, roughness: 0.25 }), 0, 0, 0, g); const scr = ctex(256, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#4f7cff'); gr.addColorStop(1, '#c04fff'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }); add(new THREE.PlaneGeometry(1.36, 2.92), new THREE.MeshBasicMaterial({ map: scr }), 0, 0, 0.085, g); }) },
  { name: 'You', size: '1.75 m', h: 1.75, o: unit(g => { const skin = M(0xe0b090), shirt = M(0x3d7bd9), pants = M(0x2b2f3a); add(new THREE.SphereGeometry(0.42, 24, 18), skin, 0, 1.55, 0, g); add(new THREE.CapsuleGeometry(0.48, 0.9, 6, 16), shirt, 0, 0.55, 0, g); for (const x of [-0.22, 0.22]) add(new THREE.CapsuleGeometry(0.17, 1.0, 4, 10), pants, x, -0.8, 0, g); for (const x of [-0.62, 0.62]) { const a = add(new THREE.CapsuleGeometry(0.13, 0.8, 4, 10), shirt, x, 0.5, 0, g); a.rotation.z = x * 0.25; } }) },
  { name: 'A house', size: '9 m', h: 9, o: unit(g => { add(new THREE.BoxGeometry(2.6, 1.8, 2.2), M(0xf0e2c8), 0, -0.3, 0, g); const roof = add(new THREE.ConeGeometry(2.1, 1.3, 4), M(0xc0503a), 0, 1.25, 0, g); roof.rotation.y = Math.PI / 4; add(new THREE.BoxGeometry(0.6, 1.0, 0.05), M(0x7a4a2a), 0, -0.7, 1.11, g); }) },
  { name: 'Burj Khalifa', size: '828 m', h: 828, o: unit(g => { const m = M(0xc9d6e2, { metalness: 0.8, roughness: 0.2 }); let y = 0; for (let k = 0; k < 9; k++) { const r = 0.62 * (1 - k * 0.1), hh = 0.55; add(new THREE.CylinderGeometry(r * 0.9, r, hh, 6), m, 0, y + hh / 2, 0, g); y += hh; } add(new THREE.ConeGeometry(0.08, 1.2, 8), m, 0, y + 0.6, 0, g); }) },
  { name: 'Mount Everest', size: '8,849 m', h: 8849, o: unit(g => { add(new THREE.ConeGeometry(1.5, 3.2, 7, 2), M(0x6a6560, { flatShading: true, roughness: 0.9 }), 0, 0, 0, g); add(new THREE.ConeGeometry(0.6, 1.25, 7), M(0xffffff, { flatShading: true }), 0, 0.98, 0, g); }) },
];
const ISS_H = 408e3;
const iss = new THREE.Group(); { const m = M(0xd8dde4, { metalness: 0.7 }); add(new THREE.BoxGeometry(1.4, 0.04, 0.04), m, 0, 0, 0, iss); const sol = M(0x22408a, { metalness: 0.6, emissive: 0x0a1840 }); for (const x of [-0.6, -0.4, 0.4, 0.6]) for (const y of [-0.28, 0.28]) add(new THREE.BoxGeometry(0.15, 0.46, 0.01), sol, x, y, 0, iss); } scene.add(iss);
// ---------- timing: folds land ON the beat ----------
const START = 1.0, BEAT = 0.5, NF = 42; const LAND = k => START + k * BEAT; const END = LAND(NF);
window.TOTAL = END + 4.0;
const sm = x => x * x * (3 - 2 * x);
function foldsAt(t) { // continuous fold count; each fold eases in over the 0.42 s before its beat
  if (t <= LAND(1) - 0.42) return 0; let k = Math.floor((t - START) / BEAT); k = Math.max(0, Math.min(NF, k));
  const next = k + 1; if (next > NF) return NF; const u = 1 - (LAND(next) - t) / 0.42; return u <= 0 ? k : k + sm(Math.min(1, u)); }
function fmt(m) { if (m < 0.01) return (m * 1000).toFixed(1) + ' mm'; if (m < 1) return (m * 100).toFixed(1) + ' cm'; if (m < 1000) return (m < 10 ? m.toFixed(1) : Math.round(m).toLocaleString('en-US')) + ' m'; return Math.round(m / 1000).toLocaleString('en-US') + ' km'; }
const SCREEN_H = 4.4, STACK_W = 0.8, STACK_X = -1.35, OBJ_X = 0.85;
window.renderAt = (t) => {
  const f = foldsAt(t); const n = Math.min(NF, Math.floor(f + 1e-6)); const Hm = 1e-4 * Math.pow(2, f);
  const s = Math.min(SCREEN_H / Hm, 0.35 / 1e-4 * Math.pow(1.0, 0) * Math.pow(2, Math.min(f, 4.4)) / Math.pow(2, f) * 1); // zoomed-in until ~2 mm, then the camera pulls back
  const sc = Math.min(SCREEN_H, 0.3 * Math.pow(2, f)) / Hm; // screen units per metre
  WORLD.scale.setScalar(sc); WORLD.position.set(STACK_X, 0, 0);
  // the stack (real height, fixed on-screen width)
  const sh = Hm * sc; STACK.scale.set(STACK_W, sh, 0.6); STACK.position.set(STACK_X, sh / 2, 0);
  STF.scale.set(STACK_W, sh, 1); STF.position.set(STACK_X, sh / 2, 0.301); lineTex.repeat.set(1, Math.max(1, Math.pow(2, n) / 8)); STF.material.opacity = n < 8 ? 0.9 : Math.max(0, 0.9 - (n - 8) * 0.35);
  // the folding flap: right half of the stack swings over the top just before each beat
  const nextLand = LAND(Math.min(NF, n + 1)); const fu = 1 - (nextLand - t) / 0.42; FLAP.visible = n < NF && fu > 0 && fu < 1 && t > START;
  if (FLAP.visible) { const a = Math.PI * sm(fu); const hl = sh / Math.pow(2, f - n) ; FLAP.scale.set(STACK_W / 2, Math.max(0.02, sh * 0.5 * (1 - fu * 0.0)), 0.6); const hx = STACK_X, hy = sh; FLAP.position.set(hx + Math.cos(a) * STACK_W / 4, hy + Math.sin(a) * STACK_W / 4 * 0.9, 0.05); FLAP.rotation.z = a; }
  pglow.position.set(STACK_X, sh / 2, -0.5); pglow.scale.set(3.2, sh * 1.4 + 1, 1); pglow.material.opacity = 0.35 + 0.45 * Math.exp(-Math.max(0, t - LAND(Math.max(1, n))) * 7);
  // ground: flat grid while low, the real Earth (sphere) once high
  const up = Math.max(0, Math.min(1, (Math.log10(Hm) - 4.2) / 1.2));
  grid.material.opacity = 0.6 * (1 - up); grid.position.y = 0; grid.visible = up < 1;
  earth.visible = Hm > 3e3; atmo.visible = earth.visible; stars.material.opacity = up;
  scene.background = bgTex;
  moon.visible = Hm > 2e7; moon.position.x = (OBJ_X + 0.4 - STACK_X) / sc; moon.scale.setScalar(Math.max(1, 0.55 / (MOON_R * sc)));
  // objects: show the one closest in size, standing right next to the stack, at true scale
  let cur = null;
  for (const o of OB) { o.o.visible = false; const r = o.h / Hm; if (r > 0.12 && r < 2.2) cur = cur || o; }
  for (const o of OB) { const r = o.h / Hm; if (r > 0.12 && r < 2.2 && (!cur || Math.abs(Math.log(r)) < Math.abs(Math.log(cur.h / Hm)))) cur = o; }
  if (cur) { cur.o.visible = true; const hs = cur.h * sc; cur.o.scale.setScalar(hs); cur.o.position.set(OBJ_X, 0, 0); cur.o.rotation.y = 0.5 + Math.sin(t * 0.5) * 0.3; }
  // ISS + Moon get labels via overlay; ISS drawn as an icon at its real altitude
  iss.visible = Hm > 5e4 && Hm < 3e6; iss.position.set(OBJ_X + 0.5, ISS_H * sc, 0); iss.scale.setScalar(0.9);
  // label info
  let label = cur ? cur.name : '', size = cur ? cur.size : '';
  if (iss.visible) { label = 'Space Station'; size = '408 km up'; }
  if (Hm > 8e6 && Hm < 1.2e8) { label = 'Earth'; size = '12,742 km wide'; }
  if (Hm >= 1.2e8) { label = 'THE MOON'; size = '384,400 km away'; }
  cam.lookAt(0.0, 3.0, 0);
  R.render(scene, cam);
  const lastLand = n >= 1 ? LAND(n) : -9;
  return { n, len: fmt(1e-4 * Math.pow(2, n)), label, size, end: t >= END, beat: Math.exp(-Math.max(0, t - lastLand) * 9) * (n >= 1 && t < END + 0.6 ? 1 : 0), t };
};
window.setTiming = () => {};
