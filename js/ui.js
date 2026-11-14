// Screens, input and the game loop.
import * as G from './game.js';
import { STAGES, UPGRADES, ACHIEVEMENTS } from './data.js';
import { getVersion } from './update.js';
import * as FX from './fx.js';

const $ = id => document.getElementById(id);
const s = G.s;

const fmt = n => {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  return n.toLocaleString('en');
};
const fmtTime = sec => {
  sec = Math.floor(sec);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

// ---- Dialog and toast ----
function showDialog(title, text, buttons) {
  $('dlgTitle').textContent = title;
  $('dlgText').textContent = text;
  const box = $('dlgBtns');
  box.textContent = '';
  buttons.forEach((b, i) => {
    const el = document.createElement('button');
    el.textContent = b.label;
    if (i === 0) el.className = 'main';
    el.onclick = () => { $('dialog').hidden = true; if (b.fn) b.fn(); render(); };
    box.appendChild(el);
  });
  $('dialog').hidden = false;
}
let toastTimer;
function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3000);
}

// ---- Answer input ----
let entry = '';
let fb = null; // feedback after an answer: { ok, text, until }
const fbActive = () => fb && Date.now() < fb.until;
const locked = () => fbActive() && !fb.ok;

function press(k) {
  if (locked() || !$('dialog').hidden) return;
  if (k === 'del') entry = entry.slice(0, -1);
  else if (k === 'ok') return submit();
  else if (entry.length < 3) entry += k;
  renderQuestion();
}

function submit() {
  if (!entry) return;
  const wasQuiz = !!G.quiz, multBefore = G.streakMult();
  const res = G.answer(Number(entry));
  entry = '';
  if (res.ok) {
    FX.sfx.correct(wasQuiz ? (G.quiz ? G.quiz.done : 10) : s.streak);
    FX.pop($('mathCard'));
    FX.buzz(15);
    if (res.reward) FX.coinBurst($('qEntry'), $('coins'), 4 + 2 * G.streakMult());
    if (!wasQuiz && G.streakMult() > multBefore) {
      FX.sfx.milestone();
      FX.banner(`🔥 Bonus x${G.streakMult()}!`);
    }
  } else {
    FX.sfx.wrong();
    FX.shake($('mathCard'));
    FX.buzz([60, 40, 60]);
  }
  fb = res.ok
    ? { ok: true, text: res.reward ? `+${fmt(res.reward)} 🪙` : 'Correct!', until: Date.now() + 700 }
    : { ok: false, text: `${res.a} × ${res.b} = ${res.a * res.b}`, until: Date.now() + (wasQuiz ? 900 : 1500) };
  if (res.end) onQuizEnd(res.end);
  render();
}

function renderQuestion() {
  const active = fbActive();
  const card = $('mathCard');
  card.classList.toggle('good', !!active && fb.ok);
  card.classList.toggle('bad', !!active && !fb.ok);
  if (active && !fb.ok) {
    $('qText').textContent = fb.text;
    $('qEntry').hidden = true;
    $('qReward').textContent = 'Remember it!';
    return;
  }
  $('qText').textContent = `${G.q.a} × ${G.q.b} =`;
  $('qEntry').hidden = false;
  $('qEntry').textContent = entry || '?';
  $('qReward').textContent = active ? fb.text : G.quiz ? '' : `+${fmt(G.mathReward(s.streak + 1))} 🪙`;
}

// ---- Quiz rounds ----
function askBoss() {
  const st = STAGES[s.stage];
  showDialog(`${st.icon} Boss round: ${st.name}`,
    `Answer 10 questions in ${G.bossTime()} seconds.\nA wrong answer costs 3 seconds.\nThe part costs ${fmt(G.stageCost())} coins, only if you win.`,
    [{ label: 'Start', fn: () => { G.startBoss(); entry = ''; fb = null; setView('play'); } }, { label: 'Not yet' }]);
}

function askDaily() {
  showDialog('📅 Daily challenge',
    '20 questions, one try per day.\nEvery correct answer gives coins.',
    [{ label: 'Start', fn: () => { G.startDaily(); entry = ''; fb = null; setView('play'); } }, { label: 'Not yet' }]);
}

function showWin() {
  const best = s.bestTimes[s.stars];
  showDialog('🌙 You reached the Moon!',
    `Time: ${fmtTime(s.time)}\nBest time on this level: ${fmtTime(best ?? s.time)}\n\nYou earn a star ⭐. Coins are worth more with every star, but the next rocket costs more and boss rounds are shorter.`,
    [{ label: 'Fly again', fn: () => { G.prestige(); entry = ''; } }]);
}

