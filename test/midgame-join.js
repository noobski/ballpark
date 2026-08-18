// A 4th player joins while a game is in progress: they get the live screen,
// appear in standings with 0, and score in later rounds.
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const emitAck = (s, e, p) => new Promise((r) => s.emit(e, p, r));
const once = (s, e) => new Promise((r) => s.once(e, r));
let failures = 0;
const check = (c, m) => { if (c) console.log(` ✔ ${m}`); else { failures++; console.error(` ✘ FAIL: ${m}`); } };

(async () => {
  const mk = () => io(URL, { transports: ['websocket'] });
  const a = mk(), b = mk(), late = mk();
  const created = await emitAck(a, 'create_game', { nick: 'Host' });
  await emitAck(b, 'join_game', { code: created.code, nick: 'Second' });

  let startP = Promise.all([once(a, 'round_start'), once(b, 'round_start')]);
  await emitAck(a, 'start_game', {});
  await startP;

  // Round 1 in progress: late player joins now
  const lateRound = once(late, 'round_start');
  const j = await emitAck(late, 'join_game', { code: created.code, nick: 'Latecomer' });
  check(j.ok && j.inProgress === true, 'late join accepted with inProgress=true');
  const rs = await lateRound;
  check(rs.round === 1 && rs.question, 'late player received the live round_start (round 1)');

  // Everyone answers round 1 (including late player) -> early end
  const resP = once(a, 'round_results');
  await emitAck(a, 'submit_answer', { value: 1 });
  await emitAck(b, 'submit_answer', { value: 2 });
  await emitAck(late, 'submit_answer', { value: 3 });
  const res = await resP;
  check(res.results.length === 3, 'round results include the late player');
  check(res.standings.some((s) => s.nick === 'Latecomer'), 'standings include the late player');

  // Joining a finished game must be refused: play remaining 9 rounds fast, then try
  for (let r = 2; r <= 10; r++) {
    startP = once(a, 'round_start');
    await emitAck(a, 'next_round', {});
    await startP;
    const rp = once(a, 'round_results');
    await emitAck(a, 'submit_answer', { value: 1 });
    await emitAck(b, 'submit_answer', { value: 2 });
    await emitAck(late, 'submit_answer', { value: 3 });
    await rp;
  }
  const tooLate = mk();
  const j2 = await emitAck(tooLate, 'join_game', { code: created.code, nick: 'WayTooLate' });
  check(!j2.ok, 'joining a finished game is refused');

  console.log(failures === 0 ? '🎉 MIDGAME JOIN TEST PASSED' : `❌ ${failures} FAILURES`);
  [a, b, late, tooLate].forEach((s) => s.close());
  process.exit(failures ? 1 : 0);
})();
