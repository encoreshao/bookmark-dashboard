# Loading Skeleton & Performance UX — Design Spec
_Date: 2026-05-26_

## Problem

When a new tab opens, the dashboard shows a blank screen until two async operations complete:

1. `chrome.storage.local.get()` — loads user settings (SettingsContext). Until resolved, `isLoaded = false` and `App.tsx` returns `null`.
2. `chrome.bookmarks.getTree()` — loads bookmarks (BookmarkContext). Resolves after settings; can be noticeably slow with many bookmarks.

The `<body>` already has `class="theme-dark nav-compact sidebar-mode-pinned"` applied in `index.html`, so the background colour is correct from first paint. The gap is the content area being entirely empty.

## Solution: Progressive Skeleton with localStorage Mirror

Show the correct skeleton layout on the very first React render, before any async call completes. The skeleton adapts to the user's actual layout settings by reading a localStorage cache written on every settings save.

### Design Goals
- Zero blank-screen time between tab open and first meaningful paint
- Skeleton always matches the user's real layout (sidebar mode, display mode, etc.)
- Seamless transition: skeleton → real content with no layout shift
- Minimal code surface — no new state management, no extra storage round-trips

---

## Data Layer: localStorage Mirror

### Keys to mirror

| localStorage key | AppSettings field | Purpose |
|---|---|---|
| `bd_sk_theme` | `theme` | Confirm body class matches |
| `bd_sk_folderSidebarOpen` | `folderSidebarOpen` | Show/hide sidebar skeleton |
| `bd_sk_folderSidebarMode` | `folderSidebarMode` | Wide pinned vs narrow icon sidebar |
| `bd_sk_displayMode` | `displayMode` | Grid vs list card skeleton shape |
| `bd_sk_navDisplay` | `navDisplay` | Compact vs full topbar |
| `bd_sk_pinnedDisplay` | `pinnedDisplay` | Show/hide pinned right sidebar |

### Read path
`readSkeletonSettings()` reads all six keys from `localStorage` synchronously. Missing keys fall back to `DEFAULTS` from SettingsContext. Called once per render of `AppSkeleton` — no hooks, no async.

### Write path
`writeSkeletonSettings(settings: Partial<AppSettings>)` writes the six keys to `localStorage`. Called from `saveSetting` and `saveSettings` in `SettingsContext` alongside the existing `chrome.storage.local.set()`. No extra round-trips.

### First-ever open
All keys missing → `readSkeletonSettings()` returns DEFAULTS → skeleton renders with default layout. On first settings save, cache is populated for all future loads.

---

## Components

### 1. `src/utils/skeletonSettings.ts` (new)

```ts
// Keys mirrored to localStorage
const SK_KEYS = {
  theme: 'bd_sk_theme',
  folderSidebarOpen: 'bd_sk_folderSidebarOpen',
  folderSidebarMode: 'bd_sk_folderSidebarMode',
  displayMode: 'bd_sk_displayMode',
  navDisplay: 'bd_sk_navDisplay',
  pinnedDisplay: 'bd_sk_pinnedDisplay',
} as const;

type SkeletonSettings = Pick<AppSettings,
  'theme' | 'folderSidebarOpen' | 'folderSidebarMode' |
  'displayMode' | 'navDisplay' | 'pinnedDisplay'
>;

export function readSkeletonSettings(): SkeletonSettings { ... }
export function writeSkeletonSettings(s: Partial<AppSettings>): void { ... }
```

### 2. `src/context/SettingsContext.tsx` (modified)

In `saveSetting`:
```ts
const saveSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
  chrome.storage.local.set({ [STORAGE_KEYS[key]]: value });
  writeSkeletonSettings({ [key]: value });           // ← add this line
  setSettings(s => ({ ...s, [key]: value }));
}, []);
```

Same pattern in `saveSettings` — call `writeSkeletonSettings(partial)` alongside `chrome.storage.local.set(toStore)`.

### 3. `src/components/AppSkeleton.tsx` (new) + `BookmarkAreaSkeleton` sub-component

