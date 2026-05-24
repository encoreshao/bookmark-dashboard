import { useState, useEffect, useCallback, useRef } from 'react';
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

  const genRef = useRef(0);
  const applyingRef = useRef(false);
  const cleanedRef = useRef(false);

  const loadAndSuggest = useCallback(async () => {
    const gen = ++genRef.current;
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

  // Clear storage key when popup closes without Apply/Skip
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

  async function handleApply() {
    if (!pending || applyingRef.current) return;
    applyingRef.current = true;
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
    window.open(chrome.runtime.getURL('index.html'), '_blank');
    window.close();
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
