// A host creates a game, changes their mind, and backs out to the main menu:
// the seat is freed immediately, the host baton passes to whoever is left, the
// device is NOT auto-rejoined, and an emptied lobby disappears.
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const emitAck = (s, e, p) => new Promise((r) => s.emit(e, p, r));
const once = (s, e) => new Promise((r) => s.once(e, r));
// Waits for the first event matching `pred` — lobby_update also fires on join,
// so we can't just take the next one.
const onceMatching = (s, e, pred, ms = 3000) => new Promise((resolve, reject) => {
  const t = setTimeout(() => { s.off(e, h); reject(new Error(`timed out waiting for ${e}`)); }, ms);
  const h = (payload) => { if (!pred(payload)) return; clearTimeout(t); s.off(e, h); resolve(payload); };
  s.on(e, h);
});
let failures = 0;
const check = (c, m) => { if (c) console.log(` ✔ ${m}`); else { failures++; console.error(` ✘ FAIL: ${m}`); } };

(async () => {
  const mk = () => io(URL, { transports: ['websocket'] });
  const host = mk(), stayer = mk(), other = mk(), solo = mk();
  // Unique per run: find_my_game scans every live game on the server, and a
  // long-lived test server still holds games from earlier runs.
  const run = Math.random().toString(36).slice(2, 8);
  const hostKey = `key-host-${run}`;

  // ---- Host creates a game, someone joins, then the host backs out ----
  const created = await emitAck(host, 'create_game', { nick: 'Regretful Host', key: hostKey });
  await emitAck(stayer, 'join_game', { code: created.code, nick: 'Stayer', key: `key-stayer-${run}` });

  const lobbyAfterLeave = onceMatching(stayer, 'lobby_update',
    (l) => !l.players.some((p) => p.nick === 'Regretful Host'));
  const left = await emitAck(host, 'leave_game', {});
  check(left && left.ok, 'leave_game acknowledged');

  const lobby = await lobbyAfterLeave;
  check(lobby.players.length === 1, `only the remaining player is left (got ${lobby.players.length})`);
  check(!lobby.players.some((p) => p.nick === 'Regretful Host'), 'the leaver is gone from the lobby');
  check(lobby.players[0].isHost, 'host baton passed to the remaining player');

  // ---- The seat is freed now, not after a grace period: no auto-rejoin ----
  const mine = await emitAck(host, 'find_my_game', { key: hostKey });
  check(!mine.ok, 'find_my_game no longer pulls the device back into the game it left');

  // ---- ...and they can go join a different host's game instead ----
  const otherGame = await emitAck(other, 'create_game', { nick: 'Other Host', key: `key-other-${run}` });
  const joined = await emitAck(host, 'join_game', { code: otherGame.code, nick: 'Regretful Host', key: hostKey });
  check(joined.ok, 'the leaver can join a different game');
  check(joined.isHost === false, 'they join as a regular player, not host');
  check(joined.lobby.players.length === 2, 'the other game sees both players');

  // ---- Last player out closes the room ----
  const abandoned = await emitAck(solo, 'create_game', { nick: 'Lonely', key: `key-solo-${run}` });
  await emitAck(solo, 'leave_game', {});
  const ghost = await emitAck(mk(), 'join_game', { code: abandoned.code, nick: 'Ghost', key: `key-ghost-${run}` });
  check(!ghost.ok, 'an emptied lobby is deleted (code no longer joinable)');

  // ---- Leaving twice / leaving nothing is harmless ----
  const again = await emitAck(solo, 'leave_game', {});
  check(again && again.ok, 'leaving again is a no-op, not an error');

  console.log(failures === 0 ? '🎉 LEAVE LOBBY TEST PASSED' : `❌ ${failures} FAILURES`);
  [host, stayer, other, solo].forEach((s) => s.close());
  process.exit(failures ? 1 : 0);
})();
