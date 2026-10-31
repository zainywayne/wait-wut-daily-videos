// SplitLife v3: animated scenes. Each scene(side, lt, dur, t) returns SVG markup for a 1080x960 half.
const O = 'stroke="#151515" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"';
const o = 'stroke="#151515" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
const cl = x => Math.max(0, Math.min(1, x));
const ez = x => 1 - Math.pow(1 - x, 3);
const ezio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const sn = Math.sin, PI = Math.PI;
const tx = (x, y, s, txt, fill = '#151515', a = 'middle', ex = '') => `<text x="${x}" y="${y}" font-size="${s}" font-weight="700" text-anchor="${a}" fill="${fill}" font-family="Poppins" ${ex}>${txt}</text>`;

// ---------- character ----------
// p: {who:'rich'|'broke'|'chef', x, y (feet), s scale, armL, armR (raise deg), bendL, bendR, legL, legR (deg), tilt, mouth, eyes, blink(0..1), propR, propL, glasses, lean, hideLegs}
function guy(p) {
  const s = p.s || 1, who = p.who;
  const skin = p.skin || ((who === 'rich' || who === 'broke' || who === 'young') ? '#d9a074' : '#f0c9a0');
  const top = who === 'young' ? '#3f6f9a' : who === 'fam' ? p.col : who === 'rich' ? 'url(#gNavy)' : who === 'broke' ? 'url(#gHood)' : 'url(#gWhite)';
  const pants = who === 'fam' ? '#3d4a63' : who === 'rich' ? '#1b2238' : who === 'broke' ? '#5d7ea6' : '#2b2f36';
  const shoe = who === 'fam' ? '#2b2f36' : who === 'rich' ? '#0d0d0d' : who === 'broke' ? '#e9ecef' : '#151515';
  const leg = (x, a) => `<g transform="rotate(${a||0} ${x} -200)"><rect x="${x-21}" y="-205" width="42" height="190" rx="14" fill="${pants}" ${O}/><ellipse cx="${x+(who==='broke'?4:8)}" cy="-10" rx="36" ry="17" fill="${shoe}" ${O}/>${who==='broke'?`<path d="M${x-20} -14 h44" stroke="#c9ced6" stroke-width="5"/>`:''}</g>`;
  const arm = (side, raise, bend, prop) => {
    const sx = side * 64, r = side < 0 ? raise : -raise, b = side < 0 ? -bend : bend;
    const sleeve = top;
    const cuff = who === 'rich' ? `<rect x="-20" y="80" width="40" height="14" fill="#fff" ${o}/>` : '';
    const watch = who === 'rich' && side > 0 ? `<rect x="-19" y="66" width="38" height="14" rx="4" fill="url(#gGold)" ${o}/>` : '';
    return `<g transform="translate(${sx} -385) rotate(${r||0})"><rect x="-20" y="-10" width="40" height="110" rx="18" fill="${sleeve}" ${O}/>
      <g transform="translate(0 92) rotate(${b||0})"><rect x="-19" y="-8" width="38" height="96" rx="17" fill="${sleeve}" ${O}/>${cuff}${watch}<circle cx="0" cy="98" r="22" fill="${skin}" ${O}/>${prop?`<g transform="translate(0 98)">${prop}</g>`:''}</g></g>`;
  };
  let torso;
  if (who === 'rich') torso = `<rect x="-70" y="-405" width="140" height="215" rx="34" fill="url(#gNavy)" ${O}/>
    <path d="M-30 -405 L0 -330 L30 -405Z" fill="#fff" ${o}/><path d="M-8 -385 h16 l6 80 l-14 18 l-14 -18Z" fill="url(#gGold)" ${o}/>
    <path d="M-34 -405 l-14 60 l40 40 M34 -405 l14 60 l-40 40" fill="none" ${o}/><circle cx="0" cy="-250" r="7" fill="url(#gGold)" ${o}/>
    <path d="M-52 -330 h26" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;
  else if (who === 'broke') torso = `<rect x="-72" y="-405" width="144" height="220" rx="38" fill="url(#gHood)" ${O}/>
    <path d="M-44 -410 q44 50 88 0" fill="#7d8590" ${o}/><path d="M-14 -372 v50 M14 -372 v50" stroke="#e9ecef" stroke-width="5" stroke-linecap="round"/>
    <rect x="-46" y="-275" width="92" height="44" rx="10" fill="#7d8590" ${o}/><ellipse cx="34" cy="-320" rx="14" ry="9" fill="#b7894a" opacity=".7"/>`;
  else if (who === 'young') torso = `<rect x="-68" y="-405" width="136" height="215" rx="32" fill="#3f6f9a" ${O}/><path d="M-24 -405 q24 26 48 0" fill="none" ${o}/>`;
  else if (who === 'fam') torso = `<rect x="-70" y="-405" width="140" height="215" rx="34" fill="${p.col}" ${O}/><path d="M-26 -405 q26 30 52 0" fill="none" ${o}/>`;
  else torso = `<rect x="-70" y="-405" width="140" height="215" rx="34" fill="url(#gWhite)" ${O}/><g fill="#151515"><circle cx="-20" cy="-350" r="6"/><circle cx="-20" cy="-300" r="6"/><circle cx="20" cy="-350" r="6"/><circle cx="20" cy="-300" r="6"/></g><path d="M-40 -405 h80 v14 h-80Z" fill="#e2463b"/>`;
  // head
  const ey = -478, bl = p.blink || 0, eyes = p.eyes || 'open';
  let eyeSvg = '';
  if (p.glasses) eyeSvg = `<path d="M-58 ${ey-14} h116 v10 q-6 26 -30 26 q-22 0 -26 -22 h-4 q-4 22 -26 22 q-24 0 -30 -26Z" fill="#111" ${o}/><path d="M-44 ${ey-6} l14 0" stroke="#fff" stroke-width="4" opacity=".7"/>`;
  else if (eyes === 'closed' || bl > .5) eyeSvg = `<path d="M-40 ${ey} q12 10 24 0 M16 ${ey} q12 10 24 0" fill="none" stroke="#151515" stroke-width="6" stroke-linecap="round"/>`;
  else {
    const R = eyes === 'wide' ? 17 : 12, pr = eyes === 'wide' ? 6 : 8, lx = p.look || 0;
    eyeSvg = [-28, 28].map(x => `<ellipse cx="${x}" cy="${ey}" rx="${R}" ry="${R*(1-bl)}" fill="#fff" ${o}/><circle cx="${x+lx}" cy="${ey+1}" r="${pr*(1-bl)}" fill="#151515"/>`).join('');
    if (eyes === 'tired' || (who === 'broke' && !p.nobags)) eyeSvg += `<path d="M-42 ${ey+20} q14 8 28 0 M14 ${ey+20} q14 8 28 0" stroke="#7a4a3a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  }
  const m = p.mouth || 'flat', my = -436;
  const mouths = {
    smile: `<path d="M-24 ${my-4} q24 26 48 0" fill="none" stroke="#151515" stroke-width="6" stroke-linecap="round"/>`,
    grin: `<path d="M-30 ${my-8} q30 40 60 0Z" fill="#fff" ${o}/>`,
    flat: `<path d="M-16 ${my} h32" stroke="#151515" stroke-width="6" stroke-linecap="round"/>`,
    sad: `<path d="M-22 ${my+8} q22 -22 44 0" fill="none" stroke="#151515" stroke-width="6" stroke-linecap="round"/>`,
    o: `<ellipse cx="0" cy="${my}" rx="12" ry="16" fill="#5a1f1f" ${o}/>`,
    chew: `<ellipse cx="0" cy="${my}" rx="16" ry="${4 + 8 * Math.abs(sn((p.t||0) * 14))}" fill="#5a1f1f" ${o}/>`,
    yawn: `<ellipse cx="0" cy="${my+4}" rx="20" ry="26" fill="#5a1f1f" ${o}/>`
  };
  let hair;
  if (who === 'rich') hair = `<path d="M-74 -500 q-4 -76 74 -84 q84 2 78 84 q-10 -40 -50 -44 q-20 22 -102 44Z" fill="#2a1d14" ${O}/>`;
  else if (who === 'broke') hair = `<path d="M-76 -490 l-10 -40 l26 8 l-4 -40 l30 22 l16 -40 l20 34 l26 -36 l10 40 l30 -14 l-6 40 l20 6 l-10 34 q-30 -36 -74 -34 q-46 -2 -74 20Z" fill="#5a3a22" ${O}/>`;
  else if (who === 'young') hair = `<path d="M-74 -498 q-2 -74 74 -82 q78 4 76 82 q-18 -36 -54 -40 q-30 14 -96 40Z" fill="#3a2a1e" ${O}/>`;
  else if (who === 'fam') hair = p.hs === 'bun' ? `<circle cx="0" cy="-560" r="34" fill="#3a2a1e" ${O}/><path d="M-76 -470 q-6 -80 76 -84 q82 4 76 84 q-20 -50 -76 -50 q-56 0 -76 50Z" fill="#3a2a1e" ${O}/>` : p.hs === 'curly' ? `<g fill="#2a1d14" ${o}>${[-60,-30,0,30,60].map((x,i)=>`<circle cx="${x}" cy="${-530-(i%2)*14}" r="30"/>`).join('')}</g>` : `<path d="M-74 -500 q0 -70 74 -76 q74 6 74 76 q-30 -30 -74 -30 q-44 0 -74 30Z" fill="#1d140e" ${O}/>`;
  else hair = `<path d="M-60 -530 q-30 -40 0 -70 q20 -40 60 -20 q40 -20 60 20 q30 30 0 70Z" fill="#fff" ${O}/><rect x="-60" y="-540" width="120" height="30" fill="#fff" ${O}/>`;
  const brow = p.brow === 'up' ? `<path d="M-42 ${ey-30} l26 -8 M16 ${ey-38} l26 8" stroke="#151515" stroke-width="6" stroke-linecap="round"/>` : p.brow === 'worry' ? `<path d="M-42 ${ey-26} l26 -10 M16 ${ey-36} l26 10" stroke="#151515" stroke-width="6" stroke-linecap="round" transform="scale(-1 1)"/>` : '';
  const head = `<g transform="rotate(${p.tilt||0} 0 -420)"><rect x="-20" y="-430" width="40" height="40" fill="${skin}" ${o}/>
    <ellipse cx="0" cy="-470" rx="74" ry="80" fill="${skin}" ${O}/><ellipse cx="-74" cy="-466" rx="12" ry="18" fill="${skin}" ${o}/><ellipse cx="74" cy="-466" rx="12" ry="18" fill="${skin}" ${o}/>
    ${hair}${eyeSvg}${brow}${mouths[m]}${who==='broke'?`<path d="M-50 -420 l4 4 M-40 -414 l4 4 M40 -416 l4 4 M50 -422 l4 4" stroke="#5a3a22" stroke-width="4"/>`:''}</g>`;
  const legs = p.hideLegs ? '' : leg(-26, p.legL) + leg(26, p.legR);
  return `<g transform="translate(${p.x} ${p.y}) scale(${s}) rotate(${p.lean||0} 0 -200)">${legs}${arm(-1, p.armL||8, p.bendL||0, p.propL)}${torso}${arm(1, p.armR||8, p.bendR||0, p.propR)}${head}</g>`;
}

