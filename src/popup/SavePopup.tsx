import { useState, useEffect, useCallback, useRef } from 'react';
import { suggestTags } from '@/utils/ai';
import { normalizeTag, assignTagColor } from '@/utils/tags';
import type { AIProvider, TagMap, TagColorMap } from '@/types';

const CHIP_COLORS = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#A855F7', // purple
  '#F97316', // orange
  '#EC4899', // pink
  '#14B8A6', // teal
  '#EF4444', // red
  '#EAB308', // yellow
  '#6366F1', // indigo
  '#06B6D4', // cyan
];

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
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [popupState, setPopupState] = useState<PopupState>('loading');

  const genRef = useRef(0);
  const applyingRef = useRef(false);
  const cleanedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadAndSuggest = useCallback(async () => {
    const gen = ++genRef.current;
    setPopupState('loading');
    setCustomTags([]);
    setInputValue('');
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
      if (gen !== genRef.current) return;
      setSuggestions(tags);
      setSelected(new Set(tags));
      setPopupState('ready');
    } catch {
      if (gen !== genRef.current) return;
      setPopupState('error');
    }
  }, []);

  useEffect(() => { void loadAndSuggest(); }, [loadAndSuggest]);

  useEffect(() => {
    const onUnload = () => {
      if (!cleanedRef.current) chrome.storage.local.remove('bd_pendingAutoTag');
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

  function commitInputTag() {
    const tag = normalizeTag(inputValue);
    if (!tag) return false;
    if (!customTags.includes(tag) && !suggestions.includes(tag)) {
      setCustomTags(prev => [...prev, tag]);
    }
    setInputValue('');
    return true;
  }

  function removeCustomTag(tag: string) {
    setCustomTags(prev => prev.filter(t => t !== tag));
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const added = commitInputTag();
      // Empty input + Enter → apply if anything is selected
      if (!added && appliedCount > 0) void handleApply();
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      commitInputTag();
    } else if (e.key === 'Backspace' && !inputValue && customTags.length > 0) {
      setCustomTags(prev => prev.slice(0, -1));
    }
  }

  async function handleApply() {
    if (!pending || applyingRef.current) return;
    applyingRef.current = true;

    // Commit any text still in the input
    const pending_input = normalizeTag(inputValue);
    const allTags = [
      ...selected,
      ...customTags,
      ...(pending_input ? [pending_input] : []),
    ];
    const unique = [...new Set(allTags.filter(Boolean))];

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
    cleanedRef.current = true;
    await chrome.storage.local.remove('bd_pendingAutoTag');
    window.close();
  }

  async function handleSkip() {
    cleanedRef.current = true;
    await chrome.storage.local.remove('bd_pendingAutoTag');
    window.close();
  }

  async function handleOpenSettings() {
    await chrome.storage.local.set({ bd_pendingSettingsTab: 'ai-apps' });
    await chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    window.close();
  }

  const hostname = (() => {
    try { return pending?.url ? new URL(pending.url).hostname : ''; } catch { return ''; }
  })();

  const pendingInput = normalizeTag(inputValue) ? 1 : 0;
  const appliedCount = selected.size + customTags.length + pendingInput;

  return (
    <div className="sp-popup">
      <div className="sp-popup-header">
        <div className="sp-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div className="sp-popup-title-wrap">
          <div className="sp-popup-title">{pending?.title || 'Untitled'}</div>
          <div className="sp-popup-domain">{hostname}</div>
        </div>
        <div className="sp-saved-badge">✓ Saved</div>
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
              {suggestions.map((tag, i) => (
                <button
                  key={tag}
                  type="button"
                  className={`sp-chip${selected.has(tag) ? ' is-selected' : ''}`}
                  style={{ '--chip-color': CHIP_COLORS[i % CHIP_COLORS.length] } as React.CSSProperties}
                  onClick={() => toggleChip(tag)}
                >
                  {selected.has(tag) && <span className="sp-chip-dot" />}
                  {tag}
                </button>
              ))}
            </div>

            {/* Multi-tag input */}
            <div
              className="sp-tag-input-wrap"
              onClick={() => inputRef.current?.focus()}
            >
              {customTags.map(tag => (
                <span key={tag} className="sp-custom-chip">
                  {tag}
                  <button
                    type="button"
                    className="sp-custom-chip-remove"
                    onMouseDown={e => { e.preventDefault(); removeCustomTag(tag); }}
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
                ref={inputRef}
                className="sp-tag-input"
                placeholder={customTags.length === 0 ? 'Add custom tags…' : ''}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={() => commitInputTag()}
              />
            </div>
            <p className="sp-tag-hint">Enter or comma to add · Backspace to remove</p>

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
