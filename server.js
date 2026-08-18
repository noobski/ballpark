// Ballpark — multiplayer numeric guessing game
// Node.js + Express + Socket.IO

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { pickQuestions } = require('./questions');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const ROUNDS_PER_GAME = 10;
const ROUND_SECONDS = 20;
const RESULTS_AUTO_ADVANCE_SECONDS = 20; // auto-advance if host doesn't click
const RANK_POINTS = [10, 7, 5, 3]; // 1st..4th, everyone after gets 1, no answer 0

/** games: code -> game */
const games = new Map();

// ---- Global "already asked" ledger ----
// Every question asked in ANY game is marked here; nothing repeats until the whole
// bank has been used, then the ledger resets. Persisted to disk (best-effort) so
// a server restart doesn't start repeating.
const fs = require('fs');
const { QUESTIONS } = require('./questions');
const ASKED_FILE = path.join(__dirname, 'asked.json');
const askedGlobal = new Set();
try {
  const saved = JSON.parse(fs.readFileSync(ASKED_FILE, 'utf8'));
  if (Array.isArray(saved)) saved.forEach((q) => askedGlobal.add(q));
  console.log(`Loaded ${askedGlobal.size} previously-asked questions`);
} catch { /* first run */ }
let saveTimer = null;
function saveAsked() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(ASKED_FILE, JSON.stringify([...askedGlobal]), () => {});
  }, 500);
}
function markAsked(questions) {
  questions.forEach((q) => askedGlobal.add(q.q));
  if (askedGlobal.size >= QUESTIONS.length) {
    console.log('Question bank exhausted — resetting asked ledger');
    askedGlobal.clear();
  }
  saveAsked();
}

// ---- Outlier-robust average ----
// With 3+ guesses, drop any guess wildly far from the pack (median ± 3×MAD; when
// MAD is 0, fall back to 25% of |median|). Returns {avg, used, excluded}.
function robustAverage(rows) {
  const answered = rows.filter((r) => r.guess !== null);
  if (answered.length < 3) {
    const g = answered.map((r) => r.guess);
    return { avg: g.length ? g.reduce((s, x) => s + x, 0) / g.length : null, used: answered, excluded: [] };
  }
  const guesses = answered.map((r) => r.guess);
  const med = median(guesses);
  let mad = median(guesses.map((g) => Math.abs(g - med)));
  if (mad === 0) mad = Math.abs(med) * 0.25 || 1;
  const threshold = 3 * mad;
  const used = answered.filter((r) => Math.abs(r.guess - med) <= threshold);
  const excluded = answered.filter((r) => Math.abs(r.guess - med) > threshold);
  // never exclude so many that fewer than 2 remain
  if (used.length < 2) return { avg: guesses.reduce((s, x) => s + x, 0) / guesses.length, used: answered, excluded: [] };
  const avg = used.reduce((s, r) => s + r.guess, 0) / used.length;
  return { avg, used, excluded };
}

