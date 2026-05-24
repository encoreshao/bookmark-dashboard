# AI Auto-Categorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user saves a bookmark, a small popup window opens immediately with AI-suggested tags as toggleable chips; for existing bookmarks the same suggestions are available on demand inside the TagPicker.

**Architecture:** Service worker detects `chrome.bookmarks.onCreated`, stores `bd_pendingAutoTag`, and opens `popup/save-popup.html` via `chrome.windows.create`. The popup page owns the entire AI call + approve/reject interaction. For existing bookmarks, TagPicker gains an on-demand "Suggest with AI" section.

**Tech Stack:** React 18, TypeScript, Vite (multi-entry), Vitest/jsdom, Chrome Extension MV3, existing provider-agnostic `callAI()` in `utils/ai.ts`.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/index.ts` | Modify | Add `aiAutoTagEnabled: boolean` to `AppSettings` |
| `src/context/SettingsContext.tsx` | Modify | Default + storage key for `aiAutoTagEnabled` |
| `src/utils/ai.ts` | Modify | Add `maxTokens` param + `suggestTags()` export |
| `src/tests/suggestTags.test.ts` | Create | Tests for `suggestTags` |
| `src/js/service-worker.js` | Modify | Open popup on new bookmark creation |
| `vite.config.ts` | Modify | Add popup as second build entry |
| `src/popup/save-popup.html` | Create | Standalone HTML for popup window |
| `src/popup/main.tsx` | Create | React entry for popup bundle |
| `src/popup/SavePopup.tsx` | Create | Popup component (loading/ready/error/no-key states) |
| `src/styles/save-popup.css` | Create | Popup styles |
| `src/App.tsx` | Modify | Check `bd_pendingSettingsTab` flag on mount for deep-link |
| `src/components/TagPicker.tsx` | Modify | Add `bookmarkUrl` + `hasAIKey` props + on-demand suggest |
| `src/components/BookmarkItem.tsx` | Modify | Pass `bookmarkUrl` + `hasAIKey` to TagPicker |
| `src/components/SettingsPanel.tsx` | Modify | Auto-tag toggle in AI & Apps tab |
| `src/utils/i18n.ts` | Modify | Add `sp-auto-tag` + `sp-auto-tag-desc` in en/zh/ja |

---

## Task 1: Types and Settings defaults

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/context/SettingsContext.tsx`

- [ ] **Step 1: Add `aiAutoTagEnabled` to `AppSettings`**

In `src/types/index.ts`, add one field to the `AppSettings` interface:

```typescript
export interface AppSettings {
  theme: Theme;
  displayMode: DisplayMode;
  userName: string;
  backgroundImage: string;
  pinnedIds: string[];
  pinnedDisplay: PinnedDisplay;
  folderSidebarOpen: boolean;
  folderSidebarMode: FolderSidebarMode;
  language: Language;
  navDisplay: NavDisplay;
  visibleApps: string[];
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;
  aiCustomInstructions: string;
  aiAutoTagEnabled: boolean;   // ← add this line
}
```

- [ ] **Step 2: Add default and storage key in `SettingsContext.tsx`**

In `src/context/SettingsContext.tsx`, add to `DEFAULTS`:
```typescript
const DEFAULTS: AppSettings = {
  // ... existing fields ...
  aiCustomInstructions: '',
  aiAutoTagEnabled: true,   // ← add
};
```

Add to `STORAGE_KEYS`:
```typescript
const STORAGE_KEYS: Record<keyof AppSettings, string> = {
  // ... existing keys ...
  aiCustomInstructions: 'bd_aiCustomInstructions',
  aiAutoTagEnabled: 'bd_aiAutoTagEnabled',   // ← add
};
```

- [ ] **Step 3: Run the type-check to verify no errors**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npx tsc --noEmit
```

Expected: exits 0 with no output.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/context/SettingsContext.tsx
git commit -m "feat(types): add aiAutoTagEnabled setting"
```

---

## Task 2: `suggestTags` utility + tests (TDD)

