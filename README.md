<p align="center">
  <img src="src/icons/icon128.png" width="80" alt="Bookmark Dashboard" />
</p>

<h1 align="center">Bookmark Dashboard — AI Powered</h1>

<p align="center">
  <strong>Replace your new tab with a smart, beautiful bookmark command center.</strong><br/>
  Search, organize, tag, and analyze your entire bookmark library — powered by AI.
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

Chrome's default new tab is wasted real estate. Every day you open a new tab and stare at a blank page — while hundreds of bookmarks you saved with intention collect dust in folders you've forgotten exist.

Bookmark Dashboard turns that wasted moment into a powerful productivity hub:

- **Every bookmark, instantly** — your entire library loads the moment you open a new tab
- **AI that acts, not just advises** — one-click reorganization, duplicate removal, and dead link cleanup
- **Tags, not just folders** — layer a flexible tag system on top of Chrome's folder structure
- **Zero lock-in** — works directly with Chrome's bookmark API; uninstall and nothing changes

---

## Features

### Bookmark Management

| Feature | Description |
|---|---|
| **Full-text search** | Find any bookmark by title or URL instantly — `⌘K` / `Ctrl+K` jumps to the search bar |
| **Add new bookmark** | `N` opens a two-step dialog: enter URL + title + folder, then apply tags (with optional AI suggestions) |
| **Drag & drop** | Move bookmarks between folders by dragging; visual feedback throughout |
| **Batch operations** | Select multiple bookmarks to move or delete in one action |
| **Edit & delete** | Rename bookmarks, delete with confirmation — all from the card |
| **Pin favorites** | Pin any bookmark to an always-visible top section or dedicated right sidebar |
| **Folder sidebar** | Collapsible folder tree — pin it open or hover to reveal as a floating overlay; the sidebar splits evenly between folders (top) and tags (bottom), each with independent scrolling |
| **Folder search** | Filter the folder tree in real time to jump to any folder instantly |

### Tags

Tags layer on top of Chrome's folder structure without replacing it. A bookmark can live in one folder and carry any number of tags.

| Feature | Description |
|---|---|
| **Flexible tagging** | Tag any bookmark with one or many tags — no predefined list required |
| **Auto-color assignment** | Each tag gets a unique color from a 10-color palette automatically |
| **Tag filter strip** | Click one or more tags to instantly filter the entire dashboard |
| **Sidebar tag browser** | Scrollable tag list in the folder sidebar with per-tag counts |
| **AI tag suggestions** | When adding a bookmark, AI proposes relevant tags based on the page content |
| **Auto-tag on save** | Optionally trigger AI tag suggestions automatically whenever you save a new bookmark |
| **Tag management** | Create, rename, and remove tags; orphaned tags are cleaned up automatically |

### AI Insights

Connect your own API key — OpenAI, Google Gemini, or Anthropic Claude — and unlock intelligent bookmark management. Your key is stored locally and never shared.

| Mode | What it does |
|---|---|
| **Organization Score** | Rates your bookmark library's organization quality (0–100) with specific, actionable insights |
| **Smart Analysis** | Full overview: folder structure health, naming consistency, content diversity, and top suggestions |
| **Find Duplicates** | Instant local scan — surfaces every duplicate URL across all folders with one-click cleanup |
| **Dead Link Scanner** | Checks every bookmark for broken URLs with a live progress bar and cancellation support; remove dead links in bulk |
| **Smart Reorganize** | AI proposes concrete actions — move, merge, rename, create, delete — apply each with one click; full action history included |
| **Empty Folder Cleanup** | Detects and removes empty folders with a single action |

**Supported AI providers:**
- **OpenAI** — GPT-4o, GPT-4o Mini, GPT-4.1 Mini
- **Google Gemini** — Gemini 2.0 Flash, Gemini 2.5 Pro
- **Anthropic Claude** — Claude Sonnet 4, Claude Haiku

Custom instructions let you steer the AI's analysis (e.g. *"Group by project, not by technology"* or *"Focus on dev and design bookmarks"*).

### Domain View

