// Visual polish layer: loaded after world.js. Textures, rounded edges, env lighting, grass, gradient sky.
(() => {
  R.setPixelRatio(window.devicePixelRatio || 1); R.setSize(W, H, false);
  R.toneMappingExposure = 1.0;
  const tex = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
  let s2 = 11; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  // wood planks with grain
  const woodDraw = (base) => (g, w, h) => { const n = 4; for (let p = 0; p < n; p++) { const y0 = p * h / n; const sh = (r2() - 0.5) * 22; g.fillStyle = `rgb(${base[0] + sh},${base[1] + sh * 0.7},${base[2] + sh * 0.4})`; g.fillRect(0, y0, w, h / n);
      for (let k = 0; k < 38; k++) { const yy = y0 + r2() * h / n; g.strokeStyle = `rgba(${r2() < 0.5 ? '60,30,10' : '200,140,80'},${0.12 + r2() * 0.18})`; g.lineWidth = 1 + r2() * 2.5; g.beginPath(); g.moveTo(0, yy); for (let x = 0; x <= w; x += 32) g.lineTo(x, yy + Math.sin(x * 0.01 + k) * 3 + (r2() - 0.5) * 2); g.stroke(); }
      for (let k = 0; k < 2; k++) { const kx = r2() * w, ky = y0 + h / n * (0.3 + r2() * 0.4); g.fillStyle = 'rgba(70,35,12,0.55)'; g.beginPath(); g.ellipse(kx, ky, 14, 6, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(40,20,5,0.85)'; g.fillRect(0, y0, w, 3); } };
  const woodT = tex(512, 512, woodDraw([150, 96, 52]), 1, 1), latchT = tex(512, 128, woodDraw([196, 146, 88]), 1, 1);
  wood.map = woodT; wood.color.set(0xffffff); wood.flatShading = false; wood.roughness = 0.75; wood.bumpMap = woodT; wood.bumpScale = 1.5; wood.needsUpdate = true;
  latch.material = new THREE.MeshStandardMaterial({ map: latchT, roughness: 0.7, bumpMap: latchT, bumpScale: 1 });
  band.color.set(0x3c3c44); band.metalness = 0.85; band.roughness = 0.35;
  // grass ground
  const grassT = tex(512, 512, (g, w, h) => { g.fillStyle = '#5f9a3e'; g.fillRect(0, 0, w, h); for (let k = 0; k < 9000; k++) { const v = r2(); g.fillStyle = v < 0.5 ? `rgba(70,120,40,${0.35 + r2() * 0.4})` : v < 0.85 ? `rgba(130,180,80,${0.3 + r2() * 0.4})` : `rgba(160,150,90,0.35)`; g.fillRect(r2() * w, r2() * h, 2 + r2() * 3, 4 + r2() * 7); } }, 60, 60);
  ground.material = new THREE.MeshStandardMaterial({ map: grassT, roughness: 0.95 });
  // house: siding + shingles
  const sidingT = tex(512, 512, (g, w, h) => { for (let y = 0; y < h; y += 32) { g.fillStyle = y % 64 ? '#efe2c6' : '#e8d9ba'; g.fillRect(0, y, w, 32); g.fillStyle = 'rgba(120,95,60,0.35)'; g.fillRect(0, y + 29, w, 3); } }, 3, 2);
  const shingT = tex(512, 512, (g, w, h) => { for (let y = 0; y < h; y += 40) for (let x = -((y / 40) % 2) * 32; x < w; x += 64) { const v = (r2() - 0.5) * 30; g.fillStyle = `rgb(${150 + v},${70 + v * 0.5},${48 + v * 0.3})`; g.fillRect(x + 2, y + 2, 60, 36); g.fillStyle = 'rgba(40,15,8,0.5)'; g.fillRect(x, y + 36, 64, 4); } }, 4, 3);
  HOUSE.children.forEach((m, k) => { if (k === 0) { m.material = new THREE.MeshStandardMaterial({ map: sidingT, roughness: 0.85 }); } if (m === roof) m.material = new THREE.MeshStandardMaterial({ map: shingT, roughness: 0.8, flatShading: true }); if (k === 2) m.material = new THREE.MeshStandardMaterial({ map: tex(256, 512, woodDraw([120, 72, 40])), roughness: 0.7 }); });
  // windows on the house
  const WM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), GM = new THREE.MeshStandardMaterial({ color: 0x2f5578, roughness: 0.15, envMapIntensity: 0.3 });
  for (const x of [-1.5, 2.3]) { mesh(new THREE.PlaneGeometry(0.84, 0.84), GM, x, 1.8, 2.012, HOUSE).castShadow = false;
    for (const [w, h, dx, dy] of [[1, 0.08, 0, 0.46], [1, 0.08, 0, -0.46], [0.08, 1, 0.46, 0], [0.08, 1, -0.46, 0], [0.05, 0.84, 0, 0], [0.84, 0.05, 0, 0]]) mesh(new THREE.BoxGeometry(w, h, 0.04), WM, x + dx, 1.8 + dy, 2.03, HOUSE); }
  // round every box in the chest and house
  const roundIn = (grp) => grp.traverse(m => { if (m.isMesh && m.geometry.type === 'BoxGeometry') { const p = m.geometry.parameters; const r = Math.min(0.05, Math.min(p.width, p.height, p.depth) * 0.3); if (r > 0.004) m.geometry = new THREE.RoundedBoxGeometry(p.width, p.height, p.depth, 3, r); } });
  roundIn(CHEST); roundIn(HOUSE);
  // rock texture-ish: smooth + bump
  const rockT = tex(256, 256, (g, w, h) => { g.fillStyle = '#8f8b86'; g.fillRect(0, 0, w, h); for (let k = 0; k < 3000; k++) { g.fillStyle = `rgba(${r2() < 0.5 ? '40,40,40' : '210,205,200'},${r2() * 0.25})`; g.fillRect(r2() * w, r2() * h, 3, 3); } }, 2, 2);
  boulder.material = new THREE.MeshStandardMaterial({ map: rockT, bumpMap: rockT, bumpScale: 3, roughness: 0.9, flatShading: true });
  ropes.forEach(r => { r.geometry = new THREE.TorusGeometry(0.68, 0.04, 10, 48); r.material = new THREE.MeshStandardMaterial({ map: tex(256, 32, (g, w, h) => { g.fillStyle = '#c4a774'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(90,60,25,0.6)'; g.lineWidth = 4; for (let x = -h; x < w; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); } }, 6, 1), roughness: 0.9 }); });
  // gold: smoother, brighter
  gold.forEach(g => { g.geometry = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32); g.material = new THREE.MeshStandardMaterial({ color: 0xffc933, metalness: 1, roughness: 0.22, emissive: 0x2a1800 }); });
  // grass tufts around the yard
  const blade = new THREE.ConeGeometry(0.018, 0.15, 3); blade.translate(0, 0.075, 0);
  const NB = 2600, tufts = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0x6aa646, roughness: 0.9 }), NB); const dm = new THREE.Object3D(), col = new THREE.Color();
  for (let k = 0; k < NB; k++) { let x, z; do { x = -9 + r2() * 18; z = -5 + r2() * 13; } while ((x > -6.2 && x < 0.2 && z > -8.2 && z < -3.8)); dm.position.set(x, 0, z); dm.rotation.set((r2() - 0.5) * 0.5, r2() * 6, (r2() - 0.5) * 0.5); const s = 0.6 + r2() * 0.9; dm.scale.set(s, s * (0.7 + r2() * 0.8), s); dm.updateMatrix(); tufts.setMatrixAt(k, dm.matrix); col.setHSL(0.23 + r2() * 0.06, 0.38, 0.28 + r2() * 0.12); tufts.setColorAt(k, col); }
  tufts.receiveShadow = true; scene.add(tufts);
  // small flowers
  for (let k = 0; k < 40; k++) { const x = -8 + r2() * 16, z = -3 + r2() * 10;  mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: [0xffffff, 0xffd84a, 0xff8fb0][k % 3], roughness: 0.6 }), x, 0.18, z).castShadow = false; }
  // environment lighting (soft reflections) from a gradient sky scene
  const envS = new THREE.Scene(); const sg = new THREE.SphereGeometry(50, 32, 16); const cs = []; const pos = sg.attributes.position; for (let k = 0; k < pos.count; k++) { const y = pos.getY(k) / 50; const c = y > 0 ? new THREE.Color(0xbfdcff).lerp(new THREE.Color(0x5d9ae0), y) : new THREE.Color(0x7a8a5a); cs.push(c.r, c.g, c.b); }
  sg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); envS.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sunDisk = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 7, 6) })); sunDisk.position.set(-20, 30, 22); envS.add(sunDisk);
  const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(envS, 0.02).texture; scene.traverse(o => { if (o.isMesh && o.material.isMeshStandardMaterial) if (o.material.envMapIntensity === 1) o.material.envMapIntensity = o.material.metalness > 0.5 ? 1.0 : 0.5; });
  hemi.intensity = 0.55; sun.intensity = 2.9; sun.color.set(0xffe9c8);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  // gradient sky
  window.SKYTEX = tex(4, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4f8fe0'); gr.addColorStop(0.55, '#9ccaf2'); gr.addColorStop(1, '#e6f1fb'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  // lock cutaway: brushed metal housing
  housing.material.color.set(0xd8dbe2); housing.material.envMapIntensity = 1.2;
})();
