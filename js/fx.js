// Sounds (made with Web Audio, no sound files), vibration and visual effects.
import { s } from './game.js';

let ctx;
function audio() {
  if (!s.sound) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

// `to` slides the pitch to that frequency over the note.
function tone(freq, start, dur, type = 'sine', vol = 0.15, to = 0) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Filtered noise: crashes, thuds and clanks. The filter sweeps from `from` down to `to` Hz.
function noise(start, dur, vol = 0.2, from = 3000, to = 200) {
  const c = audio();
  if (!c) return;
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + start;
  src.buffer = buf;
  f.type = 'lowpass';
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

// Pentatonic scale from C5, so every step up sounds good.
const SCALE = [0, 2, 4, 7, 9];
const note = n => 523.25 * 2 ** ((SCALE[n % 5] + 12 * Math.floor(n / 5)) / 12);

export const sfx = {
  tap() { tone(620 + Math.random() * 120, 0, 0.06, 'triangle', 0.05); },
  // The chime climbs with the streak, so a long streak sounds better and better.
  correct(streak) {
    const n = Math.min(Math.max(streak - 1, 0), 9);
    tone(note(n), 0, 0.12, 'triangle', 0.18);
    tone(note(n + 2), 0.08, 0.3, 'triangle', 0.18);
    tone(note(n + 2) * 2, 0.08, 0.35, 'sine', 0.06);
  },
  wrong() { tone(170, 0, 0.2, 'sawtooth', 0.1); tone(120, 0.13, 0.3, 'sawtooth', 0.1); },
  buy() { tone(988, 0, 0.08, 'square', 0.07); tone(1319, 0.07, 0.25, 'square', 0.07); },
  // Liquid glugging into the tank: bubbly notes that rise.
  refuel() { for (let i = 0; i < 5; i++) tone(260 + i * 90 + Math.random() * 30, i * 0.07, 0.09, 'sine', 0.12, 420 + i * 120); noise(0, 0.4, 0.04, 900, 400); },
  coin() { const p = 1 + Math.random() * 0.15; tone(1568 * p, 0, 0.05, 'square', 0.035); tone(2093 * p, 0.04, 0.12, 'square', 0.035); },
  milestone() { for (let i = 0; i < 6; i++) tone(note(i + 3), i * 0.06, 0.22, 'triangle', 0.14); },
  laser() { tone(1100, 0, 0.14, 'square', 0.05, 280); },
  hit() { noise(0, 0.18, 0.28, 2500, 150); tone(160, 0, 0.18, 'sine', 0.3, 55); },
  roar() {
    tone(120, 0, 0.8, 'sawtooth', 0.1, 45);
    tone(127, 0, 0.8, 'sawtooth', 0.1, 48);
    noise(0, 0.6, 0.12, 900, 100);
  },
  boom() {
    noise(0, 1.1, 0.4, 3500, 80);
    tone(110, 0, 0.9, 'sine', 0.4, 28);
    noise(0.25, 0.7, 0.2, 1500, 60);
  },
  // Metal clanks, then a rising chime: a part clicks into place.
  build() {
    [0, 0.13, 0.26].forEach((d, i) => { noise(d, 0.09, 0.2, 5000, 900); tone(300 + i * 60, d, 0.1, 'square', 0.08, 150); });
    [0, 2, 4, 7, 9, 12].forEach((n, i) => tone(523.25 * 2 ** (n / 12), 0.45 + i * 0.07, 0.35, 'triangle', 0.14));
    tone(2093, 0.9, 0.7, 'sine', 0.06);
  },
  go() { [0, 4, 7, 12].forEach((n, i) => tone(392 * 2 ** (n / 12), i * 0.07, 0.18, 'square', 0.07)); noise(0, 0.25, 0.1, 4000, 600); },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'square', 0.08));
    tone(1047, 0.48, 0.7, 'triangle', 0.18);
  },
  win() {
    [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.14, 0.35, 'square', 0.08));
    tone(1568, 1.12, 1.2, 'triangle', 0.2);
    tone(1047, 1.12, 1.2, 'triangle', 0.12);
  },
};

export function buzz(pattern) {
  if (s.sound && navigator.vibrate) navigator.vibrate(pattern);
}

