# Reading List Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Reading List view to the bookmark dashboard Chrome extension where users can save articles, read them in a clean split-panel reader with offline-cached content, and archive them when done.

**Architecture:** A new `ReadingListContext` manages a `ReadingListItem[]` array persisted to `chrome.storage.local` at key `bd_readingList`. Items are added from `BookmarkItem` rows or via a URL quick-add input. At add-time, `fetchAndParse()` fetches the article HTML and runs `@mozilla/readability` + DOMPurify to cache sanitized content. A new `'reading'` view renders a 30/70 split: `ReadingListPanel` on the left (list + quick-add), `ReaderPanel` on the right.

**Tech Stack:** React 18, TypeScript, Vite, `@mozilla/readability`, `dompurify`, `chrome.storage.local`, Vitest + jsdom (tests)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/types/reading-list.ts` | `ReadingListItem` + `ParsedArticle` interfaces |
| Create | `src/utils/readability.ts` | `fetchAndParse(url)` — fetch → DOMParser → Readability → DOMPurify |
| Create | `src/context/ReadingListContext.tsx` | State, storage I/O, add/archive/unarchive/remove |
| Create | `src/components/ReadingListView.tsx` | Root 30/70 split layout, selected-item state |
| Create | `src/components/ReadingListPanel.tsx` | Left panel: quick-add input, unread list, archive section |
| Create | `src/components/ReadingListItem.tsx` | Single list row: title, domain, time, actions |
| Create | `src/components/ReaderPanel.tsx` | Right panel: shimmer / error fallback / sanitized HTML reader |
| Create | `src/styles/reading-list.css` | All styles for the reading list feature |
| Modify | `src/types/index.ts` | Add `'reading'` to `ActiveView` union |
| Modify | `src/main.tsx` | Wrap tree with `<ReadingListProvider>` |
| Modify | `src/App.tsx` | Add `'reading'` view branch + `R` keyboard shortcut |
| Modify | `src/components/Topbar.tsx` | Add Reading List nav button before the Theme button |
| Modify | `src/components/BookmarkItem.tsx` | Add "Add to Reading List" accent button in hover row |
| Modify | `src/components/KeyboardShortcuts.tsx` | Add `L` → Reading List entry |
| Create | `src/tests/readability.test.ts` | Unit tests for `fetchAndParse` |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install runtime deps**

```bash
npm install @mozilla/readability dompurify
```

Expected: `@mozilla/readability` and `dompurify` appear in `dependencies`.

- [ ] **Step 2: Install dev deps**

```bash
npm install --save-dev @types/dompurify vitest @vitest/globals jsdom @types/jsdom
```

Expected: all appear in `devDependencies`.

- [ ] **Step 3: Configure Vitest in vite.config.ts**

Read `vite.config.ts` first, then add the `test` block:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add `"test": "vitest run"` to the `scripts` block:

```json
"scripts": {
  "dev": "vite build --watch",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 5: Verify Vitest works**

```bash
npx vitest run --reporter=verbose
```

Expected: "No test files found" (zero failures — test runner itself works).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: add readability, dompurify deps and vitest"
```

---

## Task 2: Define types

**Files:**
- Create: `src/types/reading-list.ts`

- [ ] **Step 1: Create the types file**

```ts
export interface ReadingListItem {
  id: string;
  url: string;
  title: string;
  addedAt: number;
  status: 'unread' | 'archived';
  sourceBookmarkId?: string;
  // undefined = fetch in progress; null = fetch failed; string = cached
  cachedContent: string | null | undefined;
  cachedTitle: string | null;
  cachedByline: string | null;
}

export interface ParsedArticle {
  title: string;
  byline: string | null;
  content: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/reading-list.ts
git commit -m "feat: add ReadingListItem and ParsedArticle types"
```

---

## Task 3: fetchAndParse utility + tests

**Files:**
- Create: `src/utils/readability.ts`
- Create: `src/tests/readability.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/tests/readability.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAndParse } from '@/utils/readability';

const ARTICLE_HTML = `<!DOCTYPE html><html><head><title>Test Article</title></head>
<body>
  <article>
    <h1>Test Article</h1>
    <p class="byline">By Jane Smith</p>
    <p>This is a paragraph with some content about the topic at hand.</p>
    <p>Another paragraph with more details to ensure readability picks it up.</p>
  </article>
</body></html>`;

const JUNK_HTML = `<!DOCTYPE html><html><body><p>Hi</p></body></html>`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchAndParse', () => {
  it('returns parsed article for a valid HTML response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => ARTICLE_HTML,
    } as Response);

    const result = await fetchAndParse('https://example.com/article');
    expect(result).not.toBeNull();
    expect(result!.title).toBeTruthy();
    expect(result!.content).toBeTruthy();
    expect(typeof result!.content).toBe('string');
  });

  it('returns null when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const result = await fetchAndParse('https://example.com/article');
    expect(result).toBeNull();
  });

  it('returns null when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '',
    } as Response);
    const result = await fetchAndParse('https://example.com/article');
    expect(result).toBeNull();
  });

  it('strips script tags from content (DOMPurify sanitization)', async () => {
    const maliciousHtml = `<!DOCTYPE html><html><body>
      <article>
        <h1>Safe Article</h1>
        <p>Safe content here that is long enough for readability to parse it correctly.</p>
        <p>More safe content that ensures the article is picked up.</p>
        <script>alert('xss')</script>
        <p>Even more content to ensure Readability processes this document.</p>
      </article>
    </body></html>`;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => maliciousHtml,
    } as Response);

    const result = await fetchAndParse('https://example.com/article');
    if (result) {
      expect(result.content).not.toContain('<script');
      expect(result.content).not.toContain('alert(');
    }
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/utils/readability'`

