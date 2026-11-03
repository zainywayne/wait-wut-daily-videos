// Visual polish layer: loaded after world.js. Textures, rounded edges, env lighting, grass, gradient sky.
(() => {
  R.setPixelRatio(window.devicePixelRatio || 1); R.setSize(W, H, false);
  R.toneMappingExposure = 1.0;
  const tex = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
  let s2 = 11; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  // grass ground
  const grassT = tex(512, 512, (g, w, h) => { g.fillStyle = '#5f9a3e'; g.fillRect(0, 0, w, h); for (let k = 0; k < 9000; k++) { const v = r2(); g.fillStyle = v < 0.5 ? `rgba(70,120,40,${0.35 + r2() * 0.4})` : v < 0.85 ? `rgba(130,180,80,${0.3 + r2() * 0.4})` : `rgba(160,150,90,0.35)`; g.fillRect(r2() * w, r2() * h, 2 + r2() * 3, 4 + r2() * 7); } }, 60, 60);
  ground.material = new THREE.MeshStandardMaterial({ map: grassT, roughness: 0.95 });
  // grass tufts around the yard
  const blade = new THREE.ConeGeometry(0.018, 0.15, 3); blade.translate(0, 0.075, 0);
  const NB = 2600, tufts = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0x6aa646, roughness: 0.9 }), NB); const dm = new THREE.Object3D(), col = new THREE.Color();
  for (let k = 0; k < NB; k++) { let x, z; do { x = -9 + r2() * 18; z = -5 + r2() * 13; } while (Math.abs(x) < 1.4 && Math.abs(z) < 1.9 || Math.hypot(x - 2.6, z - 2.2) < 0.6); dm.position.set(x, 0, z); dm.rotation.set((r2() - 0.5) * 0.5, r2() * 6, (r2() - 0.5) * 0.5); const s = 0.6 + r2() * 0.9; dm.scale.set(s, s * (0.7 + r2() * 0.8), s); dm.updateMatrix(); tufts.setMatrixAt(k, dm.matrix); col.setHSL(0.23 + r2() * 0.06, 0.38, 0.28 + r2() * 0.12); tufts.setColorAt(k, col); }
  tufts.receiveShadow = true; scene.add(tufts);
  // small flowers
  for (let k = 0; k < 40; k++) { const x = -8 + r2() * 16, z = -3 + r2() * 10; if (Math.abs(x) < 1.4 && Math.abs(z) < 1.9 || Math.hypot(x - 2.6, z - 2.2) < 0.7) continue; mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: [0xffffff, 0xffd84a, 0xff8fb0][k % 3], roughness: 0.6 }), x, 0.18, z).castShadow = false; }
  // environment lighting (soft reflections) from a gradient sky scene
  const envS = new THREE.Scene(); const sg = new THREE.SphereGeometry(50, 32, 16); const cs = []; const pos = sg.attributes.position; for (let k = 0; k < pos.count; k++) { const y = pos.getY(k) / 50; const c = y > 0 ? new THREE.Color(0xbfdcff).lerp(new THREE.Color(0x5d9ae0), y) : new THREE.Color(0x7a8a5a); cs.push(c.r, c.g, c.b); }
  sg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); envS.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sunDisk = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 7, 6) })); sunDisk.position.set(-20, 30, 22); envS.add(sunDisk);
  const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(envS, 0.02).texture; scene.traverse(o => { if (o.isMesh && o.material.isMeshStandardMaterial) if (o.material.envMapIntensity === 1) o.material.envMapIntensity = o.material.metalness > 0.5 ? 1.0 : 0.5; });
  hemi.intensity = 0.55; sun.intensity = 2.9; sun.color.set(0xffe9c8);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  // gradient sky
  window.SKYTEX = tex(4, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4f8fe0'); gr.addColorStop(0.55, '#9ccaf2'); gr.addColorStop(1, '#e6f1fb'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const nyT = tex(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,0.06)'; for (let k = 0; k < w; k += 6) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(w, k); g.stroke(); } g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; for (let k = 0; k < w; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, h); g.stroke(); } }, 3, 3);
  [nylon, nylonD].forEach(m => { m.map = nyT; m.needsUpdate = true; });
  for (let k = 0; k < 30; k++) { const a = r2() * 6.28, d = 6 + r2() * 6; mesh(new THREE.DodecahedronGeometry(0.15 + r2() * 0.25, 0), new THREE.MeshStandardMaterial({ color: 0x8d8a86, roughness: 0.9, flatShading: true }), Math.cos(a) * d, 0.05, Math.sin(a) * d - 2); }
})();
