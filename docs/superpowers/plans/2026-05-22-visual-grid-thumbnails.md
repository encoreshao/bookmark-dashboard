# Visual Grid & Thumbnails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OG image preview cards, a compact view mode, and a 3-button topbar toggle (List/Grid/Compact) to the bookmark dashboard Chrome extension.

**Architecture:** The service worker fetches page HTML for every bookmark URL, parses `og:image` meta tags, and caches the result in `chrome.storage.local`. A React hook streams updates from that cache in real time. `BookmarkItem` renders three distinct layouts based on `settings.displayMode`: a rich OG card (grid), a row with favicon + title + domain (list, unchanged), and a dense single-row layout (compact).

**Tech Stack:** Chrome Extension MV3, React 18, TypeScript 5, Vite 5, `chrome.storage.local`, `chrome.bookmarks` API

**Spec:** `docs/superpowers/specs/2026-05-22-visual-grid-thumbnails-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/index.ts` | Modify | Add `'compact'` to `DisplayMode`; add `OGImageCache` type |
| `src/manifest.json` | Modify | Add `"*://*/*"` to `host_permissions` |
| `src/js/service-worker.js` | Rewrite | Full OG fetch pipeline: batch existing + listen for new |
| `src/hooks/useOGImages.ts` | Create | Read `bd_og_cache` from storage, stream live updates |
| `src/components/Topbar.tsx` | Modify | Replace single view toggle with 3-button group |
| `src/components/SettingsPanel.tsx` | Modify | Remove `displayMode` toggle (now in topbar) |
| `src/components/BookmarkView.tsx` | Modify | Call `useOGImages`, thread `ogImageUrl` + `viewClass` into sections |
| `src/components/BookmarkItem.tsx` | Modify | Grid OG card layout + compact mode branch |
| `src/styles/main.css` | Modify | Grid card styles, shimmer animation, compact mode styles |

---

### Task 1: Types & Manifest

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/manifest.json`

- [ ] **Step 1: Extend DisplayMode and add OGImageCache**

In `src/types/index.ts`, change line 6:

```typescript
// Before:
export type DisplayMode = 'grid' | 'list';

// After:
export type DisplayMode = 'grid' | 'list' | 'compact';
// A missing key in OGImageCache means "not yet fetched" → shimmer in UI
// null means "fetched, no og:image found" → show domain initials
export type OGImageCache = Record<string, string | null>;
```

- [ ] **Step 2: Broaden host_permissions in the manifest**

In `src/manifest.json`, update `host_permissions` to add `"*://*/*"` as the first entry:

```json
"host_permissions": [
  "*://*/*",
  "https://api.openai.com/*",
  "https://generativelanguage.googleapis.com/*",
  "https://api.anthropic.com/*"
]
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds. TypeScript may warn that `'compact'` doesn't match the old `DisplayMode` union in `Topbar.tsx` where `isGrid` is computed — that's expected, it gets fixed in Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/manifest.json
git commit -m "feat: add compact display mode, OGImageCache type, broaden host_permissions"
```

---

### Task 2: Service Worker — OG Fetch Pipeline

**Files:**
- Rewrite: `src/js/service-worker.js`

- [ ] **Step 1: Replace the entire service-worker.js**

```javascript
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
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds. `dist/js/service-worker.js` contains the new pipeline.

- [ ] **Step 3: Manual smoke test in Chrome**

Load `dist/` as an unpacked extension in `chrome://extensions`. Click "service worker" to open its DevTools console. After ~30 seconds, run:

```javascript
chrome.storage.local.get('bd_og_cache', console.log)
```

Expected: `{bd_og_cache: {"123": "https://...", "456": null, ...}}` — IDs mapping to image URLs or null.

- [ ] **Step 4: Commit**

```bash
git add src/js/service-worker.js
git commit -m "feat: service worker fetches and caches OG images for all bookmarks"
```

---

### Task 3: useOGImages Hook

**Files:**
- Create: `src/hooks/useOGImages.ts`

- [ ] **Step 1: Create the hooks directory and hook**

Create `src/hooks/useOGImages.ts`:

```typescript
import { useEffect, useState } from 'react';
import type { OGImageCache } from '@/types';

const OG_CACHE_KEY = 'bd_og_cache';

export function useOGImages(): OGImageCache {
  const [cache, setCache] = useState<OGImageCache>({});

  useEffect(() => {
    chrome.storage.local.get(OG_CACHE_KEY, (data) => {
      setCache(data[OG_CACHE_KEY] || {});
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'local' || !changes[OG_CACHE_KEY]) return;
      setCache(changes[OG_CACHE_KEY].newValue || {});
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return cache;
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useOGImages.ts
git commit -m "feat: useOGImages hook streams OG image cache from chrome.storage in real time"
```

---

### Task 4: Topbar — Replace Toggle with 3-Button Group

