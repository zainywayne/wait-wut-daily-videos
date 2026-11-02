// ---------------- the garage level (one module reused for every level) ----------------
function canvasTex(w, h, draw, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; }
let ts = 5; const tr = () => (ts = (ts * 16807) % 2147483647) / 2147483647;
const concrete = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#8c8a84'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = 100 + tr() * 80; g.fillStyle = `rgba(${v},${v},${v * 0.95},0.08)`; g.fillRect(tr() * w, tr() * h, 2 + tr() * 4, 2 + tr() * 4); } for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(40,40,36,${0.04 + tr() * 0.06})`; g.beginPath(); g.ellipse(tr() * w, tr() * h, 30 + tr() * 80, 10 + tr() * 40, tr() * 3, 0, 7); g.fill(); } }, 8, 8);
const floorMat = new THREE.MeshStandardMaterial({ map: concrete, color: 0xb8b6ae, roughness: 0.85 });
const ceilMat = new THREE.MeshStandardMaterial({ map: concrete, color: 0x7a7872, roughness: 1 });
const LEVEL = new THREE.Group(); scene.add(LEVEL);
const floor = mesh(new THREE.PlaneGeometry(80, 80), floorMat, 0, 0, 0, LEVEL); floor.rotation.x = -Math.PI / 2;
const ceil = mesh(new THREE.PlaneGeometry(80, 80), ceilMat, 0, 3.0, 0, LEVEL); ceil.rotation.x = Math.PI / 2;
// parking lines + pillars + light panels in a grid; lanes run along z
const lineM = new THREE.MeshBasicMaterial({ color: 0xe8e2c8 }), yellowM = new THREE.MeshBasicMaterial({ color: 0xd8b830 });
const SPOTS = [];
for (let row of [-4.2, 4.2]) for (let z = -36; z <= 36; z += 2.7) {
  const l = mesh(new THREE.PlaneGeometry(0.08, 4.6), lineM, row + Math.sign(row) * 0.0, 0.005, z, LEVEL); l.rotation.x = -Math.PI / 2; l.rotation.z = Math.PI / 2; l.position.x = row; l.scale.set(1, 1, 1);
  const l2 = mesh(new THREE.PlaneGeometry(4.6, 0.08), lineM, row, 0.005, z, LEVEL); l2.rotation.x = -Math.PI / 2; l2.receiveShadow = true;
  SPOTS.push([row, z + 1.35]);
}
for (let x of [-9, -1.9, 1.9, 9]) for (let z = -36; z <= 36; z += 8.1) { const p = mesh(new THREE.BoxGeometry(0.6, 3, 0.6), new THREE.MeshStandardMaterial({ map: concrete, color: 0xa8a69e }), x, 1.5, z, LEVEL); const band = mesh(new THREE.BoxGeometry(0.62, 0.5, 0.62), yellowM, x, 0.25, z, LEVEL); }
const lane = mesh(new THREE.PlaneGeometry(0.12, 80), yellowM, 0, 0.006, 0, LEVEL); lane.rotation.x = -Math.PI / 2;
const panels = [];
for (let x of [-4.2, 4.2]) for (let z = -36; z <= 36; z += 5.4) { const p = mesh(new THREE.BoxGeometry(0.25, 0.06, 1.6), new THREE.MeshBasicMaterial({ color: 0xf4f8e6 }), x * 0.5, 2.96, z, LEVEL); p.castShadow = false; panels.push(p); }
const lamps = []; for (let z = -24; z <= 24; z += 12) { const pl = new THREE.PointLight(0xe8f0d8, 6, 16, 1.6); pl.position.set(0, 2.8, z); LEVEL.add(pl); lamps.push(pl); }
// walls at ends
mesh(new THREE.BoxGeometry(80, 3, 0.4), new THREE.MeshStandardMaterial({ map: concrete, color: 0x9a988f }), 0, 1.5, -40, LEVEL);
// level sign (canvas texture, swapped per shot)
const signCanvas = document.createElement('canvas'); signCanvas.width = 512; signCanvas.height = 256; const signTex = new THREE.CanvasTexture(signCanvas); signTex.colorSpace = THREE.SRGBColorSpace;
function setSign(top, bottom) { const g = signCanvas.getContext('2d'); g.fillStyle = '#1c3f8a'; g.fillRect(0, 0, 512, 256); g.strokeStyle = '#fff'; g.lineWidth = 10; g.strokeRect(14, 14, 484, 228); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 120px sans-serif'; g.fillText(top, 256, 130); g.font = 'bold 56px sans-serif'; g.fillText(bottom, 256, 210); signTex.needsUpdate = true; }
const sign = mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: signTex }), 1.9, 2.1, 5.31, LEVEL); sign.rotation.y = 0; sign.castShadow = false;
const sign2 = mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({ map: signTex }), -1.9, 2.1, -2.79, LEVEL); sign2.castShadow = false;
// cars
function car(style, color) {
  const g = new THREE.Group(); const body = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 }); const glass = new THREE.MeshStandardMaterial({ color: 0x1a222a, roughness: 0.1, metalness: 0.6 });
  if (style === 'new') { mesh(new THREE.BoxGeometry(1.8, 0.55, 4.2), body, 0, 0.55, 0, g); const c = mesh(new THREE.BoxGeometry(1.6, 0.5, 2.2), glass, 0, 1.05, -0.2, g); c.scale.x = 0.95; mesh(new THREE.BoxGeometry(1.62, 0.06, 2.0), body, 0, 1.31, -0.2, g); }
  else { mesh(new THREE.BoxGeometry(1.9, 0.6, 4.8), body, 0, 0.6, 0, g); mesh(new THREE.BoxGeometry(1.7, 0.5, 2.0), glass, 0, 1.12, 0.1, g); mesh(new THREE.BoxGeometry(1.72, 0.08, 2.1), body, 0, 1.4, 0.1, g); mesh(new THREE.BoxGeometry(1.95, 0.12, 0.15), new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.9, roughness: 0.2 }), 0, 0.45, 2.42, g); }
  for (const [x, z] of [[-0.85, 1.3], [0.85, 1.3], [-0.85, -1.3], [0.85, -1.3]]) { const w = mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 16), M(0x161616), x, 0.33, z, g); w.rotation.z = Math.PI / 2; }
  const hl = []; for (const x of [-0.6, 0.6]) hl.push(mesh(new THREE.BoxGeometry(0.35, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0xc8c8b8 }), x, 0.65, style === 'new' ? 2.11 : 2.41, g));
  g.userData.hl = hl; return g;
}
const NEWC = [0x9aa3ad, 0x2a2d33, 0xe8e8ea, 0x7a1f24, 0x2f4f7a], OLDC = [0x6b8f5e, 0xb5652a, 0xd8c9a0, 0x7a4b8c, 0x3c6e8f];
const carsNew = [], carsOld = [];
SPOTS.forEach(([x, z], k) => { const a = car('new', NEWC[k % 5]); a.position.set(x + Math.sign(x) * 0.0, 0, z); a.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2; LEVEL.add(a); carsNew.push(a);
  const b = car('old', OLDC[(k * 3) % 5]); b.position.copy(a.position); b.rotation.copy(a.rotation); LEVEL.add(b); carsOld.push(b); });
