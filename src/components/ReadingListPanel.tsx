import React, { useState } from 'react';
import { useReadingList } from '@/context/ReadingListContext';
import { useUI } from '@/context/UIContext';
import ReadingListItemRow from '@/components/ReadingListItem';
import type { ReadingListItem } from '@/types/reading-list';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function ReadingListPanel({ selectedId, onSelect }: Props) {
  const { items, addItem, archiveItem, unarchiveItem, removeItem } = useReadingList();
  const { showToast } = useUI();
  const [urlInput, setUrlInput] = useState('');

  const unread = items.filter(i => i.status === 'unread');
  const archived = items.filter(i => i.status === 'archived');

  const handleAdd = async () => {
    const url = urlInput.trim();
    if (!url) return;
    const alreadyIn = items.some(i => i.url === url);
    if (alreadyIn) {
      showToast('Already in reading list');
      return;
    }
    const title = (() => {
      try { return new URL(url).hostname; } catch { return url; }
    })();
    setUrlInput('');
    await addItem(url, title);
    showToast('Added to reading list');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleArchive = (id: string) => {
    archiveItem(id);
    if (selectedId === id) {
      const nextUnread = unread.find(i => i.id !== id);
      if (nextUnread) onSelect(nextUnread.id);
    }
  };

  return (
    <div className="rl-panel">
      <div className="rl-panel-header">Reading List</div>

      <div className="rl-quick-add">
        <input
          className="rl-quick-add-input"
          type="url"
          placeholder="Paste a URL..."
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="rl-quick-add-btn" onClick={handleAdd}>Add</button>
      </div>

      <div className="rl-list">
        <div className="rl-section-label">Unread ({unread.length})</div>

        {unread.length === 0 && (
          <div className="rl-empty-panel">
            No articles yet. Add one above or use the bookmark button.
          </div>
        )}

        {unread.map(item => (
          <ReadingListItemRow
            key={item.id}
            item={item}
            isActive={selectedId === item.id}
            onSelect={onSelect}
            onArchive={handleArchive}
            onUnarchive={unarchiveItem}
            onRemove={removeItem}
          />
        ))}

        {archived.length > 0 && (
          <>
            <div className="rl-section-label" style={{ marginTop: '12px' }}>
              Archive ({archived.length})
            </div>
            {archived.map((item: ReadingListItem) => (
              <ReadingListItemRow
                key={item.id}
                item={item}
                isActive={selectedId === item.id}
                onSelect={onSelect}
                onArchive={archiveItem}
                onUnarchive={unarchiveItem}
                onRemove={removeItem}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default ReadingListPanel;
