# Loading Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the blank-screen flash on new tab open by showing a shimmer skeleton that matches the user's layout settings on the very first React render.

**Architecture:** A `skeletonSettings.ts` utility reads/writes six layout-critical keys to `localStorage` synchronously. `AppSkeleton.tsx` uses these to render the correct skeleton variant before `chrome.storage.local.get()` completes. Once settings load, it unmounts and the real app takes over; the `BookmarkAreaSkeleton` sub-component continues shimmering until `chrome.bookmarks.getTree()` resolves.

**Tech Stack:** React 18, TypeScript, Vite, Vitest/jsdom, Chrome Extension APIs, CSS custom properties.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/utils/skeletonSettings.ts` | Create | Read/write 6 layout keys to localStorage |
| `src/styles/main.css` | Modify | Add `.skel` shimmer CSS class |
| `src/components/AppSkeleton.tsx` | Create | Full skeleton layout + `BookmarkAreaSkeleton` export |
| `src/context/SettingsContext.tsx` | Modify | Call `writeSkeletonSettings` in `saveSetting` + `saveSettings` |
| `src/App.tsx` | Modify | Replace `return null` with `return <AppSkeleton />` |
| `src/components/BookmarkView.tsx` | Modify | Replace loading text with `<BookmarkAreaSkeleton>` |
| `src/tests/skeletonSettings.test.ts` | Create | Unit tests for read/write helpers |

---

## Task 1: `skeletonSettings.ts` utility (TDD)

**Files:**
- Create: `src/utils/skeletonSettings.ts`
- Create: `src/tests/skeletonSettings.test.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `src/tests/skeletonSettings.test.ts`:

```ts
import { readSkeletonSettings, writeSkeletonSettings } from '@/utils/skeletonSettings';

describe('readSkeletonSettings', () => {
  beforeEach(() => localStorage.clear());

  it('returns DEFAULTS when localStorage is empty', () => {
    const s = readSkeletonSettings();
    expect(s.theme).toBe('dark');
    expect(s.folderSidebarOpen).toBe(true);
    expect(s.folderSidebarMode).toBe('pinned');
    expect(s.displayMode).toBe('list');
    expect(s.navDisplay).toBe('compact');
    expect(s.pinnedDisplay).toBe('top');
  });

  it('returns cached theme after write', () => {
    writeSkeletonSettings({ theme: 'light' });
    expect(readSkeletonSettings().theme).toBe('light');
  });

  it('returns cached displayMode after write', () => {
    writeSkeletonSettings({ displayMode: 'grid' });
    expect(readSkeletonSettings().displayMode).toBe('grid');
  });

  it('returns cached folderSidebarOpen=false after write', () => {
    writeSkeletonSettings({ folderSidebarOpen: false });
    expect(readSkeletonSettings().folderSidebarOpen).toBe(false);
  });

  it('returns cached folderSidebarMode after write', () => {
    writeSkeletonSettings({ folderSidebarMode: 'float' });
    expect(readSkeletonSettings().folderSidebarMode).toBe('float');
  });

  it('leaves unwritten keys at their defaults', () => {
    writeSkeletonSettings({ theme: 'light' });
    const s = readSkeletonSettings();
    expect(s.displayMode).toBe('list');
    expect(s.folderSidebarOpen).toBe(true);
  });

  it('ignores non-skeleton keys passed to writeSkeletonSettings', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writeSkeletonSettings({ userName: 'test' } as any);
    expect(localStorage.getItem('bd_sk_userName')).toBeNull();
  });
});
```

- [ ] **Step 1.2: Run tests — expect them to fail**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A5 "skeletonSettings"
```

Expected: `Error: Cannot find module '@/utils/skeletonSettings'`

- [ ] **Step 1.3: Implement `src/utils/skeletonSettings.ts`**

```ts
import type { AppSettings, DisplayMode, FolderSidebarMode, NavDisplay, PinnedDisplay, Theme } from '@/types';
import { DEFAULTS } from '@/context/SettingsContext';

export type SkeletonSettings = Pick<AppSettings,
  'theme' | 'folderSidebarOpen' | 'folderSidebarMode' |
  'displayMode' | 'navDisplay' | 'pinnedDisplay'
>;

const SK_KEYS: Record<keyof SkeletonSettings, string> = {
  theme:             'bd_sk_theme',
  folderSidebarOpen: 'bd_sk_folderSidebarOpen',
  folderSidebarMode: 'bd_sk_folderSidebarMode',
  displayMode:       'bd_sk_displayMode',
  navDisplay:        'bd_sk_navDisplay',
  pinnedDisplay:     'bd_sk_pinnedDisplay',
};

