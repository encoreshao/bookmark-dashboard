# UI Audit & Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Bookmark Dashboard UI across four components — footer, search bar, left sidebar, and topbar — with a Dark Glass / Deep Indigo visual direction.

**Architecture:** Pure CSS and JSX structural changes with no data or context layer modifications. Implementation order goes lowest-risk first: footer → search → sidebar → topbar → light theme pass. Each task is independently testable in the browser using `npm run dev`.

**Tech Stack:** React 18, TypeScript, Vite, plain CSS (no CSS modules), Vitest for unit tests.

---

## File Map

| File | What changes |
|------|-------------|
| `src/styles/main.css` | All visual changes: tokens, footer, search, sidebar, topbar, light theme rules |
| `src/components/SearchSection.tsx` | Add clear button, ⌘K badge, focus state class |
| `src/components/BookmarkView.tsx` | Add `useEffect` to populate `#search-count` span |
| `src/components/FolderSidebar.tsx` | Replace trigger SVG icons with pull-tab div; wrap search input with icon |
| `src/components/Topbar.tsx` | Restructure JSX into `topbar-brand` / `topbar-nav` / `topbar-utils` zones |

`src/components/Footer.tsx` — no changes needed; the JSX structure is already correct.

---

## Task 1: CSS Design Tokens

**Files:**
- Modify: `src/styles/main.css` (around line 87, inside `.theme-dark {}`)

- [ ] **Step 1: Add glass and gradient tokens to `.theme-dark`**

Open `src/styles/main.css`. Find the `.theme-dark {` block (around line 87). Add these variables at the end of that block, before the closing `}`:

```css
  --glass-bg: rgba(15, 26, 46, 0.85);
  --glass-border: rgba(255, 255, 255, 0.07);
  --glass-surface: rgba(255, 255, 255, 0.04);
  --gradient-accent: linear-gradient(135deg, #3b82f6, #6366f1);
  --nav-active-bg: rgba(59, 130, 246, 0.15);
  --nav-active-border: rgba(59, 130, 246, 0.2);
  --nav-active-text: #93c5fd;
  --util-btn-size: 30px;
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
npm test
```

Expected: all existing tests pass (readability, suggestTags, skeletonSettings).

- [ ] **Step 3: Commit**

```bash
git add src/styles/main.css
git commit -m "feat: add dark glass design tokens to theme-dark"
```

---

## Task 2: Footer

**Files:**
- Modify: `src/styles/main.css` (lines 4539–4627)

- [ ] **Step 1: Replace footer CSS**

Find the block from `.app-footer {` through `.app-footer-link:hover {` (lines 4539–4623) and replace the entire range with:

```css
.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

.app-footer-accent {
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #6366f1, transparent);
}

.app-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  font-size: 0.7rem;
  background: color-mix(in srgb, var(--bg-primary) 85%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--glass-border);
}

.app-footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-secondary);
}

.app-footer-icon {
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.3s;
}

.app-footer-icon:hover {
  opacity: 1;
  transform: rotate(-8deg) scale(1.1);
}

.app-footer-version {
  font-size: 9px;
  font-weight: 400;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 1px 5px;
  color: rgba(255, 255, 255, 0.25);
}

.app-footer-author {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-muted);
}

.app-footer-dot {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.app-footer-link {
  font-size: 10px;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 5px;
  padding: 3px 8px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.15s, border-color 0.15s;
}

.app-footer-link:hover {
  background: rgba(59, 130, 246, 0.18);
  border-color: rgba(59, 130, 246, 0.35);
}
```

- [ ] **Step 2: Update the `sidebar-mode-pinned` footer override (line ~4625)**

Find `body.sidebar-mode-pinned .app-footer {` and confirm it still reads `left: 260px;` — no change needed there.

- [ ] **Step 3: Add light theme footer overrides**

Find the `.theme-light .back-to-top {` rule (around line 83). After it, add:

