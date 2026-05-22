import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { TagMap, TagColorMap } from '@/types';
import { normalizeTag, assignTagColor } from '@/utils/tags';

interface TagContextValue {
  tagMap: TagMap;
  tagColors: TagColorMap;
  allTags: string[];
  activeTags: string[];
  getTagsForBookmark: (id: string) => string[];
  setTagsForBookmark: (id: string, tags: string[]) => void;
  toggleActiveTag: (name: string) => void;
  clearActiveTags: () => void;
}

const TagContext = createContext<TagContextValue | null>(null);

export function TagProvider({ children }: { children: React.ReactNode }) {
  const [tagMap, setTagMap] = useState<TagMap>({});
  const [tagColors, setTagColors] = useState<TagColorMap>({});
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Fix 1: Refs to always read latest state without stale-closure issues
  const tagMapRef = useRef(tagMap);
  const tagColorsRef = useRef(tagColors);
  useEffect(() => { tagMapRef.current = tagMap; }, [tagMap]);
  useEffect(() => { tagColorsRef.current = tagColors; }, [tagColors]);

  useEffect(() => {
    chrome.storage.local.get(['bd_bookmarkTags', 'bd_tagColors'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('TagContext: failed to load tags', chrome.runtime.lastError.message);
        return;
      }
      if (result.bd_bookmarkTags && typeof result.bd_bookmarkTags === 'object') {
        setTagMap(result.bd_bookmarkTags);
      }
      if (result.bd_tagColors && typeof result.bd_tagColors === 'object') {
        setTagColors(result.bd_tagColors);
      }
    });
  }, []);

  // Fix 2: Clean up orphaned tagMap entries when bookmarks are deleted
  useEffect(() => {
    const onRemoved = (id: string) => {
      setTagMap(prev => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        chrome.storage.local.set({ bd_bookmarkTags: next }, () => {
          if (chrome.runtime.lastError) {
            console.error('TagContext: cleanup write failed:', chrome.runtime.lastError.message);
          }
        });
        return next;
      });
    };
    chrome.bookmarks.onRemoved.addListener(onRemoved);
    return () => chrome.bookmarks.onRemoved.removeListener(onRemoved);
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const tags of Object.values(tagMap)) {
      for (const t of tags) tagSet.add(t);
    }
    return [...tagSet].sort();
  }, [tagMap]);

  const getTagsForBookmark = useCallback((id: string): string[] => {
    return tagMap[id] ?? [];
  }, [tagMap]);

  const setTagsForBookmark = useCallback((id: string, tags: string[]) => {
    const normalized = [...new Set(tags.map(normalizeTag).filter(Boolean))];
    const currentMap = tagMapRef.current;
    const currentColors = tagColorsRef.current;

    const newColors = { ...currentColors };
    let colorsDirty = false;
    for (const tag of normalized) {
      if (!newColors[tag]) {
        newColors[tag] = assignTagColor(newColors);
        colorsDirty = true;
      }
    }

    const newMap = { ...currentMap, [id]: normalized };
    const toStore: Record<string, unknown> = { bd_bookmarkTags: newMap };
    if (colorsDirty) toStore.bd_tagColors = newColors;

    setTagMap(newMap);
    if (colorsDirty) setTagColors(newColors);
    chrome.storage.local.set(toStore, () => {
      if (chrome.runtime.lastError) {
        console.error('TagContext: storage write failed:', chrome.runtime.lastError.message);
      }
    });
  }, []); // refs keep this stable — no deps needed

  const toggleActiveTag = useCallback((name: string) => {
    setActiveTags(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  }, []);

  const clearActiveTags = useCallback(() => setActiveTags([]), []);

  return (
    <TagContext.Provider value={{
      tagMap, tagColors, allTags, activeTags,
      getTagsForBookmark, setTagsForBookmark,
      toggleActiveTag, clearActiveTags,
    }}>
      {children}
    </TagContext.Provider>
  );
}

export function useTags(): TagContextValue {
  const ctx = useContext(TagContext);
  if (!ctx) throw new Error('useTags must be used within TagProvider');
  return ctx;
}