- [ ] **Step 3: Implement fetchAndParse**

Create `src/utils/readability.ts`:

```ts
import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import type { ParsedArticle } from '@/types/reading-list';

export async function fetchAndParse(url: string): Promise<ParsedArticle | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Set base URL so relative links resolve correctly inside the reader
    const base = doc.createElement('base');
    base.setAttribute('href', url);
    doc.head.prepend(base);

    const article = new Readability(doc).parse();
    if (!article) return null;

    return {
      title: article.title,
      byline: article.byline ?? null,
      content: DOMPurify.sanitize(article.content),
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: all 4 tests in `src/tests/readability.test.ts` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/readability.ts src/tests/readability.test.ts
git commit -m "feat: add fetchAndParse utility with readability + dompurify"
```

---

## Task 4: ReadingListContext

**Files:**
- Create: `src/context/ReadingListContext.tsx`

- [ ] **Step 1: Create the context**

```tsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReadingListItem } from '@/types/reading-list';
import { fetchAndParse } from '@/utils/readability';

const STORAGE_KEY = 'bd_readingList';

interface ReadingListContextValue {
  items: ReadingListItem[];
  addItem: (url: string, title: string, sourceBookmarkId?: string) => Promise<void>;
  archiveItem: (id: string) => void;
  unarchiveItem: (id: string) => void;
  removeItem: (id: string) => void;
  isInReadingList: (url: string) => boolean;
}

const ReadingListContext = createContext<ReadingListContextValue | null>(null);

function persist(items: ReadingListItem[]) {
  chrome.storage.local.set({ [STORAGE_KEY]: items }, () => {
    if (chrome.runtime.lastError) {
      console.error('ReadingListContext: storage write failed:', chrome.runtime.lastError.message);
    }
  });
}

export function ReadingListProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.error('ReadingListContext: load failed:', chrome.runtime.lastError.message);
        return;
      }
      const stored = result[STORAGE_KEY];
      if (Array.isArray(stored)) setItems(stored);
    });
  }, []);

  const addItem = useCallback(async (url: string, title: string, sourceBookmarkId?: string) => {
    const existing = itemsRef.current.find(i => i.url === url);
    if (existing) return;

    const newItem: ReadingListItem = {
      id: crypto.randomUUID(),
      url,
      title,
      addedAt: Date.now(),
      status: 'unread',
      sourceBookmarkId,
      cachedContent: undefined,
      cachedTitle: null,
      cachedByline: null,
    };

    const next = [newItem, ...itemsRef.current];
    setItems(next);
    persist(next);

    const parsed = await fetchAndParse(url);
    setItems(prev => {
      const updated = prev.map(i =>
        i.id === newItem.id
          ? {
              ...i,
              cachedContent: parsed ? parsed.content : null,
              cachedTitle: parsed ? parsed.title : null,
              cachedByline: parsed ? parsed.byline : null,
            }
          : i
      );
      persist(updated);
      return updated;
    });
  }, []);

  const archiveItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, status: 'archived' as const } : i);
      persist(next);
      return next;
    });
  }, []);

  const unarchiveItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, status: 'unread' as const } : i);
      persist(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const isInReadingList = useCallback((url: string) => {
    return items.some(i => i.url === url);
  }, [items]); // must depend on items so BookmarkItem re-renders when list changes

  return (
    <ReadingListContext.Provider value={{
      items, addItem, archiveItem, unarchiveItem, removeItem, isInReadingList,
    }}>
      {children}
    </ReadingListContext.Provider>
  );
}

export function useReadingList(): ReadingListContextValue {
  const ctx = useContext(ReadingListContext);
  if (!ctx) throw new Error('useReadingList must be used within ReadingListProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/ReadingListContext.tsx
git commit -m "feat: add ReadingListContext with storage persistence and fetch-on-add"
```

