import React, { useState, useEffect } from 'react';
import { useReadingList } from '@/context/ReadingListContext';
import ReadingListPanel from '@/components/ReadingListPanel';
import ReaderPanel from '@/components/ReaderPanel';

interface Props {
  onBack: () => void;
}

function ReadingListView({ onBack: _onBack }: Props) {
  const { items, archiveItem } = useReadingList();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select first unread item on mount or when list changes
  useEffect(() => {
    if (selectedId && items.some(i => i.id === selectedId)) return;
    const first = items.find(i => i.status === 'unread');
    setSelectedId(first?.id ?? null);
  }, [items, selectedId]);

  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  const handleMarkRead = (id: string) => {
    archiveItem(id);
    const unread = items.filter(i => i.status === 'unread' && i.id !== id);
    setSelectedId(unread[0]?.id ?? null);
  };

  return (
    <div className="reading-list-view">
      <ReadingListPanel
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <ReaderPanel
        item={selectedItem}
        allItemsEmpty={items.length === 0}
        onMarkRead={handleMarkRead}
      />
    </div>
  );
}

export default ReadingListView;
