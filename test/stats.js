// Lifetime usage counter: /api/stats reflects games started and unique
// device keys seen, and (checked separately, by restarting the server in
// dev) survives a restart via stats.json.
const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';
const emitAck = (s, e, p) => new Promise((r) => s.emit(e, p, r));
const once = (s, e) => new Promise((r) => s.once(e, r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (c, m) => { if (c) console.log(` ✔ ${m}`); else { failures++; console.error(` ✘ FAIL: ${m}`); } };
const mk = () => io(URL, { transports: ['websocket'] });

(async () => {
  const before = await fetch(URL + '/api/stats').then((r) => r.json());
  check(typeof before.gamesPlayed === 'number', `/api/stats returns a numeric gamesPlayed (${before.gamesPlayed})`);
  check(typeof before.uniquePlayers === 'number', `/api/stats returns a numeric uniquePlayers (${before.uniquePlayers})`);
  check(typeof before.since === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(before.since), `/api/stats returns a YYYY-MM-DD since (${before.since})`);

  const keyA = 'statstestA' + Date.now();
  const keyB = 'statstestB' + Date.now();
  const a = mk(), b = mk();
  const g = await emitAck(a, 'create_game', { nick: 'SA', key: keyA });
  await emitAck(b, 'join_game', { code: g.code, nick: 'SB', key: keyB });
  await emitAck(a, 'start_game', {});
  await once(a, 'round_start');
  [a, b].forEach((s) => s.close());
  await sleep(1300); // debounced disk persist, but /api/stats reads in-memory so this is just settle time

  const after = await fetch(URL + '/api/stats').then((r) => r.json());
  check(after.gamesPlayed === before.gamesPlayed + 1, `gamesPlayed incremented by 1 (${before.gamesPlayed} -> ${after.gamesPlayed})`);
  check(after.uniquePlayers === before.uniquePlayers + 2, `uniquePlayers grew by 2 new device keys (${before.uniquePlayers} -> ${after.uniquePlayers})`);

  // Re-joining with the same key should NOT count as a new unique player
  const a2 = mk();
  const g2 = await emitAck(a2, 'create_game', { nick: 'SA', key: keyA });
  await emitAck(a2, 'start_game', {});
  await once(a2, 'round_start');
  a2.close();
  await sleep(300);
  const after2 = await fetch(URL + '/api/stats').then((r) => r.json());
  check(after2.uniquePlayers === after.uniquePlayers, `reusing a known key doesn't inflate uniquePlayers (stayed ${after2.uniquePlayers})`);
  check(after2.gamesPlayed === after.gamesPlayed + 1, `a second game start increments gamesPlayed again (${after.gamesPlayed} -> ${after2.gamesPlayed})`);

  console.log(failures === 0 ? '🎉 STATS TEST PASSED' : `❌ ${failures} FAILURES`);
  process.exit(failures ? 1 : 0);
})();