**Files:**
- Modify: `src/components/Topbar.tsx`
- Modify: `src/styles/main.css`

- [ ] **Step 1: Remove isGrid / toggleView and add 3-button JSX**

In `src/components/Topbar.tsx`:

**Remove** line 21: `const isGrid = settings.displayMode === 'grid';`

**Remove** the `toggleView` function (lines 45–48):
```typescript
const toggleView = () => {
  const next = settings.displayMode === 'grid' ? 'list' : 'grid';
  saveSetting('displayMode', next);
};
```

**Find** the entire existing view `<button>` block (the `nav-link` button that conditionally renders grid or list SVG icons and calls `toggleView`). **Replace it** with:

```tsx
<div className="view-mode-toggle">
  <button
    className={`view-mode-btn${settings.displayMode === 'list' ? ' active' : ''}`}
    onClick={() => saveSetting('displayMode', 'list')}
    title="List view"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <line x1="8" x2="21" y1="6" y2="6"/>
      <line x1="8" x2="21" y1="12" y2="12"/>
      <line x1="8" x2="21" y1="18" y2="18"/>
      <line x1="3" x2="3.01" y1="6" y2="6"/>
      <line x1="3" x2="3.01" y1="12" y2="12"/>
      <line x1="3" x2="3.01" y1="18" y2="18"/>
    </svg>
  </button>
  <button
    className={`view-mode-btn${settings.displayMode === 'grid' ? ' active' : ''}`}
    onClick={() => saveSetting('displayMode', 'grid')}
    title="Grid view"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <rect width="7" height="7" x="3" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="3" rx="1"/>
      <rect width="7" height="7" x="14" y="14" rx="1"/>
      <rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
  </button>
  <button
    className={`view-mode-btn${settings.displayMode === 'compact' ? ' active' : ''}`}
    onClick={() => saveSetting('displayMode', 'compact')}
    title="Compact view"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <line x1="4" x2="20" y1="6" y2="6"/>
      <line x1="4" x2="20" y1="10" y2="10"/>
      <line x1="4" x2="20" y1="14" y2="14"/>
      <line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  </button>
</div>
```

- [ ] **Step 2: Add view-mode-toggle CSS**

In `src/styles/main.css`, add after the `.nav-link svg` block (around line 396, before the tooltip block):

```css
/* ---------- View Mode Toggle ---------- */
.view-mode-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 3px;
  flex-shrink: 0;
}

.view-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: 6px;
  color: var(--text-muted);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.view-mode-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.view-mode-btn.active {
  background: var(--bg-secondary);
  color: var(--accent);
}
```

- [ ] **Step 3: Build and verify in Chrome**

```bash
npm run build
```

Expected: build succeeds. Load in Chrome — the topbar shows a pill-shaped 3-icon toggle. Clicking each icon immediately switches the view and highlights the active icon.

- [ ] **Step 4: Commit**

```bash
git add src/components/Topbar.tsx src/styles/main.css
git commit -m "feat: replace view toggle button with 3-mode pill (list/grid/compact) in topbar"
```

---

### Task 5: Remove displayMode Toggle from SettingsPanel

**Files:**
- Modify: `src/components/SettingsPanel.tsx`

- [ ] **Step 1: Delete the displayMode sp-group block**

In `src/components/SettingsPanel.tsx`, find and delete the entire block (approximately lines 148–157):

```tsx
<div className="sp-group">
  <label className="sp-label">{t('sp-display-mode')}</label>
  <Toggle<DisplayMode>
    value={draft.displayMode}
    onChange={v => set('displayMode', v)}
    options={[
      { value: 'list', label: 'List' },
      { value: 'grid', label: 'Grid' },
    ]}
  />
</div>
```

Also remove `DisplayMode` from the import on line 6 since it's no longer referenced in this file. The import line currently reads:
```typescript
import type { AppSettings, Theme, DisplayMode, Language, NavDisplay, PinnedDisplay, FolderSidebarMode, AIProvider } from '@/types';
```
Change to:
```typescript
import type { AppSettings, Theme, Language, NavDisplay, PinnedDisplay, FolderSidebarMode, AIProvider } from '@/types';
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsPanel.tsx
git commit -m "feat: remove display mode toggle from Settings panel (moved to topbar)"
```

---

### Task 6: BookmarkItem — Grid OG Card + Compact Mode

**Files:**
- Modify: `src/components/BookmarkItem.tsx`

- [ ] **Step 1: Update imports, props interface, and add state**

In `src/components/BookmarkItem.tsx`:

Update the `@/utils/bookmarks` import to include `getHostname` and `getDomainColor`:
```typescript
import { getFaviconUrl, getHostname, getDomainColor } from '@/utils/bookmarks';
```

