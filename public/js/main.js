/* muhammadusmandev.com */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Run `cb(true|false)` whenever `el` enters or leaves the viewport. */
  function onVisible(el, cb, margin = '0px') {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting)), { rootMargin: margin });
    io.observe(el);
  }

  /* ───────────────────────── links & small bits ───────────────────────── */

  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' });
  const tick = () => $$('[data-clock]').forEach((el) => (el.textContent = clockFmt.format(new Date())));
  tick();
  setInterval(tick, 15000);

  const toastEl = $('[data-toast]');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  }

  $$('[data-copy]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      btn.textContent = 'Copied';
      toast('Email copied to clipboard');
      setTimeout(() => (btn.textContent = 'Copy'), 2000);
    })
  );

  /* ───────────────────────── asteroids (loaded on first play) ───────────────────────── */

  const playBtn = $('[data-play]');
  playBtn.addEventListener('click', async (e) => {
    const game = await import('/js/game.js');
    // launch from where the pointer was; keyboard activation starts mid-screen
    if (e.detail) game.start(e.clientX, e.clientY);
    else game.start();
  });

  /* ───────────────────────── nav, progress, active link ───────────────────────── */

  const nav = $('.nav');
  const bar = $('.progress span');
  let scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      nav.classList.toggle('is-scrolled', scrollY > 24);
      scrollQueued = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav__links a');
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.hash === '#' + e.target.id));
      }),
    { rootMargin: '-45% 0px -50% 0px' }
  );
  ['work', 'projects', 'stack', 'contact'].forEach((id) => spy.observe(document.getElementById(id)));

  /* ───────────────────────── reveal on scroll ───────────────────────── */

  // Stagger siblings that reveal together
  $$('.numbers, .stack, .contact__title').forEach((group) =>
    $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', `${i * 90}ms`))
  );

  const revealer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealer.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -8% 0px' }
  );
  $$('.reveal').forEach((el) => revealer.observe(el));

  /* ───────────────────────── count up ───────────────────────── */

  $$('[data-count]').forEach((el) => {
    const target = +el.dataset.count;
    if (reduced) return void (el.textContent = target);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1700;
      const step = (now) => {
        const t = clamp((now - start) / dur, 0, 1);
        const eased = 1 - Math.pow(2, -10 * t);
        el.textContent = Math.round(target * (t === 1 ? 1 : eased));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ───────────────────────── ticker ───────────────────────── */

  const track = $('.ticker__track');
  if (track) track.innerHTML += track.innerHTML;

  /* ───────────────────────── hero name: variable-weight letters ───────────────────────── */

  (function heroName() {
    const name = $('.hero__name');
    const chars = [];
    let i = 0;
    $$('[data-split]', name).forEach((node) => {
      const text = node.textContent;
      node.textContent = '';
      for (const ch of text) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--i', i++);
        node.append(span);
        chars.push({ el: span, w: 380, s: 0 });
      }
    });

    const sun = $('.hero__sun');
    const sunPos = { x: 0, y: 0, s: 1 };
    const show = () => { name.classList.add('is-in'); sun.classList.add('is-in'); };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(show));
    setTimeout(show, 1200);

    if (reduced) return;

    const pointer = { x: -9999, y: -9999, active: false, last: 0 };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.last = performance.now();
    }, { passive: true });
    document.addEventListener('pointerleave', () => (pointer.active = false));

    let running = false;
    let raf;
    function frame(now) {
      const idle = !pointer.active || now - pointer.last > 2500;
      const rects = chars.map((c) => c.el.getBoundingClientRect());
      const radius = Math.max(innerWidth * 0.16, 160);
      chars.forEach((c, k) => {
        let tw, ts;
        if (idle || !finePointer) {
          const wave = Math.sin(now / 900 - k * 0.55);
          tw = 380 + 160 * Math.max(0, wave);
          ts = 50 + 50 * wave;
        } else {
          const r = rects[k];
          const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
          const p = clamp(1 - d / radius, 0, 1);
          const e = p * p * (3 - 2 * p);
          tw = 300 + 600 * e;
          ts = 100 * e;
        }
        c.w = lerp(c.w, tw, 0.12);
        c.s = lerp(c.s, ts, 0.12);
        c.el.style.setProperty('--w', c.w.toFixed(1));
        c.el.style.setProperty('--s', c.s.toFixed(1));
      });

      // the orange disc leans toward the cursor and swells when it's close
      let tx = 0, ty = 0, ts = 1;
      if (!idle && finePointer) {
        const r = sun.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2 - sunPos.x);
        const dy = pointer.y - (r.top + r.height / 2 - sunPos.y);
        tx = clamp(dx * 0.06, -40, 40);
        ty = clamp(dy * 0.06, -40, 40);
        ts = 1 + 0.1 * clamp(1 - Math.hypot(dx, dy) / (r.width * 1.2), 0, 1);
      } else {
        ty = Math.sin(now / 1600) * 6;
      }
      sunPos.x = lerp(sunPos.x, tx, 0.06);
      sunPos.y = lerp(sunPos.y, ty, 0.06);
      sunPos.s = lerp(sunPos.s, ts, 0.08);
      sun.style.setProperty('--sx', `${sunPos.x.toFixed(2)}px`);
      sun.style.setProperty('--sy', `${sunPos.y.toFixed(2)}px`);
      sun.style.setProperty('--ss', sunPos.s.toFixed(3));
      raf = requestAnimationFrame(frame);
    }
    onVisible(name, (v) => {
      if (v && !running) { running = true; raf = requestAnimationFrame(frame); }
      if (!v && running) { running = false; cancelAnimationFrame(raf); }
    });
  })();

  /* ───────────────────────── experience accordion ───────────────────────── */

  $$('.job').forEach((job) => {
    const btn = $('.job__row', job);
    btn.addEventListener('click', () => {
      const open = !job.classList.contains('is-open');
      job.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
    });
  });

  /* ───────────────────────── magnetic email ───────────────────────── */

  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.12;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .3s, background-size .5s';
        el.style.transform = '';
        setTimeout(() => (el.style.transition = ''), 600);
      });
    });
  }

  /* ───────────────────────── contact form → mailto ───────────────────────── */

  const form = $('[data-form]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    ['name', 'message'].forEach((n) => {
      const field = form.elements[n];
      const bad = !field.value.trim();
      field.closest('.field').classList.toggle('is-invalid', bad);
      if (bad && ok) { field.focus(); ok = false; }
    });
    if (!ok) return void ($('[data-form-hint]').textContent = 'Add your name and a short note first.');
    const name = form.elements.name.value.trim();
    const msg = form.elements.message.value.trim();
    const href = `mailto:muawan2001@gmail.com?subject=${encodeURIComponent(`Hello from ${name}`)}&body=${encodeURIComponent(`${msg}\n\n— ${name}`)}`;
    $('[data-form-hint]').textContent = 'Opening your mail app…';
    location.href = href;
  });
  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-invalid'));

  /* ═════════════════════════ DEMO 1 · ingestion pipeline ═════════════════════════ */

  (function pipeline() {
    const root = $('[data-pipeline]');
    if (!root) return;
    const canvas = $('canvas', root);
    const ctx = canvas.getContext('2d');
    const loadInput = $('[data-load]', root);
    const out = { pods: $('[data-pods]', root), rate: $('[data-rate]', root), indexed: $('[data-indexed]', root) };

    const C = { paper: '#EDEAE2', dim: 'rgba(237,234,226,0.12)', faint: 'rgba(237,234,226,0.45)', accent: '#FF4D1A', bg: '#121109' };
    const STAGES = ['parse', 'chunk', 'caption', 'embed'];
    const M = { maxPods: 8, podRate: 1.4, speed: 170 };
    const MONTHLY_AT_FULL = 250000; // all pods busy ≈ the pipeline's real monthly volume

    let W = 0, H = 0, dpr = 1;
    let geo = {};
    let load = +loadInput.value;
    let userLoad = false;
    let queue = 6;
    let indexedTotal = 0;
    let doneEMA = 0;
    let lastScale = 0;
    let zeroSince = 0;
    let particles = [];
    let flyers = [];
    let cells = [];
    let pods = [];
    let simT = 0;

    function makePods() {
      pods = Array.from({ length: 8 }, (_, k) => ({ on: k < 2, a: k < 2 ? 1 : 0, next: 0 }));
    }
    makePods();

    function layout() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const narrow = W < 520;
      const qW = narrow ? 44 : 64;
      const idxW = narrow ? 70 : 110;
      const x0 = qW + 18;
      const x1 = W - idxW - 14;
      const top = 44, bottom = H - 16;
      const laneGap = (bottom - top) / 8;
      geo = {
        narrow, qW, x0, x1, top, bottom,
        stageX: STAGES.map((_, k) => lerp(x0, x1, (k + 0.6) / STAGES.length)),
        laneY: Array.from({ length: 8 }, (_, k) => top + laneGap * (k + 0.5)),
        idx: { x: W - idxW, y: top, w: idxW - 12, h: bottom - top },
      };
      const cols = narrow ? 6 : 9;
      const size = geo.idx.w / cols;
      const rows = Math.floor(geo.idx.h / size);
      const old = cells;
      cells = [];
      for (let rr = 0; rr < rows; rr++)
        for (let cc = 0; cc < cols; cc++)
          cells.push({ x: geo.idx.x + size * (cc + 0.5), y: geo.idx.y + size * (rr + 0.5), r: Math.min(3, size * 0.22), fill: 0, flash: 0 });
      old.forEach((c, k) => { if (cells[k]) cells[k].fill = c.fill; });
    }

    function paintSlider() { loadInput.style.setProperty('--fill', `${loadInput.value}%`); }
    loadInput.addEventListener('input', () => { userLoad = true; load = +loadInput.value; paintSlider(); });
    paintSlider();

    function nextCell() {
      let c = cells.find((c) => c.fill === 0 && !c.claimed);
      if (!c) {
        cells.forEach((c) => { c.fill = 0; c.claimed = false; });
        c = cells[0];
      }
      c.claimed = true;
      return c;
    }

    function step(dt, now) {
      simT += dt;
      if (!userLoad && !reduced) {
        // simulated traffic: starts busy, eases off to idle, then ramps back up
        const t = simT + 2;
        load = clamp(48 + 58 * Math.sin(t * 0.21) + 10 * Math.sin(t * 0.9), 0, 100);
        loadInput.value = Math.round(load);
        paintSlider();
      }

      // arrivals
      const lambda = (load / 100) * 9;
      if (Math.random() < lambda * dt) queue++;
      queue = Math.min(queue, 400);

      // autoscaling (KEDA-ish: scale on backlog + arrival rate, scale to zero when idle)
      const active = pods.filter((p) => p.on).length;
      let target = clamp(Math.ceil(lambda / M.podRate + queue / 8), 0, M.maxPods);
      if (queue === 0 && lambda < 0.15) {
        if (!zeroSince) zeroSince = now;
        if (now - zeroSince < 2500) target = Math.max(target, 1);
      } else zeroSince = 0;
      if (target > active && now - lastScale > 450) {
        pods.find((p) => !p.on).on = true; lastScale = now;
      } else if (target < active && now - lastScale > 1400) {
        [...pods].reverse().find((p) => p.on).on = false; lastScale = now;
      }

      // pods pull work
      pods.forEach((p, k) => {
        p.a = lerp(p.a, p.on ? 1 : 0, 0.08);
        if (!p.on || queue <= 0) return;
        p.next -= dt;
        if (p.next <= 0) {
          queue--;
          p.next = 1 / M.podRate * (0.75 + Math.random() * 0.5);
          particles.push({ lane: k, x: geo.x0, speed: M.speed * (0.9 + Math.random() * 0.2) });
        }
      });

      // move
      let done = 0;
      particles = particles.filter((pt) => {
        pt.x += pt.speed * dt;
        if (pt.x < geo.x1) return true;
        const y = geo.laneY[pt.lane];
        for (let j = 0; j < 3; j++) flyers.push({ x0: pt.x, y0: y + (j - 1) * 6, cell: nextCell(), t: 0 });
        done++;
        return false;
      });
      flyers = flyers.filter((f) => {
        f.t += dt / 0.55;
        if (f.t < 1) return true;
        f.cell.fill = 1; f.cell.flash = 1;
        indexedTotal++;
        return false;
      });
      cells.forEach((c) => (c.flash = Math.max(0, c.flash - dt * 2.5)));

      const inst = dt > 0 ? done / dt : 0;
      doneEMA = lerp(doneEMA, inst, Math.min(1, dt * 0.8));
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function draw() {
      const { x0, x1, top, bottom, stageX, laneY, idx, qW, narrow } = geo;
      ctx.clearRect(0, 0, W, H);
      ctx.font = `${narrow ? 9 : 10}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'middle';

      // stage columns
      stageX.forEach((x, k) => {
        ctx.strokeStyle = C.dim;
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(x, top - 8); ctx.lineTo(x, bottom); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.faint;
        ctx.textAlign = 'center';
        ctx.fillText(STAGES[k].toUpperCase(), x, 20);
      });
      ctx.textAlign = 'center';
      ctx.fillText('QUEUE', qW / 2 + 4, 20);
      ctx.fillText('INDEX', idx.x + idx.w / 2, 20);

      // lanes
      pods.forEach((p, k) => {
        const y = laneY[k];
        const busy = particles.some((pt) => pt.lane === k);
        const a = Math.max(p.a, busy ? 0.35 : 0);
        if (a < 0.02) {
          ctx.strokeStyle = 'rgba(237,234,226,0.04)';
          ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
          return;
        }
        ctx.globalAlpha = a;
        ctx.strokeStyle = 'rgba(237,234,226,0.22)';
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        stageX.forEach((x) => {
          const near = particles.some((pt) => pt.lane === k && Math.abs(pt.x - x) < 10);
          ctx.fillStyle = near ? C.accent : '#2a2821';
          roundRect(x - 5, y - 5, 10, 10, 2.5); ctx.fill();
        });
        if (!narrow) {
          ctx.fillStyle = C.faint;
          ctx.textAlign = 'left';
          ctx.fillText(`pod-${k + 1}`, x0 + 2, y - 9);
        }
        ctx.globalAlpha = 1;
      });

      // queue stack
      const shown = Math.min(queue, 18);
      for (let q = 0; q < shown; q++) {
        const y = bottom - 8 - q * ((bottom - top - 24) / 18);
        ctx.fillStyle = q === shown - 1 && queue > 18 ? C.accent : 'rgba(237,234,226,0.75)';
        roundRect(qW / 2 - 8, y - 4, 24, 7, 1.5); ctx.fill();
      }
      ctx.fillStyle = queue > 40 ? C.accent : C.paper;
      ctx.textAlign = 'center';
      ctx.fillText(String(queue), qW / 2 + 4, top - 6);

      // particles: doc → chunks → captioned → vectors
      particles.forEach((pt) => {
        const y = laneY[pt.lane];
        const x = pt.x;
        if (x < stageX[1]) {
          ctx.fillStyle = C.paper;
          roundRect(x - 6, y - 7, 12, 14, 1.5); ctx.fill();
          ctx.fillStyle = '#121109';
          ctx.fillRect(x - 3.5, y - 3, 7, 1); ctx.fillRect(x - 3.5, y, 7, 1); ctx.fillRect(x - 3.5, y + 3, 5, 1);
        } else {
          const spread = clamp((x - stageX[1]) / 18, 0, 1) * 6;
          for (let j = -1; j <= 1; j++) {
            const yy = y + j * spread;
            if (x < stageX[2]) { ctx.fillStyle = C.paper; ctx.fillRect(x - 3, yy - 2.5, 6, 5); }
            else if (x < stageX[3]) { ctx.fillStyle = C.accent; ctx.fillRect(x - 3, yy - 2.5, 6, 5); }
            else {
              ctx.fillStyle = C.accent;
              ctx.shadowColor = C.accent; ctx.shadowBlur = 8;
              ctx.beginPath(); ctx.arc(x, yy, 2.6, 0, Math.PI * 2); ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        }
      });

      // index grid
      cells.forEach((c) => {
        ctx.fillStyle = c.fill ? (c.flash > 0 ? C.paper : C.accent) : 'rgba(237,234,226,0.1)';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r + c.flash * 1.5, 0, Math.PI * 2); ctx.fill();
      });
      flyers.forEach((f) => {
        const e = 1 - Math.pow(1 - f.t, 3);
        const x = lerp(f.x0, f.cell.x, e);
        const y = lerp(f.y0, f.cell.y, e) - Math.sin(f.t * Math.PI) * 18;
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
      });

      // readouts
      const active = pods.filter((p) => p.on).length;
      out.pods.textContent = active === 0 ? '0 · idle' : `${active}/${M.maxPods}`;
      out.indexed.textContent = indexedTotal.toLocaleString('en-US');
      const monthly = MONTHLY_AT_FULL * clamp(doneEMA / (M.maxPods * M.podRate), 0, 1);
      out.rate.textContent = monthly < 500 ? '—' : `≈ ${Math.round(monthly / 1000)}k / mo`;
    }

    let running = false, raf, last = 0;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      step(dt, now);
      draw();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    new ResizeObserver(() => { layout(); if (!running) draw(); }).observe(canvas);
    layout();
    onVisible(root, (v) => (v && !document.hidden ? start() : stop()), '100px');
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : root.getBoundingClientRect().top < innerHeight && start()));
  })();

  /* ═════════════════════════ DEMO 2 · MCP gateway ═════════════════════════ */

  (function mcp() {
    const root = $('[data-mcp]');
    if (!root) return;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = $('svg', root);
    const logEl = $('[data-log]', root);
    const creditsEl = $('[data-credits]', root);
    const buttons = $$('[data-send]', root);
    const START_CREDITS = 8;
    let credits = START_CREDITS;
    let busy = false;
    let lastUser = 0;
    let nodes = {}, edges = {};

    const el = (tag, attrs = {}, parent) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.append(n);
      return n;
    };

    function build() {
      const wide = root.clientWidth >= 540;
      svg.innerHTML = '';
      nodes = {}; edges = {};
      let VW, VH, clients, gw, servers, horiz;

      if (wide) {
        VW = 720; VH = 380; horiz = true;
        clients = [['claude', 'Claude', 'client'], ['cursor', 'Cursor', 'client'], ['bad', 'Unknown', 'no token']]
          .map(([id, l, s], k) => ({ id, label: l, sub: s, x: 18, y: 80 + k * 100, w: 128, h: 50 }));
        gw = { id: 'gw', x: 252, y: 40, w: 200, h: 300 };
        servers = Array.from({ length: 5 }, (_, k) => ({ id: `s${k}`, label: `server-0${k + 1}`, sub: 'MCP · HTTP', x: 562, y: 36 + k * 64, w: 140, h: 46 }));
      } else {
        VW = 360; VH = 520; horiz = false;
        clients = [['claude', 'Claude', 'client'], ['cursor', 'Cursor', 'client'], ['bad', 'Unknown', 'no token']]
          .map(([id, l, s], k) => ({ id, label: l, sub: s, x: 10 + k * 116, y: 14, w: 108, h: 50 }));
        gw = { id: 'gw', x: 30, y: 136, w: 300, h: 220 };
        servers = Array.from({ length: 5 }, (_, k) => ({ id: `s${k}`, label: `0${k + 1}`, sub: 'MCP', x: 10 + k * 69, y: 440, w: 63, h: 50 }));
      }
      svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

      const gEdges = el('g', {}, svg);
      const gNodes = el('g', {}, svg);
      const curve = (a, b) => horiz
        ? `M${a.x},${a.y} C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x},${b.y}`
        : `M${a.x},${a.y} C${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y}`;

      clients.forEach((c) => {
        const a = horiz ? { x: c.x + c.w, y: c.y + c.h / 2 } : { x: c.x + c.w / 2, y: c.y + c.h };
        const b = horiz ? { x: gw.x, y: c.y + c.h / 2 } : { x: c.x + c.w / 2, y: gw.y };
        edges[c.id] = el('path', { class: 'edge', d: curve(a, b) }, gEdges);
      });
      servers.forEach((s) => {
        const a = horiz ? { x: gw.x + gw.w, y: s.y + s.h / 2 } : { x: s.x + s.w / 2, y: gw.y + gw.h };
        const b = horiz ? { x: s.x, y: s.y + s.h / 2 } : { x: s.x + s.w / 2, y: s.y };
        edges[s.id] = el('path', { class: 'edge', d: curve(a, b) }, gEdges);
      });

      const box = (n, cls) => {
        const g = el('g', { class: `node ${cls || ''}` }, gNodes);
        el('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8 }, g);
        const t = el('text', { x: n.x + 12, y: n.y + n.h / 2 - 5, 'font-size': 13, 'dominant-baseline': 'middle' }, g);
        t.textContent = n.label;
        const s = el('text', { x: n.x + 12, y: n.y + n.h / 2 + 11, 'font-size': 9.5, class: 'sub', 'dominant-baseline': 'middle' }, g);
        s.textContent = n.sub.toUpperCase();
        nodes[n.id] = g;
      };
      clients.forEach((c) => box(c));
      servers.forEach((s) => box(s));

      // gateway with badges
      const g = el('g', { class: 'node node--gw' }, gNodes);
      el('rect', { x: gw.x, y: gw.y, width: gw.w, height: gw.h, rx: 12 }, g);
      const title = el('text', { x: gw.x + 16, y: gw.y + 26, 'font-size': 14, 'dominant-baseline': 'middle' }, g);
      title.textContent = 'MCP GATEWAY';
      const subt = el('text', { x: gw.x + 16, y: gw.y + 44, 'font-size': 9.5, class: 'sub', 'dominant-baseline': 'middle' }, g);
      subt.textContent = 'STREAMABLE HTTP';
      nodes.gw = g;
      const badges = [['auth', 'OAuth 2.1 · CIMD'], ['authz', 'per-request authz'], ['credits', 'credit meter'], ['router', 'router']];
      const bh = horiz ? 44 : 30, gap = horiz ? 14 : 10, bx = gw.x + 16, bw = gw.w - 32;
      const by0 = gw.y + (horiz ? 72 : 64);
      badges.forEach(([id, label], k) => {
        const bg = el('g', { class: 'badge' }, g);
        el('rect', { x: bx, y: by0 + k * (bh + gap), width: bw, height: bh, rx: 6 }, bg);
        const t = el('text', { x: bx + 12, y: by0 + k * (bh + gap) + bh / 2, 'font-size': 11.5, 'dominant-baseline': 'middle' }, bg);
        t.textContent = label;
        nodes[id] = bg;
      });
    }

    function log(parts) {
      const line = document.createElement('div');
      parts.forEach(([text, cls]) => {
        const s = document.createElement('span');
        if (cls) s.className = cls;
        s.textContent = text;
        line.append(s);
      });
      logEl.append(line);
      while (logEl.children.length > 7) logEl.firstChild.remove();
    }

    function travel(path, cls, reverse = false, dur = 620) {
      return new Promise((resolve) => {
        const len = path.getTotalLength();
        const dot = el('circle', { r: 5, class: `packet ${cls || ''}` }, svg);
        const t0 = performance.now();
        path.classList.add('is-hot');
        const f = (now) => {
          const t = clamp((now - t0) / dur, 0, 1);
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const p = path.getPointAtLength((reverse ? 1 - e : e) * len);
          dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
          if (t < 1) requestAnimationFrame(f);
          else { dot.remove(); path.classList.remove('is-hot'); resolve(); }
        };
        requestAnimationFrame(f);
      });
    }

    const flash = (id, cls, ms = 700) => {
      const n = nodes[id];
      n.classList.add(cls);
      setTimeout(() => n.classList.remove(cls), ms);
    };

    async function send(client) {
      if (busy) return;
      busy = true;
      buttons.forEach((b) => (b.disabled = true));
      const started = performance.now();
      const name = client === 'bad' ? 'unknown' : client;
      log([['→ ', 'acc'], [`${name.padEnd(8)} POST /mcp  tools/call`]]);
      flash(client, 'is-hot', 900);
      await travel(edges[client], '');
      nodes.gw.classList.add('is-hot');

      if (client === 'bad') {
        flash('auth', 'is-err', 1200);
        log([['✕ ', 'err'], ['401 Unauthorized', 'err'], ['  missing bearer token']]);
        await sleep(250);
        await travel(edges[client], 'packet--err', true, 520);
        flash(client, 'is-err', 900);
        return finish();
      }

      flash('auth', 'is-ok', 900);
      log([['  auth     ', 'muted'], ['token ok', 'ok'], ['  client_id resolved via CIMD']]);
      await sleep(280);
      flash('authz', 'is-ok', 900);
      await sleep(220);

      if (credits <= 0) {
        flash('credits', 'is-err', 1200);
        log([['✕ ', 'err'], ['402 Payment Required', 'err'], ['  out of credits']]);
        await sleep(250);
        await travel(edges[client], 'packet--err', true, 520);
        log([['  billing  ', 'muted'], [`demo account topped up → ${START_CREDITS}`]]);
        credits = START_CREDITS;
        creditsEl.textContent = credits;
        return finish();
      }

      credits--;
      creditsEl.textContent = credits;
      flash('credits', 'is-ok', 900);
      log([['  credits  ', 'muted'], [`−1 · ${credits} left`]]);
      await sleep(220);
      const k = Math.floor(Math.random() * 5);
      flash('router', 'is-ok', 900);
      log([['  route    ', 'muted'], [`→ server-0${k + 1}`, 'acc']]);
      await travel(edges[`s${k}`], '');
      flash(`s${k}`, 'is-hot', 900);
      await sleep(320);
      await travel(edges[`s${k}`], 'packet--back', true);
      await travel(edges[client], 'packet--back', true);
      flash(client, 'is-hot', 700);
      const ms = Math.round(performance.now() - started);
      log([['← ', 'ok'], ['200 OK', 'ok'], [`  ${ms}ms`]]);
      finish();
    }

    function finish() {
      nodes.gw.classList.remove('is-hot');
      busy = false;
      buttons.forEach((b) => (b.disabled = false));
    }

    buttons.forEach((b) => b.addEventListener('click', () => { lastUser = performance.now(); send(b.dataset.send); }));

    creditsEl.textContent = credits;
    build();
    let lastWide = root.clientWidth >= 540;
    new ResizeObserver(() => {
      const wide = root.clientWidth >= 540;
      if (wide !== lastWide && !busy) { lastWide = wide; build(); }
    }).observe(root);

    log([['# ', 'muted'], ['click a button to send a request through the gateway', 'muted']]);

    if (reduced) return;
    const script = ['claude', 'cursor', 'claude', 'bad', 'cursor'];
    let n = 0, visible = false;
    onVisible(root, (v) => (visible = v));
    setInterval(() => {
      if (!visible || busy || document.hidden || performance.now() - lastUser < 9000) return;
      send(script[n++ % script.length]);
    }, 3400);
  })();

  /* ═════════════════════════ DEMO 3 · WhatsApp bot ═════════════════════════ */

  (function chat() {
    const root = $('[data-chat]');
    if (!root) return;
    const body = $('[data-chat-body]', root);
    const status = $('[data-typing]', root);

    const SCRIPT = [
      ['out', 'Hi, I need to check my account'],
      ['in', "Hi! Before I pull anything up, I need to verify it's you. What's your registered phone number?"],
      ['out', '+92 3•• ••• ••47'],
      ['in', "Thanks, you're verified ✓\nWhat would you like to do?\n1 · Account details\n2 · File a complaint"],
      ['out', '1'],
      ['card', 'ACCOUNT · live from Airtable\nStatus      <b>Active</b>\nOpen items  <b>0</b>\nUpdated     <b>just now</b>'],
      ['out', '2, the lift in my block is down again'],
      ['in', "Sorry about that. I've filed it as complaint #1042 and notified the team. You'll get updates right here."],
    ];

    function bubble(kind, text) {
      const b = document.createElement('div');
      b.className = `bubble bubble--${kind === 'card' ? 'in bubble--card' : kind}`;
      if (kind === 'card') {
        // trusted static markup from SCRIPT above
        b.innerHTML = text.replace(/\n/g, '<br>').replace(/ {2,}/g, (m) => '&nbsp;'.repeat(m.length));
      } else {
        b.style.whiteSpace = 'pre-line';
        b.textContent = text;
      }
      body.append(b);
      // drop bubbles that have scrolled off the top of the window
      while (body.children.length > 1 && body.firstElementChild.offsetTop < 0) body.firstElementChild.remove();
      return b;
    }

    if (reduced) {
      SCRIPT.slice(-5).forEach(([k, t]) => bubble(k, t));
      return;
    }

    let visible = false, playing = false;
    async function play() {
      playing = true;
      while (true) {
        body.innerHTML = '';
        for (const [kind, text] of SCRIPT) {
          while (!visible || document.hidden) await sleep(300);
          if (kind === 'out') {
            await sleep(1100);
            bubble(kind, text);
          } else {
            await sleep(500);
            status.textContent = 'typing…';
            const t = document.createElement('div');
            t.className = 'bubble bubble--in bubble--typing';
            t.innerHTML = '<i></i><i></i><i></i>';
            body.append(t);
            await sleep(900 + text.length * 8);
            t.remove();
            status.textContent = 'online';
            bubble(kind, text);
          }
        }
        await sleep(4500);
      }
    }
    onVisible(root, (v) => {
      visible = v;
      if (v && !playing) play();
    });
  })();
})();