// ---------- props ----------
const P = {
  fork: `<g transform="rotate(180)"><rect x="-4" y="-10" width="8" height="70" fill="url(#gSteel)" ${o}/><path d="M-12 58 v24 M0 58 v28 M12 58 v24" stroke="#151515" stroke-width="5"/></g>`,
  phoneGlow: `<rect x="-26" y="-60" width="52" height="92" rx="10" fill="#1b1f24" ${o}/><rect x="-20" y="-52" width="40" height="72" rx="4" fill="#0b0f0d"/><path d="M-16 -40 l10 10 l8 -6 l10 22 l6 -4" fill="none" stroke="#ff4d4d" stroke-width="4"/>`,
  mug: `<g transform="translate(0 -10)"><path d="M-34 -40 h68 v62 q0 18 -18 18 h-32 q-18 0 -18 -18Z" fill="url(#gRed)" ${o}/><ellipse cx="0" cy="-40" rx="34" ry="9" fill="#f3c55a" ${o}/></g>`,
  glass: `<g transform="translate(0 -20)"><path d="M-18 -70 h36 q2 40 -18 50 q-20 -10 -18 -50Z" fill="#ffe39a" ${o}/><path d="M0 -20 v40 M-16 20 h32" stroke="#151515" stroke-width="6"/></g>`,
  letter: `<g transform="rotate(-8)"><rect x="-70" y="-120" width="140" height="110" rx="6" fill="url(#gWhite)" ${O}/>${tx(0,-82,16,'FINAL NOTICE')}${tx(0,-40,30,'LATE FEE','#e2463b')}</g>`,
  container: `<g transform="translate(0 -6)"><path d="M-40 -30 h80 l-8 40 h-64Z" fill="#dfe3e8" ${o}/><path d="M-30 -30 q15 -14 30 0 t30 0" stroke="#f3c55a" stroke-width="7" fill="none"/></g>`,
  card: `<rect x="-36" y="-30" width="72" height="46" rx="6" fill="#151515" ${o}/><rect x="-26" y="-20" width="18" height="14" rx="3" fill="url(#gGold)"/>`
};

// ---------- reusable bits ----------
const sky = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
function city(y, sc, shift, col, lit) {
  let s = '', x = -((shift % 1600) + 1600) % 1600;
  for (let rep = 0; rep < 3; rep++) {
    const bs = [[0,180],[90,260],[170,140],[240,320],[340,200],[420,280],[520,160],[590,360],[700,220],[790,300],[900,180],[980,250],[1080,330],[1180,190],[1270,270],[1370,210],[1460,300],[1530,170]];
    for (const [bx, bh] of bs) { const X = x + rep * 1600 + bx * 1; if (X > 1100 || X < -120) continue; const h = bh * sc;
      s += `<rect x="${X}" y="${y-h}" width="${86}" height="${h}" fill="${col}"/>`;
      if (lit) for (let wy = y - h + 18; wy < y - 14; wy += 30) for (let wx = 12; wx < 76; wx += 24) if (((bx + wy + wx) * 7) % 5 < 2) s += `<rect x="${X+wx}" y="${wy}" width="10" height="12" fill="${lit}"/>`; }
  }
  return s;
}
const cloud = (x, y, k = 1, f = '#fff') => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-80 20 q-10 -50 40 -46 q16 -40 64 -24 q40 -20 60 22 q40 4 26 48Z" fill="${f}" ${o}/></g>`;
const floor = (y, c1, c2) => `<rect x="0" y="${y}" width="1080" height="${960-y}" fill="${c1}"/><rect x="0" y="${y}" width="1080" height="10" fill="${c2}"/>`;

