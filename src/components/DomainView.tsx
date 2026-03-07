import React, { useMemo, useState, useCallback } from 'react';
import { useBookmarks } from '@/context/BookmarkContext';
import { useSettings } from '@/context/SettingsContext';
import { useUI } from '@/context/UIContext';
import { createTranslator } from '@/utils/i18n';
import { buildDomainMap, getDomainColor, getFaviconUrl } from '@/utils/bookmarks';

interface DomainEntry {
  domain: string;
  bookmarks: chrome.bookmarks.BookmarkTreeNode[];
  color: string;
  pct: number;
  count: number;
}

interface Props { onBack: () => void; }

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="dv-stat-card">
      <span className="dv-stat-value" style={accent ? { color: accent } : undefined}>{value}</span>
      <span className="dv-stat-label">{label}</span>
    </div>
  );
}

function HeroDomain({ entry, rank, onClick }: { entry: DomainEntry; rank: number; onClick: () => void }) {
  const size = rank === 0 ? 'xl' : rank <= 2 ? 'lg' : 'md';
  return (
    <div
      className={`dv-hero-tile dv-hero-${size}`}
      onClick={onClick}
      style={{
        '--tile-color': entry.color,
        '--tile-color-light': `${entry.color}18`,
        animationDelay: `${rank * 60}ms`,
      } as React.CSSProperties}
    >
      <div className="dv-hero-glow" style={{ background: `radial-gradient(circle at 30% 30%, ${entry.color}30, transparent 70%)` }} />
      <div className="dv-hero-rank">#{rank + 1}</div>
      <img
        className="dv-hero-favicon"
        src={getFaviconUrl(`https://${entry.domain}`)}
        alt=""
        onError={e => (e.currentTarget.style.display = 'none')}
      />
      <span className="dv-hero-domain">{entry.domain}</span>
      <div className="dv-hero-count">{entry.count}</div>
      <div className="dv-hero-bar">
        <div className="dv-hero-bar-fill" style={{ width: `${Math.min(entry.pct * 2.5, 100)}%`, background: entry.color }} />
      </div>
    </div>
  );
}

function DomainTile({ entry, index, onClick }: { entry: DomainEntry; index: number; onClick: () => void }) {
  return (
    <div
      className="dv-tile"
      onClick={onClick}
      style={{
        '--tile-color': entry.color,
        animationDelay: `${index * 25}ms`,
      } as React.CSSProperties}
    >
      <div className="dv-tile-accent" style={{ background: entry.color }} />
      <div className="dv-tile-body">
        <img
          className="dv-tile-favicon"
          src={getFaviconUrl(`https://${entry.domain}`)}
          alt=""
          onError={e => (e.currentTarget.style.display = 'none')}
        />
        <div className="dv-tile-info">
          <span className="dv-tile-domain">{entry.domain}</span>
          <span className="dv-tile-count">{entry.count} {entry.count === 1 ? 'bookmark' : 'bookmarks'}</span>
        </div>
      </div>
      <div className="dv-tile-bar-track">
        <div className="dv-tile-bar" style={{ width: `${Math.min(entry.pct * 3, 100)}%`, background: entry.color }} />
      </div>
    </div>
  );
}