---

## Task 5: CSS for reading list

**Files:**
- Create: `src/styles/reading-list.css`

- [ ] **Step 1: Create the stylesheet**

```css
/* =============================================
   Reading List — split layout + reader styles
   ============================================= */

/* View container */
.reading-list-view {
  display: flex;
  height: calc(100vh - 52px); /* below topbar */
  overflow: hidden;
}

/* ---- Left panel ---- */
.rl-panel {
  width: 30%;
  min-width: 240px;
  max-width: 360px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rl-panel-header {
  padding: 16px 16px 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  flex-shrink: 0;
}

.rl-quick-add {
  display: flex;
  gap: 6px;
  padding: 0 12px 12px;
  flex-shrink: 0;
}

.rl-quick-add-input {
  flex: 1;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 12px;
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.15s;
}

.rl-quick-add-input:focus {
  border-color: var(--accent);
}

.rl-quick-add-btn {
  padding: 7px 12px;
  border-radius: 6px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.rl-quick-add-btn:hover {
  background: var(--accent-hover);
}

.rl-section-label {
  padding: 6px 16px 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  text-transform: uppercase;
  flex-shrink: 0;
}

.rl-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.rl-list::-webkit-scrollbar { width: 4px; }
.rl-list::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 2px; }
.rl-list::-webkit-scrollbar-track { background: transparent; }

.rl-empty-panel {
  padding: 24px 16px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.6;
}

/* ---- List item ---- */
.rl-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.12s, border-color 0.12s;
  margin-bottom: 2px;
  position: relative;
}

.rl-item:hover {
  background: var(--bg-tertiary);
}

.rl-item.is-active {
  background: var(--accent-light);
  border-color: var(--accent);
}

.theme-dark .rl-item.is-active {
  background: rgba(37, 99, 235, 0.18);
  border-color: var(--accent);
}

.rl-item.is-archived .rl-item-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.rl-item-body {
  flex: 1;
  min-width: 0;
}

.rl-item-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.rl-item-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.rl-item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.rl-item:hover .rl-item-actions {
  opacity: 1;
}

.rl-item-action-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.12s, color 0.12s;
}

.rl-item-action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.rl-item-action-btn.danger:hover {
  color: #ef4444;
}

/* Shimmer for item fetching state */
.rl-item-fetching::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 7px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: rl-shimmer 1.5s infinite;
  pointer-events: none;
}

@keyframes rl-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ---- Reader panel ---- */
.rl-reader {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  display: flex;
  flex-direction: column;
}

.rl-reader::-webkit-scrollbar { width: 6px; }
.rl-reader::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
.rl-reader::-webkit-scrollbar-track { background: transparent; }

/* Empty state / welcome */
.rl-reader-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 40px;
}

.rl-reader-empty svg {
  opacity: 0.3;
}

.rl-reader-empty p {
  font-size: 14px;
  line-height: 1.6;
  max-width: 340px;
  margin: 0;
}

/* Shimmer (content loading) */
.rl-reader-shimmer {
  max-width: 680px;
  width: 100%;
}

.rl-shimmer-line {
  height: 16px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  margin-bottom: 12px;
  animation: rl-shimmer 1.5s infinite;
  background-size: 200% 100%;
  background-image: linear-gradient(90deg, var(--bg-tertiary) 0%, var(--border) 50%, var(--bg-tertiary) 100%);
}

/* Error / unavailable */
.rl-reader-unavailable {
  max-width: 680px;
  padding: 24px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.rl-reader-unavailable a {
  color: var(--accent);
  text-decoration: none;
}

.rl-reader-unavailable a:hover {
  text-decoration: underline;
}

/* Article header */
.rl-article-header {
  max-width: 680px;
  margin-bottom: 24px;
}

.rl-article-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text-primary);
  margin: 0 0 10px;
}

.rl-article-byline {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

/* Article body */
.rl-article-content {
  max-width: 680px;
  font-size: 18px;
  line-height: 1.7;
  color: var(--text-secondary);
  flex: 1;
}

.rl-article-content p { margin: 0 0 1.2em; }
.rl-article-content h1,
.rl-article-content h2,
.rl-article-content h3 {
  color: var(--text-primary);
  margin: 1.6em 0 0.6em;
  line-height: 1.3;
}
.rl-article-content a { color: var(--accent); text-decoration: underline; }
.rl-article-content blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 16px;
  margin: 1.2em 0;
  color: var(--text-muted);
  font-style: italic;
}
.rl-article-content img { max-width: 100%; border-radius: 6px; margin: 1em 0; }
.rl-article-content pre {
  background: var(--bg-tertiary);
  border-radius: 6px;
  padding: 14px 16px;
  overflow-x: auto;
  font-size: 14px;
}
.rl-article-content code {
  background: var(--bg-tertiary);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 0.9em;
}
.rl-article-content pre code { background: none; padding: 0; }

/* Reader action bar */
.rl-reader-actions {
  max-width: 680px;
  display: flex;
  gap: 10px;
  padding: 20px 0 8px;
  margin-top: 32px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.rl-action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: var(--font-body);
}

.rl-action-btn.primary {
  background: var(--accent);
  color: #fff;
}

.rl-action-btn.primary:hover {
  background: var(--accent-hover);
}

.rl-action-btn.secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rl-action-btn.secondary:hover {
  background: var(--border);
}

/* BookmarkItem — reading list button */
.bookmark-readlist {
  position: absolute;
  top: 6px;
  right: 76px; /* left of tag button */
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 2;
}

.bookmark-item-wrapper:hover .bookmark-readlist,
.bookmark-readlist.is-saved {
  opacity: 1;
}

.bookmark-readlist.is-saved {
  background: var(--accent-hover);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/reading-list.css
git commit -m "feat: add reading list CSS styles"
```