`BookmarkAreaSkeleton` is a small shared component extracted into the same file (or a sibling `src/components/BookmarkAreaSkeleton.tsx`) so it can be imported by both `AppSkeleton` and `BookmarkView` without duplication. It accepts `displayMode` as its only prop.

### `src/components/AppSkeleton.tsx` — main component

Renders the full layout shell using `readSkeletonSettings()`. No props, no hooks beyond what's needed for the shimmer CSS.

Structure:
```
<>
  <TopbarSkeleton navDisplay={sk.navDisplay} />
  {sk.folderSidebarOpen && <FolderSidebarSkeleton mode={sk.folderSidebarMode} />}
  {sk.pinnedDisplay === 'sidebar' && <PinnedSidebarSkeleton />}
  <main className="main-content">
    <HeroSkeleton />
    <SearchSkeleton />
    <BookmarkAreaSkeleton displayMode={sk.displayMode} />
  </main>
</>
```

**Sidebar variants:**
- `folderSidebarMode === 'pinned'` → wide sidebar (~180px) with shimmer folder rows (label + dot + title + count per row), 5–7 rows
- `folderSidebarMode === 'float'` → narrow icon column (~52px) with shimmer icon squares, 4 items

**Bookmark area skeleton:**
- `displayMode === 'grid'` → 2-column grid of shimmer cards (favicon + title + url placeholders)
- `displayMode === 'list'` / `'compact'` → shimmer folder cards: header row (dot + title + count) + 3–4 shimmer list rows each; show 2–3 folder cards

**Shimmer animation:** Single CSS keyframe (`shimmer`) on `.skel` class — gradient sweep from `#1e293b` → `#263347` → `#1e293b` over 1.6s. Light theme uses equivalent light-mode values.

### 4. `src/App.tsx` (modified)

```ts
// Before
if (!isLoaded) return null;

// After
if (!isLoaded) return <AppSkeleton />;
```

One-line change. AppSkeleton unmounts automatically when `isLoaded` becomes true and the real App renders.

### 5. `src/components/BookmarkView.tsx` (modified)

When `isLoading` is true (bookmarks still fetching), render the same `<BookmarkAreaSkeleton>` used in AppSkeleton instead of an empty folder list. This covers the window between settings loaded and bookmarks loaded — the transition is seamless because the skeleton shape is identical.

```tsx
const { allBookmarks, isLoading } = useBookmarks();
if (isLoading) return <BookmarkAreaSkeleton displayMode={settings.displayMode} />;
// ... existing render
```

---

## Load Sequence (after this change)

```
Tab opens
  → browser paints body with theme-dark class (from index.html)
  → JS bundle evaluates, React mounts
  → AppSkeleton renders (readSkeletonSettings() is synchronous)
    → correct sidebar variant visible
    → shimmer animation starts
  → chrome.storage.local.get() resolves (~<10ms)
    → isLoaded = true → AppSkeleton unmounts → real App renders
    → real settings applied (theme, sidebar mode, etc.)
  → chrome.bookmarks.getTree() resolves (variable, 20–200ms+)
    → isLoading = false → BookmarkAreaSkeleton replaced by real bookmark cards
```

---

## Out of Scope

- No changes to BookmarkContext loading strategy (still single `getTree()` call on mount)
- No service worker pre-fetching of bookmarks
- No virtualisation / windowing of bookmark lists (separate concern)
- Options page and save popup are unaffected

---

## Files Changed

| File | Change |
|---|---|
| `src/utils/skeletonSettings.ts` | New — read/write helpers |
| `src/components/AppSkeleton.tsx` | New — full layout skeleton + `BookmarkAreaSkeleton` sub-component |
| `src/context/SettingsContext.tsx` | Add `writeSkeletonSettings()` calls to `saveSetting` + `saveSettings` |
| `src/App.tsx` | Replace `return null` with `return <AppSkeleton />` |
| `src/components/BookmarkView.tsx` | Render `<BookmarkAreaSkeleton>` when `isLoading` is true |
