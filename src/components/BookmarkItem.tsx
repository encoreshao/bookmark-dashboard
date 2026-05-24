import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useUI } from '@/context/UIContext';
import { useTags } from '@/context/TagContext';
import { useReadingList } from '@/context/ReadingListContext';
import { createTranslator } from '@/utils/i18n';
import { getFaviconUrl, getHostname, getDomainColor } from '@/utils/bookmarks';
import TagPicker from '@/components/TagPicker';
import type { BookmarkNode } from '@/types';

interface Props {
  bookmark: BookmarkNode;
  isPinned?: boolean;
  showPin?: boolean;
  ogImageUrl?: string | null;
}

function BookmarkItem({ bookmark, isPinned = false, showPin = true, ogImageUrl }: Props) {
  const { settings, saveSetting } = useSettings();
  const { removeBookmark } = useBookmarks();
  const { confirm, showToast } = useUI();
  const { tagColors, getTagsForBookmark } = useTags();
  const { addItem, isInReadingList } = useReadingList();
  const t = createTranslator(settings.language);
  const [dragging, setDragging] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const tagBtnRef = useRef<HTMLButtonElement>(null);
  const displayMode = settings.displayMode;
  const hostname = getHostname(bookmark.url ?? '');
  const initials = hostname.replace(/^www\./, '').slice(0, 2).toUpperCase() || '??';
  const domainColor = getDomainColor(hostname);
  const [ogImgError, setOgImgError] = useState(false);
  useEffect(() => { setOgImgError(false); }, [ogImageUrl]);
  const pinned = settings.pinnedIds.includes(bookmark.id);
  const tags = getTagsForBookmark(bookmark.id);

  const togglePin = () => {
    const wasPinned = pinned;
    const next = wasPinned
      ? settings.pinnedIds.filter(id => id !== bookmark.id)
      : [...settings.pinnedIds, bookmark.id];
    saveSetting('pinnedIds', next);
    showToast(wasPinned ? t('unpinned') : t('pinned'));
  };

  const handleDelete = async () => {
    const ok = await confirm(t('remove-bookmark'), bookmark.title);
    if (!ok) return;
    removeBookmark(bookmark.id);
    showToast(t('removed'));
  };

  const handleAddToReadingList = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInReadingList(bookmark.url ?? '')) {
      showToast('Already in reading list');
      return;
    }
    await addItem(bookmark.url ?? '', bookmark.title, bookmark.id);
    showToast('Added to reading list');
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', bookmark.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDragging(true), 0);
  };
  const handleDragEnd = () => setDragging(false);

  const favicon = getFaviconUrl(bookmark.url ?? '');

  const tagChips = (
    <div className="bm-tag-row">
      {tags.map(tag => (
        <span
          key={tag}
          className="bm-tag"
          style={{ color: tagColors[tag] ?? 'inherit' }}
        >
          {tag}
        </span>
      ))}
      <button
          type="button"
          className="bm-tag-add"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerOpen(true); }}
        >
          + tag
        </button>
    </div>
  );

  return (
    <div
      className={`bookmark-item-wrapper${isPinned ? ' is-pinned' : ''}${dragging ? ' bm-dragging' : ''}`}
      style={{ '--domain-color': domainColor } as React.CSSProperties}
      draggable
      data-bookmark-id={bookmark.id}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <a
        className="bookmark-item"
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        title={bookmark.title}
      >
        {displayMode === 'grid' && (
          <>
            {ogImageUrl === undefined && (
              <div className="bookmark-og-shimmer" />
            )}
            {ogImageUrl !== undefined && ogImageUrl !== null && ogImageUrl !== '' && !ogImgError && (
              <img
                className="bookmark-og-image"
                src={ogImageUrl}
                alt=""
                loading="lazy"
                onError={() => setOgImgError(true)}
              />
            )}
            {ogImageUrl !== undefined && (!ogImageUrl || ogImgError) && (
              <div className="bookmark-og-initials" style={{ background: domainColor }}>
                {initials}
              </div>
            )}
            <div className="bookmark-og-footer">
              <div className="bookmark-og-domain-row">
                <img className="bookmark-favicon" src={favicon} alt="" loading="lazy"
                     onError={e => (e.currentTarget.style.display = 'none')} />
                <span className="bookmark-og-domain">{hostname}</span>
              </div>
              <span className="bookmark-title">{bookmark.title}</span>
              {tagChips}
            </div>
          </>
        )}
        {displayMode === 'list' && (
          <>
            <img className="bookmark-favicon" src={favicon} alt="" loading="lazy"
                 onError={e => (e.currentTarget.style.display = 'none')} />
            <div className="bookmark-list-content">
              <span className="bookmark-title">{bookmark.title}</span>
              <span className="bookmark-url">{hostname}</span>
              {tagChips}
            </div>
          </>
        )}
        {displayMode === 'compact' && (
          <>
            <span className="bookmark-domain-dot" />
            <span className="bookmark-title">{bookmark.title}</span>
            {tags.length > 0 && (
              <div className="bm-tag-row" style={{ marginLeft: 'auto', marginTop: 0, flexWrap: 'nowrap' }}>
                {tags.slice(0, 2).map(tag => (
                  <span key={tag} className="bm-tag" style={{ color: tagColors[tag] ?? 'inherit' }}>
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="bm-tag" style={{ color: 'var(--text-muted)' }}>+{tags.length - 2}</span>
                )}
              </div>
            )}
          </>
        )}
      </a>

      {/* Reading list button */}
      <button
        type="button"
        className={`bookmark-readlist${isInReadingList(bookmark.url ?? '') ? ' is-saved' : ''}`}
        title="Add to reading list"
        onClick={handleAddToReadingList}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          <line x1="12" y1="8" x2="12" y2="14"/>
          <line x1="9" y1="11" x2="15" y2="11"/>
        </svg>
      </button>

      {/* Tag button */}
      <button
        ref={tagBtnRef}
        type="button"
        className={`bookmark-tag${pickerOpen ? ' is-active' : ''}`}
        title="Manage tags"
        onClick={e => { e.preventDefault(); setPickerOpen(o => !o); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2z"/>
          <circle cx="7" cy="7" r="1" fill="currentColor"/>
        </svg>
      </button>

      {showPin && (
        <button
          className={`bookmark-pin${pinned ? ' is-pinned' : ''}`}
          title={pinned ? t('unpinned') : t('pinned')}
          onClick={togglePin}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" x2="12" y1="2" y2="22"/>
            <polyline points="12 2 19 9 12 16 5 9 12 2"/>
          </svg>
        </button>
      )}
      <button className="bookmark-remove" title={t('remove-bookmark')} onClick={handleDelete}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
      </button>

      {/* Floating tag picker */}
      {pickerOpen && tagBtnRef.current && (
        <TagPicker
          bookmarkId={bookmark.id}
          bookmarkTitle={bookmark.title}
          anchorEl={tagBtnRef.current}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

export default BookmarkItem;
