// (1) A player who types but never locks in gets their draft counted at time-up.
// (2) A wildly-off guess is excluded from the Average (median still uses all).
// (3) Global ledger: two separate games don't share questions.
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const emitAck = (s, e, p) => new Promise((r) => s.emit(e, p, r));
const once = (s, e) => new Promise((r) => s.once(e, r));
let failures = 0;
const check = (c, m) => { if (c) console.log(` ✔ ${m}`); else { failures++; console.error(` ✘ FAIL: ${m}`); } };
const mk = () => io(URL, { transports: ['websocket'] });

(async () => {
  const a = mk(), b = mk(), c = mk(), d = mk();
  const created = await emitAck(a, 'create_game', { nick: 'A' });
  await emitAck(b, 'join_game', { code: created.code, nick: 'B' });
  await emitAck(c, 'join_game', { code: created.code, nick: 'C' });
  await emitAck(d, 'join_game', { code: created.code, nick: 'D-outlier' });

  const startP = once(a, 'round_start');
  await emitAck(a, 'start_game', {});
  const q1 = await startP;
  const ans = 100; // we don't know the real answer; use guesses relative to each other

  // A, B lock in; C only drafts; D locks in a wild outlier
  const resP = once(a, 'round_results');
  const t0 = Date.now();
  await emitAck(a, 'submit_answer', { value: 100 });
  await emitAck(b, 'submit_answer', { value: 110 });
  c.emit('draft_answer', { value: 105 });        // typed but never locked
  await emitAck(d, 'submit_answer', { value: 1000000 });
  const res = await resP;
  const elapsed = (Date.now() - t0) / 1000;
  check(elapsed >= 19, `round ran to the timer since C never locked in (${elapsed.toFixed(1)}s)`);

  const rowC = res.results.find((r) => r.nick === 'C');
  check(rowC && rowC.guess === 105, `C's draft (105) was counted as their answer -> got ${rowC && rowC.guess}`);
  check(rowC.points > 0, 'C earned points from the draft');

  check(Array.isArray(res.excludedFromAverage) && res.excludedFromAverage.includes('D-outlier'),
    `outlier excluded from average: ${JSON.stringify(res.excludedFromAverage)}`);
  check(Math.abs(res.average - 105) < 0.01, `average of the sane guesses = 105 (got ${res.average})`);
  check(res.median === 107.5, `median still uses everyone (got ${res.median})`);

  // Global ledger: a brand-new game with different players must not repeat q1
  const e = mk(), f = mk();
  const g2 = await emitAck(e, 'create_game', { nick: 'E' });
  await emitAck(f, 'join_game', { code: g2.code, nick: 'F' });
  const seen2 = [];
  let sp = Promise.all([once(e, 'round_start'), once(f, 'round_start')]);
  await emitAck(e, 'start_game', {});
  for (let r = 1; r <= 10; r++) {
    const [rs] = await sp;
    seen2.push(rs.question);
    const rp = once(e, 'round_results');
    await emitAck(e, 'submit_answer', { value: 1 });
    await emitAck(f, 'submit_answer', { value: 2 });
    await rp;
    if (r < 10) { sp = Promise.all([once(e, 'round_start'), once(f, 'round_start')]); await emitAck(e, 'next_round', {}); }
  }
  check(!seen2.includes(q1.question), 'second (unrelated) game did not reuse a question from the first');

  console.log(failures === 0 ? '🎉 DRAFT/OUTLIER/LEDGER TEST PASSED' : `❌ ${failures} FAILURES`);
  [a, b, c, d, e, f].forEach((s) => s.close());
  process.exit(failures ? 1 : 0);
})();
