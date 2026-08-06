// Edge case: one player never answers -> round must end via the 20s timer,
// non-answerer gets 0 points and rank null.
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const emitAck = (s, e, p) => new Promise((r) => s.emit(e, p, r));
const once = (s, e) => new Promise((r) => s.once(e, r));

let failures = 0;
const check = (c, m) => { if (c) console.log(` ✔ ${m}`); else { failures++; console.error(` ✘ FAIL: ${m}`); } };

(async () => {
  const a = io(URL, { transports: ['websocket'] });
  const b = io(URL, { transports: ['websocket'] });
  const created = await emitAck(a, 'create_game', { nick: 'Sir Answers' });
  await emitAck(b, 'join_game', { code: created.code, nick: 'Lady Silent' });

  const startP = once(a, 'round_start');
  await emitAck(a, 'start_game', {});
  await startP;

  const t0 = Date.now();
  const resultsP = once(a, 'round_results');
  await emitAck(a, 'submit_answer', { value: 123 }); // only player A answers
  const res = await resultsP;
  const elapsed = (Date.now() - t0) / 1000;

  check(elapsed >= 19 && elapsed <= 23, `round ended via timer after ~20s (${elapsed.toFixed(1)}s)`);
  const silent = res.results.find((r) => r.nick === 'Lady Silent');
  const answerer = res.results.find((r) => r.nick === 'Sir Answers');
  check(silent.guess === null && silent.points === 0 && silent.rank === null, 'silent player: no guess, 0 pts, no rank');
  check(answerer.rank === 1 && answerer.points === 10, 'lone answerer ranked 1st with 10 pts');
  check(res.median === 123 && res.average === 123, 'avg/median from single guess');
  check(res.crowdNote === null, 'no crowd note with <2 guesses');

  console.log(failures === 0 ? '🎉 TIMEOUT TEST PASSED' : `❌ ${failures} FAILURES`);
  a.close(); b.close();
  process.exit(failures ? 1 : 0);
})();
