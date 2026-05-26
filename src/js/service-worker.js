/* Service Worker (Manifest V3) */

const OG_CACHE_KEY = 'bd_og_cache';
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;
const FETCH_TIMEOUT_MS = 8000;

const TAG_PALETTE_SW = [
  '#cba6f7', '#89b4fa', '#a6e3a1', '#f38ba8', '#fab387',
  '#89dceb', '#f9e2af', '#b4befe', '#94e2d5', '#eba0ac',
];

function assignTagColorSW(existingColors) {
  const used = new Set(Object.values(existingColors));
  return TAG_PALETTE_SW.find(c => !used.has(c))
    ?? TAG_PALETTE_SW[Object.keys(existingColors).length % TAG_PALETTE_SW.length];
}

async function fetchOGImage(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) { clearTimeout(timer); return null; }
    clearTimeout(timer);
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match ? match[1] : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function processQueue(queue) {
  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(({ id, url }) =>
        fetchOGImage(url).then(ogUrl => ({ id, ogUrl }))
      )
    );
    const data = await chrome.storage.local.get(OG_CACHE_KEY);
    const cache = data[OG_CACHE_KEY] || {};
    let changed = false;
    for (const { id, ogUrl } of results) {
      if (!(id in cache)) { cache[id] = ogUrl; changed = true; }
    }
    if (changed) await chrome.storage.local.set({ [OG_CACHE_KEY]: cache });
    if (i + BATCH_SIZE < queue.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }
}

async function batchFetchAllBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  const all = [];
  function collect(nodes) {
    for (const n of nodes) {
      if (n.url) all.push({ id: n.id, url: n.url });
      if (n.children) collect(n.children);
    }
  }
  collect(tree);

  const data = await chrome.storage.local.get(OG_CACHE_KEY);
  const cache = data[OG_CACHE_KEY] || {};
  const queue = all.filter(({ id }) => !(id in cache));
  await processQueue(queue);
}

function registerContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'bd-add-page',
      title: 'Add to Bookmark',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
    chrome.contextMenus.create({
      id: 'bd-add-link',
      title: 'Add to Bookmark',
      contexts: ['link'],
    });
  });
}

/** Flatten the bookmark tree into [{id, title, indent}] folder list. */
async function getBookmarkFolders() {
  const tree = await chrome.bookmarks.getTree();
  const folders = [];
  function collect(nodes, indent) {
    for (const node of nodes) {
      if (!node.url) {
        if (node.title) folders.push({ id: node.id, title: node.title, indent });
        if (node.children) collect(node.children, node.title ? indent + 1 : indent);
      }
    }
  }
  collect(tree[0]?.children ?? [], 0);
  return folders;
}

/* ─── Message handler: create bookmark + save tags (called from injected dialog) ─── */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'bd_createAndTag') return false;
  (async () => {
    // Suppress onCreated auto-tag popup for this programmatic creation
    await chrome.storage.local.set({ bd_suppressAutoTag: true });

    const bm = await chrome.bookmarks.create({
      url: msg.url,
      title: msg.title || msg.url,
      parentId: msg.folderId,
    });

    if (msg.tags?.length) {
      const result  = await chrome.storage.local.get(['bd_bookmarkTags', 'bd_tagColors']);
      const tagMap    = result.bd_bookmarkTags ?? {};
      const tagColors = result.bd_tagColors ?? {};
      tagMap[bm.id]   = [...new Set(msg.tags)];
      for (const tag of msg.tags) {
        if (!tagColors[tag]) tagColors[tag] = assignTagColorSW(tagColors);
      }
      await chrome.storage.local.set({ bd_bookmarkTags: tagMap, bd_tagColors: tagColors });
    }

    sendResponse({ ok: true });
  })().catch(err => {
    console.error('[bd_createAndTag]', err);
    sendResponse({ ok: false });
  });
  return true; // keep message channel open for async response
});

/* ─── In-page tag dialog ─── */
// Injected into the active tab via chrome.scripting.executeScript.
// Must be entirely self-contained — no closure over outer scope variables.

