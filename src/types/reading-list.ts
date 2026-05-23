export interface ReadingListItem {
  id: string;
  url: string;
  title: string;
  addedAt: number;
  status: 'unread' | 'archived';
  sourceBookmarkId?: string;
  // undefined = fetch in progress; null = fetch failed; string = cached
  cachedContent: string | null | undefined;
  cachedTitle: string | null;
  cachedByline: string | null;
}

export interface ParsedArticle {
  title: string;
  byline: string | null;
  content: string;
}
