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
