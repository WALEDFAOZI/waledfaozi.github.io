/* 3D Waled: a modelled, lit cartoon character driven by the pose that char.js animates.
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

  const paperTex = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 166; const g = c.getContext('2d');
    g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, 128, 166);
    g.fillStyle = '#c9ccd4'; for (let i = 0; i < 9; i++) g.fillRect(14, 24 + i * 14, i === 8 ? 60 : 100, 3);
    g.fillStyle = '#dba64e'; g.fillRect(14, 10, 34, 5);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

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
    lip: std({ color: 0x5e3128, roughness: .6 }),
    mouthIn: std({ color: 0x3a1512, roughness: .8 }),
    teeth: std({ color: 0xfbfaf6, roughness: .35 }),
    eyeW: phy({ color: 0xffffff, roughness: .15, clearcoat: 1, envMapIntensity: .8 }),
    pupil: phy({ color: 0x2a1a10, roughness: .1, clearcoat: 1 }),
    button: std({ color: 0x0e0f12, roughness: .35 }),
    gold: std({ color: 0xe0b04e, roughness: .3, metalness: .7, emissive: 0x3a2400, envMapIntensity: 1 }),
    star: std({ color: 0xffd25e, roughness: .4, emissive: 0x6a4400 }),
    paper: std({ map: paperTex, roughness: .9, side: THREE.DoubleSide, envMapIntensity: .4 })
  };

  /* ---------- geometry helpers ---------- */
  function put(parent, geo, mat, pos, rot, scl) {
    const m = new THREE.Mesh(geo, M[mat]);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (scl) m.scale.set(scl[0], scl[1], scl[2]);
    parent.add(m); return m;
  }
  const V2 = (a) => a.map(p => new THREE.Vector2(p[0], p[1]));
  const sph = (r, a, b) => new THREE.SphereGeometry(r, a || 32, b || 24);
  const cap = (r, len) => new THREE.CapsuleGeometry(r, Math.max(.001, len), 8, 22);
  const cyl = (r1, r2, h) => new THREE.CylinderGeometry(r1, r2, h, 26);
  // a limb that starts at its joint and runs down -Y, tapering from r1 to r2 with rounded ends
  function limb(r1, r2, len) {
    const pts = [];
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push([r1 * Math.sin(a), r1 * Math.cos(a)]); }
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push([r2 * Math.cos(a), -len - r2 * Math.sin(a)]); }
    return new THREE.LatheGeometry(V2(pts), 24);
  }
  function rounded(w, h, rr, depth) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + rr, y); s.lineTo(x + w - rr, y); s.quadraticCurveTo(x + w, y, x + w, y + rr);
    s.lineTo(x + w, y + h - rr); s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    s.lineTo(x + rr, y + h); s.quadraticCurveTo(x, y + h, x, y + h - rr); s.lineTo(x, y + rr); s.quadraticCurveTo(x, y, x + rr, y);
    return new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelThickness: depth * .4, bevelSize: depth * .4, bevelSegments: 3, curveSegments: 10 });
  }
  function starGeo(r) {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, rr = i % 2 ? r * .45 : r; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
    return new THREE.ExtrudeGeometry(s, { depth: r * .35, bevelEnabled: true, bevelThickness: r * .12, bevelSize: r * .1, bevelSegments: 2 });
  }

  /* ---------- the rig ---------- */
  const T = .27, HEADY = .14;
  const root = new THREE.Group(), scaleG = new THREE.Group(), yaw = new THREE.Group(), flip = new THREE.Group(), body = new THREE.Group();
  scene.add(root); root.add(scaleG); scaleG.add(yaw); yaw.add(flip); flip.add(body);
  flip.position.y = T / 2; body.position.y = -T / 2;

  // pelvis + torso (a V-shaped blazer open over a white tee)
  put(body, sph(.088), 'pants', [0, -.005, 0], null, [1.18, .82, .86]);
  const torso = new THREE.Group(); body.add(torso);
  put(torso, new THREE.LatheGeometry(V2([[0, -.065], [.088, -.06], [.094, 0], [.1, .08], [.118, .17], [.128, .225], [.112, .262], [.075, .285], [.03, .297], [0, .3]]), 44), 'jacket', null, null, [1, 1, .7]);
  put(torso, sph(.05), 'tee', [0, .215, .062], null, [1.3, 1.75, .6]);
  [-1, 1].forEach(s => {
    put(torso, cap(.009, .17), 'lapel', [s * .052, .19, .08], [-.08, 0, s * .26]);
    put(torso, new THREE.BoxGeometry(.05, .011, .022), 'lapel', [s * .062, .07, .07], [0, s * .55, 0]);
    put(torso, sph(.062), 'jacket', [s * .118, .243, 0], null, [1, .8, .9]);
  });
  put(torso, sph(.0075), 'button', [.012, .075, .082]);
  put(torso, cyl(.032, .035, .07), 'skin', [0, .3, .005]);

  // head
  const headPivot = new THREE.Group(); torso.add(headPivot); headPivot.position.y = T;
  headPivot.rotation.order = 'YXZ';
  const head = new THREE.Group(); headPivot.add(head); head.position.y = HEADY; head.scale.setScalar(1.28);
  put(head, sph(.1, 40, 32), 'skin', null, null, [.93, 1, 1]);
  put(head, sph(.08), 'skin', [0, -.038, .02], null, [.96, .92, 1]);
  put(head, sph(.042), 'skin', [0, -.084, .058]);
  put(head, sph(.019), 'skin', [0, -.012, .1], null, [.85, 1, 1.25]);
  [-1, 1].forEach(s => put(head, sph(.026), 'skin', [s * .091, -.006, -.006], null, [.45, 1, .8]));
  // eyes sit behind the sunglasses and show when the glasses jump
  const pupils = [];
  [-1, 1].forEach(s => {
    put(head, sph(.021), 'eyeW', [s * .036, .012, .083], null, [.95, 1.2, .55]);
    pupils.push(put(head, sph(.009), 'pupil', [s * .034, .01, .094]));
  });
  const hair = new THREE.Group(); head.add(hair);
  put(hair, new THREE.SphereGeometry(.105, 36, 18, 0, Math.PI * 2, 0, Math.PI * .5), 'hair', [0, .006, -.012], [-.32, 0, 0], [.96, 1, 1]);
  put(hair, new THREE.SphereGeometry(.104, 30, 14, Math.PI * 1.15, Math.PI * .7, Math.PI * .45, Math.PI * .2), 'hair', [0, 0, -.008], null, [.97, 1, 1]);
  // the quiff: rounded, tapering clumps on a pivot near the crown so they can sway
  const tufts = new THREE.Group(); hair.add(tufts); tufts.position.set(0, .085, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const drop = new THREE.LatheGeometry(V2([[0, 0], [.55, .04], [.86, .16], [1, .36], [.88, .58], [.55, .8], [.2, .95], [0, 1]]), 16);
  for (let i = 0; i < 30; i++) {
    const el = (28 + (i * 41) % 58) * Math.PI / 180, az = ((i * 67) % 320 - 160) * Math.PI / 180;
    if (Math.abs(az) < .55 && el < .6) continue;
    const n = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const front = Math.cos(az) > .5, side = Math.abs(Math.sin(az)) > .8 && el < .75;
    const d = n.clone().add(new THREE.Vector3(0, front ? 1.2 : .6, front ? -.35 : -1)).normalize();
    const h = side ? .045 : (front ? .095 : .075) + ((i * 13) % 5) * .006, r = side ? .032 : .04 + ((i * 7) % 3) * .004;
    const m = put(tufts, drop, 'hair', null, null, [r, h, r * .85]);
    m.position.copy(n.clone().multiplyScalar(.075)).sub(tufts.position);
    m.quaternion.setFromUnitVectors(up, d);
  }
  const brows = [];
  [-1, 1].forEach(s => brows.push(put(head, cap(.0078, .034), 'beard', [s * .036, .046, .093], [0, s * .25, Math.PI / 2 + s * .12])));
  const glasses = new THREE.Group(); head.add(glasses);
  [-1, 1].forEach(s => {
    put(glasses, rounded(.07, .05, .014, .007), 'glass', [s * .039, .01, .091], [0, s * .2, 0]);
    put(glasses, new THREE.BoxGeometry(.007, .01, .1), 'glass', [s * .088, .024, .045], [0, s * .08, 0]);
  });
  put(glasses, new THREE.BoxGeometry(.02, .01, .01), 'glass', [0, .026, .104]);
  [-1, 1].forEach(s => put(head, cap(.0085, .026), 'beard', [s * .015, -.041, .097], [0, s * .3, Math.PI / 2 - s * .32]));
  put(head, sph(.03), 'beard', [0, -.086, .069], null, [.95, 1.25, .72]);
  put(head, sph(.012), 'beard', [0, -.064, .093], null, [1, 1.1, .6]);
  // mouth shapes: a smile, an "o", and teeth for straining or grinning
  const smile = put(head, new THREE.TorusGeometry(.017, .0038, 8, 20, Math.PI * .8), 'lip', [0, -.046, .097], [0, 0, Math.PI * 1.1]);
  const oMouth = put(head, sph(.013), 'mouthIn', [0, -.054, .095], null, [1, 1.25, .5]);
  const teeth = put(head, new THREE.BoxGeometry(.034, .011, .01), 'teeth', [0, -.05, .099]);
  // dizzy stars
  const stars = new THREE.Group(); headPivot.add(stars); stars.position.y = HEADY + .19;
  for (let i = 0; i < 3; i++) put(stars, starGeo(.036), 'star');

  // arms, each with a watch on the wrist
  function arm(side) {
    const sh = new THREE.Group(); torso.add(sh); sh.position.set(side * .128, .236, 0);
    put(sh, limb(.042, .035, .14), 'jacket');
    const el = new THREE.Group(); sh.add(el); el.position.y = -.14;
    put(el, limb(.035, .031, .135), 'jacket');
    put(el, cyl(.038, .037, .03), 'tee', [0, -.1, 0]);
    put(el, cyl(.031, .031, .012), 'stripe', [0, -.122, 0]);
    put(el, cyl(.012, .012, .006), 'gold', [0, -.122, .03], [Math.PI / 2, 0, 0]);
    const hand = new THREE.Group(); el.add(hand); hand.position.y = -.138;
    put(hand, sph(.04), 'skin', [0, -.008, .004], null, [.8, 1.05, 1]);
    put(hand, sph(.016), 'skin', [-side * .02, .006, .024], null, [1, 1.4, 1]);
    return { sh: sh, el: el, hand: hand };
  }
  const armL = arm(-1), armR = arm(1);

  // legs
  function leg(side) {
    const hp = new THREE.Group(); body.add(hp); hp.position.set(side * .054, -.01, 0);
    put(hp, limb(.054, .044, .21), 'pants');
    put(hp, new THREE.BoxGeometry(.016, .06, .055), 'pantsDk', [side * .05, -.13, .004]);
    const kn = new THREE.Group(); hp.add(kn); kn.position.y = -.21;
    put(kn, limb(.044, .035, .2), 'pants');
    put(kn, cyl(.042, .04, .034), 'pantsDk', [0, -.19, 0]);
    const an = new THREE.Group(); kn.add(an); an.position.y = -.2;
    put(an, cyl(.048, .049, .052), 'shoe', [0, -.004, .004]);
    put(an, cap(.039, .08), 'shoe', [0, -.012, .038], [Math.PI / 2, 0, 0], [1, 1, .9]);
    put(an, new THREE.BoxGeometry(.088, .018, .17), 'shoe', [0, -.026, .034]);
    put(an, new THREE.BoxGeometry(.09, .005, .172), 'stripe', [0, -.02, .034]);
    put(an, sph(.034), 'shoe', [0, -.015, .1], null, [1.15, .62, .9]);
    return { hp: hp, kn: kn };
  }
  const legL = leg(-1), legR = leg(1);

  // paper stack and loose sheets
  const stack = new THREE.Group(); scene.add(stack);
  for (let i = 0; i < 5; i++) put(stack, new THREE.BoxGeometry(.13, .007, .1), 'paper', [(i % 2) * .004, i * .009, (i % 3) * .003], [0, (i % 2 ? .05 : -.04), 0]);
  stack.visible = false;
  const sheetGeo = new THREE.PlaneGeometry(.085, .11), sheetPool = [];

  /* ---------- secondary motion: hair and head lag behind the body ---------- */
  const hairX = { x: 0, v: 0 }, hairZ = { x: 0, v: 0 }, nod = { x: 0, v: 0 };
  function stepSpring(s, target, k, c, dt) { s.v += (-(s.x - target) * k - s.v * c) * dt; s.x += s.v * dt; }
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));
  let prev = null, pv = { x: 0, y: 0 };

  /* ---------- per-frame ---------- */
  const vA = new THREE.Vector3(), vB = new THREE.Vector3();
  let W = 0, H = 0, corr = { x: 0, y: 0 }, lookS = 0, glS = 0, fcS = 0;
  const YAW = .95;
  function render(s) {
    if (s.W !== W || s.Hh !== H) {
      W = s.W; H = s.Hh; renderer.setSize(W, H, false);
      camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -H; camera.updateProjectionMatrix();
    }
    const S = s.S, p = s.p, dt = Math.min(.05, s.dt || 0), out = {};
    root.visible = !!s.on;
    if (s.on) {
      if (dt > 0) {
        let ax = 0, ay = 0;
        if (prev && Math.abs(s.hip.x - prev.x) < S && Math.abs(s.hip.y - prev.y) < S) {
          const vx = (s.hip.x - prev.x) / dt, vy = (s.hip.y - prev.y) / dt;
          ax = (vx - pv.x) / dt; ay = (vy - pv.y) / dt; pv = { x: vx, y: vy };
        } else pv = { x: 0, y: 0 };
        prev = { x: s.hip.x, y: s.hip.y };
        stepSpring(hairX, clamp(-ax * s.dir / S * .01, .4) + clamp(pv.y / S * .04, .3), 140, 9, dt);
        stepSpring(hairZ, clamp(ay / S * .005, .25), 140, 9, dt);
        stepSpring(nod, clamp(ay / S * .0035, .35), 110, 8, dt);
      }
      tufts.rotation.set(hairX.x, 0, hairZ.x * s.dir);

      const q = s.sq || 1, qx = 1 / Math.sqrt(q);
      scaleG.scale.set(S * qx, S * q, S * qx);
      // fc turns the whole body square to the screen; turn swings the head on top of that
      fcS += ((s.fc || 0) - fcS) * Math.min(1, dt * 7);
      yaw.rotation.y = (s.dir > 0 ? YAW : -YAW) * (1 - fcS);
      flip.rotation.x = s.rot || 0;
      torso.rotation.x = p.tl;
      lookS += ((s.look || 0) - lookS) * Math.min(1, dt * 6);
      headPivot.rotation.y = -yaw.rotation.y * .8 * lookS + (s.turn || 0);
      headPivot.rotation.x = p.hl + nod.x;
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

      // face
      const mouth = s.mouth || 'smile', brow = s.brow || 0;
      smile.visible = mouth === 'smile' || mouth === 'grin';
      smile.scale.setScalar(mouth === 'grin' ? 1.35 : 1);
      oMouth.visible = mouth === 'o';
      teeth.visible = mouth === 'grit' || mouth === 'grin';
      teeth.scale.set(mouth === 'grit' ? 1.2 : .9, 1, 1);
      teeth.position.y = mouth === 'grin' ? -.054 : -.05;
      brows.forEach((b, i) => {
        const sd = i ? 1 : -1;
        b.position.y = brow > 0 ? .06 : brow < 0 ? .043 : .046;
        b.rotation.z = Math.PI / 2 + sd * .12 + (brow < 0 ? -sd * .45 : brow > 0 ? sd * .15 : 0);
      });
      pupils.forEach(pu => pu.scale.setScalar(brow > 0 ? .7 : 1));
      glS += ((s.gl || 0) - glS) * Math.min(1, dt * 14);
      glasses.position.set(0, glS * .085, glS * .012); glasses.rotation.x = -glS * .55;
      stars.visible = !!s.dizzy;
      if (s.dizzy) stars.children.forEach((m, i) => {
        const a = (s.clock || 0) * 4.5 + i * Math.PI * 2 / 3;
        m.position.set(Math.cos(a) * .17, Math.sin(a * 2) * .012, Math.sin(a) * .17);
        m.rotation.set(0, -a, (s.clock || 0) * 3);
      });

      // squash about the feet (sqPiv) so a landing squash keeps the shoes on the floor
      const sqOff = (s.sqPiv || 0) * S * (1 - q);
      root.position.set(s.hip.x + corr.x, -(s.hip.y + corr.y) + sqOff, 0);
      root.updateMatrixWorld(true);
      A[0].hand.getWorldPosition(vA);
      // while hanging, pull the 3D hand onto the point the 2D rig grips
      const tx = s.grip ? s.grip.x - (vA.x - corr.x) : 0, ty = s.grip ? s.grip.y - (-vA.y - corr.y) : 0;
      const k = s.grip ? 1 : Math.min(1, dt * 8);
      corr.x += (tx - corr.x) * k; corr.y += (ty - corr.y) * k;
      root.position.set(s.hip.x + corr.x, -(s.hip.y + corr.y) + sqOff, 0);
      root.updateMatrixWorld(true);
      A[0].hand.getWorldPosition(vA); A[1].hand.getWorldPosition(vB);
      out.hand = { x: vA.x, y: -vA.y };
      stack.visible = !!s.carry;
      if (s.carry) {
        stack.scale.setScalar(S);
        stack.position.set((vA.x + vB.x) / 2 + (s.dir > 0 ? 1 : -1) * .03 * S, (vA.y + vB.y) / 2 + .02 * S, (vA.z + vB.z) / 2 + .02 * S);
        stack.rotation.set(0, yaw.rotation.y, 0);
      }
    } else { stack.visible = false; prev = null; }

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
