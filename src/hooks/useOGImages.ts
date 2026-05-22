import { useEffect, useState } from 'react';
import type { OGImageCache } from '@/types';

const OG_CACHE_KEY = 'bd_og_cache';

export function useOGImages(): OGImageCache {
  const [cache, setCache] = useState<OGImageCache>({});

  useEffect(() => {
    chrome.storage.local.get(OG_CACHE_KEY, (data) => {
      setCache(data[OG_CACHE_KEY] || {});
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'local' || !changes[OG_CACHE_KEY]) return;
      setCache(changes[OG_CACHE_KEY].newValue || {});
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return cache;
}
