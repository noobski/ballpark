// (1) round_start carries an `image` field (may be null if unresolved, but the
//     key must be present) and it's echoed back on resume via sendCurrentScreen.
// (2) leave_game frees a lobby seat immediately (no 90s hold), hands off host
//     if the host leaves, updates the waiting-for list if someone leaves
//     mid-round, and deletes the game once everyone has left.
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const emitAck = (s, e, p) => new Promise((r) => s.emit(e, p, r));
const once = (s, e) => new Promise((r) => s.once(e, r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (c, m) => { if (c) console.log(` ✔ ${m}`); else { failures++; console.error(` ✘ FAIL: ${m}`); } };
const mk = () => io(URL, { transports: ['websocket'] });

(async () => {
  // ---- image field present on round_start ----
  const a = mk(), b = mk();
  const g1 = await emitAck(a, 'create_game', { nick: 'A' });
  await emitAck(b, 'join_game', { code: g1.code, nick: 'B' });
  let sp = once(a, 'round_start');
  await emitAck(a, 'start_game', {});
  const rs = await sp;
  check('image' in rs, `round_start includes an "image" key (value: ${rs.image === null ? 'null' : typeof rs.image})`);
  [a, b].forEach((s) => s.close());

  // ---- leave_game: lobby seat freed immediately ----
  // Every socket in the room gets each lobby_update broadcast, so rather than race
  // a fresh one-shot listener against an already-in-flight packet, keep a running
  // "latest known" lobby state per socket and settle briefly after each action.
  const h = mk(), p2 = mk(), p3 = mk();
  let lobbyOnH = null, lobbyOnP2 = null;
  h.on('lobby_update', (l) => { lobbyOnH = l; });
  p2.on('lobby_update', (l) => { lobbyOnP2 = l; });
  const g2 = await emitAck(h, 'create_game', { nick: 'Host' });
  await emitAck(p2, 'join_game', { code: g2.code, nick: 'P2' });
  await sleep(150);
  await emitAck(p3, 'join_game', { code: g2.code, nick: 'P3' });
  await sleep(150);

  await emitAck(p3, 'leave_game', {});
  await sleep(200);
  check(lobbyOnH.players.length === 2, `P3's seat freed immediately (${lobbyOnH.players.length} players left)`);
  check(!lobbyOnH.players.some((pl) => pl.nick === 'P3'), 'P3 no longer in the lobby list');

  // ---- leave_game: host handoff ----
  await emitAck(h, 'leave_game', {});
  await sleep(200);
  const newHost = lobbyOnP2.players.find((pl) => pl.isHost);
  check(newHost && newHost.nick === 'P2', `host handed off to P2 (got: ${newHost && newHost.nick})`);
  p3.close();

  // ---- leave_game: last player leaving deletes the game ----
  await emitAck(p2, 'leave_game', {});
  await sleep(100);
  const stillThere = await emitAck(mk(), 'join_game', { code: g2.code, nick: 'Ghost' });
  check(!stillThere.ok, 'game was cleaned up once everyone left it');
  [h, p2].forEach((s) => s.close());

  // ---- leave_game mid-round updates the waiting-for list ----
  const x = mk(), y = mk(), z = mk();
  const g3 = await emitAck(x, 'create_game', { nick: 'X' });
  await emitAck(y, 'join_game', { code: g3.code, nick: 'Y' });
  await emitAck(z, 'join_game', { code: g3.code, nick: 'Z' });
  sp = Promise.all([once(x, 'round_start'), once(y, 'round_start'), once(z, 'round_start')]);
  await emitAck(x, 'start_game', {});
  await sp;
  const countP = once(x, 'answer_count');
  await emitAck(z, 'leave_game', {});
  const ac = await countP;
  check(ac.total === 2, `answer_count reflects the departure mid-round (total=${ac.total})`);
  check(!(ac.waitingFor || []).includes('Z'), 'Z no longer appears in waitingFor after leaving');
  [x, y].forEach((s) => s.close());

  console.log(failures === 0 ? '🎉 LEAVE/IMAGE TEST PASSED' : `❌ ${failures} FAILURES`);
  process.exit(failures ? 1 : 0);
})();
