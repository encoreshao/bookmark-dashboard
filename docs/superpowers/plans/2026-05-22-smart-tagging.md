# Smart Tagging & Cross-referencing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-tag support to the bookmark dashboard — inline tag chips on every bookmark row, a floating tag picker popup, tags in the sidebar for filtering, and AND-logic tag filter strip.

**Architecture:** Tags are stored in `chrome.storage.local` (separate from Chrome's read-only `BookmarkTreeNode`). A new `TagContext` owns all tag state and storage. A `TagPicker` portal component floats to the right of the tag icon button in each bookmark's action bar.

**Tech Stack:** React 18, TypeScript, Vite, Chrome Extension MV3, `chrome.storage.local`, `ReactDOM.createPortal`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/types/index.ts` | Modify | Add `TagMap`, `TagColorMap` |
| `src/utils/tags.ts` | Create | Pure functions: `normalizeTag`, `assignTagColor`, `getTagCounts` |
| `src/context/TagContext.tsx` | Create | Tag storage, CRUD, `activeTags` filter state |
| `src/main.tsx` | Modify | Wrap app in `TagProvider`, import `tags.css` |
| `src/styles/tags.css` | Create | All CSS for chips, picker, filter strip, sidebar tags |
| `src/components/TagPicker.tsx` | Create | Floating popup (portal) — checklist + autocomplete |
| `src/components/TagFilterStrip.tsx` | Create | Active-tag filter banner inside `BookmarkView` |
| `src/components/BookmarkItem.tsx` | Modify | Add chip row + tag icon button in all 3 display modes |
| `src/components/BookmarkView.tsx` | Modify | Apply `activeTags` filter before `collectFolders`, render `TagFilterStrip` |
| `src/components/FolderSidebar.tsx` | Modify | Add Tags section below Folders |

---

## Task 1: Types + Pure Utility Functions

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/utils/tags.ts`

- [ ] **Step 1: Add types to `src/types/index.ts`**

Append after the last export:

```typescript
export type TagMap = Record<string, string[]>;    // bookmarkId → tag names
export type TagColorMap = Record<string, string>; // tag name → color string
```

- [ ] **Step 2: Create `src/utils/tags.ts`**

```typescript
import type { TagMap, TagColorMap } from '@/types';

export const TAG_PALETTE = [
  '#cba6f7', // purple
  '#89b4fa', // blue
  '#a6e3a1', // green
  '#f38ba8', // pink
  '#fab387', // peach
  '#89dceb', // teal
  '#f9e2af', // yellow
  '#b4befe', // lavender
  '#94e2d5', // cyan
  '#eba0ac', // mauve
];

/** Lowercase, trim, collapse spaces to hyphens */
export function normalizeTag(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Pick the next unused palette color. Falls back to cycling by count
 * if all palette colors are taken.
 */
export function assignTagColor(existingColors: TagColorMap): string {
  const usedColors = new Set(Object.values(existingColors));
  const available = TAG_PALETTE.find(c => !usedColors.has(c));
  return available ?? TAG_PALETTE[Object.keys(existingColors).length % TAG_PALETTE.length];
}

/** Count how many bookmarks in tagMap have each tag. */
export function getTagCounts(tagMap: TagMap): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tags of Object.values(tagMap)) {
    for (const tag of tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}
```

- [ ] **Step 3: Verify TypeScript accepts the new files**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/utils/tags.ts
git commit -m "feat: add TagMap/TagColorMap types and tag utility functions"
```

---

## Task 2: TagContext

**Files:**
- Create: `src/context/TagContext.tsx`

- [ ] **Step 1: Create `src/context/TagContext.tsx`**

```typescript
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { TagMap, TagColorMap } from '@/types';
import { normalizeTag, assignTagColor } from '@/utils/tags';

interface TagContextValue {
  tagMap: TagMap;
  tagColors: TagColorMap;
  allTags: string[];
  activeTags: string[];
  getTagsForBookmark: (id: string) => string[];
  setTagsForBookmark: (id: string, tags: string[]) => void;
  toggleActiveTag: (name: string) => void;
  clearActiveTags: () => void;
}

const TagContext = createContext<TagContextValue | null>(null);

export function TagProvider({ children }: { children: React.ReactNode }) {
  const [tagMap, setTagMap] = useState<TagMap>({});
  const [tagColors, setTagColors] = useState<TagColorMap>({});
  const [activeTags, setActiveTags] = useState<string[]>([]);

  useEffect(() => {
    chrome.storage.local.get(['bd_bookmarkTags', 'bd_tagColors'], (result) => {
      if (result.bd_bookmarkTags && typeof result.bd_bookmarkTags === 'object') {
        setTagMap(result.bd_bookmarkTags);
      }
      if (result.bd_tagColors && typeof result.bd_tagColors === 'object') {
        setTagColors(result.bd_tagColors);
      }
    });
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const tags of Object.values(tagMap)) {
      for (const t of tags) tagSet.add(t);
    }
    return [...tagSet].sort();
  }, [tagMap]);

  const getTagsForBookmark = useCallback((id: string): string[] => {
    return tagMap[id] ?? [];
  }, [tagMap]);

  const setTagsForBookmark = useCallback((id: string, tags: string[]) => {
    const normalized = [...new Set(tags.map(normalizeTag).filter(Boolean))];

    // Assign colors to any new tags before updating state
    const newColors = { ...tagColors };
    let colorsDirty = false;
    for (const tag of normalized) {
      if (!newColors[tag]) {
        newColors[tag] = assignTagColor(newColors);
        colorsDirty = true;
      }
    }

    const newMap = { ...tagMap, [id]: normalized };
    setTagMap(newMap);
    chrome.storage.local.set({ bd_bookmarkTags: newMap });

    if (colorsDirty) {
      setTagColors(newColors);
      chrome.storage.local.set({ bd_tagColors: newColors });
    }
  }, [tagMap, tagColors]);

  const toggleActiveTag = useCallback((name: string) => {
    setActiveTags(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  }, []);

  const clearActiveTags = useCallback(() => setActiveTags([]), []);

  return (
    <TagContext.Provider value={{
      tagMap, tagColors, allTags, activeTags,
      getTagsForBookmark, setTagsForBookmark,
      toggleActiveTag, clearActiveTags,
    }}>
      {children}
    </TagContext.Provider>
  );
}

export function useTags(): TagContextValue {
  const ctx = useContext(TagContext);
  if (!ctx) throw new Error('useTags must be used within TagProvider');
  return ctx;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/context/TagContext.tsx
git commit -m "feat: add TagContext with chrome.storage persistence and activeTags filter state"
```

---

## Task 3: Wire TagProvider + Import CSS

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Update `src/main.tsx`**

Replace the file content:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsProvider } from '@/context/SettingsContext';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { UIProvider } from '@/context/UIContext';
import { TagProvider } from '@/context/TagContext';
import App from '@/App';
import './styles/main.css';
import './styles/tags.css';

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
            <App />
          </TagProvider>
        </UIProvider>
      </BookmarkProvider>
    </SettingsProvider>
  </React.StrictMode>
);
```

- [ ] **Step 2: Create a placeholder `src/styles/tags.css` so the import doesn't error**

```css
/* tag styles — populated in Task 4 */
```

- [ ] **Step 3: Run build to confirm no errors**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx src/styles/tags.css
git commit -m "feat: wrap app in TagProvider, add tags.css import"
```

---

## Task 4: Tags CSS

**Files:**
- Modify: `src/styles/tags.css`

- [ ] **Step 1: Replace `src/styles/tags.css` with full styles**

```css
/* ── Tag chips on bookmark rows ── */
.bm-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
  align-items: center;
}

.bm-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 500;
  background: var(--bg-tertiary);
  cursor: default;
  line-height: 1.6;
  transition: opacity 0.12s;
}

