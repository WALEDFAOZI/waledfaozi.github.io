/* 3D Waled: a modelled, lit character driven by the pose that char.js animates.
   Units inside the model are fractions of the character's height S; char.js gives screen pixels. */
import * as THREE from 'three';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';

export function init() {
  const cv = document.createElement('canvas');
  cv.id = 'wchar3d'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1';
  const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, powerPreference: 'low-power' });
  document.body.appendChild(cv);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, .1, 6000);
  camera.position.z = 3000;

  scene.add(new THREE.HemisphereLight(0xfff3e4, 0x2c3038, .85));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.6); key.position.set(-.7, 1, .9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc9dcff, 2.4); rim.position.set(.9, .55, -1); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe0c6, .55); fill.position.set(1, -.25, .8); scene.add(fill);

  /* ---------- textures ---------- */
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  const webTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#c41f2a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,6,12,.85)'; g.lineWidth = 2.2;
    const cols = 16, rows = 8;
    for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * w / cols, 0); g.lineTo(i * w / cols, h); g.stroke(); }
    for (let j = 1; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x0 = i * w / cols, x1 = (i + 1) * w / cols, y = j * h / rows;
      g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + 7, x1, y); g.stroke();
    }
  });
  webTex.wrapS = webTex.wrapT = THREE.RepeatWrapping;
  const paperTex = canvasTex(128, 166, (g, w, h) => {
    g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9ccd4'; for (let i = 0; i < 9; i++) g.fillRect(14, 24 + i * 14, i === 8 ? 60 : 100, 3);
    g.fillStyle = '#dba64e'; g.fillRect(14, 10, 34, 5);
  });

  /* ---------- materials ---------- */
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const phy = (o) => new THREE.MeshPhysicalMaterial(o);
  const M = {
    skin: phy({ color: 0xd99f78, roughness: .52, sheen: .35, sheenColor: 0xff9f86, sheenRoughness: .6, envMapIntensity: .45 }),
    hair: phy({ color: 0x101114, roughness: .5, sheen: .35, sheenColor: 0x3a404c, sheenRoughness: .4, envMapIntensity: .35 }),
    beard: std({ color: 0x1a1b1f, roughness: .7, envMapIntensity: .3 }),
    jacket: phy({ color: 0x23262d, roughness: .78, sheen: 1, sheenColor: 0x5b6273, sheenRoughness: .45, envMapIntensity: .5 }),
    lapel: phy({ color: 0x2d3139, roughness: .7, sheen: .8, sheenColor: 0x666d7e, envMapIntensity: .5 }),
    tee: std({ color: 0xf2f1ed, roughness: .85, envMapIntensity: .5 }),
    pants: phy({ color: 0x2a2c33, roughness: .86, sheen: .7, sheenColor: 0x4c5260, envMapIntensity: .45 }),
    pantsDk: std({ color: 0x1d1f25, roughness: .9, envMapIntensity: .4 }),
    shoe: std({ color: 0xf6f5f1, roughness: .48, envMapIntensity: .6 }),
    stripe: std({ color: 0x15171b, roughness: .6 }),
    glass: phy({ color: 0x050608, roughness: .07, metalness: .15, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.4 }),
    lip: std({ color: 0x6a3a2f, roughness: .6 }),
    button: std({ color: 0x0e0f12, roughness: .35 }),
    suitWeb: phy({ color: 0xffffff, map: webTex, roughness: .5, sheen: .4, sheenColor: 0xff8080, envMapIntensity: .6 }),
    suitRed: phy({ color: 0xc41f2a, roughness: .5, sheen: .4, sheenColor: 0xff8080, envMapIntensity: .6 }),
    suitDark: std({ color: 0x7d121a, roughness: .55 }),
    suitBlue: phy({ color: 0x1f4bb0, roughness: .5, sheen: .5, sheenColor: 0x8fb0ff, envMapIntensity: .6 }),
    eyeW: phy({ color: 0xffffff, roughness: .2, clearcoat: 1, envMapIntensity: 1 }),
    eyeRim: std({ color: 0x0b0b0d, roughness: .4 }),
    paper: std({ map: paperTex, roughness: .9, side: THREE.DoubleSide, envMapIntensity: .4 })
  };

  /* ---------- geometry helpers ---------- */
  const slots = {};
  function put(parent, geo, mat, slot, pos, rot, scl) {
    const m = new THREE.Mesh(geo, M[mat]);
    m.userData.base = mat;
    if (slot) (slots[slot] = slots[slot] || []).push(m);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (scl) m.scale.set(scl[0], scl[1], scl[2]);
    parent.add(m); return m;
  }
  const sph = (r, a, b) => new THREE.SphereGeometry(r, a || 32, b || 24);
  const cap = (r, len) => new THREE.CapsuleGeometry(r, Math.max(.001, len), 8, 22);
  const cyl = (r1, r2, h) => new THREE.CylinderGeometry(r1, r2, h, 26);
  function rounded(w, h, rr, depth) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + rr, y); s.lineTo(x + w - rr, y); s.quadraticCurveTo(x + w, y, x + w, y + rr);
    s.lineTo(x + w, y + h - rr); s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    s.lineTo(x + rr, y + h); s.quadraticCurveTo(x, y + h, x, y + h - rr); s.lineTo(x, y + rr); s.quadraticCurveTo(x, y, x + rr, y);
    return new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelThickness: depth * .4, bevelSize: depth * .4, bevelSegments: 3, curveSegments: 10 });
  }
  function flat(pts, depth) {
    const s = new THREE.Shape(); s.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]);
    return new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelThickness: depth * .5, bevelSize: depth * .5, bevelSegments: 2 });
  }
  function almond(w, h, depth) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.quadraticCurveTo(0, h * 1.1, w / 2, h * .25); s.quadraticCurveTo(w * .1, -h * .9, -w / 2, 0);
    return new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelThickness: depth * .5, bevelSize: depth * .4, bevelSegments: 3, curveSegments: 14 });
  }

  /* ---------- the rig ---------- */
  const T = .27, HEADY = .14;
  const root = new THREE.Group(), scaleG = new THREE.Group(), yaw = new THREE.Group(), flip = new THREE.Group(), body = new THREE.Group();
  scene.add(root); root.add(scaleG); scaleG.add(yaw); yaw.add(flip); flip.add(body);
  flip.position.y = T / 2; body.position.y = -T / 2;

  // pelvis + torso
  put(body, sph(.085), 'pants', 'pants', [0, -.005, 0], null, [1.18, .82, .86]);
  const torso = new THREE.Group(); body.add(torso);
  const prof = [[.0, -.062], [.09, -.058], [.098, .0], [.103, .1], [.115, .19], [.122, .232], [.106, .262], [.07, .284], [.03, .296], [.0, .298]].map(p => new THREE.Vector2(p[0], p[1]));
  put(torso, new THREE.LatheGeometry(prof, 44), 'jacket', 'jacket', null, null, [1, 1, .72]);
  put(torso, sph(.05), 'tee', 'tee', [0, .215, .06], null, [1.25, 1.75, .62]);
  [-1, 1].forEach(s => {
    put(torso, cap(.009, .17), 'lapel', 'jacket', [s * .05, .19, .08], [-.08, 0, s * .26]);
    put(torso, new THREE.BoxGeometry(.05, .011, .022), 'lapel', 'jacket', [s * .062, .07, .072], [0, s * .55, 0]);
    put(torso, sph(.06), 'jacket', 'jacket', [s * .112, .243, 0], null, [1, .8, .9]);
  });
  put(torso, sph(.0075), 'button', 'button', [.012, .075, .084]);
  put(torso, cyl(.031, .034, .07), 'skin', 'neck', [0, .3, .005]);
  const emblem = new THREE.Group(); torso.add(emblem); emblem.position.set(0, .17, .074);
  put(emblem, sph(.011), 'eyeRim', null, [0, .006, 0], null, [1, 1.3, .5]);
  put(emblem, sph(.008), 'eyeRim', null, [0, -.01, 0], null, [1, 1.2, .5]);
  for (let i = 0; i < 8; i++) {
    const side = i < 4 ? -1 : 1, k = i % 4;
    put(emblem, cap(.0022, .03), 'eyeRim', null, [side * .016, .012 - k * .008, 0], [0, 0, side * (1.1 - k * .35)]);
  }

  // head
  const headPivot = new THREE.Group(); torso.add(headPivot); headPivot.position.y = T;
  const head = new THREE.Group(); headPivot.add(head); head.position.y = HEADY; head.scale.setScalar(1.28);
  put(head, sph(.1, 40, 32), 'skin', 'face', null, null, [.93, 1, 1]);
  put(head, sph(.08), 'skin', 'face', [0, -.038, .02], null, [.96, .92, 1]);
  put(head, sph(.042), 'skin', 'face', [0, -.084, .058]);
  put(head, sph(.018), 'skin', 'face', [0, -.012, .1], null, [.85, 1, 1.25]);
  put(head, sph(.026), 'skin', 'face', [-.091, -.006, -.006], null, [.45, 1, .8]);
  put(head, sph(.026), 'skin', 'face', [.091, -.006, -.006], null, [.45, 1, .8]);
  const civil = new THREE.Group(); head.add(civil);
  const hair = new THREE.Group(); civil.add(hair);
  put(hair, new THREE.SphereGeometry(.105, 36, 18, 0, Math.PI * 2, 0, Math.PI * .5), 'hair', null, [0, .006, -.012], [-.32, 0, 0], [.96, 1, 1]);
  put(hair, new THREE.SphereGeometry(.104, 30, 14, Math.PI * 1.15, Math.PI * .7, Math.PI * .45, Math.PI * .2), 'hair', null, [0, .0, -.008], null, [.97, 1, 1]);
  // hair as rounded, tapering clumps swept up and back into a quiff
  const up = new THREE.Vector3(0, 1, 0);
  const drop = new THREE.LatheGeometry([[0, 0], [.55, .04], [.86, .16], [1, .36], [.88, .58], [.55, .8], [.2, .95], [0, 1]].map(p => new THREE.Vector2(p[0], p[1])), 16);
  for (let i = 0; i < 30; i++) {
    const el = (28 + (i * 41) % 58) * Math.PI / 180, az = ((i * 67) % 320 - 160) * Math.PI / 180;
    if (Math.abs(az) < .55 && el < .6) continue;
    const n = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const front = Math.cos(az) > .5, side = Math.abs(Math.sin(az)) > .8 && el < .75;
    const d = n.clone().add(new THREE.Vector3(0, front ? 1.2 : .6, front ? -.35 : -1)).normalize();
    const h = side ? .045 : (front ? .095 : .075) + ((i * 13) % 5) * .006, r = side ? .032 : .04 + ((i * 7) % 3) * .004;
    const m = put(hair, drop, 'hair', null, null, null, [r, h, r * .85]);
    m.position.copy(n.clone().multiplyScalar(.075));
    m.quaternion.setFromUnitVectors(up, d);
  }
  const brows = [];
  [-1, 1].forEach(s => brows.push(put(civil, cap(.0075, .034), 'beard', null, [s * .036, .046, .093], [0, s * .25, Math.PI / 2 + s * .12])));
  const glasses = new THREE.Group(); civil.add(glasses);
  [-1, 1].forEach(s => {
    put(glasses, rounded(.07, .05, .014, .007), 'glass', null, [s * .039, .01, .091], [0, s * .2, 0]);
    put(glasses, new THREE.BoxGeometry(.007, .01, .1), 'glass', null, [s * .088, .024, .045], [0, s * .08, 0]);
  });
  put(glasses, new THREE.BoxGeometry(.02, .01, .01), 'glass', null, [0, .026, .104]);
  [-1, 1].forEach(s => put(civil, cap(.0085, .026), 'beard', null, [s * .015, -.041, .097], [0, s * .3, Math.PI / 2 - s * .32]));
  put(civil, sph(.03), 'beard', null, [0, -.086, .069], null, [.95, 1.25, .72]);
  put(civil, sph(.012), 'beard', null, [0, -.062, .094], null, [1, 1.1, .6]);
  const mouth = put(civil, new THREE.TorusGeometry(.017, .0038, 8, 20, Math.PI * .8), 'lip', null, [0, -.046, .097], [0, 0, Math.PI * 1.1]);
  const mask = new THREE.Group(); head.add(mask); mask.visible = false;
  [-1, 1].forEach(s => {
    put(mask, almond(.064, .04, .006), 'eyeRim', null, [s * .04, .012, .088], [0, s * .32, s * -.35], [s * 1.12, 1.12, 1]);
    put(mask, almond(.064, .04, .006), 'eyeW', null, [s * .04, .012, .093], [0, s * .32, s * -.35], [s, 1, 1]);
  });

  // arms
  function arm(side) {
    const sh = new THREE.Group(); torso.add(sh); sh.position.set(side * .124, .236, 0);
    put(sh, cap(.036, .14), 'jacket', 'jacket', [0, -.07, 0]);
    const el = new THREE.Group(); sh.add(el); el.position.y = -.14;
    put(el, cap(.032, .12), 'jacket', 'jacket', [0, -.06, 0]);
    put(el, cyl(.037, .036, .03), 'tee', 'cuff', [0, -.103, 0]);
    const hand = new THREE.Group(); el.add(hand); hand.position.y = -.135;
    put(hand, sph(.036), 'skin', 'hands', [0, -.006, .004], null, [.78, 1.08, 1]);
    put(hand, sph(.012), 'skin', 'hands', [-side * .016, .008, .02], null, [1, 1.4, 1]);
    return { sh: sh, el: el, hand: hand };
  }
  const armL = arm(-1), armR = arm(1);

  // legs
  function leg(side) {
    const hp = new THREE.Group(); body.add(hp); hp.position.set(side * .052, -.01, 0);
    put(hp, cap(.047, .2), 'pants', 'pants', [0, -.105, 0]);
    put(hp, new THREE.BoxGeometry(.016, .06, .055), 'pantsDk', 'pocket', [side * .045, -.13, .004]);
    const kn = new THREE.Group(); hp.add(kn); kn.position.y = -.21;
    put(kn, cap(.04, .19), 'pants', 'pants', [0, -.1, 0]);
    put(kn, cyl(.043, .041, .034), 'pantsDk', 'pantsDk', [0, -.19, 0]);
    const an = new THREE.Group(); kn.add(an); an.position.y = -.2;
    put(an, cyl(.046, .047, .05), 'shoe', 'shoe', [0, -.004, .004]);
    put(an, cap(.036, .072), 'shoe', 'shoe', [0, -.012, .034], [Math.PI / 2, 0, 0], [1, 1, .9]);
    put(an, new THREE.BoxGeometry(.08, .016, .152), 'shoe', 'sole', [0, -.026, .03]);
    put(an, new THREE.BoxGeometry(.082, .005, .154), 'stripe', 'stripe', [0, -.021, .03]);
    put(an, sph(.03), 'shoe', 'shoe', [0, -.016, .088], null, [1.15, .62, .9]);
    return { hp: hp, kn: kn };
  }
  const legL = leg(-1), legR = leg(1);

  // paper stack and loose sheets
  const stack = new THREE.Group(); scene.add(stack);
  for (let i = 0; i < 5; i++) put(stack, new THREE.BoxGeometry(.13, .007, .1), 'paper', null, [(i % 2) * .004, i * .009, (i % 3) * .003], [0, (i % 2 ? .05 : -.04), 0]);
  stack.visible = false;
  const sheetGeo = new THREE.PlaneGeometry(.085, .11), sheetPool = [];

  /* ---------- suit switch ---------- */
  const SUIT = { face: 'suitWeb', neck: 'suitWeb', jacket: 'suitWeb', tee: 'suitWeb', hands: 'suitRed', cuff: 'suitRed', pants: 'suitBlue', pantsDk: 'suitBlue', pocket: 'suitBlue', shoe: 'suitRed', sole: 'suitDark', stripe: 'suitDark', button: 'suitRed' };
  let suitOn = null;
  function setSuit(on) {
    if (on === suitOn) return; suitOn = on;
    for (const k in slots) slots[k].forEach(m => { m.material = M[on && SUIT[k] ? SUIT[k] : m.userData.base]; });
    civil.visible = !on; mask.visible = on; emblem.visible = on;
  }

  /* ---------- per-frame ---------- */
  const vA = new THREE.Vector3(), vB = new THREE.Vector3();
  let W = 0, H = 0, corr = { x: 0, y: 0 };
  const YAW = .95;
  function render(s) {
    if (s.W !== W || s.Hh !== H) {
      W = s.W; H = s.Hh; renderer.setSize(W, H, false);
      camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -H; camera.updateProjectionMatrix();
    }
    const S = s.S, p = s.p, out = {};
    root.visible = !!s.on;
    if (s.on) {
      setSuit(!!s.suit);
      scaleG.scale.setScalar(S);
      yaw.rotation.y = s.dir > 0 ? YAW : -YAW;
      flip.rotation.x = s.rot || 0;
      torso.rotation.x = p.tl; headPivot.rotation.x = p.hl;
      const nearLeft = s.dir > 0;
      const A = nearLeft ? [armL, armR] : [armR, armL], Lg = nearLeft ? [legL, legR] : [legR, legL];
      // arms raised overhead open into a V so the face stays visible
      const spl = a => .07 + .3 * Math.max(0, -Math.cos(a));
      A[0].sh.rotation.set(-p.a1n - p.tl, 0, (nearLeft ? -1 : 1) * spl(p.a1n));
      A[0].el.rotation.x = -(p.a2n - p.a1n);
      A[1].sh.rotation.set(-p.a1f - p.tl, 0, (nearLeft ? 1 : -1) * spl(p.a1f));
      A[1].el.rotation.x = -(p.a2f - p.a1f);
      Lg[0].hp.rotation.set(-p.b1n, 0, (nearLeft ? -1 : 1) * .03); Lg[0].kn.rotation.x = -(p.b2n - p.b1n);
      Lg[1].hp.rotation.set(-p.b1f, 0, (nearLeft ? 1 : -1) * .03); Lg[1].kn.rotation.x = -(p.b2f - p.b1f);
      const surprised = s.act === 'fall' || s.act === 'slip' || s.act === 'lost' || s.act === 'fly';
      brows.forEach(b => { b.position.y = surprised ? .058 : .046; });
      mouth.scale.set(surprised ? 2.2 : 1, surprised ? 3.2 : 1, 1);

      root.position.set(s.hip.x + corr.x, -(s.hip.y + corr.y), 0);
      root.updateMatrixWorld(true);
      A[0].hand.getWorldPosition(vA);
      // while hanging or swinging, pull the 3D hand onto the point the 2D rig grips
      const tx = s.grip ? s.grip.x - (vA.x - corr.x) : 0, ty = s.grip ? s.grip.y - (-vA.y - corr.y) : 0;
      const k = s.grip ? 1 : Math.min(1, (s.dt || .016) * 8);
      corr.x += (tx - corr.x) * k; corr.y += (ty - corr.y) * k;
      root.position.set(s.hip.x + corr.x, -(s.hip.y + corr.y), 0);
      root.updateMatrixWorld(true);
      A[0].hand.getWorldPosition(vA); A[1].hand.getWorldPosition(vB);
      out.hand = { x: vA.x, y: -vA.y };
      stack.visible = !!s.carry;
      if (s.carry) {
        stack.scale.setScalar(S);
        stack.position.set((vA.x + vB.x) / 2 + (s.dir > 0 ? 1 : -1) * .03 * S, (vA.y + vB.y) / 2 + .02 * S, (vA.z + vB.z) / 2 + .02 * S);
        stack.rotation.set(0, yaw.rotation.y, 0);
      }
    } else stack.visible = false;

    const sh = s.sheets || [];
    while (sheetPool.length < sh.length) { const m = new THREE.Mesh(sheetGeo, M.paper); scene.add(m); sheetPool.push(m); }
    sheetPool.forEach((m, i) => {
      const d = sh[i]; m.visible = !!d; if (!d) return;
      m.scale.setScalar(S); m.position.set(d.x, -d.y, 60 + i);
      m.rotation.set(d.ph * .9, d.ph * .45, d.r);
    });
    renderer.render(scene, camera);
    return out;
  }
  return { render: render, canvas: cv };
}
