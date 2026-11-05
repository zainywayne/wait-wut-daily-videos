// How many folds to reach the Moon? 3D version. renderAt(t) -> info for the overlay.
const W = 720, H = 1280;
const R = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
R.setPixelRatio(window.devicePixelRatio || 1); R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.1;
const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 500); cam.position.set(0, 0.6, 14); cam.lookAt(0, 0.2, 0);
const bgTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#071520'); gr.addColorStop(0.55, '#0c2230'); gr.addColorStop(1, '#06121a'); g.fillStyle = gr; g.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
scene.background = bgTex;
// faint grid
const grid = new THREE.GridHelper(60, 60, 0x1d4a5a, 0x12303c); grid.position.y = -3.2; grid.material.transparent = true; grid.material.opacity = 0.5; scene.add(grid);
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x1a2a30, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 6, 8); scene.add(key);
const rim = new THREE.DirectionalLight(0x7fd8ff, 2.2); rim.position.set(-6, 3, -6); scene.add(rim);
{ const es = new THREE.Scene(); const sg = new THREE.SphereGeometry(50, 32, 16); const cs = []; const p = sg.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k) / 50; const c = new THREE.Color(0x0a1820).lerp(new THREE.Color(0xd8ecff), Math.max(0, y)); cs.push(c.r, c.g, c.b); } sg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }))); scene.environment = new THREE.PMREMGenerator(R).fromScene(es, 0.04).texture; }
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.1, ...o });
const add = (g, m, x = 0, y = 0, z = 0, p) => { const k = new THREE.Mesh(g, m); k.position.set(x, y, z); (p || scene).add(k); return k; };
const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
// glow sprite
const glowTex = ctex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(120,220,255,0.55)'); gr.addColorStop(1, 'rgba(120,220,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
// ---------- the paper stack (top of frame) ----------
const PAPER = new THREE.Group(); PAPER.position.set(0, 2.05, 0); scene.add(PAPER);
const paperM = new THREE.MeshStandardMaterial({ color: 0xfffdf2, emissive: 0xfff4c8, emissiveIntensity: 0.55, roughness: 0.6 });
const stack = add(new THREE.BoxGeometry(3.0, 1, 0.5), paperM, 0, 0, 0, PAPER);
const lineTex = ctex(16, 512, (g, w, h) => { g.fillStyle = '#fffdf2'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(150,140,110,0.6)'; for (let y = 0; y < h; y += 8) g.fillRect(0, y, w, 1); }); lineTex.wrapT = THREE.RepeatWrapping;
const stackFront = add(new THREE.PlaneGeometry(3.0, 1), new THREE.MeshBasicMaterial({ map: lineTex, transparent: true }), 0, 0, 0.251, PAPER);
const hinge = new THREE.Group(); PAPER.add(hinge);
const flap = add(new THREE.BoxGeometry(1.5, 1, 0.5), paperM, 0.75, 0.5, 0, hinge);
const pglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff0c0 })); pglow.scale.set(5.5, 2.0, 1); PAPER.add(pglow);
// ---------- featured objects ----------
const OBJ = new THREE.Group(); OBJ.position.set(0, -1.05, 0); OBJ.scale.setScalar(0.82); scene.add(OBJ);
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(7, 7, 1); halo.position.z = -2; OBJ.add(halo);
function mk(builder) { const g = new THREE.Group(); builder(g); g.visible = false; OBJ.add(g); return g; }
const gold = M(0xd8a640, { metalness: 0.9, roughness: 0.3 });
const coinTex = ctex(512, 512, (g) => { g.fillStyle = '#d8a640'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#a77a22'; g.lineWidth = 18; g.beginPath(); g.arc(256, 256, 200, 0, 7); g.stroke(); g.fillStyle = '#a77a22'; g.font = 'bold 260px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', 256, 270); });
coinTex.center.set(0.5, 0.5); coinTex.rotation = Math.PI / 2;
const OBJS = {
  coin: mk(g => { const c = add(new THREE.CylinderGeometry(1.6, 1.6, 0.22, 64), [gold, new THREE.MeshStandardMaterial({ map: coinTex, metalness: 0.85, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: coinTex, metalness: 0.85, roughness: 0.3 })], 0, 0, 0, g); c.rotation.x = Math.PI / 2; }),
  phone: mk(g => { add(new THREE.RoundedBoxGeometry(1.5, 3.1, 0.16, 4, 0.18), M(0x1a1c22, { metalness: 0.6, roughness: 0.25 }), 0, 0, 0, g); const scr = ctex(256, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#4f7cff'); gr.addColorStop(1, '#c04fff'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = 'bold 70px Poppins'; c.textAlign = 'center'; c.fillText('9:41', w / 2, 140); }); add(new THREE.PlaneGeometry(1.36, 2.92), new THREE.MeshBasicMaterial({ map: scr }), 0, 0, 0.085, g); }),
  you: mk(g => { const skin = M(0xe0b090), shirt = M(0x3d7bd9), pants = M(0x2b2f3a); add(new THREE.SphereGeometry(0.42, 24, 18), skin, 0, 1.55, 0, g); add(new THREE.CapsuleGeometry(0.48, 0.9, 6, 16), shirt, 0, 0.55, 0, g); for (const x of [-0.22, 0.22]) add(new THREE.CapsuleGeometry(0.17, 1.0, 4, 10), pants, x, -0.8, 0, g); for (const x of [-0.62, 0.62]) { const a = add(new THREE.CapsuleGeometry(0.13, 0.8, 4, 10), shirt, x, 0.5, 0, g); a.rotation.z = x * 0.25; } }),
  house: mk(g => { add(new THREE.BoxGeometry(2.6, 1.8, 2.2), M(0xf0e2c8), 0, -0.3, 0, g); const roof = add(new THREE.ConeGeometry(2.1, 1.3, 4), M(0xc0503a), 0, 1.25, 0, g); roof.rotation.y = Math.PI / 4; add(new THREE.BoxGeometry(0.6, 1.0, 0.05), M(0x7a4a2a), 0, -0.7, 1.11, g); for (const x of [-0.85, 0.85]) add(new THREE.BoxGeometry(0.5, 0.5, 0.05), M(0x9fd6ff, { emissive: 0x3a6a90 }), x, 0, 1.11, g); }),
  burj: mk(g => { const m = M(0xc9d6e2, { metalness: 0.8, roughness: 0.2 }); let y = -2.6; for (let k = 0; k < 9; k++) { const r = 0.62 * (1 - k * 0.1), h = 0.55; add(new THREE.CylinderGeometry(r * 0.9, r, h, 6), m, 0, y + h / 2, 0, g); y += h; } add(new THREE.ConeGeometry(0.08, 1.2, 8), m, 0, y + 0.6, 0, g); }),
  everest: mk(g => { add(new THREE.ConeGeometry(2.4, 3.2, 7, 2), M(0x6a6560, { flatShading: true, roughness: 0.9 }), 0, -0.2, 0, g); add(new THREE.ConeGeometry(0.95, 1.25, 7), M(0xffffff, { flatShading: true }), 0, 0.78, 0, g); add(new THREE.ConeGeometry(1.6, 2.0, 6), M(0x5a5652, { flatShading: true, roughness: 0.9 }), -1.6, -0.8, -0.5, g); }),
  iss: mk(g => { const m = M(0xd8dde4, { metalness: 0.7 }); add(new THREE.BoxGeometry(4.2, 0.12, 0.12), m, 0, 0, 0, g); add(new THREE.CylinderGeometry(0.28, 0.28, 1.4, 16), m, 0, 0, 0, g).rotation.x = Math.PI / 2; const sol = M(0x22408a, { metalness: 0.6, roughness: 0.3, emissive: 0x0a1840 }); for (const x of [-1.8, -1.2, 1.2, 1.8]) for (const y of [-0.85, 0.85]) add(new THREE.BoxGeometry(0.45, 1.4, 0.03), sol, x, y, 0, g); }),
  earth: mk(g => { const et = ctex(1024, 512, (c, w, h) => { c.fillStyle = '#1f5fa8'; c.fillRect(0, 0, w, h); c.fillStyle = '#3c9a4a'; let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let k = 0; k < 26; k++) { const x = r() * w, y = h * 0.15 + r() * h * 0.7, rr = 30 + r() * 80; c.beginPath(); for (let a = 0; a < 6.3; a += 0.25) c.lineTo(x + Math.cos(a) * rr * (0.7 + 0.4 * Math.sin(a * 3 + k)), y + Math.sin(a) * rr * 0.7); c.fill(); } c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(0, 0, w, 26); c.fillRect(0, h - 26, w, 26); }); add(new THREE.SphereGeometry(1.9, 64, 48), new THREE.MeshStandardMaterial({ map: et, roughness: 0.6 }), 0, 0, 0, g); }),
  moon: mk(g => { const mt = ctex(1024, 512, (c, w, h) => { c.fillStyle = '#a8a8ac'; c.fillRect(0, 0, w, h); let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let k = 0; k < 140; k++) { const x = r() * w, y = r() * h, rr = 4 + r() * 34; c.fillStyle = `rgba(${r() < 0.5 ? '120,120,125' : '190,190,195'},0.6)`; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); } }); add(new THREE.SphereGeometry(2.1, 64, 48), new THREE.MeshStandardMaterial({ map: mt, roughness: 0.95 }), 0, 0, 0, g); }),
};
const SCHED = [[0, null, '', ''], [8, 'coin', 'A coin', '2.4 cm'], [11, 'phone', 'A phone', '15 cm'], [14, 'you', 'You', '1.75 m'], [17, 'house', 'A house', '9 m'], [23, 'burj', 'Burj Khalifa', '828 m'], [27, 'everest', 'Mount Everest', '8,849 m'], [32, 'iss', 'Space Station', '408 km up'], [37, 'earth', 'Earth', '12,742 km wide'], [42, 'moon', 'THE MOON', '384,400 km away']];
const START = 1.0, BEAT = 0.5, NF = 42; const END = START + NF * BEAT;
window.TOTAL = END + 4.0;
function fmt(m) { if (m < 0.01) return (m * 1000).toFixed(1) + ' mm'; if (m < 1) return (m * 100).toFixed(1) + ' cm'; if (m < 1000) return (m < 10 ? m.toFixed(1) : Math.round(m).toLocaleString('en-US')) + ' m'; return Math.round(m / 1000).toLocaleString('en-US') + ' km'; }
const sm = x => x * x * (3 - 2 * x);
window.renderAt = (t) => {
  const k = t < START ? 0 : Math.min(NF, Math.floor((t - START) / BEAT)); const u = t < START || k >= NF ? 0 : ((t - START) / BEAT) % 1;
  const n = t >= START ? Math.min(NF, k + (u > 0.55 ? 1 : 0)) : 0;
  // paper: grows (visually capped) and shows layer lines while thin
  const vis = Math.min(1.05, 0.06 * Math.pow(1.4, n)); stack.scale.y = vis; stackFront.scale.y = vis; stack.position.y = vis / 2 - 0.4; stackFront.position.y = stack.position.y;
  lineTex.repeat.set(1, Math.max(1, Math.min(64, Math.pow(2, n) / 8))); stackFront.material.opacity = n < 9 ? 0.9 : Math.max(0, 0.9 - (n - 9) * 0.3);
  // fold flap: rises off the right half and folds over onto the left
  hinge.visible = k < NF && t >= START && u < 0.6; hinge.position.set(0, vis - 0.4, 0); hinge.rotation.z = Math.PI * sm(Math.min(1, u / 0.55)); flap.scale.y = Math.max(0.02, vis * 0.5); flap.position.set(0.75, vis * 0.25, 0);
  PAPER.scale.setScalar(1 + 0.05 * Math.exp(-u * 10) * (t >= START && k < NF ? 1 : 0));
  pglow.position.y = vis / 2 - 0.4; pglow.material.opacity = 0.5 + 0.4 * Math.exp(-u * 8);
  // featured object
  let cur = SCHED[0], ci = 0; SCHED.forEach((s, i) => { if (n >= s[0]) { cur = s; ci = i; } });
  const since = cur[0] === 0 ? 9 : t - (START + (cur[0] - 1) * BEAT + 0.28);
  Object.entries(OBJS).forEach(([key2, g]) => { g.visible = key2 === cur[1]; });
  if (cur[1]) { const g = OBJS[cur[1]]; const pop = since < 0.35 ? 0.6 + 0.4 * sm(since / 0.35) + Math.sin(since / 0.35 * Math.PI) * 0.12 : 1; g.scale.setScalar(pop); g.rotation.y = t * 0.6; g.rotation.x = cur[1] === 'coin' ? Math.sin(t * 0.8) * 0.3 : 0.12; halo.material.opacity = 0.8; }
  else halo.material.opacity = 0;
  halo.material.color.set(cur[1] === 'moon' ? 0xffffff : cur[1] === 'earth' ? 0x7fc8ff : 0x7fd8ff);
  const end = t >= END + 0.3;
  OBJ.scale.setScalar(end ? 0.82 * (1 + 0.04 * Math.sin((t - END) * 3)) : 0.82);
  cam.position.x = Math.sin(t * 0.4) * 0.25; cam.lookAt(0, 0.2, 0);
  R.render(scene, cam);
  return { n, len: fmt(1e-4 * Math.pow(2, n)), label: cur[2], size: cur[3], end, beat: Math.exp(-u * 9) * (t >= START && k < NF ? 1 : 0), t };
};
window.setTiming = () => {};