.bm-tag-add {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 10px;
  border: 1px dashed var(--border);
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1.6;
  transition: border-color 0.15s, color 0.15s;
}
.bm-tag-add:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* ── Tag icon button in action bar ── */
.bookmark-tag {
  position: absolute;
  top: 8px;
  right: 56px;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  z-index: 1;
}
.bookmark-tag svg {
  width: 13px;
  height: 13px;
}
.bookmark-item-wrapper:hover .bookmark-tag {
  display: flex;
}
.bookmark-tag:hover,
.bookmark-tag.is-active {
  background: var(--accent);
  color: #fff;
}

/* Adjust existing pin/remove positions to make room for tag button */
.bookmark-item-wrapper .bookmark-pin {
  right: 30px;
}
.bookmark-item-wrapper .bookmark-remove {
  right: 4px;
}

/* ── Floating TagPicker popup ── */
.tag-picker {
  position: fixed;
  width: 220px;
  background: var(--bg-secondary);
  border: 1px solid var(--accent);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  z-index: 9000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tag-picker-header {
  padding: 8px 12px 6px;
  font-size: 10px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tag-picker-header strong {
  color: var(--text-primary);
  font-weight: 500;
}

.tag-picker-input-wrap {
  padding: 8px 10px 4px;
}
.tag-picker-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-primary);
  font-size: 12px;
  padding: 5px 9px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}