---

## Task 6: ReadingListItem component

**Files:**
- Create: `src/components/ReadingListItem.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { getHostname } from '@/utils/bookmarks';
import { relativeTime } from '@/utils/time';
import { useSettings } from '@/context/SettingsContext';
import type { ReadingListItem as RLItem } from '@/types/reading-list';

interface Props {
  item: RLItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onRemove: (id: string) => void;
}

function ReadingListItem({ item, isActive, onSelect, onArchive, onUnarchive, onRemove }: Props) {
  const { settings } = useSettings();
  const hostname = getHostname(item.url);
  const isFetching = item.cachedContent === undefined;
  const isArchived = item.status === 'archived';

  const classes = [
    'rl-item',
    isActive ? 'is-active' : '',
    isArchived ? 'is-archived' : '',
    isFetching ? 'rl-item-fetching' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={() => onSelect(item.id)}>
      <div className="rl-item-body">
        <div className="rl-item-title" title={item.title}>{item.title}</div>
        <div className="rl-item-meta">{hostname} · {relativeTime(item.addedAt, settings.language)}</div>
      </div>
      <div className="rl-item-actions">
        {isArchived ? (
          <button
            type="button"
            className="rl-item-action-btn"
            title="Move back to unread"
            onClick={e => { e.stopPropagation(); onUnarchive(item.id); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 14-4-4 4-4"/>
              <path d="M5 10h11a4 4 0 0 1 0 8h-1"/>
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="rl-item-action-btn"
            title="Archive"
            onClick={e => { e.stopPropagation(); onArchive(item.id); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="5" x="2" y="3" rx="1"/>
              <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
              <path d="M10 12h4"/>
            </svg>
          </button>
        )}
        <button
          type="button"
          className="rl-item-action-btn danger"
          title="Remove from reading list"
          onClick={e => { e.stopPropagation(); onRemove(item.id); }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ReadingListItem;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ReadingListItem.tsx
git commit -m "feat: add ReadingListItem component"
```