See exactly where your bookmarks live across the web.

| Feature | Description |
|---|---|
| **Domain treemap** | Visual tile grid — larger tiles for domains with more bookmarks |
| **Domain stats** | Bookmark count and percentage of total for every domain |
| **Domain explorer** | Click any tile to open a full filtered view of that domain's bookmarks |
| **List mode** | Switch to a ranked list with percentage bars |
| **Favicon display** | Domain icons throughout; graceful fallback to domain initials |

### Reading List

A distraction-free reading space built into your new tab.

| Feature | Description |
|---|---|
| **Quick-add** | Paste any URL or add directly from a bookmark; content is fetched and cached |
| **Built-in reader** | Extracted, readable article view — no ads, no clutter |
| **Status tracking** | Mark articles as read (archived) or unread; auto-selects first unread on open |
| **Archive & restore** | Archive when done; unarchive to re-read; remove when finished |
| **Persistent storage** | Reading list survives browser restarts and extension updates |

### Customization

| Option | Choices |
|---|---|
| **Theme** | Dark · Light · System (follows OS preference, switches automatically) |
| **Background** | 5 preset photos (Mountains, Ocean, Forest, City, Night) · Custom image URL · None |
| **Display mode** | Grid · List · Compact — toggle with `V` |
| **Navigation bar** | Full (icon + label) · Compact (icon only) |
| **Folder sidebar** | Pinned (always visible) · Float (hover to reveal) |
| **Pinned bookmarks** | Top section · Dedicated right sidebar |
| **Language** | English · 简体中文 · 日本語 |

### Hero Section

Every new tab opens with a personal touch:

- **Time-aware greeting** — Good morning / afternoon / evening / night with your display name
- **Live clock** — Real-time clock and date always visible
- **Unified search** — One search bar, all bookmarks

### Google Apps Launcher

One keypress (`G`) opens a customizable Google Apps menu. Choose which services appear from the full suite: Gmail, Calendar, Drive, Docs, Sheets, Slides, Meet, Keep, NotebookLM, YouTube, Gemini, AI Studio, and more.

### Save Popup

Click the extension icon on any page to save it immediately:

- Auto-populates URL and page title
- Shows AI-suggested tags (if enabled)
- Full tag editor — apply suggestions, add custom tags, remove any
- Saves the bookmark without leaving the current page

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Focus search |
| `N` | Add new bookmark |
| `?` | Show all keyboard shortcuts |
| `S` | Settings |
| `T` | Cycle theme (dark → light → system) |
| `V` | Toggle display mode (grid ↔ list ↔ compact) |
| `D` | Domain view |
| `R` | Recently added |
| `A` | AI Insights |
| `L` | Reading list |
| `G` | Google Apps menu |
| `Shift+G` | Open Google.com |
| `Esc` | Close / go back / clear search |

Configure the AI-tag-current-page extension shortcut at `chrome://extensions/shortcuts`.

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

## Settings Reference

Press `S` or click the gear icon to open settings.

| Tab | What's inside |
|---|---|
| **General** | Display name · Language · Display mode · Nav style · Folder sidebar mode · Pinned bookmarks position |
| **Personalization** | Theme · Background image |
| **AI & Apps** | AI provider · Model · API key (stored locally) · Custom instructions · Auto-tag on save · Google Apps visibility |
| **Account** | Google Account integration (sync — coming soon) |

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
| Article parsing | Mozilla Readability |
| Styling | CSS custom properties |
| i18n | Custom lightweight translator (EN / ZH / JA) |

---

## Project Structure

```
src/
├── components/     # React UI components (Topbar, BookmarkView, AIInsightsView, …)
├── context/        # React Context providers (Settings, Bookmarks, UI, Tags)
├── types/          # Shared TypeScript interfaces
├── utils/          # AI, bookmarks, i18n, tags, time, Google Apps helpers
├── styles/         # CSS (main dashboard, tags, reading list, options page)
├── js/             # Service worker, options logic
├── options/        # Extension options page (standalone HTML)
├── popup/          # Save bookmark popup
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