async function mountTagDialog({ bookmarkId, title, url, folders, defaultFolderId }) {
  const HOST_ID = 'bd-tag-dialog-host';
  if (document.getElementById(HOST_ID)) return;

  // bookmarkId === null  →  new bookmark (show folder picker + send message to SW)
  // bookmarkId === string →  existing bookmark (write tags directly to storage)
  const IS_NEW = bookmarkId === null || bookmarkId === undefined;

  const CHIP_COLORS = [
    '#3B82F6', '#22C55E', '#A855F7', '#F97316', '#EC4899',
    '#14B8A6', '#EF4444', '#EAB308', '#6366F1', '#06B6D4',
  ];
  const TAG_PALETTE = [
    '#cba6f7', '#89b4fa', '#a6e3a1', '#f38ba8', '#fab387',
    '#89dceb', '#f9e2af', '#b4befe', '#94e2d5', '#eba0ac',
  ];

  function normalizeTag(name) {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  }
  function assignTagColor(existingColors) {
    const used = new Set(Object.values(existingColors));
    return TAG_PALETTE.find(c => !used.has(c))
      ?? TAG_PALETTE[Object.keys(existingColors).length % TAG_PALETTE.length];
  }

  // ── Shadow host & root ──
  const host = document.createElement('div');
  host.id = HOST_ID;
  Object.assign(host.style, {
    position: 'fixed', inset: '0', zIndex: '2147483647',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
  });
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .dialog {
      --bg: #FFFFFF; --header-bg: #F8FAFC; --surface: #F1F5F9;
      --border: #E2E8F0; --text: #0F172A; --text-muted: #64748B; --text-sub: #94A3B8;
      --accent: #2563EB; --accent-fg: #FFFFFF;
      --accent-light: rgba(37,99,235,0.09); --accent-border: rgba(37,99,235,0.28);
      --success: #16A34A; --success-bg: rgba(22,163,74,0.09);
      background: var(--bg); color: var(--text); border-radius: 14px;
      width: 460px; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1);
      animation: pop-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes pop-in {
      from { opacity: 0; transform: scale(0.93) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @media (prefers-color-scheme: dark) {
      .dialog {
        --bg: #1B2332; --header-bg: #161E2D; --surface: #222E42; --border: #2B3A52;
        --text: #E2E8F0; --text-muted: #7B90A6; --text-sub: #4D6070;
        --accent: #4D94FF; --accent-fg: #FFFFFF;
        --accent-light: rgba(77,148,255,0.14); --accent-border: rgba(77,148,255,0.30);
        --success: #34D399; --success-bg: rgba(52,211,153,0.10);
      }
    }

    /* Header */
    .header {
      display: flex; align-items: center; gap: 10px;
      padding: 13px 16px; background: var(--header-bg);
      border-bottom: 1px solid var(--border);
    }
    .header-icon {
      flex-shrink: 0; width: 34px; height: 34px; border-radius: 9px;
      background: var(--accent-light); display: flex;
      align-items: center; justify-content: center; color: var(--accent);
    }
    .title-wrap { flex: 1; min-width: 0; }
    .bm-title {
      font-size: 12.5px; font-weight: 600; line-height: 1.3;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text);
    }
    .bm-domain {
      font-size: 10.5px; color: var(--text-muted); margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .saved-badge {
      flex-shrink: 0; background: var(--success-bg); color: var(--success);
      border-radius: 5px; padding: 2px 8px; font-size: 10px; font-weight: 700;
      letter-spacing: 0.03em;
    }

    /* Body */
    .body { padding: 14px 16px 15px; }

    /* Folder picker */
    .folder-section { margin-bottom: 13px; }
    .folder-label {
      display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
      text-transform: uppercase; color: var(--text-muted); margin-bottom: 5px;
    }
    .folder-select-wrap {
      display: flex; align-items: center; gap: 7px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 0 10px;
      transition: border-color 0.12s, box-shadow 0.12s;
    }
    .folder-select-wrap:focus-within {
      border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light);
    }
    .folder-icon { color: var(--text-muted); flex-shrink: 0; display: flex; }
    .folder-select {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--text); font-size: 11.5px; font-family: inherit;
      padding: 8px 0; cursor: pointer; appearance: none; -webkit-appearance: none;
    }
    .folder-chevron { color: var(--text-muted); flex-shrink: 0; display: flex; pointer-events: none; }

    /* Divider */
    .divider { height: 1px; background: var(--border); margin: 0 0 13px; }

    /* Loading */
    .loading-text {
      display: flex; align-items: center; gap: 7px;
      font-size: 11.5px; color: var(--text-muted); margin-bottom: 11px;
    }
    .spinner {
      display: inline-block; width: 11px; height: 11px;
      border: 1.5px solid var(--border); border-top-color: var(--accent);
      border-radius: 50%; animation: spin 0.65s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shimmer {
      from { background-position: 200% 0; }
      to   { background-position: -200% 0; }
    }
    .shimmer-row { display: flex; gap: 6px; margin-bottom: 10px; }
    .shimmer-chip {
      height: 27px; width: 68px; border-radius: 14px;
      background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
      background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite;
    }
    .shimmer-chip.wide { width: 96px; }
    .shimmer-actions { display: flex; gap: 7px; }
    .shimmer-btn {
      flex: 1; height: 33px; border-radius: 8px;
      background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
      background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; animation-delay: 0.15s;
    }
    .shimmer-btn.wide { flex: 2; }

    /* Tag section */
    .hint { font-size: 10.5px; color: var(--text-sub); margin-bottom: 9px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 11px; }

    .chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: color-mix(in srgb, var(--chip-color, var(--accent)) 10%, white);
      color: color-mix(in srgb, var(--chip-color, var(--accent)) 75%, #111827);
      border: 1px solid color-mix(in srgb, var(--chip-color, var(--accent)) 28%, transparent);
      padding: 4px 12px; border-radius: 14px; font-size: 11.5px; font-weight: 600;
      cursor: pointer; user-select: none; font-family: inherit;
      transition: background 0.12s, border-color 0.12s, transform 0.08s;
      background-color: unset;
    }
    .chip:hover {
      background: color-mix(in srgb, var(--chip-color, var(--accent)) 16%, white);
      border-color: color-mix(in srgb, var(--chip-color, var(--accent)) 45%, transparent);
      transform: translateY(-1px);
    }
    .chip.selected {
      background: color-mix(in srgb, var(--chip-color, var(--accent)) 15%, white);
      color: color-mix(in srgb, var(--chip-color, var(--accent)) 85%, #111827);
      border-color: color-mix(in srgb, var(--chip-color, var(--accent)) 50%, transparent);
    }
    @media (prefers-color-scheme: dark) {
      .chip {
        background: color-mix(in srgb, var(--chip-color, var(--accent)) 14%, #222E42);
        color: color-mix(in srgb, var(--chip-color, var(--accent)) 80%, #E2E8F0);
      }
      .chip:hover {
        background: color-mix(in srgb, var(--chip-color, var(--accent)) 22%, #222E42);
      }
      .chip.selected {
        background: color-mix(in srgb, var(--chip-color, var(--accent)) 22%, #222E42);
        color: var(--chip-color, var(--accent));
        border-color: color-mix(in srgb, var(--chip-color, var(--accent)) 55%, transparent);
      }
      .chip-dot { background: var(--chip-color, var(--accent)); }
    }
    .chip-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: color-mix(in srgb, var(--chip-color, var(--accent)) 85%, #111827);
      flex-shrink: 0;
    }

    /* Multi-tag input */
    .tag-input-wrap {
      display: flex; flex-wrap: wrap; align-items: center; gap: 5px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 6px 9px; min-height: 36px; cursor: text;
      transition: border-color 0.12s, box-shadow 0.12s; margin-bottom: 4px;
    }
    .tag-input-wrap:focus-within {
      border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light);
    }
    .custom-chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: var(--accent-light); color: var(--accent);
      border: 1px solid var(--accent-border); border-radius: 10px;
      padding: 2px 5px 2px 9px; font-size: 11px; font-weight: 600;
      white-space: nowrap; flex-shrink: 0;
    }
    .custom-chip-remove {
      display: flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; border-radius: 50%;
      color: var(--accent); opacity: 0.65; cursor: pointer;
      transition: opacity 0.1s, background 0.1s;
      background: none; border: none; padding: 0; flex-shrink: 0;
    }
    .custom-chip-remove:hover {
      opacity: 1; background: color-mix(in srgb, var(--accent) 15%, transparent);
    }
    .tag-input {
      flex: 1; min-width: 80px; background: transparent; border: none;
      outline: none; color: var(--text); font-size: 11.5px; padding: 1px 0;
      font-family: inherit;
    }
    .tag-input::placeholder { color: var(--text-sub); }
    .tag-hint { font-size: 10px; color: var(--text-sub); margin-bottom: 12px; }

    /* Actions */
    .actions { display: flex; gap: 7px; }
    .btn-skip {
      flex: 1; background: transparent; color: var(--text-muted);
      border: 1px solid var(--border); padding: 8px 10px; border-radius: 8px;
      font-size: 11.5px; font-weight: 500; cursor: pointer; font-family: inherit;
      transition: background 0.12s, color 0.12s;
    }
    .btn-skip:hover { background: var(--surface); color: var(--text); }
    .btn-apply {
      flex: 2; background: var(--accent); color: var(--accent-fg); border: none;
      padding: 8px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: opacity 0.12s;
    }
    .btn-apply:hover:not(:disabled) { opacity: 0.87; }
    .btn-apply:disabled { opacity: 0.35; cursor: not-allowed; }
    .error-msg { font-size: 11.5px; color: var(--text-muted); margin-bottom: 13px; }
  `;

  // ── Mutable state ──
  let suggestions    = [];
  let selected       = new Set();
  let customTags     = [];
  let inputValue     = '';
  let selectedFolder = defaultFolderId ?? (folders?.[0]?.id ?? '1');
  let inputEl        = null;

  function dismount() { host.remove(); }

  function appliedCount() {
    return selected.size + customTags.length + (normalizeTag(inputValue) ? 1 : 0);
  }

  function chipHTML(tag, i) {
    const color = CHIP_COLORS[i % CHIP_COLORS.length];
    const sel   = selected.has(tag);
    return `<button class="chip${sel ? ' selected' : ''}" data-tag="${tag}" style="--chip-color:${color}">${
      sel ? '<span class="chip-dot"></span>' : ''
    }${tag}</button>`;
  }

  function customChipHTML(tag) {
    return `<span class="custom-chip">${tag}<button class="custom-chip-remove" data-remove-tag="${tag}" tabindex="-1"><svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="8" height="8"><path d="M8 2 2 8M2 2l6 6"/></svg></button></span>`;
  }

  function updateApplyBtn() {
    const btn = shadow.querySelector('.btn-apply');
    if (!btn) return;
    const count = appliedCount();
    btn.disabled = count === 0;
    btn.textContent = count > 0
      ? `Save${IS_NEW ? '' : ''} ${count} Tag${count !== 1 ? 's' : ''}`
      : IS_NEW ? 'Save Bookmark' : 'Apply';
  }

  function refreshChips() {
    const el = shadow.querySelector('.chips');
    if (el) el.innerHTML = suggestions.map((t, i) => chipHTML(t, i)).join('');
  }

  function refreshCustomChips() {
    const wrap = shadow.querySelector('.tag-input-wrap');
    if (!wrap) return;
    wrap.querySelectorAll('.custom-chip').forEach(el => el.remove());
    const input = wrap.querySelector('.tag-input');
    customTags.forEach(tag => {
      const tmp = document.createElement('span');
      tmp.innerHTML = customChipHTML(tag);
      wrap.insertBefore(tmp.firstElementChild, input);
    });
    input.placeholder = customTags.length === 0 ? 'Add custom tags…' : '';
    updateApplyBtn();
  }

  function commitInputTag() {
    const tag = normalizeTag(inputValue);
    if (!tag) return false;
    if (!customTags.includes(tag) && !suggestions.includes(tag)) {
      customTags = [...customTags, tag];
    }
    inputValue = '';
    if (inputEl) inputEl.value = '';
    refreshCustomChips();
    return true;
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const added = commitInputTag();
      if (!added && appliedCount() > 0) void handleApply();
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      commitInputTag();
    } else if (e.key === 'Backspace' && !inputValue && customTags.length > 0) {
      customTags = customTags.slice(0, -1);
      refreshCustomChips();
    }
  }

  async function handleApply() {
    const pendingInput = normalizeTag(inputValue);
    const allTags = [...selected, ...customTags, ...(pendingInput ? [pendingInput] : [])];
    const unique  = [...new Set(allTags.filter(Boolean))];

    if (IS_NEW) {
      // Ask the service worker to create the bookmark + save tags
      chrome.runtime.sendMessage({
        type: 'bd_createAndTag',
        url, title, folderId: selectedFolder, tags: unique,
      });
    } else {
      // Write tags directly to storage for existing bookmarks
      const result    = await chrome.storage.local.get(['bd_bookmarkTags', 'bd_tagColors']);
      const tagMap    = result.bd_bookmarkTags ?? {};
      const tagColors = result.bd_tagColors ?? {};
      const existing  = tagMap[bookmarkId] ?? [];
      tagMap[bookmarkId] = [...new Set([...existing, ...unique])];
      for (const tag of unique) {
        if (!tagColors[tag]) tagColors[tag] = assignTagColor(tagColors);
      }
      await chrome.storage.local.set({ bd_bookmarkTags: tagMap, bd_tagColors: tagColors });
    }
    dismount();
  }

  // ── Folder picker HTML (only for new bookmarks) ──
  function folderPickerHTML() {
    if (!IS_NEW || !folders?.length) return '';
    const options = folders.map(f =>
      `<option value="${f.id}"${f.id === selectedFolder ? ' selected' : ''}>${' '.repeat(f.indent * 2)}${f.title}</option>`
    ).join('');
    return `
      <div class="folder-section">
        <label class="folder-label">Save to folder</label>
        <div class="folder-select-wrap">
          <span class="folder-icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.586a1 1 0 0 1 .707.293L7.5 4h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V3.5z"/>
            </svg>
          </span>
          <select class="folder-select">${options}</select>
          <span class="folder-chevron">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </span>
        </div>
      </div>
      <div class="divider"></div>`;
  }

  function renderReady() {
    const body = shadow.querySelector('.body');
    const count = appliedCount();
    body.innerHTML = `
      ${folderPickerHTML()}
      <p class="hint">✨ AI suggested — tap to toggle</p>
      <div class="chips">${suggestions.map((t, i) => chipHTML(t, i)).join('')}</div>
      <div class="tag-input-wrap">
        <input class="tag-input" placeholder="Add custom tags…" />
      </div>
      <p class="tag-hint">Enter or comma to add · Backspace to remove</p>
      <div class="actions">
        <button class="btn-skip">Skip</button>
        <button class="btn-apply" ${count === 0 ? 'disabled' : ''}>
          ${count > 0 ? `${IS_NEW ? 'Save' : 'Apply'} ${count} Tag${count !== 1 ? 's' : ''}` : IS_NEW ? 'Save Bookmark' : 'Apply'}
        </button>
      </div>`;

    // Folder change listener
    const folderSelect = body.querySelector('.folder-select');
    if (folderSelect) {
      folderSelect.addEventListener('change', e => { selectedFolder = e.target.value; });
    }

    inputEl = body.querySelector('.tag-input');
    body.querySelector('.tag-input-wrap').addEventListener('click', () => inputEl?.focus());
    inputEl.addEventListener('input', e => { inputValue = e.target.value; updateApplyBtn(); });
    inputEl.addEventListener('keydown', handleInputKeyDown);
    inputEl.addEventListener('blur', () => commitInputTag());

    body.querySelector('.chips').addEventListener('click', e => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      const tag = btn.dataset.tag;
      selected.has(tag) ? selected.delete(tag) : selected.add(tag);
      refreshChips();
      updateApplyBtn();
    });

    body.addEventListener('click', e => {
      const removeBtn = e.target.closest('.custom-chip-remove');
      if (!removeBtn) return;
      customTags = customTags.filter(t => t !== removeBtn.dataset.removeTag);
      refreshCustomChips();
    });

    body.querySelector('.btn-skip').addEventListener('click', dismount);
    body.querySelector('.btn-apply').addEventListener('click', () => void handleApply());
  }

  function renderError(onRetry) {
    const body = shadow.querySelector('.body');
    body.innerHTML = `
      ${folderPickerHTML()}
      <p class="error-msg">Couldn't fetch tag suggestions.</p>
      <div class="actions">
        <button class="btn-skip">Skip</button>
        <button class="btn-apply">Retry</button>
      </div>`;
    const folderSelect = body.querySelector('.folder-select');
    if (folderSelect) {
      folderSelect.addEventListener('change', e => { selectedFolder = e.target.value; });
    }
    body.querySelector('.btn-skip').addEventListener('click', dismount);
    body.querySelector('.btn-apply').addEventListener('click', onRetry);
  }

  // ── Build skeleton ──
  const hostname = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
  const dialog   = document.createElement('div');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="header">
      <div class="header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="title-wrap">
        <div class="bm-title">${title || 'Untitled'}</div>
        <div class="bm-domain">${hostname}</div>
      </div>
      <div class="saved-badge">${IS_NEW ? '+ New' : '✓ Saved'}</div>
    </div>
    <div class="body">
      ${folderPickerHTML()}
      <div class="loading-text"><span class="spinner"></span>Suggesting tags…</div>
      <div class="shimmer-row">
        <div class="shimmer-chip"></div>
        <div class="shimmer-chip wide"></div>
        <div class="shimmer-chip"></div>
      </div>
      <div class="shimmer-actions">
        <div class="shimmer-btn"></div>
        <div class="shimmer-btn wide"></div>
      </div>
    </div>`;

  shadow.appendChild(style);
  shadow.appendChild(dialog);

  // Wire folder select in skeleton too (user may change folder while tags load)
  const skeletonFolderSelect = shadow.querySelector('.folder-select');
  if (skeletonFolderSelect) {
    skeletonFolderSelect.addEventListener('change', e => { selectedFolder = e.target.value; });
  }

  // Backdrop click (composedPath to bypass shadow DOM retargeting)
  host.addEventListener('click', e => { if (e.composedPath()[0] === host) dismount(); });
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { dismount(); document.removeEventListener('keydown', onEsc); }
  });

  // ── Inline AI calls ──
  async function fetchSuggestions(apiKey, provider, model) {
    const prompt = `You are a bookmark tagging assistant.\nGiven a page title and URL, suggest 1 to 3 short, lowercase tags.\nTags should be concise (1-2 words), specific, and reusable.\n\nTitle: ${title}\nURL: ${url}\n\nRespond with ONLY a JSON array of strings, no explanation:\n["example", "tag", "here"]`;
    let raw = '';
    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 60 } }),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      raw = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } else if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'x-api-key': apiKey,
          'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model, max_tokens: 60, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) throw new Error(`Claude ${res.status}`);
      raw = (await res.json()).content?.[0]?.text ?? '';
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 60 }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      raw = (await res.json()).choices?.[0]?.message?.content ?? '';
    }
    const arr = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    if (!Array.isArray(arr)) return [];
    return arr.filter(t => typeof t === 'string').slice(0, 3);
  }

  async function loadAndRender() {
    const result  = await chrome.storage.local.get(['bd_aiApiKey', 'bd_aiProvider', 'bd_aiModel']);
    const apiKey  = result.bd_aiApiKey;
    if (!apiKey) { dismount(); return; }
    const provider = result.bd_aiProvider ?? 'openai';
    const model    = result.bd_aiModel    ?? 'gpt-4o-mini';
    try {
      const tags = await fetchSuggestions(apiKey, provider, model);
      suggestions = tags;
      selected    = new Set(tags);
      renderReady();
    } catch {
      renderError(() => void loadAndRender());
    }
  }

  void loadAndRender();
}