**Files:**
- Modify: `src/utils/ai.ts`
- Create: `src/tests/suggestTags.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/tests/suggestTags.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestTags } from '@/utils/ai';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('suggestTags', () => {
  it('returns parsed tag array on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["react", "tutorial", "frontend"]' } }],
      }),
    } as Response);

    const result = await suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'How to Learn React', 'https://css-tricks.com/react');
    expect(result).toEqual(['react', 'tutorial', 'frontend']);
  });

  it('returns at most 3 tags even when AI returns more', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["a", "b", "c", "d", "e"]' } }],
      }),
    } as Response);

    const result = await suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'Title', 'https://example.com');
    expect(result).toHaveLength(3);
  });

  it('returns empty array when AI returns malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Here are some tags: react, tutorial' } }],
      }),
    } as Response);

    const result = await suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'Title', 'https://example.com');
    expect(result).toEqual([]);
  });

  it('throws when the API returns an error status (propagates for Retry UI)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    await expect(
      suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'Title', 'https://example.com')
    ).rejects.toThrow('OpenAI API error: 401');
  });

  it('filters non-string values from the parsed array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["react", 42, null, "tutorial"]' } }],
      }),
    } as Response);

    const result = await suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'Title', 'https://example.com');
    expect(result).toEqual(['react', 'tutorial']);
  });
});
```

- [ ] **Step 2: Run to confirm they all fail**

```bash
cd /Users/encore/Dev/Github/bookmark-dashboard && npm test -- suggestTags
```

Expected: 5 tests fail with "suggestTags is not exported" or similar.

- [ ] **Step 3: Implement `suggestTags` in `src/utils/ai.ts`**

Add `maxTokens` parameter to the three private callers and `callAI`. Replace the existing four functions with:

```typescript
async function callOpenAI(apiKey: string, model: string, prompt: string, maxTokens = 4000): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(apiKey: string, model: string, prompt: string, maxTokens = 4000): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callClaude(apiKey: string, model: string, prompt: string, maxTokens = 4000): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callAI(provider: AIProvider, apiKey: string, model: string, prompt: string, maxTokens = 4000): Promise<string> {
  switch (provider) {
    case 'openai': return callOpenAI(apiKey, model, prompt, maxTokens);
    case 'gemini': return callGemini(apiKey, model, prompt, maxTokens);
    case 'claude': return callClaude(apiKey, model, prompt, maxTokens);
  }
}
```

Then add at the bottom of `src/utils/ai.ts` (after `runReorganizeAnalysis`):

```typescript
function buildTagSuggestionPrompt(title: string, url: string): string {
  return `You are a bookmark tagging assistant.
Given a page title and URL, suggest 1 to 3 short, lowercase tags.
Tags should be concise (1-2 words), specific, and reusable.

Title: ${title}
URL: ${url}

Respond with ONLY a JSON array of strings, no explanation:
["example", "tag", "here"]`;
}

export async function suggestTags(
  provider: AIProvider,
  apiKey: string,
  model: string,
  title: string,
  url: string,
): Promise<string[]> {
  const prompt = buildTagSuggestionPrompt(title, url);
  const raw = await callAI(provider, apiKey, model, prompt, 60);
  try {
    const result = parseJSON<string[]>(raw);
    if (!Array.isArray(result)) return [];
    return result.filter((t): t is string => typeof t === 'string').slice(0, 3);
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- suggestTags
```

