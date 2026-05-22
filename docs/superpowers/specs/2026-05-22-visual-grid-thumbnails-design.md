# Visual Grid & Thumbnails

**Date:** 2026-05-22  
**Status:** Approved

## Overview

Transform the bookmark dashboard from a text-only list into a rich visual experience with three display modes (List, Grid, Compact), OG image preview cards, and a domain-initials fallback for sites without OG images.

## Decisions Made

| Question | Decision |
|---|---|
| Card layout | Option B — balanced: OG image top, favicon + domain + 2-line title below |
| Toggle placement | Topbar (always visible, 3 icons), removed from Settings |
| OG fetch strategy | Approach A — service worker fetches HTML, parses og:image, caches in chrome.storage |
| Existing bookmarks | Batch-fetched on install/startup for all uncached bookmarks |

---

## Section 1: Data & Types

### `src/types/index.ts`
- `DisplayMode` changes from `'grid' | 'list'` to `'grid' | 'list' | 'compact'`
- New type: `export type OGImageCache = Record<string, string | null>`
  - Key: bookmark ID
  - Value: OG image URL string, or `null` if fetch failed/no image found
  - A missing key (returns `undefined` in JS) means "not yet fetched" — triggers the shimmer state in the UI

### `src/manifest.json`
- Add `"*://*/*"` to `host_permissions` so the service worker can fetch arbitrary page HTML

### `chrome.storage.local`
- New key: `bd_og_cache` — stores the `OGImageCache` object
- Existing key: `bd_displayMode` — now accepts `'compact'` as a valid value

---

## Section 2: Service Worker — OG Fetch Pipeline

File: `src/js/service-worker.js`

### Triggers

**`chrome.runtime.onInstalled` + `chrome.runtime.onStartup`**
1. Call `chrome.bookmarks.getTree()` to get all bookmarks
2. Read existing `bd_og_cache` from storage
3. Collect all bookmark IDs with a URL that are not yet in the cache
4. Process the queue in batches of 5, with a 500ms delay between batches

**`chrome.bookmarks.onCreated`**
- If the new node has a URL, immediately call `fetchAndCacheOGImage(id, url)`

### Core Helper: `fetchOGImage(url)`

```
async function fetchOGImage(url) {
  - Reject non-http/https URLs immediately → return null
  - fetch(url) with an AbortController timeout of 8 seconds
  - On success: read response.text(), regex-match first og:image content attribute
  - Return the matched URL string, or null if not found
  - On any error (network, timeout, parse): return null
}
```

### Caching

After each fetch, merge result into `bd_og_cache`:
```
chrome.storage.local.get('bd_og_cache', (data) => {
  const cache = data.bd_og_cache || {};
  cache[bookmarkId] = ogUrl; // string or null
  chrome.storage.local.set({ bd_og_cache: cache });
});
```

**No retries.** Once a bookmark ID has any value in the cache (including `null`), it is never fetched again. This prevents runaway background work.

---

## Section 3: UI Components

### New Hook: `src/hooks/useOGImages.ts`

- Reads `bd_og_cache` from `chrome.storage.local` on mount
- Subscribes to `chrome.storage.onChanged` to update in real time as the service worker populates the cache
- Returns `OGImageCache` (plain object, empty object while loading)
- Used once in `BookmarkView`, passed as a prop down to `BookmarkItem`

### `src/components/Topbar.tsx`

- Add a 3-button icon toggle group for List / Grid / Compact display modes
- Positioned in the topbar between the search bar and settings button
- Reads `settings.displayMode`, calls `saveSetting('displayMode', mode)` on click
- Icons: list-lines / grid-2x2 / compact-rows (SVG, matching existing stroke style)

### `src/components/SettingsPanel.tsx`

- Remove the `displayMode` toggle from the General tab (now lives in topbar)

### `src/components/BookmarkItem.tsx`

New prop: `ogImageUrl?: string | null`

**Grid mode** renders the Option B card:
```
┌─────────────────────────┐
│   OG image (90px tall)  │  ← loading="lazy", object-fit:cover
│   OR initials avatar    │  ← deterministic color from getDomainColor()
├─────────────────────────┤
│ 🔵 github.com           │  ← favicon (14px) + domain (muted)
│ GitHub – Build software │  ← 2-line clamped title
│ better, together        │
└─────────────────────────┘
```