---

## Task 7: ReadingListPanel component (left panel)

**Files:**
- Create: `src/components/ReadingListPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState } from 'react';
import { useReadingList } from '@/context/ReadingListContext';
import { useUI } from '@/context/UIContext';
import ReadingListItemRow from '@/components/ReadingListItem';
import type { ReadingListItem } from '@/types/reading-list';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function ReadingListPanel({ selectedId, onSelect }: Props) {
  const { items, addItem, archiveItem, unarchiveItem, removeItem } = useReadingList();
  const { showToast } = useUI();
  const [urlInput, setUrlInput] = useState('');

  const unread = items.filter(i => i.status === 'unread');
  const archived = items.filter(i => i.status === 'archived');

  const handleAdd = async () => {
    const url = urlInput.trim();
    if (!url) return;
    const alreadyIn = items.some(i => i.url === url);
    if (alreadyIn) {
      showToast('Already in reading list');
      return;
    }
    const title = (() => {
      try { return new URL(url).hostname; } catch { return url; }
    })();
    setUrlInput('');
    await addItem(url, title);
    showToast('Added to reading list');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleArchive = (id: string) => {
    archiveItem(id);
    if (selectedId === id) {
      const nextUnread = unread.find(i => i.id !== id);
      if (nextUnread) onSelect(nextUnread.id);
    }
  };

  return (
    <div className="rl-panel">
      <div className="rl-panel-header">Reading List</div>

      <div className="rl-quick-add">
        <input
          className="rl-quick-add-input"
          type="url"
          placeholder="Paste a URL..."
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="rl-quick-add-btn" onClick={handleAdd}>Add</button>
      </div>

      <div className="rl-list">
        <div className="rl-section-label">Unread ({unread.length})</div>

        {unread.length === 0 && (
          <div className="rl-empty-panel">
            No articles yet. Add one above or use the bookmark button.
          </div>
        )}

        {unread.map(item => (
          <ReadingListItemRow
            key={item.id}
            item={item}
            isActive={selectedId === item.id}
            onSelect={onSelect}
            onArchive={handleArchive}
            onUnarchive={unarchiveItem}
            onRemove={removeItem}
          />
        ))}

        {archived.length > 0 && (
          <>
            <div className="rl-section-label" style={{ marginTop: '12px' }}>
              Archive ({archived.length})
            </div>
            {archived.map((item: ReadingListItem) => (
              <ReadingListItemRow
                key={item.id}
                item={item}
                isActive={selectedId === item.id}
                onSelect={onSelect}
                onArchive={archiveItem}
                onUnarchive={unarchiveItem}
                onRemove={removeItem}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default ReadingListPanel;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ReadingListPanel.tsx
git commit -m "feat: add ReadingListPanel with quick-add and archive sections"
```

