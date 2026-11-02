bucket.visible = false; mouth.rotation.z = 0; mouth.scale.set(0.8, 0.25, 1); mouth.position.y = 1.74;
// backpack for the traveller
const pack = mesh(new THREE.BoxGeometry(0.42, 0.55, 0.22), SM(0x6f8fb0), 0, 1.2, -0.24, guy); mesh(new THREE.BoxGeometry(0.36, 0.2, 0.08), SM(0x5a7896), 0, 1.05, -0.37, guy);
const SHOTS = {
  intro:   { space: true, all: true, cam: [[0, -24, -200], [0, -24, -208]], look: [[0, -24, -300], [0, -24, -300]] },
  outro:   { space: true, all: true, cam: [[0, -24, -208], [0, -24, -200]], look: [[0, -24, -300], [0, -24, -300]] },
  p1:      { space: true, cam: [[0, -24, -208], [0, 2, -268]], look: [[0, -24, -300], [0, 0, -300]] },
  space:   { space: true, cam: [[0, 4, -262], [0, 2, -272]], look: [[0, 0, -300], [0, 0, -300]] },
  land:    { lvl: ['P1', '2026'], cars: 'new', lights: 1, cam: [[0.6, 1.7, 9], [0.4, 1.6, 4.5]], look: [[0, 1.2, -6], [0, 1.2, -9]], guy: { from: [0, 0, 6.5], to: [0, 0, 1.5] } },
  signs:   { lvl: ['P1', '2026'], cars: 'new', lights: 1, cam: [[0.2, 1.6, 9.5], [1.1, 1.9, 8.2]], look: [[1.9, 2.1, 5.3], [1.9, 2.1, 5.3]], guy: { p: [0.6, 0, 7.4], ry: Math.PI * 0.85 } },
  ramp:    { ramp: true, cam: [[0, 1.4, 10], [0, 0.4, 4]], look: [[0, -1.0, 0], [0, -2.2, -4]], guy: { from: [0, 0, 7], to: [0, -2.3, -1], ry: Math.PI } },
  older:   { lvl: ['P40', '1986'], cars: 'old', lights: 0.75, flicker: 0.2, cam: [[0.6, 1.7, 9], [0.4, 1.6, 4]], look: [[0, 1.2, -6], [-1.2, 1.0, -9]], guy: { from: [0, 0, 6.5], to: [-0.8, 0, 1.0] } },
  warm:    { lvl: ['P40', '1986'], cars: 'old', lights: 0.75, steam: true, cam: [[-0.4, 1.7, 3.6], [-0.9, 1.5, 2.8]], look: [[-4.2, 0.9, -0.2], [-4.2, 0.8, -0.3]], guy: { p: [-1.3, 0, -1.2], ry: -Math.PI / 2 } },
  ticket:  { lvl: ['P73', '1953'], cars: 'old', lights: 0.55, flicker: 0.35, ticket: true, cam: [[-0.9, 1.7, -0.2], [-0.5, 1.5, -1.2]], look: [[1.6, 1.0, -3.6], [1.6, 0.9, -3.6]], guy: { p: [0.6, 0, -3.6], ry: Math.PI / 2 } },
  hundred: { lvl: ['P100', '----'], cars: 'none', lights: 0.0, spotOn: true, cam: [[3, 1.7, 9], [0.8, 1.6, 4]], look: [[-4.2, 0.3, 0], [-4.2, 0.2, 0]], guy: { from: [1.2, 0, 7], to: [-1.6, 0, 1.0] } },
  name:    { lvl: ['P100', '----'], cars: 'none', lights: 0.0, spotOn: true, cam: [[-2.4, 2.6, 2.0], [-3.2, 2.4, 1.4]], look: [[-4.2, 0, 0], [-4.2, 0, 0]], guy: { p: [-2.2, 0, 0.4], ry: -Math.PI / 2 } },
  engine:  { lvl: ['P100', '----'], cars: 'one', lights: 0.0, spotOn: true, headlights: true, cam: [[-3.4, 1.6, 2.0], [-3.6, 1.5, 1.4]], look: [[-2.2, 1.2, 0.4], [1.2, 0.8, 9.5]], guy: { p: [-2.2, 0, 0.4], ry: 0 } },
  end:     { lvl: ['P100', '----'], cars: 'one', lights: 0.0, spotOn: true, headlights: true, cam: [[-3.6, 1.5, 1.4], [-3.6, 1.5, 1.4]], look: [[1.2, 0.8, 9.5], [1.2, 0.8, 9.5]], guy: { p: [-2.2, 0, 0.4], ry: 0 } },
};
const lastCar = car('old', 0x1a1a1a); lastCar.position.set(1.2, 0, 9.5); lastCar.rotation.y = Math.PI; LEVEL.add(lastCar);
const hlGlow = []; for (const x of [-0.6, 0.6]) { const gq = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0, depthWrite: false })); gq.position.set(x, 0.65, 2.45); gq.scale.set(1.4, 0.7, 0.3); lastCar.add(gq); hlGlow.push(gq); }
const carHL = new THREE.SpotLight(0xfff4d0, 0, 25, 0.5, 0.4, 1); carHL.position.set(1.2, 0.7, 7.2); carHL.target.position.set(-2.2, 1, 0); LEVEL.add(carHL); LEVEL.add(carHL.target);
let TIMING = null; window.setTiming = (t) => { TIMING = t; };
let lastLvl = '';
window.renderAt = (t) => {
  const segs = TIMING.segs; let i = 0; while (i < segs.length - 1 && t >= segs[i + 1].start) i++;
  const sg = segs[i], sh = SHOTS[sg.shot], lt = t - sg.start, pr = Math.min(1, lt / sg.dur), e = ease(pr);
  SPACE.visible = !!sh.space; LEVEL.visible = !sh.space && !sh.ramp; RAMP.visible = !!sh.ramp; guy.visible = !sh.space;
  labels.forEach(l => l.visible = !!sh.all); P2.rotation.y = t * 0.06; P3.rotation.y = -t * 0.05;
  if (sh.space) { scene.background = new THREE.Color(0x020308); scene.fog = null; hemi.intensity = 0.15; planet.rotation.y = t * 0.05; }
  else { scene.background = new THREE.Color(0x0c0d0a); scene.fog = new THREE.Fog(0x14150f, 6, sh.lights === 0 ? 14 : 30); hemi.intensity = 0.15 + 0.5 * (sh.lights ?? 1); }
  if (sh.lvl && sh.lvl.join() !== lastLvl) { setSign(sh.lvl[0], sh.lvl[1]); lastLvl = sh.lvl.join(); }
  carsNew.forEach(c => c.visible = sh.cars === 'new'); carsOld.forEach(c => c.visible = sh.cars === 'old');
  lastCar.visible = sh.cars === 'one' || sh.cars === 'none' ? sh.cars === 'one' : false;
  let lv = sh.lights ?? 1; if (sh.flicker && Math.sin(t * 37) * Math.sin(t * 13) > 1 - sh.flicker) lv *= 0.25;
  lamps.forEach(l => l.intensity = 6 * lv); panels.forEach(p => p.material.color.setScalar(0.2 + 0.8 * lv));
  spot.intensity = sh.spotOn ? 30 : 0; reserved.visible = !!sh.spotOn;
  steam.forEach(s => { s.visible = !!sh.steam; if (sh.steam) { const ph = (t * 0.5 + s.userData.ph) % 1; s.position.set(-3.6 + Math.sin(ph * 9 + s.userData.ph * 5) * 0.2, 1.1 + ph * 1.3, -0.3 + Math.cos(s.userData.ph * 7) * 0.4); s.scale.setScalar(0.6 + ph * 2); s.material.opacity = 0.25 * (1 - ph); } });
  ticket.visible = !!sh.ticket; if (sh.ticket) { ticket.position.z = 0.25 + Math.min(1, lt / 1.5) * 0.12; }
  const hlOn = sh.headlights ? (lt > 0.6 || sg.shot === 'end' ? 1 : 0) : 0; carHL.intensity = 60 * hlOn; lastCar.userData.hl.forEach(h => h.material.color.set(hlOn ? 0xfffbe8 : 0x666660)); hlGlow.forEach(gq => gq.material.opacity = 0.55 * hlOn);
  cam.position.lerpVectors(V(sh.cam[0]), V(sh.cam[1]), e); cam.position.x += Math.sin(t * 0.6) * 0.03; cam.position.y += Math.sin(t * 0.8) * 0.02;
  const lk = new THREE.Vector3().lerpVectors(V(sh.look[0]), V(sh.look[1]), e); if (sh.ramp) { cam.position.add(RAMP.position); lk.add(RAMP.position); } cam.lookAt(lk);
  if (sh.guy) { const g = sh.guy; if (g.from) { const a = V(g.from), b = V(g.to); guy.position.lerpVectors(a, b, Math.min(1, pr * 1.05)); guy.rotation.y = g.ry ?? Math.atan2(b.x - a.x, b.z - a.z); pose(true, t * 0.8); guy.position.y += a.y + (b.y - a.y) * Math.min(1, pr * 1.05); if (sh.ramp) guy.position.add(RAMP.position); }
    else { guy.position.set(...g.p); guy.rotation.y = g.ry; pose(false, t); } }
  arms[0].rotation.z = 0; arms[1].rotation.z = 0; if (sh.ticket && lt > 0.4) arms[1].rotation.x = -1.3;
  R.render(scene, cam); return sg.shot;
};
