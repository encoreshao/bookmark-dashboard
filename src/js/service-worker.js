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

async function cacheOGImage(bookmarkId, url) {
  const data = await chrome.storage.local.get(OG_CACHE_KEY);
  const cache = data[OG_CACHE_KEY] || {};
  if (bookmarkId in cache) return; // already cached — never retry
  const ogUrl = await fetchOGImage(url);
  cache[bookmarkId] = ogUrl;
  await chrome.storage.local.set({ [OG_CACHE_KEY]: cache });
}

async function processQueue(queue) {
  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(({ id, url }) => cacheOGImage(id, url)));
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
  batchFetchAllBookmarks();
});

chrome.runtime.onStartup.addListener(() => {
  batchFetchAllBookmarks();
});

chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  if (bookmark.url) cacheOGImage(id, bookmark.url);
});
