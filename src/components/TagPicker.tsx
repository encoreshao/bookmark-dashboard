import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTags } from '@/context/TagContext';
import { normalizeTag } from '@/utils/tags';

interface Props {
  bookmarkId: string;
  bookmarkTitle: string;
  anchorEl: HTMLElement;
  onClose: () => void;
}

function TagPicker({ bookmarkId, bookmarkTitle, anchorEl, onClose }: Props) {
  const { allTags, tagColors, getTagsForBookmark, setTagsForBookmark } = useTags();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const applied = getTagsForBookmark(bookmarkId);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorEl, onClose]);

  // Position the picker to the right of the anchor element
  const rect = anchorEl.getBoundingClientRect();
  const pickerWidth = 220;
  const gap = 6;
  let top = rect.top;
  let left = rect.right + gap;

  // If it would overflow right, flip left
  if (left + pickerWidth > window.innerWidth - 8) {
    left = rect.left - pickerWidth - gap;
  }
  // If it would overflow bottom, shift up
  const estimatedHeight = 320;
  if (top + estimatedHeight > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - estimatedHeight - 8);
  }

  const normalizedQuery = normalizeTag(query);
  const filtered = allTags.filter(t =>
    t.includes(normalizedQuery)
  );
  const canCreate =
    normalizedQuery.length > 0 &&
    !allTags.includes(normalizedQuery);

  const toggleTag = useCallback((tag: string) => {
    const next = applied.includes(tag)
      ? applied.filter(t => t !== tag)
      : [...applied, tag];
    setTagsForBookmark(bookmarkId, next);
  }, [applied, bookmarkId, setTagsForBookmark]);

  const createAndApply = useCallback(() => {
    if (!normalizedQuery) return;
    setTagsForBookmark(bookmarkId, [...applied, normalizedQuery]);
    setQuery('');
    inputRef.current?.focus();
  }, [normalizedQuery, applied, bookmarkId, setTagsForBookmark]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filtered.length > 0) {
        toggleTag(filtered[0]);
        setQuery('');
      } else if (canCreate) {
        createAndApply();
      }
    } else if (e.key === 'Backspace' && query === '' && applied.length > 0) {
      setTagsForBookmark(bookmarkId, applied.slice(0, -1));
    }
  };

  return createPortal(
    <div
      ref={pickerRef}
      className="tag-picker"
      style={{ top, left }}
    >
      <div className="tag-picker-header">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2z"/>
          <circle cx="7" cy="7" r="1" fill="currentColor"/>
        </svg>
        Tags · <strong>{bookmarkTitle}</strong>
      </div>
      <div className="tag-picker-input-wrap">
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
        {filtered.map(tag => (
          <div
            key={tag}
            className={`tag-picker-item${applied.includes(tag) ? ' is-checked' : ''}`}
            onClick={() => { toggleTag(tag); setQuery(''); }}
          >
            <div className="tag-picker-check">
              {applied.includes(tag) && '✓'}
            </div>
            <div className="tag-picker-dot" style={{ background: tagColors[tag] ?? '#89b4fa' }} />
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
}

export default TagPicker;