---

## Task 8: ReaderPanel component (right panel)

**Files:**
- Create: `src/components/ReaderPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import type { ReadingListItem } from '@/types/reading-list';

interface Props {
  item: ReadingListItem | null;
  allItemsEmpty: boolean;
  onMarkRead: (id: string) => void;
}

function ReaderPanel({ item, allItemsEmpty, onMarkRead }: Props) {
  if (!item) {
    return (
      <div className="rl-reader">
        <div className="rl-reader-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          {allItemsEmpty ? (
            <p>Your reading list is empty. Add articles with the bookmark button or paste a URL.</p>
          ) : (
            <p>Select an article to read.</p>
          )}
        </div>
      </div>
    );
  }

  const isFetching = item.cachedContent === undefined;
  const hasCached = typeof item.cachedContent === 'string';

  return (
    <div className="rl-reader">
      {isFetching && (
        <div className="rl-reader-shimmer">
          <div className="rl-shimmer-line" style={{ width: '60%', height: '28px', marginBottom: '16px' }} />
          <div className="rl-shimmer-line" style={{ width: '35%', marginBottom: '28px' }} />
          {[100, 95, 88, 92, 85, 78, 90].map((w, i) => (
            <div key={i} className="rl-shimmer-line" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {!isFetching && !hasCached && (
        <div className="rl-reader-unavailable">
          <p><strong>Content unavailable offline.</strong></p>
          <p>The article couldn't be cached. You can still read it live:</p>
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            Open {item.url} ↗
          </a>
        </div>
      )}

      {hasCached && (
        <>
          <div className="rl-article-header">
            <h1 className="rl-article-title">{item.cachedTitle || item.title}</h1>
            {item.cachedByline && (
              <p className="rl-article-byline">{item.cachedByline}</p>
            )}
          </div>

          <div
            className="rl-article-content"
            // Content was sanitized by DOMPurify at fetch time
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: item.cachedContent as string }}
          />
        </>
      )}

      {!isFetching && (
        <div className="rl-reader-actions">
          {item.status === 'unread' && (
            <button
              type="button"
              className="rl-action-btn primary"
              onClick={() => onMarkRead(item.id)}
            >
              ✓ Mark as read
            </button>
          )}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rl-action-btn secondary"
          >
            ↗ Open live
          </a>
        </div>
      )}
    </div>
  );
}

export default ReaderPanel;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ReaderPanel.tsx
git commit -m "feat: add ReaderPanel with shimmer, fallback, and article content"
```

---

## Task 9: ReadingListView (root split layout)

**Files:**
- Create: `src/components/ReadingListView.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState, useEffect } from 'react';
import { useReadingList } from '@/context/ReadingListContext';
import ReadingListPanel from '@/components/ReadingListPanel';
import ReaderPanel from '@/components/ReaderPanel';

interface Props {
  onBack: () => void;
}

function ReadingListView({ onBack: _onBack }: Props) {
  const { items, archiveItem } = useReadingList();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select first unread item on mount or when list changes
  useEffect(() => {
    if (selectedId && items.some(i => i.id === selectedId)) return;
    const first = items.find(i => i.status === 'unread');
    setSelectedId(first?.id ?? null);
  }, [items, selectedId]);

  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  const handleMarkRead = (id: string) => {
    archiveItem(id);
    const unread = items.filter(i => i.status === 'unread' && i.id !== id);
    setSelectedId(unread[0]?.id ?? null);
  };

  return (
    <div className="reading-list-view">
      <ReadingListPanel
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <ReaderPanel
        item={selectedItem}
        allItemsEmpty={items.length === 0}
        onMarkRead={handleMarkRead}
      />
    </div>
  );
}

export default ReadingListView;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ReadingListView.tsx
git commit -m "feat: add ReadingListView split layout"
```

