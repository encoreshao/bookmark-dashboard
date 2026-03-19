<p align="center">
  <img src="src/icons/icon128.png" width="80" alt="Bookmark Dashboard" />
</p>

<h1 align="center">Bookmark Dashboard — AI Powered</h1>

<p align="center">
  <strong>Replace your new tab with a smart, beautiful bookmark command center.</strong><br/>
  Search, organize, analyze and optimize your entire bookmark library — powered by AI.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/bookmark-dashboard/imknfkidkilkomeomcidnnjojiilaofb"><img src="https://img.shields.io/chrome-web-store/v/imknfkidkilkomeomcidnnjojiilaofb?label=Chrome%20Web%20Store&color=4285F4&style=flat-square" alt="Chrome Web Store" /></a>
  <img src="https://img.shields.io/badge/manifest-v3-10B981?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/typescript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-F59E0B?style=flat-square" alt="MIT License" />
</p>

---

## Why Bookmark Dashboard?

Chrome's default new tab is wasted real estate. Bookmark Dashboard turns it into a powerful productivity hub — every bookmark you've ever saved is one keystroke away, and AI helps you keep it all tidy.

- **Instant access** — your bookmarks load the moment you open a new tab
- **AI that acts** — not just suggestions, but one-click reorganization of your entire library
- **Zero lock-in** — works directly with Chrome's bookmark API; uninstall anytime and everything stays

---

## Features

### Bookmark Management

| Feature | Description |
|---|---|
| **Full-text search** | Find any bookmark by title or URL — press `/` to jump straight to the search bar |
| **Folder browsing** | Browse bookmarks organized by folder with full path breadcrumbs |
| **Grid & list views** | Switch between a compact list or visual grid layout |
| **Drag & drop** | Move bookmarks between folders by dragging |
| **Pin favorites** | Pin any bookmark to the top bar or a dedicated right sidebar for instant access |
| **Folder sidebar** | Collapsible folder tree — pin it open or use it as a floating overlay |

### AI Insights

Connect your own API key (OpenAI, Google Gemini, or Anthropic Claude) and unlock intelligent bookmark management:

| Mode | What it does |
|---|---|
| **Smart Analysis** | Scores your organization quality (0–100), surfaces insights about folder structure, naming consistency, and content diversity |
| **Find Duplicates** | Instant local scan — finds every duplicate URL across all folders with one-click cleanup |
| **Dead Link Scanner** | Checks every bookmark for broken URLs with a live progress bar; remove dead links in bulk |
| **Smart Reorganize** | AI proposes concrete actions — move, merge, rename, create, delete — and you apply each with a single click |

Custom instructions let you steer the AI's analysis (e.g. *"Group by project, not by technology"*).

### Visualization

- **Domain Graph** — treemap-style dashboard showing your bookmarks grouped by website domain; click any tile to explore
- **Recently Added** — your 50 newest bookmarks at a glance with relative timestamps

### Customization

- **Themes** — dark, light, or system-following with smooth transitions
- **Backgrounds** — choose a preset photo or paste any image URL
- **Google Apps launcher** — customizable popup with your favorite Google services
- **Internationalization** — full UI support for English, 中文, and 日本語
- **Keyboard-first** — nearly every action has a shortcut

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search |
| `?` | Show all keyboard shortcuts |
| `S` | Open settings |
| `T` | Cycle theme (dark → light → system) |
| `V` | Toggle view (list ↔ grid) |
| `D` | Domain graph |
| `R` | Recently added |
| `A` | AI Insights |
| `G` | Google Apps popup |
| `Shift+G` | Open Google.com |
| `Esc` | Close / go back |

---

## Getting Started

### Install from Chrome Web Store

<a href="https://chromewebstore.google.com/detail/bookmark-dashboard/imknfkidkilkomeomcidnnjojiilaofb">
  <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png" width="200" alt="Available on Chrome Web Store" />
</a>

### Install from Source (Developer Mode)

```bash
git clone https://github.com/encoreshao/bookmark-dashboard.git
cd bookmark-dashboard
npm install
npm run build
```

Then load in Chrome:

1. Navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder
4. Open a new tab

### Development

```bash
npm run dev
```

Vite rebuilds `dist/` on every source change. Click **↺ Update** in `chrome://extensions` to reload.

---

## Settings

Press `S` or click the gear icon.

| Tab | What's inside |
|---|---|
| **General** | Display name, language, display mode, nav style, folder sidebar mode, pinned bookmarks position, theme, background image |
| **Personalization** | Custom AI instructions, Google account & sync (coming soon) |
| **AI & Apps** | AI provider & model selection, API key, Google Apps visibility |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 · TypeScript 5 |
| Build | Vite 5 |
| Extension | Chrome Manifest V3 |
| Storage | `chrome.storage.local` |
| Bookmarks | `chrome.bookmarks` API |
| AI | OpenAI · Google Gemini · Anthropic Claude |
| Styling | CSS custom properties |
| i18n | Custom lightweight translator |

---

## Project Structure

```
src/
├── components/     # React UI components (Topbar, BookmarkView, AIInsightsView, …)
├── context/        # React Context providers (Settings, Bookmarks, UI)
├── types/          # Shared TypeScript interfaces
├── utils/          # AI, bookmarks, i18n, time, Google Apps
├── styles/         # CSS (main dashboard + options page)
├── js/             # Service worker, options logic, manifest info
├── options/        # Extension options page (standalone HTML)
├── icons/          # Extension icons (16 / 48 / 128 px)
├── index.html      # Vite entry — new tab page
├── main.tsx        # React entry point
├── App.tsx         # Root component + keyboard shortcuts
└── manifest.json   # Chrome extension manifest (V3)
```

---

## Release

### 1. Bump version

Update `"version"` in both `src/manifest.json` and `package.json`.

### 2. Build & package

```bash
./scripts/release.sh
```

This runs the build, zips `dist/` into `releases/bookmark-dashboard-v{version}.zip`, and optionally bundles your PEM key for a consistent extension ID.

```bash
./scripts/release.sh 2.1.0      # override version
./scripts/release.sh --no-key   # skip PEM bundling
```

### 3. Publish

Upload the zip to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).

> **PEM key** — store at `config/credentials/key.pem` (git-ignored). This keeps your extension ID stable across updates.

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-thing`)
3. Commit your changes
4. Push and open a Pull Request

---

## Author

**Encore Shao** — [GitHub](https://github.com/encoreshao)

## License

[MIT](LICENSE)