// ---------- scenes ----------
const SC = {};
SC.wake = (side, lt, dur, t) => {
  if (side === 'rich') {
    const open = ez(cl(lt / 1.2)), sun = cl(lt / 2);
    const sit = ez(cl((lt - .3) / .6)), stretch = ezio(cl((lt - .7) / .8));
    return `<defs>${sky('wk1', '#ff9b5e', '#ffe2a0')}</defs>
    <rect width="1080" height="960" fill="#e9dcc4"/><rect x="0" y="0" width="1080" height="960" fill="#1d3a2e" opacity=".25"/>
    <rect x="520" y="110" width="500" height="520" rx="10" fill="url(#wk1)" ${O}/>
    <circle cx="770" cy="${520-sun*120}" r="70" fill="#fff4d0"/>${city(630, .9, 0, '#2a4a3c', '#ffd77a')}
    <path d="M770 110 v520 M520 370 h500" stroke="#151515" stroke-width="7"/>
    <path d="M500 96 h${270-open*200} q-20 260 0 548 h-${270-open*200}Z" fill="url(#gGold)" ${O}/><path d="M1040 96 h-${270-open*200} q20 260 0 548 h${270-open*200}Z" fill="url(#gGold)" ${O}/>
    <rect x="490" y="84" width="560" height="22" rx="10" fill="url(#gGold)" ${O}/>
    ${floor(800, '#b48a5a', '#8a6236')}
    <rect x="40" y="420" width="520" height="150" rx="30" fill="url(#gGold)" ${O}/>
    ${guy({who:'rich', x:300, y:900 - sit*60, s:1.05, armL:10+stretch*160, armR:10+stretch*160, bendL:stretch*-10, bendR:stretch*-10, mouth: stretch>.3&&stretch<.9?'yawn':'smile', eyes: lt<.8?'closed':'open', hideLegs:true, t})}
    <path d="M10 640 q280 -60 600 0 v200 h-600Z" fill="#fbfbf7" ${O}/><path d="M10 640 q280 -60 600 0" fill="none" stroke="url(#gGold)" stroke-width="16"/>
    <rect x="10" y="760" width="600" height="80" fill="url(#gGold)" ${O}/>
    ${Array.from({length:6},(_,i)=>`<path d="M${770+Math.cos(i)*140} ${400+Math.sin(i)*140} l${Math.cos(i+t)*30} ${Math.sin(i+t)*30}" stroke="#fff" stroke-width="6" opacity="${.3+.3*sn(t*3+i)}" stroke-linecap="round"/>`).join('')}`;
  } else {
    const slap = lt > 1.0 && lt < 1.5 ? sn((lt - 1.0) / .5 * PI) : 0, ring = lt < 1.25;
    const buzz = ring ? sn(t * 70) * 6 : 0;
    return `<rect width="1080" height="960" fill="#3b4250"/><rect x="0" y="0" width="1080" height="960" fill="url(#gNight)" opacity=".7"/>
    <rect x="680" y="120" width="260" height="220" rx="8" fill="#1b2433" ${O}/><path d="M810 120 v220 M680 230 h260" stroke="#151515" stroke-width="7"/><circle cx="880" cy="170" r="22" fill="#e9ecef" opacity=".7"/>
    <rect x="120" y="140" width="150" height="200" fill="#c9a46a" opacity=".5" transform="rotate(-4 195 240)" ${o}/><path d="M250 150 l20 30" stroke="#151515" stroke-width="5"/>
    ${floor(760, '#5a5248', '#3d362f')}
    <rect x="60" y="700" width="760" height="110" rx="18" fill="#c9ced6" ${O}/>
    <g transform="translate(700 760) rotate(-90)">${guy({who:'broke', x:0, y:0, s:.85, armL:0, armR:0, mouth: slap>0?'o':'flat', eyes: lt<1?'closed':'tired', hideLegs:true, t})}</g>
    <path d="M330 690 q260 -60 520 -10 v150 h-520Z" fill="#7a8aa0" ${O}/><path d="M360 720 q200 -30 460 0" stroke="#5f6f86" stroke-width="6" fill="none"/>
    <g transform="rotate(${-slap*40} 600 700)"><path d="M600 700 L${780} 700" stroke="#151515" stroke-width="44" stroke-linecap="round"/><path d="M600 700 L780 700" stroke="#959daa" stroke-width="30" stroke-linecap="round"/><circle cx="800" cy="700" r="24" fill="#c98e62" ${O}/></g>
    <g transform="translate(${900+buzz} 720) rotate(${buzz})"><rect x="-40" y="-70" width="80" height="140" rx="14" fill="#1b1f24" ${O}/><rect x="-32" y="-58" width="64" height="104" rx="6" fill="${ring?'#cfe3ff':'#2a3140'}"/>${ring?tx(0,-10,26,'6:00'):''}</g>
    ${ring?`<path d="M840 660 l-20 -10 M840 720 h-24 M960 660 l20 -10 M960 720 h24" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`:''}
    ${lt>1.5?`<g font-family="Poppins" font-weight="700" fill="#fff" stroke="#151515" stroke-width="5" paint-order="stroke">${tx(330,600-((lt*40)%60),50,'Z','#fff')}${tx(380,540-((lt*40)%60),64,'Z','#fff')}</g>`:''}`;
  }
};
SC.breakfast = (side, lt, dur, t) => {
  if (side === 'rich') {
    const slide = ez(cl(lt / .6)), cyc = (lt % 1.2) / 1.2, lift = lt > .8 ? sn(cyc * PI) : 0;
    return `<rect width="1080" height="960" fill="#e8e2d6"/><rect x="0" y="0" width="1080" height="420" fill="#20352c" opacity=".12"/>
    <rect x="620" y="110" width="380" height="300" rx="8" fill="#bfe3f5" ${O}/>${city(410,.6,0,'#7fa69a')}<path d="M810 110 v300" stroke="#151515" stroke-width="7"/>
    ${[250,520].map(x=>`<path d="M${x} 0 v120" stroke="#151515" stroke-width="5"/><path d="M${x-50} 170 q50 -70 100 0Z" fill="url(#gGold)" ${O}/><ellipse cx="${x}" cy="176" rx="40" ry="10" fill="#fff6c8" opacity="${.6+.3*sn(t*4)}"/>`).join('')}
    ${guy({who:'rich', x:330, y:900, s:1.0, armL:12, armR:22+lift*20, bendR:lift*125, propR: lift>.2?P.fork:'', mouth: lift>.6||lt>1.6&&lift<.3?'chew':'smile', eyes:'open', hideLegs:true, look:6, t})}
    ${guy({who:'chef', x:1200-slide*300, y:900, s:.95, armL:70, armR:70, bendL:-20, bendR:-20, mouth:'smile', hideLegs:true, t})}
    <rect x="20" y="620" width="1040" height="60" rx="10" fill="url(#gMarble)" ${O}/><rect x="60" y="680" width="960" height="280" fill="#2b3a33" ${O}/>
    <path d="M40 640 q200 20 400 -6 M600 650 q160 -14 400 8" stroke="#c9ced6" stroke-width="4" fill="none"/>
    <g transform="translate(${900-slide*380} 600)"><ellipse cx="0" cy="10" rx="130" ry="34" fill="url(#gWhite)" ${O}/><ellipse cx="-30" cy="0" rx="46" ry="20" fill="#fff" ${o}/><circle cx="-30" cy="-4" r="13" fill="url(#gYolk)" ${o}/><ellipse cx="40" cy="4" rx="42" ry="18" fill="#fff" ${o}/><circle cx="40" cy="0" r="12" fill="url(#gYolk)" ${o}/><g fill="#2a2018"><circle cx="-60" cy="-6" r="5"/><circle cx="10" cy="-10" r="5"/><circle cx="70" cy="-2" r="5"/></g>
    ${[-30,20,60].map((x,i)=>`<path d="M${x} -40 q-12 -20 0 -40 q12 -20 0 -40" stroke="#fff" stroke-width="6" fill="none" opacity="${.4+.3*sn(t*3+i)}" stroke-linecap="round"/>`).join('')}</g>`;
  } else {
    const cyc = (lt % 1.0) / 1.0, slurp = sn(cyc * PI);
    const fx = 760 + sn(t * 5) * 90, fy = 260 + sn(t * 7.3) * 60;
    return `<rect width="1080" height="960" fill="#9aa39a"/><rect width="1080" height="960" fill="url(#gNight)" opacity=".25"/>
    <rect x="80" y="140" width="300" height="190" rx="8" fill="#e9ecef" ${O}/><rect x="100" y="160" width="190" height="150" rx="6" fill="#2b2f36"/><g fill="#7cff8a">${tx(335,215,22,'0:00','#7cff8a')}</g><rect x="310" y="240" width="50" height="16" rx="4" fill="#9aa1aa"/>
    <path d="M620 0 v100" stroke="#151515" stroke-width="5"/><circle cx="620" cy="120" r="22" fill="#fff3c4" ${O}/>
    ${guy({who:'broke', x:560, y:910, s:1.0, armL:10, armR:30+slurp*15, bendR:110+slurp*15, propR:P.mug, mouth: slurp>.4?'o':'flat', eyes:'tired', hideLegs:true, tilt: slurp*-6, t})}
    ${slurp>.4?`<path d="M560 ${438} q-6 30 8 60" stroke="#f3c55a" stroke-width="7" fill="none"/>`:''}
    <rect x="0" y="640" width="1080" height="50" fill="#b9ad97" ${O}/><rect x="0" y="690" width="1080" height="270" fill="#7a6a55" ${O}/>
    <g transform="translate(870 640)">${[0,1,2,3].map(i=>`<ellipse cx="${i%2*14}" cy="${-14-i*20}" rx="70" ry="14" fill="#dfe3e8" ${o}/>`).join('')}</g>
    <g transform="translate(${fx} ${fy})"><circle r="9" fill="#151515"/><ellipse cx="-8" cy="-10" rx="10" ry="6" fill="#fff" opacity=".7" transform="rotate(${sn(t*60)*30})"/><ellipse cx="8" cy="-10" rx="10" ry="6" fill="#fff" opacity=".7" transform="rotate(${-sn(t*60)*30})"/></g>
    <path d="M${fx-30} ${fy+10} q-20 10 -40 -6" stroke="#151515" stroke-width="3" fill="none" stroke-dasharray="6 8" opacity=".5"/>`;
  }
};
SC.commute = (side, lt, dur, t) => {
  if (side === 'rich') {
    const bob = sn(t * 3) * 14, rot = Math.abs(sn(t * 40));
    return `<defs>${sky('cm1', '#7cc8ff', '#dff3ff')}</defs><rect width="1080" height="960" fill="url(#cm1)"/>
    ${cloud(((900 - lt*260) % 1400 + 1400) % 1400 - 200, 220, 1.1)}${cloud(((300 - lt*200) % 1400 + 1400) % 1400 - 200, 380, .8)}${cloud(((1300 - lt*320) % 1400 + 1400) % 1400 - 200, 120, .7)}
    ${city(960, 1.6, lt*380, '#5f8aa6', '#ffe39a')}${city(960, 1.1, lt*600, '#3d6680', null)}
    <g transform="translate(520 ${430+bob}) rotate(${-4+sn(t*2)*2})">
      <ellipse cx="0" cy="-150" rx="${380*(0.25+0.75*rot)}" ry="14" fill="#151515" opacity=".85"/><rect x="-12" y="-150" width="24" height="56" fill="#151515"/>
      <path d="M-230 30 q0 -130 200 -130 q170 0 190 130 q0 90 -190 90 h-110 q-90 0 -90 -90Z" fill="url(#gDark)" ${O}/>
      <path d="M150 0 h260 v-30 l26 -16 v86 l-26 -10 v-6 h-260Z" fill="url(#gDark)" ${O}/><ellipse cx="420" cy="-40" rx="10" ry="${60*rot+4}" fill="#151515"/>
      <path d="M-40 -84 q150 0 176 108 h-176Z" fill="url(#gGlass)" ${O}/>
      <g transform="translate(40 150) scale(.42)">${guy({who:'rich', x:0, y:0, armR:60, bendR:60, glasses:true, mouth:'grin', hideLegs:true, t})}</g>
      <path d="M-30 -70 q120 6 150 90" stroke="#fff" stroke-width="10" opacity=".35" fill="none"/>
      <path d="M-220 40 h360" stroke="url(#gGold)" stroke-width="18"/>
      <path d="M-170 120 v44 M80 120 v44 M-220 168 h360" ${O} fill="none"/></g>
    ${[0,1,2].map(i=>`<path d="M${80+i*20} ${300+i*90+bob} h-${60+i*20}" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".7"/>`).join('')}`;
  } else {
    const busX = -700 + ez(cl(lt / 1.6)) * 2400, run = cl((lt - .7) / 1.4), gx = 300 + run * 320 - (lt > 2.4 ? 0 : 0);
    const ph = t * 16, legA = run > 0 && run < 1 ? sn(ph) * 35 : 0;
    return `<rect width="1080" height="960" fill="#aab4c0"/>${city(700, 1.2, 0, '#8892a0', null)}
    <rect x="0" y="700" width="1080" height="70" fill="#c9ced6" ${O}/><rect x="0" y="770" width="1080" height="190" fill="#4b525c"/><g fill="#e9ecef">${[0,1,2,3,4,5].map(i=>`<rect x="${i*220-((lt*0)%220)}" y="860" width="110" height="12"/>`).join('')}</g>
    <rect x="120" y="380" width="14" height="320" fill="#59616c" ${o}/><rect x="70" y="340" width="114" height="80" rx="10" fill="url(#gRed)" ${O}/>${tx(127,393,30,'BUS','#fff')}
    ${guy({who:'broke', x:gx, y:760, s:.95, legL:legA, legR:-legA, armL:20+legA, armR:20-legA, bendL:40, bendR:40, mouth: run>0?'o':'flat', eyes: run>0?'wide':'tired', lean: run>0&&run<1?8:0, brow: run>0?'worry':'', t})}
    ${run>.2?`<g fill="#7fd3ff" stroke="#151515" stroke-width="3">${[0,1].map(i=>`<path d="M${gx+70+i*24} ${280+((lt*120+i*30)%60)} q-8 14 0 20 q8 -6 0 -20Z"/>`).join('')}</g>`:''}
    <g transform="translate(${busX} 640)"><rect x="0" y="-260" width="620" height="260" rx="30" fill="url(#gSteel)" ${O}/><rect x="0" y="-80" width="620" height="30" fill="url(#gRed)"/>
      ${[30,170,310,450].map(x=>`<rect x="${x}" y="-230" width="120" height="100" rx="10" fill="url(#gGlass)" ${o}/>`).join('')}
      <circle cx="130" cy="10" r="52" fill="#2b2f36" ${O}/><circle cx="490" cy="10" r="52" fill="#2b2f36" ${O}/>
      ${[0,1,2].map(i=>`<circle cx="${-30-i*40-((t*200)%40)}" cy="${-20-i*10}" r="${18+i*8}" fill="#c9ced6" opacity="${.6-i*.15}"/>`).join('')}</g>`;
  }
};
SC.lunch = (side, lt, dur, t) => {
  if (side === 'rich') {
    const chop = Math.abs(sn(t * 9)), n = Math.min(4, Math.floor(lt / .5) + 1), cyc=(lt%1.3)/1.3, lift = lt>1.2?sn(cyc*PI):0;
    return `<rect width="1080" height="960" fill="#2a1d14"/><rect x="0" y="0" width="1080" height="560" fill="#3a2a1a"/>${[0,1,2,3,4,5].map(i=>`<rect x="${i*190+20}" y="80" width="150" height="300" rx="8" fill="#4d3622" ${o}/>`).join('')}
    ${[200,540,880].map(x=>`<path d="M${x} 0 v60" stroke="#151515" stroke-width="5"/><circle cx="${x}" cy="80" r="26" fill="#fff3c4" ${O}/><path d="M${x} 100 l-140 520 h280Z" fill="#fff3c4" opacity=".07"/>`).join('')}
    ${guy({who:'chef', x:780, y:860, s:.95, armL:20, armR:40+chop*30, bendR:60, propR:`<g transform="rotate(170)"><rect x="-6" y="0" width="12" height="40" fill="#151515"/><path d="M-10 40 h20 l-4 90 l-12 -10Z" fill="url(#gSteel)" ${o}/></g>`, mouth:'flat', hideLegs:true, t})}
    ${guy({who:'rich', x:280, y:900, s:1.0, armL:12, armR:22+lift*20, bendR:lift*125, mouth: lift>.5?'chew':'smile', look:8, hideLegs:true, t})}
    <rect x="0" y="640" width="1080" height="70" fill="url(#gWood)" ${O}/><rect x="0" y="710" width="1080" height="250" fill="#1f160f" ${O}/>
    <rect x="360" y="600" width="520" height="40" rx="6" fill="#c9a46a" ${O}/>
    ${Array.from({length:n},(_,i)=>`<g transform="translate(${420+i*110} 590)"><rect x="-38" y="-26" width="76" height="34" rx="16" fill="#fffaf0" ${o}/><path d="M-42 -20 q42 -34 84 0 q-8 12 -42 10 q-34 2 -42 -10Z" fill="${i%2?'url(#gTuna)':'url(#gSalmon)'}" ${o}/></g>`).join('')}`;
  } else {
    const grab = lt > .5 ? Math.abs(sn((lt - .5) * 5)) : 0, taken = Math.min(4, Math.floor(Math.max(0, lt - .5) / .63));
    return `<rect width="1080" height="960" fill="#c9ced6"/><rect x="0" y="0" width="1080" height="420" fill="#9aa1aa"/>${[0,1,2,3,4].map(i=>`<rect x="${i*230}" y="60" width="200" height="340" fill="#7d8590" ${o}/><g>${[0,1,2,3].map(j=>`<rect x="${i*230+14}" y="${76+j*80}" width="172" height="10" fill="#59616c"/><rect x="${i*230+20+j*10}" y="${36+j*80+12}" width="40" height="28" fill="${['#e2463b','#3f8cff','#f5c84c','#7aa36a'][(i+j)%4]}"/>`).join('')}</g>`).join('')}
    ${guy({who:'chef', x:820, y:900, s:.95, armL:10, armR:10, mouth: taken>1?'sad':'flat', eyes: taken>1?'wide':'open', brow: taken>1?'worry':'', look:-8, hideLegs:true, t})}
    ${guy({who:'broke', x:300, y:920, s:1.0, armL:10, armR:30+grab*50, bendR:30-grab*20, mouth:'chew', eyes:'tired', look:8, hideLegs:true, t})}
    <rect x="380" y="640" width="560" height="40" rx="8" fill="#fbfbf7" ${O}/><rect x="400" y="680" width="520" height="120" fill="#e2463b" ${O}/>${tx(660,755,40,'FREE SAMPLES','#fff')}
    ${[0,1,2,3,4].map(i=>i<taken?'':`<g transform="translate(${470+i*90} 630)"><path d="M-22 -40 h44 l-6 40 h-32Z" fill="#fff" ${o}/><path d="M-22 -40 h44" stroke="#e2463b" stroke-width="5"/><rect x="-8" y="-58" width="16" height="16" fill="#f3c55a" ${o}/></g>`).join('')}`;
  }
};
SC.treat = (side, lt, dur, t) => {
  if (side === 'rich') {
    const up = ez(cl((lt - .2) / .6));
    return `<rect width="1080" height="960" fill="#14231c"/>${[200,540,880].map(x=>`<path d="M${x} 0 l-160 760 h320Z" fill="#fff6d8" opacity=".08"/>`).join('')}
    <rect x="620" y="420" width="420" height="260" rx="10" fill="url(#gGlass)" opacity=".5" ${O}/>${[680,780,880,980].map(x=>`<circle cx="${x}" cy="560" r="26" fill="url(#gGold)" ${o}/><circle cx="${x}" cy="560" r="16" fill="#0e2a1f"/>`).join('')}
    <rect x="600" y="680" width="460" height="280" fill="#2a2018" ${O}/>
    ${guy({who:'rich', x:340, y:960, s:1.05, armL:14, armR:20+up*120, bendR:up*70, mouth:'grin', eyes:'open', look:10, hideLegs:true, brow:'up', t})}
    <g transform="translate(${340+64*1.05} ${960-385*1.05})">${Array.from({length:5},(_,i)=>{const a=t*3+i*1.3;return `<path d="M${120+Math.cos(a)*90} ${-60+Math.sin(a)*90} l8 -16 l8 16 l-8 16Z" fill="#fff" opacity="${up*(.5+.5*sn(t*6+i))}"/>`}).join('')}</g>
    ${[0,1].map(i=>`<g transform="translate(${80+i*120} 700)"><rect x="-50" y="-90" width="100" height="120" rx="8" fill="${i?'#151515':'url(#gGold)'}" ${O}/><path d="M-24 -90 q24 -40 48 0" fill="none" ${O}/></g>`).join('')}`;
  } else {
    const open = ez(cl((lt - .3) / .5)), shock = lt > 1.0;
    const rain = shock ? cl((lt - 1.0) / .4) : 0;
    return `<rect width="1080" height="960" fill="#8a8f86"/><rect width="1080" height="960" fill="url(#gNight)" opacity=".3"/>
    <rect x="640" y="160" width="300" height="640" fill="#6b4a33" ${O}/><circle cx="700" cy="500" r="14" fill="url(#gGold)" ${o}/><rect x="740" y="250" width="120" height="30" rx="6" fill="#151515"/>
    <rect x="80" y="380" width="220" height="140" rx="10" fill="url(#gSteel)" ${O}/><rect x="100" y="420" width="180" height="16" rx="6" fill="#151515"/>
    ${floor(800,'#6b6458','#4c463e')}
    ${guy({who:'broke', x:430, y:920, s:1.0, armL:30+open*40, armR:30+open*40, bendL:70, bendR:70, propR: open>.5?P.letter:'', mouth: shock?'sad':'flat', eyes: shock?'wide':'tired', brow: shock?'worry':'', hideLegs:false, t})}
    ${rain>0?`<g transform="translate(430 ${150-(1-rain)*80})" opacity="${rain}">${cloud(0,0,1.3,'#59616c')}${[ -60,-20,20,60].map((x,i)=>`<path d="M${x} ${60+((lt*300+i*40)%120)} l-6 22" stroke="#7fd3ff" stroke-width="7" stroke-linecap="round"/>`).join('')}</g>`:''}`;
  }
};
SC.dinner = (side, lt, dur, t) => {
  if (side === 'rich') {
    const toast = ezio(cl((lt - .6) / .7)) * (lt < 2.2 ? 1 : 1);
    return `<defs>${sky('dn1', '#3a1d55', '#ff8a4c')}</defs><rect width="1080" height="960" fill="url(#dn1)"/>
    <circle cx="820" cy="${520+lt*10}" r="110" fill="#ffd27a"/><rect x="0" y="520" width="1080" height="440" fill="#2f5f8a"/>
    ${[0,1,2,3].map(i=>`<path d="M${-200+((t*60+i*130)%260)} ${560+i*40} ${Array.from({length:9},()=>'q65 -18 130 0').join(' ')}" fill="none" stroke="#7fd3ff" stroke-width="6" opacity=".6"/>`).join('')}
    <path d="M820 540 v40" stroke="#ffd27a" stroke-width="20" opacity=".6"/>
    <rect x="0" y="660" width="1080" height="300" fill="url(#gWood)" ${O}/>${[0,1,2,3,4].map(i=>`<path d="M${i*240} 660 v300" stroke="#8a5c2b" stroke-width="4"/>`).join('')}
    <path d="M0 480 h1080 M0 560 h1080" stroke="#fbfbf7" stroke-width="12"/>${[60,260,460,660,860,1060].map(x=>`<path d="M${x} 480 v180" stroke="#fbfbf7" stroke-width="12"/>`).join('')}
    ${guy({who:'rich', x:300, y:900, s:1.0, armL:12, armR:30+toast*100, bendR:60-toast*30, propR:P.glass, mouth:'smile', eyes: toast>.8?'closed':'open', hideLegs:true, t})}
    <rect x="380" y="640" width="560" height="40" rx="8" fill="url(#gWhite)" ${O}/><rect x="440" y="680" width="20" height="200" fill="#151515"/><rect x="860" y="680" width="20" height="200" fill="#151515"/>
    <ellipse cx="660" cy="630" rx="90" ry="20" fill="url(#gWhite)" ${o}/><rect x="760" y="570" width="18" height="60" fill="#fff6d8" ${o}/><path d="M769 ${560-sn(t*20)*4} q-12 -20 0 -34 q12 14 0 34Z" fill="#ffb21f"/>
    <ellipse cx="660" cy="618" rx="50" ry="12" fill="#e8647a"/>`;
  } else {
    const cyc = (lt % 1.1) / 1.1, eat = sn(cyc * PI), drop = (t * 1.6) % 1, sw = sn(t * 2) * 6;
    return `<rect width="1080" height="960" fill="#2e3440"/><rect x="660" y="120" width="280" height="240" rx="8" fill="#0f1420" ${O}/><circle cx="880" cy="170" r="26" fill="#e9ecef" opacity=".6"/>
    <g transform="rotate(${sw} 380 0)"><path d="M380 0 v130" stroke="#151515" stroke-width="5"/><circle cx="380" cy="150" r="22" fill="#fff3c4" ${O}/></g>
    <path d="M${380+sw*12} 170 l-260 700 h520Z" fill="#fff3c4" opacity=".1"/>
    ${guy({who:'broke', x:400, y:900, s:1.0, armL:30, armR:20+eat*25, bendL:80, bendR:60+eat*50, propL:P.container, propR: P.fork, mouth: eat>.6?'chew':'flat', eyes:'tired', tilt:-6, hideLegs:true, t})}
    <rect x="0" y="650" width="1080" height="60" fill="url(#gSteel)" ${O}/><path d="M560 710 h420 l-30 200 h-360Z" fill="#59616c" ${O}/>
    <path d="M760 650 v-110 q0 -40 50 -40 q50 0 50 40" fill="none" stroke="#151515" stroke-width="24" stroke-linecap="round"/><path d="M760 650 v-110 q0 -40 50 -40 q50 0 50 40" fill="none" stroke="url(#gSteel)" stroke-width="12" stroke-linecap="round"/>
    <path d="M860 ${560+drop*140} q-8 14 0 20 q8 -6 0 -20Z" fill="#7fd3ff" ${o} opacity="${1-drop*.5}"/>`;
  }
};
SC.total = (side, lt, dur, t) => {
  const pr = ez(cl(lt / 1.2)), H = 420 * pr;
  const isR = side === 'rich';
  const shrug = !isR ? ezio(cl((lt - .8) / .5)) : 0;
  return `<rect width="1080" height="960" fill="${isR?'#163327':'#596170'}"/>
  ${isR?`<g opacity=".25">${Array.from({length:14},(_,i)=>`<rect x="${(i*83)%1080}" y="${((i*151+t*120)%1100)-100}" width="90" height="44" rx="6" fill="#7aa36a" transform="rotate(${i*23} ${(i*83)%1080} 300)"/>`).join('')}</g>`:''}
  ${guy({who:side, x:300, y:960, s:1.05, armL:isR?150:20+shrug*90, armR:isR?150:20+shrug*90, bendL:isR?130:shrug*-80, bendR:isR?130:shrug*-80, mouth:isR?'smile':'flat', eyes:isR?'open':'tired', brow:isR?'up':'', glasses:isR, hideLegs:true, t})}
  <rect x="560" y="140" width="400" height="70" rx="20" fill="#2b2f36" ${O}/><rect x="590" y="190" width="340" height="12" fill="#111"/>
  <g transform="translate(600 196)"><path d="M0 0 h320 v${H} l-20 -14 l-20 14 l-20 -14 l-20 14 l-20 -14 l-20 14 l-20 -14 l-20 14 l-20 -14 l-20 14 l-20 -14 l-20 14 l-20 -14 l-20 14 l-20 -14 l-20 14Z" fill="url(#gWhite)" ${O}/>
  ${H>120?`<g stroke="#b9bec5" stroke-width="8" stroke-linecap="round"><line x1="30" y1="40" x2="290" y2="40"/><line x1="30" y1="76" x2="240" y2="76"/></g>`:''}
  ${H>300?`${tx(160,190,30,'TOTAL')}<text class="rtot" x="160" y="262" font-size="60" font-weight="700" text-anchor="middle" fill="${isR?'#151515':'#e2463b'}" font-family="Poppins">$0</text>`:''}</g>`;
};
SC.night = (side, lt, dur, t) => {
  if (side === 'rich') {
    const glow = .8 + .2 * sn(t * 9);
    return `<rect width="1080" height="960" fill="#0b1712"/><rect x="620" y="110" width="400" height="380" rx="8" fill="#0d1b2e" ${O}/>${city(490,.7,0,'#132a22','#3d6a55')}<circle cx="900" cy="190" r="34" fill="#fff3c4"/><path d="M820 110 v380" stroke="#151515" stroke-width="7"/>
    <rect x="40" y="440" width="520" height="140" rx="30" fill="url(#gGold)" ${O}/>
    <ellipse cx="340" cy="560" rx="260" ry="200" fill="#7fb6ff" opacity="${.18*glow}"/>
    ${guy({who:'rich', x:300, y:860, s:1.0, armL:30, armR:30, bendL:110, bendR:-110+220, propR:P.phoneGlow, mouth:'flat', eyes:'wide', brow:'worry', hideLegs:true, look:4, t})}
    <path d="M10 660 q280 -60 600 0 v200 h-600Z" fill="#1d3a2e" ${O}/><rect x="10" y="780" width="600" height="80" fill="url(#gGold)" ${O}/>
    <rect x="740" y="640" width="200" height="90" rx="12" fill="#151515" ${O}/>${tx(840,702,46,'3:00','#ff4d4d')}`;
  } else {
    const br = 1 + .04 * sn(t * 2.5);
    return `<rect width="1080" height="960" fill="#1a1f2b"/><rect x="680" y="120" width="260" height="220" rx="8" fill="#0d1320" ${O}/><circle cx="790" cy="200" r="40" fill="#fff3c4"/><circle cx="810" cy="188" r="36" fill="#0d1320"/>
    <path d="M680 340 l-200 460 h460 l40 -460Z" fill="#cfe3ff" opacity=".07"/>
    ${floor(760,'#3d362f','#2b2620')}
    <rect x="60" y="700" width="760" height="110" rx="18" fill="#9aa1aa" ${O}/>
    <g transform="translate(700 760) rotate(-90)">${guy({who:'broke', x:0, y:0, s:.85, armL:0, armR:0, mouth:'smile', eyes:'closed', hideLegs:true, t})}</g>
    <g transform="translate(590 760) scale(1 ${br})"><path d="M-260 -70 q260 -60 520 -10 v150 h-520Z" fill="#5f86b8" ${O}/></g>
    <g font-family="Poppins" font-weight="700" fill="#fff" stroke="#151515" stroke-width="6" paint-order="stroke">${[0,1,2].map(i=>{const k=((lt*.6+i/3)%1);return tx(330+k*140, 600-k*260, 40+k*50, 'Z','#fff','middle',`opacity="${1-k}"`)}).join('')}</g>`;
  }
};
SC.family = (side, lt, dur, t) => {
  if (side === 'rich') {
    const cyc=(lt%1.6)/1.6, lift=sn(cyc*PI), tick=Math.floor(t)%2;
    return `<rect width="1080" height="960" fill="#1a2430"/><rect width="1080" height="960" fill="#3a5a7a" opacity=".15"/>
    ${[0,1,2,3].map(i=>`<rect x="${60+i*260}" y="90" width="160" height="330" rx="8" fill="#22303f" ${o}/>`).join('')}
    <g transform="translate(540 60)"><path d="M0 -60 v40" stroke="#151515" stroke-width="5"/><path d="M-90 -20 h180 l-30 50 h-120Z" fill="url(#gGold)" ${O}/>${[-70,-35,0,35,70].map(x=>`<path d="M${x} 30 l-6 26 l12 0Z" fill="#dff4ff" ${o}/>`).join('')}</g>
    <g transform="translate(960 230)"><circle r="56" fill="#fbfbf7" ${O}/><path d="M0 0 v-36" stroke="#151515" stroke-width="7" stroke-linecap="round"/><path d="M0 0 l${tick?26:20} ${tick?10:16}" stroke="#e2463b" stroke-width="5" stroke-linecap="round"/></g>
    ${[300,430,560,690,820].map(x=>`<g><rect x="${x-40}" y="440" width="80" height="200" rx="10" fill="#4d3622" ${O}/></g>`).join('')}
    ${guy({who:'rich', x:140, y:920, s:.95, armL:10, armR:22+lift*18, bendR:lift*120, propR: P.fork, mouth: lift>.5?'chew':'flat', eyes:'open', look:12, tilt:-4, hideLegs:true, t})}
    <rect x="40" y="620" width="1040" height="44" rx="8" fill="url(#gWhite)" ${O}/><rect x="80" y="664" width="980" height="300" fill="#2a2018" ${O}/>
    <ellipse cx="200" cy="616" rx="70" ry="16" fill="url(#gWhite)" ${o}/>${[430,620,810].map(x=>`<ellipse cx="${x}" cy="616" rx="60" ry="14" fill="#e9ecef" ${o} opacity=".8"/>`).join('')}`;
  } else {
    const laugh = i => Math.abs(sn(t * 7 + i)) , warm = .85 + .15 * sn(t * 2);
    return `<rect width="1080" height="960" fill="#c98a4a"/><rect width="1080" height="960" fill="#ffcf7a" opacity="${.25*warm}"/>
    <rect x="740" y="110" width="250" height="210" rx="8" fill="#1b2433" ${O}/><circle cx="900" cy="170" r="24" fill="#fff3c4"/>
    <path d="M540 0 v90" stroke="#151515" stroke-width="5"/><circle cx="540" cy="110" r="26" fill="#fff3c4" ${O}/><circle cx="540" cy="110" r="120" fill="#fff3c4" opacity=".18"/>
    ${guy({who:'fam', col:'#b84a5a', hs:'bun', skin:'#b97a52', x:220, y:880-laugh(0)*10, s:.8, armL:20, armR:30, bendR:60, mouth:'grin', eyes:'closed', tilt:-6, hideLegs:true, t})}
    ${guy({who:'fam', col:'#3f8c6a', hs:'short', skin:'#a86a44', x:840, y:880-laugh(1.3)*10, s:.82, armL:30, armR:20, bendL:-60, mouth:'grin', eyes:'closed', tilt:6, hideLegs:true, t})}
    ${guy({who:'broke', x:520, y:900-laugh(2.1)*12, s:.9, armL:40, armR:40, bendL:60, bendR:60, mouth:'grin', eyes:'closed', tilt:3, nobags:true, hideLegs:true, t})}
    ${guy({who:'fam', col:'#f5c84c', hs:'curly', skin:'#8a5634', x:690, y:820-laugh(.6)*16, s:.6, armL:150, armR:150, bendL:20, bendR:-20, mouth:'grin', eyes:'open', hideLegs:true, t})}
    <rect x="100" y="660" width="880" height="40" rx="8" fill="#e9dcc4" ${O}/><rect x="140" y="700" width="800" height="260" fill="#7a5530" ${O}/>
    <g transform="translate(540 640)"><path d="M-90 -40 h180 v30 q0 34 -34 34 h-112 q-34 0 -34 -34Z" fill="url(#gRed)" ${O}/><ellipse cx="0" cy="-40" rx="90" ry="16" fill="#f3c55a" ${o}/>${[-40,0,40].map((x,i)=>`<path d="M${x} -64 q-10 -20 0 -40 q10 -20 0 -40" stroke="#fff" stroke-width="6" fill="none" opacity="${.5+.3*sn(t*3+i)}"/>`).join('')}</g>
    ${[260,380,700,820].map(x=>`<ellipse cx="${x}" cy="656" rx="44" ry="11" fill="#fbfbf7" ${o}/>`).join('')}`;
  }
};
SC.night2 = (side, lt, dur, t) => {
  if (side === 'rich') return SC.night('rich', lt, dur, t);
  const glow = .85 + .15 * sn(t * 7);
  return `<rect width="1080" height="960" fill="#1a1f2b"/><rect x="680" y="120" width="260" height="220" rx="8" fill="#0d1320" ${O}/><circle cx="790" cy="200" r="40" fill="#fff3c4"/><circle cx="810" cy="188" r="36" fill="#0d1320"/>
  <path d="M680 340 l-200 460 h460 l40 -460Z" fill="#cfe3ff" opacity=".07"/>${floor(760,'#3d362f','#2b2620')}
  <ellipse cx="420" cy="520" rx="250" ry="220" fill="#ffe7b0" opacity="${.12*glow}"/>
  ${guy({who:'broke', x:420, y:900, s:1.0, armL:40, armR:40, bendL:70, bendR:70, propR:P.letter, mouth:'flat', eyes:'open', brow:'worry', look:6, tilt:-4, hideLegs:true, t})}
  <rect x="60" y="700" width="760" height="110" rx="18" fill="#9aa1aa" ${O}/><path d="M80 720 q300 -30 720 0" stroke="#7d8590" stroke-width="6" fill="none"/>
  <g transform="translate(900 740)"><rect x="-40" y="-70" width="80" height="140" rx="14" fill="#1b1f24" ${O}/><rect x="-32" y="-58" width="64" height="104" rx="6" fill="#cfe3ff" opacity="${glow}"/>${tx(0,-10,26,'3:00')}</g>`;
};
// full-frame choice scene: 1080x1920 picture; rich half shows top, broke half bottom
SC.choice = (side, lt, dur, t, gt) => {
  const T = gt || 0, hover = sn(T * 1.3) * 120, lamp = .9 + .1 * sn(T * 2);
  const full = `<rect width="1080" height="1920" fill="#14110e"/>
  <rect x="660" y="160" width="300" height="300" rx="8" fill="#0d1320" ${O}/><circle cx="800" cy="260" r="30" fill="#fff3c4" opacity=".8"/>
  <path d="M250 300 l-260 900 h880Z" fill="#ffd27a" opacity="${.13*lamp}"/>
  <g transform="translate(250 300)"><path d="M0 -300 v220" stroke="#151515" stroke-width="6"/><path d="M-90 -80 h180 l-40 -70 h-100Z" fill="url(#gGold)" ${O}/><ellipse cx="0" cy="-74" rx="60" ry="12" fill="#fff6d8" opacity="${lamp}"/></g>
  ${guy({who:'young', x:540, y:1260, s:1.5, armL:25, armR:30, bendL:60, bendR:55, mouth:'flat', eyes:'open', look:0, tilt:sn(T*.7)*2, hideLegs:true, t:T})}
  <rect x="0" y="1060" width="1080" height="860" fill="url(#gWood)" ${O}/><rect x="0" y="1060" width="1080" height="40" fill="#d49a55"/>
  <g transform="translate(540 1500) rotate(-2)"><rect x="-330" y="-380" width="660" height="700" rx="10" fill="url(#gWhite)" ${O}/>
   ${tx(0,-300,40,'OFFER LETTER')}<line x1="-250" y1="-270" x2="250" y2="-270" stroke="#151515" stroke-width="4"/>
   ${tx(-250,-210,30,'Position: Senior Analyst','#444','start')}${tx(-250,-160,30,'Salary: $240,000','#444','start')}${tx(-250,-110,30,'Hours: 80 per week','#444','start')}${tx(-250,-60,30,'Relocation: required','#444','start')}
   <g transform="translate(-200 80)"><rect x="-34" y="-34" width="68" height="68" rx="8" fill="#fff" ${O}/>${tx(56,14,44,'ACCEPT','#151515','start')}</g>
   <g transform="translate(-200 210)"><rect x="-34" y="-34" width="68" height="68" rx="8" fill="#fff" ${O}/>${tx(56,14,44,'DECLINE','#151515','start')}</g></g>
  <g transform="translate(345 ${1645+sn(T*1.3)*65})"><g transform="rotate(-30)"><rect x="-10" y="-200" width="20" height="200" rx="6" fill="#151515" ${o}/><path d="M-10 0 l10 30 l10 -30Z" fill="url(#gGold)" ${o}/></g><circle cx="-50" cy="-120" r="40" fill="#d9a074" ${O}/></g>`;
  return full;
};
SC.fork = (side, lt, dur, t) => {
  const yes = side === 'rich', lamp = .9 + .1 * sn(t * 2);
  const bx = 700, by = yes ? 600 : 690;  // target box (accept / decline)
  const mv = ezio(cl((lt - .3) / .8)), tick = cl((lt - 1.15) / .3);
  const px = 860 + (bx - 860) * mv, py = 380 + (by - 380) * mv + (mv >= 1 && tick < 1 ? sn(tick * PI) * 10 : 0);
  return `<rect width="1080" height="960" fill="${yes?'#1a1712':'#16181d'}"/>
  <path d="M230 120 l-240 700 h560Z" fill="#ffd27a" opacity="${.12*lamp}"/>
  <g transform="translate(230 120)"><path d="M0 -130 v70" stroke="#151515" stroke-width="5"/><path d="M-70 -60 h140 l-30 -50 h-80Z" fill="url(#gGold)" ${O}/><ellipse cx="0" cy="-56" rx="46" ry="9" fill="#fff6d8" opacity="${lamp}"/></g>
  ${guy({who:'young', x:250, y:900, s:.95, armL:20, armR:45, bendR:40, mouth:'flat', eyes:'open', look:12, tilt:4, hideLegs:true, t})}
  <rect x="0" y="720" width="1080" height="240" fill="url(#gWood)" ${O}/>
  <g transform="rotate(-3 760 560)"><rect x="560" y="300" width="400" height="500" rx="8" fill="url(#gWhite)" ${O}/>
   ${tx(760,360,30,'JOB OFFER')}<line x1="600" y1="378" x2="920" y2="378" stroke="#151515" stroke-width="3"/>
   ${tx(600,420,22,'Salary: $240,000','#444','start')}${tx(600,452,22,'Hours: 80 / week','#444','start')}${tx(600,484,22,'Move away: yes','#444','start')}
   <rect x="672" y="572" width="56" height="56" rx="6" fill="#fff" ${o}/>${tx(746,612,34,'ACCEPT','#151515','start')}
   <rect x="672" y="662" width="56" height="56" rx="6" fill="#fff" ${o}/>${tx(746,702,34,'DECLINE','#151515','start')}
   ${tick>0?`<path d="M${bx-18} ${by} l14 16 l28 -34" fill="none" stroke="${yes?'#2fae5a':'#e2463b'}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="80" stroke-dashoffset="${80*(1-tick)}"/>`:''}</g>
  <g transform="translate(${px} ${py})"><g transform="rotate(-30)"><rect x="-9" y="-170" width="18" height="170" rx="6" fill="#151515" ${o}/><path d="M-9 0 l9 26 l9 -26Z" fill="url(#gGold)" ${o}/></g><circle cx="-46" cy="-100" r="34" fill="#d9a074" ${O}/></g>`;
};
window.SC = SC; window.guy = guy;