const steam = []; for (let i = 0; i < 16; i++) { const s = mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }), 0, 0, 0, LEVEL); s.castShadow = false; s.userData.ph = rnd(); steam.push(s); }
// ticket machine
const TM = new THREE.Group(); TM.position.set(1.6, 0, -3.6); LEVEL.add(TM);
mesh(new THREE.BoxGeometry(0.6, 1.5, 0.45), M(0xc8a020), 0, 0.75, 0, TM); const scr = mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ color: 0x6cff9a }), 0, 1.15, 0.23, TM); scr.rotation.y = 0;
const ticket = mesh(new THREE.BoxGeometry(0.16, 0.005, 0.3), new THREE.MeshBasicMaterial({ color: 0xf6f0dc }), 0, 0.85, 0.25, TM); ticket.rotation.x = -0.3;
TM.rotation.y = -Math.PI / 2;
// reserved spot (level 100)
const resCanvas = document.createElement('canvas'); resCanvas.width = 512; resCanvas.height = 512; { const g = resCanvas.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#e8e2c8'; g.textAlign = 'center'; g.font = 'bold 84px sans-serif'; g.fillText('RESERVED', 256, 220); g.font = 'bold 70px sans-serif'; g.fillText('FOR YOU', 256, 320); }
const resTex = new THREE.CanvasTexture(resCanvas); resTex.colorSpace = THREE.SRGBColorSpace;
const reserved = mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: resTex, transparent: true }), -4.2, 0.01, 0.45, LEVEL); reserved.rotation.x = -Math.PI / 2; reserved.rotation.z = -Math.PI / 2; reserved.castShadow = false;
const spot = new THREE.SpotLight(0xf0f4e0, 0, 12, 0.5, 0.5, 1.2); spot.position.set(-4.2, 2.9, 0); spot.target.position.set(-4.2, 0, 0); LEVEL.add(spot); LEVEL.add(spot.target);
// ramp module (separate place)
const RAMP = new THREE.Group(); RAMP.position.set(0, 0, 60); scene.add(RAMP);
const rampF = mesh(new THREE.PlaneGeometry(4, 16), floorMat, 0, -2, 0, RAMP); rampF.rotation.x = -Math.PI / 2 - 0.25;
for (const x of [-2.1, 2.1]) mesh(new THREE.BoxGeometry(0.3, 4, 16), new THREE.MeshStandardMaterial({ map: concrete, color: 0x9a988f }), x, -1, 0, RAMP).rotation.x = -0.25;
mesh(new THREE.PlaneGeometry(4.6, 16), ceilMat, 0, 1.0, 0, RAMP).rotation.x = Math.PI / 2 - 0.25;
const arrowCanvas = document.createElement('canvas'); arrowCanvas.width = 256; arrowCanvas.height = 512; { const g = arrowCanvas.getContext('2d'); g.fillStyle = '#e8e2c8'; g.beginPath(); g.moveTo(128, 470); g.lineTo(30, 300); g.lineTo(90, 300); g.lineTo(90, 40); g.lineTo(166, 40); g.lineTo(166, 300); g.lineTo(226, 300); g.closePath(); g.fill(); }
const arrowTex = new THREE.CanvasTexture(arrowCanvas); const arrow = mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true }), 0, -1.6, 1.5, RAMP); arrow.rotation.x = -Math.PI / 2 - 0.25; arrow.castShadow = false;
const rampL = new THREE.PointLight(0xe8f0d8, 4, 12, 1.6); rampL.position.set(0, 0.6, 2); RAMP.add(rampL);
const DOWN = mesh(new THREE.PlaneGeometry(1.8, 0.6), new THREE.MeshBasicMaterial({ map: canvasTex(512, 170, (g) => { g.fillStyle = '#b02a2a'; g.fillRect(0, 0, 512, 170); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 90px sans-serif'; g.fillText('DOWN ONLY', 256, 120); }) }), 0, 0.55, -3, RAMP); DOWN.castShadow = false;
// planet (space shot)
const SPACE = new THREE.Group(); SPACE.position.set(0, 0, -300); scene.add(SPACE);
const planet = new THREE.Group(); SPACE.add(planet);
mesh(new THREE.SphereGeometry(9.2, 48, 32), new THREE.MeshStandardMaterial({ color: 0x5a5a56, roughness: 1 }), 0, 0, 0, planet);
for (let i = 0; i < 900; i++) { const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = 9.3 + rnd() * 0.6; const p = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), u, Math.sqrt(1 - u * u) * Math.sin(th)); const b = mesh(new THREE.BoxGeometry(0.9 + rnd(), 0.35 + rnd() * 0.5, 0.9 + rnd()), M(rnd() < 0.5 ? 0x9a988f : 0x7c7a74), 0, 0, 0, planet); b.position.copy(p.multiplyScalar(r)); b.lookAt(0, 0, 0); b.castShadow = false;
  if (rnd() < 0.18) { const l = mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }), 0, 0, 0, planet); l.position.copy(b.position.clone().multiplyScalar(1.04)); } }