function onQuizEnd(end) {
  if (end.won) FX.sfx.win();
  else if (end.type === 'daily' || end.success) FX.sfx.fanfare();
  else FX.sfx.wrong();
  if (end.type === 'daily') {
    showDialog('📅 Daily challenge done',
      `${end.right} of ${end.total} correct in ${fmtTime(end.time)}.\nReward: +${fmt(end.reward)} 🪙`, [{ label: 'OK' }]);
  } else if (end.won) {
    showWin();
  } else if (end.success) {
    const next = STAGES[s.stage];
    showDialog(`🎉 ${end.name} built!`, `Next part: ${next.icon} ${next.name}`, [{ label: 'Continue' }]);
  } else {
    showDialog('⏱ Out of time!', 'You keep your coins.\nPractise a little and try again.', [{ label: 'OK' }]);
  }
}

// ---- Views ----
let view = 'play';
function setView(v) {
  view = v;
  for (const name of ['play', 'upgrades', 'stats']) $('v-' + name).hidden = name !== v;
  for (const b of $('tabs').children) b.classList.toggle('on', b.dataset.v === v);
  if (v === 'stats') renderStats();
  render();
}

const upRows = {};
function buildUpgrades() {
  for (const u of UPGRADES) {
    const row = document.createElement('button');
    row.className = 'up';
    row.innerHTML = `<span class="ico">${u.icon}</span>
      <span class="info"><b>${u.name} <i data-f="lvl"></i></b><small>${u.desc}</small><small data-f="now"></small></span>
      <span class="cost" data-f="cost"></span>`;
    row.onclick = () => { if (G.buy(u.id)) { FX.sfx.buy(); FX.pop(row, 1.03); render(); } };
    $('upList').appendChild(row);
    upRows[u.id] = row;
  }
}
const upNow = {
  tap: () => `Now: ${fmt(G.perTap())} coins per tap`,
  bonus: () => `Now: one answer = ${20 + 5 * s.levels.bonus} taps`,
  auto: () => `Now: ${s.levels.auto} taps per second`,
  fuel: () => `Now: +${G.fuelPerAnswer()}s per answer, tank ${G.maxFuel()}s`,
};
function renderUpgrades() {
  for (const u of UPGRADES) {
    const row = upRows[u.id], cost = G.upgradeCost(u);
    row.classList.toggle('poor', s.coins < cost);
    row.querySelector('[data-f=lvl]').textContent = `level ${s.levels[u.id]}`;
    row.querySelector('[data-f=now]').textContent = upNow[u.id]();
    row.querySelector('[data-f=cost]').textContent = `🪙 ${fmt(cost)}`;
  }
}

function renderStats() {
  const total = s.right + s.wrong;
  const best = Object.entries(s.bestTimes).map(([lvl, t]) => `⭐${lvl}: ${fmtTime(t)}`).join(' · ') || '–';
  const items = [
    ['Correct answers', fmt(s.right)], ['Accuracy', total ? Math.round(100 * s.right / total) + '%' : '–'],
    ['Best streak', s.bestStreak], ['Taps', fmt(s.taps)],
    ['Stars', '⭐ ' + s.stars], ['This flight', fmtTime(s.time)],
    ['Best times', best],
  ];
  $('summary').innerHTML = items.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');

  const t = G.tables();
  let html = '<table><tr><th>×</th>' + t.map(n => `<th>${n}</th>`).join('') + '</tr>';
  for (const a of t) {
    html += `<tr><th>${a}</th>`;
    for (const b of t) {
      const [r, w] = G.cell(a, b), n = r + w;
      const cls = !n ? '' : r / n >= 0.9 ? 'g' : r / n >= 0.6 ? 'y' : 'r';
      html += `<td class="${cls}" title="${a} × ${b}: ${r} right, ${w} wrong"></td>`;
    }
    html += '</tr>';
  }
  $('grid').innerHTML = html + '</table>';

  const btn = $('dailyBtn');
  btn.disabled = !!G.dailyDone();
  btn.textContent = G.dailyDone()
    ? `Done today: ${s.daily.right} of 20 in ${fmtTime(s.daily.time)}. Come back tomorrow!`
    : 'Play today\'s challenge (20 questions)';

  $('achCount').textContent = `${s.ach.length} / ${ACHIEVEMENTS.length}`;
  $('achList').innerHTML = ACHIEVEMENTS.map(a =>
    `<div class="ach ${s.ach.includes(a.id) ? 'got' : ''}"><span>${a.icon}</span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`).join('');
}