Expected: 5 tests pass.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/ai.ts src/tests/suggestTags.test.ts
git commit -m "feat(ai): add suggestTags for lightweight bookmark tag suggestions"
```

---

## Task 3: Service worker — open popup on new bookmark

**Files:**
- Modify: `src/js/service-worker.js`

- [ ] **Step 1: Extend the existing `onCreated` listener**

The file already has a `chrome.bookmarks.onCreated.addListener` block. Replace the entire listener (lines 76–86) with:

```javascript
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  if (!bookmark.url) return;

  // OG image fetch (existing)
  (async () => {
    const ogUrl = await fetchOGImage(bookmark.url);
    const data = await chrome.storage.local.get(OG_CACHE_KEY);
    const cache = data[OG_CACHE_KEY] || {};
    if (id in cache) return;
    cache[id] = ogUrl;
    await chrome.storage.local.set({ [OG_CACHE_KEY]: cache });
  })().catch(err => console.error('[OG] onCreated cache failed:', err));

  // Auto-tag popup
  (async () => {
    const result = await chrome.storage.local.get('bd_aiAutoTagEnabled');
    if (result.bd_aiAutoTagEnabled === false) return;
    await chrome.storage.local.set({
      bd_pendingAutoTag: { bookmarkId: id, title: bookmark.title ?? '', url: bookmark.url },
    });
    await chrome.windows.create({
      url: chrome.runtime.getURL('popup/save-popup.html'),
      type: 'popup',
      width: 340,
      height: 280,
      focused: true,
    });
  })().catch(err => console.error('[AutoTag] popup failed:', err));
});
```

Note: `result.bd_aiAutoTagEnabled === false` means the popup runs when the key is `undefined` (first install, default on) or `true`. It only skips when explicitly set to `false`.

- [ ] **Step 2: Commit**

```bash
git add src/js/service-worker.js
git commit -m "feat(sw): open auto-tag popup on bookmark creation"
```

---

## Task 4: Popup build entry + HTML skeleton

**Files:**
- Modify: `vite.config.ts`
- Create: `src/popup/save-popup.html`
- Create: `src/popup/main.tsx`

- [ ] **Step 1: Add popup input to vite.config.ts**

In `vite.config.ts`, update `rollupOptions.input`:

```typescript
rollupOptions: {
  input: {
    newtab: resolve(__dirname, 'src/index.html'),
    popup:  resolve(__dirname, 'src/popup/save-popup.html'),
  },
},
```

- [ ] **Step 2: Create `src/popup/save-popup.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tag bookmark</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

- [ ] **Step 3: Create `src/popup/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import SavePopup from './SavePopup';
import '../styles/save-popup.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SavePopup />
  </React.StrictMode>
);
```

Note: `SavePopup.tsx` does not exist yet — the build will fail until Task 5. That is expected at this point.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts src/popup/save-popup.html src/popup/main.tsx
git commit -m "feat(build): add save-popup as second vite entry point"
```

---

## Task 5: SavePopup component + CSS

**Files:**
- Create: `src/popup/SavePopup.tsx`
- Create: `src/styles/save-popup.css`

- [ ] **Step 1: Create `src/styles/save-popup.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1e1e2e;
  color: #cdd6f4;
  width: 340px;
  overflow: hidden;
}

.sp-popup { display: flex; flex-direction: column; }

.sp-popup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #45475a;
}

.sp-popup-icon { font-size: 18px; flex-shrink: 0; }

.sp-popup-title-wrap { flex: 1; min-width: 0; }

