# Bookmark Dashboard

A clean, modern Chrome extension that replaces your new tab with a fully-featured, searchable bookmark dashboard — built with **React + TypeScript**.

## Features

- Browse all Chrome bookmarks organised by folder
- Search bookmarks by title or URL (keyboard shortcut: `/`)
- Grid and list view modes
- Dark / light / system theme with smooth transitions
- Pinned bookmarks — pin any bookmark for quick access (top bar or right sidebar)
- Folder sidebar — pinned or floating, collapsible tree
- Domain graph — visualise bookmarks grouped by website domain
- Recently added — instantly see your 50 newest bookmarks
- Google Apps popup — customisable launcher (choose which apps appear)
- Drag bookmarks between folders
- Greeting + live clock
- Full internationalisation: English, 中文, 日本語
- All settings persist via `chrome.storage.local`

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search |
| `?` | Toggle keyboard shortcuts modal |
| `S` | Open Settings |
| `T` | Cycle theme (dark → light → system) |
| `V` | Toggle view (list ↔ grid) |
| `D` | Domain graph |
| `R` | Recently added |
| `G` | Google Apps popup |
| `Shift + G` | Open Google.com |
| `Esc` | Close / go back |

## Install (Developer Mode)

> **Requires a one-time build step.** Chrome loads the compiled `dist/` folder — not the source directory.

```bash
# 1. Clone the repo
git clone https://github.com/encoreshao/bookmark-dashboard.git
cd bookmark-dashboard

# 2. Install dependencies
npm install

# 3. Build — compiles React + copies all extension assets into dist/
npm run build

# 4. Load the extension
#    chrome://extensions → Enable Developer mode → Load unpacked → select the dist/ folder
```

Open a new tab to see the dashboard.

### Development (watch mode)

```bash
npm run dev   # rebuilds dist/ automatically on every source change
```

After each rebuild, click **↺ Update** in `chrome://extensions` (or enable auto-reload with an extension like [Extensions Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid)).

## Project Structure

```
bookmark-dashboard/
├── package.json               # npm scripts + dependencies
├── vite.config.ts             # Vite build config (root = src/)
├── tsconfig.json              # TypeScript config
│
├── src/                       # ← Everything lives here
│   ├── manifest.json          # Chrome extension manifest (v3)
│   ├── icons/                 # Extension icons (16 / 48 / 128 px)
│   │
│   ├── index.html             # Vite HTML entry (new-tab page)
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Root component + global keyboard shortcuts
│   │
│   ├── components/            # React UI components
│   │   ├── Topbar.tsx         # Header navigation + Google Apps menu
│   │   ├── Hero.tsx           # Greeting + live clock
│   │   ├── SearchSection.tsx  # Search input
│   │   ├── BookmarkView.tsx   # Bookmark list / grid with folder sections
│   │   ├── BookmarkItem.tsx   # Single bookmark card (pin, delete, drag)
│   │   ├── FolderSidebar.tsx  # Left folder tree (pinned or floating)
│   │   ├── PinnedSidebar.tsx  # Right pinned-bookmarks sidebar
│   │   ├── DomainView.tsx     # Domain graph dashboard
│   │   ├── DomainModal.tsx    # Domain detail popup
│   │   ├── RecentView.tsx     # Recently added view
│   │   ├── SettingsPanel.tsx  # Settings panel (4 tabs)
│   │   ├── KeyboardShortcuts.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── Toast.tsx
│   │
│   ├── context/               # React Context providers
│   │   ├── SettingsContext.tsx  # Settings state ↔ chrome.storage.local
│   │   ├── BookmarkContext.tsx  # Bookmark tree via chrome.bookmarks API
│   │   └── UIContext.tsx        # Active view, modals, toasts
│   │
│   ├── types/
│   │   └── index.ts           # Shared TypeScript interfaces
│   │
│   ├── utils/
│   │   ├── bookmarks.ts       # Tree traversal, folder & domain helpers
│   │   ├── googleApps.tsx     # App catalogue + inline SVG icons
│   │   ├── i18n.ts            # Translations (EN / 中文 / 日本語)
│   │   └── time.ts            # Clock formatting & relative-time
│   │
│   ├── styles/
│   │   ├── main.css           # New-tab dashboard styles
│   │   └── options.css        # Options page styles
│   │
│   ├── js/
│   │   ├── service-worker.js  # Chrome MV3 background service worker
│   │   ├── options.js         # Options page logic (vanilla JS)
│   │   └── manifest-info.js   # Injects manifest version into pages
│   │
│   └── options/
│       └── index.html         # Options page HTML
│
├── dist/                      # ← Built extension — load this folder in Chrome
│   ├── manifest.json          # Copied from src/
│   ├── icons/                 # Copied from src/
│   ├── index.html             # Compiled new-tab page
│   ├── assets/                # Bundled JS + CSS (hashed filenames)
│   ├── js/                    # Copied service worker + options scripts
│   ├── styles/                # Copied options.css
│   └── options/               # Copied options page HTML
│
├── releases/                  # ← Release zips (git-ignored)
│   └── bookmark-dashboard-v*.zip
└── scripts/
    └── release.sh             # Build → zip dist/ → output to releases/
```

## Settings

Open settings with the **⚙** icon or press `S`.

| Tab | Options |
|---|---|
| General | Display name, Language, Display mode, Nav display, Google Apps visibility |
| Appearance | Theme (dark / light / system), Background image |
| Sidebar | Folder sidebar mode (pinned / float), Pinned bookmarks display |
| Account | Google account (placeholder for future sync) |

## Release

### 1. Bump the version

Edit `"version"` in both `src/manifest.json` and `package.json`.

### 2. Build and package

```bash
./scripts/release.sh
```

The script will:

1. Run `npm run build` — compiles React and copies all extension assets so `dist/` is complete
2. Zip the entire `dist/` folder into `releases/bookmark-dashboard-v{version}.zip`
3. Bundle `config/credentials/key.pem` if it exists (keeps extension ID consistent)

**Options:**

```bash
./scripts/release.sh 1.3.0      # override version
./scripts/release.sh --no-key   # skip PEM bundling
```

### 3. Upload to Chrome Web Store

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Select your extension and upload `dist/bookmark-dashboard-v{version}.zip`

### PEM Key

The private key maintains a consistent extension ID across Web Store updates. Store it at:

```
config/credentials/key.pem
```

This directory is git-ignored. Never commit the key to the repository.

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Storage | `chrome.storage.local` |
| Bookmarks | `chrome.bookmarks` API |
| Styling | CSS custom properties (no CSS-in-JS) |
| i18n | Custom lightweight translator |

## Author

[Encore Shao](https://github.com/encoreshao)
