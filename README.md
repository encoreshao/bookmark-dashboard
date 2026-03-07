# Bookmark Dashboard

A powerful, AI-enhanced Chrome extension that replaces your new tab with a fully-featured bookmark dashboard — built with **React + TypeScript + Vite**.

## Features

### Core
- Browse all Chrome bookmarks organised by folder
- Search bookmarks by title or URL (keyboard shortcut: `/`)
- Grid and list view modes
- Drag bookmarks between folders
- Pin any bookmark for quick access (top bar or right sidebar)
- Folder sidebar — pinned or floating, collapsible tree
- Greeting + live clock with locale-aware formatting

### AI Insights
- **Smart Analysis** — AI-powered organisation scoring, category breakdown, and actionable insights
- **Find Duplicates** — instant local scan for duplicate URLs with one-click cleanup
- **Dead Link Scanner** — checks all bookmarks for broken URLs and lets you remove them
- **Smart Reorganise** — AI suggests folder restructuring; apply moves, merges, renames, and deletions with a single click
- Supports **OpenAI**, **Google Gemini**, and **Anthropic Claude** providers

### Visualisation
- **Domain Graph** — treemap-inspired dashboard grouping bookmarks by website domain
- **Recently Added** — instantly see your 50 newest bookmarks

### Customisation
- Dark / light / system theme with smooth transitions
- Background image presets or custom URL
- Customisable Google Apps launcher (choose which apps appear)
- Full internationalisation: English, 中文, 日本語

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
| `A` | AI Insights |
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
│   │   ├── AIInsightsView.tsx # AI analysis dashboard (4 scan modes)
│   │   ├── SettingsPanel.tsx  # Settings panel (3 tabs)
│   │   ├── Footer.tsx         # Fixed bottom footer with gradient accent
│   │   ├── KeyboardShortcuts.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── Toast.tsx
│   │
│   ├── context/               # React Context providers
│   │   ├── SettingsContext.tsx # Settings state ↔ chrome.storage.local
│   │   ├── BookmarkContext.tsx # Bookmark tree via chrome.bookmarks API
│   │   └── UIContext.tsx      # Active view, modals, toasts
│   │
│   ├── types/
│   │   └── index.ts           # Shared TypeScript interfaces
│   │
│   ├── utils/
│   │   ├── ai.ts              # AI providers, prompts, local scanners
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
│   ├── manifest.json
│   ├── icons/
│   ├── index.html
│   ├── assets/                # Bundled JS + CSS (hashed filenames)
│   ├── js/
│   ├── styles/
│   └── options/
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
| General | Display name, Language, Display mode, Nav display, Google Apps visibility, Folder sidebar mode, Pinned bookmarks display |
| Appearance | Theme (dark / light / system), Background image, Google account |
| AI | Provider (OpenAI / Gemini / Claude), Model, API key |

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
| AI | OpenAI / Google Gemini / Anthropic Claude APIs |
| Styling | CSS custom properties (no CSS-in-JS) |
| i18n | Custom lightweight translator |

## Author

[Encore Shao](https://github.com/encoreshao)

## License

MIT
