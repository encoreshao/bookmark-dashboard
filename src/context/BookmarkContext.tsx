import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { BookmarkNode } from '@/types';

interface BookmarkContextValue {
  allBookmarks: BookmarkNode[];
  isLoading: boolean;
  loadBookmarks: () => void;
  removeBookmark: (id: string) => void;
  removeFolder: (id: string) => void;
  moveBookmark: (id: string, parentId: string) => void;
  createFolder: (title: string, parentId?: string) => Promise<BookmarkNode>;
  renameBookmark: (id: string, title: string) => Promise<void>;
  removeMultiple: (ids: string[]) => Promise<void>;
  moveMultiple: (ids: string[], parentId: string) => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [allBookmarks, setAllBookmarks] = useState<BookmarkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookmarks = useCallback(() => {
    setIsLoading(true);
    chrome.bookmarks.getTree((tree) => {
      const roots = tree[0]?.children ?? [];
      setAllBookmarks(roots);
      setIsLoading(false);
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    // Optimistically remove from state to preserve scroll position
    function removeNode(nodes: BookmarkNode[]): BookmarkNode[] {
      return nodes
        .filter(n => n.id !== id)
        .map(n => n.children ? { ...n, children: removeNode(n.children) } : n);
    }
    setAllBookmarks(prev => removeNode(prev));
    chrome.bookmarks.remove(id);
  }, []);

  const removeFolder = useCallback((id: string) => {
    function removeNode(nodes: BookmarkNode[]): BookmarkNode[] {
      return nodes
        .filter(n => n.id !== id)
        .map(n => n.children ? { ...n, children: removeNode(n.children) } : n);
    }
    setAllBookmarks(prev => removeNode(prev));
    chrome.bookmarks.removeTree(id);
  }, []);

  const moveBookmark = useCallback((id: string, parentId: string) => {
    chrome.bookmarks.move(id, { parentId }, () => {
      loadBookmarks();
    });
  }, [loadBookmarks]);

  const createFolder = useCallback((title: string, parentId?: string): Promise<BookmarkNode> => {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.create(
        { title, parentId: parentId ?? '1' },
        (node) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            loadBookmarks();
            resolve(node);
          }
        },
      );
    });
  }, [loadBookmarks]);

  const renameBookmark = useCallback((id: string, title: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.update(id, { title }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          loadBookmarks();
          resolve();
        }
      });
    });
  }, [loadBookmarks]);

  const removeMultiple = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await new Promise<void>((resolve) => {
        chrome.bookmarks.remove(id, () => resolve());
      });
    }
    loadBookmarks();
  }, [loadBookmarks]);

  const moveMultiple = useCallback(async (ids: string[], parentId: string) => {
    for (const id of ids) {
      await new Promise<void>((resolve) => {
        chrome.bookmarks.move(id, { parentId }, () => resolve());
      });
    }
    loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return (
    <BookmarkContext.Provider value={{
      allBookmarks, isLoading, loadBookmarks,
      removeBookmark, removeFolder, moveBookmark,
      createFolder, renameBookmark,
      removeMultiple, moveMultiple,
    }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks(): BookmarkContextValue {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
