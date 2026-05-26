import { useState, useEffect, useRef, useCallback } from 'react';
import { useUI } from '@/context/UIContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useSettings } from '@/context/SettingsContext';
import { suggestTags } from '@/utils/ai';
import { normalizeTag, assignTagColor } from '@/utils/tags';
import type { TagMap, TagColorMap } from '@/types';

const CHIP_COLORS = [
  '#3B82F6', '#22C55E', '#A855F7', '#F97316', '#EC4899',
  '#14B8A6', '#EF4444', '#EAB308', '#6366F1', '#06B6D4',
];

interface FolderItem { id: string; title: string; indent: number; }
type DialogStep = 'form' | 'tags';

function AddBookmarkDialog() {
  const { addBookmarkOpen, closeAddBookmark, showToast } = useUI();
  const { loadBookmarks } = useBookmarks();
  const { settings } = useSettings();

  // Step 1
  const [url, setUrl]               = useState('');
  const [title, setTitle]           = useState('');
  const [error, setError]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [titleFetching, setTitleFetching] = useState(false);
  const [folders, setFolders]       = useState<FolderItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('');

  // Step 2
  const [step, setStep]               = useState<DialogStep>('form');
  const [savedBmId, setSavedBmId]     = useState<string | null>(null);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [customTags, setCustomTags]   = useState<string[]>([]);
  const [tagInput, setTagInput]       = useState('');

  const urlRef      = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const prefillUrl  = useRef(''); // URL pre-filled from the active tab

  const loadFolders = useCallback(async () => {
    const tree = await chrome.bookmarks.getTree();
    const items: FolderItem[] = [];
    function collect(nodes: chrome.bookmarks.BookmarkTreeNode[], indent: number) {
      for (const node of nodes) {
        if (!node.url) {
          if (node.title) items.push({ id: node.id, title: node.title, indent });
          if (node.children) collect(node.children, node.title ? indent + 1 : indent);
        }
      }
    }
    collect(tree[0]?.children ?? [], 0);
    setFolders(items);
    setSelectedFolder(prev => prev || items[0]?.id || '');
  }, []);

  // Reset + pre-fill on open
  useEffect(() => {
    if (!addBookmarkOpen) return;
    setStep('form');
    setUrl(''); setTitle(''); setError('');
    setSaving(false); setTitleFetching(false);
    setSavedBmId(null); setSuggestions([]);
    setSelected(new Set()); setCustomTags([]); setTagInput('');
    setPrefilling(true);
    prefillUrl.current = '';

    loadFolders();
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (tab?.url?.startsWith('http')) {
        setUrl(tab.url);
        setTitle(tab.title ?? '');
        prefillUrl.current = tab.url;
      }
      setPrefilling(false);
      setTimeout(() => urlRef.current?.focus(), 60);
    });
  }, [addBookmarkOpen, loadFolders]);

  useEffect(() => {
    if (!addBookmarkOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAddBookmark(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [addBookmarkOpen, closeAddBookmark]);

  // Auto-fetch page title when a new URL is entered
  async function handleUrlBlur() {
    const trimmed = url.trim();
    if (!trimmed || title || titleFetching) return;
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    try { new URL(normalized); } catch { return; }
    if (normalized === prefillUrl.current) return;

    setTitleFetching(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(normalized, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fetched = doc.querySelector('title')?.textContent?.trim();
      if (fetched) setTitle(fetched.slice(0, 200));
    } catch { /* silent — user can type title manually */ }
    finally { setTitleFetching(false); }
  }

  // Step 1 → create bookmark → Step 2
  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) { setError('URL is required.'); return; }
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    try { new URL(normalized); } catch { setError('Enter a valid URL.'); return; }

    setSaving(true);
    setError('');
    try {
      // Suppress onCreated auto-tag — we handle it here
      await chrome.storage.local.set({ bd_suppressAutoTag: true });

      const bm = await chrome.bookmarks.create({
        url: normalized,
        title: title.trim() || normalized,
        parentId: selectedFolder || undefined,
      });
      setSavedBmId(bm.id);
      await loadBookmarks();

      if (settings.aiApiKey) {
        setStep('tags');
        setTagsLoading(true);
        try {
          const tags = await suggestTags(
            settings.aiProvider, settings.aiApiKey, settings.aiModel,
            title.trim() || normalized, normalized,
          );
          setSuggestions(tags);
          setSelected(new Set(tags));
        } catch { /* show empty state */ }
        finally {
          setTagsLoading(false);
          setTimeout(() => tagInputRef.current?.focus(), 60);
        }
      } else {
        showToast('Bookmark saved');
        closeAddBookmark();
      }
    } catch {
      setError('Failed to save bookmark.');
      setSaving(false);
      await chrome.storage.local.remove('bd_suppressAutoTag');
    }
  }

  // Tag step helpers
  function appliedCount() {
    return selected.size + customTags.length + (normalizeTag(tagInput) ? 1 : 0);
  }

  function commitTagInput(): boolean {
    const tag = normalizeTag(tagInput);
    if (!tag) return false;
    if (!customTags.includes(tag) && !suggestions.includes(tag))
      setCustomTags(prev => [...prev, tag]);
    setTagInput('');
    return true;
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const added = commitTagInput();
      if (!added && appliedCount() > 0) void handleApplyTags();
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      commitTagInput();
    } else if (e.key === 'Backspace' && !tagInput && customTags.length > 0) {
      setCustomTags(prev => prev.slice(0, -1));
    }
  }

  async function handleApplyTags() {
    if (!savedBmId) return;
    const pendingInput = normalizeTag(tagInput);
    const allTags = [...selected, ...customTags, ...(pendingInput ? [pendingInput] : [])];
    const unique  = [...new Set(allTags.filter(Boolean))];

    if (unique.length) {
      const result    = await chrome.storage.local.get(['bd_bookmarkTags', 'bd_tagColors']);
      const tagMap    = (result.bd_bookmarkTags ?? {}) as TagMap;
      const tagColors = (result.bd_tagColors ?? {}) as TagColorMap;
      const existing  = tagMap[savedBmId] ?? [];
      tagMap[savedBmId] = [...new Set([...existing, ...unique])];
      const colors = { ...tagColors };
      for (const tag of unique) {
        if (!colors[tag]) colors[tag] = assignTagColor(colors);
      }
      await chrome.storage.local.set({ bd_bookmarkTags: tagMap, bd_tagColors: colors });
      await loadBookmarks();
      showToast(`Tags added: ${unique.join(', ')}`);
    } else {
      showToast('Bookmark saved');
    }
    closeAddBookmark();
  }

  async function handleSkipTags() {
    showToast('Bookmark saved');
    closeAddBookmark();
  }

  if (!addBookmarkOpen) return null;

  return (
    <>
      <div className="add-bm-overlay open" onClick={closeAddBookmark} />
      <div className="add-bm-dialog open" role="dialog" aria-modal="true" aria-label="Add bookmark">

        {/* ── Header ── */}
        <div className="add-bm-header">
          <div className="add-bm-header-icon">
            {step === 'form' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                <line x1="12" y1="8" x2="12" y2="14"/>
                <line x1="9" y1="11" x2="15" y2="11"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
              </svg>
            )}
          </div>
          <h3 className="add-bm-title">
            {step === 'form' ? 'Add Bookmark' : 'Tag Bookmark'}
          </h3>
          {step === 'form' && settings.aiApiKey && (
            <span className="add-bm-ai-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
              </svg>
              Auto-tag
            </span>
          )}
          {step === 'tags' && <span className="add-bm-saved-badge">✓ Saved</span>}
          <button className="add-bm-close" onClick={closeAddBookmark} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Step 1: URL + Title + Folder ── */}
        {step === 'form' && (
          <>
            <div className="add-bm-body">
              <label className="add-bm-label">URL</label>
              <input
                ref={urlRef}
                className={`add-bm-input${error ? ' has-error' : ''}`}
                type="url"
                placeholder={prefilling ? 'Fetching current page…' : 'https://example.com'}
                value={url}
                onChange={e => {
                  const v = e.target.value;
                  setUrl(v);
                  setError('');
                  if (v !== prefillUrl.current) setTitle('');
                }}
                onBlur={handleUrlBlur}
                onKeyDown={e => { if (e.key === 'Enter') void handleSave(); }}
                autoComplete="off"
                spellCheck={false}
                disabled={prefilling}
              />

              <label className="add-bm-label">
                Title
                {titleFetching && <span className="add-bm-fetching">fetching…</span>}
              </label>
              <input
                className="add-bm-input"
                type="text"
                placeholder={titleFetching ? 'Loading title…' : 'Page title (optional)'}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleSave(); }}
                autoComplete="off"
                disabled={prefilling || titleFetching}
              />

              {folders.length > 0 && (
                <>
                  <label className="add-bm-label">Folder</label>
                  <div className="add-bm-select-wrap">
                    <span className="add-bm-select-icon">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                           strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                        <path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.586a1 1 0 0 1 .707.293L7.5 4h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V3.5z"/>
                      </svg>
                    </span>
                    <select
                      className="add-bm-select"
                      value={selectedFolder}
                      onChange={e => setSelectedFolder(e.target.value)}
                    >
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>
                          {' '.repeat(f.indent * 3)}{f.title}
                        </option>
                      ))}
                    </select>
                    <span className="add-bm-select-chevron">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                           strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                        <path d="M4 6l4 4 4-4"/>
                      </svg>
                    </span>
                  </div>
                </>
              )}

              {error && <p className="add-bm-error">{error}</p>}
            </div>

            <div className="add-bm-actions">
              <button className="add-bm-btn-cancel" onClick={closeAddBookmark}>Cancel</button>
              <button className="add-bm-btn-save" onClick={handleSave} disabled={saving || prefilling}>
                {saving ? 'Saving…' : settings.aiApiKey ? 'Save & Tag →' : 'Save Bookmark'}
              </button>
            </div>

            <div className="add-bm-tip">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                   strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <circle cx="8" cy="8" r="6.5"/>
                <path d="M8 7v4M8 5.5v.5"/>
              </svg>
              <p className="add-bm-tip-text">
                <strong>Tip:</strong> Right-click any page → <strong>"Add to Bookmark"</strong> to skip Chrome's native popup.
              </p>
            </div>
          </>
        )}

        {/* ── Step 2: AI Tag picker ── */}
        {step === 'tags' && (
          <div className="add-bm-body add-bm-tags-body">
            {tagsLoading ? (
              <>
                <div className="add-bm-loading-row">
                  <span className="add-bm-spinner" />
                  <span className="add-bm-loading-label">Suggesting tags…</span>
                </div>
                <div className="add-bm-shimmer-row">
                  <div className="add-bm-shimmer-chip" />
                  <div className="add-bm-shimmer-chip wide" />
                  <div className="add-bm-shimmer-chip" />
                </div>
                <div className="add-bm-shimmer-actions">
                  <div className="add-bm-shimmer-btn" />
                  <div className="add-bm-shimmer-btn wide" />
                </div>
              </>
            ) : (
              <>
                <p className="add-bm-step-hint">✨ AI suggested — tap to toggle</p>

                <div className="add-bm-chips">
                  {suggestions.map((tag, i) => (
                    <button
                      key={tag}
                      type="button"
                      className={`add-bm-chip${selected.has(tag) ? ' selected' : ''}`}
                      style={{ '--chip-color': CHIP_COLORS[i % CHIP_COLORS.length] } as React.CSSProperties}
                      onClick={() => {
                        setSelected(prev => {
                          const next = new Set(prev);
                          next.has(tag) ? next.delete(tag) : next.add(tag);
                          return next;
                        });
                      }}
                    >
                      {selected.has(tag) && <span className="add-bm-chip-dot" />}
                      {tag}
                    </button>
                  ))}
                </div>

                <div
                  className="add-bm-tag-input-wrap"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {customTags.map(tag => (
                    <span key={tag} className="add-bm-custom-chip">
                      {tag}
                      <button
                        type="button"
                        className="add-bm-custom-chip-remove"
                        onMouseDown={e => { e.preventDefault(); setCustomTags(prev => prev.filter(t => t !== tag)); }}
                        tabIndex={-1}
                      >
                        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" width="8" height="8">
                          <path d="M8 2 2 8M2 2l6 6"/>
                        </svg>
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    className="add-bm-tag-input"
                    placeholder={customTags.length === 0 ? 'Add custom tags…' : ''}
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => commitTagInput()}
                  />
                </div>
                <p className="add-bm-tag-hint">Enter or comma to add · Backspace to remove</p>

                <div className="add-bm-tag-actions">
                  <button className="add-bm-btn-cancel" onClick={handleSkipTags}>Skip</button>
                  <button
                    className="add-bm-btn-save"
                    onClick={handleApplyTags}
                    disabled={appliedCount() === 0}
                  >
                    {appliedCount() > 0
                      ? `Apply ${appliedCount()} Tag${appliedCount() !== 1 ? 's' : ''}`
                      : 'Apply Tags'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </>
  );
}

export default AddBookmarkDialog;