// Real 4-letter words make codes easy to say out loud and remember
const CODE_WORDS = ('ABLE ACES AQUA ARCH ATOM BAKE BAND BARK BARN BEAM BEAN BEAR BEAT BELL BELT BEND BEST BIKE BIRD BITE ' +
  'BLUE BOAT BOLD BOLT BONE BOOK BOOM BOOT BOSS BOWL BUZZ CAFE CAKE CALM CAMP CARD CARE CART CASH CAST ' +
  'CAVE CHAT CHEF CHIN CHIP CITY CLAM CLAP CLAY CLIP CLUB CLUE COAL COAT CODE COIN COLD COMB COOK COOL ' +
  'CORD CORK CORN COZY CRAB CREW CROP CUBE CURL DART DASH DAWN DEAL DECK DEEP DEER DESK DIAL DICE DISH ' +
  'DIVE DOCK DOME DOOR DOVE DRUM DUCK DUNE DUST EARN EAST ECHO EDGE EPIC EXIT FACE FACT FAIR FARM FAST ' +
  'FERN FILM FIRE FISH FIVE FLAG FLIP FLOW FOAM FOLK FOOD FORK FORT FOUR FROG FUEL GAME GATE GEAR GIFT ' +
  'GLOW GOAL GOLD GOLF GONG GOOD GRIN GULF HAWK HERO HIKE HILL HINT HIVE HOME HOOD HOOK HOPE HORN HOST ' +
  'HOUR HUSH ICON IRIS IRON JADE JAZZ JEEP JOKE JOLT JUMP JUNE KALE KEEN KELP KILO KIND KING KITE KIWI ' +
  'KNEE KNOT LAKE LAMB LAMP LAND LARK LAVA LEAF LEAP LIME LION LOAF LOCK LOFT LOGO LOOP LUCK LUSH MAKE ' +
  'MAPS MASK MAST MATE MAZE MELT MENU MESA MILD MILE MILK MINT MOON MOSS MOTH MOVE NAVY NEAT NEON NEST ' +
  'NICE NINE NOTE NOVA OATS OBOE OKAY OPAL OPEN OVAL OVEN PAGE PALM PARK PATH PEAK PEAR PINE PING PLAY ' +
  'PLUM POEM POET POLO POND PONY POOL PORT PUMA PURE QUIZ RACE RAFT RAIN RAMP RARE RAVE REEF RICE RIDE ' +
  'RING RIPE RISE ROAD ROAR ROCK ROOF ROOM ROOT ROPE ROSE RUBY RUSH SAGE SAIL SALT SAND SEAL SEED SHIP ' +
  'SHOE SILK SING SITE SNOW SOAP SOCK SODA SOFA SOLO SONG SPIN STAR STEM SURF SWAN SWIM TACO TALE TASK ' +
  'TEAM TIDE TIME TOAD TOFU TOTE TOUR TRAM TREE TRIO TUNA TUNE TWIN VASE VIBE VINE VOTE WAVE WEST WILD ' +
  'WIND WING WINK WISE WISH WOLF WOOD WOOL YARD YARN YOGA ZERO ZEST ZINC ZOOM').split(' ');

function makeCode() {
  const free = CODE_WORDS.filter((w) => !games.has(w));
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  // fallback if (somehow) all words are in use
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  } while (games.has(code));
  return code;
}

function createGame() {
  const code = makeCode();
  const game = {
    code,
    hostId: null,
    players: new Map(), // playerId -> {id, nick, score, connected, socketId}
    state: 'lobby', // lobby | question | results | final
    round: 0,
    questions: [],
    usedQuestionTexts: new Set(),
    answers: new Map(), // playerId -> number  (locked-in answers)
    drafts: new Map(), // playerId -> number  (what they've typed so far, used if time runs out)
    crowdScore: 0, // points the crowd's average would have earned as a player
    roundHistory: [], // per-round recap: question, answer, avg, median
    roundEndsAt: null,
    roundTimer: null,
    advanceTimer: null,
    lastRoundResults: null,
    createdAt: Date.now(),
  };
  games.set(code, game);
  return game;
}

function publicPlayers(game) {
  return [...game.players.values()].map((p) => ({
    id: p.id,
    nick: p.nick,
    score: p.score,
    connected: p.connected,
    isHost: p.id === game.hostId,
  }));
}

function standings(game) {
  return [...game.players.values()]
    .map((p) => ({ id: p.id, nick: p.nick, score: p.score, connected: p.connected }))
    .sort((a, b) => b.score - a.score);
}

function lobbyState(game) {
  return { code: game.code, players: publicPlayers(game), state: game.state };
}