export function readSkeletonSettings(): SkeletonSettings {
  const s: SkeletonSettings = {
    theme:             DEFAULTS.theme,
    folderSidebarOpen: DEFAULTS.folderSidebarOpen,
    folderSidebarMode: DEFAULTS.folderSidebarMode,
    displayMode:       DEFAULTS.displayMode,
    navDisplay:        DEFAULTS.navDisplay,
    pinnedDisplay:     DEFAULTS.pinnedDisplay,
  };
  try {
    const theme = localStorage.getItem(SK_KEYS.theme);
    if (theme) s.theme = theme as Theme;

    const open = localStorage.getItem(SK_KEYS.folderSidebarOpen);
    if (open !== null) s.folderSidebarOpen = open === 'true';

    const mode = localStorage.getItem(SK_KEYS.folderSidebarMode);
    if (mode) s.folderSidebarMode = mode as FolderSidebarMode;

    const display = localStorage.getItem(SK_KEYS.displayMode);
    if (display) s.displayMode = display as DisplayMode;

    const nav = localStorage.getItem(SK_KEYS.navDisplay);
    if (nav) s.navDisplay = nav as NavDisplay;

    const pinned = localStorage.getItem(SK_KEYS.pinnedDisplay);
    if (pinned) s.pinnedDisplay = pinned as PinnedDisplay;
  } catch { /* localStorage unavailable */ }
  return s;
}

export function writeSkeletonSettings(s: Partial<AppSettings>): void {
  try {
    if (s.theme             !== undefined) localStorage.setItem(SK_KEYS.theme,             s.theme);
    if (s.folderSidebarOpen !== undefined) localStorage.setItem(SK_KEYS.folderSidebarOpen, String(s.folderSidebarOpen));
    if (s.folderSidebarMode !== undefined) localStorage.setItem(SK_KEYS.folderSidebarMode, s.folderSidebarMode);
    if (s.displayMode       !== undefined) localStorage.setItem(SK_KEYS.displayMode,       s.displayMode);
    if (s.navDisplay        !== undefined) localStorage.setItem(SK_KEYS.navDisplay,         s.navDisplay);
    if (s.pinnedDisplay     !== undefined) localStorage.setItem(SK_KEYS.pinnedDisplay,      s.pinnedDisplay);
  } catch { /* localStorage unavailable */ }
}
```

- [ ] **Step 1.4: Run tests — expect them to pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -A5 "skeletonSettings"
```

Expected: all 7 tests pass, no failures.

- [ ] **Step 1.5: Commit**

```bash
git add src/utils/skeletonSettings.ts src/tests/skeletonSettings.test.ts
git commit -m "feat: add skeletonSettings localStorage read/write utility"
```

---

## Task 2: Add `.skel` shimmer CSS

**Files:**
- Modify: `src/styles/main.css`

The existing `@keyframes shimmer` is already defined at line 833 in `main.css`. We only need to add the `.skel` rule that references it using existing CSS custom properties for automatic light/dark theme support.

- [ ] **Step 2.1: Add `.skel` rule to `main.css`**

Find the shimmer section (around line 832) and add immediately after the existing `@keyframes shimmer` block:

```css
/* Skeleton shimmer blocks — used by AppSkeleton and BookmarkAreaSkeleton */
.skel {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-tertiary)  50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 4px;
}
```

`--bg-secondary` and `--bg-tertiary` are already defined for both light and dark themes in `:root` and `.theme-dark`, so `.skel` automatically adapts.

- [ ] **Step 2.2: Commit**

```bash
git add src/styles/main.css
git commit -m "feat: add .skel shimmer CSS class for skeleton loading"
```

---

## Task 3: `AppSkeleton.tsx` component

**Files:**
- Create: `src/components/AppSkeleton.tsx`

This file exports two things:
- `BookmarkAreaSkeleton` (named export) — used by both `AppSkeleton` and `BookmarkView`
- `AppSkeleton` (default export) — the full-page skeleton

It uses the same CSS class names as real components (`topbar`, `topbar-left`, `topbar-nav`, `main-content`, `folder-sidebar`, `bookmarks-section`, `bookmark-folder`) so the skeleton slots into the existing layout perfectly with no extra CSS.

- [ ] **Step 3.1: Create `src/components/AppSkeleton.tsx`**

