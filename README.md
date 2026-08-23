# Ballpark ⚾

A real-time multiplayer numeric guessing game. One player creates a game and shares a
4-letter code; everyone joins with a (suggested funny) nickname. 10 rounds of numeric
trivia — population, GDP, celebrity ages, net worths, sports records, weird facts.
Closest guess wins the round. At the end of each round you also see whether the
**crowd** (average / median of all guesses) was smarter than the individuals.

## How a game works

1. **Create** — one player clicks "Create a new game" and gets a 4-letter code
   (tap the code to copy a join link like `http://yourserver/?join=ABCD`).
2. **Join** — friends enter the code and pick a nickname (a funny one is suggested;
   hit 🎲 for another).
3. **Play** — the host starts the game. Each of the 10 rounds shows a category, a
   numeric question, a 20-second countdown, and a keypad (with ×1M / ×1B keys for
   the big numbers). The round ends early if everyone answers.
4. **Results** — after each round: the correct answer, everyone's guesses ranked by
   closeness (10 / 7 / 5 / 3 / 1 points; no answer = 0), the running standings, and
   the crowd's average & median with a note on whether the crowd beat the players.
5. **Finish** — after round 10: podium + final standings, and the host can start a
   new game with the same group (fresh questions — no repeats from the last game).

Once you lock in a guess, the keypad is replaced by a picture related to the
question (the person, place, landmark, etc. — fetched from Wikipedia) while you
wait for everyone else. Every screen has an **Exit** button that takes you
straight back to the home screen and frees your seat immediately.

## Run locally

```bash
npm install
npm start          # server on http://localhost:3000
```

Open several browser tabs (or phones on the same network via your machine's IP)
to simulate multiple players.

### Automated tests

```bash
npm start          # in one terminal
npm test           # in another — simulates 3 players playing 2 full games,
                   # plus a timeout edge-case test (~40s total)
```

## Deploy

The whole app is one Node process serving static files + websockets, so any Node
host works. It respects the `PORT` environment variable.

- **Render**: create a Web Service from this repo, build `npm install`, start `npm start`.
- **Railway / Fly.io / Heroku**: same — no config needed beyond `npm start`.
- Note: platforms with multiple instances need sticky sessions for Socket.IO
  (single instance is simplest and fine for friendly games).

## Project layout

```
server.js          # game logic: rooms, rounds, timers, scoring, crowd stats
images.js          # Wikipedia image lookup for questions, with disk cache
questions.js       # question bank (~3,000 questions, 16 categories) + picker
public/index.html  # entire client (single file: lobby, keypad, results, podium)
test/simulate.js   # 3-player full-game simulation (2 games incl. play-again)
test/timeout-test.js       # timer-expiry edge case
test/leave-and-image.js    # exit/leave-game behavior + round_start image field
```

## Tuning

Top of `server.js`:

```js
const ROUNDS_PER_GAME = 10;
const ROUND_SECONDS = 20;
const RANK_POINTS = [10, 7, 5, 3]; // 5th+ get 1 point, no answer 0
```

Add questions in `questions.js` — either `{ cat, q, a, unit }` in `STATIC` or, for
ages that stay current forever, an entry in `AGES`. Much of the bank is generated
from data tables (countries, US states, cities, city-pair distances via haversine,
birthdates, net worths), so adding one row often adds several questions.

Each game randomly draws 10 questions spread across categories, and a group that
plays consecutive games never sees a repeated question until the full bank
(~3,000) is exhausted.
