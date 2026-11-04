/* Waled, the cartoon: a skeletal rig animated here and drawn in 3D by char3d.js (flat 2D fallback).
   The story: he drops onto a word on the page and hangs from it while the word tilts under his weight,
   swings off with a flip, lands, checks his watch, panics, and sprints across with papers until he slips. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  // ?wc in the address brings him back after "Hide character"; while hidden, the footer offers the same
  function addBack() {
    var ft = document.querySelector('footer');
    if (!ft || ft.querySelector('.wcback')) return;
    var back = document.createElement('button');
    back.type = 'button'; back.className = 'pv wcback';
    back.style.cssText = 'background:none;border:0;padding:0;font:inherit;cursor:pointer';
    back.textContent = document.documentElement.lang === 'en' ? 'Show character' : 'إظهار الشخصية';
    back.addEventListener('click', function () { try { localStorage.removeItem('wchar'); } catch (e) {} location.reload(); });
    ft.appendChild(back);
  }
  try {
    if (new URLSearchParams(location.search).has('wc')) localStorage.removeItem('wchar');
    if (localStorage.getItem('wchar') === 'off') { addBack(); return; }
  } catch (e) {}

  var PI = Math.PI, sin = Math.sin, cos = Math.cos, abs = Math.abs;
  var cv = document.createElement('canvas'), x = cv.getContext('2d');
  cv.id = 'wchar'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1';
  document.body.appendChild(cv);

  var W, Hh, dpr, S, FL, T, N, HR, U, F, Th, Sh, SHOE, FEET = -.445;
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
    stop(); cv.remove(); btn.remove(); addBack();
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

  /* ---------- flat drawing, used only when WebGL is unavailable ---------- */
  var C2 = { skin: '#d9a47e', skinSh: '#bf8c67', hair: '#14161a', jk: '#1d1f26', jkSh: '#111318', tee: '#f5f5f3', pn: '#2c2e36', pnSh: '#1f2127', shoe: '#f7f7f5', sole: '#16181c', cuff: '#f1f1ef' };
  function seg(a, b, w, c) {
    x.strokeStyle = c; x.lineWidth = w; x.lineCap = 'round';
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
  }
  function circ(px, py, r, c) { x.fillStyle = c; x.beginPath(); x.arc(px, py, r, 0, PI * 2); x.fill(); }
  function mix(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  function drawArm(sh, e, h, far, c) {
    var jk = far ? c.jkSh : c.jk;
    seg(sh, e, .072 * S, jk); seg(e, h, .063 * S, jk);
    seg(mix(e, h, .74), mix(e, h, .88), .068 * S, c.cuff);
    circ(h.x, h.y, .036 * S, far ? c.skinSh : c.skin);
  }
  function drawLeg(k, a, p2, far, c) {
    var pn = far ? c.pnSh : c.pn, d = { x: sin(p2), y: cos(p2) }, f = { x: cos(p2), y: -sin(p2) };
    seg({ x: 0, y: 0 }, k, .098 * S, pn); seg(k, a, .082 * S, pn);
    if (!far) seg(mix({ x: 0, y: 0 }, k, .45), mix({ x: 0, y: 0 }, k, .68), .058 * S, c.pnSh);
    seg({ x: a.x - d.x * .055 * S, y: a.y - d.y * .055 * S }, a, .09 * S, c.pnSh);
    var sb = { x: a.x + d.x * .045 * S, y: a.y + d.y * .045 * S };
    seg({ x: sb.x - f.x * .035 * S, y: sb.y - f.y * .035 * S }, { x: sb.x + f.x * .12 * S, y: sb.y + f.y * .12 * S }, .032 * S, c.sole);
    var su = { x: a.x + d.x * .014 * S, y: a.y + d.y * .014 * S };
    seg({ x: su.x - f.x * .02 * S, y: su.y - f.y * .02 * S }, { x: su.x + f.x * .105 * S, y: su.y + f.y * .105 * S }, .066 * S, far ? '#dcdcda' : c.shoe);
  }
  function drawHead(hc, hd, c) {
    x.save(); x.translate(hc.x, hc.y); x.rotate(hd);
    var r = HR;
    function poly(pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0] * r, pts[1] * r); for (var j = 2; j < pts.length; j += 2) x.lineTo(pts[j] * r, pts[j + 1] * r); x.closePath(); x.fill(); }
    circ(0, 0, r, c.skin);
    poly([-.55, .55, .25, 1.02, .78, .98, 1.0, .55, .9, .1], c.skin);
    poly([1.0, .02, 1.22, .3, .98, .36], c.skin);
    circ(-.12 * r, .12 * r, .19 * r, c.skinSh);
    poly([-.5, .5, -.95, .15, -1.05, -.35, -.85, -.8, -.7, -1.18, -.5, -.98, -.36, -1.4, -.12, -1.12, .05, -1.5, .25, -1.2, .45, -1.52, .62, -1.18, .9, -1.32, .92, -.95, 1.06, -.72, .86, -.5, .5, -.52, .2, -.42, .06, -.2, .02, .25, -.22, .42], c.hair);
    x.fillStyle = '#0b0c0f'; x.beginPath(); x.roundRect(.3 * r, -.3 * r, .82 * r, .38 * r, .1 * r); x.fill();
    seg({ x: .32 * r, y: -.18 * r }, { x: -.18 * r, y: -.06 * r }, .07 * r, '#0b0c0f');
    seg({ x: .66 * r, y: .47 * r }, { x: 1.02 * r, y: .48 * r }, .1 * r, c.hair);
    poly([.42, .62, .62, .58, .74, .7, .98, .66, .92, .98, .72, 1.14, .48, 1.06], c.hair);
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
    var c = C2, f = fk(p), t1 = T / S;
    drawArm(f.sh, f.ef, f.hf, true, c);
    drawLeg(f.kf, f.ff, p.b2f, true, c);
    drawLeg(f.kn, f.fn, p.b2n, false, c);
    circ(0, 0, .09 * S, c.pn);
    seg(f.sh, f.hc, .06 * S, c.skin);
    x.save(); x.rotate(p.tl);
    function tq(pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0] * S, -pts[1] * S); for (var j = 2; j < pts.length; j += 2) x.lineTo(pts[j] * S, -pts[j + 1] * S); x.closePath(); x.fill(); }
    tq([-.085, -.045, -.095, t1 * .55, -.075, t1 - .01, -.03, t1 + .04, .04, t1 + .035, .075, t1 - .02, .095, t1 * .6, .09, t1 * .2, .085, -.045], c.jk);
    tq([.035, t1 + .02, .07, t1 - .01, .092, t1 * .62, .088, t1 * .25, .062, t1 * .25, .05, t1 * .6], c.tee);
    x.restore();
    drawArm(f.sh, f.en, f.hn, false, c);
    drawHead(f.hc, f.hd, c);
    if (carry) drawStack(f);
  }

  /* ---------- world state ---------- */
  var on = false, act = '', t = 0, clock = 0, hip = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, dir = 1, rot = 0, grip = null;
  var cp = P(), tp = P(), carry = false, sheets = [], puffs = [], st = {}, phi = 0, timer = 0, last = 0, raf = 0, ground = false;
  var sq = 1, sqv = 0, face = {}, wob = [], rips = [], firstScene = true;
  function rip(px, py, s) { rips.push({ x: px, y: py, s: s || 1, l: 0, d: .6 }); }
  // where the head sits when only the top of it shows above the bottom edge
  function peekHip() { return Hh - HR * .4 - fk(P()).hc.y; }
  var g = 2400, gF = 1700;
  window.__wc = { ts: 1 };

  function standHip() { return FL - lowest(fk(P())); }
  function puff(px, py, n, spread) { for (var i = 0; i < n; i++) puffs.push({ x: px, y: py, vx: (Math.random() - .5) * (spread || 120), vy: -Math.random() * 60, r: .02 * S + Math.random() * .03 * S, l: 0, d: .5 + Math.random() * .3 }); }
  function sheet(px, py, vx, vy) { sheets.push({ x: px, y: py, vx: vx, vy: vy, r: Math.random() * 6, vr: (Math.random() - .5) * 8, ph: Math.random() * 6, l: 0 }); }
  function go(a) { act = a; t = 0; }
  function max0(v) { return v > 0 ? v : 0; }
  function squash(v) { sq = v; sqv = 0; }
  function offscreen() { return hip.x < -S * 1.3 || hip.x > W + S * 1.3; }
  function enterFromEdge() { dir = -dir; hip.x = dir > 0 ? -S : W + S; }

  function hangPose(th, u, tt, kickAmp) {
    var kick = sin(tt * 7) * kickAmp;
    return P({
      tl: -th - .04, hl: th * .5 + .08 * sin(tt * 2),
      a1n: PI + th - u * 1.5, a2n: PI + th - u * .12, a1f: PI + th - .12 - u * 1.4, a2f: PI + th - .1 - u * .12,
      b1n: th + .1 + kick, b2n: th + .1 + kick - .3 - .25 * max0(-kick), b1f: th - .02 - kick, b2f: th - .02 - kick - .3 - .25 * max0(kick)
    });
  }
  function runPose(ph, carrying, lean) {
    var s = sin(ph), c = cos(ph), s2 = sin(ph + PI), c2 = cos(ph + PI);
    function fl(cc) { return .25 + 1.15 * Math.pow(max0(cc), 1.3); }
    var b1n = .95 * s, b1f = .95 * s2, p = P({ tl: lean, hl: -.05, b1n: b1n, b2n: b1n - fl(c), b1f: b1f, b2f: b1f - fl(c2) });
    if (carrying) { p.a1n = .75 + .05 * s; p.a2n = 1.62 + .05 * s; p.a1f = .6 + .05 * s; p.a2f = 1.58 + .05 * s; }
    else { p.a1n = -.95 * s; p.a2n = p.a1n + 1.45; p.a1f = -.95 * s2; p.a2f = p.a1f + 1.45; }
    return p;
  }
  function groundY(lift) { hip.y = FL - lowest(fk(cp)) - (lift || 0); ground = true; }

  /* ---------- words he can hang from ---------- */
  function baselineOf(el) {
    var m = document.createElement('span');
    m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    el.appendChild(m); var y = m.getBoundingClientRect().top; m.remove(); return y;
  }
  // a word tilts around its far end when he hangs near one end of it
  function wordTarget(el) {
    if (el.style.rotate) return null;
    var rg = document.createRange(); rg.selectNodeContents(el);
    var rs = rg.getClientRects(); if (!rs.length) return null;
    var tr = rs[rs.length - 1], r = el.getBoundingClientRect();
    if (tr.width < S * .6 || tr.left < 4 || tr.right > W - 4) return null;
    var base = baselineOf(el);
    if (base < 90 + S * .3 || base > Hh - S * 1.03) return null;
    var nearStart = Math.random() < .5, fx = nearStart ? .12 + Math.random() * .14 : .74 + Math.random() * .14;
    var o = {
      el: el, word: true, sx: scrollX, sy: scrollY, a: 0, v: 0, load: 0, extra: 0, held: false,
      g0: { x: tr.left + tr.width * fx, y: base + .012 * S },
      p: { x: nearStart ? tr.right - tr.width * .05 : tr.left + tr.width * .05, y: base },
      anchor: function () {
        var dx = this.sx - scrollX, dy = this.sy - scrollY, an = this.a * PI / 180, c = cos(an), s = sin(an);
        var vx = this.g0.x - this.p.x, vy = this.g0.y - this.p.y;
        return { x: this.p.x + dx + vx * c - vy * s, y: this.p.y + dy + vx * s + vy * c };
      }
    };
    o.sign = o.g0.x < o.p.x ? -1 : 1;
    o.origin = (o.p.x - r.left) + 'px ' + (o.p.y - r.top) + 'px';
    return o;
  }
  function boxTarget(el) {
    var r = el.getBoundingClientRect();
    if (r.width < 110 || r.height < 36 || r.left < 0 || r.right > W + 4) return null;
    if (r.bottom < 90 + S * .3 || r.bottom > Hh - S * 1.1) return null;
    var ox = r.left + r.width * (.3 + Math.random() * .4), oy = r.bottom - .03 * S, sx = scrollX, sy = scrollY;
    return { el: el, word: false, anchor: function () { return { x: ox + sx - scrollX, y: oy + sy - scrollY }; } };
  }
  function pickTarget() {
    function collect(sel, make, weight, out) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) { var o = make(els[i]); if (o) for (var k = 0; k < weight; k++) out.push(o); }
      return out;
    }
    var words = collect('h2', wordTarget, 2, collect('h1 span', wordTarget, 3, []));
    var pool = words.length ? words : collect('#badge,.jc,.cbox,#reach .tot', boxTarget, 1, []);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }
  function anchorOf() {
    var a = st.tg.anchor();
    return a.y < 70 || a.y > Hh - S * .9 ? null : a;
  }
  // push the word down on his side (positive) or flick it back up (negative)
  function jolt(v) { if (st.tg && st.tg.word) st.tg.v += st.tg.sign * v; }
  function stepWords(dt) {
    for (var i = wob.length - 1; i >= 0; i--) {
      var w = wob[i];
      w.load += ((w.held ? 1 : 0) - w.load) * Math.min(1, dt * 8);
      var target = w.sign * w.load * (5 + w.extra);
      w.v += (-(w.a - target) * 120 - w.v * 6.5) * dt;
      w.a = Math.max(-20, Math.min(20, w.a + w.v * dt));
      w.el.style.rotate = w.a.toFixed(2) + 'deg';
      if (w.released && w.load < .02 && abs(w.a) < .04 && abs(w.v) < .3) { w.el.style.rotate = ''; w.el.style.transformOrigin = ''; wob.splice(i, 1); }
    }
  }
  function letGo(kick) {
    grip = null;
    if (st.tg && st.tg.word) { st.tg.held = false; st.tg.released = true; st.tg.extra = 0; jolt(-kick); }
  }

  /* ---------- the performance ---------- */
  function startPeek() {
    st = { peek: true };
    dir = 1; rot = 0; vel = { x: 0, y: 0 }; carry = false; grip = null; ground = false; sq = 1; sqv = 0;
    tp = P(); cp = P(tp);
    hip.x = W * (.3 + Math.random() * .4); hip.y = Hh + S * 1.2;
    on = true; go('pkup'); btn.classList.add('on');
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    return true;
  }
  function perform() {
    if (on) return true;
    var wantPeek = R3 && (q('wc') === 'peek' || firstScene || Math.random() < .45);
    if (R3) firstScene = false;
    if (wantPeek) return startPeek();
    var tg = pickTarget();
    if (!tg) return false;
    st = { tg: tg, y0: -S * .9 };
    if (tg.word) { tg.el.style.transformOrigin = tg.origin; wob.push(tg); }
    var a = tg.anchor();
    dir = a.x < W / 2 ? 1 : -1; rot = 0; vel = { x: 0, y: 0 }; carry = false; grip = null; ground = false; sq = 1; sqv = 0;
    tp = hangPose(0, 0, 0, 0); tp.a1n = tp.a1f = PI - .25; tp.a2n = tp.a2f = PI - .3; cp = P(tp);
    hip.x = a.x - dir * fk(tp).hn.x; hip.y = st.y0;
    on = true; go('fall'); btn.classList.add('on');
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    return true;
  }
  function stop() {
    on = false; sheets.length = 0; puffs.length = 0; rips.length = 0; cancelAnimationFrame(raf); clearTimeout(timer);
    wob.forEach(function (w) { w.el.style.rotate = ''; w.el.style.transformOrigin = ''; }); wob = [];
    render(0); if (R3) R3.canvas.remove(); btn.classList.remove('on');
  }
  function finish() {
    on = false; btn.classList.remove('on');
    timer = setTimeout(schedule, q('wc') ? 9000 : 50000 + Math.random() * 40000);
  }
  function schedule() {
    if (document.hidden || !perform()) timer = setTimeout(schedule, 8000);
  }
  function q(k) { return new URLSearchParams(location.search).get(k); }
  function lose() { letGo(60); vel = { x: dir * 60, y: 0 }; go('lost'); }

  function update(dt) {
    t += dt; clock += dt;
    var f, an;
    face = { mouth: 'smile', brow: 0, look: 0, gl: 0, dizzy: false, fc: 0, turn: 0 };
    if (on) switch (act) {
      /* ---- the "stuck behind the screen" scene ---- */
      case 'pkup': {
        // rises from under the bottom edge until just his head shows
        var u1 = Math.min(1, t / .9), e1 = 1 - Math.pow(1 - u1, 3), y0 = Hh + S * 1.2;
        hip.y = y0 + (peekHip() - y0) * e1; ground = false;
        tp = P({ hl: .05 }); ease(cp, tp, dt, 14); face.fc = 1;
        if (t > .9) go('pkscan');
        break;
      }
      case 'pkscan': {
        st.turn = .55 * sin(t * 2.6); face.turn = st.turn; face.fc = 1; face.brow = t > 1 ? 1 : 0;
        hip.y = peekHip() + .01 * S * sin(t * 3);
        tp = P({ hl: .05 }); ease(cp, tp, dt, 14);
        if (t > 2) go('pkspot');
        break;
      }
      case 'pkspot': {
        // sees you: head snaps to the front, eyes wide
        if (!st.spot) { st.spot = 1; squash(1.12); }
        face.turn = (st.turn || 0) * max0(1 - t / .22); face.fc = 1; face.look = 0; face.brow = 1; face.mouth = 'o';
        hip.y = peekHip() - .05 * S * sin(Math.min(1, t / .3) * PI);
        tp = P({ hl: -.12 }); ease(cp, tp, dt, 16);
        if (t > .75) go('pkclimb');
        break;
      }
      case 'pkclimb': {
        var u2 = Math.min(1, t / .9), e2 = 1 + 2.7 * Math.pow(u2 - 1, 3) + 1.7 * Math.pow(u2 - 1, 2), pk = peekHip();
        hip.y = pk + (standHip() - pk) * e2; ground = false;
        tp = P({ tl: .1, a1n: 1.3, a2n: 1.6, a1f: 1.2, a2f: 1.55 }); ease(cp, tp, dt, 14);
        face.fc = 1; face.mouth = 'grit'; face.brow = -1;
        if (t > .9) { squash(.8); puff(hip.x, FL, 8, 200); go('pkpush'); }
        break;
      }
      case 'pkpush': {
        // palms flat on the glass, leaning into it
        var pr = .5 + .5 * sin(t * 5.5);
        tp = P({ tl: .08 + .22 * pr, hl: -.1, a1n: 1.38, a2n: 1.5, a1f: 1.38, a2f: 1.5, b1n: .3 * pr, b2n: -.05, b1f: -.14, b2f: -.12 });
        ease(cp, tp, dt, 20); groundY(); face.fc = 1; face.mouth = pr > .6 ? 'grit' : 'o'; face.brow = -1;
        if (pr > .92 && !st.hit) { st.hit = 1; squash(.95); rip(hip.x - .1 * S, hip.y - T * .9, 1); rip(hip.x + .1 * S, hip.y - T * .9, 1); }
        if (pr < .3) st.hit = 0;
        if (t > 2.6) { st.hit = 0; st.kd = 0; go('pkknock'); }
        break;
      }
      case 'pkknock': {
        // bangs on the glass with both fists, shouting
        var sw = sin(t * 20), sw2 = sin(t * 20 + PI);
        tp = P({ tl: .12, hl: -.1 + .1 * sin(t * 9), a1n: 1.25 + .25 * sw, a2n: 1.7 + .25 * sw, a1f: 1.25 + .25 * sw2, a2f: 1.7 + .25 * sw2, b1n: .08, b1f: -.08 });
        ease(cp, tp, dt, 26); groundY(.012 * S * abs(sw)); face.fc = 1;
        face.mouth = sin(t * 15) > 0 ? 'o' : 'grin'; face.brow = -1;
        var kd = sw > .85 ? 1 : sw2 > .85 ? 2 : 0;
        if (kd && kd !== st.kd) { rip(hip.x + (kd === 1 ? -1 : 1) * .1 * S, hip.y - T * .95, .6); }
        st.kd = kd;
        if (t > 2.2) { st.slam = 0; go('pkram'); }
        break;
      }
      case 'pkram': {
        if (t < .7) {
          if (!st.crouch) { st.crouch = 1; squash(.88); }
          tp = P({ tl: -.25, hl: .1, a1n: -.7, a2n: -.4, a1f: -.8, a2f: -.5, b1n: .6, b2n: -.3, b1f: .5, b2f: -.4 });
          ease(cp, tp, dt, 14); groundY(); face.fc = 1; face.mouth = 'grit'; face.brow = -1;
        } else if (t < 1) {
          tp = P({ tl: .7, hl: -.2, a1n: .9, a2n: 1.3, a1f: .7, a2f: 1.2, b1n: .4, b2n: .2, b1f: -.2, b2f: -.2 });
          ease(cp, tp, dt, 34); groundY(.04 * S * sin((t - .7) / .3 * PI)); face.fc = 1; face.mouth = 'o'; face.brow = 1;
          if (t > .9 && !st.slam) { st.slam = 1; squash(.62); puff(hip.x, FL, 8, 200); rip(hip.x, hip.y - T * 1.05, 1.8); }
        } else {
          // bounces off and wobbles, seeing stars
          var bu = Math.min(1, (t - 1) / .45);
          tp = P({ tl: -.5 + .2 * sin(t * 6), hl: .25, a1n: 2.1, a2n: 2.2, a1f: 1.8, a2f: 2.0, b1n: .2, b2n: .1, b1f: -.1, b2f: -.1 });
          ease(cp, tp, dt, 14); ground = false; hip.y = standHip() - .12 * S * sin(bu * PI);
          face.fc = 1; face.dizzy = true; face.mouth = 'o'; face.brow = 1; face.gl = .7;
          if (t > 2.1) go('pkgiveup');
        }
        break;
      }
      case 'pkgiveup': {
        face.fc = 1;
        if (t < .9) {
          if (!st.sigh) { st.sigh = 1; squash(.94); }
          tp = P({ tl: .22, hl: .35, a1n: .05, a2n: .05, a1f: -.05, a2f: -.05 }); face.mouth = 'o'; face.brow = 1;
        } else {
          // a little wave goodbye
          tp = P({ tl: -.05, hl: -.05, a1n: 2.5 + .4 * sin(t * 12), a2n: 2.9 + .5 * sin(t * 12), a1f: .05, a2f: .05 });
          face.mouth = 'grin'; face.brow = 1;
        }
        ease(cp, tp, dt, 14); groundY();
        if (t > 2.2) go('pksink');
        break;
      }
      case 'pksink': {
        var u3 = Math.min(1, t / .9), y1 = standHip();
        hip.y = y1 + (Hh + S * 1.3 - y1) * u3 * u3; ground = false;
        tp = P({ a1n: .1, a2n: .1 }); ease(cp, tp, dt, 14); face.fc = 1;
        if (t > .95) finish();
        break;
      }
      case 'fall': {
        an = anchorOf(); if (!an) { lose(); break; }
        var u = Math.min(1, t / .9), fh = fk(tp);
        hip.x = an.x - dir * fh.hn.x; hip.y = st.y0 + (an.y - fh.hn.y - st.y0) * u * u;
        tp = P({ tl: .1, hl: -.25, a1n: PI - .3 + .35 * sin(t * 26), a2n: PI - .3 + .35 * sin(t * 26), a1f: PI - .5 + .35 * sin(t * 26 + 2), a2f: PI - .5 + .35 * sin(t * 26 + 2), b1n: .5 + .35 * sin(t * 22), b2n: .1, b1f: -.3 + .35 * sin(t * 22 + 2), b2f: -.5 });
        ease(cp, tp, dt, 22);
        squash(1 + .12 * u);
        face.mouth = 'o'; face.brow = 1;
        if (t >= .9) {
          grip = an; if (st.tg.word) st.tg.held = true;
          jolt(80); squash(1.2); puff(an.x, an.y, 5, 160); go('hang');
        }
        break;
      }
      case 'hang': {
        an = anchorOf(); if (!an) { lose(); break; }
        grip = an;
        var th = .6 * Math.exp(-.8 * t) * cos(3.1 * t), pull = 0;
        if (t > 1.2 && t < 2.8) { var k = (t - 1.2) / 1.6; pull = max0(sin(k * PI * 3)) * (.8 - .35 * k); }
        if (pull > .45 && !(st.pp > .45)) { jolt(55); squash(.94); }
        st.pp = pull;
        tp = hangPose(th, pull, t, t < 1.2 ? .32 : .1);
        face.mouth = t < 2.8 ? 'grit' : 'grin'; face.brow = t < 2.8 ? -1 : 0;
        if (t > 2.8) { face.look = 1; tp.hl = -.12; }
        ease(cp, tp, dt, 16);
        if (t > 3.6) {
          if (st.tg.word) { st.tg.extra = 10; jolt(140); squash(1.12); go('lurch'); } else go('pump');
        }
        break;
      }
      case 'lurch': {
        // the word gives way a little and he freezes, looking up at it
        an = anchorOf(); if (!an) { lose(); break; }
        grip = an;
        tp = hangPose(.06 * sin(t * 22) * (1 - t), 0, t, 0); tp.hl = -.55; tp.b2n -= .2; tp.b2f -= .2;
        ease(cp, tp, dt, 20);
        face.mouth = 'o'; face.brow = 1;
        if (t > .95) go('pump');
        break;
      }
      case 'pump': {
        an = anchorOf(); if (!an) { lose(); break; }
        grip = an;
        var A = Math.min(1.2, .2 + t * .5), w = 3.3, ph = w * t, th2 = A * sin(ph), thd = A * w * cos(ph), fw = thd > 0;
        tp = hangPose(th2, 0, t, 0);
        tp.b1n = th2 + (fw ? .75 : -.3); tp.b2n = tp.b1n - (fw ? .1 : 1.1);
        tp.b1f = th2 + (fw ? .6 : -.4); tp.b2f = tp.b1f - (fw ? .2 : 1.2);
        tp.tl = -th2 - (fw ? .18 : -.15); tp.hl = fw ? .15 : -.2;
        face.mouth = A > .9 ? 'grin' : 'grit'; face.brow = A > .9 ? 1 : -1;
        if (st.tg.word) st.tg.extra = 6 + 6 * abs(sin(ph));
        ease(cp, tp, dt, 18);
        if (A >= 1.15 && th2 > .7 && fw) {
          // let go at the top of the forward swing, with a cartoon-sized push
          f = fk(cp); var Lb = Math.hypot(f.hn.x, f.hn.y), sp = Lb * thd * 1.7;
          vel.x = dir * sp * cos(th2); vel.y = -sp * sin(th2) - 1.45 * S;
          var yL = standHip(), dsc = vel.y * vel.y + 2 * gF * (yL - hip.y), Tf = (-vel.y + Math.sqrt(max0(dsc))) / gF;
          var landX = hip.x + vel.x * Tf, lo = S * .7, hi = W - S * .7;
          if (landX < lo || landX > hi) vel.x = ((landX < lo ? lo : hi) - hip.x) / Tf;
          st.turns = Tf > 1.05 ? 2 : 1; rot = 0;
          letGo(170); squash(1.18); go('fly');
        }
        break;
      }
      case 'fly': {
        // a moment of slow motion at the top of the arc
        var d2 = abs(vel.y) < 280 ? dt * .45 : dt;
        hip.x += vel.x * d2; hip.y += vel.y * d2; vel.y += gF * d2;
        var yL2 = standHip(), dc = vel.y * vel.y + 2 * gF * (yL2 - hip.y), Trem = (-vel.y + Math.sqrt(max0(dc))) / gF;
        rot += (st.turns * 2 * PI - rot) * Math.min(1, d2 / Math.max(.02, Trem));
        tp = Trem > .22
          ? P({ tl: .5, hl: .3, a1n: 1.5, a2n: 2.6, a1f: 1.3, a2f: 2.5, b1n: 1.6, b2n: -.2, b1f: 1.4, b2f: -.3 })
          : P({ tl: .15, hl: -.1, a1n: 1.9, a2n: 2.2, a1f: -1.5, a2f: -1.3, b1n: .35, b2n: .05, b1f: -.15, b2f: -.3 });
        ease(cp, tp, dt, Trem > .22 ? 18 : 26);
        face.mouth = 'grin'; face.brow = 1;
        if (offscreen()) { rot = 0; enterFromEdge(); carry = true; phi = 0; go('run2'); break; }
        if (hip.y >= yL2 && vel.y > 0) { rot = 0; hip.y = yL2; squash(.66); puff(hip.x, FL, 14, 260); go('land'); }
        break;
      }
      case 'land': {
        tp = t < .22 ? P({ tl: .55, hl: -.1, a1n: 1.4, a2n: 1.7, a1f: -1.2, a2f: -1, b1n: 1.05, b2n: -.4, b1f: .85, b2f: -.5 }) : P({ tl: .05, hl: -.05 });
        ease(cp, tp, dt, 20); groundY();
        face.mouth = 'grin'; face.brow = 1;
        if (t > .45) { squash(1.12); go('tada'); }
        break;
      }
      case 'tada': {
        tp = P({ tl: -.1, hl: -.12, a1n: 2.55, a2n: 2.75, a1f: 2.35, a2f: 2.55, b1n: .12, b2n: .02, b1f: -.14, b2f: -.12 });
        ease(cp, tp, dt, 14); groundY(.03 * S * max0(sin(t * 9)) * (1 - t));
        face.mouth = 'grin'; face.brow = 1; face.look = 1;
        if (t > 1.1) go('watch');
        break;
      }
      case 'watch': {
        if (t < .75) {
          tp = P({ tl: .05, hl: .45, a1n: .25, a2n: 2.35, a1f: -.05, a2f: .15 });
          face.mouth = 'smile';
        } else {
          if (!st.shock) { st.shock = 1; squash(1.22); }
          tp = P({ tl: -.12, hl: -.15, a1n: -.5, a2n: .2, a1f: -.7, a2f: -.1, b1n: .1, b2n: .05, b1f: -.1, b2f: -.1 });
          face.mouth = 'o'; face.brow = 1; face.gl = .55; face.look = 1;
        }
        ease(cp, tp, dt, 16);
        groundY(t > .75 ? .14 * S * max0(sin((t - .75) / .3 * PI)) * (t < 1.05 ? 1 : 0) : 0);
        if (t > 1.35) { phi = 0; go('windup'); }
        break;
      }
      case 'windup': {
        // legs spin in place before he takes off
        phi += dt * 2 * PI * 5.5;
        tp = runPose(phi, false, .5); ease(cp, tp, dt, 30); groundY(.02 * S * abs(sin(phi)));
        face.mouth = 'grit'; face.brow = -1;
        if (Math.random() < dt * 30) puff(hip.x - dir * .08 * S, FL - 2, 1, 200);
        if (t > .55) { squash(.9); go('dash'); }
        break;
      }
      case 'dash': case 'run2': case 'run3': {
        var v = act === 'dash' ? Math.max(1000, W * 1.1) : act === 'run2' ? Math.max(460, W * .42) : Math.max(320, W * .3);
        phi += dt * 2 * PI * Math.min(v, 700) / (1.5 * S); hip.x += dir * v * dt;
        tp = runPose(phi, act === 'run2' && carry, act === 'dash' ? .42 : act === 'run2' ? .24 : .16); ease(cp, tp, dt, 26);
        groundY(.05 * S * max0(sin(2 * phi + 1.2)));
        face.mouth = act === 'run3' ? 'grin' : 'grit'; face.brow = act === 'run3' ? 0 : -1; face.look = act === 'run3' ? .6 : 0;
        if (act === 'run2' && carry && Math.random() < dt * 3.2) sheet(hip.x + dir * .1 * S, hip.y - T * .85, -dir * (80 + Math.random() * 100), -80 - Math.random() * 80);
        if (Math.random() < dt * (act === 'dash' ? 30 : 14)) puff(hip.x - dir * .05 * S, FL - 2, 1);
        if (act === 'dash' && offscreen()) { enterFromEdge(); carry = true; go('run2'); }
        if (act === 'run2' && (dir > 0 ? hip.x > W * .52 : hip.x < W * .48)) { st.v0 = v; go('slip'); }
        if (act === 'run3' && offscreen()) finish();
        break;
      }
      case 'slip': {
        var s0 = st.v0 || 500;
        if (t < .8) hip.x += dir * s0 * Math.pow(1 - t / .8, 2) * dt;
        if (t < .5) {
          tp = P({ tl: -.45, hl: .2, a1n: -2.7, a2n: -2.8, a1f: -2.5, a2f: -2.6, b1n: .55, b2n: .3, b1f: 1.2, b2f: 1.2 });
          ease(cp, tp, dt, 16); hip.y = standHip() - .2 * S * sin(PI * t / .5); ground = false;
          face.mouth = 'o'; face.brow = 1; face.gl = 1;
          if (!st.burst && t > .08) { st.burst = 1; carry = false; for (var k2 = 0; k2 < 16; k2++) sheet(hip.x + dir * .15 * S, hip.y - T * .8, (Math.random() - .3) * 300 * dir, -320 - Math.random() * 260); }
        } else if (t < 1.8) {
          if (!st.sat) { st.sat = 1; squash(.78); puff(hip.x, FL, 10, 220); }
          tp = P({ tl: -.18, hl: .22 * sin((t - .5) * 6), a1n: -.85, a2n: -.45, a1f: -.7, a2f: -.35, b1n: 1.5, b2n: 1.55, b1f: 1.4, b2f: 1.5 });
          ease(cp, tp, dt, 14); hip.y += (FL - .075 * S - hip.y) * Math.min(1, dt * 18); ground = true;
          face.dizzy = true; face.look = .5; face.gl = t < 1.05 ? 1 : 0;
          face.mouth = t < 1.2 ? 'o' : 'smile'; face.brow = t < 1.2 ? 1 : 0;
        } else if (t < 2.3) {
          tp = P({ tl: .5, hl: 0, a1n: .9, a2n: 1.3, a1f: .6, a2f: 1.0, b1n: 1.0, b2n: -.3, b1f: .8, b2f: -.4 });
          ease(cp, tp, dt, 14); f = fk(cp); hip.y += (FL - lowest(f) - hip.y) * Math.min(1, dt * 10); ground = true;
        } else if (t < 2.9) {
          // dusts himself off
          tp = P({ tl: .22, hl: .1, a1n: .35 + .3 * sin(t * 18), a2n: .95 + .3 * sin(t * 18), a1f: .2 + .3 * sin(t * 18 + 2), a2f: .8 + .3 * sin(t * 18 + 2) });
          ease(cp, tp, dt, 20); groundY();
          face.mouth = 'grin'; face.look = 1;
        } else { phi = 0; go('run3'); }
        break;
      }
      case 'lost': {
        grip = null; vel.y += g * dt; hip.y += vel.y * dt; hip.x += vel.x * dt;
        tp = P({ tl: .3, a1n: PI - .5, a2n: PI - .4, a1f: PI - .8, a2f: PI - .6, b1n: .6, b2n: .1, b1f: -.4, b2f: -.6 }); ease(cp, tp, dt, 14);
        face.mouth = 'o'; face.brow = 1;
        if (hip.y >= standHip() && vel.y > 0) { hip.y = standHip(); vel.y = 0; squash(.7); puff(hip.x, FL, 10, 220); go('land'); }
        break;
      }
    }
    if (on && grip && (act === 'hang' || act === 'lurch' || act === 'pump')) {
      f = fk(cp); hip.x = grip.x - dir * f.hn.x; hip.y = grip.y - f.hn.y;
    }
    for (var ri = rips.length - 1; ri >= 0; ri--) { rips[ri].l += dt; if (rips[ri].l > rips[ri].d) rips.splice(ri, 1); }
    if (act.indexOf('pk') !== 0 && act !== 'land' && act !== 'tada' && act !== 'watch' && act !== 'windup' && act !== 'dash' && act !== 'run2' && act !== 'run3' && act !== 'slip') ground = false;
    sqv += (-(sq - 1) * 300 - sqv * 13) * dt; sq = Math.max(.6, Math.min(1.35, sq + sqv * dt));
    stepWords(dt);
    for (var si = sheets.length - 1; si >= 0; si--) {
      var sh = sheets[si]; sh.l += dt; sh.ph += dt * 5;
      sh.vy += 380 * dt; if (sh.vy > 120) sh.vy -= (sh.vy - 120) * Math.min(1, dt * 4);
      sh.vx += sin(sh.ph) * 260 * dt; sh.vx *= 1 - Math.min(1, dt * 1.2);
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.r += sh.vr * dt;
      if (sh.y > FL - 4) { sh.y = FL - 4; sh.vy = 0; sh.vx *= .9; sh.vr *= .8; }
      if (sh.l > 7) sheets.splice(si, 1);
    }
    for (var pi = puffs.length - 1; pi >= 0; pi--) { var pf = puffs[pi]; pf.l += dt; pf.x += pf.vx * dt; pf.y += pf.vy * dt; if (pf.l > pf.d) puffs.splice(pi, 1); }
  }

  function render(dt) {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, Hh);
    if (R3) {
      R3.render({
        on: on, p: cp, hip: hip, dir: dir, rot: rot, carry: carry, sheets: sheets, S: S, W: W, Hh: Hh, dt: dt,
        grip: on && (act === 'hang' || act === 'lurch' || act === 'pump') ? grip : null,
        sq: sq, sqPiv: ground ? FEET : 0, mouth: face.mouth, brow: face.brow, look: face.look, gl: face.gl, dizzy: face.dizzy, clock: clock,
        fc: face.fc, turn: face.turn
      });
    }
    if (!on && !sheets.length && !puffs.length && !rips.length) return;
    // rings on the "glass" where his hands and shoulder hit it
    rips.forEach(function (r) {
      var k = r.l / r.d, rad = S * (.05 + .2 * k) * r.s;
      x.globalAlpha = (1 - k) * .9; x.lineWidth = 3;
      x.strokeStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.ellipse(r.x, r.y, rad, rad * .85, 0, 0, PI * 2); x.stroke();
      x.lineWidth = 1.5; x.strokeStyle = 'rgba(90,100,125,.55)'; x.beginPath(); x.ellipse(r.x, r.y, rad + 3, (rad + 3) * .85, 0, 0, PI * 2); x.stroke();
    });
    x.globalAlpha = 1;
    puffs.forEach(function (p) { var k = 1 - p.l / p.d; x.globalAlpha = .55 * k; circ(p.x, p.y, p.r * (1 + (1 - k) * 1.5), '#9aa0ad'); });
    x.globalAlpha = 1;
    // contact shadow: darker and tighter the closer he is to the floor
    if (on && !grip) {
      var hgt = FL - (hip.y - FEET * S), cl = Math.max(0, 1 - hgt / (1.6 * S));
      if (cl > 0) { x.fillStyle = 'rgba(0,0,0,' + (.17 * cl).toFixed(3) + ')'; x.beginPath(); x.ellipse(hip.x, FL + 1, .17 * S * (.6 + .4 * cl), .022 * S, 0, 0, PI * 2); x.fill(); }
    }
    // speed lines while he dashes
    if (on && (act === 'dash' || act === 'windup')) {
      x.strokeStyle = 'rgba(120,128,145,.45)'; x.lineCap = 'round';
      for (var i = 0; i < 6; i++) {
        var yy = hip.y - T * (1.4 - i * .32), x0 = hip.x - dir * S * (.28 + (i % 2) * .08), len = S * (.4 + ((i * 37 + Math.floor(clock * 20)) % 7) * .09);
        x.lineWidth = 2 + (i % 3); x.beginPath(); x.moveTo(x0, yy); x.lineTo(x0 - dir * len, yy); x.stroke();
      }
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
      x.restore();
    });
  }

  function loop(now) {
    var dt = Math.min(.05, (now - last) / 1000) * (window.__wc.ts || 1); last = now;
    update(dt);
    render(dt);
    if (on || sheets.length || puffs.length || wob.length || rips.length) raf = requestAnimationFrame(loop);
  }

  /* the 3D body loads in the background; until it is ready (or if WebGL is missing) the flat drawing is used */
  var R3 = null, r3tried = false;
  function load3d() {
    if (r3tried) return; r3tried = true;
    import('./char3d.js').then(function (m) { R3 = m.init(); }).catch(function () { R3 = null; });
  }
  setTimeout(load3d, q('wc') ? 0 : 1000);

  window.__wc.step = function (sec) { for (var i = 0; i < Math.round(sec * 60); i++) update(1 / 60); render(1 / 60); return act; };
  window.__wc.r3 = function () { return !!R3; };
  window.__wc.state = function () { return { on: on, act: act, t: t, hip: hip, dir: dir, S: S, word: !!(st.tg && st.tg.word), el: st.tg && st.tg.el.tagName + ':' + (st.tg.el.textContent || '').slice(0, 20), wa: st.tg && st.tg.a }; };
  window.__wc.perform = perform;
  timer = setTimeout(schedule, q('wc') ? 1500 : 5000);
})();