/* ─── Helper: inject dialog into the active tab ─── */

async function openTagDialog({ tabId, bookmarkId, title, url, isNew }) {
  let folders = null;
  let defaultFolderId = null;

  if (isNew) {
    folders         = await getBookmarkFolders();
    defaultFolderId = folders[0]?.id ?? '1';
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: mountTagDialog,
      args: [{ bookmarkId: bookmarkId ?? null, title, url, folders, defaultFolderId }],
    });
  } catch (err) {
    console.warn('[TagDialog] executeScript failed, falling back to popup window:', err);
    // Fallback for chrome:// or other restricted pages
    if (!isNew) {
      await chrome.storage.local.set({
        bd_pendingAutoTag: { bookmarkId, title: title ?? '', url },
      });
    }
    const popupWidth = 460, popupHeight = isNew ? 420 : 360;
    const win  = await chrome.windows.getLastFocused({ populate: false });
    const left = Math.round(win.left + (win.width  - popupWidth)  / 2);
    const top  = Math.round(win.top  + (win.height - popupHeight) / 2);
    await chrome.windows.create({
      url: chrome.runtime.getURL('popup/save-popup.html'),
      type: 'popup', width: popupWidth, height: popupHeight, left, top, focused: true,
    });
  }
}

/* ─── Extension lifecycle ─── */

