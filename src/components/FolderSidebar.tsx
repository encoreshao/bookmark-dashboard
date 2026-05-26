import { useState, useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { useUI } from '@/context/UIContext';
import { useTags } from '@/context/TagContext';
import { createTranslator } from '@/utils/i18n';
import { buildSidebarTree } from '@/utils/bookmarks';
import type { SidebarNode } from '@/utils/bookmarks';
import { getTagCounts } from '@/utils/tags';

function SidebarItem({
  node,
  depth,
  onSelect,
}: {
  node: SidebarNode;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="folder-sidebar-item"
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) setExpanded(e => !e);
        }}
      >
        {hasChildren ? (
          <svg
            className={`folder-sidebar-item-chevron${expanded ? ' open' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            width="14" height="14"
            onClick={(e) => { e.stopPropagation(); setExpanded(prev => !prev); }}
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        ) : (
          <span className="folder-sidebar-item-spacer" />
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className="folder-sidebar-item-icon">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>
        <span className="folder-sidebar-item-name">{node.title}</span>
        {node.count > 0 && <span className="folder-sidebar-item-count">{node.count}</span>}
      </div>
      {expanded && hasChildren && node.children.map(child => (
        <SidebarItem key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  );
}

function FolderSidebar() {
  const { settings } = useSettings();
  const { allBookmarks } = useBookmarks();
  const { setActiveView } = useUI();
  const t = createTranslator(settings.language);
  const isPinned = settings.folderSidebarMode === 'pinned';
  const [floatOpen, setFloatOpen] = useState(false);
  const [search, setSearch] = useState('');

  const panelVisible = isPinned || floatOpen;

  const { allTags, tagColors, tagMap, activeTags, toggleActiveTag } = useTags();
  const tagCounts = useMemo(() => getTagCounts(tagMap), [tagMap]);

  const tree = useMemo(() => buildSidebarTree(allBookmarks), [allBookmarks]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tree;
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    function filterTree(nodes: SidebarNode[]): SidebarNode[] {
      return nodes
        .map(n => ({ ...n, children: filterTree(n.children) }))
        .filter(n => re.test(n.title) || n.children.length > 0);
    }
    return filterTree(tree);
  }, [tree, search]);

  const handleSelect = (folderId: string) => {
    setActiveView('bookmarks');
    setTimeout(() => {
      const el = document.getElementById(`folder-${folderId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <nav
      className={`folder-sidebar${panelVisible ? ' pinned' : ''}`}
      id="folder-sidebar"
    >
      {!isPinned && (
        <div
          className="folder-sidebar-trigger"
          onClick={() => setFloatOpen(o => !o)}
        >
          {floatOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" className="trigger-icon-close">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" className="trigger-icon-open">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
            </svg>
          )}
        </div>
      )}

      <div className="folder-sidebar-panel">
        <div className="folder-sidebar-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
          </svg>
          <span>{t('folders-header')}</span>
        </div>
        <div className="folder-sidebar-search">
          <input
            type="text"
            className="folder-sidebar-search-input"
            placeholder={t('search-folders')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="folder-sidebar-list">
          {filtered.length === 0 && (
            <div className="folder-sidebar-empty">No folders found</div>
          )}
          {filtered.map(node => (
            <SidebarItem key={node.id} node={node} depth={0} onSelect={handleSelect} />
          ))}
        </div>

        {/* Tags section */}
        {allTags.length > 0 && (
          <div className="sidebar-tags-section">
            <div className="sidebar-tags-header">
              <span className="sidebar-tags-title">Tags</span>
            </div>
            {allTags.map(tag => (
              <div
                key={tag}
                className={`sidebar-tag-item${activeTags.includes(tag) ? ' is-active' : ''}`}
                onClick={() => toggleActiveTag(tag)}
              >
                <span className="sidebar-tag-dot" style={{ background: tagColors[tag] ?? 'var(--text-muted)' }} />
                <span style={{ color: tagColors[tag] ?? 'inherit' }}>{tag}</span>
                <span className="sidebar-tag-count">{tagCounts[tag] ?? 0}</span>
              </div>
            ))}
          </div>
        )}

        {allTags.length === 0 && (
          <div style={{ padding: '6px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
            No tags yet — add them via the tag button on any bookmark.
          </div>
        )}
      </div>
    </nav>
  );
}

export default FolderSidebar;
