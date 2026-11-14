// Game state and rules. No DOM code here.
import { STAGES, UPGRADES, ACHIEVEMENTS } from './data.js';

const KEY = 'mathClicker.v1';

// Fields that reset on every run.
const runFields = () => ({
  coins: 0, levels: { tap: 0, bonus: 0, auto: 0, fuel: 0 },
  stage: 0, streak: 0, fuel: 0, time: 0, won: false,
});
// Fields that are kept forever.
const keepFields = () => ({
  stars: 0, bestTimes: {}, stats: {}, right: 0, wrong: 0, taps: 0,
  bestStreak: 0, bossPerfect: false, ach: [], daily: null, dailyBest: 0, sound: true,
});

function load() {
  const base = { ...runFields(), ...keepFields() };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || {};
    return { ...base, ...saved, levels: { ...base.levels, ...saved.levels } };
  } catch { return base; }
}

export const s = load();
export const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage off */ } };

// ---- Derived values ----
const BASE_MATH = 60; // one right answer = 60 taps, so maths always beats tapping
export const perTap = () => Math.ceil(1.5 ** s.levels.tap) * (1 + s.stars);
export const streakMult = (streak = s.streak) => Math.min(5, 1 + Math.floor(streak / 5));
export const mathReward = (streak = s.streak) => perTap() * (BASE_MATH + 15 * s.levels.bonus) * streakMult(streak);
export const autoPerSec = () => 0.25 * s.levels.auto * perTap();
export const maxFuel = () => 20 + 5 * s.levels.fuel;
export const fuelPerAnswer = () => 3 + s.levels.fuel;
export const stageCost = () => STAGES[s.stage].cost * 3 ** s.stars;
export const upgradeCost = u => Math.round(u.base * u.growth ** s.levels[u.id]);
export const bossTime = () => Math.max(25, 60 - 8 * s.stars);
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
export const dailyDone = () => s.daily && s.daily.date === today();

// ---- Times table stats ----
export const tables = () => [2, 3, 4, 5, 6, 7, 8, 9];
export const cell = (a, b) => s.stats[`${a}x${b}`] || [0, 0];
export function tableStats(n) {
  let right = 0, wrong = 0;
  for (const m of tables()) {
    const [r1, w1] = cell(n, m); right += r1; wrong += w1;
    if (m !== n) { const [r2, w2] = cell(m, n); right += r2; wrong += w2; }
  }
  const total = right + wrong;
  return { right, wrong, total, mastered: total >= 20 && right / total >= 0.9 };
}

// ---- Questions: tables answered wrong come up more often ----
export let q = null;
export function nextQuestion() {
  const list = []; let total = 0;
  for (const a of tables()) for (const b of tables()) {
    if (q && q.a === a && q.b === b) continue;
    const [r, w] = cell(a, b);
    const weight = Math.min(8, Math.max(0.25, 1 + 2 * w - 0.25 * r));
    list.push([a, b, weight]); total += weight;
  }
  let pick = Math.random() * total;
  for (const [a, b, weight] of list) {
    pick -= weight;
    if (pick <= 0) { q = { a, b }; return; }
  }
  q = { a: list[0][0], b: list[0][1] };
}
nextQuestion();

// ---- Quiz rounds: boss (timed, 10 right answers) and daily (20 questions) ----
export let quiz = null;
export function startBoss() {
  if (quiz || s.won || s.coins < stageCost()) return;
  quiz = { type: 'boss', total: 10, done: 0, mistakes: 0, timeLeft: bossTime(), maxTime: bossTime() };
  nextQuestion();
}
export function startDaily() {
  if (quiz || dailyDone()) return;
  quiz = { type: 'daily', total: 20, done: 0, right: 0, elapsed: 0 };
  nextQuestion();
}

function endQuiz(success) {
  const z = quiz; quiz = null;
  if (z.type === 'boss') {
    const end = { type: 'boss', success, name: STAGES[s.stage].name, won: false };
    if (success) {
      s.coins -= stageCost();
      s.stage++;
      if (z.mistakes === 0) s.bossPerfect = true;
      if (s.stage >= STAGES.length) {
        s.won = end.won = true;
        const best = s.bestTimes[s.stars];
        if (!best || s.time < best) s.bestTimes[s.stars] = s.time;
      }
    }
    save();
    return end;
  }
  const reward = z.right * perTap() * 50;
  s.coins += reward;
  s.daily = { date: today(), right: z.right, time: z.elapsed };
  s.dailyBest = Math.max(s.dailyBest, z.right);
  save();
  return { type: 'daily', right: z.right, total: z.total, time: z.elapsed, reward };
}

// ---- Actions ----
export function tap() {
  if (quiz || s.won) return 0;
  s.taps++;
  s.coins += perTap();
  return perTap();
}

export function answer(n) {
  const { a, b } = q;
  const ok = n === a * b;
  const st = s.stats[`${a}x${b}`] ||= [0, 0];
  st[ok ? 0 : 1]++;
  if (ok) s.right++; else s.wrong++;
  const res = { ok, a, b, reward: 0, end: null };
  if (quiz && quiz.type === 'boss') {
    if (ok) quiz.done++; else { quiz.mistakes++; quiz.timeLeft -= 3; }
    if (quiz.done >= quiz.total) res.end = endQuiz(true);
    else if (quiz.timeLeft <= 0) res.end = endQuiz(false);
  } else if (quiz) {
    quiz.done++;
    if (ok) quiz.right++;
    if (quiz.done >= quiz.total) res.end = endQuiz(true);
  } else if (ok) {
    s.streak++;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    res.reward = mathReward();
    s.coins += res.reward;
    s.fuel = Math.min(maxFuel(), s.fuel + fuelPerAnswer());
  } else {
    s.streak = 0;
  }
  nextQuestion();
  return res;
}

export function buy(id) {
  const u = UPGRADES.find(x => x.id === id);
  const cost = upgradeCost(u);
  if (quiz || s.coins < cost) return false;
  s.coins -= cost;
  s.levels[id]++;
  return true;
}

// dt in seconds. Returns a quiz result if the boss timer ran out.
export function tick(dt) {
  dt = Math.min(dt, 1);
  if (!s.won) s.time += dt;
  if (quiz) {
    if (quiz.type === 'boss') {
      quiz.timeLeft -= dt;
      if (quiz.timeLeft <= 0) return endQuiz(false);
    } else quiz.elapsed += dt;
  } else if (!s.won && s.levels.auto > 0 && s.fuel > 0) {
    s.coins += autoPerSec() * dt;
    s.fuel = Math.max(0, s.fuel - dt);
  }
  return null;
}

// Start the next, harder flight after reaching the Moon.
export function prestige() {
  if (!s.won) return;
  s.stars++;
  Object.assign(s, runFields());
  save();
}
export function restartRun() {
  quiz = null;
  Object.assign(s, runFields());
  save();
}

export function newAchievements() {
  const h = { tables, tableStats };
  const fresh = ACHIEVEMENTS.filter(a => !s.ach.includes(a.id) && a.test(s, h));
  fresh.forEach(a => s.ach.push(a.id));
  return fresh;
}
