import React, { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useUI } from '@/context/UIContext';
import { createTranslator } from '@/utils/i18n';
import { getFaviconUrl } from '@/utils/bookmarks';
import type { BookmarkNode } from '@/types';

interface Props {
  bookmark: BookmarkNode;
  isPinned?: boolean;
  showPin?: boolean;
}

function BookmarkItem({ bookmark, isPinned = false, showPin = true }: Props) {
  const { settings, saveSetting } = useSettings();
  const { removeBookmark } = useBookmarks();
  const { confirm, showToast } = useUI();
  const t = createTranslator(settings.language);
  const [dragging, setDragging] = useState(false);
  const isGrid = settings.displayMode === 'grid';
  const pinned = settings.pinnedIds.includes(bookmark.id);

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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', bookmark.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDragging(true), 0);
  };

  const handleDragEnd = () => setDragging(false);

  const favicon = getFaviconUrl(bookmark.url ?? '');

  return (
    <div
      className={`bookmark-item-wrapper${isPinned ? ' is-pinned' : ''}${dragging ? ' bm-dragging' : ''}`}
      draggable
      data-bookmark-id={bookmark.id}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <a
        className="bookmark-item"
        href={bookmark.url}
        target="_blank"
        rel="noopener"
        title={bookmark.title}
      >
        {isGrid ? (
          <>
            <div className="bookmark-favicon-wrap">
              <img className="bookmark-favicon" src={favicon} alt="" loading="lazy"
                   onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
            <span className="bookmark-title">{bookmark.title}</span>
          </>
        ) : (
          <>
            <img className="bookmark-favicon" src={favicon} alt="" loading="lazy"
                 onError={e => (e.currentTarget.style.display = 'none')} />
            <span className="bookmark-title">{bookmark.title}</span>
            <span className="bookmark-url">{bookmark.url ? new URL(bookmark.url).hostname : ''}</span>
          </>
        )}
      </a>

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
    </div>
  );
}

export default BookmarkItem;
