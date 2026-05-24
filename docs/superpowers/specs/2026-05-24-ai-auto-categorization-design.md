# AI Auto-Categorization — Design Spec

**Date:** 2026-05-24  
**Status:** Approved

## Overview

When the user saves a bookmark (Cmd+D or Chrome ★), a small popup window opens immediately showing AI-suggested tags. The user toggles chips to accept/reject suggestions, optionally adds a custom tag, then clicks Apply. For bookmarks saved before this feature existed (or when the popup is skipped), an on-demand Suggest button in the existing TagPicker provides the same suggestions inline.

---

## Architecture

### Approach: Popup-driven (AI call inside popup)

The service worker stays thin — it only detects `chrome.bookmarks.onCreated`, stores the pending bookmark info, and opens the popup window. The popup page owns the AI call and the full interaction lifecycle.

**Why popup-driven over worker-driven:** Simpler service worker, no polling or storage race conditions. If the popup is dismissed before suggestions arrive, the TagPicker on-demand button covers that case.

### Data flow

```
User presses Cmd+D
  → chrome.bookmarks.onCreated fires in service-worker.js
  → check aiAutoTagEnabled in storage (skip if false or no URL on node)
  → store bd_pendingAutoTag: { bookmarkId, title, url }
  → chrome.windows.create({ url: 'popup/save-popup.html', type: 'popup', width: 340, height: 260 })

SavePopup.tsx loads
  → reads bd_pendingAutoTag + AI settings from chrome.storage
  → no API key → show "Set up AI" prompt with Open Settings button
  → has API key → call suggestTags(title, url) in autoTag.ts
  → shows toggle chips (all pre-selected)
  → user taps chips to toggle, optionally types custom tag
  → Apply button: writes accepted tags to bd_bookmarkTags, clears bd_pendingAutoTag, closes window
  → Skip / close: clears bd_pendingAutoTag, no tags written
```

---

## Files

### New files

| File | Purpose |
|------|---------|
| `src/popup/save-popup.html` | Standalone HTML page for the popup window |
| `src/popup/SavePopup.tsx` | React component — all popup states |
| `src/popup/main.tsx` | Entry point for popup bundle |
| `src/styles/save-popup.css` | Popup-specific styles (dark/light theme aware) |
| `src/utils/autoTag.ts` | `suggestTags(title, url)` — AI call + JSON parse |

### Modified files

| File | Change |
|------|--------|
| `src/js/service-worker.js` | Add `chrome.bookmarks.onCreated` listener |
| `src/manifest.json` | Add popup HTML to `web_accessible_resources`; add build entry |
| `src/types/index.ts` | Add `aiAutoTagEnabled: boolean` to `AppSettings` |
| `src/context/SettingsContext.tsx` | Add `aiAutoTagEnabled` default (`true`) and storage key |
| `src/components/TagPicker.tsx` | Add Suggest button + inline suggestion chips |
| `src/components/SettingsPanel.tsx` | Add Auto-tag toggle in AI & Apps tab |

---

## Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `bd_pendingAutoTag` | `{ bookmarkId: string; title: string; url: string }` | Ephemeral — written by SW, cleared by popup on any exit |
| `bd_aiAutoTagEnabled` | `boolean` | Default `true`. Controlled by Settings toggle. |

---

## UI States

### SavePopup — 3 states

**① Loading** — Spinner + shimmer chips + greyed-out buttons. Shown from popup open until AI responds (~1–3s).

**② Suggestions ready** — 1–3 coloured toggle chips (all pre-selected / filled border). Deselected chips go grey. Custom tag input below. "Skip" and "Apply N Tags" buttons. The Apply button label updates as chips are toggled.

**③ No API key** — Title "✨ Auto-tag with AI", short explanation, "Skip" and "Open Settings →" buttons. Opening Settings navigates to the AI & Apps tab.

### TagPicker — on-demand suggest

A "✨ Suggest with AI" row is added above the search input (only rendered when `aiApiKey` is set — unlike the popup, no "set up AI" prompt is shown here; the button simply doesn't appear). Clicking it calls `suggestTags`, shows a loading spinner inline, then renders suggestion chips in a section above the tag list. Chips behave identically to the popup — toggle to accept/reject. Accepted tags are applied immediately (same as manually adding a tag). Clicking Suggest again regenerates.

---

## AI Prompt

```
You are a bookmark tagging assistant.
Given a page title and URL, suggest 1 to 3 short, lowercase tags.
Tags should be concise (1-2 words), specific, and reusable.

Title: {title}
URL: {url}

Respond with ONLY a JSON array of strings, no explanation:
["react", "tutorial", "frontend"]
```

**Parameters:** Uses the user's configured provider/model via the existing `callAI()` in `utils/ai.ts`. Temperature `0.2`, `max_tokens: 60`.

Only the page title and URL are sent — no page content, no tracking.

---

## Settings

**Location:** Settings → AI & Apps tab, between provider selector and API key field.

**Label:** "Auto-tag on save"  
**Description:** "Show AI tag suggestions in a popup each time you bookmark a page. Uses your configured API key."  
**Control:** Toggle (on/off)  
**Default:** `true`  
**Storage key:** `bd_aiAutoTagEnabled`

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| AI call fails / timeout | Popup shows "Couldn't fetch suggestions" + Retry button. Skip still works — bookmark is already saved. |
| Malformed JSON from AI | Parser tries to extract array from raw response; if it fails, shows error state with Retry + Skip. |
| Popup closed / dismissed before Apply | Treated as Skip — no tags written. `bd_pendingAutoTag` cleared on `window` unload. |
| `chrome.bookmarks.onCreated` fires for a folder | SW checks `node.url` — skips if absent (folders have no URL). |
| `aiAutoTagEnabled` is false | SW skips entirely — no storage write, no popup. |

---

## Out of Scope

- Folder/category suggestions (tags only)
- Batch auto-tagging of existing bookmarks
- Local/on-device model (uses the user's configured external API key)
- Modifying the native Chrome bookmark dialog