```tsx
import { readSkeletonSettings } from '@/utils/skeletonSettings';
import type { DisplayMode } from '@/types';

// Shared by AppSkeleton (settings-load phase) and BookmarkView (bookmark-load phase).
export function BookmarkAreaSkeleton({ displayMode }: { displayMode: DisplayMode }) {
  if (displayMode === 'grid') {
    return (
      <section className="bookmarks-section">
        <div id="bookmarks">
          {[0, 1].map(i => (
            <div key={i} className="bookmark-folder view-grid" style={{ marginBottom: 16 }}>
              <div className="folder-header">
                <div className="skel" style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0 }} />
                <div className="skel" style={{ width: 100 + i * 40, height: 12, borderRadius: 4 }} />
                <div className="skel" style={{ width: 28, height: 12, borderRadius: 4, marginLeft: 'auto' }} />
              </div>
              <div className="folder-items" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, padding: 8 }}>
                {[0, 1, 2, 3, 4, 5].map(j => (
                  <div key={j} className="skel" style={{ height: 80, borderRadius: 8 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // list or compact
  return (
    <section className="bookmarks-section">
      <div id="bookmarks">
        {[3, 4, 2].map((rowCount, i) => (
          <div key={i} className="bookmark-folder view-list" style={{ marginBottom: 16 }}>
            <div className="folder-header">
              <div className="skel" style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0 }} />
              <div className="skel" style={{ width: 80 + i * 35, height: 12, borderRadius: 4 }} />
              <div className="skel" style={{ width: 28, height: 12, borderRadius: 4, marginLeft: 'auto' }} />
            </div>
            <div className="folder-items">
              {Array.from({ length: rowCount }).map((_, j) => (
                <div key={j} className="skel" style={{ height: 40, borderRadius: 6, marginBottom: 4 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AppSkeleton() {
  const sk = readSkeletonSettings();
  const isPinned = sk.folderSidebarMode === 'pinned';

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">
            <div className="skel" style={{ width: 22, height: 22, borderRadius: 4 }} />
          </div>
          <div className="skel" style={{ width: 140, height: 13, borderRadius: 4 }} />
        </div>
        <nav className="topbar-nav">
          {[72, 60, 68].map((w, i) => (
            <div key={i} className="skel" style={{ width: w, height: 30, borderRadius: 8 }} />
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skel" style={{ width: 32, height: 32, borderRadius: 6 }} />
          <div className="skel" style={{ width: 32, height: 32, borderRadius: 6 }} />
        </div>
      </header>

      {sk.folderSidebarOpen && (
        <nav className={`folder-sidebar${isPinned ? ' pinned' : ''}`}>
          <div className="folder-sidebar-panel" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isPinned ? (
              <>
                <div className="skel" style={{ width: '55%', height: 8, borderRadius: 3, marginBottom: 6 }} />
                {[130, 95, 115, 75, 105].map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px' }}>
                    <div className="skel" style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0 }} />
                    <div className="skel" style={{ width: w, height: 8, borderRadius: 3 }} />
                    <div className="skel" style={{ width: 20, height: 8, borderRadius: 3, marginLeft: 'auto' }} />
                  </div>
                ))}
                <div className="skel" style={{ width: '45%', height: 8, borderRadius: 3, marginTop: 10, marginBottom: 6 }} />
                {[105, 80].map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px' }}>
                    <div className="skel" style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0 }} />
                    <div className="skel" style={{ width: w, height: 8, borderRadius: 3 }} />
                    <div className="skel" style={{ width: 20, height: 8, borderRadius: 3, marginLeft: 'auto' }} />
                  </div>
                ))}
              </>
            ) : (
              [0, 1, 2, 3].map(i => (
                <div key={i} className="skel" style={{ width: 32, height: 32, borderRadius: 8, margin: '0 auto' }} />
              ))
            )}
          </div>
        </nav>
      )}

      {sk.pinnedDisplay === 'sidebar' && (
        <nav className="pinned-sidebar">
          <div className="pinned-sidebar-panel" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skel" style={{ width: 36, height: 36, borderRadius: 8 }} />
            ))}
          </div>
        </nav>
      )}

      <main className="main-content">
        <div className="skel" style={{ height: 52, borderRadius: 12, margin: '32px 24px 16px' }} />
        <div className="skel" style={{ height: 40, borderRadius: 20, width: '60%', margin: '0 auto 24px' }} />
        <BookmarkAreaSkeleton displayMode={sk.displayMode} />
      </main>
    </>
  );
}
```

- [ ] **Step 3.2: Verify the build compiles cleanly**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors. The component will not be visible yet (nothing imports it).

- [ ] **Step 3.3: Commit**

```bash
git add src/components/AppSkeleton.tsx
git commit -m "feat: add AppSkeleton and BookmarkAreaSkeleton components"
```

---

## Task 4: Wire `writeSkeletonSettings` into SettingsContext