**Initials avatar** (when `ogImageUrl` is null/undefined):
- Same 90px height as the image slot
- Background: `getDomainColor(hostname)` (already used in `DomainView`)
- Text: first 2 characters of the domain hostname, uppercase, bold white

**Compact mode** (new third branch):
- Single flex row, `height: 28px`
- 14px favicon → title (flex: 1, ellipsis) → domain (right-aligned, muted)
- Pin and delete buttons: `opacity: 0` by default, `opacity: 1` on `.bookmark-item-wrapper:hover`

**List mode** — unchanged from current behavior.

### `src/components/BookmarkView.tsx`

- Calls `useOGImages()` once at the top
- Passes `ogImageUrl={ogImages[bm.id]}` to each `BookmarkItem`
- Passes correct class to `folder-items`: `view-grid` / `view-list` / `view-compact`

---

## Section 4: CSS

File: `src/styles/main.css`

### Grid card styles (`.view-grid`)

- Grid container: `display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px`
- `.bookmark-item`: `flex-direction: column; border-radius: 12px; overflow: hidden`
- `.bookmark-og-image`: `width: 100%; height: 90px; object-fit: cover; display: block`
- `.bookmark-og-initials`: `width: 100%; height: 90px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #fff; letter-spacing: .03em`
- `.bookmark-og-footer`: `padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 4px`
- `.bookmark-og-domain`: `font-size: 10px; color: var(--text-muted)`
- `.bookmark-title` (grid): `-webkit-line-clamp: 2; font-size: 12px`

### Loading shimmer

While `ogImageUrl` is `undefined` (not yet resolved from cache), the image slot shows a shimmer:
- `background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%)`
- `background-size: 200% 100%; animation: shimmer 1.4s infinite`

`null` (fetch failed) → show initials avatar immediately, no shimmer.  
`undefined` (not yet in cache) → show shimmer while service worker is still working.

### Compact mode styles (`.view-compact`)

- `.view-compact .folder-items`: `display: flex; flex-direction: column`
- `.view-compact .bookmark-item-wrapper`: `height: 28px`
- `.view-compact .bookmark-item`: `flex-direction: row; align-items: center; gap: 8px; padding: 0 10px`
- `.view-compact .bookmark-favicon`: `width: 14px; height: 14px; flex-shrink: 0`
- `.view-compact .bookmark-title`: `flex: 1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
- `.view-compact .bookmark-url`: `font-size: 10px; color: var(--text-muted); white-space: nowrap`
- `.view-compact .bookmark-pin, .view-compact .bookmark-remove`: `opacity: 0; transition: opacity .15s`
- `.view-compact .bookmark-item-wrapper:hover .bookmark-pin`: `opacity: 1`
- `.view-compact .bookmark-item-wrapper:hover .bookmark-remove`: `opacity: 1`

Both dark and light theme variables apply automatically via existing `:root` and `.theme-dark` blocks.

---

## Files Changed

| File | Change |
|---|---|
| `src/types/index.ts` | Add `'compact'` to `DisplayMode`; add `OGImageCache` type |
| `src/manifest.json` | Add `"*://*/*"` to `host_permissions` |
| `src/js/service-worker.js` | Full OG fetch pipeline |
| `src/hooks/useOGImages.ts` | New hook (new file) |
| `src/components/Topbar.tsx` | Add 3-mode view toggle |
| `src/components/SettingsPanel.tsx` | Remove `displayMode` toggle |
| `src/components/BookmarkView.tsx` | Wire `useOGImages`, pass `ogImageUrl` and correct view class |
| `src/components/BookmarkItem.tsx` | Add `ogImageUrl` prop, grid card layout, compact mode branch |
| `src/styles/main.css` | Grid card, initials, shimmer, compact mode styles |

## Out of Scope

- Storing OG images as data URLs (too large for chrome.storage; we store the URL only)
- OG images in `PinnedSidebar` (the right-rail sidebar component) — the top-of-page pinned section is in scope and will receive OG images normally
- Manual refresh of a stale OG image
- OG image display in List mode