const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 6000 }, () => (rnd() - 0.5) * 300), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.35 })); SPACE.add(stars);

// extra planets for the "choose a planet" intro
function lblTex(txt) { const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d'); g.fillStyle = '#f2f2ee'; g.textAlign = 'center'; g.font = 'bold 110px monospace'; g.fillText(txt, 256, 120); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const P2 = new THREE.Group(); P2.position.set(0, -24, 0); SPACE.add(P2);
mesh(new THREE.SphereGeometry(8, 40, 28), new THREE.MeshStandardMaterial({ color: 0x5aa04a, roughness: 1 }), 0, 0, 0, P2);
for (let i = 0; i < 14; i++) { const u = rnd() * 2 - 1, th = rnd() * 6.28; const p = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), u, Math.sqrt(1 - u * u) * Math.sin(th)); const lk = mesh(new THREE.SphereGeometry(1.4 + rnd() * 1.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0x3b88c8, roughness: 0.3 }), 0, 0, 0, P2); lk.position.copy(p.multiplyScalar(7.9)); lk.scale.set(1, 1, 0.12); lk.lookAt(0, 0, 0); }
for (let i = 0; i < 80; i++) { const u = rnd() * 2 - 1, th = rnd() * 6.28; const p = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), u, Math.sqrt(1 - u * u) * Math.sin(th)); const h = mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), M(rnd() < 0.5 ? 0xe8dcc6 : 0xa8473a), 0, 0, 0, P2); h.position.copy(p.multiplyScalar(8.1)); h.lookAt(0, 0, 0); }
const P3 = new THREE.Group(); P3.position.set(0, -48, 0); SPACE.add(P3);
mesh(new THREE.SphereGeometry(8, 40, 28), new THREE.MeshStandardMaterial({ color: 0x232c55, roughness: 1, emissive: 0x0c1230 }), 0, 0, 0, P3);
for (let i = 0; i < 260; i++) { const u = rnd() * 2 - 1, th = rnd() * 6.28; const p = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), u, Math.sqrt(1 - u * u) * Math.sin(th)); const w = mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshBasicMaterial({ color: rnd() < 0.7 ? 0xffd27a : 0x2a3050 }), 0, 0, 0, P3); w.position.copy(p.multiplyScalar(8.05)); w.castShadow = false; }
const labels = [[planet, '01', 0], [P2, '02', -24], [P3, '03', -48]].map(([pl, t, y]) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8), new THREE.MeshBasicMaterial({ map: lblTex(t), transparent: true, depthWrite: false })); s.position.set(-13, y, 0); SPACE.add(s); return s; });

const spaceSun = new THREE.DirectionalLight(0xfff0dd, 2.2); spaceSun.position.set(-20, 10, -280); spaceSun.target = planet; scene.add(spaceSun);
