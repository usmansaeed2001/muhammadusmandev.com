/* Asteroids, but the asteroids are production incidents.
   Loaded on demand from main.js; the cursor arrow becomes the ship. */

const INK = '#16150F';
const PAPER = '#EDEAE2';
const ACCENT = '#FF4D1A';
const LABELS = ['bug', '500', 'OOM', 'timeout', 'flaky test', 'null', 'deadlock', '429', 'CORS', 'N+1', 'merge conflict', 'cold start', 'memory leak', 'race condition', 'stale cache', 'disk full'];
const RADIUS = { 3: 46, 2: 28, 1: 15 };
const POINTS = { 3: 20, 2: 50, 1: 100 };
const BEST_KEY = 'mu-asteroids-best';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

let S = null;

function readBest() {
  try { return +localStorage.getItem(BEST_KEY) || 0; } catch { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* storage blocked: best score just won't persist */ }
}

export function isRunning() { return !!S; }

export function start(x, y) {
  if (S) return;
  const touch = matchMedia('(pointer: coarse)').matches;

  const canvas = document.createElement('canvas');
  canvas.className = 'game';
  canvas.setAttribute('aria-hidden', 'true');

  const hud = document.createElement('div');
  hud.className = 'game-hud mono';
  hud.innerHTML = `
    <span>Score <b data-g="score">0</b></span>
    <span>Lives <b data-g="lives"></b></span>
    <span class="game-hud__best">Best <b data-g="best">0</b></span>
    <button class="game-hud__exit" type="button" data-g="exit">Exit <kbd>Esc</kbd></button>`;

  const msg = document.createElement('div');
  msg.className = 'game-msg';
  msg.setAttribute('role', 'status');

  document.body.append(canvas, hud, msg);
  document.documentElement.classList.add('is-playing');

  const W = innerWidth, H = innerHeight;
  S = {
    canvas, hud, msg, touch,
    ctx: canvas.getContext('2d'),
    W, H, dpr: 1,
    ship: { x: x ?? W / 2, y: y ?? H / 2, a: -Math.PI / 2, thrust: false, inv: 1.5 },
    pointer: { x: x ?? W / 2, y: y ?? H / 2, down: false },
    keys: { fire: false },
    cooldown: 0,
    bullets: [], rocks: [], parts: [], pops: [],
    score: 0, lives: 3, best: readBest(),
    t: 0, spawnT: 0.4, shake: 0,
    over: false, raf: 0, last: performance.now(),
    el: {
      score: hud.querySelector('[data-g="score"]'),
      lives: hud.querySelector('[data-g="lives"]'),
      best: hud.querySelector('[data-g="best"]'),
    },
  };
  if (touch) { S.ship.x = W / 2; S.ship.y = H - 120; }

  resize();
  renderHud();
  hud.querySelector('[data-g="exit"]').addEventListener('click', stop);
  canvas.addEventListener('pointerdown', onDown);
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onUp);
  addEventListener('keydown', onKey);
  addEventListener('keyup', onKeyUp);
  addEventListener('resize', resize);

  say(
    `<h3>Production is on fire.</h3>
     <p>${touch ? 'Tap or hold to aim and fire' : 'Move to steer · click or hold to fire'} · Esc to exit</p>`,
    2800
  );
  S.raf = requestAnimationFrame(frame);
}

export function stop() {
  if (!S) return;
  cancelAnimationFrame(S.raf);
  removeEventListener('pointermove', onMove);
  removeEventListener('pointerup', onUp);
  removeEventListener('pointercancel', onUp);
  removeEventListener('keydown', onKey);
  removeEventListener('keyup', onKeyUp);
  removeEventListener('resize', resize);
  S.canvas.remove(); S.hud.remove(); S.msg.remove();
  document.documentElement.classList.remove('is-playing');
  clearTimeout(S.msgTimer);
  S = null;
}

/* ───────── input ───────── */

function onDown(e) {
  e.preventDefault();
  if (S.over) return;
  S.pointer.x = e.clientX; S.pointer.y = e.clientY;
  S.pointer.down = true;
}
function onMove(e) { S.pointer.x = e.clientX; S.pointer.y = e.clientY; }
function onUp() { S.pointer.down = false; }
function onKey(e) {
  if (e.key === 'Escape') return stop();
  if (e.code === 'Space') { e.preventDefault(); S.keys.fire = true; }
}
function onKeyUp(e) { if (e.code === 'Space') S.keys.fire = false; }