chrome.runtime.onInstalled.addListener(() => {
  batchFetchAllBookmarks().catch(err => console.error('[OG] batch fetch failed:', err));
  registerContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  batchFetchAllBookmarks().catch(err => console.error('[OG] batch fetch failed:', err));
});

chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  if (!bookmark.url) return;

  // OG image fetch
  (async () => {
    const ogUrl = await fetchOGImage(bookmark.url);
    const data  = await chrome.storage.local.get(OG_CACHE_KEY);
    const cache = data[OG_CACHE_KEY] || {};
    if (id in cache) return;
    cache[id] = ogUrl;
    await chrome.storage.local.set({ [OG_CACHE_KEY]: cache });
  })().catch(err => console.error('[OG] onCreated cache failed:', err));

  // Auto-tag dialog (skip if bookmark was created programmatically by our dialog)
  (async () => {
    const suppress = await chrome.storage.local.get('bd_suppressAutoTag');
    if (suppress.bd_suppressAutoTag) {
      await chrome.storage.local.remove('bd_suppressAutoTag');
      return;
    }
    const result = await chrome.storage.local.get(['bd_aiAutoTagEnabled', 'bd_aiApiKey']);
    if (result.bd_aiAutoTagEnabled === false) return;
    if (!result.bd_aiApiKey) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await openTagDialog({ tabId: tab.id, bookmarkId: id, title: bookmark.title ?? '', url: bookmark.url, isNew: false });
  })().catch(err => console.error('[AutoTag] onCreated failed:', err));
});

