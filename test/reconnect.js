// Player drops mid-game and comes back (same device key): resumes seat, score,
// and locked answer. Also: same nickname from a NEW device can take over an
// empty seat, but NOT an occupied one.
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const emitAck = (s, e, p) => new Promise((r) => s.emit(e, p, r));
const once = (s, e) => new Promise((r) => s.once(e, r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (c, m) => { if (c) console.log(` ✔ ${m}`); else { failures++; console.error(` ✘ FAIL: ${m}`); } };
const mk = () => io(URL, { transports: ['websocket'], reconnection: false });

(async () => {
  const host = mk();
  let bob = mk();
  const created = await emitAck(host, 'create_game', { nick: 'Host', key: 'key-host' });
  await emitAck(bob, 'join_game', { code: created.code, nick: 'Bob', key: 'key-bob' });

  let sp = Promise.all([once(host, 'round_start'), once(bob, 'round_start')]);
  await emitAck(host, 'start_game', {});
  await sp;

  // Round 1: both answer; Bob locks 42
  let rp = once(host, 'round_results');
  await emitAck(host, 'submit_answer', { value: 1 });
  await emitAck(bob, 'submit_answer', { value: 42 });
  const r1 = await rp;
  const bobScore1 = r1.standings.find((s) => s.nick === 'Bob').score;
  check(bobScore1 > 0, `Bob scored ${bobScore1} in round 1`);

  // Round 2 starts; Bob locks in, then his connection DROPS
  sp = Promise.all([once(host, 'round_start'), once(bob, 'round_start')]);
  await emitAck(host, 'next_round', {});
  await sp;
  await emitAck(bob, 'submit_answer', { value: 77 });
  bob.close();
  await sleep(300);

  // Meanwhile a stranger with a different key tries "Bob" while Bob's seat is empty -> takeover allowed
  const impostor = mk();
  const imp = await emitAck(impostor, 'join_game', { code: created.code, nick: 'bob', key: 'key-stranger' });
  check(imp.ok && imp.resumed, 'same nickname on an empty seat resumes that seat (not rejected)');
  impostor.close();
  await sleep(300);

  // Real Bob comes back on a NEW socket with his device key, mid-round
  bob = mk();
  const rsP = once(bob, 'round_start');
  const back = await emitAck(bob, 'join_game', { code: created.code, nick: 'Bob', key: 'key-bob' });
  check(back.ok && back.resumed === true, 'Bob resumed with resumed=true');
  check(back.playerId === 'key-bob', 'Bob kept his stable player id');
  const rs = await rsP;
  check(rs.round === 2, 'Bob received the live round 2');
  check(rs.lockedValue === 77, `Bob's locked answer (77) was restored: ${rs.lockedValue}`);

  // Now a stranger tries "Bob" while Bob IS connected -> must be rejected
  const imp2 = mk();
  const j2 = await emitAck(imp2, 'join_game', { code: created.code, nick: 'Bob', key: 'key-other' });
  check(!j2.ok, 'duplicate nickname rejected while the real Bob is connected');
  imp2.close();

  // Finish round 2: host answers -> round ends (Bob already answered). Bob's score carries over.
  rp = once(bob, 'round_results');
  await emitAck(host, 'submit_answer', { value: 1 });
  const r2 = await rp;
  const bobRow = r2.standings.find((s) => s.nick === 'Bob');
  check(bobRow && bobRow.score >= bobScore1, `Bob's score carried across the reconnect (${bobRow && bobRow.score})`);
  check(r2.standings.length === 2, 'no duplicate Bob in standings');

  console.log(failures === 0 ? '🎉 RECONNECT TEST PASSED' : `❌ ${failures} FAILURES`);
  [host, bob].forEach((s) => s.close());
  process.exit(failures ? 1 : 0);
})();
