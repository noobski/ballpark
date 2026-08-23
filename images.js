// Ballpark — question image lookup
//
// Given a "subject" (a person, place, company, movie, etc. pulled from the
// question text), fetch a representative photo from Wikipedia's public REST
// API. Results are cached in memory and persisted to disk so repeat lookups
// (same subject asked again in a later game) are instant and don't hit the
// network. No API key required.

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'image-cache.json');
const cache = new Map(); // subject -> url|null
try {
  const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  Object.entries(saved).forEach(([k, v]) => cache.set(k, v));
  console.log(`Loaded ${cache.size} cached question images`);
} catch { /* first run */ }

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(CACHE_FILE, JSON.stringify(Object.fromEntries(cache)), () => {});
  }, 1000);
}

async function fetchJson(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'BallparkGame/1.0 (fun trivia game)' } });
    if (!res.ok) return { status: res.status, data: null };
    return { status: res.status, data: await res.json() };
  } catch {
    return { status: 0, data: null };
  } finally {
    clearTimeout(t);
  }
}

async function lookupWikipedia(subject) {
  const clean = subject.replace(/^the\s+/i, '').trim();
  if (!clean) return null;
  try {
    let { status, data } = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`, 3000);
    if (status === 404) {
      // No exact page — search for the closest matching title, then retry.
      const search = await fetchJson(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=${encodeURIComponent(clean)}`,
        3000
      );
      const hit = search.data && search.data.query && search.data.query.search && search.data.query.search[0];
      if (hit && hit.title) {
        ({ status, data } = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`, 3000));
      }
    }
    if (!data || data.type === 'disambiguation') return null;
    const url = (data.thumbnail && data.thumbnail.source) || (data.originalimage && data.originalimage.source) || null;
    return url;
  } catch {
    return null;
  }
}

const inFlight = new Map(); // subject -> Promise<url|null>

// Resolve (and cache) the image URL for a subject. Safe to call repeatedly —
// concurrent calls for the same subject share one in-flight request.
function getImage(subject) {
  if (!subject) return Promise.resolve(null);
  if (cache.has(subject)) return Promise.resolve(cache.get(subject));
  if (inFlight.has(subject)) return inFlight.get(subject);
  const p = lookupWikipedia(subject).then((url) => {
    cache.set(subject, url);
    inFlight.delete(subject);
    persist();
    return url;
  });
  inFlight.set(subject, p);
  return p;
}

// Fire off lookups for a batch of subjects without waiting on them — used to
// warm the cache for a game's whole question set as soon as it's picked, so
// each round's image is (usually) already resolved by the time it's needed.
function prewarm(subjects) {
  (subjects || []).forEach((s) => { if (s) getImage(s).catch(() => {}); });
}

module.exports = { getImage, prewarm };