---

## Task 10: Wire reading list into the app

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Topbar.tsx`

- [ ] **Step 1: Add 'reading' to ActiveView in src/types/index.ts**

Change line 13:

```ts
export type ActiveView = 'bookmarks' | 'domains' | 'recent' | 'ai' | 'reading';
```

- [ ] **Step 2: Add ReadingListProvider to src/main.tsx**

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsProvider } from '@/context/SettingsContext';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { UIProvider } from '@/context/UIContext';
import { TagProvider } from '@/context/TagContext';
import { ReadingListProvider } from '@/context/ReadingListContext';
import App from '@/App';
import './styles/main.css';
import './styles/tags.css';
import './styles/reading-list.css';

try {
  const mf = chrome.runtime.getManifest();
  document.title = `New Tab - ${mf.name}`;
} catch { /* dev environment */ }

const root = document.getElementById('root')!;
createRoot(root).render(
  <React.StrictMode>
    <SettingsProvider>
      <BookmarkProvider>
        <UIProvider>
          <TagProvider>
            <ReadingListProvider>
              <App />
            </ReadingListProvider>
          </TagProvider>
        </UIProvider>
      </BookmarkProvider>
    </SettingsProvider>
  </React.StrictMode>
);
```

- [ ] **Step 3: Add 'reading' view branch and R shortcut to src/App.tsx**

In `App.tsx`, add the import at the top:

```tsx
import ReadingListView from '@/components/ReadingListView';
```

In the `handleKeyDown` switch block, add a case for `'l'` after the `'a'` case. **Note:** `'r'` is already used for the Recent view — use `'l'` (for reading List) instead:

```tsx
case 'l': e.preventDefault(); setActiveView(activeView === 'reading' ? 'bookmarks' : 'reading'); break;
```

In the `<main className="main-content">` block, add after the `activeView === 'ai'` branch:

```tsx
{activeView === 'reading' && (
  <ReadingListView onBack={() => setActiveView('bookmarks')} />
)}
```

Also update the `showHeroSearch` condition:

```tsx
const showHeroSearch = activeView === 'bookmarks';
```

(This is already correct — no change needed here.)

- [ ] **Step 4: Add Reading List nav button to src/components/Topbar.tsx**

Add this button inside `<nav className="topbar-nav">`, immediately before the theme toggle button (which starts with `<button className="nav-link" onClick={toggleTheme}`):

```tsx
<button
  className={`nav-link${activeView === 'reading' ? ' active' : ''}`}
  onClick={() => setActiveView(activeView === 'reading' ? 'bookmarks' : 'reading')}
  data-tooltip={compact ? 'Reading List (L)' : undefined}
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
  {!compact && <span>Reading</span>}
</button>
```

- [ ] **Step 5: Add Reading List entry to KeyboardShortcuts.tsx**

In `src/components/KeyboardShortcuts.tsx`, add `{ key: 'L', description: 'Reading List' }` to the `SHORTCUTS` array after the `'A'` entry:

```ts
const SHORTCUTS = [
  { key: '/', description: 'Focus search' },
  { key: '?', description: 'Toggle this modal' },
  { key: 'S', description: 'Open Settings' },
  { key: 'T', description: 'Cycle theme' },
  { key: 'V', description: 'Toggle view (list/grid)' },
  { key: 'D', description: 'Domain graph' },
  { key: 'R', description: 'Recently added' },
  { key: 'A', description: 'AI Insights' },
  { key: 'L', description: 'Reading List' },
  { key: 'G', description: 'Google Apps menu' },
  { key: 'Shift + G', description: 'Google.com' },
  { key: 'Esc', description: 'Close / go back' },
];
```

