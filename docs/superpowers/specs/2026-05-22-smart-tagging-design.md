# Smart Tagging & Cross-referencing — Design Spec

**Date:** 2026-05-22  
**Status:** Approved

---

## Overview

Add a multi-tag system to the bookmark dashboard so users can assign multiple tags to any bookmark and filter by tag combinations, independent of Chrome's folder structure.

---

## Constraints

Chrome's `BookmarkTreeNode` is a read-only native API type — custom metadata cannot be stored on it. Tags must live entirely in `chrome.storage.local`, keyed by bookmark ID.

---

## Data Model

Two new storage keys, both in `chrome.storage.local`:

| Key | Type | Purpose |
|-----|------|---------|
| `bd_bookmarkTags` | `Record<string, string[]>` | Maps bookmark ID → array of tag names |
| `bd_tagColors` | `Record<string, string>` | Maps tag name → hex/hsl color string |

Tag names are the canonical identifier (lowercase, trimmed). Colors are assigned deterministically from a fixed palette on first use, so the same tag name always gets the same color across devices.

A new `TagContext` owns all tag reads/writes and exposes:
- `tagMap` — the full `bookmarkId → string[]` map
- `tagColors` — the full `tagName → color` map
- `getTagsForBookmark(id)` — returns `string[]`
- `setTagsForBookmark(id, tags)` — persists and updates state
- `allTags` — sorted list of all unique tag names in use
- `activeTags` — tag names currently active as filters (UI state)
- `toggleActiveTag(name)` / `clearActiveTags()`

---

## Components

### 1. `TagContext` (new — `src/context/TagContext.tsx`)

Loads `bd_bookmarkTags` and `bd_tagColors` from `chrome.storage.local` on mount. Exposes the interface above. Owns `activeTags` filter state (array of tag names, AND semantics).

### 2. `TagPicker` (new — `src/components/TagPicker.tsx`)

Floating popup anchored to the right of the tag icon button. Rendered via a React portal so it escapes any overflow clipping.

**Internal layout (top to bottom):**
- Header: `🏷 Manage tags · <bookmark title>`
- Text input with autocomplete (searches `allTags` by prefix)
- Scrollable checklist of all existing tags (checked = applied to this bookmark)
- "Create `<query>`" row when the typed query doesn't match any existing tag
- Clicking outside or pressing Escape closes it

**Color assignment:** when a new tag is created, pick the next unused color from a fixed 10-color palette. Store in `bd_tagColors`.

### 3. `BookmarkItem` (updated — `src/components/BookmarkItem.tsx`)

**All three display modes** (grid, list, compact) get a tag chip row:

- **List & compact:** a `<div class="bm-tag-row">` row rendered below the title/domain line. Shows colored chips for each applied tag plus a `+ tag` chip.
- **Grid:** chips rendered in the `bookmark-og-footer` section below the title.

A **tag icon button** is added to the action bar (alongside the existing pin and delete buttons). Clicking it opens `TagPicker` positioned to the right. The icon button gets an `active` highlight style while the picker is open.

Clicking the `+ tag` chip is a shortcut that also opens `TagPicker`.

### 4. `FolderSidebar` (updated — `src/components/FolderSidebar.tsx`)

A **Tags section** is appended below the existing folder list, separated by a divider. It renders:
- Each unique tag as a colored dot + label + bookmark count
- A `+ New tag` button that opens a small inline input for creating a tag (unassigned; user then applies it via TagPicker)
- Clicking a tag toggles it in `activeTags`; active tags are highlighted

### 5. Tag filter strip (new — `src/components/TagFilterStrip.tsx`)

Rendered as the first element inside `BookmarkView`, before the folder sections, visible only when `activeTags.length > 0`.

Shows: `Filter:` label · one chip per active tag (click to remove) · `Clear all` link on the right.

When active tags are set, `BookmarkView` pre-filters `allBookmarks` to only include bookmarks whose tag array contains **all** active tags (AND logic) before passing them to folder rendering.

---

## Filtering Logic

```
visibleBookmarks = allBookmarks.filter(b =>
  activeTags.every(tag => tagMap[b.id]?.includes(tag))
)
```

Filtering happens at the `BookmarkView` level, applied before `collectFolders`. Folders with zero visible bookmarks after filtering are hidden.

---

## Storage & Types

New types added to `src/types/index.ts`:

```typescript
export type TagMap = Record<string, string[]>;
export type TagColorMap = Record<string, string>;
```

New storage keys added to `SettingsContext`'s `STORAGE_KEYS` pattern is **not** used — `TagContext` manages its own storage directly to keep the tag state independent of `AppSettings`.

---

## Autocomplete Behaviour

- Input filters `allTags` by prefix match (case-insensitive)
- Enter key applies the top suggestion or creates a new tag if no match
- Comma or Tab also confirms the current token
- Backspace on empty input removes the last applied tag from this bookmark

---

## Out of Scope

- Bulk-tagging multiple bookmarks at once (future)
- Tag rename / merge (future)
- Chrome sync (`chrome.storage.sync`) — local only for now due to 100 KB sync quota
- Popup (browser action) — the extension has no browser action; "popup" in this spec means the `TagPicker` floating panel