.tag-picker-input:focus {
  border-color: var(--accent);
}

.tag-picker-list {
  padding: 4px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 200px;
  overflow-y: auto;
}

.tag-picker-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 6px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.1s;
}
.tag-picker-item:hover {
  background: var(--bg-tertiary);
}

.tag-picker-check {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  transition: background 0.12s, border-color 0.12s;
}
.tag-picker-item.is-checked .tag-picker-check {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.tag-picker-item.is-checked {
  color: var(--text-primary);
}

.tag-picker-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-picker-create {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 6px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: var(--text-muted);
  transition: background 0.1s, color 0.1s;
}
.tag-picker-create:hover {
  background: var(--bg-tertiary);
  color: var(--accent);
}

/* ── Tag filter strip ── */
.tag-filter-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}
.tag-filter-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin-right: 2px;
}
.tag-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid;
  cursor: pointer;
  transition: opacity 0.12s;
}
.tag-filter-chip:hover {
  opacity: 0.75;
}
.tag-filter-chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.tag-filter-clear {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.12s;
}
.tag-filter-clear:hover {
  color: #f38ba8;
}

/* ── Sidebar Tags section ── */
.sidebar-tags-section {
  padding: 0;
}
.sidebar-tags-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 4px;
}
.sidebar-tags-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}
.sidebar-tag-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 14px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 0;
}
.sidebar-tag-item:hover {
  background: var(--bg-tertiary);
}
.sidebar-tag-item.is-active {
  background: var(--bg-tertiary);
  font-weight: 500;
}
.sidebar-tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sidebar-tag-count {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 1px 5px;
  border-radius: 8px;
}
.sidebar-new-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 5px 14px 0;
  padding: 4px 8px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.sidebar-new-tag:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.sidebar-new-tag-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 11px;
  padding: 4px 8px;
  outline: none;
  font-family: inherit;
  margin: 5px 14px;
  box-sizing: border-box;
  width: calc(100% - 28px);
}
```

- [ ] **Step 2: Build to verify CSS is valid**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tags.css
git commit -m "feat: add CSS for tag chips, picker popup, filter strip, and sidebar tags"
```

---

## Task 5: TagPicker Component

**Files:**
- Create: `src/components/TagPicker.tsx`

- [ ] **Step 1: Create `src/components/TagPicker.tsx`**

```tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTags } from '@/context/TagContext';
import { normalizeTag } from '@/utils/tags';

interface Props {
  bookmarkId: string;
  bookmarkTitle: string;
  anchorEl: HTMLElement;
  onClose: () => void;
}

function TagPicker({ bookmarkId, bookmarkTitle, anchorEl, onClose }: Props) {
  const { allTags, tagColors, getTagsForBookmark, setTagsForBookmark } = useTags();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const applied = getTagsForBookmark(bookmarkId);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorEl, onClose]);

  // Position the picker to the right of the anchor element
  const rect = anchorEl.getBoundingClientRect();
  const pickerWidth = 220;
  const gap = 6;
  let top = rect.top;
  let left = rect.right + gap;

  // If it would overflow right, flip left
  if (left + pickerWidth > window.innerWidth - 8) {
    left = rect.left - pickerWidth - gap;
  }
  // If it would overflow bottom, shift up
  const estimatedHeight = 320;
  if (top + estimatedHeight > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - estimatedHeight - 8);
  }

  const normalizedQuery = normalizeTag(query);
  const filtered = allTags.filter(t =>
    t.includes(normalizedQuery)
  );
  const canCreate =
    normalizedQuery.length > 0 &&
    !allTags.includes(normalizedQuery);

  const toggleTag = useCallback((tag: string) => {
    const next = applied.includes(tag)
      ? applied.filter(t => t !== tag)
      : [...applied, tag];
    setTagsForBookmark(bookmarkId, next);
  }, [applied, bookmarkId, setTagsForBookmark]);

  const createAndApply = useCallback(() => {
    if (!normalizedQuery) return;
    setTagsForBookmark(bookmarkId, [...applied, normalizedQuery]);
    setQuery('');
    inputRef.current?.focus();
  }, [normalizedQuery, applied, bookmarkId, setTagsForBookmark]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filtered.length > 0 && !canCreate) {
        toggleTag(filtered[0]);
        setQuery('');
      } else if (canCreate) {
        createAndApply();
      }
    } else if (e.key === 'Backspace' && query === '' && applied.length > 0) {
      setTagsForBookmark(bookmarkId, applied.slice(0, -1));
    }
  };

  return createPortal(
    <div
      ref={pickerRef}
      className="tag-picker"
      style={{ top, left }}
    >
      <div className="tag-picker-header">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2z"/>
          <circle cx="7" cy="7" r="1" fill="currentColor"/>
        </svg>
        Tags · <strong>{bookmarkTitle}</strong>
      </div>
      <div className="tag-picker-input-wrap">
        <input
          ref={inputRef}
          className="tag-picker-input"
          placeholder="Search or create tag…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="tag-picker-list">
        {filtered.map(tag => (
          <div
            key={tag}
            className={`tag-picker-item${applied.includes(tag) ? ' is-checked' : ''}`}
            onClick={() => { toggleTag(tag); setQuery(''); }}
          >
            <div className="tag-picker-check">
              {applied.includes(tag) && '✓'}
            </div>
            <div className="tag-picker-dot" style={{ background: tagColors[tag] ?? '#89b4fa' }} />
            <span style={{ color: tagColors[tag] ?? 'inherit' }}>{tag}</span>
          </div>
        ))}
        {canCreate && (
          <div className="tag-picker-create" onClick={createAndApply}>
            <span>+</span>
            <span>Create &ldquo;{normalizedQuery}&rdquo;</span>
          </div>
        )}
        {filtered.length === 0 && !canCreate && (
          <div style={{ padding: '6px 6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            No tags yet — type to create one
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default TagPicker;
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TagPicker.tsx
git commit -m "feat: add TagPicker floating popup with checklist and autocomplete"
```

---

## Task 6: Update BookmarkItem — Tag Chips + Tag Button

**Files:**
- Modify: `src/components/BookmarkItem.tsx`

- [ ] **Step 1: Replace `src/components/BookmarkItem.tsx`**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useUI } from '@/context/UIContext';
import { useTags } from '@/context/TagContext';
import { createTranslator } from '@/utils/i18n';
import { getFaviconUrl, getHostname, getDomainColor } from '@/utils/bookmarks';
import TagPicker from '@/components/TagPicker';
import type { BookmarkNode } from '@/types';

interface Props {
  bookmark: BookmarkNode;
  isPinned?: boolean;
  showPin?: boolean;
  ogImageUrl?: string | null;
}

