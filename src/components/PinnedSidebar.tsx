import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { createTranslator } from '@/utils/i18n';
import { findBookmarkById } from '@/utils/bookmarks';
import BookmarkItem from '@/components/BookmarkItem';
import type { BookmarkNode } from '@/types';

function PinnedSidebar() {
  const { settings } = useSettings();
  const { allBookmarks } = useBookmarks();
  const t = createTranslator(settings.language);
  const [open, setOpen] = useState(false);

  if (settings.pinnedDisplay !== 'sidebar' || settings.pinnedIds.length === 0) return null;

  const pinned = settings.pinnedIds
    .map(id => findBookmarkById(allBookmarks, id))
    .filter((bm): bm is BookmarkNode => !!bm);

  if (pinned.length === 0) return null;

  return (
    <nav className={`pinned-sidebar${open ? ' pinned' : ''}`} id="pinned-sidebar">
      <div
        className="pinned-sidebar-trigger"
        title={t('pinned-header')}
        onClick={() => setOpen(o => !o)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="2" y2="22"/>
          <polyline points="12 2 19 9 12 16 5 9 12 2"/>
        </svg>
      </div>
      <div className="pinned-sidebar-panel">
        <div className="pinned-sidebar-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" x2="12" y1="2" y2="22"/>
            <polyline points="12 2 19 9 12 16 5 9 12 2"/>
          </svg>
          <span>{t('pinned-header')}</span>
        </div>
        <div className="pinned-sidebar-list view-list">
          {pinned.map(bm => (
            <BookmarkItem key={bm.id} bookmark={bm} isPinned showPin />
          ))}
        </div>
      </div>
    </nav>
  );
}

export default PinnedSidebar;
