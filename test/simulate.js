// Full-game simulation: 3 players play a complete 10-round game, then play again.
// Run with the server already listening on :3000  ->  node test/simulate.js

const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';
const NICKS = ['Captain Waffles', 'Baron Pickles', 'Grandma Doom'];

function connect(nick) {
  const s = io(URL, { transports: ['websocket'] });
  s.nick = nick;
  return s;
}

function emitAck(socket, event, payload) {
  return new Promise((resolve) => socket.emit(event, payload, resolve));
}

function once(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

let failures = 0;
function check(cond, msg) {
  if (cond) console.log(`  ✔ ${msg}`);
  else { failures++; console.error(`  ✘ FAIL: ${msg}`); }
}

const allOnce = (sockets, event) => Promise.all(sockets.map((s) => once(s, event)));

// startsPromise must be created BEFORE the action that triggers round_start
// (start_game / next_round), otherwise the event can be dispatched before we subscribe.
async function playFullGame(sockets, gameNum, startsPromise) {
  console.log(`\n=== GAME ${gameNum}: playing 10 rounds ===`);
  const seenQuestions = [];
  const overPromise = once(sockets[0], 'game_over'); // subscribe early: emitted right after final round_results

  for (let r = 1; r <= 10; r++) {
    // all sockets receive round_start
    const starts = await startsPromise;
    const q = starts[0];
    check(q.round === r, `round_start says round ${q.round} (expected ${r})`);
    check(typeof q.category === 'string' && q.category.length > 0, `has category: ${q.category}`);
    check(typeof q.question === 'string' && q.question.length > 5, `has question: "${q.question.slice(0, 60)}..."`);
    check(q.seconds === 20, `timer is 20s`);
    seenQuestions.push(q.question);

    // players answer different values quickly (should trigger early round end)
    const resultsPromises = sockets.map((s) => once(s, 'round_results'));
    await emitAck(sockets[0], 'submit_answer', { value: 100 });
    await emitAck(sockets[1], 'submit_answer', { value: 5000 });
    await emitAck(sockets[2], 'submit_answer', { value: 42 });

    const results = (await Promise.all(resultsPromises))[0];
    check(typeof results.answer === 'number', `results include answer: ${results.answer}`);
    check(results.results.length === 3, `results for all 3 players`);
    const ranks = results.results.map((x) => x.rank);
    check(ranks.includes(1), `someone ranked #1`);
    const winner = results.results.find((x) => x.rank === 1);
    check(winner.points === 10, `winner got 10 points`);
    check(typeof results.average === 'number' && typeof results.median === 'number',
      `average=${results.average.toFixed(1)}, median=${results.median}`);
    check(results.standings.length === 3, `standings included`);
    check(results.isFinal === (r === 10), `isFinal=${results.isFinal} on round ${r}`);

    if (r < 10) {
      // host advances — subscribe to the next round_start BEFORE triggering it
      startsPromise = allOnce(sockets, 'round_start');
      await emitAck(sockets[0], 'next_round', {});
    }
  }

  const unique = new Set(seenQuestions);
  check(unique.size === 10, `all 10 questions unique within game (${unique.size}/10)`);

  const over = await overPromise;
  check(over.standings.length === 3, 'game_over has final standings');
  check(Array.isArray(over.history) && over.history.length === 10, 'game_over has 10-question recap');
  check(over.history.every((h) => typeof h.answer === 'number' && typeof h.average === 'number'
    && typeof h.median === 'number' && h.question && h.category && h.unit),
    'recap entries have question, category, unit, answer, avg, median');
  check(over.history.map((h) => h.question).join('|') === seenQuestions.join('|'),
    'recap questions match rounds in order');
  const scores = over.standings.map((s) => s.score);
  check(scores.every((x, i) => i === 0 || scores[i - 1] >= x), 'standings sorted descending');
  console.log('  Final standings:', over.standings.map((s) => `${s.nick}: ${s.score}`).join(' | '));
  return seenQuestions;
}

(async () => {
  console.log('=== SETUP: create + join ===');
  const [a, b, c] = NICKS.map(connect);

  const created = await emitAck(a, 'create_game', { nick: NICKS[0] });
  check(created.ok && /^[A-Z]{4}$/.test(created.code), `game created with code ${created.code}`);
  check(created.isHost, 'creator is host');

  const j1 = await emitAck(b, 'join_game', { code: created.code, nick: NICKS[1] });
  check(j1.ok, `${NICKS[1]} joined`);
  const jDup = await emitAck(c, 'join_game', { code: created.code, nick: NICKS[1] });
  check(!jDup.ok, 'duplicate nickname rejected');
  const jBad = await emitAck(c, 'join_game', { code: 'ZZZZ', nick: NICKS[2] });
  check(!jBad.ok, 'bad code rejected');
  const j2 = await emitAck(c, 'join_game', { code: created.code, nick: NICKS[2] });
  check(j2.ok, `${NICKS[2]} joined`);
  check(j2.lobby.players.length === 3, 'lobby shows 3 players');

  const notHost = await emitAck(b, 'start_game', {});
  check(!notHost.ok, 'non-host cannot start');

  let startsPromise = allOnce([a, b, c], 'round_start');
  const started = await emitAck(a, 'start_game', {});
  check(started.ok, 'host started game');

  const qs1 = await playFullGame([a, b, c], 1, startsPromise);

  console.log('\n=== PLAY AGAIN ===');
  const lobbyPromise = once(b, 'new_game_lobby');
  const again = await emitAck(a, 'play_again', {});
  check(again.ok, 'host triggered play again');
  const lobby2 = await lobbyPromise;
  check(lobby2.players.length === 3, 'same 3 players in new lobby');
  check(lobby2.players.every((p) => games2ScoreZero(p)), 'scores reset to 0');
  function games2ScoreZero(p) { return p.score === 0; }

  startsPromise = allOnce([a, b, c], 'round_start');
  const started2 = await emitAck(a, 'start_game', {});
  check(started2.ok, 'second game started');
  const qs2 = await playFullGame([a, b, c], 2, startsPromise);

  const overlap = qs2.filter((q) => qs1.includes(q));
  check(overlap.length === 0, `no repeated questions across games (overlap: ${overlap.length})`);

  console.log(`\n${failures === 0 ? '🎉 ALL TESTS PASSED' : `❌ ${failures} FAILURES`}`);
  [a, b, c].forEach((s) => s.close());
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('Test crashed:', e);
  process.exit(1);
});
