/* Waled, the cartoon: a small skeletal rig drawn on an overlay canvas.
   Act 1 drops in and hangs from a box edge. Act 2 turns into a spider hero and swings away.
   Act 3 sprints across the screen carrying papers, trips and loses them. */
(function () {
  'use strict';
  try { if (localStorage.getItem('wchar') === 'off') return; } catch (e) {}
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var PI = Math.PI, sin = Math.sin, cos = Math.cos, abs = Math.abs;
  var cv = document.createElement('canvas'), x = cv.getContext('2d');
  cv.id = 'wchar'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:57';
  document.body.appendChild(cv);

  var W, Hh, dpr, S, FL, T, N, HR, U, F, Th, Sh, SHOE;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; Hh = innerHeight;
    cv.width = W * dpr; cv.height = Hh * dpr;
    S = Math.max(120, Math.min(W * .45, Hh * .27, 230)); FL = Hh - 8;
    T = .27 * S; N = .018 * S; HR = .122 * S; U = .14 * S; F = .135 * S; Th = .21 * S; Sh = .2 * S; SHOE = .045 * S;
  }
  size(); addEventListener('resize', size);

  var EN = document.documentElement.lang === 'en';
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'wcx'; btn.textContent = EN ? 'Hide character' : 'إخفاء الشخصية';
  btn.addEventListener('click', function () {
    try { localStorage.setItem('wchar', 'off'); } catch (e) {}
    stop(); cv.remove(); btn.remove();
  });
  document.body.appendChild(btn);

  /* ---------- pose ---------- */
  var K = ['tl', 'hl', 'a1n', 'a2n', 'a1f', 'a2f', 'b1n', 'b2n', 'b1f', 'b2f'];
  function P(o) {
    var p = { tl: 0, hl: 0, a1n: .15, a2n: .25, a1f: -.1, a2f: .05, b1n: .05, b2n: .05, b1f: -.05, b2f: -.05 };
    if (o) for (var k in o) p[k] = o[k];
    return p;
  }
  function ease(cp, tp, dt, rate) {
    var k = 1 - Math.exp(-dt * rate);
    for (var i = 0; i < K.length; i++) cp[K[i]] += (tp[K[i]] - cp[K[i]]) * k;
  }
  function fk(p) {
    var sh = { x: T * sin(p.tl), y: -T * cos(p.tl) }, hd = p.tl + p.hl;
    var hc = { x: sh.x + (N + HR) * sin(hd), y: sh.y - (N + HR) * cos(hd) };
    function arm(a1, a2) {
      var e = { x: sh.x + U * sin(a1), y: sh.y + U * cos(a1) };
      return [e, { x: e.x + F * sin(a2), y: e.y + F * cos(a2) }];
    }
    function leg(b1, b2) {
      var k = { x: Th * sin(b1), y: Th * cos(b1) };
      return [k, { x: k.x + Sh * sin(b2), y: k.y + Sh * cos(b2) }];
    }
    var an = arm(p.a1n, p.a2n), af = arm(p.a1f, p.a2f), ln = leg(p.b1n, p.b2n), lf = leg(p.b1f, p.b2f);
    return { sh: sh, hc: hc, hd: hd, en: an[0], hn: an[1], ef: af[0], hf: af[1], kn: ln[0], fn: ln[1], kf: lf[0], ff: lf[1] };
  }
  function lowest(f) { return Math.max(f.fn.y, f.ff.y) + SHOE * .75; }

  /* ---------- palette & drawing ---------- */
  var suit = false;
  function pal() {
    return suit
      ? { skin: '#c5232b', skinSh: '#a31b22', hair: '#c5232b', jk: '#c5232b', jkSh: '#9e1a21', tee: '#e03a40', pn: '#1d4aa0', pnSh: '#153a82', shoe: '#c5232b', sole: '#7d151b', cuff: '#9e1a21' }
      : { skin: '#d9a47e', skinSh: '#bf8c67', hair: '#14161a', jk: '#1d1f26', jkSh: '#111318', tee: '#f5f5f3', pn: '#2c2e36', pnSh: '#1f2127', shoe: '#f7f7f5', sole: '#16181c', cuff: '#f1f1ef' };
  }
  function seg(a, b, w, c) {
    x.strokeStyle = c; x.lineWidth = w; x.lineCap = 'round';
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
  }
  function circ(px, py, r, c) { x.fillStyle = c; x.beginPath(); x.arc(px, py, r, 0, PI * 2); x.fill(); }
  function mix(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

  function drawArm(sh, e, h, far, c) {
    var jk = far ? c.jkSh : c.jk;
    seg(sh, e, .072 * S, jk);
    seg(e, h, .063 * S, jk);
    seg(mix(e, h, .74), mix(e, h, .88), .068 * S, c.cuff);
    circ(h.x, h.y, .036 * S, far ? c.skinSh : c.skin);
  }
  function drawLeg(k, a, p1, p2, far, c) {
    var pn = far ? c.pnSh : c.pn, d = { x: sin(p2), y: cos(p2) }, f = { x: cos(p2), y: -sin(p2) };
    seg({ x: 0, y: 0 }, k, .098 * S, pn);
    seg(k, a, .082 * S, pn);
    if (!far && !suit) seg(mix({ x: 0, y: 0 }, k, .45), mix({ x: 0, y: 0 }, k, .68), .058 * S, c.pnSh);
    seg({ x: a.x - d.x * .055 * S, y: a.y - d.y * .055 * S }, a, .09 * S, c.pnSh);
    var sb = { x: a.x + d.x * .045 * S, y: a.y + d.y * .045 * S };
    seg({ x: sb.x - f.x * .035 * S, y: sb.y - f.y * .035 * S }, { x: sb.x + f.x * .12 * S, y: sb.y + f.y * .12 * S }, .032 * S, c.sole);
    var su = { x: a.x + d.x * .014 * S, y: a.y + d.y * .014 * S };
    seg({ x: su.x - f.x * .02 * S, y: su.y - f.y * .02 * S }, { x: su.x + f.x * .105 * S, y: su.y + f.y * .105 * S }, .066 * S, far ? '#dcdcda' : c.shoe);
  }
  function drawHead(hc, hd, c) {
    x.save(); x.translate(hc.x, hc.y); x.rotate(hd);
    var r = HR, i;
    function poly(pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0] * r, pts[1] * r); for (var j = 2; j < pts.length; j += 2) x.lineTo(pts[j] * r, pts[j + 1] * r); x.closePath(); x.fill(); }
    // skull + jaw
    circ(0, 0, r, c.skin);
    poly([-.55, .55, .25, 1.02, .78, .98, 1.0, .55, .9, .1], c.skin);
    poly([1.0, .02, 1.22, .3, .98, .36], c.skin);
    circ(-.12 * r, .12 * r, .19 * r, c.skinSh);
    if (!suit) {
      // swept-up quiff, short at the back
      poly([-.5, .5, -.95, .15, -1.05, -.35, -.85, -.8, -.7, -1.18, -.5, -.98, -.36, -1.4, -.12, -1.12, .05, -1.5, .25, -1.2, .45, -1.52, .62, -1.18, .9, -1.32, .92, -.95, 1.06, -.72, .86, -.5, .5, -.52, .2, -.42, .06, -.2, .02, .25, -.22, .42], c.hair);
      // sunglasses
      x.fillStyle = '#0b0c0f'; x.beginPath(); x.roundRect(.3 * r, -.3 * r, .82 * r, .38 * r, .1 * r); x.fill();
      seg({ x: .32 * r, y: -.18 * r }, { x: -.18 * r, y: -.06 * r }, .07 * r, '#0b0c0f');
      seg({ x: .55 * r, y: -.2 * r }, { x: .85 * r, y: -.2 * r }, .045 * r, 'rgba(255,255,255,.28)');
      // moustache and goatee
      seg({ x: .66 * r, y: .47 * r }, { x: 1.02 * r, y: .48 * r }, .1 * r, c.hair);
      poly([.42, .62, .62, .58, .74, .7, .98, .66, .92, .98, .72, 1.14, .48, 1.06], c.hair);
      seg({ x: .9 * r, y: .63 * r }, { x: .98 * r, y: .63 * r }, .05 * r, '#8a4f3d');
    } else {
      x.fillStyle = '#fff'; x.strokeStyle = '#111'; x.lineWidth = .07 * r;
      x.beginPath(); x.moveTo(.2 * r, -.05 * r); x.quadraticCurveTo(.55 * r, -.62 * r, 1.05 * r, -.32 * r); x.quadraticCurveTo(.75 * r, .18 * r, .2 * r, -.05 * r); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(60,4,8,.65)'; x.lineWidth = .035 * r;
      for (i = 0; i < 5; i++) { var aa = (150 + i * 40) * PI / 180; x.beginPath(); x.moveTo(-.15 * r, -.1 * r); x.lineTo(-.15 * r + 1.15 * r * cos(aa), -.1 * r + 1.15 * r * sin(aa)); x.stroke(); }
      for (i = 1; i < 3; i++) { x.beginPath(); x.arc(-.15 * r, -.1 * r, (.35 + i * .3) * r, 140 * PI / 180, 300 * PI / 180); x.stroke(); }
    }
    x.restore();
  }
  function drawStack(f) {
    var m = mix(f.hn, f.hf, .5), w = .17 * S, h = .1 * S;
    x.save(); x.translate(m.x + .02 * S, m.y - .045 * S);
    for (var i = 0; i < 4; i++) {
      x.fillStyle = i % 2 ? '#e9ebf1' : '#fff'; x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 1;
      x.fillRect(-w / 2 + i * .004 * S, -h / 2 - i * .012 * S, w, h * .5); x.strokeRect(-w / 2 + i * .004 * S, -h / 2 - i * .012 * S, w, h * .5);
    }
    x.restore();
  }
  function drawChar(p, carry) {
    var c = pal(), f = fk(p), u = { x: sin(p.tl), y: -cos(p.tl) }, n = { x: cos(p.tl), y: sin(p.tl) };
    drawArm(f.sh, f.ef, f.hf, true, c);
    drawLeg(f.kf, f.ff, p.b1f, p.b2f, true, c);
    drawLeg(f.kn, f.fn, p.b1n, p.b2n, false, c);
    circ(0, 0, .09 * S, c.pn);
    seg(f.sh, f.hc, .06 * S, c.skin);
    // jacket in the torso's own frame: x forward, -y up
    x.save(); x.rotate(p.tl);
    var t1 = T / S;
    function tp(pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0] * S, -pts[1] * S); for (var j = 2; j < pts.length; j += 2) x.lineTo(pts[j] * S, -pts[j + 1] * S); x.closePath(); x.fill(); }
    tp([-.085, -.045, -.095, t1 * .55, -.075, t1 - .01, -.03, t1 + .04, .04, t1 + .035, .075, t1 - .02, .095, t1 * .6, .09, t1 * .2, .085, -.045], c.jk);
    tp([.035, t1 + .02, .07, t1 - .01, .092, t1 * .62, .088, t1 * .25, .062, t1 * .25, .05, t1 * .6], c.tee);
    if (!suit) {
      x.strokeStyle = c.jkSh; x.lineWidth = .012 * S; x.lineCap = 'round';
      x.beginPath(); x.moveTo(.035 * S, -(t1 + .02) * S); x.lineTo(.05 * S, -t1 * .6 * S); x.lineTo(.062 * S, -t1 * .25 * S); x.stroke();
      circ(.075 * S, -t1 * .2 * S, .009 * S, '#3a3d46');
    } else {
      x.strokeStyle = '#111'; x.lineWidth = .01 * S;
      var sx = .02 * S, sy = -t1 * .62 * S;
      circ(sx, sy, .016 * S, '#111');
      for (var lg = 0; lg < 4; lg++) { x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + (lg < 2 ? -1 : 1) * .045 * S, sy + (lg % 2 ? .035 : -.035) * S); x.stroke(); }
    }
    x.restore();
    drawArm(f.sh, f.en, f.hn, false, c);
    drawHead(f.hc, f.hd, c);
    if (carry) drawStack(f);
    return f;
  }

  /* ---------- world state ---------- */
  var on = false, act = '', t = 0, hip = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, dir = 1, rot = 0, grip = null;
  var cp = P(), tp = P(), carry = false, web = null, sheets = [], puffs = [], fx = null, st = {}, phi = 0, timer = 0, last = 0, raf = 0, ground = false, sitting = false;
  var g = 2400;
  window.__wc = { ts: 1 };

  function standHip() { return FL - lowest(fk(P())); }
  function handW() { var f = fk(cp); return { x: hip.x + dir * f.hn.x, y: hip.y + f.hn.y }; }
  function puff(px, py, n) { for (var i = 0; i < n; i++) puffs.push({ x: px, y: py, vx: (Math.random() - .5) * 120, vy: -Math.random() * 60, r: .02 * S + Math.random() * .03 * S, l: 0, d: .5 + Math.random() * .3 }); }
  function sheet(px, py, vx, vy) { sheets.push({ x: px, y: py, vx: vx, vy: vy, r: Math.random() * 6, vr: (Math.random() - .5) * 8, ph: Math.random() * 6, l: 0 }); }
  function flash(px, py) { fx = { x: px, y: py, l: 0 }; }
  function go(a) { act = a; t = 0; }

  function hangPose(th, u, tt, kickAmp) {
    var kick = sin(tt * 7) * (kickAmp === undefined ? .28 : kickAmp);
    return P({
      tl: -th - .04, hl: th * .5 + .08 * sin(tt * 2),
      a1n: PI + th - u * 1.5, a2n: PI + th - u * .12, a1f: PI + th - .12 - u * 1.4, a2f: PI + th - .1 - u * .12,
      b1n: th + .1 + kick, b2n: th + .1 + kick - .3 - .25 * max0(-kick), b1f: th - .02 - kick, b2f: th - .02 - kick - .3 - .25 * max0(kick)
    });
  }
  function max0(v) { return v > 0 ? v : 0; }
  function runPose(ph, carrying, lean) {
    var s = sin(ph), c = cos(ph), s2 = sin(ph + PI), c2 = cos(ph + PI);
    function fl(cc) { return .25 + 1.15 * Math.pow(max0(cc), 1.3); }
    var b1n = .95 * s, b1f = .95 * s2, p = P({ tl: lean, hl: -.05, b1n: b1n, b2n: b1n - fl(c), b1f: b1f, b2f: b1f - fl(c2) });
    if (carrying) { p.a1n = .75 + .05 * s; p.a2n = 1.62 + .05 * s; p.a1f = .6 + .05 * s; p.a2f = 1.58 + .05 * s; }
    else { p.a1n = -.95 * s; p.a2n = p.a1n + 1.45; p.a1f = -.95 * s2; p.a2f = p.a1f + 1.45; }
    return p;
  }

  /* ---------- choosing a box to hang from ---------- */
  function pickTarget() {
    var sel = ['h1 span', '#badge', '.jc', '.cbox', '#reach .tot', '.dock'], list = [], maxTop = Math.min(Hh * .6, Hh - S * 1.15);
    sel.forEach(function (s) {
      var els = document.querySelectorAll(s);
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        if (r.width > 110 && r.height > 36 && r.top > 90 + S * .25 && r.top < maxTop && r.left >= 0 && r.right <= W + 4) list.push({ el: els[i], pri: s === 'h1 span' ? 3 : 1 });
      }
    });
    if (!list.length) return null;
    var pool = []; list.forEach(function (o) { for (var i = 0; i < o.pri; i++) pool.push(o); });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function anchorOf() {
    var r = st.el.getBoundingClientRect();
    if (r.top < 70 || r.top > Hh - 120) return null;
    return { x: r.left + r.width * st.fx, y: r.top };
  }

  /* ---------- the performance ---------- */
  function perform() {
    if (on) return true;
    var tg = pickTarget();
    if (!tg) return false;
    st = { el: tg.el, fx: .3 + Math.random() * .4 };
    var r = tg.el.getBoundingClientRect(), ax = r.left + r.width * st.fx;
    dir = ax < W / 2 ? 1 : -1; rot = 0; vel = { x: 0, y: 0 }; suit = false; carry = false; web = null; grip = null; ground = false; sitting = false;
    tp = hangPose(0, 0, 0); tp.a1n = tp.a1f = PI - .25; tp.a2n = tp.a2f = PI - .3; cp = P(tp);
    var f = fk(tp); st.drop = { y0: -S * .9, y1: r.top - f.hn.y };
    hip.x = ax - dir * f.hn.x; hip.y = st.drop.y0;
    on = true; go('fall'); btn.classList.add('on');
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    return true;
  }
  function stop() { on = false; sheets.length = 0; puffs.length = 0; cancelAnimationFrame(raf); clearTimeout(timer); render(0); if (R3) R3.canvas.remove(); btn.classList.remove('on'); }
  function finish() {
    on = false; btn.classList.remove('on');
    var later = (q('wc') ? 9000 : 50000 + Math.random() * 40000);
    timer = setTimeout(schedule, later);
  }
  function schedule() {
    if (document.hidden || !perform()) timer = setTimeout(schedule, 8000);
  }
  function q(k) { return new URLSearchParams(location.search).get(k); }

  function swingStart() {
    // widest arc that still lands on screen; the web is anchored above the top edge
    var G = handW(), A0 = -S * .9, room = (dir > 0 ? W - G.x : G.x) - S * .7, th0 = .95, L;
    for (; th0 > .2; th0 -= .05) {
      L = (G.y - A0) / cos(th0);
      if (L * (sin(th0) + sin(Math.min(.5, th0 * .75))) <= room) break;
    }
    L = (G.y - A0) / cos(th0);
    var lim = FL - S * 1.02 - A0; if (L > lim) L = lim;
    var cth = (G.y - A0) / L; if (cth > 1) cth = 1;
    var th = -Math.acos(cth);
    st.A = { x: G.x + dir * L * abs(sin(th)), y: A0 }; st.L = L; st.th = th; st.om = 0; st.rel = Math.min(.5, abs(th) * .75);
  }
  function swingHand() { return { x: st.A.x + dir * st.L * sin(st.th), y: st.A.y + st.L * cos(st.th) }; }

  function update(dt) {
    t += dt; var f, an;
    if (on) switch (act) {
      case 'fall': {
        an = anchorOf(); if (!an) { go('lost'); break; }
        var u = Math.min(1, t / .95), fh = fk(tp);
        hip.x = an.x - dir * fh.hn.x; hip.y = st.drop.y0 + (an.y - fh.hn.y - st.drop.y0) * u * u;
        tp = P({ tl: .1, hl: -.1, a1n: PI - .3 + .35 * sin(t * 26), a2n: PI - .3 + .35 * sin(t * 26), a1f: PI - .5 + .35 * sin(t * 26 + 2), a2f: PI - .5 + .35 * sin(t * 26 + 2), b1n: .5 + .35 * sin(t * 22), b2n: .1, b1f: -.3 + .35 * sin(t * 22 + 2), b2f: -.5 });
        ease(cp, tp, dt, 22);
        if (t >= .95) { grip = an; go('hang'); puff(an.x, an.y, 6); }
        break;
      }
      case 'hang': case 'morph': {
        an = anchorOf(); if (!an) { grip = null; go('lost'); break; }
        grip = an;
        var th = (act === 'hang' ? .62 : .08) * Math.exp(-.45 * t) * cos(2.7 * t);
        var uu = 0;
        if (act === 'hang' && t > 1.9 && t < 3.7) uu = .3 + .35 * sin((t - 1.9) * 5.2) * (1 - (t - 1.9) / 2.5);
        if (act === 'morph') uu = .5;
        tp = hangPose(th, max0(uu), t, act === 'morph' ? .1 : .28);
        if (act === 'hang' && t > 3.7) tp.hl = .25 * sin(t * 3);
        if (act === 'morph') { tp.a1f = PI + th - .3; tp.hl = -.1; }
        ease(cp, tp, dt, 16);
        if (act === 'hang' && t > 4.4) { go('morph'); }
        else if (act === 'morph') {
          if (t > .1 && !suit) { suit = true; var hw = handW(); flash(hip.x, hip.y - T * .6); puff(hip.x, hip.y - T * .5, 14); }
          if (t > .95) { go('shoot'); }
        }
        break;
      }
      case 'shoot': {
        an = anchorOf(); if (!an) { grip = null; swingStart(); go('swing'); break; }
        grip = an;
        tp = hangPose(.05 * sin(t * 5), .5, t, .1); tp.a1f = PI - .2 + .05; ease(cp, tp, dt, 16);
        if (t < .02 || !st.A) swingStart();
        web = { a: st.A, p: Math.min(1, t / .3), alpha: 1 };
        if (t > .42) { var G0 = handW(); grip = null; st.L = Math.hypot(G0.x - st.A.x, G0.y - st.A.y); st.th = Math.atan2(dir * (G0.x - st.A.x), G0.y - st.A.y); st.om = 0; go('swing'); }
        break;
      }
      case 'swing': {
        var sub = 4, h = dt / sub;
        for (var i = 0; i < sub; i++) { st.om += -g / st.L * sin(st.th) * h; st.th += st.om * h; }
        var G = swingHand(), th2 = st.th;
        tp = hangPose(th2 * .95, 0, t, 0);
        tp.b1n = th2 + .35; tp.b2n = th2 - .5; tp.b1f = th2 - .15; tp.b2f = th2 - .9; tp.a1f = th2 - .9; tp.a2f = th2 - .3 + 1.2; tp.hl = th2 * .3 - .1;
        ease(cp, tp, dt, 14);
        f = fk(cp); hip.x = G.x - dir * f.hn.x; hip.y = G.y - f.hn.y;
        web = { a: st.A, p: 1, alpha: 1, g: G };
        if (G.x < -S * 2 || G.x > W + S * 2) { suit = false; go('offrun'); break; }
        if (st.th > 0 && st.om > 0) {
          // let go at the planned angle, or earlier if the jump would carry him off screen
          var vx = dir * st.L * st.om * cos(st.th), vy = -st.L * st.om * sin(st.th);
          var y1 = standHip(), a = g / 2, cc = hip.y - y1, disc = vy * vy - 4 * a * cc;
          var Tf = disc > 0 ? (-vy + Math.sqrt(disc)) / (2 * a) : .5, landX = hip.x + vx * Tf;
          var edge = dir > 0 ? landX > W - S * .7 : landX < S * .7;
          if (st.th > st.rel || (edge && st.th > .04)) {
            if (edge) { var mx = dir > 0 ? W - S * .7 : S * .7; vx = (mx - hip.x) / Math.max(.2, Tf); }
            vel.x = vx; vel.y = vy; st.T = Tf;
            st.spin = st.T > .35 ? 2 * PI / st.T : 0; st.wa = 1;
            go('fly');
          }
        }
        break;
      }
      case 'fly': {
        hip.x += vel.x * dt; hip.y += vel.y * dt; vel.y += g * dt; rot += st.spin * dt;
        tp = P({ tl: .5, hl: .3, a1n: 1.5, a2n: 2.6, a1f: 1.3, a2f: 2.5, b1n: 1.6, b2n: -.2, b1f: 1.4, b2f: -.3 });
        ease(cp, tp, dt, 18);
        st.wa = Math.max(0, st.wa - dt * 3); web = st.wa > 0 ? { a: st.A, p: 1, alpha: st.wa, g: { x: hip.x + dir * fk(cp).hn.x, y: hip.y + fk(cp).hn.y } } : null;
        if (hip.x < -S * 1.5 || hip.x > W + S * 1.5) { suit = false; rot = 0; go('offrun'); break; }
        if (hip.y >= standHip() && vel.y > 0) { rot = 0; hip.y = standHip(); puff(hip.x, FL, 10); go('land'); }
        break;
      }
      case 'land': {
        web = null; var tt = t;
        tp = tt < .3 ? P({ tl: .55, hl: -.1, a1n: .9, a2n: 1.2, a1f: .6, a2f: .9, b1n: 1.0, b2n: -.35, b1f: .8, b2f: -.45 }) : P({ tl: .05, hl: -.05, a1n: .1, a2n: .3, a1f: -.05, a2f: .2 });
        ease(cp, tp, dt, 20); f = fk(cp); hip.y = FL - lowest(f); ground = true;
        if (tt > .28 && suit) { suit = false; flash(hip.x, hip.y - T * .6); puff(hip.x, hip.y - T * .5, 16); carry = true; for (var j = 0; j < 7; j++) sheet(hip.x + dir * .1 * S, hip.y - T * .5, (Math.random() - .5) * 360, -240 - Math.random() * 160); }
        if (tt > .75) { phi = 0; go('run1'); }
        break;
      }
      case 'offrun': {
        carry = true; dir = -dir; hip.x = dir > 0 ? -S : W + S; ground = true; phi = 0; go('run2'); break;
      }
      case 'run1': case 'run2': case 'run3': {
        var v = act === 'run3' ? Math.max(300, W * .3) : Math.max(520, W * .46);
        phi += dt * 2 * PI * v / (1.5 * S); hip.x += dir * v * dt;
        tp = runPose(phi, carry && act !== 'run3', act === 'run3' ? .18 : .26); ease(cp, tp, dt, 26);
        f = fk(cp); hip.y = FL - lowest(f) - .05 * S * max0(sin(2 * phi + 1.2)); ground = true;
        if (carry && Math.random() < dt * 3.2) sheet(hip.x + dir * .1 * S, hip.y - T * .85, -dir * (80 + Math.random() * 100), -80 - Math.random() * 80);
        if (Math.random() < dt * 14 && hip.y > FL - lowest(f) - .02 * S) puff(hip.x - dir * .05 * S, FL - 2, 1);
        if (act === 'run1' && (hip.x < -S * 1.3 || hip.x > W + S * 1.3)) { dir = -dir; hip.x = dir > 0 ? -S : W + S; carry = true; go('run2'); }
        if (act === 'run2' && (dir > 0 ? hip.x > W * .52 : hip.x < W * .48)) { st.v0 = v; go('slip'); }
        if (act === 'run3' && (hip.x < -S * 1.3 || hip.x > W + S * 1.3)) { finish(); }
        break;
      }
      case 'slip': {
        var s0 = st.v0 || 500, hop = .2 * S;
        if (t < .8) { hip.x += dir * s0 * Math.pow(1 - t / .8, 2) * dt; }
        if (t < .5) {
          var u2 = t / .5;
          tp = P({ tl: -.45, hl: .2, a1n: -2.7, a2n: -2.8, a1f: -2.5, a2f: -2.6, b1n: .55, b2n: .3, b1f: 1.2, b2f: 1.2 });
          ease(cp, tp, dt, 16); hip.y = standHip() - hop * sin(PI * u2); sitting = false;
          if (!st.burst && t > .08) { st.burst = 1; carry = false; for (var k2 = 0; k2 < 16; k2++) sheet(hip.x + dir * .15 * S, hip.y - T * .8, (Math.random() - .3) * 300 * dir, -320 - Math.random() * 260); }
        } else if (t < 1.5) {
          tp = P({ tl: -.18, hl: .35 * sin((t - .5) * 7) * (t < 1.2 ? 1 : 0), a1n: -.85, a2n: -.45, a1f: -.7, a2f: -.35, b1n: 1.5, b2n: 1.55, b1f: 1.4, b2f: 1.5 });
          ease(cp, tp, dt, 14); hip.y += (FL - .075 * S - hip.y) * Math.min(1, dt * 18); sitting = true;
        } else if (t < 2.0) {
          tp = P({ tl: .5, hl: 0, a1n: .9, a2n: 1.3, a1f: .6, a2f: 1.0, b1n: 1.0, b2n: -.3, b1f: .8, b2f: -.4 });
          ease(cp, tp, dt, 14); f = fk(cp); hip.y += (FL - lowest(f) - hip.y) * Math.min(1, dt * 10); sitting = false;
        } else { sitting = false; phi = 0; go('run3'); }
        break;
      }
      case 'lost': {
        grip = null; vel.y += g * dt; hip.y += vel.y * dt; hip.x += dir * 60 * dt;
        tp = P({ tl: .3, a1n: PI - .5, a2n: PI - .4, a1f: PI - .8, a2f: PI - .6, b1n: .6, b2n: .1, b1f: -.4, b2f: -.6 }); ease(cp, tp, dt, 14);
        if (hip.y >= standHip() && vel.y > 0) { hip.y = standHip(); vel.y = 0; suit = false; carry = true; phi = 0; go('run1'); }
        break;
      }
    }
    if (on && grip && (act === 'hang' || act === 'morph' || act === 'shoot')) {
      f = fk(cp); hip.x = grip.x - dir * f.hn.x; hip.y = grip.y - f.hn.y;
    }
    for (var si = sheets.length - 1; si >= 0; si--) {
      var sh = sheets[si]; sh.l += dt; sh.ph += dt * 5;
      sh.vy += 380 * dt; if (sh.vy > 120) sh.vy -= (sh.vy - 120) * Math.min(1, dt * 4);
      sh.vx += sin(sh.ph) * 260 * dt; sh.vx *= 1 - Math.min(1, dt * 1.2);
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.r += sh.vr * dt;
      if (sh.y > FL - 4) { sh.y = FL - 4; sh.vy = 0; sh.vx *= .9; sh.vr *= .8; }
      if (sh.l > 7) sheets.splice(si, 1);
    }
    for (var pi = puffs.length - 1; pi >= 0; pi--) { var pf = puffs[pi]; pf.l += dt; pf.x += pf.vx * dt; pf.y += pf.vy * dt; if (pf.l > pf.d) puffs.splice(pi, 1); }
    if (fx) { fx.l += dt; if (fx.l > .45) fx = null; }
  }

  function render(dt) {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, Hh);
    if (R3) {
      var gp = (act === 'hang' || act === 'morph' || act === 'shoot') ? grip : (act === 'swing' && web ? web.g : null);
      var o3 = R3.render({ on: on, p: cp, hip: hip, dir: dir, rot: rot, suit: suit, carry: carry, sheets: sheets, S: S, W: W, Hh: Hh, act: act, grip: on ? gp : null, dt: dt });
      hand3 = o3.hand || null;
    }
    if (!on && !sheets.length && !puffs.length) return;
    puffs.forEach(function (p) { var k = 1 - p.l / p.d; x.globalAlpha = .55 * k; circ(p.x, p.y, p.r * (1 + (1 - k) * 1.5), '#9aa0ad'); });
    x.globalAlpha = 1;
    if (ground && on) { x.fillStyle = 'rgba(0,0,0,.16)'; x.beginPath(); x.ellipse(hip.x, FL + 1, .17 * S, .022 * S, 0, 0, PI * 2); x.fill(); }
    if (web && web.a) {
      var hw = (R3 && hand3) || web.g || handW(), ex = hw.x + (web.a.x - hw.x) * web.p, ey = hw.y + (web.a.y - hw.y) * web.p;
      x.globalAlpha = Math.max(0, web.alpha); x.lineCap = 'round';
      x.strokeStyle = 'rgba(20,24,38,.45)'; x.lineWidth = 3.4; x.beginPath(); x.moveTo(hw.x, hw.y); x.lineTo(ex, ey); x.stroke();
      x.strokeStyle = '#fff'; x.lineWidth = 1.8; x.stroke(); x.globalAlpha = 1;
    }
    if (on && !R3) {
      x.save(); x.translate(hip.x, hip.y);
      if (rot) { x.translate(0, -T * .5); x.rotate(rot * dir); x.translate(0, T * .5); }
      x.scale(dir, 1);
      drawChar(cp, carry);
      x.restore();
    }
    if (!R3) sheets.forEach(function (s) {
      x.save(); x.translate(s.x, s.y); x.rotate(s.r); x.scale(abs(cos(s.ph)) * .6 + .4, 1);
      x.fillStyle = '#fff'; x.strokeStyle = 'rgba(0,0,0,.3)'; x.lineWidth = 1; var w = .085 * S, h = .11 * S;
      x.fillRect(-w / 2, -h / 2, w, h); x.strokeRect(-w / 2, -h / 2, w, h);
      x.strokeStyle = 'rgba(0,0,0,.2)'; for (var i = 1; i < 4; i++) { x.beginPath(); x.moveTo(-w / 2 + 4, -h / 2 + i * h / 4); x.lineTo(w / 2 - 4, -h / 2 + i * h / 4); x.stroke(); }
      x.restore();
    });
    if (fx) {
      var k = fx.l / .45, rr = (.1 + k * .55) * S;
      x.globalAlpha = (1 - k) * .9;
      var gr = x.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, rr); gr.addColorStop(0, '#fff'); gr.addColorStop(.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(fx.x, fx.y, rr, 0, PI * 2); x.fill();
      x.strokeStyle = '#e8b04a'; x.lineWidth = 3; x.lineCap = 'round';
      for (var i = 0; i < 12; i++) { var a = i * PI / 6 + .2, r1 = rr * .45, r2 = rr * (.8 + (i % 2) * .35); x.beginPath(); x.moveTo(fx.x + cos(a) * r1, fx.y + sin(a) * r1); x.lineTo(fx.x + cos(a) * r2, fx.y + sin(a) * r2); x.stroke(); }
      x.globalAlpha = 1;
    }
  }

  function loop(now) {
    var dt = Math.min(.05, (now - last) / 1000) * (window.__wc.ts || 1); last = now;
    update(dt);
    render(dt);
    if (on || sheets.length || puffs.length) raf = requestAnimationFrame(loop);
  }

  /* the 3D body loads in the background; until it is ready (or if WebGL is missing) the flat drawing is used */
  var R3 = null, hand3 = null, r3tried = false;
  function load3d() {
    if (r3tried) return; r3tried = true;
    import('./char3d.js').then(function (m) { R3 = m.init(); }).catch(function () { R3 = null; });
  }
  setTimeout(load3d, q('wc') ? 0 : 3500);

  window.__wc.step = function (sec) { for (var i = 0; i < Math.round(sec * 60); i++) update(1 / 60); render(1 / 60); return act; };
  window.__wc.r3 = function () { return !!R3; };
  window.__wc.state = function () { return { on: on, act: act, t: t, hip: hip, dir: dir, S: S, suit: suit, el: st.el && st.el.className + ':' + st.el.tagName }; };
  window.__wc.perform = perform;
  var start = q('wc') ? 1500 : 11000;
  timer = setTimeout(schedule, start);
})();
