# Reading List Mode — Design Spec

**Date:** 2026-05-23  
**Status:** Approved

## Summary

A dedicated Reading List view for the Bookmark Dashboard Chrome extension. Users save articles from existing bookmarks or arbitrary URLs into a persistent queue, read them in a clean in-app split-panel reader, and archive them when done. Article content is fetched and cached at add-time so articles remain readable offline.

---

## Data Model

Stored at `bd_readingList` in `chrome.storage.local` as a `ReadingListItem[]` array.

```ts
interface ReadingListItem {
  id: string;                    // crypto.randomUUID()
  url: string;
  title: string;                 // display title (from bookmark or user input)
  addedAt: number;               // Date.now()
  status: 'unread' | 'archived';
  sourceBookmarkId?: string;     // set when added from a BookmarkItem

  // undefined = fetch in progress; null = fetch failed; string = cached content
  cachedContent: string | null | undefined;
  cachedTitle: string | null;    // Readability-extracted title
  cachedByline: string | null;   // author line from Readability
}
```

Text content only — no images cached. 100 articles at ~30–50KB each stays comfortably under chrome.storage.local limits.

---

## Architecture

### New files

| File | Purpose |
|---|---|
| `src/types/reading-list.ts` | `ReadingListItem` interface |
| `src/utils/readability.ts` | `fetchAndParse(url)` — fetch, DOMParser, Readability, DOMPurify |
| `src/context/ReadingListContext.tsx` | State, storage, add/archive/remove operations |
| `src/components/ReadingListView.tsx` | Root view: 30/70 split layout |
| `src/components/ReadingListPanel.tsx` | Left panel: URL quick-add, unread list, archive section |
| `src/components/ReadingListItem.tsx` | Single item row with actions |
| `src/components/ReaderPanel.tsx` | Right panel: cached reader or fallback |

### Modified files

| File | Change |
|---|---|
| `src/types/index.ts` | Add `'reading'` to `ActiveView` union |
| `src/main.tsx` | Wrap tree with `<ReadingListProvider>` |
| `src/App.tsx` | Add `activeView === 'reading'` branch; add `R` keyboard shortcut |
| `src/components/Topbar.tsx` | Add Reading List nav button (bookmark icon) |
| `src/components/BookmarkItem.tsx` | Add "Add to Reading List" accent button (hover, alongside existing actions) |

---

## Content Fetching

**`utils/readability.ts`** — `fetchAndParse(url: string): Promise<ParsedArticle | null>`

1. `fetch(url)` — works from extension context; `host_permissions: "*://*/*"` bypasses CORS
2. Parse response text with `new DOMParser().parseFromString(html, 'text/html')`
3. `new Readability(doc).parse()` → `{ title, byline, content }`
4. Sanitize `content` with `DOMPurify.sanitize()` before storing
5. Return `{ title, byline, content }` or `null` on any error

**`ReadingListContext.addItem(url, title, sourceBookmarkId?)`**:

1. Generate item with `cachedContent: undefined` (pending state)
2. Write item to storage and update React state immediately — item appears in UI at once
3. Call `fetchAndParse(url)` async
4. On completion, update item's `cachedContent`, `cachedTitle`, `cachedByline` in storage and state

**New dependencies:** `@mozilla/readability`, `dompurify`, `@types/dompurify`

---

## UI

### ReadingListView (30/70 split)

```
┌─────────────────────────────────────────────────────┐
│  Topbar                                             │
├──────────────┬──────────────────────────────────────┤
│  Left (30%)  │  Right (70%)                         │
│              │                                      │
│  [+ Add URL] │  Article title                       │
│              │  By Author · domain.com              │
│  UNREAD (3)  │                                      │
│  ▪ Article 1 │  Article content rendered in clean   │
│  ▪ Article 2 │  typography (18px, 1.7 line-height,  │
│  ▪ Article 3 │  max-width 680px, theme-aware)       │
│              │                                      │
│  ARCHIVE (1) │  [✓ Mark as read]  [↗ Open live]    │
│  ▪ Read item │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Left panel (`ReadingListPanel`)

- URL quick-add input at top: paste URL + Enter (or click add button)
- Section header "UNREAD (n)" — items sorted by `addedAt` descending
- Each item shows title, domain, relative time
- Active item highlighted with accent border
- Section header "ARCHIVE (n)" below — collapsed by default if empty
- Archived items shown with muted style and strikethrough title; each has an "↩ Unarchive" action to move back to unread

### Right panel (`ReaderPanel`)

- `cachedContent === undefined`: shimmer placeholder (fetching in progress)
- `cachedContent === null`: "Content unavailable offline" message + "Open live ↗" link
- `cachedContent` is string: render sanitized HTML in reader typography
  - Font: system font stack, 18px, line-height 1.7
  - Max-width: 680px, centered
  - Respects dark/light theme via CSS variables
- Action bar at bottom: "✓ Mark as read" button, "↗ Open live" link
- "Mark as read" moves item to archive and selects the next unread item automatically
- When no item is selected (empty list or first load): right panel shows a welcome/empty state — "Select an article to read" or, if the list is empty, "Your reading list is empty — add articles with the bookmark button or paste a URL"

### BookmarkItem button

- Accent-colored icon button (bookmark/save icon) added to the hover action row
- Positioned before the tag button in the action group
- On click: calls `addItem(bookmark.url, bookmark.title, bookmark.id)`
- Shows toast: "Added to reading list"
- If URL already exists in reading list (any status — unread or archived): shows filled icon state, toast: "Already in reading list"

### Navigation

- Topbar: reading list icon button navigates to `'reading'` view
- Keyboard shortcut: `R` toggles reading list view (consistent with `D`, `A` shortcuts)
- `Escape` from reading list returns to `'bookmarks'` view (existing Escape handler pattern)

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Fetch fails (network, CORS, timeout) | `cachedContent` set to `null`; reader shows fallback message |
| Readability parse returns null | Same as fetch fail |
| Duplicate URL added | Show toast "Already in reading list", no duplicate created |
| Reading list empty | Empty state message with instructions in both panels |
| `chrome.storage.local` write fails | Log error, show toast "Failed to save" |

---

## Testing Considerations

- `fetchAndParse` can be unit tested with mocked fetch responses
- `ReadingListContext` operations (add, archive, remove) are pure state transforms testable in isolation
- Reader sanitization: verify DOMPurify strips script/iframe tags from malicious fixture HTML
- UI: verify split layout, item selection, archive flow, empty states
