// Ballpark — question image lookup
//
// Given a "subject" (a person, place, company, movie, etc. pulled from the
// question text), fetch a representative photo. No API key required.
//
// Lookup order:
//   1. Wikipedia's page summary for the subject's exact title.
//   2. If that page doesn't exist or has no image, Wikipedia's own search
//      finds the closest matching article title and we try that page instead.
//   3. If Wikipedia still has nothing (the subject isn't really an
//      "encyclopedia article" topic — e.g. a specific fact rather than a
//      person/place/thing), fall back to a Wikimedia Commons file search,
//      which is a much larger free media library and often has a logo or
//      photo even when no Wikipedia article does.
// (There's no free, key-less, ToS-compliant way to query Google Images from
// a server — that would need a paid Google/Bing image-search API key. If
// this stays too thin, provide one and it's a small change to wire in as a
// fourth stage.)
//
// Caching policy: a SUCCESSFUL lookup is cached in memory and persisted to
// disk forever. A FAILED lookup is cached in memory only, and just for 30
// minutes, so a transient hiccup can't get a subject stuck forever.
//
// Self-healing: the persisted cache is stamped with CACHE_VERSION. Bump that
// constant whenever this lookup logic changes meaningfully (as it just did,
// adding the Commons fallback) and every previously-cached subject —
// including ones that were wrongly cached as "no image" by an older,
// buggier version of this file — gets re-looked-up fresh on the next
// restart. No manual deletion of the cache file needed.

const fs = require('fs');
const path = require('path');

const CACHE_VERSION = 2;
const CACHE_FILE = path.join(__dirname, 'image-cache.json');
const cache = new Map(); // subject -> url (successful lookups only, persisted)
const missCache = new Map(); // subject -> timestamp of last failed attempt (memory-only)
const MISS_RETRY_MS = 30 * 60 * 1000; // retry a failed subject after 30 minutes

try {
  const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  if (saved && saved.version === CACHE_VERSION && saved.entries) {
    Object.entries(saved.entries).forEach(([k, v]) => { if (v) cache.set(k, v); });
    console.log(`Loaded ${cache.size} cached question images`);
  } else {
    console.log('Image cache is from an older version of the lookup logic — starting fresh so every subject gets re-checked');
  }
} catch { /* first run */ }

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(CACHE_FILE, JSON.stringify({ version: CACHE_VERSION, entries: Object.fromEntries(cache) }), () => {});
  }, 1000);
}

async function fetchJson(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'BallparkGame/1.0 (fun trivia game; https://github.com/noobski/ballpark)' } });
    if (!res.ok) return { status: res.status, data: null };
    return { status: res.status, data: await res.json() };
  } catch {
    return { status: 0, data: null };
  } finally {
    clearTimeout(t);
  }
}

async function wikipediaSummary(title) {
  return fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, 3000);
}

async function wikipediaSearchTitle(query) {
  const { data } = await fetchJson(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=${encodeURIComponent(query)}`,
    3000
  );
  const hit = data && data.query && data.query.search && data.query.search[0];
  return hit && hit.title;
}

function imageFromSummary(data) {
  if (!data || data.type === 'disambiguation') return null;
  return (data.thumbnail && data.thumbnail.source) || (data.originalimage && data.originalimage.source) || null;
}

// Broader net than Wikipedia articles: Commons indexes millions of photos,
// logos, and diagrams even for things that don't warrant their own article.
async function commonsSearch(query) {
  const { data } = await fetchJson(
    'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=1' +
      `&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*&gsrsearch=${encodeURIComponent(query)}`,
    3000
  );
  const pages = data && data.query && data.query.pages;
  const page = pages && Object.values(pages)[0];
  const info = page && page.imageinfo && page.imageinfo[0];
  return (info && (info.thumburl || info.url)) || null;
}

async function lookupImage(subject) {
  const clean = subject.replace(/^the\s+/i, '').trim();
  if (!clean) return null;
  try {
    let { data } = await wikipediaSummary(clean);
    let url = imageFromSummary(data);

    // Exact title missing, or it exists but has no usable image — try the
    // closest matching Wikipedia article title once before giving up on Wikipedia.
    if (!url) {
      const hit = await wikipediaSearchTitle(clean);
      if (hit && hit.toLowerCase() !== clean.toLowerCase()) {
        ({ data } = await wikipediaSummary(hit));
        url = imageFromSummary(data);
      }
    }

    // Still nothing on Wikipedia — broaden to Wikimedia Commons directly.
    if (!url) url = await commonsSearch(clean);

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
  const lastMiss = missCache.get(subject);
  if (lastMiss && Date.now() - lastMiss < MISS_RETRY_MS) return Promise.resolve(null);
  if (inFlight.has(subject)) return inFlight.get(subject);
  const p = lookupImage(subject).then((url) => {
    inFlight.delete(subject);
    if (url) {
      cache.set(subject, url);
      persist();
    } else {
      missCache.set(subject, Date.now());
    }
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