function emitLobby(game) {
  io.to(game.code).emit('lobby_update', lobbyState(game));
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function startRound(game) {
  clearTimeout(game.advanceTimer);
  game.round++;
  game.state = 'question';
  game.answers = new Map();
  game.drafts = new Map();
  const q = game.questions[game.round - 1];
  game.roundEndsAt = Date.now() + ROUND_SECONDS * 1000;

  io.to(game.code).emit('round_start', {
    round: game.round,
    totalRounds: ROUNDS_PER_GAME,
    category: q.cat,
    question: q.q,
    unit: q.unit,
    seconds: ROUND_SECONDS,
    endsAt: game.roundEndsAt,
  });

  clearTimeout(game.roundTimer);
  // +800ms so client auto-submits at 0s are always accepted
  game.roundTimer = setTimeout(() => endRound(game), ROUND_SECONDS * 1000 + 800);
}

function maybeEndEarly(game) {
  const connectedIds = [...game.players.values()].filter((p) => p.connected).map((p) => p.id);
  if (connectedIds.length && connectedIds.every((id) => game.answers.has(id))) {
    endRound(game);
  }
}

function endRound(game) {
  if (game.state !== 'question') return;
  clearTimeout(game.roundTimer);
  game.state = 'results';

  const q = game.questions[game.round - 1];
  const answer = q.a;

  // Time's up: anyone who typed something but didn't lock in gets their draft counted
  for (const [pid, draft] of game.drafts) {
    if (!game.answers.has(pid) && isFinite(draft)) game.answers.set(pid, draft);
  }

  // Build result rows
  const rows = [...game.players.values()].map((p) => {
    const guess = game.answers.has(p.id) ? game.answers.get(p.id) : null;
    return {
      playerId: p.id,
      nick: p.nick,
      guess,
      delta: guess === null ? null : Math.abs(guess - answer),
    };
  });

  // Rank those who answered, by distance (ties share the better rank & points)
  const answered = rows.filter((r) => r.guess !== null).sort((a, b) => a.delta - b.delta);
  let rank = 0;
  let prevDelta = null;
  answered.forEach((r, i) => {
    if (prevDelta === null || r.delta > prevDelta) rank = i + 1;
    prevDelta = r.delta;
    r.rank = rank;
    r.points = rank <= RANK_POINTS.length ? RANK_POINTS[rank - 1] : 1;
  });
  rows.forEach((r) => {
    if (r.guess === null) {
      r.rank = null;
      r.points = 0;
    }
  });

  // Apply points
  for (const r of rows) {
    const p = game.players.get(r.playerId);
    if (p) p.score += r.points;
  }

  // Crowd wisdom (average ignores wild outliers; median uses everyone)
  const guesses = answered.map((r) => r.guess);
  const ra = robustAverage(rows);
  const avg = ra.avg;
  const excludedFromAverage = ra.excluded.map((r) => r.nick);
  const med = median(guesses);

  // Score the average as a shadow player (doesn't affect real players' points)
  let crowdPoints = 0;
  let crowdRank = null;
  if (guesses.length >= 2) {
    const avgDelta = Math.abs(avg - answer);
    crowdRank = answered.filter((r) => r.delta < avgDelta).length + 1;
    crowdPoints = crowdRank <= RANK_POINTS.length ? RANK_POINTS[crowdRank - 1] : 1;
    game.crowdScore += crowdPoints;
  }
  let crowdNote = null;
  if (guesses.length >= 2) {
    const bestDelta = answered[0].delta;
    const avgDelta = Math.abs(avg - answer);
    const medDelta = Math.abs(med - answer);
    const crowdBest = Math.min(avgDelta, medDelta);
    const beaten = answered.filter((r) => r.delta > crowdBest).length;
    if (crowdBest < bestDelta) {
      crowdNote = `🧠 The crowd wins! The ${avgDelta <= medDelta ? 'average' : 'median'} beat every single player.`;
    } else if (beaten > 0) {
      crowdNote = `🧠 The crowd beat ${beaten} of ${answered.length} players — but not ${answered[0].nick}.`;
    } else {
      crowdNote = `🤷 The crowd was no smarter than any player this round.`;
    }
  }

  const sortedRows = rows.slice().sort((a, b) => {
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });

  const isFinal = game.round >= ROUNDS_PER_GAME;

  game.roundHistory.push({
    round: game.round,
    category: q.cat,
    question: q.q,
    unit: q.unit,
    answer,
    average: avg,
    median: med,
  });

  game.lastRoundResults = {
    round: game.round,
    totalRounds: ROUNDS_PER_GAME,
    category: q.cat,
    question: q.q,
    unit: q.unit,
    answer,
    results: sortedRows,
    average: avg,
    median: med,
    excludedFromAverage,
    crowdNote,
    standings: standings(game),
    crowdPoints,
    crowdRank,
    crowdScore: game.crowdScore,
    isFinal,
    autoAdvanceSeconds: isFinal ? null : RESULTS_AUTO_ADVANCE_SECONDS,
    resultsEndsAt: isFinal ? null : Date.now() + RESULTS_AUTO_ADVANCE_SECONDS * 1000,
  };

  io.to(game.code).emit('round_results', game.lastRoundResults);

  if (isFinal) {
    game.state = 'final';
    io.to(game.code).emit('game_over', {
      standings: standings(game),
      history: game.roundHistory,
      crowdScore: game.crowdScore,
      code: game.code,
    });
  } else {
    // Auto-advance in case the host walks away
    clearTimeout(game.advanceTimer);
    game.advanceTimer = setTimeout(() => {
      if (game.state === 'results') startRound(game);
    }, RESULTS_AUTO_ADVANCE_SECONDS * 1000);
  }
}

function resetForNewGame(game) {
  game.questions.forEach((q) => game.usedQuestionTexts.add(q.q));
  game.state = 'lobby';
  game.round = 0;
  game.answers = new Map();
  game.drafts = new Map();
  game.crowdScore = 0;
  game.roundHistory = [];
  game.lastRoundResults = null;
  clearTimeout(game.roundTimer);
  clearTimeout(game.advanceTimer);
  for (const p of game.players.values()) p.score = 0;
}

function sanitizeNick(nick) {
  return String(nick || '').trim().slice(0, 24) || 'Anonymous Ant';
}

io.on('connection', (socket) => {
  let myGame = null;
  let myPlayerId = null;

  socket.on('create_game', ({ nick }, cb) => {
    const game = createGame();
    const playerId = socket.id;
    const player = { id: playerId, nick: sanitizeNick(nick), score: 0, connected: true, socketId: socket.id };
    game.players.set(playerId, player);
    game.hostId = playerId;
    myGame = game;
    myPlayerId = playerId;
    socket.join(game.code);
    cb && cb({ ok: true, code: game.code, playerId, isHost: true, lobby: lobbyState(game) });
    emitLobby(game);
  });

  socket.on('join_game', ({ code, nick }, cb) => {
    const game = games.get(String(code || '').trim().toUpperCase());
    if (!game) return cb && cb({ ok: false, error: 'Game not found. Check the code!' });
    if (game.state === 'final') return cb && cb({ ok: false, error: 'This game just finished — wait for the host to start a new one.' });
    if (game.players.size >= 12) return cb && cb({ ok: false, error: 'Game is full (12 players max).' });
    const cleanNick = sanitizeNick(nick);
    if ([...game.players.values()].some((p) => p.nick.toLowerCase() === cleanNick.toLowerCase())) {
      return cb && cb({ ok: false, error: 'That nickname is taken in this game. Pick another!' });
    }
    const playerId = socket.id;
    game.players.set(playerId, { id: playerId, nick: cleanNick, score: 0, connected: true, socketId: socket.id });
    myGame = game;
    myPlayerId = playerId;
    socket.join(game.code);
    const inProgress = game.state !== 'lobby';
    cb && cb({ ok: true, code: game.code, playerId, isHost: false, lobby: lobbyState(game), inProgress });
    emitLobby(game);
    // Joined mid-game: catch them up with the current screen
    if (game.state === 'question') {
      const q = game.questions[game.round - 1];
      socket.emit('round_start', {
        round: game.round, totalRounds: ROUNDS_PER_GAME, category: q.cat, question: q.q,
        unit: q.unit, seconds: ROUND_SECONDS, endsAt: game.roundEndsAt,
      });
    } else if (game.state === 'results' && game.lastRoundResults) {
      socket.emit('round_results', { ...game.lastRoundResults, standings: standings(game) });
    }
    if (inProgress) io.to(game.code).emit('player_joined_midgame', { nick: cleanNick });
  });

  socket.on('start_game', (_, cb) => {
    const game = myGame;
    if (!game || myPlayerId !== game.hostId) return cb && cb({ ok: false, error: 'Only the host can start.' });
    if (game.state !== 'lobby') return cb && cb({ ok: false, error: 'Game already started.' });
    if (game.players.size < 1) return cb && cb({ ok: false, error: 'Need at least 1 player.' });
    // Avoid anything asked in any game (global ledger) plus this group's own history
    game.questions = pickQuestions(ROUNDS_PER_GAME, new Set([...askedGlobal, ...game.usedQuestionTexts]));
    markAsked(game.questions);
    cb && cb({ ok: true });
    io.to(game.code).emit('game_started', {});
    startRound(game);
  });

  // Client sends what the player has typed so far (throttled); counted if time runs out
  socket.on('draft_answer', ({ value }) => {
    const game = myGame;
    if (!game || game.state !== 'question') return;
    const num = Number(value);
    if (value === '' || value === null || !isFinite(num)) game.drafts.delete(myPlayerId);
    else game.drafts.set(myPlayerId, num);
  });

  socket.on('submit_answer', ({ value }, cb) => {
    const game = myGame;
    if (!game || game.state !== 'question') return cb && cb({ ok: false, error: 'No active question.' });
    if (Date.now() > game.roundEndsAt + 1500) return cb && cb({ ok: false, error: 'Too late!' });
    const num = Number(value);
    if (!isFinite(num)) return cb && cb({ ok: false, error: 'That is not a number.' });
    game.answers.set(myPlayerId, num);
    cb && cb({ ok: true });
    io.to(game.code).emit('answer_count', {
      answered: game.answers.size,
      total: [...game.players.values()].filter((p) => p.connected).length,
    });
    maybeEndEarly(game);
  });

  socket.on('next_round', (_, cb) => {
    const game = myGame;
    if (!game || myPlayerId !== game.hostId) return cb && cb({ ok: false, error: 'Only the host can advance.' });
    if (game.state !== 'results') return cb && cb({ ok: false });
    cb && cb({ ok: true });
    startRound(game);
  });

  socket.on('play_again', (_, cb) => {
    const game = myGame;
    if (!game || myPlayerId !== game.hostId) return cb && cb({ ok: false, error: 'Only the host can restart.' });
    if (game.state !== 'final') return cb && cb({ ok: false });
    resetForNewGame(game);
    cb && cb({ ok: true });
    io.to(game.code).emit('new_game_lobby', lobbyState(game));
    emitLobby(game);
  });

  socket.on('disconnect', () => {
    const game = myGame;
    if (!game) return;
    const p = game.players.get(myPlayerId);
    if (!p) return;
    if (game.state === 'lobby') {
      game.players.delete(myPlayerId);
      // Host left in lobby: pass host to next player or delete empty game
      if (game.hostId === myPlayerId) {
        const next = game.players.values().next().value;
        if (next) game.hostId = next.id;
        else {
          clearTimeout(game.roundTimer);
          clearTimeout(game.advanceTimer);
          games.delete(game.code);
          return;
        }
      }
    } else {
      p.connected = false;
      // Pass host if host dropped mid-game
      if (game.hostId === myPlayerId) {
        const next = [...game.players.values()].find((x) => x.connected);
        if (next) game.hostId = next.id;
      }
      // If everyone is gone, clean up after 10 minutes
      if (![...game.players.values()].some((x) => x.connected)) {
        setTimeout(() => {
          if (![...games.has(game.code) ? game.players.values() : []].some((x) => x.connected)) {
            clearTimeout(game.roundTimer);
            clearTimeout(game.advanceTimer);
            games.delete(game.code);
          }
        }, 10 * 60 * 1000);
      }
      if (game.state === 'question') maybeEndEarly(game);
    }
    emitLobby(game);
  });
});

// Clean up abandoned lobbies every 30 min
setInterval(() => {
  const now = Date.now();
  for (const [code, game] of games) {
    if (game.state === 'lobby' && now - game.createdAt > 2 * 60 * 60 * 1000 && game.players.size === 0) {
      games.delete(code);
    }
  }
}, 30 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`Ballpark server running on http://localhost:${PORT}`);
});