// Context menu: bookmark page or link
chrome.contextMenus.onClicked.addListener((info, tab) => {
  (async () => {
    let url = '';
    let title = '';

    if (info.menuItemId === 'bd-add-page') {
      url   = tab?.url   || '';
      title = tab?.title || '';
    } else if (info.menuItemId === 'bd-add-link') {
      url   = info.linkUrl       || '';
      title = info.selectionText || '';
    }

    if (!url || !url.startsWith('http')) return;

    const existing = await chrome.bookmarks.search({ url });
    const tabId    = tab?.id;
    if (!tabId) return;

    const aiSettings = await chrome.storage.local.get(['bd_aiAutoTagEnabled', 'bd_aiApiKey']);
    const aiEnabled  = aiSettings.bd_aiAutoTagEnabled !== false && !!aiSettings.bd_aiApiKey;

    if (existing.length > 0) {
      // Already saved — open tag dialog to review/add tags
      if (aiEnabled) {
        const bm = existing[0];
        await openTagDialog({ tabId, bookmarkId: bm.id, title: bm.title || title || url, url, isNew: false });
      }
      return;
    }

    // New bookmark — show dialog with folder picker BEFORE creating it
    if (aiEnabled) {
      await openTagDialog({ tabId, bookmarkId: null, title, url, isNew: true });
    } else {
      // No AI configured — just save directly
      await chrome.bookmarks.create({ url, title: title || url });
    }
  })().catch(err => console.error('[ContextMenu] bookmark failed:', err));
});

// Keyboard command: open AI tag dialog for the currently active bookmarked page
chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-ai-tag') return;
  (async () => {
    const result = await chrome.storage.local.get(['bd_aiAutoTagEnabled', 'bd_aiApiKey']);
    if (result.bd_aiAutoTagEnabled === false) return;
    if (!result.bd_aiApiKey) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !tab.url.startsWith('http')) return;
    const bookmarks = await chrome.bookmarks.search({ url: tab.url });
    if (!bookmarks.length) return;
    const bm = bookmarks[0];
    await openTagDialog({ tabId: tab.id, bookmarkId: bm.id, title: bm.title || tab.title || '', url: tab.url, isNew: false });
  })().catch(err => console.error('[AutoTag] command failed:', err));
});