.sp-popup-title {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-popup-domain { font-size: 10px; color: #6c7086; margin-top: 2px; }

.sp-popup-body { padding: 12px 14px; }

/* Loading */
.sp-popup-loading-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6c7086;
  margin-bottom: 10px;
}

.sp-spinner {
  display: inline-block;
  width: 10px; height: 10px;
  border: 1.5px solid #89b4fa;
  border-top-color: transparent;
  border-radius: 50%;
  animation: sp-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes sp-spin { to { transform: rotate(360deg); } }

.sp-shimmer-row { display: flex; gap: 6px; margin-bottom: 8px; }

.sp-shimmer-chip {
  height: 22px; width: 55px;
  background: #313244; border-radius: 11px; opacity: 0.5;
}

.sp-shimmer-chip.wide { width: 80px; }

.sp-shimmer-actions { display: flex; gap: 6px; }

.sp-shimmer-btn { flex: 1; height: 28px; background: #313244; border-radius: 6px; opacity: 0.35; }
.sp-shimmer-btn.wide { flex: 2; }

/* Hint */
.sp-hint { font-size: 10px; color: #a6aabf; margin-bottom: 8px; }

/* Chips */
.sp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }

.sp-chip {
  background: #313244;
  color: #6c7086;
  border: 1.5px solid #45475a;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.sp-chip.is-selected {
  background: #89b4fa20;
  color: #89b4fa;
  border-color: #89b4fa;
}

/* Custom input */
.sp-custom-input {
  width: 100%;
  background: #313244;
  border: 1px solid #45475a;
  border-radius: 6px;
  padding: 5px 8px;
  color: #cdd6f4;
  font-size: 11px;
  outline: none;
  margin-bottom: 10px;
}

.sp-custom-input:focus { border-color: #89b4fa; }

/* Action buttons */
.sp-actions { display: flex; gap: 6px; }

.sp-btn-skip {
  flex: 1;
  background: #313244; color: #6c7086;
  border: none; padding: 6px;
  border-radius: 6px; font-size: 11px; cursor: pointer;
}

.sp-btn-apply {
  flex: 2;
  background: #89b4fa; color: #1e1e2e;
  border: none; padding: 6px;
  border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;
}

.sp-btn-apply:disabled { opacity: 0.4; cursor: not-allowed; }

.sp-btn-settings {
  flex: 2;
  background: #f9e2af20; color: #f9e2af;
  border: 1px solid #f9e2af40; padding: 6px;
  border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;
}

/* No-key state */
.sp-no-key-title { font-size: 12px; font-weight: 600; color: #f9e2af; margin-bottom: 5px; }
.sp-no-key-desc  { font-size: 11px; color: #6c7086; line-height: 1.5; margin-bottom: 12px; }

/* Error state */
.sp-error-msg { font-size: 11px; color: #a6aabf; margin-bottom: 12px; }
```

- [ ] **Step 2: Create `src/popup/SavePopup.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { suggestTags } from '@/utils/ai';
import { normalizeTag, assignTagColor } from '@/utils/tags';
import type { AIProvider, TagMap, TagColorMap } from '@/types';

interface PendingAutoTag {
  bookmarkId: string;
  title: string;
  url: string;
}

type PopupState = 'loading' | 'ready' | 'error' | 'no-key';

export default function SavePopup() {
  const [pending, setPending] = useState<PendingAutoTag | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customTag, setCustomTag] = useState('');
  const [popupState, setPopupState] = useState<PopupState>('loading');

  const loadAndSuggest = useCallback(async () => {
    setPopupState('loading');
    const result = await chrome.storage.local.get([
      'bd_pendingAutoTag', 'bd_aiApiKey', 'bd_aiProvider', 'bd_aiModel',
    ]);
    const pTag = result.bd_pendingAutoTag as PendingAutoTag | undefined;
    if (!pTag?.bookmarkId) { window.close(); return; }
    setPending(pTag);

    const apiKey = result.bd_aiApiKey as string | undefined;
    if (!apiKey) { setPopupState('no-key'); return; }

    const provider = (result.bd_aiProvider ?? 'openai') as AIProvider;
    const model   = (result.bd_aiModel   ?? 'gpt-4o-mini') as string;

    try {
      const tags = await suggestTags(provider, apiKey, model, pTag.title, pTag.url);
      setSuggestions(tags);
      setSelected(new Set(tags));
      setPopupState('ready');
    } catch {
      setPopupState('error');
    }
  }, []);

  useEffect(() => { void loadAndSuggest(); }, [loadAndSuggest]);

  // Clear storage key when popup closes without Apply
  useEffect(() => {
    const onUnload = () => {
      chrome.storage.local.remove('bd_pendingAutoTag');
    };
    window.addEventListener('unload', onUnload);
    return () => window.removeEventListener('unload', onUnload);
  }, []);

  function toggleChip(tag: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  async function handleApply() {
    if (!pending) return;
    const tags = [...selected];
    const custom = normalizeTag(customTag);
    if (custom) tags.push(custom);
    const unique = [...new Set(tags.filter(Boolean))];

    const result = await chrome.storage.local.get(['bd_bookmarkTags', 'bd_tagColors']);
    const tagMap    = (result.bd_bookmarkTags ?? {}) as TagMap;
    const tagColors = (result.bd_tagColors   ?? {}) as TagColorMap;

    const existing = tagMap[pending.bookmarkId] ?? [];
    tagMap[pending.bookmarkId] = [...new Set([...existing, ...unique])];

    const colors = { ...tagColors };
    for (const tag of unique) {
      if (!colors[tag]) colors[tag] = assignTagColor(colors);
    }

    await chrome.storage.local.set({ bd_bookmarkTags: tagMap, bd_tagColors: colors });
    await chrome.storage.local.remove('bd_pendingAutoTag');
    window.close();
  }

  async function handleSkip() {
    await chrome.storage.local.remove('bd_pendingAutoTag');
    window.close();
  }

  function handleOpenSettings() {
    chrome.storage.local.set({ bd_pendingSettingsTab: 'ai-apps' }, () => {
      window.open(chrome.runtime.getURL('index.html'), '_blank');
      window.close();
    });
  }

  const hostname = (() => {
    try { return pending?.url ? new URL(pending.url).hostname : ''; } catch { return ''; }
  })();

  const appliedCount = selected.size + (normalizeTag(customTag) ? 1 : 0);

  return (
    <div className="sp-popup">
      <div className="sp-popup-header">
        <span className="sp-popup-icon">🔖</span>
        <div className="sp-popup-title-wrap">
          <div className="sp-popup-title">{pending?.title || 'Untitled'}</div>
          <div className="sp-popup-domain">{hostname} · ✓ Saved</div>
        </div>
      </div>

      <div className="sp-popup-body">
        {popupState === 'loading' && (
          <>
            <div className="sp-popup-loading-text">
              <span className="sp-spinner" />
              Suggesting tags…
            </div>
            <div className="sp-shimmer-row">
              <div className="sp-shimmer-chip" />
              <div className="sp-shimmer-chip wide" />
              <div className="sp-shimmer-chip" />
            </div>
            <div className="sp-shimmer-actions">
              <div className="sp-shimmer-btn" />
              <div className="sp-shimmer-btn wide" />
            </div>
          </>
        )}

        {popupState === 'error' && (
          <>
            <p className="sp-error-msg">Couldn't fetch suggestions.</p>
            <div className="sp-actions">
              <button className="sp-btn-skip" onClick={handleSkip}>Skip</button>
              <button className="sp-btn-apply" onClick={loadAndSuggest}>Retry</button>
            </div>
          </>
        )}

        {popupState === 'no-key' && (
          <>
            <p className="sp-no-key-title">✨ Auto-tag with AI</p>
            <p className="sp-no-key-desc">
              Add an AI API key in Settings to automatically suggest tags when you save bookmarks.
            </p>
            <div className="sp-actions">
              <button className="sp-btn-skip" onClick={handleSkip}>Skip</button>
              <button className="sp-btn-settings" onClick={handleOpenSettings}>Open Settings →</button>
            </div>
          </>
        )}

        {popupState === 'ready' && (
          <>
            <p className="sp-hint">✨ AI suggested — tap to toggle</p>
            <div className="sp-chips">
              {suggestions.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`sp-chip${selected.has(tag) ? ' is-selected' : ''}`}
                  onClick={() => toggleChip(tag)}
                >
                  {selected.has(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>
            <input
              className="sp-custom-input"
              placeholder="Add custom tag…"
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && appliedCount > 0) void handleApply(); }}
            />
            <div className="sp-actions">
              <button className="sp-btn-skip" onClick={handleSkip}>Skip</button>
              <button
                className="sp-btn-apply"
                onClick={handleApply}
                disabled={appliedCount === 0}
              >
                Apply {appliedCount > 0 ? `${appliedCount} Tag${appliedCount !== 1 ? 's' : ''}` : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run full build to confirm popup compiles**

```bash
npm run build
```

Expected: exits 0. Verify `dist/popup/save-popup.html` exists:
```bash
ls dist/popup/
```
Expected: `save-popup.html` present.

- [ ] **Step 4: Run type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/popup/SavePopup.tsx src/styles/save-popup.css
git commit -m "feat(popup): add SavePopup component with loading/ready/error/no-key states"
```

---

## Task 6: App.tsx — deep-link to settings from popup

**Files:**
- Modify: `src/App.tsx`

When the user clicks "Open Settings →" in the popup (no-key state), the popup sets `bd_pendingSettingsTab: 'ai-apps'` in storage then opens the newtab. The app must check this flag on load and open the settings panel directly to the AI & Apps tab.

- [ ] **Step 1: Add a `useEffect` in `App.tsx` to check for pending settings tab**

The `App` function already imports `openSettings` from `useUI()`. Add this effect after the existing keyboard-shortcut effect (around line 96):

```tsx
// Deep-link: popup "Open Settings" writes bd_pendingSettingsTab before opening newtab
useEffect(() => {
  if (!isLoaded) return;
  chrome.storage.local.get('bd_pendingSettingsTab', (result) => {
    const tab = result.bd_pendingSettingsTab as string | undefined;
    if (tab) {
      chrome.storage.local.remove('bd_pendingSettingsTab');
      openSettings(tab);
    }
  });
}, [isLoaded, openSettings]);
```

Note: `openSettings(tab)` sets both the active tab and opens the panel — it already accepts a tab string argument (see `UIContext.tsx:40`).

- [ ] **Step 2: Run type-check**

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): open settings to AI tab when popup sets bd_pendingSettingsTab"
```

---

## Task 7: TagPicker — on-demand suggest

**Files:**
- Modify: `src/components/TagPicker.tsx`
- Modify: `src/components/BookmarkItem.tsx`

- [ ] **Step 1: Update `TagPicker` props interface and add suggest state**

In `src/components/TagPicker.tsx`, update the `Props` interface and add imports:

```typescript
import { suggestTags } from '@/utils/ai';
import type { AIProvider } from '@/types';
```

Update the `Props` interface:
```typescript
interface Props {
  bookmarkId: string;
  bookmarkTitle: string;
  bookmarkUrl?: string;   // ← add
  hasAIKey?: boolean;     // ← add
  anchorEl: HTMLElement;
  onClose: () => void;
}
```

Add new state variables inside the `TagPicker` function (after the existing `query` state):
```typescript
const [suggestState, setSuggestState] = useState<'idle' | 'loading' | 'done'>('idle');
const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
```

- [ ] **Step 2: Add `handleSuggest` callback**

Add this callback inside `TagPicker` (after the `createAndApply` callback):

```typescript
const handleSuggest = useCallback(async () => {
  setSuggestState('loading');
  try {
    const result = await chrome.storage.local.get(['bd_aiApiKey', 'bd_aiProvider', 'bd_aiModel']);
    const apiKey   = result.bd_aiApiKey   as string;
    const provider = (result.bd_aiProvider ?? 'openai') as AIProvider;
    const model    = (result.bd_aiModel   ?? 'gpt-4o-mini') as string;
    const tags = await suggestTags(provider, apiKey, model, bookmarkTitle, bookmarkUrl ?? '');
    setAiSuggestions(tags);
    setSuggestState('done');
  } catch {
    setSuggestState('idle');
  }
}, [bookmarkTitle, bookmarkUrl]);
```

- [ ] **Step 3: Add suggest section to the render JSX**

In the returned JSX of `TagPicker`, add the suggest section between the header div and the input wrapper div. The full updated return should look like:

```tsx
return createPortal(
  <div ref={pickerRef} className="tag-picker" style={{ top, left }}>
    <div className="tag-picker-header">
      {/* existing header content unchanged */}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2z"/>
        <circle cx="7" cy="7" r="1" fill="currentColor"/>
      </svg>
      Tags · <strong>{bookmarkTitle}</strong>
    </div>

    {/* ── NEW: AI suggest row ── */}
    {hasAIKey && (
      <div className="tag-picker-suggest-row">
        {suggestState === 'loading' ? (
          <span className="tag-picker-suggest-loading">Suggesting…</span>
        ) : suggestState === 'done' && aiSuggestions.length > 0 ? (
          <div className="tag-picker-suggestions">
            <span className="tag-picker-suggest-hint">✨ Suggestions</span>
            <div className="tag-picker-suggest-chips">
              {aiSuggestions.map(tag => {
                const isApplied = applied.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-picker-suggest-chip${isApplied ? ' is-applied' : ''}`}
                    onClick={() => { toggleTag(tag); }}
                  >
                    {isApplied ? '✓ ' : ''}{tag}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <button type="button" className="tag-picker-suggest-btn" onClick={handleSuggest}>
            ✨ Suggest with AI
          </button>
        )}
      </div>
    )}
    {/* ── END NEW ── */}

    <div className="tag-picker-input-wrap">
      {/* existing input unchanged */}
      <input
        ref={inputRef}
        className="tag-picker-input"
        placeholder="Search or create tag…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
    <div className="tag-picker-list">
      {/* existing list content unchanged */}
      {filtered.map(tag => (
        <div
          key={tag}
          className={`tag-picker-item${applied.includes(tag) ? ' is-checked' : ''}`}
          onClick={() => { toggleTag(tag); setQuery(''); }}
        >
          <div className="tag-picker-check">{applied.includes(tag) && '✓'}</div>
          <div className="tag-picker-dot" style={{ background: tagColors[tag] ?? 'var(--text-muted)' }} />
          <span style={{ color: tagColors[tag] ?? 'inherit' }}>{tag}</span>
        </div>
      ))}
      {canCreate && (
        <div className="tag-picker-create" onClick={createAndApply}>
          <span>+</span>
          <span>Create &ldquo;{normalizedQuery}&rdquo;</span>
        </div>
      )}
      {filtered.length === 0 && !canCreate && (
        <div style={{ padding: '6px 6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          No tags yet — type to create one
        </div>
      )}
    </div>
  </div>,
  document.body
);
```

- [ ] **Step 4: Add CSS for the new suggest section to `src/styles/tags.css`**

Open `src/styles/tags.css` and append at the bottom:

```css
/* AI suggest row inside TagPicker */
.tag-picker-suggest-row {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-subtle, #45475a);
  background: var(--bg-base, #181825);
}

.tag-picker-suggest-btn {
  width: 100%;
  background: none;
  border: 1px solid var(--border-subtle, #45475a);
  border-radius: 5px;
  padding: 4px 8px;
  color: var(--accent-green, #a6e3a1);
  font-size: 10px;
  cursor: pointer;
  text-align: left;
}

.tag-picker-suggest-btn:hover { background: var(--bg-surface, #313244); }

.tag-picker-suggest-loading { font-size: 10px; color: var(--text-muted); }

.tag-picker-suggest-hint { font-size: 9px; color: var(--text-subtext, #a6aabf); display: block; margin-bottom: 5px; }

.tag-picker-suggest-chips { display: flex; flex-wrap: wrap; gap: 4px; }

.tag-picker-suggest-chip {
  background: var(--bg-surface, #313244);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle, #45475a);
  padding: 2px 7px;
  border-radius: 8px;
  font-size: 10px;
  cursor: pointer;
}

.tag-picker-suggest-chip.is-applied {
  color: var(--accent-blue, #89b4fa);
  border-color: var(--accent-blue, #89b4fa);
}
```

- [ ] **Step 5: Pass new props from `BookmarkItem.tsx`**

In `src/components/BookmarkItem.tsx`, update the `TagPicker` usage (around line 224):

```tsx
{pickerOpen && tagBtnRef.current && (
  <TagPicker
    bookmarkId={bookmark.id}
    bookmarkTitle={bookmark.title}
    bookmarkUrl={bookmark.url}
    hasAIKey={!!settings.aiApiKey}
    anchorEl={tagBtnRef.current}
    onClose={() => setPickerOpen(false)}
  />
)}
```

- [ ] **Step 6: Type-check and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/TagPicker.tsx src/components/BookmarkItem.tsx src/styles/tags.css
git commit -m "feat(tagpicker): add on-demand AI suggest button for existing bookmarks"
```

---

## Task 8: Settings panel — auto-tag toggle + i18n

**Files:**
- Modify: `src/utils/i18n.ts`
- Modify: `src/components/SettingsPanel.tsx`

- [ ] **Step 1: Add translation keys to `src/utils/i18n.ts`**

In `TRANSLATIONS.en` (after the `sp-ai-model` entries), add:
```typescript
'sp-auto-tag': 'Auto-tag on save',
'sp-auto-tag-desc': 'Show AI tag suggestions in a popup each time you bookmark a page. Uses your configured API key.',
```

In `TRANSLATIONS.zh` (after `sp-ai-model-desc`), add:
```typescript
'sp-auto-tag': '保存时自动标签',
'sp-auto-tag-desc': '每次收藏网页时，在弹出窗口中显示AI标签建议。使用您配置的API密钥。',
```

In `TRANSLATIONS.ja` (after `sp-ai-model-desc`), add:
```typescript
'sp-auto-tag': '保存時に自動タグ付け',
'sp-auto-tag-desc': 'ページをブックマークするたびにAIタグ提案をポップアップで表示。設定済みのAPIキーを使用します。',
```

- [ ] **Step 2: Add toggle to `src/components/SettingsPanel.tsx`**

In the `ai-apps` tab section, after the model `<select>` group and before the API Key group (i.e. between the closing `</div>` of the model group and the opening `<div className="sp-group">` of the API Key group), add:

```tsx
<div className="sp-group">
  <label className="sp-label">{t('sp-auto-tag')}</label>
  <p className="sp-desc">{t('sp-auto-tag-desc')}</p>
  <Toggle<'on' | 'off'>
    value={draft.aiAutoTagEnabled ? 'on' : 'off'}
    onChange={v => set('aiAutoTagEnabled', v === 'on')}
    options={[
      { value: 'on', label: 'On' },
      { value: 'off', label: 'Off' },
    ]}
  />
</div>
```

- [ ] **Step 3: Type-check and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: both exit 0.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/i18n.ts src/components/SettingsPanel.tsx
git commit -m "feat(settings): add auto-tag on save toggle in AI & Apps tab"
```

---

## Task 9: End-to-end smoke test

- [ ] **Step 1: Load extension in Chrome**

In Chrome, go to `chrome://extensions`, enable "Developer mode", click "Load unpacked", select the `dist/` directory.

- [ ] **Step 2: Test the save popup flow**

1. Open any webpage (e.g. `https://css-tricks.com`)
2. Press Cmd+D (or click ★) to bookmark it
3. Expected: a small ~340×280 popup window opens
4. If API key is configured: spinner shows briefly, then 1–3 tag chips appear pre-selected
5. Deselect one chip — it goes grey
6. Click "Apply N Tags" — window closes
7. In the dashboard (new tab), open the bookmark's tag picker — confirm the selected tags are applied

- [ ] **Step 3: Test the no-key state**

1. In Settings → AI & Apps, clear the API key and save
2. Bookmark a new page
3. Expected: popup opens immediately (no loading) showing the "Set up AI" prompt
4. Click "Open Settings →" — new tab opens with settings panel on AI & Apps tab

- [ ] **Step 4: Test the auto-tag disabled state**

1. In Settings → AI & Apps, set "Auto-tag on save" to Off and save
2. Bookmark a new page
3. Expected: no popup opens at all

- [ ] **Step 5: Test TagPicker on-demand suggest**

1. Re-enable API key in settings
2. Open any bookmark's tag picker (click the 🏷 button)
3. Expected: "✨ Suggest with AI" button appears at top
4. Click it — loading text shown, then suggestion chips appear
5. Toggle chips — click Apply

- [ ] **Step 6: Final build + commit**

```bash
npm run build && npm test
git add -A
git commit -m "feat: AI auto-categorization — save popup + TagPicker on-demand suggest"
```
