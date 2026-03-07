import React, { useMemo, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useUI } from '@/context/UIContext';
import { createTranslator } from '@/utils/i18n';
import { collectFolders, filterFolders } from '@/utils/bookmarks';
import BookmarkItem from '@/components/BookmarkItem';
import type { BookmarkNode } from '@/types';

function PinnedSection({ pinnedIds }: { pinnedIds: string[] }) {
  const { allBookmarks } = useBookmarks();
  const { settings } = useSettings();
  if (settings.pinnedDisplay !== 'top' || pinnedIds.length === 0) return null;
  const isGrid = settings.displayMode === 'grid';

  const items = pinnedIds
    .map(id => {
      function find(nodes: BookmarkNode[]): BookmarkNode | undefined {
        for (const n of nodes) {
          if (n.id === id) return n;
          if (n.children) { const f = find(n.children); if (f) return f; }
        }
        return undefined;
      }
      return find(allBookmarks);
    })
    .filter((bm): bm is BookmarkNode => !!bm);

  if (items.length === 0) return null;

  return (
    <div className={`bookmark-folder${isGrid ? ' view-grid' : ' view-list'}`}>
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
        {items.map(bm => <BookmarkItem key={bm.id} bookmark={bm} isPinned showPin />)}
      </div>
    </div>
  );
}

function FolderSection({
  folder,
}: {
  folder: { id: string; title: string; items: BookmarkNode[] };
}) {
  const { settings } = useSettings();
  const { moveBookmark } = useBookmarks();
  const { showToast } = useUI();
  const t = createTranslator(settings.language);
  const [collapsed, setCollapsed] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const isGrid = settings.displayMode === 'grid';

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
      className={`bookmark-folder ${isGrid ? 'view-grid' : 'view-list'}${dropActive ? ' folder-drop-active' : ''}`}
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
          {folder.items.map(bm => <BookmarkItem key={bm.id} bookmark={bm} showPin />)}
        </div>
      )}
    </div>
  );
}

interface Props { searchQuery: string; }

function BookmarkView({ searchQuery }: Props) {
  const { settings } = useSettings();
  const { allBookmarks, isLoading } = useBookmarks();

  const folders = useMemo(() => collectFolders(allBookmarks), [allBookmarks]);
  const filtered = useMemo(() => filterFolders(folders, searchQuery), [folders, searchQuery]);

  if (isLoading) return (
    <section className="bookmarks-section">
      <div className="empty-state">Loading bookmarks...</div>
    </section>
  );

  return (
    <section className="bookmarks-section">
      <div id="bookmarks">
        {settings.pinnedDisplay === 'top' && (
          <PinnedSection pinnedIds={settings.pinnedIds} />
        )}
        {filtered.map(folder => (
          <FolderSection key={folder.id} folder={folder} />
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No bookmarks match your search.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default BookmarkView;
