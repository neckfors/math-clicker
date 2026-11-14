// Static game data: rocket stages, upgrades and achievements.

export const STAGES = [
  { name: 'Launch pad', icon: '🏗️', cost: 150, boss: { name: 'Space Worm', icon: '🐛', color: '#8bd450' } },
  { name: 'Engine', icon: '🔩', cost: 800, boss: { name: 'Glitch Alien', icon: '👾', color: '#b06bff' } },
  { name: 'Fuel tank', icon: '⛽', cost: 4000, boss: { name: 'Rogue Robot', icon: '🤖', color: '#6bc8ff' } },
  { name: 'Cabin', icon: '🪟', cost: 20000, boss: { name: 'Void Ogre', icon: '👹', color: '#ff6b6b' } },
  { name: 'Wings', icon: '🪽', cost: 80000, boss: { name: 'Kraken of the Void', icon: '🐙', color: '#ff7fd0' } },
  { name: 'Booster', icon: '🔥', cost: 300000, boss: { name: 'Star Dragon', icon: '🐉', color: '#ff9a3c' } },
  { name: 'Nose cone', icon: '🔺', cost: 1000000, boss: { name: 'The Moon Titan', icon: '👁️', color: '#ffe14a' } },
];

// cost of next level = base * growth^level
export const UPGRADES = [
  { id: 'tap', icon: '👆', name: 'Stronger taps', base: 20, growth: 1.7,
    desc: 'More coins per tap. Maths rewards grow with it too.' },
  { id: 'bonus', icon: '🧠', name: 'Maths bonus', base: 50, growth: 1.8,
    desc: 'Each correct answer is worth more taps.' },
  { id: 'auto', icon: '🤖', name: 'Robot helper', base: 100, growth: 1.6,
    desc: 'Taps once per second for you, while there is fuel.' },
  { id: 'fuel', icon: '🛢️', name: 'Bigger fuel tank', base: 150, growth: 1.8,
    desc: 'A little more robot fuel per answer, and a bigger tank.' },
];

// test(s, h): s = saved state, h = helpers from game.js
export const ACHIEVEMENTS = [
  { id: 'first', icon: '✅', name: 'First answer', desc: 'Answer one question correctly', test: s => s.right >= 1 },
  { id: 's10', icon: '🔥', name: 'On fire', desc: '10 correct in a row', test: s => s.bestStreak >= 10 },
  { id: 's25', icon: '🌋', name: 'Unstoppable', desc: '25 correct in a row', test: s => s.bestStreak >= 25 },
  { id: 's50', icon: '☄️', name: 'Legend', desc: '50 correct in a row', test: s => s.bestStreak >= 50 },
  { id: 'r100', icon: '💯', name: 'Hundred', desc: '100 correct answers', test: s => s.right >= 100 },
  { id: 'r500', icon: '🎓', name: 'Professor', desc: '500 correct answers', test: s => s.right >= 500 },
  { id: 'taps', icon: '👆', name: 'Fast fingers', desc: '1,000 taps', test: s => s.taps >= 1000 },
  { id: 'up10', icon: '🛠️', name: 'Engineer', desc: 'Own 10 upgrade levels at once',
    test: s => Object.values(s.levels).reduce((a, b) => a + b, 0) >= 10 },
  { id: 'perfect', icon: '🎯', name: 'Flawless', desc: 'Win a boss round without mistakes', test: s => s.bossPerfect },
  { id: 'moon', icon: '🌙', name: 'Moon landing', desc: 'Reach the Moon', test: s => s.won || s.stars >= 1 },
  { id: 'moon3', icon: '🌟', name: 'Space veteran', desc: 'Reach the Moon 3 times', test: s => s.stars + (s.won ? 1 : 0) >= 3 },
  { id: 'table', icon: '📗', name: 'Table master', desc: 'Master one times table',
    test: (s, h) => h.tables().some(n => h.tableStats(n).mastered) },
  { id: 'tables', icon: '📚', name: 'Maths master', desc: 'Master all times tables 2–9',
    test: (s, h) => h.tables().every(n => h.tableStats(n).mastered) },
  { id: 'daily', icon: '📅', name: 'Daily player', desc: 'Finish a daily challenge', test: s => !!s.daily },
  { id: 'daily20', icon: '🏆', name: 'Perfect day', desc: '20 of 20 in a daily challenge', test: s => s.dailyBest >= 20 },
];