export function pop(el, size = 1.06) {
  el.animate([{ transform: 'scale(1)' }, { transform: `scale(${size})` }, { transform: 'scale(1)' }],
    { duration: 250, easing: 'ease-out' });
}

export function shake(el, px = 9) {
  el.animate([0, -px, px, -px * 0.7, px * 0.7, 0].map(x => ({ transform: `translateX(${x}px)` })), { duration: 320 });
}

// Whole-screen rumble for big moments.
export function rumble(el, ms = 700) {
  const f = [];
  for (let i = 0; i < 14; i++) f.push({ transform: `translate(${(Math.random() - 0.5) * 18}px, ${(Math.random() - 0.5) * 18}px)` });
  f.push({ transform: 'translate(0,0)' });
  el.animate(f, { duration: ms });
}

// Coins fly from one element to another (answer box -> coin counter).
export function coinBurst(from, to, count) {
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const x0 = a.left + a.width / 2 - 12, y0 = a.top;
  const x2 = b.left + 4, y2 = b.top + 2;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'coinfx';
    el.textContent = '🪙';
    const x1 = x0 + (Math.random() - 0.5) * 220, y1 = y0 - 60 - Math.random() * 120;
    document.body.appendChild(el);
    el.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(.4)`, opacity: 1 },
      { transform: `translate(${x1}px, ${y1}px) scale(1.3)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${x2}px, ${y2}px) scale(.6)`, opacity: 0.9 },
    ], { duration: 600 + Math.random() * 250, delay: i * 30, easing: 'ease-in-out', fill: 'both' });
    setTimeout(() => el.remove(), 900 + i * 30);
    if (i < 8) setTimeout(sfx.coin, 650 + i * 45);
  }
  setTimeout(() => pop(to, 1.25), 650);
}

// Emojis fly out in all directions from a point.
export function burst(x, y, items, count = 20, dist = 130, size = 22) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'fxp';
    el.textContent = items[i % items.length];
    el.style.fontSize = size * (0.7 + Math.random() * 0.8) + 'px';
    const ang = Math.random() * Math.PI * 2, d = dist * (0.4 + Math.random() * 0.6);
    document.body.appendChild(el);
    el.animate([
      { transform: `translate(${x}px, ${y}px) scale(.3) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${x + Math.cos(ang) * d}px, ${y + Math.sin(ang) * d + 30}px) scale(1.2) rotate(${Math.random() * 360}deg)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'both' });
    setTimeout(() => el.remove(), 1300);
  }
}

const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
export const explode = (el, items = ['💥', '🔥', '✨'], count = 28) => burst(...center(el), items, count, 150, 26);
export const sparkle = (el, count = 14) => burst(...center(el), ['✨', '⭐', '💫'], count, 90, 20);

export function flash(color = '#fff') {
  const el = document.createElement('div');
  el.className = 'flash';
  el.style.background = color;
  document.body.appendChild(el);
  el.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 450, easing: 'ease-out' });
  setTimeout(() => el.remove(), 470);
}

// A shot flies from one element to another.
export function laser(from, to, done) {
  const [x0, y0] = center(from), [x1, y1] = center(to);
  const el = document.createElement('span');
  el.className = 'fxp';
  el.textContent = '✦';
  el.style.color = '#7fe9ff';
  el.style.fontSize = '26px';
  document.body.appendChild(el);
  el.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(.6)` },
    { transform: `translate(${x1}px, ${y1}px) scale(1.4)` },
  ], { duration: 200, easing: 'ease-in', fill: 'both' });
  setTimeout(() => { el.remove(); if (done) done(); }, 200);
}

// Big text that pops up in the middle of the screen.
export function banner(text) {
  const el = document.createElement('div');
  el.className = 'banner';
  el.textContent = text;
  document.body.appendChild(el);
  el.animate([
    { transform: 'translate(-50%, -50%) scale(.3)', opacity: 0 },
    { transform: 'translate(-50%, -50%) scale(1.25)', opacity: 1, offset: 0.25 },
    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.7 },
    { transform: 'translate(-50%, -120%) scale(1)', opacity: 0 },
  ], { duration: 1200, easing: 'ease-out', fill: 'both' });
  setTimeout(() => el.remove(), 1250);
}
