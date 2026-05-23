import React from 'react';
import type { ReadingListItem } from '@/types/reading-list';

interface Props {
  item: ReadingListItem | null;
  allItemsEmpty: boolean;
  onMarkRead: (id: string) => void;
}

function ReaderPanel({ item, allItemsEmpty, onMarkRead }: Props) {
  if (!item) {
    return (
      <div className="rl-reader">
        <div className="rl-reader-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          {allItemsEmpty ? (
            <p>Your reading list is empty. Add articles with the bookmark button or paste a URL.</p>
          ) : (
            <p>Select an article to read.</p>
          )}
        </div>
      </div>
    );
  }

  const isFetching = item.cachedContent === undefined;
  const hasCached = typeof item.cachedContent === 'string';

  return (
    <div className="rl-reader">
      {isFetching && (
        <div className="rl-reader-shimmer">
          <div className="rl-shimmer-line" style={{ width: '60%', height: '28px', marginBottom: '16px' }} />
          <div className="rl-shimmer-line" style={{ width: '35%', marginBottom: '28px' }} />
          {[100, 95, 88, 92, 85, 78, 90].map((w, i) => (
            <div key={i} className="rl-shimmer-line" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {!isFetching && !hasCached && (
        <div className="rl-reader-unavailable">
          <p><strong>Content unavailable offline.</strong></p>
          <p>The article couldn't be cached. You can still read it live:</p>
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            Open {item.url} ↗
          </a>
        </div>
      )}

      {hasCached && (
        <>
          <div className="rl-article-header">
            <h1 className="rl-article-title">{item.cachedTitle || item.title}</h1>
            {item.cachedByline && (
              <p className="rl-article-byline">{item.cachedByline}</p>
            )}
          </div>

          <div
            className="rl-article-content"
            dangerouslySetInnerHTML={{ __html: item.cachedContent as string }}
          />
        </>
      )}

      {!isFetching && (
        <div className="rl-reader-actions">
          {item.status === 'unread' && (
            <button
              type="button"
              className="rl-action-btn primary"
              onClick={() => onMarkRead(item.id)}
            >
              ✓ Mark as read
            </button>
          )}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rl-action-btn secondary"
          >
            ↗ Open live
          </a>
        </div>
      )}
    </div>
  );
}

export default ReaderPanel;