Update the `Props` interface:
```typescript
interface Props {
  bookmark: BookmarkNode;
  isPinned?: boolean;
  showPin?: boolean;
  ogImageUrl?: string | null;
}
```

Update the function signature:
```typescript
function BookmarkItem({ bookmark, isPinned = false, showPin = true, ogImageUrl }: Props) {
```

Replace `const isGrid = settings.displayMode === 'grid';` with:
```typescript
const displayMode = settings.displayMode;
const hostname = getHostname(bookmark.url ?? '');
const initials = hostname.replace(/^www\./, '').slice(0, 2).toUpperCase() || '??';
const domainColor = getDomainColor(hostname);
const [ogImgError, setOgImgError] = useState(false);
```

- [ ] **Step 2: Rewrite the `<a>` element's inner content**

Inside the `<a className="bookmark-item" ...>` element, replace the existing `{isGrid ? (...) : (...)}` block with:

```tsx
{displayMode === 'grid' && (
  <>
    {ogImageUrl === undefined && (
      <div className="bookmark-og-shimmer" />
    )}
    {ogImageUrl !== undefined && ogImageUrl && !ogImgError && (
      <img
        className="bookmark-og-image"
        src={ogImageUrl}
        alt=""
        loading="lazy"
        onError={() => setOgImgError(true)}
      />
    )}
    {ogImageUrl !== undefined && (ogImageUrl === null || ogImgError) && (
      <div className="bookmark-og-initials" style={{ background: domainColor }}>
        {initials}
      </div>
    )}
    <div className="bookmark-og-footer">
      <div className="bookmark-og-domain-row">
        <img className="bookmark-favicon" src={favicon} alt="" loading="lazy"
             onError={e => (e.currentTarget.style.display = 'none')} />
        <span className="bookmark-og-domain">{hostname}</span>
      </div>
      <span className="bookmark-title">{bookmark.title}</span>
    </div>
  </>
)}
{(displayMode === 'list' || displayMode === 'compact') && (
  <>
    <img className="bookmark-favicon" src={favicon} alt="" loading="lazy"
         onError={e => (e.currentTarget.style.display = 'none')} />
    <span className="bookmark-title">{bookmark.title}</span>
    <span className="bookmark-url">{hostname}</span>
  </>
)}
```

Note: compact and list share the same JSX — the visual difference is entirely in CSS via `.view-compact` vs `.view-list` parent class.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: no TypeScript errors. Both `getHostname` and `getDomainColor` are already exported from `src/utils/bookmarks.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/components/BookmarkItem.tsx
git commit -m "feat: BookmarkItem renders OG card (grid) and dense row (compact)"
```

---

### Task 7: BookmarkView — Wire useOGImages and viewClass

**Files:**
- Modify: `src/components/BookmarkView.tsx`

- [ ] **Step 1: Add imports**

In `src/components/BookmarkView.tsx`, add:
```typescript
import { useOGImages } from '@/hooks/useOGImages';
import type { OGImageCache } from '@/types';
```

- [ ] **Step 2: Update PinnedSection to accept ogImages and use viewClass**

Update the `PinnedSection` function signature:
```typescript
function PinnedSection({ pinnedIds, ogImages }: { pinnedIds: string[]; ogImages: OGImageCache }) {
```

Replace `const isGrid = settings.displayMode === 'grid';` with:
```typescript
const viewClass = settings.displayMode === 'grid' ? 'view-grid'
  : settings.displayMode === 'compact' ? 'view-compact'
  : 'view-list';
```

Replace `${isGrid ? ' view-grid' : ' view-list'}` in the returned `className` with ` ${viewClass}`:
```tsx
<div className={`bookmark-folder ${viewClass}`}>
```

Update the `BookmarkItem` call:
```tsx
{items.map(bm => (
  <BookmarkItem key={bm.id} bookmark={bm} isPinned showPin ogImageUrl={ogImages[bm.id]} />
))}
```

- [ ] **Step 3: Update FolderSection to accept ogImages and use viewClass**

Update `FolderSection` props:
```typescript
function FolderSection({
  folder,
  ogImages,
}: {
  folder: { id: string; title: string; items: BookmarkNode[] };
  ogImages: OGImageCache;
}) {
```

Replace `const isGrid = settings.displayMode === 'grid';` with:
```typescript
const viewClass = settings.displayMode === 'grid' ? 'view-grid'
  : settings.displayMode === 'compact' ? 'view-compact'
  : 'view-list';
```

Replace `${isGrid ? 'view-grid' : 'view-list'}` in the `className` with `${viewClass}`:
```tsx
<div
  className={`bookmark-folder ${viewClass}${dropActive ? ' folder-drop-active' : ''}`}
```

Update the `BookmarkItem` call:
```tsx
{folder.items.map(bm => (
  <BookmarkItem key={bm.id} bookmark={bm} showPin ogImageUrl={ogImages[bm.id]} />
))}
```