function BookmarkItem({ bookmark, isPinned = false, showPin = true, ogImageUrl }: Props) {
  const { settings, saveSetting } = useSettings();
  const { removeBookmark } = useBookmarks();
  const { confirm, showToast } = useUI();
  const { tagColors, getTagsForBookmark } = useTags();
  const t = createTranslator(settings.language);
  const [dragging, setDragging] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const tagBtnRef = useRef<HTMLButtonElement>(null);
  const displayMode = settings.displayMode;
  const hostname = getHostname(bookmark.url ?? '');
  const initials = hostname.replace(/^www\./, '').slice(0, 2).toUpperCase() || '??';
  const domainColor = getDomainColor(hostname);
  const [ogImgError, setOgImgError] = useState(false);
  useEffect(() => { setOgImgError(false); }, [ogImageUrl]);
  const pinned = settings.pinnedIds.includes(bookmark.id);
  const tags = getTagsForBookmark(bookmark.id);

  const togglePin = () => {
    const wasPinned = pinned;
    const next = wasPinned
      ? settings.pinnedIds.filter(id => id !== bookmark.id)
      : [...settings.pinnedIds, bookmark.id];
    saveSetting('pinnedIds', next);
    showToast(wasPinned ? t('unpinned') : t('pinned'));
  };

  const handleDelete = async () => {
    const ok = await confirm(t('remove-bookmark'), bookmark.title);
    if (!ok) return;
    removeBookmark(bookmark.id);
    showToast(t('removed'));
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', bookmark.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDragging(true), 0);
  };
  const handleDragEnd = () => setDragging(false);

  const favicon = getFaviconUrl(bookmark.url ?? '');

  const tagChips = (
    <div className="bm-tag-row">
      {tags.map(tag => (
        <span
          key={tag}
          className="bm-tag"
          style={{ color: tagColors[tag] ?? 'inherit' }}
        >
          {tag}
        </span>
      ))}
      <span className="bm-tag-add" onClick={() => setPickerOpen(true)}>+ tag</span>
    </div>
  );

  return (
    <div
      className={`bookmark-item-wrapper${isPinned ? ' is-pinned' : ''}${dragging ? ' bm-dragging' : ''}`}
      style={{ '--domain-color': domainColor } as React.CSSProperties}
      draggable
      data-bookmark-id={bookmark.id}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <a
        className="bookmark-item"
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        title={bookmark.title}
      >
        {displayMode === 'grid' && (
          <>
            {ogImageUrl === undefined && (
              <div className="bookmark-og-shimmer" />
            )}
            {ogImageUrl !== undefined && ogImageUrl !== null && ogImageUrl !== '' && !ogImgError && (
              <img
                className="bookmark-og-image"
                src={ogImageUrl}
                alt=""
                loading="lazy"
                onError={() => setOgImgError(true)}
              />
            )}
            {ogImageUrl !== undefined && (!ogImageUrl || ogImgError) && (
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
              {tagChips}
            </div>
          </>
        )}
        {displayMode === 'list' && (
          <>
            <img className="bookmark-favicon" src={favicon} alt="" loading="lazy"
                 onError={e => (e.currentTarget.style.display = 'none')} />
            <div className="bookmark-list-content">
              <span className="bookmark-title">{bookmark.title}</span>
              <span className="bookmark-url">{hostname}</span>
              {tagChips}
            </div>
          </>
        )}
        {displayMode === 'compact' && (
          <>
            <span className="bookmark-domain-dot" />
            <span className="bookmark-title">{bookmark.title}</span>
            {tags.length > 0 && (
              <div className="bm-tag-row" style={{ marginLeft: 'auto', marginTop: 0, flexWrap: 'nowrap' }}>
                {tags.slice(0, 2).map(tag => (
                  <span key={tag} className="bm-tag" style={{ color: tagColors[tag] ?? 'inherit' }}>
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="bm-tag" style={{ color: 'var(--text-muted)' }}>+{tags.length - 2}</span>
                )}
              </div>
            )}
          </>
        )}
      </a>

      {/* Tag button */}
      <button
        ref={tagBtnRef}
        className={`bookmark-tag${pickerOpen ? ' is-active' : ''}`}
        title="Manage tags"
        onClick={e => { e.preventDefault(); setPickerOpen(o => !o); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2z"/>
          <circle cx="7" cy="7" r="1" fill="currentColor"/>
        </svg>
      </button>

      {showPin && (
        <button
          className={`bookmark-pin${pinned ? ' is-pinned' : ''}`}
          title={pinned ? t('unpinned') : t('pinned')}
          onClick={togglePin}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" x2="12" y1="2" y2="22"/>
            <polyline points="12 2 19 9 12 16 5 9 12 2"/>
          </svg>
        </button>
      )}
      <button className="bookmark-remove" title={t('remove-bookmark')} onClick={handleDelete}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
      </button>

      {/* Floating tag picker */}
      {pickerOpen && tagBtnRef.current && (
        <TagPicker
          bookmarkId={bookmark.id}
          bookmarkTitle={bookmark.title}
          anchorEl={tagBtnRef.current}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default BookmarkItem;
```

- [ ] **Step 2: Build and check for errors**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BookmarkItem.tsx
git commit -m "feat: add tag chips and tag picker button to BookmarkItem"
```

---

## Task 7: TagFilterStrip Component

**Files:**
- Create: `src/components/TagFilterStrip.tsx`

- [ ] **Step 1: Create `src/components/TagFilterStrip.tsx`**

```tsx
import { useTags } from '@/context/TagContext';

function TagFilterStrip() {
  const { activeTags, tagColors, toggleActiveTag, clearActiveTags } = useTags();

  if (activeTags.length === 0) return null;

  return (
    <div className="tag-filter-strip">
      <span className="tag-filter-label">Filter:</span>
      {activeTags.map(tag => (
        <button
          key={tag}
          className="tag-filter-chip"
          style={{
            color: tagColors[tag] ?? 'var(--text-primary)',
            borderColor: tagColors[tag] ?? 'var(--border)',
            background: 'transparent',
          }}
          onClick={() => toggleActiveTag(tag)}
          title={`Remove "${tag}" filter`}
        >
          <span
            className="tag-filter-chip-dot"
            style={{ background: tagColors[tag] ?? 'var(--text-muted)' }}
          />
          {tag}
          <span style={{ opacity: 0.6, marginLeft: 2 }}>✕</span>
        </button>
      ))}
      <button className="tag-filter-clear" onClick={clearActiveTags}>
        Clear all
      </button>
    </div>
  );
}

export default TagFilterStrip;
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TagFilterStrip.tsx
git commit -m "feat: add TagFilterStrip component for active tag filter banner"
```

---

## Task 8: Update BookmarkView — Tag Filtering + TagFilterStrip

**Files:**
- Modify: `src/components/BookmarkView.tsx`

- [ ] **Step 1: Replace `src/components/BookmarkView.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useUI } from '@/context/UIContext';
import { useTags } from '@/context/TagContext';
import { createTranslator } from '@/utils/i18n';
import { collectFolders, filterFolders, findBookmarkById } from '@/utils/bookmarks';
import BookmarkItem from '@/components/BookmarkItem';
import TagFilterStrip from '@/components/TagFilterStrip';
import { useOGImages } from '@/hooks/useOGImages';
import type { BookmarkNode, OGImageCache } from '@/types';

function PinnedSection({ pinnedIds, ogImages }: { pinnedIds: string[]; ogImages: OGImageCache }) {
  const { allBookmarks } = useBookmarks();
  const { settings } = useSettings();
  if (pinnedIds.length === 0) return null;
  const viewClass = settings.displayMode === 'grid' ? 'view-grid'
    : settings.displayMode === 'compact' ? 'view-compact'
    : 'view-list';

  const items = pinnedIds
    .map(id => findBookmarkById(allBookmarks, id))
    .filter((bm): bm is BookmarkNode => !!bm);

  if (items.length === 0) return null;

  return (
    <div className={`bookmark-folder ${viewClass}`}>
      <div className="folder-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" className="folder-icon">
          <line x1="12" x2="12" y1="2" y2="22"/>
          <polyline points="12 2 19 9 12 16 5 9 12 2"/>
        </svg>
        <span className="folder-name">Pinned</span>
        <span className="folder-count">{items.length}</span>
      </div>
      <div className="folder-items">
        {items.map(bm => (
          <BookmarkItem key={bm.id} bookmark={bm} isPinned showPin ogImageUrl={ogImages[bm.id]} />
        ))}
      </div>
    </div>
  );
}

function FolderSection({
  folder,
  ogImages,
}: {
  folder: { id: string; title: string; items: BookmarkNode[] };
  ogImages: OGImageCache;
}) {
  const { settings } = useSettings();
  const { moveBookmark } = useBookmarks();
  const { showToast } = useUI();
  const t = createTranslator(settings.language);
  const [collapsed, setCollapsed] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const viewClass = settings.displayMode === 'grid' ? 'view-grid'
    : settings.displayMode === 'compact' ? 'view-compact'
    : 'view-list';

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('text/plain')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDropActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const bookmarkId = e.dataTransfer.getData('text/plain');
    if (!bookmarkId || !folder.id) return;
    moveBookmark(bookmarkId, folder.id);
    showToast(t('moved'));
  };

  return (
    <div
      className={`bookmark-folder ${viewClass}${dropActive ? ' folder-drop-active' : ''}`}
      id={`folder-${folder.id}`}
      data-folder-id={folder.id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`folder-header${collapsed ? ' collapsed' : ''}`} onClick={() => setCollapsed(c => !c)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" className="folder-icon">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>
        <span className="folder-name">{folder.title}</span>
        <span className="folder-count">{folder.items.length}</span>
      </div>
      {!collapsed && (
        <div className="folder-items">
          {folder.items.map(bm => (
            <BookmarkItem key={bm.id} bookmark={bm} showPin ogImageUrl={ogImages[bm.id]} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props { searchQuery: string; }

function BookmarkView({ searchQuery }: Props) {
  const { settings } = useSettings();
  const { allBookmarks, isLoading } = useBookmarks();
  const { tagMap, activeTags } = useTags();
  const ogImages = useOGImages();

  const folders = useMemo(() => collectFolders(allBookmarks), [allBookmarks]);

  // Apply tag filter (AND logic) then text search
  const filtered = useMemo(() => {
    if (activeTags.length === 0) return filterFolders(folders, searchQuery);
    const tagFiltered = folders.map(f => ({
      ...f,
      items: f.items.filter(bm =>
        activeTags.every(tag => (tagMap[bm.id] ?? []).includes(tag))
      ),
    })).filter(f => f.items.length > 0);
    return filterFolders(tagFiltered, searchQuery);
  }, [folders, searchQuery, activeTags, tagMap]);

  if (isLoading) return (
    <section className="bookmarks-section">
      <div className="empty-state">Loading bookmarks...</div>
    </section>
  );

  return (
    <section className="bookmarks-section">
      <TagFilterStrip />
      <div id="bookmarks">
        {settings.pinnedDisplay === 'top' && (
          <PinnedSection pinnedIds={settings.pinnedIds} ogImages={ogImages} />
        )}
        {filtered.map(folder => (
          <FolderSection key={folder.id} folder={folder} ogImages={ogImages} />
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>{activeTags.length > 0 ? 'No bookmarks match the selected tags.' : 'No bookmarks match your search.'}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default BookmarkView;
```

- [ ] **Step 2: Build**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/BookmarkView.tsx
git commit -m "feat: apply tag AND-filter in BookmarkView, render TagFilterStrip"
```

---

## Task 9: Update FolderSidebar — Tags Section

**Files:**
- Modify: `src/components/FolderSidebar.tsx`

- [ ] **Step 1: Replace `src/components/FolderSidebar.tsx`**

```tsx
import { useState, useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useUI } from '@/context/UIContext';
import { useTags } from '@/context/TagContext';
import { createTranslator } from '@/utils/i18n';
import { buildSidebarTree } from '@/utils/bookmarks';
import { getTagCounts } from '@/utils/tags';
import type { SidebarNode } from '@/utils/bookmarks';

function SidebarItem({
  node,
  depth,
  onSelect,
}: {
  node: SidebarNode;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="folder-sidebar-item"
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) setExpanded(e => !e);
        }}
      >
        {hasChildren ? (
          <svg
            className={`folder-sidebar-item-chevron${expanded ? ' open' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            width="14" height="14"
            onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        ) : (
          <span className="folder-sidebar-item-spacer" />
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="folder-sidebar-item-icon">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>
        <span className="folder-sidebar-item-name">{node.title}</span>
        {node.count > 0 && <span className="folder-sidebar-item-count">{node.count}</span>}
      </div>
      {expanded && hasChildren && node.children.map(child => (
        <SidebarItem key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  );
}

function FolderSidebar() {
  const { settings } = useSettings();
  const { allBookmarks } = useBookmarks();
  const { setActiveView } = useUI();
  const { allTags, tagColors, tagMap, activeTags, toggleActiveTag } = useTags();
  const t = createTranslator(settings.language);
  const isPinned = settings.folderSidebarMode === 'pinned';
  const [floatOpen, setFloatOpen] = useState(false);
  const [search, setSearch] = useState('');

  const panelVisible = isPinned || floatOpen;

  const tree = useMemo(() => buildSidebarTree(allBookmarks), [allBookmarks]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tree;
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    function filterTree(nodes: SidebarNode[]): SidebarNode[] {
      return nodes
        .map(n => ({ ...n, children: filterTree(n.children) }))
        .filter(n => re.test(n.title) || n.children.length > 0);
    }
    return filterTree(tree);
  }, [tree, search]);

  const tagCounts = useMemo(() => getTagCounts(tagMap), [tagMap]);

  const handleSelect = (folderId: string) => {

    setActiveView('bookmarks');
    setTimeout(() => {
      const el = document.getElementById(`folder-${folderId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <nav
      className={`folder-sidebar${panelVisible ? ' pinned' : ''}`}
      id="folder-sidebar"
    >
      {!isPinned && (
        <div
          className="folder-sidebar-trigger"
          onClick={() => setFloatOpen(o => !o)}
        >
          {floatOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" className="trigger-icon-close">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" className="trigger-icon-open">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
            </svg>
          )}
        </div>
      )}

      <div className="folder-sidebar-panel">
        <div className="folder-sidebar-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
          </svg>
          <span>{t('folders-header')}</span>
        </div>
        <div className="folder-sidebar-search">
          <input
            type="text"
            className="folder-sidebar-search-input"
            placeholder={t('search-folders')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="folder-sidebar-list">
          {filtered.length === 0 && (
            <div className="folder-sidebar-empty">No folders found</div>
          )}
          {filtered.map(node => (
            <SidebarItem key={node.id} node={node} depth={0} onSelect={handleSelect} />
          ))}
        </div>

        {/* Tags section */}
        {allTags.length > 0 && (
          <div className="sidebar-tags-section">
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 14px' }} />
            <div className="sidebar-tags-header">
              <span className="sidebar-tags-title">Tags</span>
            </div>
            {allTags.map(tag => (
              <div
                key={tag}
                className={`sidebar-tag-item${activeTags.includes(tag) ? ' is-active' : ''}`}
                onClick={() => toggleActiveTag(tag)}
              >
                <span className="sidebar-tag-dot" style={{ background: tagColors[tag] ?? '#89b4fa' }} />
                <span style={{ color: tagColors[tag] ?? 'inherit' }}>{tag}</span>
                <span className="sidebar-tag-count">{tagCounts[tag] ?? 0}</span>
              </div>
            ))}
          </div>
        )}

        {allTags.length === 0 && (
          <div style={{ padding: '6px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
            No tags yet — add them via the 🏷 button on any bookmark.
          </div>
        )}
      </div>
    </nav>
  );
}

export default FolderSidebar;
```

- [ ] **Step 2: Build**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FolderSidebar.tsx
git commit -m "feat: add Tags section to FolderSidebar with click-to-filter"
```

---

## Task 10: Final Build Verification & Smoke Test

- [ ] **Step 1: Full clean build**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npm run build 2>&1
```

Expected: `✓ Extension assets copied to dist/` and no TypeScript errors.

- [ ] **Step 2: Load the extension in Chrome for manual smoke testing**

In Chrome: open `chrome://extensions` → enable Developer mode → "Load unpacked" → select the `dist/` folder.

- [ ] **Step 3: Smoke test checklist (open a new tab)**

1. Hover over any bookmark — confirm the tag icon appears in the action bar alongside pin and delete
2. Click the tag icon — confirm the floating picker opens to the right with a text input and empty checklist
3. Type `test` in the picker → confirm "Create 'test'" row appears → press Enter → confirm tag chip appears on the bookmark row
4. Open the picker again — confirm `test` appears in the list with a checkmark
5. Click the `test` entry to uncheck — confirm tag chip disappears from the row
6. Add 2–3 different tags to 2–3 different bookmarks
7. Sidebar: confirm the Tags section appears below Folders with the tags listed and counts
8. Click a tag in the sidebar — confirm the filter strip appears at the top of the bookmark list
9. Click a second tag in the sidebar — confirm both chips show in the filter strip (AND logic)
10. Click `Clear all` — confirm filter strip disappears and all bookmarks return
11. Switch display modes (grid, list, compact) — confirm tag chips render correctly in each
12. Reload the new tab page — confirm tags persist (loaded from `chrome.storage.local`)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: smart tagging — chips, picker popup, sidebar filter, AND-logic strip"
```
