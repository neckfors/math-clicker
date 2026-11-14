# Math Clicker

A clicker game where multiplication is the fastest way to get rich. Tap the rocket for coins, solve
times tables (2–9) for big bonuses, buy upgrades and build a rocket to the Moon.

## How to play

- **Tap** the rocket to earn coins.
- **Answer** the multiplication question with the number pad. Correct answers give a big coin bonus
  and build a streak (x2 at 5 in a row, up to x5 at 20). A wrong answer resets the streak and shows
  the right answer.
- **Upgrades**: stronger taps, a bigger maths bonus, robot helpers that tap for you, and a bigger
  fuel tank. Robots only run on fuel, and fuel only comes from correct answers (a few seconds each,
  so maths stays the main way to earn). Once you own a robot, a fuel tank gauge appears above the answer
  pad, the answer card shows "+Ns ⛽", and the gauge flashes when a right answer refuels it. One right answer is worth 60+ taps and robots give only a quarter-tap per second per level, so solving maths always beats tapping.
- **Goal**: build 7 rocket parts. Each part costs coins and a **boss round**: 10 correct answers
  before the timer runs out (a wrong answer costs 3 seconds). A boss (7 different ones, cooler each
  level) flies towards your rocket; every right answer shoots it, and the last one blows it up.
  You keep your coins if you fail. Built parts click into place with an animation. The background
  has a moving star field.
- **Replay**: reaching the Moon gives a star. Each star makes coins worth more, the next rocket
  more expensive and boss rounds shorter. Best time is saved per star level.
- **Daily challenge**: 20 questions, one try per day, coins for every correct answer. Sparkles and coins on every answer, "go" sound, combo banners every 5 in a row, and a confetti finish (extra big for 20 of 20).
- **Stats**: a times-table grid shows which questions you know and which to practise. Questions you
  get wrong come up more often. 15 achievements to collect.

- **Sounds and effects**: a chime that climbs with your streak, flying coins, a bonus banner and
  vibration. Turn them off under Stats → Settings.

Progress is saved on the device.

## Play

https://neckfors.github.io/math-clicker/

On an Android phone, open the link in Chrome and choose "Add to Home screen" to install it.

## Run it locally

It is a plain web app with no build step. Serve the folder and open it in a browser:

```
py -3 -m http.server 8757
```

Then open http://localhost:8757.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | Page layout and looks |
| `js/data.js` | Rocket stages, upgrades, achievements (tune prices here) |
| `js/game.js` | Game rules and saving |
| `js/ui.js` | Screens, input, game loop |
| `js/fx.js` | Sounds, vibration, coins, explosions and other effects |
| `js/stars.js` | Animated star field in the background |
| `js/update.js`, `sw.js` | Offline support and the "New version available" bar |

When releasing a change, bump `VERSION` in `sw.js`. The version is shown under Stats → About.

## Support

If you like the app, you can support the author on [PayPal](https://paypal.me/neckfors). Thank you!