- [ ] **Step 4: Call useOGImages in BookmarkView and pass it down**

In `BookmarkView`, add after the existing hooks:
```typescript
const ogImages = useOGImages();
```

Update `PinnedSection` usage:
```tsx
<PinnedSection pinnedIds={settings.pinnedIds} ogImages={ogImages} />
```

Update `FolderSection` usage:
```tsx
{filtered.map(folder => (
  <FolderSection key={folder.id} folder={folder} ogImages={ogImages} />
))}
```

- [ ] **Step 5: Build and verify end-to-end**

```bash
npm run build
```

Expected: no TypeScript errors. Load in Chrome. Switch to Grid — shimmer cards appear immediately, then fill in as the service worker populates the cache. Switch to Compact — dense rows with pin/delete on hover.

- [ ] **Step 6: Commit**

```bash
git add src/components/BookmarkView.tsx
git commit -m "feat: wire useOGImages into BookmarkView; thread ogImageUrl and viewClass to sections"
```

---

### Task 8: CSS — Grid OG Card, Shimmer, Compact Mode

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1: Replace the existing grid view CSS block**

Find and replace the entire block from `.view-grid .folder-items` to `.view-grid .bookmark-item:hover .bookmark-title` (approximately lines 757–833). Replace with:

```css
/* --- Grid View --- */
.view-grid .folder-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  padding: 16px;
}

.view-grid .bookmark-item-wrapper {
  position: relative;
}

.view-grid .bookmark-item {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--border);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  height: 100%;
  transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.18s ease;
}

.view-grid .bookmark-item:hover {
  border-color: var(--accent);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.13), 0 2px 6px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

/* OG preview image */
.bookmark-og-image {
  width: 100%;
  height: 90px;
  object-fit: cover;
  display: block;
  flex-shrink: 0;
}

/* Domain initials fallback */
.bookmark-og-initials {
  width: 100%;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

/* Shimmer loading state */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.bookmark-og-shimmer {
  width: 100%;
  height: 90px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-secondary) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

/* Card footer */
.bookmark-og-footer {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.bookmark-og-domain-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.bookmark-og-domain {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-grid .bookmark-favicon {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  object-fit: contain;
  flex-shrink: 0;
}

.view-grid .bookmark-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- [ ] **Step 2: Add compact view CSS**

After the `.view-list .bookmark-url` block (around line 904), add:

```css
/* --- Compact View --- */
.view-compact .folder-items {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 8px 8px;
}

.view-compact .bookmark-item-wrapper {
  position: relative;
}

.view-compact .bookmark-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 68px 4px 16px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s ease;
}

.view-compact .bookmark-item:hover {
  background: var(--bg-tertiary);
}

.view-compact .bookmark-favicon {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  object-fit: contain;
  flex-shrink: 0;
}

.view-compact .bookmark-title {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.view-compact .bookmark-url {
  font-size: 0.65rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.view-compact .bookmark-pin {
  top: 50%;
  transform: translateY(-50%);
  right: 36px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.view-compact .bookmark-remove {
  top: 50%;
  transform: translateY(-50%);
  right: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.view-compact .bookmark-item-wrapper:hover .bookmark-pin,
.view-compact .bookmark-item-wrapper.is-pinned .bookmark-pin {
  opacity: 1;
}

.view-compact .bookmark-item-wrapper:hover .bookmark-remove {
  opacity: 1;
}
```

- [ ] **Step 3: Update light theme and backdrop overrides**

Find the `.theme-light .view-grid .bookmark-item` block (around line 69). Replace the three rules (`.bookmark-item`, `.bookmark-item:hover`, `.bookmark-favicon-wrap`) with:

```css
.theme-light .view-grid .bookmark-item {
  background: var(--card-bg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.theme-light .view-grid .bookmark-item:hover {
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.12), 0 2px 6px rgba(0,0,0,0.06);
}
```

Delete the `.theme-light .view-grid .bookmark-favicon-wrap` rule — the favicon wrap is no longer rendered in grid mode.

Also delete `body.has-bg-image .view-grid .bookmark-favicon-wrap` (around line 258) for the same reason.

- [ ] **Step 4: Build and final verification**

```bash
npm run build
```

Load in Chrome and verify all four scenarios:

1. **Grid mode** — cards show shimmer, fill in with OG images as worker runs. Initials show for null entries. Hover shows `translateY(-2px)` lift.
2. **List mode** — visually unchanged from before.
3. **Compact mode** — 28px rows, favicon + title + domain. Pin and remove buttons appear on hover only.
4. **Theme** — switch between dark and light; all three modes look correct in both.

- [ ] **Step 5: Commit**

```bash
git add src/styles/main.css
git commit -m "feat: CSS for grid OG card layout, shimmer state, and compact view mode"
```
