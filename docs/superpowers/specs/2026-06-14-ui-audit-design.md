# UI Audit & Refresh — Design Spec
**Date:** 2026-06-14  
**Status:** Approved  
**Scope:** Topbar, Left Sidebar, Search Bar, Footer

---

## Overview

A focused UI refresh of the four primary chrome components. The goal is to de-clutter the topbar, make the sidebar more discoverable, add functional polish to the search bar, and give the footer proper visual weight — all within the existing Dark Glass / Deep Indigo visual direction that aligns with the current blue-accent, flat-minimalist design language.

No core bookmark functionality changes. No new features outside the four components listed below.

---

## Visual Direction

**Theme:** Dark Glass · Deep Indigo  
**Rationale:** Extends the existing dark theme (`--bg-primary: #0B1120`, `--accent: #3B82F6`) with glassmorphism surfaces and an indigo gradient accent. Stays in the blue family, preserves the flat minimalist spirit, and leverages the existing background-image/backdrop-blur infrastructure already in the codebase.

**Key tokens introduced:**
- Glass surface: `rgba(15, 26, 46, 0.85)` + `backdrop-filter: blur(16px)`
- Glass border: `rgba(255, 255, 255, 0.07)`
- Gradient accent: `linear-gradient(135deg, #3b82f6, #6366f1)` (blue → indigo)
- Inset highlight: `inset 0 1px 0 rgba(255, 255, 255, 0.06)`

These supplement (not replace) the existing CSS variable system.

---

## 1. Topbar

### Problem
Ten-plus buttons in a single flat row with no grouping. View mode toggle (list/grid/compact) and primary nav links look identical. No clear visual hierarchy between navigation, actions, and utilities.

### Solution: Split Layout

**Left zone — Brand + Nav:**
```
[Logo icon] [App name] [version badge]  |  [Recent] [Domains] [AI] [Reading] [Apps]
```
- Brand and nav separated from utilities by a `1px rgba(255,255,255,0.07)` divider
- Nav items: icon + label, `border-radius: 7px`, active state gets `rgba(59,130,246,0.15)` background + `rgba(59,130,246,0.2)` border + `#93c5fd` text
- Logo icon: `26×26px`, `linear-gradient(135deg, #3b82f6, #6366f1)` background, `border-radius: 7px`

**Right zone — Utilities:**
```
[List|Grid|Compact segmented] | [Theme] [Shortcuts] [Settings]  [+ Add]
```
- View toggle: segmented pill group (`background: rgba(255,255,255,0.04)`, `border-radius: 7px`), active button gets `rgba(255,255,255,0.1)` background
- Utility icon buttons: `30×30px`, `border-radius: 7px`, hover gets `rgba(255,255,255,0.06)` bg
- **Add button:** gradient `linear-gradient(135deg, #3b82f6, #6366f1)`, `border-radius: 8px`, `box-shadow: 0 2px 12px rgba(99,102,241,0.35)` — the sole primary CTA, visually distinct

**Topbar container:**
- `background: rgba(15,26,46,0.85)`, `backdrop-filter: blur(16px)`
- `border-bottom: 1px solid rgba(255,255,255,0.07)`
- `box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`

### Files affected
- `src/components/Topbar.tsx` — restructure JSX into brand/nav/utils zones
- `src/styles/main.css` — update `.topbar`, `.topbar-nav`, `.nav-link`, `.nav-add-btn`, `.view-mode-toggle` classes

---

## 2. Left Sidebar (FolderSidebar)

### Problem
- Hover-to-open trigger is invisible — no affordance for new users
- Sidebar search input has no icon
- Tags section has no visual separator or section label
- Empty states are unstyled inline text

### Solution: Pull-Tab Trigger + Polished Panel

**Trigger:**
- A `14px`-wide always-visible strip on the left edge (`background: rgba(255,255,255,0.02)`, `border-right: 1px solid rgba(255,255,255,0.05)`)
- A floating pull-tab handle `(20×44px)` centered vertically on the strip: `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.1)`, `border-radius: 6px`, `box-shadow: 2px 0 8px rgba(0,0,0,0.3)`, contains a `›` chevron
- Tab shows `‹` when open (rotates arrow direction)
- Existing hover-open behavior retained; click also toggles

**Search input inside panel:**
- Wrap existing input in a container with `background: rgba(255,255,255,0.05)`, `border: 1px solid rgba(255,255,255,0.07)`, `border-radius: 8px`
- Add search icon (SVG) to the left of the input, `color: rgba(255,255,255,0.2)`
- Remove the bare input border; use the container border instead

**Tags section:**
- Add an `ALL-CAPS` section header label: `font-size: 9px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.1em`, `color: rgba(255,255,255,0.2)`
- `border-top: 1px solid rgba(255,255,255,0.05)` above the section, `margin-top: 4px`
- Active tag: `color: #93c5fd` (matches nav active color)

**Folder items:**
- Active folder: `background: rgba(59,130,246,0.1)`, `color: #93c5fd`
- Count badge active: `background: rgba(59,130,246,0.2)`, `color: #93c5fd`

**Empty state:**
- Style the "No folders found" and "No tags yet" messages with the same `font-size: 11px`, `color: rgba(255,255,255,0.2)`, `padding: 10px 14px` pattern