// ---- Main render (cheap, runs 10 times per second) ----
function render() {
  const z = G.quiz;
  $('coins').textContent = '🪙 ' + fmt(s.coins);
  let rates = `+${fmt(G.perTap())} per tap`;
  if (s.levels.auto) {
    rates += s.fuel > 0
      ? ` · 🤖 +${fmt(G.autoPerSec())}/s · ⛽ ${Math.ceil(s.fuel)}s`
      : ' · 🤖 no fuel: answer to refuel';
  }
  $('rates').textContent = rates;
  $('streak').textContent = `🔥 ${s.streak} in a row`;
  $('mult').textContent = `bonus x${G.streakMult()}` + (s.stars ? ` · ⭐ ${s.stars}` : '');

  if (s.won) {
    $('goalText').textContent = '🌙 On the Moon!';
    $('goalBar').style.width = '100%';
    $('buildBtn').hidden = true;
  } else {
    const st = STAGES[s.stage], cost = G.stageCost();
    $('goalText').textContent = `Stage ${s.stage + 1} of ${STAGES.length}: ${st.icon} ${st.name} · ${fmt(Math.min(s.coins, cost))} / ${fmt(cost)}`;
    $('goalBar').style.width = Math.min(100, 100 * s.coins / cost) + '%';
    $('buildBtn').hidden = !!z || s.coins < cost;
  }

  $('rocket').hidden = $('tapHint').hidden = !!z;
  $('quizPanel').hidden = !z;
  $('tabs').hidden = !!z;
  if (z) {
    const boss = z.type === 'boss';
    $('quizTitle').textContent = `${boss ? 'Boss round' : 'Daily challenge'} · ${z.done} / ${z.total}`;
    $('quizTimer').textContent = boss ? '⏱ ' + Math.max(0, Math.ceil(z.timeLeft)) : '⏱ ' + fmtTime(z.elapsed);
    $('quizTimer').classList.toggle('low', boss && z.timeLeft <= 10);
  } else {
    $('tapHint').textContent = s.stage ? STAGES.slice(0, s.stage).map(x => x.icon).join(' ') : 'Tap the rocket!';
  }
  renderQuestion();
  if (view === 'upgrades') renderUpgrades();
}

// ---- Events ----
$('rocket').addEventListener('pointerdown', e => {
  const got = G.tap();
  if (!got) return;
  FX.sfx.tap();
  const el = document.createElement('span');
  el.className = 'float';
  el.textContent = '+' + fmt(got);
  el.style.left = e.clientX + 'px';
  el.style.top = e.clientY + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
  render();
});
$('pad').addEventListener('pointerdown', e => {
  const k = e.target.dataset.k;
  if (k) { e.preventDefault(); press(k); }
});
document.addEventListener('keydown', e => {
  if (view !== 'play') return;
  if (e.key >= '0' && e.key <= '9') press(e.key);
  else if (e.key === 'Backspace') press('del');
  else if (e.key === 'Enter') { e.preventDefault(); press('ok'); }
});
$('tabs').addEventListener('click', e => { if (e.target.dataset.v) setView(e.target.dataset.v); });
$('buildBtn').addEventListener('click', askBoss);
$('dailyBtn').addEventListener('click', askDaily);
$('restartBtn').addEventListener('click', () => {
  showDialog('Restart this flight?', 'Coins, upgrades and rocket parts start over.\nStars, stats and achievements are kept.',
    [{ label: 'Cancel' }, { label: 'Restart', fn: () => { G.restartRun(); setView('play'); } }]);
});
const renderSound = () => { $('soundBtn').textContent = s.sound ? '🔊 Sound and vibration: on' : '🔇 Sound and vibration: off'; };
$('soundBtn').addEventListener('click', () => {
  s.sound = !s.sound;
  G.save();
  renderSound();
  FX.sfx.buy();
});
renderSound();
document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(); });

// ---- Start ----
buildUpgrades();
render();
if (s.won) showWin();
getVersion().then(v => { $('ver').textContent = v; });

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const end = G.tick((now - last) / 1000);
  last = now;
  if (end) onQuizEnd(end);
  render();
}, 100);
setInterval(() => {
  const fresh = G.newAchievements();
  if (fresh.length) {
    toast(fresh.map(a => `${a.icon} Achievement: ${a.name}`).join('\n'));
    if (view === 'stats') renderStats();
  }
  G.save();
}, 1000);
