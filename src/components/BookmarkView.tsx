import React, { useMemo, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useUI } from '@/context/UIContext';
import { useTags } from '@/context/TagContext';
import { createTranslator } from '@/utils/i18n';
import { collectFolders, filterFolders, findBookmarkById } from '@/utils/bookmarks';
import BookmarkItem from '@/components/BookmarkItem';
import TagFilterStrip from '@/components/TagFilterStrip';
import { useOGImages } from '@/hooks/useOGImages';
import type { BookmarkNode, OGImageCache } from '@/types';

function PinnedSection({ pinnedIds, ogImages }: { pinnedIds: string[]; ogImages: OGImageCache }) {
  const { allBookmarks } = useBookmarks();
  const { settings } = useSettings();
  if (pinnedIds.length === 0) return null;
  const viewClass = settings.displayMode === 'grid' ? 'view-grid'
    : settings.displayMode === 'compact' ? 'view-compact'
    : 'view-list';

  const items = pinnedIds
    .map(id => findBookmarkById(allBookmarks, id))
    .filter((bm): bm is BookmarkNode => !!bm);

  if (items.length === 0) return null;

  return (
    <div className={`bookmark-folder ${viewClass}`}>
      <div className="folder-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" className="folder-icon">
          <line x1="12" x2="12" y1="2" y2="22"/>
          <polyline points="12 2 19 9 12 16 5 9 12 2"/>
        </svg>
        <span className="folder-name">Pinned</span>
        <span className="folder-count">{items.length}</span>
      </div>
      <div className="folder-items">
        {items.map(bm => (
          <BookmarkItem key={bm.id} bookmark={bm} isPinned showPin ogImageUrl={ogImages[bm.id]} />
        ))}
      </div>
    </div>
  );
}

function FolderSection({
  folder,
  ogImages,
}: {
  folder: { id: string; title: string; items: BookmarkNode[] };
  ogImages: OGImageCache;
}) {
  const { settings } = useSettings();
  const { moveBookmark } = useBookmarks();
  const { showToast } = useUI();
  const t = createTranslator(settings.language);
  const [collapsed, setCollapsed] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const viewClass = settings.displayMode === 'grid' ? 'view-grid'
    : settings.displayMode === 'compact' ? 'view-compact'
    : 'view-list';

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('text/plain')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDropActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    const bookmarkId = e.dataTransfer.getData('text/plain');
    if (!bookmarkId || !folder.id) return;
    moveBookmark(bookmarkId, folder.id);
    showToast(t('moved'));
  };

  return (
    <div
      className={`bookmark-folder ${viewClass}${dropActive ? ' folder-drop-active' : ''}`}
      id={`folder-${folder.id}`}
      data-folder-id={folder.id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`folder-header${collapsed ? ' collapsed' : ''}`} onClick={() => setCollapsed(c => !c)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" className="folder-icon">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>
        <span className="folder-name">{folder.title}</span>
        <span className="folder-count">{folder.items.length}</span>
      </div>
      {!collapsed && (
        <div className="folder-items">
          {folder.items.map(bm => (
            <BookmarkItem key={bm.id} bookmark={bm} showPin ogImageUrl={ogImages[bm.id]} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Props { searchQuery: string; }

function BookmarkView({ searchQuery }: Props) {
  const { settings } = useSettings();
  const { allBookmarks, isLoading } = useBookmarks();
  const { tagMap, activeTags } = useTags();
  const ogImages = useOGImages();

  const folders = useMemo(() => collectFolders(allBookmarks), [allBookmarks]);
  const filtered = useMemo(() => {
    if (activeTags.length === 0) return filterFolders(folders, searchQuery);
    const tagFiltered = folders.map(f => ({
      ...f,
      items: f.items.filter(bm =>
        activeTags.every(tag => (tagMap[bm.id] ?? []).includes(tag))
      ),
    })).filter(f => f.items.length > 0);
    return filterFolders(tagFiltered, searchQuery);
  }, [folders, searchQuery, activeTags, tagMap]);

  if (isLoading) return (
    <section className="bookmarks-section">
      <div className="empty-state">Loading bookmarks...</div>
    </section>
  );

  return (
    <section className="bookmarks-section">
      <TagFilterStrip />
      <div id="bookmarks">
        {settings.pinnedDisplay === 'top' && (
          <PinnedSection pinnedIds={settings.pinnedIds} ogImages={ogImages} />
        )}
        {filtered.map(folder => (
          <FolderSection key={folder.id} folder={folder} ogImages={ogImages} />
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>{activeTags.length > 0 ? 'No bookmarks match the selected tags.' : 'No bookmarks match your search.'}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default BookmarkView;
