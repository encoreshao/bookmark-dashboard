import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { BookmarkNode } from '@/types';

interface BookmarkContextValue {
  allBookmarks: BookmarkNode[];
  isLoading: boolean;
  loadBookmarks: () => void;
  removeBookmark: (id: string) => void;
  moveBookmark: (id: string, parentId: string) => void;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [allBookmarks, setAllBookmarks] = useState<BookmarkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookmarks = useCallback(() => {
    setIsLoading(true);
    chrome.bookmarks.getTree((tree) => {
      // Chrome returns an array with a single root node; its children are the actual roots
      const roots = tree[0]?.children ?? [];
      setAllBookmarks(roots);
      setIsLoading(false);
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    chrome.bookmarks.remove(id, () => {
      loadBookmarks();
    });
  }, [loadBookmarks]);

  const moveBookmark = useCallback((id: string, parentId: string) => {
    chrome.bookmarks.move(id, { parentId }, () => {
      loadBookmarks();
    });
  }, [loadBookmarks]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return (
    <BookmarkContext.Provider value={{ allBookmarks, isLoading, loadBookmarks, removeBookmark, moveBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks(): BookmarkContextValue {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