```css
.theme-light .app-footer-inner {
  background: rgba(255, 255, 255, 0.92);
  border-top-color: #E2E8F0;
}

.theme-light .app-footer-version {
  background: #F1F5F9;
  color: #94A3B8;
}

.theme-light .app-footer-dot {
  background: #CBD5E1;
}

.theme-light .app-footer-link {
  color: #2563EB;
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.2);
}

.theme-light .app-footer-link:hover {
  background: rgba(37, 99, 235, 0.14);
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open the extension's new tab page. Verify:
- Gradient accent bar visible at top of footer (blue → indigo → transparent)
- Brand name left-aligned, "Made by …" + feedback pill right-aligned
- Feedback shows as a blue pill button, not a plain link
- Version badge is a small pill beside the app name

- [ ] **Step 5: Run tests and commit**

```bash
npm test
git add src/styles/main.css
git commit -m "feat: refresh footer with gradient accent bar and two-zone layout"
```

---

## Task 3: Search Bar

**Files:**
- Modify: `src/components/SearchSection.tsx`
- Modify: `src/components/BookmarkView.tsx`
- Modify: `src/styles/main.css`

- [ ] **Step 1: Update `SearchSection.tsx`**

Replace the entire file content with:

```tsx
import { useRef, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { createTranslator } from '@/utils/i18n';

interface Props {
  value: string;
  onChange: (q: string) => void;
}

function SearchSection({ value, onChange }: Props) {
  const { settings } = useSettings();
  const t = createTranslator(settings.language);
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    ref.current?.focus();
  };

  return (
    <section className="search-section">
      <div className={`search-wrapper${focused ? ' is-focused' : ''}`}>
        <svg
          className="search-icon"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          ref={ref}
          id="search-input"
          type="text"
          className="search-input"
          placeholder={t('search-placeholder')}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="search-right-group">
          <span className="search-count" id="search-count" />
          {!value && (
            <span className="search-kbd-hint">⌘K</span>
          )}
          {value && (
            <button
              className="search-clear"
              onClick={handleClear}
              aria-label="Clear search"
              tabIndex={-1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                   width="10" height="10">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default SearchSection;
```

- [ ] **Step 2: Populate search count in `BookmarkView.tsx`**

Open `src/components/BookmarkView.tsx`. Add `useEffect` to the imports at the top:

```tsx
import { useMemo, useEffect } from 'react';
```

Then, after the `filtered` useMemo (around line 133), add:

```tsx
  useEffect(() => {
    const el = document.getElementById('search-count');
    if (!el) return;
    if (!searchQuery) {
      el.textContent = '';
      return;
    }
    const count = filtered.reduce((sum, f) => sum + f.items.length, 0);
    el.textContent = count > 0 ? `${count} result${count === 1 ? '' : 's'}` : '';
  }, [filtered, searchQuery]);
```

- [ ] **Step 3: Update search CSS in `main.css`**

Find `.search-count {` (around line 582) and replace the block through the end of the search section (up to the `/* ---------- Bookmarks Section ---------- */` comment) with:

```css
.search-count {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  pointer-events: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.search-right-group {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-kbd-hint {
  font-size: 0.7rem;
  font-family: monospace;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 2px 6px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s, color 0.15s;
}

.search-clear:hover {
  background: var(--accent-light);
  color: var(--accent);
}
```

Also update `.search-input` padding to accommodate the right group — find `.search-input {` and change `padding: 0 80px 0 42px;` to:

```css
  padding: 0 120px 0 42px;
```

And add a focus glow: find `.search-input:focus {` and add `box-shadow`:

```css
.search-input:focus {
  border-color: var(--search-focus);
  box-shadow: 0 0 0 3px var(--accent-light), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

Add the focused wrapper glow by finding `.search-wrapper {` and ensuring it has `position: relative`:

```css
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
```

- [ ] **Step 4: Add light theme search overrides**

After the `.theme-light .app-footer-link:hover` rule you added in Task 2, add:

```css
.theme-light .search-kbd-hint {
  background: #F8FAFC;
  border-color: #E2E8F0;
  color: #94A3B8;
}

.theme-light .search-clear {
  background: #E2E8F0;
  color: #64748B;
}

.theme-light .search-clear:hover {
  background: #DBEAFE;
  color: #2563EB;
}
```

- [ ] **Step 5: Verify in browser**

With `npm run dev` open:
- Empty search bar shows `⌘K` badge on the right
- Typing a query shows result count (e.g. "12 results") and an × button
- Clicking × clears the input and keeps focus on the input
- Pressing the `/` shortcut still focuses the input

- [ ] **Step 6: Run tests and commit**

```bash
npm test
git add src/components/SearchSection.tsx src/components/BookmarkView.tsx src/styles/main.css
git commit -m "feat: add search clear button, result count, and keyboard shortcut hint"
```

---

## Task 4: Left Sidebar

**Files:**
- Modify: `src/components/FolderSidebar.tsx`
- Modify: `src/styles/main.css`

- [ ] **Step 1: Replace trigger SVG icons with pull-tab in `FolderSidebar.tsx`**

In `FolderSidebar.tsx`, find the `{!isPinned && (` block (around line 101). Replace the entire block with:

```tsx
      {!isPinned && (
        <div
          className="folder-sidebar-trigger"
          onClick={() => setFloatOpen(o => !o)}
          aria-label={floatOpen ? 'Close folders' : 'Open folders'}
        >
          <div className="folder-sidebar-pull-tab">
            {floatOpen ? '‹' : '›'}
          </div>
        </div>
      )}
```

- [ ] **Step 2: Add search icon to sidebar search input**

Find the `.folder-sidebar-search` div (around line 128). Replace:

```tsx
        <div className="folder-sidebar-search">
          <input
            type="text"
            className="folder-sidebar-search-input"
            placeholder={t('search-folders')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
```

With:

```tsx
        <div className="folder-sidebar-search">
          <div className="folder-sidebar-search-inner">
            <svg className="folder-sidebar-search-icon"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                 width="12" height="12">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="folder-sidebar-search-input"
              placeholder={t('search-folders')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
```

- [ ] **Step 3: Update sidebar trigger CSS**

Find `.folder-sidebar-trigger {` (around line 2905). Replace the trigger block through `.folder-sidebar-trigger .trigger-icon-open  { display: block; }` (around line 2950) with:

```css
.folder-sidebar-trigger {
  position: relative;
  width: 14px;
  min-width: 14px;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  z-index: 1;
  transition: background-color 0.15s;
}

.folder-sidebar-trigger:hover {
  background: rgba(255, 255, 255, 0.05);
}

.folder-sidebar-pull-tab {
  position: absolute;
  right: -10px;
  width: 20px;
  height: 44px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-left: none;
  border-radius: 0 6px 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--text-muted);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  transition: color 0.15s, background-color 0.15s;
  pointer-events: none;
}

.folder-sidebar-trigger:hover .folder-sidebar-pull-tab {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}
```

Also remove the old show/hide rules for `.trigger-icon-close` and `.trigger-icon-open` — search for those class names and delete the two rules:
```
.folder-sidebar-trigger .trigger-icon-close { display: none; }
.folder-sidebar-trigger .trigger-icon-open  { display: block; }
.folder-sidebar.pinned .folder-sidebar-trigger .trigger-icon-open  { display: none; }
.folder-sidebar.pinned .folder-sidebar-trigger .trigger-icon-close { display: block; }
```

- [ ] **Step 4: Update sidebar search CSS**

Find `.folder-sidebar-search {` (around line 3029). Replace the `.folder-sidebar-search` and `.folder-sidebar-search-input` blocks with:

```css
.folder-sidebar-search {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.folder-sidebar-search-inner {
  position: relative;
  display: flex;
  align-items: center;
}

.folder-sidebar-search-icon {
  position: absolute;
  left: 8px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.folder-sidebar-search-input {
  width: 100%;
  height: 32px;
  padding: 0 10px 0 28px;
  font-family: var(--font-body);
  font-size: 0.6875rem;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.folder-sidebar-search-input::placeholder {
  color: var(--text-muted);
}

.folder-sidebar-search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}
```

- [ ] **Step 5: Polish tags section CSS**

Find `.sidebar-tags-header {` and `.sidebar-tags-title {` in `main.css` (search for `sidebar-tags`). Replace those rules with:

```css
.sidebar-tags-section {
  border-top: 1px solid var(--border);
  margin-top: 4px;
  padding-bottom: 8px;
}

.sidebar-tags-header {
  padding: 10px 14px 5px;
}

.sidebar-tags-title {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}
```

- [ ] **Step 6: Verify in browser**

With `npm run dev` open:
- The sidebar shows a thin `14px` strip with a `›` pull-tab at its center
- Clicking the pull-tab or the strip opens the panel; `›` becomes `‹`
- The search input inside the panel shows a magnifier icon on its left
- The Tags section has an uppercase "TAGS" label with a divider above it

- [ ] **Step 7: Run tests and commit**

```bash
npm test
git add src/components/FolderSidebar.tsx src/styles/main.css
git commit -m "feat: replace sidebar trigger with pull-tab, add search icon, polish tags section"
```

---

## Task 5: Topbar Restructure

**Files:**
- Modify: `src/components/Topbar.tsx`
- Modify: `src/styles/main.css`

- [ ] **Step 1: Restructure `Topbar.tsx` JSX**

Replace the entire `return (...)` in `Topbar` (from `return (` through `);`) with:

```tsx
  return (
    <header className="topbar">
      <div className="topbar-brand" data-tooltip={isPinned ? extName : undefined}>
        <div className="topbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span className="topbar-title">{extName}</span>
        {version && <span className="topbar-version" id="topbar-version">{version}</span>}
      </div>

      <nav className="topbar-nav">
        <button
          className={`nav-link${activeView === 'recent' ? ' active' : ''}`}
          onClick={() => setActiveView(activeView === 'recent' ? 'bookmarks' : 'recent')}
          data-tooltip={compact ? `${t('nav-recent')} (R)` : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {!compact && <span>{t('nav-recent')}</span>}
        </button>

        <button
          className={`nav-link${activeView === 'domains' ? ' active' : ''}`}
          onClick={() => setActiveView(activeView === 'domains' ? 'bookmarks' : 'domains')}
          data-tooltip={compact ? `${t('nav-domains')} (D)` : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="8" height="8" rx="2"/>
            <rect x="14" y="2" width="8" height="8" rx="2"/>
            <rect x="2" y="14" width="8" height="8" rx="2"/>
            <path d="M18 14v4"/><path d="M16 18h4"/>
          </svg>
          {!compact && <span>{t('nav-domains')}</span>}
        </button>

        <button
          className={`nav-link${activeView === 'ai' ? ' active' : ''}`}
          onClick={() => setActiveView(activeView === 'ai' ? 'bookmarks' : 'ai')}
          data-tooltip={compact ? `${t('nav-ai')} (A)` : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
          </svg>
          {!compact && <span>{t('nav-ai')}</span>}
        </button>

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

        <div className="nav-google-apps" ref={googleAppsMenuRef} style={{ position: 'relative' }}>
          <button
            className={`nav-link${googleAppsOpen ? ' active' : ''}`}
            id="btn-google-apps"
            onClick={(e) => { e.stopPropagation(); setGoogleAppsOpen(!googleAppsOpen); }}
            data-tooltip={compact ? `Google Apps (G)` : undefined}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="18" height="18">
              <rect x="3" y="3" width="4" height="4" rx="0.6"/>
              <rect x="10" y="3" width="4" height="4" rx="0.6"/>
              <rect x="17" y="3" width="4" height="4" rx="0.6"/>
              <rect x="3" y="10" width="4" height="4" rx="0.6"/>
              <rect x="10" y="10" width="4" height="4" rx="0.6"/>
              <rect x="17" y="10" width="4" height="4" rx="0.6"/>
              <rect x="3" y="17" width="4" height="4" rx="0.6"/>
              <rect x="10" y="17" width="4" height="4" rx="0.6"/>
              <rect x="17" y="17" width="4" height="4" rx="0.6"/>
            </svg>
            {!compact && <span>{t('nav-apps')}</span>}
          </button>
          <div className={`google-apps-menu${googleAppsOpen ? ' open' : ''}`} id="google-apps-menu">
            {(() => {
              const regularApps = visibleApps.filter(a => !AI_APP_IDS.includes(a.id));
              const aiApps = visibleApps.filter(a => AI_APP_IDS.includes(a.id));
              return (
                <>
                  {regularApps.length > 0 && (
                    <>
                      <p className="gam-title">Google Apps</p>
                      <div className="gam-grid gam-grid-4">
                        {regularApps.map(app => (
                          <a key={app.id} className="gam-item" href={app.url} target="_blank" rel="noopener">
                            <AppIcon app={app} />
                            <span>{app.label}</span>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                  {aiApps.length > 0 && (
                    <>
                      <div className="gam-divider" />
                      <p className="gam-title gam-title-ai">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
                        </svg>
                        AI
                      </p>
                      <div className="gam-grid gam-grid-4">
                        {aiApps.map(app => (
                          <a key={app.id} className="gam-item" href={app.url} target="_blank" rel="noopener">
                            <AppIcon app={app} />
                            <span>{app.label}</span>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </nav>

      <div className="topbar-utils">
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

        <button
          className="nav-link util-btn"
          onClick={toggleTheme}
          title={`Theme: ${settings.theme} (T)`}
        >
          {settings.theme === 'dark' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
          )}
          {settings.theme === 'light' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2m-8.66-14 1.41 1.41M19.07 4.93l1.41 1.41M2 12h2M20 12h2m-14.07 5.07 1.41 1.41M17.66 17.66l1.41 1.41"/>
            </svg>
          )}
          {settings.theme === 'system' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="3" rx="2"/>
              <path d="M8 21h8"/><path d="M12 17v4"/>
            </svg>
          )}
        </button>

        <button
          className="nav-link util-btn"
          onClick={openKbdModal}
          title="Shortcuts (?)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
          </svg>
        </button>

        <button
          className="nav-link util-btn"
          onClick={() => openSettings()}
          title="Settings (S)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        <button
          className="nav-add-btn"
          onClick={openAddBookmark}
          title="Add Bookmark (N)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add</span>
        </button>
      </div>
    </header>
  );
```

- [ ] **Step 2: Update topbar CSS — rename `topbar-left` to `topbar-brand`, add `topbar-utils`**

Find `.topbar {` (line 312) and replace through `.topbar-nav {` closing brace to:

```css
.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--topbar-bg);
  border-bottom: 1px solid var(--topbar-border);
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 16px;
  z-index: 100;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 16px;
  border-right: 1px solid var(--topbar-border);
  flex-shrink: 0;
}

.topbar-logo {
  width: 22px;
  height: 22px;
  color: var(--accent);
  flex-shrink: 0;
}

.topbar-title {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.topbar-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 12px;
  flex: 1;
}

.topbar-utils {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-left: 12px;
  border-left: 1px solid var(--topbar-border);
  flex-shrink: 0;
}

.util-btn {
  width: var(--util-btn-size);
  height: var(--util-btn-size);
  padding: 0;
  justify-content: center;
}

.util-btn svg {
  width: 16px;
  height: 16px;
}
```

- [ ] **Step 3: Update the `sidebar-mode-pinned` topbar override**

Find `body.sidebar-mode-pinned .topbar-left {` (around line 3537) and rename it to `topbar-brand`:

```css
body.sidebar-mode-pinned .topbar-brand {
  width: 260px;
  min-width: 260px;
  max-width: 260px;
  flex-shrink: 0;
  padding-left: 18px;
  padding-right: 12px;
  border-right: 1px solid var(--border);
  height: 100%;
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

Also find `body.sidebar-mode-pinned .topbar-title {` — no change needed there.

- [ ] **Step 4: Update the `nav-add-btn` to use gradient**

Find `.nav-add-btn {` (around line 2342) and update:

```css
.nav-add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #ffffff;
  background: var(--gradient-accent);
  border: 1px solid transparent;
  cursor: pointer;
  transition: opacity 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
  margin-left: 4px;
}

.nav-add-btn:hover {
  opacity: 0.9;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.45);
}
```

- [ ] **Step 5: Verify in browser**

With `npm run dev` open:
- Brand (logo + name + version) appears left, separated by a vertical divider
- Nav links (Recent, Domains, AI, Reading, Apps) flow in the center
- Right side has: view toggle segmented group | theme | shortcuts | settings | gradient Add button
- All existing keyboard shortcuts still work (T for theme, S for settings, N for add, etc.)
- Google Apps dropdown still opens correctly

- [ ] **Step 6: Run tests and commit**

```bash
npm test
git add src/components/Topbar.tsx src/styles/main.css
git commit -m "feat: restructure topbar into brand/nav/utils zones with gradient add button"
```

---

## Task 6: Light Theme Companion Rules

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1: Add light theme topbar-brand and topbar-utils rules**

Find the existing `.theme-light .topbar {` block (around line 40). Add after it:

```css
.theme-light .topbar-brand {
  border-right-color: #E2E8F0;
}

.theme-light .topbar-utils {
  border-left-color: #E2E8F0;
}

.theme-light .nav-add-btn {
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.theme-light .nav-add-btn:hover {
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}
```

- [ ] **Step 2: Add light theme sidebar trigger rule**

Find the `.theme-light .search-input {` block (around line 49). Add after it:

```css
.theme-light .folder-sidebar-trigger {
  background: rgba(0, 0, 0, 0.01);
  border-right-color: #E2E8F0;
}

.theme-light .folder-sidebar-trigger:hover {
  background: #F8FAFC;
}

.theme-light .folder-sidebar-pull-tab {
  background: #FFFFFF;
  border-color: #E2E8F0;
}

.theme-light .folder-sidebar-pull-tab:hover {
  background: #F1F5F9;
}
```

- [ ] **Step 3: Verify light theme in browser**

In `npm run dev`, switch the theme to light (press `T`). Verify:
- Footer gradient accent bar still shows (gradient is theme-independent)
- Footer inner background is white/near-white with a light border
- Topbar brand and utils dividers show as `#E2E8F0` (subtle gray)
- Gradient Add button looks good on white background
- Sidebar pull-tab is white with a light border
- Search clear button and ⌘K badge use light backgrounds

- [ ] **Step 4: Switch back and verify dark theme unchanged**

Press `T` to cycle back to dark theme. Confirm all the dark glass styles are intact.

- [ ] **Step 5: Run tests and final commit**

```bash
npm test
git add src/styles/main.css
git commit -m "feat: add light theme companion rules for all refreshed components"
```

---

## Done

All four components refreshed. Verify the complete flow one final time:

1. Open in dark theme — topbar clean with three zones, sidebar pull-tab visible, search shows ⌘K hint, footer has gradient bar
2. Type a search query — count appears, × button appears, clicking × clears
3. Open sidebar — pull-tab slides panel in, search icon visible, Tags section has header
4. Switch to light theme — all surfaces adapt correctly
5. `npm test` — all existing tests pass
