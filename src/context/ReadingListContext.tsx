import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReadingListItem } from '@/types/reading-list';
import { fetchAndParse } from '@/utils/readability';

const STORAGE_KEY = 'bd_readingList';

interface ReadingListContextValue {
  items: ReadingListItem[];
  addItem: (url: string, title: string, sourceBookmarkId?: string) => Promise<void>;
  archiveItem: (id: string) => void;
  unarchiveItem: (id: string) => void;
  removeItem: (id: string) => void;
  isInReadingList: (url: string) => boolean;
}

const ReadingListContext = createContext<ReadingListContextValue | null>(null);

function persist(items: ReadingListItem[]) {
  chrome.storage.local.set({ [STORAGE_KEY]: items }, () => {
    if (chrome.runtime.lastError) {
      console.error('ReadingListContext: storage write failed:', chrome.runtime.lastError.message);
    }
  });
}

export function ReadingListProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.error('ReadingListContext: load failed:', chrome.runtime.lastError.message);
        return;
      }
      const stored = result[STORAGE_KEY];
      if (Array.isArray(stored)) setItems(stored);
    });
  }, []);

  const addItem = useCallback(async (url: string, title: string, sourceBookmarkId?: string) => {
    const existing = itemsRef.current.find(i => i.url === url);
    if (existing) return;

    const newItem: ReadingListItem = {
      id: crypto.randomUUID(),
      url,
      title,
      addedAt: Date.now(),
      status: 'unread',
      sourceBookmarkId,
      cachedContent: undefined,
      cachedTitle: null,
      cachedByline: null,
    };

    const next = [newItem, ...itemsRef.current];
    setItems(next);
    persist(next);

    const parsed = await fetchAndParse(url);
    setItems(prev => {
      const updated = prev.map(i =>
        i.id === newItem.id
          ? {
              ...i,
              cachedContent: parsed ? parsed.content : null,
              cachedTitle: parsed ? parsed.title : null,
              cachedByline: parsed ? parsed.byline : null,
            }
          : i
      );
      persist(updated);
      return updated;
    });
  }, []);

  const archiveItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, status: 'archived' as const } : i);
      persist(next);
      return next;
    });
  }, []);

  const unarchiveItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, status: 'unread' as const } : i);
      persist(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const isInReadingList = useCallback((url: string) => {
    return items.some(i => i.url === url);
  }, [items]); // must depend on items so BookmarkItem re-renders when list changes

  return (
    <ReadingListContext.Provider value={{
      items, addItem, archiveItem, unarchiveItem, removeItem, isInReadingList,
    }}>
      {children}
    </ReadingListContext.Provider>
  );
}

export function useReadingList(): ReadingListContextValue {
  const ctx = useContext(ReadingListContext);
  if (!ctx) throw new Error('useReadingList must be used within ReadingListProvider');
  return ctx;
}
