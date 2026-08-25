// Ballpark — lifetime usage counter: total games played, and how many
// distinct devices/browsers have ever played (players are identified by a
// random key the client generates once and keeps in localStorage — there's
// no login system, so "unique user" here means "unique device we've seen").
//
// Persisted to disk (same best-effort pattern as asked.json/image-cache.json)
// so a server restart doesn't lose the count. Whether that file survives a
// fresh deploy depends on the host's disk setup, which this code can't know
// for certain — so `since` records the date this file was first created, and
// the client shows it ("Since Aug 25, 2026") right next to the numbers. If a
// deploy ever does wipe the disk, the count restarts at zero and `since`
// naturally moves to that day — the label stays honest either way, rather
// than silently displaying a number that may not be the true lifetime total.

const fs = require('fs');
const path = require('path');

const STATS_FILE = path.join(__dirname, 'stats.json');

let gamesPlayed = 0;
const uniqueKeys = new Set();
let since = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

try {
  const saved = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  if (saved && typeof saved === 'object') {
    gamesPlayed = Number(saved.gamesPlayed) || 0;
    (saved.uniqueKeys || []).forEach((k) => uniqueKeys.add(k));
    if (saved.since) since = saved.since;
    console.log(`Loaded lifetime stats: ${gamesPlayed} games, ${uniqueKeys.size} unique players, since ${since}`);
  }
} catch {
  console.log('No existing stats.json — starting a fresh lifetime counter');
}

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(
      STATS_FILE,
      JSON.stringify({ since, gamesPlayed, uniqueKeys: [...uniqueKeys] }),
      () => {}
    );
  }, 1000);
}

// Call once per real game start (covers both a brand-new game and a
// "play again" restart, since both go through the start_game handler).
function recordGamePlayed() {
  gamesPlayed++;
  persist();
}

// Call whenever we see a player's device key (create/join). A Set means
// re-seeing the same device is a harmless no-op — only new keys grow the count.
function recordPlayer(key) {
  if (!key) return;
  const before = uniqueKeys.size;
  uniqueKeys.add(key);
  if (uniqueKeys.size !== before) persist();
}

function getStats() {
  return { gamesPlayed, uniquePlayers: uniqueKeys.size, since };
}

module.exports = { recordGamePlayed, recordPlayer, getStats };
