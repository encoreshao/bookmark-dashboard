import React from 'react';
import { getHostname } from '@/utils/bookmarks';
import { relativeTime } from '@/utils/time';
import { useSettings } from '@/context/SettingsContext';
import type { ReadingListItem as RLItem } from '@/types/reading-list';

interface Props {
  item: RLItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onRemove: (id: string) => void;
}

function ReadingListItem({ item, isActive, onSelect, onArchive, onUnarchive, onRemove }: Props) {
  const { settings } = useSettings();
  const hostname = getHostname(item.url);
  const isFetching = item.cachedContent === undefined;
  const isArchived = item.status === 'archived';

  const classes = [
    'rl-item',
    isActive ? 'is-active' : '',
    isArchived ? 'is-archived' : '',
    isFetching ? 'rl-item-fetching' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={() => onSelect(item.id)}>
      <div className="rl-item-body">
        <div className="rl-item-title" title={item.title}>{item.title}</div>
        <div className="rl-item-meta">{hostname} · {relativeTime(item.addedAt, settings.language)}</div>
      </div>
      <div className="rl-item-actions">
        {isArchived ? (
          <button
            type="button"
            className="rl-item-action-btn"
            title="Move back to unread"
            onClick={e => { e.stopPropagation(); onUnarchive(item.id); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 14-4-4 4-4"/>
              <path d="M5 10h11a4 4 0 0 1 0 8h-1"/>
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="rl-item-action-btn"
            title="Archive"
            onClick={e => { e.stopPropagation(); onArchive(item.id); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="5" x="2" y="3" rx="1"/>
              <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
              <path d="M10 12h4"/>
            </svg>
          </button>
        )}
        <button
          type="button"
          className="rl-item-action-btn danger"
          title="Remove from reading list"
          onClick={e => { e.stopPropagation(); onRemove(item.id); }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ReadingListItem;