function DomainView({ onBack }: Props) {
  const { allBookmarks } = useBookmarks();
  const { settings } = useSettings();
  const { openDomainModal } = useUI();
  const t = createTranslator(settings.language);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'treemap' | 'list'>('treemap');

  const domainMap = useMemo(() => buildDomainMap(allBookmarks), [allBookmarks]);
  const totalBookmarks = useMemo(() => Array.from(domainMap.values()).reduce((s, a) => s + a.length, 0), [domainMap]);
  const totalDomains = domainMap.size;

  const allDomains: DomainEntry[] = useMemo(() => {
    return Array.from(domainMap.entries())
      .map(([domain, bookmarks]) => ({
        domain,
        bookmarks,
        color: getDomainColor(domain),
        pct: totalBookmarks > 0 ? (bookmarks.length / totalBookmarks) * 100 : 0,
        count: bookmarks.length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [domainMap, totalBookmarks]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allDomains;
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return allDomains.filter(e => re.test(e.domain));
  }, [allDomains, search]);

  const topDomains = useMemo(() => filtered.slice(0, 5), [filtered]);
  const restDomains = useMemo(() => filtered.slice(5), [filtered]);
  const avgPerDomain = totalDomains > 0 ? Math.round(totalBookmarks / totalDomains) : 0;
  const topDomain = allDomains[0];

  const handleClick = useCallback((entry: DomainEntry) => {
    openDomainModal(entry.domain, entry.bookmarks, entry.color);
  }, [openDomainModal]);

  return (
    <section className="domain-view active" id="domain-view">
      {/* Header */}
      <div className="dv-header">
        <div className="dv-header-text">
          <h2 className="dv-title">{t('domain-view-title')}</h2>
          <p className="dv-subtitle">
            <strong>{totalBookmarks}</strong> bookmarks across <strong>{totalDomains}</strong> domains
          </p>
        </div>
        <div className="dv-header-actions">
          <div className="dv-view-toggle">
            <button
              className={`dv-view-btn${viewMode === 'treemap' ? ' active' : ''}`}
              onClick={() => setViewMode('treemap')}
              title="Visual"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
                <rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
              </svg>
            </button>
            <button
              className={`dv-view-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/>
                <line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/>
                <line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
              </svg>
            </button>
          </div>
          <button className="domain-view-back" onClick={onBack}>{t('domain-back')}</button>
        </div>
      </div>

      {/* Stats */}
      <div className="dv-stats">
        <StatCard label="Domains" value={totalDomains} accent="var(--accent)" />
        <StatCard label="Bookmarks" value={totalBookmarks} />
        <StatCard label="Avg / Domain" value={avgPerDomain} />
        {topDomain && <StatCard label="Top Domain" value={topDomain.domain} accent={topDomain.color} />}
      </div>

      {/* Search */}
      <div className="domain-view-search-wrap">
        <svg className="domain-view-search-icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          className="domain-view-search-input"
          placeholder={t('domain-search-placeholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="domain-no-results">No matching domains</p>
      )}

      {filtered.length > 0 && viewMode === 'treemap' && (
        <>
          {/* Hero top domains */}
          <div className="dv-hero-grid">
            {topDomains.map((entry, i) => (
              <HeroDomain key={entry.domain} entry={entry} rank={i} onClick={() => handleClick(entry)} />
            ))}
          </div>

          {/* Remaining domains as tiles */}
          {restDomains.length > 0 && (
            <>
              <div className="dv-section-label">
                <span>All Domains</span>
                <span className="dv-section-count">{restDomains.length}</span>
              </div>
              <div className="dv-tile-grid">
                {restDomains.map((entry, i) => (
                  <DomainTile key={entry.domain} entry={entry} index={i} onClick={() => handleClick(entry)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {filtered.length > 0 && viewMode === 'list' && (
        <div className="dv-list">
          {filtered.map((entry, i) => (
            <div
              key={entry.domain}
              className="dv-list-row"
              onClick={() => handleClick(entry)}
              style={{ animationDelay: `${i * 20}ms` } as React.CSSProperties}
            >
              <span className="dv-list-rank">#{i + 1}</span>
              <img
                className="dv-list-favicon"
                src={getFaviconUrl(`https://${entry.domain}`)}
                alt=""
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <span className="dv-list-domain">{entry.domain}</span>
              <div className="dv-list-bar-track">
                <div className="dv-list-bar" style={{ width: `${Math.min(entry.pct * 2.5, 100)}%`, background: entry.color }} />
              </div>
              <span className="dv-list-count" style={{ color: entry.color }}>{entry.count}</span>
              <svg className="dv-list-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default DomainView;
