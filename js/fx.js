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

function tone(freq, start, dur, type = 'sine', vol = 0.15) {
  const c = audio();
  if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
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
  milestone() { for (let i = 0; i < 6; i++) tone(note(i + 3), i * 0.06, 0.22, 'triangle', 0.14); },
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

export function shake(el) {
  el.animate([0, -9, 9, -6, 6, 0].map(x => ({ transform: `translateX(${x}px)` })), { duration: 320 });
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
  }
  setTimeout(() => pop(to, 1.25), 650);
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
