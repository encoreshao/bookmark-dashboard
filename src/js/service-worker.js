/* Service Worker (Manifest V3) */

const OG_CACHE_KEY = 'bd_og_cache';
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;
const FETCH_TIMEOUT_MS = 8000;

async function fetchOGImage(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) { clearTimeout(timer); return null; }
    clearTimeout(timer);
    const html = await res.text();
    // Match both attribute orderings of the og:image meta tag
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match ? match[1] : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function processQueue(queue) {
  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);
    // Fetch all in parallel for speed
    const results = await Promise.all(
      batch.map(({ id, url }) =>
        fetchOGImage(url).then(ogUrl => ({ id, ogUrl }))
      )
    );
    // Single read-modify-write for the whole batch
    const data = await chrome.storage.local.get(OG_CACHE_KEY);
    const cache = data[OG_CACHE_KEY] || {};
    let changed = false;
    for (const { id, ogUrl } of results) {
      if (!(id in cache)) { cache[id] = ogUrl; changed = true; }
    }
    if (changed) await chrome.storage.local.set({ [OG_CACHE_KEY]: cache });
    if (i + BATCH_SIZE < queue.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }
}

async function batchFetchAllBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  const all = [];
  function collect(nodes) {
    for (const n of nodes) {
      if (n.url) all.push({ id: n.id, url: n.url });
      if (n.children) collect(n.children);
    }
  }
  collect(tree);

  const data = await chrome.storage.local.get(OG_CACHE_KEY);
  const cache = data[OG_CACHE_KEY] || {};
  const queue = all.filter(({ id }) => !(id in cache));
  await processQueue(queue);
}

chrome.runtime.onInstalled.addListener(() => {
  batchFetchAllBookmarks().catch(err => console.error('[OG] batch fetch failed:', err));
});

chrome.runtime.onStartup.addListener(() => {
  batchFetchAllBookmarks().catch(err => console.error('[OG] batch fetch failed:', err));
});

chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  if (!bookmark.url) return;
  fetchOGImage(bookmark.url).then(ogUrl => {
    chrome.storage.local.get(OG_CACHE_KEY, (data) => {
      const cache = data[OG_CACHE_KEY] || {};
      if (id in cache) return;
      cache[id] = ogUrl;
      chrome.storage.local.set({ [OG_CACHE_KEY]: cache });
    });
  }).catch(() => {});
});