- [ ] **Step 6: Build and verify no TypeScript errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/main.tsx src/App.tsx src/components/Topbar.tsx src/components/KeyboardShortcuts.tsx
git commit -m "feat: wire reading list view into app navigation"
```

---

## Task 11: BookmarkItem — Add to Reading List button

**Files:**
- Modify: `src/components/BookmarkItem.tsx`

- [ ] **Step 1: Add the reading list button to BookmarkItem**

At the top of `BookmarkItem.tsx`, add the import:

```tsx
import { useReadingList } from '@/context/ReadingListContext';
```

Inside the `BookmarkItem` function body, after the existing hook calls, add one new line:

```tsx
const { addItem, isInReadingList } = useReadingList();
```

`showToast` and `confirm` are already destructured from `useUI()` on the existing line — no change needed there.

Add a handler after `handleDelete`:

```tsx
const handleAddToReadingList = async (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (isInReadingList(bookmark.url ?? '')) {
    showToast('Already in reading list');
    return;
  }
  await addItem(bookmark.url ?? '', bookmark.title, bookmark.id);
  showToast('Added to reading list');
};
```

Then add the button inside the returned JSX, before the tag button (`{/* Tag button */}`):

```tsx
{/* Reading list button */}
<button
  type="button"
  className={`bookmark-readlist${isInReadingList(bookmark.url ?? '') ? ' is-saved' : ''}`}
  title="Add to reading list"
  onClick={handleAddToReadingList}
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="8" x2="12" y2="14"/>
    <line x1="9" y1="11" x2="15" y2="11"/>
  </svg>
</button>
```

- [ ] **Step 2: Adjust CSS position for the new button**

The existing action buttons in `main.css` use absolute positioning. With the new reading list button at `right: 76px`, verify the existing tag, pin, and delete buttons don't overlap. Check `src/styles/main.css` for `.bookmark-tag`, `.bookmark-pin`, `.bookmark-remove` rules and confirm positions are staggered correctly. If needed, adjust the reading list button's `right` value in `reading-list.css`.

The typical spacing in the existing CSS follows a pattern — each button is ~30px wide. From right to left: delete (6px), pin (~36px), tag (~66px), and the new reading list button should be at ~96px from right. Update `reading-list.css`:

```css
.bookmark-readlist {
  right: 96px; /* left of tag button, which sits at ~66px */
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build 2>&1 | tail -20
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/BookmarkItem.tsx src/styles/reading-list.css
git commit -m "feat: add reading list button to BookmarkItem"
```

---

## Task 12: Load extension and smoke test

- [ ] **Step 1: Build for extension**

```bash
npm run build
```

- [ ] **Step 2: Load in Chrome**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `dist/` folder
4. Open a new tab — the dashboard loads

- [ ] **Step 3: Smoke test the golden path**

1. Click the "Reading" nav button in the topbar — reading list view opens with empty state
2. Paste a URL into the quick-add input, press Enter — item appears in Unread list with shimmer
3. Wait a few seconds — shimmer resolves; if content was fetchable, article renders in reader panel
4. Click "✓ Mark as read" — item moves to Archive section; next unread auto-selected (or empty state)
5. Click "↩ Unarchive" on an archived item — it returns to Unread
6. Press `R` on the keyboard from the main bookmarks view — navigates to Reading List
7. Press `Escape` — returns to bookmarks view
8. Hover a bookmark item — "Add to reading list" accent button appears; click it → toast "Added to reading list"
9. Hover same bookmark again — button shows filled (saved) state; click → toast "Already in reading list"

- [ ] **Step 4: Run tests one final time**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: reading list mode — complete implementation"
```
