import { useState, useEffect } from 'react';
import { useUI } from '@/context/UIContext';
import { useSettings } from '@/context/SettingsContext';
import { createTranslator } from '@/utils/i18n';
import { getFaviconUrl } from '@/utils/bookmarks';

function DomainModal() {
  const { domainModal, closeDomainModal } = useUI();
  const { settings } = useSettings();
  const t = createTranslator(settings.language);
  const [search, setSearch] = useState('');

  useEffect(() => { setSearch(''); }, [domainModal]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDomainModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeDomainModal]);

  if (!domainModal) return null;

  const showSearch = domainModal.bookmarks.length > 10;
  const filtered = search.trim()
    ? domainModal.bookmarks.filter(bm => {
        const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return re.test(bm.title) || re.test(bm.url ?? '');
      })
    : domainModal.bookmarks;

  return (
    <>
      <div className="domain-modal-overlay open" onClick={closeDomainModal} />
      <div className="domain-modal open" role="dialog" aria-modal="true">
        <div className="domain-modal-header">
          <img
            className="domain-modal-favicon"
            src={getFaviconUrl(`https://${domainModal.domain}`)}
            alt=""
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div className="domain-modal-title-row">
            <h3 className="domain-modal-title">{domainModal.domain}</h3>
            <span className="domain-modal-count">{domainModal.bookmarks.length} bookmarks</span>
          </div>
          <button className="domain-modal-close" onClick={closeDomainModal} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {showSearch && (
          <div className="domain-modal-search-wrap">
            <svg className="domain-modal-search-icon" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              autoFocus
              type="text"
              className="domain-modal-search-input"
              placeholder={t('domain-modal-search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="domain-modal-list">
          {filtered.map(bm => (
            <a
              key={bm.id}
              className="domain-modal-item"
              href={bm.url}
              target="_blank"
              rel="noopener"
            >
              <img
                className="domain-modal-favicon"
                src={getFaviconUrl(bm.url ?? '')}
                alt=""
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <span className="domain-modal-item-title">{bm.title}</span>
              <svg className="domain-modal-item-arrow" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default DomainModal;