function resize() {
  const { canvas, ctx } = S;
  S.W = innerWidth; S.H = innerHeight;
  S.dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(S.W * S.dpr);
  canvas.height = Math.round(S.H * S.dpr);
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  if (S.touch) { S.ship.x = S.W / 2; S.ship.y = S.H - 120; }
}

/* ───────── messages & hud ───────── */

function say(html, ms) {
  clearTimeout(S.msgTimer);
  S.msg.innerHTML = `<div class="game-msg__inner">${html}</div>`;
  S.msg.classList.add('is-on');
  if (ms) S.msgTimer = setTimeout(() => S && S.msg.classList.remove('is-on'), ms);
}

function renderHud() {
  S.el.score.textContent = String(S.score).padStart(4, '0');
  S.el.lives.textContent = '▲'.repeat(S.lives) + '△'.repeat(3 - S.lives);
  S.el.best.textContent = String(Math.max(S.best, S.score)).padStart(4, '0');
}

function gameOver() {
  S.over = true;
  S.pointer.down = false;
  const newBest = S.score > S.best;
  if (newBest) { S.best = S.score; saveBest(S.score); }
  renderHud();
  say(
    `<h3>The incidents won this round.</h3>
     <p>Score ${S.score}${newBest ? ' · new best' : ` · best ${S.best}`}</p>
     <div class="game-msg__actions">
       <button class="btn" type="button" data-g="again">Play again</button>
       <button class="btn btn--line" type="button" data-g="quit">Back to the site</button>
     </div>`
  );
  S.msg.querySelector('[data-g="again"]').addEventListener('click', restart);
  S.msg.querySelector('[data-g="quit"]').addEventListener('click', stop);
}

function restart() {
  Object.assign(S, { bullets: [], rocks: [], parts: [], pops: [], score: 0, lives: 3, t: 0, spawnT: 0.4, over: false });
  S.ship.inv = 1.5;
  S.msg.classList.remove('is-on');
  renderHud();
}

/* ───────── world ───────── */

function makeRock(size, x, y, vx, vy) {
  const r = RADIUS[size] * (S.W < 600 ? 0.8 : 1);
  const n = 9 + Math.floor(Math.random() * 4);
  const shape = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const d = r * rand(0.78, 1.12);
    return [Math.cos(a) * d, Math.sin(a) * d];
  });
  return { size, r, x, y, vx, vy, rot: rand(0, 6.28), spin: rand(-0.8, 0.8), shape, label: size > 1 ? pick(LABELS) : '', age: 0 };
}

function spawnRock() {
  const { W, H } = S;
  const edge = Math.floor(Math.random() * 4);
  const m = 70;
  const x = edge === 0 ? -m : edge === 1 ? W + m : rand(0, W);
  const y = edge === 2 ? -m : edge === 3 ? H + m : rand(0, H);
  const tx = rand(W * 0.2, W * 0.8), ty = rand(H * 0.2, H * 0.8);
  const speed = Math.min(170, rand(45, 95) + S.t * 0.9);
  const d = Math.hypot(tx - x, ty - y);
  S.rocks.push(makeRock(3, x, y, ((tx - x) / d) * speed, ((ty - y) / d) * speed));
}

function burst(x, y, n, colors, force = 220) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(force * 0.3, force);
    S.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.4, 0.8), max: 0.8, c: pick(colors), s: rand(1.5, 3.5) });
  }
}

function breakRock(rock) {
  rock.dead = true;
  burst(rock.x, rock.y, 6 + rock.size * 5, [ACCENT, INK, ACCENT]);
  if (rock.size > 1) {
    const base = Math.atan2(rock.vy, rock.vx);
    const sp = Math.hypot(rock.vx, rock.vy) * 1.35;
    for (const dir of [-1, 1]) {
      const a = base + dir * rand(0.4, 0.9);
      S.rocks.push(makeRock(rock.size - 1, rock.x, rock.y, Math.cos(a) * sp, Math.sin(a) * sp));
    }
  }
}

/* ───────── loop ───────── */

function frame(now) {
  if (!S) return;
  const dt = Math.min(0.033, (now - S.last) / 1000);
  S.last = now;
  update(dt);
  draw();
  S.raf = requestAnimationFrame(frame);
}

