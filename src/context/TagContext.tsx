import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    chrome.storage.local.get(['bd_bookmarkTags', 'bd_tagColors'], (result) => {
      if (result.bd_bookmarkTags && typeof result.bd_bookmarkTags === 'object') {
        setTagMap(result.bd_bookmarkTags);
      }
      if (result.bd_tagColors && typeof result.bd_tagColors === 'object') {
        setTagColors(result.bd_tagColors);
      }
    });
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

    // Assign colors to any new tags before updating state
    const newColors = { ...tagColors };
    let colorsDirty = false;
    for (const tag of normalized) {
      if (!newColors[tag]) {
        newColors[tag] = assignTagColor(newColors);
        colorsDirty = true;
      }
    }

    const newMap = { ...tagMap, [id]: normalized };
    setTagMap(newMap);
    chrome.storage.local.set({ bd_bookmarkTags: newMap });

    if (colorsDirty) {
      setTagColors(newColors);
      chrome.storage.local.set({ bd_tagColors: newColors });
    }
  }, [tagMap, tagColors]);

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
