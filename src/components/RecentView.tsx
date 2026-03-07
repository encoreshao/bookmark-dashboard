import { useMemo } from 'react';
import { useBookmarks } from '@/context/BookmarkContext';
import { useSettings } from '@/context/SettingsContext';
import { createTranslator } from '@/utils/i18n';
import { collectAllBookmarks, getFaviconUrl, getHostname } from '@/utils/bookmarks';
import { relativeTime } from '@/utils/time';

interface Props { onBack: () => void; }

function RecentView({ onBack }: Props) {
  const { allBookmarks } = useBookmarks();
  const { settings } = useSettings();
  const t = createTranslator(settings.language);

  const recent = useMemo(() => {
    return collectAllBookmarks(allBookmarks)
      .sort((a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0))
      .slice(0, 50);
  }, [allBookmarks]);

  return (
    <section className="recent-view active" id="recent-view">
      <div className="recent-view-header">
        <div>
          <h2 className="recent-view-title">{t('recent-view-title')}</h2>
          <p className="recent-view-desc">{t('recent-view-desc')}</p>
        </div>
        <button className="recent-view-back" onClick={onBack}>{t('recent-back')}</button>
      </div>

      <div className="recent-list">
        {recent.length === 0 && <p className="recent-empty">No bookmarks found.</p>}
        {recent.map((bm, i) => (
          <a
            key={bm.id}
            className="recent-item"
            href={bm.url}
            target="_blank"
            rel="noopener"
            style={{ animationDelay: `${i * 20}ms` } as React.CSSProperties}
          >
            <img
              className="recent-favicon"
              src={getFaviconUrl(bm.url ?? '')}
              alt=""
              onError={e => (e.currentTarget.style.display = 'none')}
            />
            <div className="recent-info">
              <span className="recent-title">{bm.title}</span>
              <span className="recent-url">{getHostname(bm.url ?? '')}</span>
            </div>
            <span className="recent-time">{relativeTime(bm.dateAdded ?? 0, settings.language)}</span>
            <svg className="recent-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </a>
        ))}
      </div>
    </section>
  );
}

export default RecentView;