function update(dt) {
  const { ship, pointer } = S;
  S.t += dt;
  S.shake = Math.max(0, S.shake - dt * 30);
  ship.inv = Math.max(0, ship.inv - dt);

  // steer
  if (!S.over) {
    if (S.touch) {
      if (pointer.down) {
        const target = Math.atan2(pointer.y - ship.y, pointer.x - ship.x);
        ship.a += angDiff(ship.a, target) * (1 - Math.exp(-dt * 20));
      }
      ship.thrust = pointer.down;
    } else {
      const k = 1 - Math.exp(-dt * 16);
      const nx = ship.x + (pointer.x - ship.x) * k;
      const ny = ship.y + (pointer.y - ship.y) * k;
      const vx = (nx - ship.x) / dt, vy = (ny - ship.y) / dt;
      ship.x = nx; ship.y = ny;
      ship.thrust = Math.hypot(vx, vy) > 70;
      if (ship.thrust) ship.a += angDiff(ship.a, Math.atan2(vy, vx)) * (1 - Math.exp(-dt * 12));
    }
  }

  // fire
  S.cooldown -= dt;
  if (!S.over && (pointer.down || S.keys.fire) && S.cooldown <= 0) {
    S.cooldown = 0.13;
    const cos = Math.cos(ship.a), sin = Math.sin(ship.a);
    S.bullets.push({ x: ship.x + cos * 20, y: ship.y + sin * 20, vx: cos * 950, vy: sin * 950, life: 0.9 });
  }

  // spawn
  S.spawnT -= dt;
  const cap = 4 + Math.floor(S.t / 18);
  if (S.spawnT <= 0 && S.rocks.filter((r) => r.size === 3).length < cap) {
    spawnRock();
    S.spawnT = Math.max(0.55, 2.2 - S.t * 0.02);
  }

  for (const b of S.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
  for (const r of S.rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.spin * dt; r.age += dt; }
  for (const p of S.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt; }
  for (const p of S.pops) { p.y -= 40 * dt; p.life -= dt; }

  // bullets × rocks
  for (const b of S.bullets) {
    if (b.life <= 0) continue;
    for (const r of S.rocks) {
      if (r.dead) continue;
      if ((b.x - r.x) ** 2 + (b.y - r.y) ** 2 < r.r * r.r) {
        b.life = 0;
        S.score += POINTS[r.size];
        S.pops.push({ x: r.x, y: r.y, text: `+${POINTS[r.size]}`, life: 0.8 });
        breakRock(r);
        renderHud();
        break;
      }
    }
  }

  // ship × rocks
  if (!S.over && ship.inv <= 0) {
    for (const r of S.rocks) {
      if (r.dead) continue;
      if (Math.hypot(ship.x - r.x, ship.y - r.y) < r.r * 0.85 + 8) {
        breakRock(r);
        burst(ship.x, ship.y, 24, [INK, ACCENT], 300);
        S.lives--;
        S.shake = 12;
        ship.inv = 2;
        renderHud();
        if (S.lives <= 0) gameOver();
        break;
      }
    }
  }

  const { W, H } = S;
  const out = (o, m) => o.x < -m || o.x > W + m || o.y < -m || o.y > H + m;
  S.bullets = S.bullets.filter((b) => b.life > 0 && !out(b, 20));
  S.rocks = S.rocks.filter((r) => !r.dead && !(r.age > 3 && out(r, 140)));
  S.parts = S.parts.filter((p) => p.life > 0);
  S.pops = S.pops.filter((p) => p.life > 0);
}

function draw() {
  const { ctx, W, H, ship } = S;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (S.shake) ctx.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));

  // incidents
  for (const r of S.rocks) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.save();
    ctx.rotate(r.rot);
    ctx.beginPath();
    r.shape.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
    if (r.label) {
      ctx.fillStyle = INK;
      ctx.font = `500 ${r.size === 3 ? 11 : 9}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.label.toUpperCase(), 0, 0, r.r * 1.6);
    }
    ctx.restore();
  }

  // bullets
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const b of S.bullets) {
    ctx.beginPath();
    ctx.moveTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // debris
  for (const p of S.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
  }
  ctx.globalAlpha = 1;

  // score pops
  ctx.font = '500 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  for (const p of S.pops) {
    ctx.globalAlpha = Math.max(0, p.life / 0.8);
    ctx.fillStyle = ACCENT;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  // the ship: a cursor arrow with an engine
  const blink = ship.inv > 0 && Math.floor(S.t * 12) % 2 === 0;
  if (!S.over && !blink) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.a + Math.PI / 2);
    ctx.scale(1.25, 1.25);
    if (ship.thrust) {
      const f = rand(10, 18);
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.moveTo(-5, 9); ctx.lineTo(0, 9 + f); ctx.lineTo(5, 9);
      ctx.closePath(); ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(11, 13); ctx.lineTo(0, 7); ctx.lineTo(-11, 13);
    ctx.closePath();
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = PAPER;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