### Files affected
- `src/components/FolderSidebar.tsx` — add pull-tab markup, search icon wrapper, tags header element
- `src/styles/main.css` — update `.folder-sidebar-trigger`, `.folder-sidebar-search`, `.folder-sidebar-search-input`, `.sidebar-tags-section`, `.sidebar-tags-header`, `.sidebar-tag-item` classes

---

## 3. Search Bar

### Problem
- No way to clear search without manually deleting text
- Result count span exists in JSX but is never populated
- No keyboard shortcut hint visible to user

### Solution: Inline All-In-One

**Empty state:**
```
[🔍 icon]  [placeholder: "Search bookmarks…"]  [⌘K badge]
```

**Active state (query entered):**
```
[🔍 icon blue]  ["react hooks…"]  [24 results]  [× clear]
```

**Specific changes:**
- Search icon: `position: absolute; left: 14px` — color `rgba(255,255,255,0.25)` idle, `#3b82f6` when input focused
- Input `padding-left: 42px` (icon clearance), `padding-right: 130px` (right group clearance)
- Focus ring: `box-shadow: 0 0 0 3px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.04)`
- Border on focus: `rgba(59,130,246,0.3)` (from `rgba(255,255,255,0.08)`)
- **⌘K badge** (empty state only): `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.1)`, `border-radius: 5px`, `font-family: monospace`, hidden when `value !== ''`
- **Result count** (active state): populated via existing `#search-count` span in `BookmarkView.tsx`, styled `font-size: 11px`, `color: rgba(255,255,255,0.3)`
- **Clear button** (active state only): `20×20px` circle, `background: rgba(255,255,255,0.1)`, `border-radius: 50%`, `×` character, calls `onChange('')` and clears input, hidden when `value === ''`

### Files affected
- `src/components/SearchSection.tsx` — add clear button, ⌘K badge, focus state class
- `src/styles/main.css` — update `.search-section`, `.search-wrapper`, `.search-input`, `.search-icon` classes; add `.search-clear`, `.search-kbd-hint`
- `src/components/BookmarkView.tsx` — the `#search-count` span already exists in `SearchSection.tsx` but is currently empty. `BookmarkView` must write the filtered count to it via `document.getElementById('search-count')?.textContent = \`${count}\`` after each filter pass, clearing it when query is empty

---

## 4. Footer

### Problem
One flat line of text with no visual weight. The accent div (`.app-footer-accent`) exists in JSX but is invisible. Brand, attribution, and link compete equally with no hierarchy.

### Solution: Gradient Bar + Two-Zone Layout

**Structure:**
```
[gradient accent bar — full width, 2px]
[🔖 App name  v1.2]          [Made by Encore Shao  |  Feedback →]
```

**Gradient accent bar:**
- `.app-footer-accent`: `height: 2px`, `background: linear-gradient(90deg, #3b82f6, #6366f1, transparent)`
- Already exists in JSX — just needs CSS

**Footer container:**
- `background: rgba(15,26,46,0.8)`, `border-top: 1px solid rgba(255,255,255,0.06)`
- Inner: `display: flex`, `justify-content: space-between`, `align-items: center`, `padding: 10px 24px`

**Left — Brand:**
- Bookmark icon (existing SVG) + app name (11px, weight 600, `rgba(255,255,255,0.6)`) + version badge (consistent with topbar)

**Right — Meta:**
- "Made by Encore Shao" in `rgba(255,255,255,0.25)`
- `1px rgba(255,255,255,0.1)` vertical separator
- "Feedback →" as a pill: `background: rgba(59,130,246,0.1)`, `border: 1px solid rgba(59,130,246,0.2)`, `color: #60a5fa`, `border-radius: 5px`, `padding: 3px 8px`

### Files affected
- `src/components/Footer.tsx` — no JSX changes needed (structure is correct); minor: ensure brand icon and version span are present
- `src/styles/main.css` — update `.app-footer`, `.app-footer-accent`, `.app-footer-inner`, `.app-footer-brand`, `.app-footer-version`, `.app-footer-link`

---

## Light Theme Compatibility

All glass surfaces fall back gracefully on light theme. The existing `.theme-light` overrides in `main.css` will need companion rules for the new classes:

- `.theme-light .topbar` → use `#FFFFFF` background, drop `backdrop-filter`
- `.theme-light .folder-sidebar-panel` → `background: #FFFFFF`
- `.theme-light .search-input` → keep existing white background, add focus ring with `rgba(37,99,235,0.15)`
- `.theme-light .app-footer` → `background: #FFFFFF`, `border-top: 1px solid #E2E8F0`

The gradient accent bar and Add button gradient work unchanged in both themes.

---

## What Does NOT Change

- Bookmark card designs (grid/list/compact views)
- All existing keyboard shortcuts
- Settings panel
- Add bookmark dialog
- Reading list panel
- AI insights view
- Domain view
- Any data or context logic

---

## Implementation Order

1. CSS variables / token additions (no visible change)
2. Footer (lowest risk, isolated)
3. Search bar (isolated component, functional improvement)
4. Sidebar (moderate — trigger markup change)
5. Topbar (highest visibility — do last, test both themes)
6. Light theme companion rules pass
