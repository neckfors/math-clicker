// Animated star field behind the game: three layers drifting down, twinkling, and shooting stars.
const cv = document.getElementById('stars');
const g = cv.getContext('2d');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let w = 0, h = 0, speed = 1, target = 1;
const stars = [];
const shots = [];

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  w = innerWidth; h = innerHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  stars.length = 0;
  const n = Math.round(w * h / 5000);
  for (let i = 0; i < n; i++) {
    const layer = Math.random() < 0.6 ? 0 : Math.random() < 0.7 ? 1 : 2;
    stars.push({ x: Math.random() * w, y: Math.random() * h, layer, tw: Math.random() * 6.28,
      hue: Math.random() < 0.2 ? '#ffd9a0' : Math.random() < 0.3 ? '#a9c8ff' : '#ffffff' });
  }
}
addEventListener('resize', resize);
resize();

// 1 = calm, higher = faster flight (used during boss fights).
export const setSpeed = v => { target = v; };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  speed += (target - speed) * Math.min(1, dt * 3);
  g.clearRect(0, 0, w, h);
  for (const s of stars) {
    const v = [8, 18, 38][s.layer] * speed;
    if (!still) { s.y += v * dt; if (s.y > h) { s.y = -2; s.x = Math.random() * w; } }
    s.tw += dt * (1 + s.layer);
    const a = 0.45 + 0.45 * Math.sin(s.tw);
    const r = [0.8, 1.2, 1.8][s.layer];
    g.globalAlpha = a;
    g.fillStyle = s.hue;
    if (speed > 2.5 && s.layer > 0) g.fillRect(s.x, s.y, r, r + speed * 3); // streaks at high speed
    else g.fillRect(s.x, s.y, r, r);
  }
  if (!still && Math.random() < dt * 0.25) {
    shots.push({ x: Math.random() * w, y: Math.random() * h * 0.5, vx: -(250 + Math.random() * 200), vy: 150 + Math.random() * 120, life: 1 });
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const p = shots[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.4;
    if (p.life <= 0) { shots.splice(i, 1); continue; }
    const grad = g.createLinearGradient(p.x, p.y, p.x - p.vx * 0.25, p.y - p.vy * 0.25);
    grad.addColorStop(0, `rgba(255,255,255,${p.life})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalAlpha = 1;
    g.strokeStyle = grad; g.lineWidth = 2;
    g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.25, p.y - p.vy * 0.25); g.stroke();
  }
  g.globalAlpha = 1;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