**Files:**
- Modify: `src/context/SettingsContext.tsx`

Two small additions — one in `saveSetting`, one in `saveSettings`.

- [ ] **Step 4.1: Add import at top of `SettingsContext.tsx`**

Find the existing imports block (lines 1–3) and add:

```ts
import { writeSkeletonSettings } from '@/utils/skeletonSettings';
```

- [ ] **Step 4.2: Update `saveSetting`**

Find (around line 106):
```ts
  const saveSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const storageKey = STORAGE_KEYS[key];
    chrome.storage.local.set({ [storageKey]: value });
    setSettings(s => ({ ...s, [key]: value }));
  }, []);
```

Replace with:
```ts
  const saveSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const storageKey = STORAGE_KEYS[key];
    chrome.storage.local.set({ [storageKey]: value });
    writeSkeletonSettings({ [key]: value } as Partial<AppSettings>);
    setSettings(s => ({ ...s, [key]: value }));
  }, []);
```

- [ ] **Step 4.3: Update `saveSettings`**

Find (around line 112):
```ts
  const saveSettings = useCallback((partial: Partial<AppSettings>) => {
    const toStore: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(partial) as [keyof AppSettings, unknown][]) {
      toStore[STORAGE_KEYS[key]] = value;
    }
    chrome.storage.local.set(toStore);
    setSettings(s => ({ ...s, ...partial }));
  }, []);
```

Replace with:
```ts
  const saveSettings = useCallback((partial: Partial<AppSettings>) => {
    const toStore: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(partial) as [keyof AppSettings, unknown][]) {
      toStore[STORAGE_KEYS[key]] = value;
    }
    chrome.storage.local.set(toStore);
    writeSkeletonSettings(partial);
    setSettings(s => ({ ...s, ...partial }));
  }, []);
```

- [ ] **Step 4.4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build, no errors.

- [ ] **Step 4.5: Commit**

```bash
git add src/context/SettingsContext.tsx
git commit -m "feat: mirror layout settings to localStorage on every save"
```

---

## Task 5: Wire `AppSkeleton` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 5.1: Add import at top of `App.tsx`**

Find the existing imports and add after the last component import:

```ts
import AppSkeleton from '@/components/AppSkeleton';
```

- [ ] **Step 5.2: Replace `return null` with `return <AppSkeleton />`**

Find (around line 119):
```ts
  if (!isLoaded) return null;
```

Replace with:
```ts
  if (!isLoaded) return <AppSkeleton />;
```

- [ ] **Step 5.3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 5.4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: show AppSkeleton while settings load instead of blank screen"
```

---

## Task 6: Wire `BookmarkAreaSkeleton` into `BookmarkView`

**Files:**
- Modify: `src/components/BookmarkView.tsx`

BookmarkView already has an `isLoading` check at line 134 that renders `"Loading bookmarks..."`. Replace it with the skeleton.

- [ ] **Step 6.1: Add import at top of `BookmarkView.tsx`**

Add after the existing imports:

```ts
import { BookmarkAreaSkeleton } from '@/components/AppSkeleton';
```

- [ ] **Step 6.2: Replace the `isLoading` early return**

Find (around line 134):
```tsx
  if (isLoading) return (
    <section className="bookmarks-section">
      <div className="empty-state">Loading bookmarks...</div>
    </section>
  );
```

Replace with:
```tsx
  if (isLoading) return <BookmarkAreaSkeleton displayMode={settings.displayMode} />;
```

- [ ] **Step 6.3: Verify full build and tests pass**

```bash
npm run build 2>&1 | tail -10
npm test 2>&1 | tail -10
```

Expected: build succeeds, all tests pass (including the 7 skeletonSettings tests).

- [ ] **Step 6.4: Commit**

```bash
git add src/components/BookmarkView.tsx
git commit -m "feat: replace bookmark loading text with shimmer skeleton"
```

---

## Manual Verification Checklist

After all tasks are done, load the built extension (`dist/`) as an unpacked extension and open a new tab:

- [ ] No blank screen visible — skeleton appears immediately on tab open
- [ ] Skeleton sidebar matches your actual sidebar mode (pinned = wide folder list; float = narrow icons)
- [ ] Shimmer animation is visible and smooth
- [ ] Skeleton transitions cleanly to real content (no layout jump)
- [ ] Changing theme/displayMode in Settings → close and reopen tab → skeleton matches new setting
- [ ] Light mode: `.skel` uses light-mode CSS vars (`--bg-secondary`, `--bg-tertiary`)
- [ ] Dark mode: `.skel` uses dark-mode CSS vars
- [ ] Build: `npm run build` produces no TypeScript errors
