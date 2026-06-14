import { useEffect, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useUI } from '@/context/UIContext';
import { createTranslator } from '@/utils/i18n';
import { GOOGLE_APPS, AI_APP_IDS, AppIcon } from '@/utils/googleApps';

interface TopbarProps {
  googleAppsOpen: boolean;
  setGoogleAppsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  googleAppsMenuRef: React.RefObject<HTMLDivElement>;
}

function Topbar({ googleAppsOpen, setGoogleAppsOpen, googleAppsMenuRef }: TopbarProps) {
  const { settings, saveSetting } = useSettings();
  const { activeView, setActiveView, openSettings, openKbdModal, openAddBookmark } = useUI();
  const t = createTranslator(settings.language);
  const [version, setVersion] = useState('');
  const [extName, setExtName] = useState('Bookmark Dashboard');
  useEffect(() => {
    try {
      const mf = chrome.runtime.getManifest();
      setVersion(`v${mf.version}`);
      setExtName(mf.name);
    } catch { /* dev environment */ }
  }, []);

  useEffect(() => {
    if (!googleAppsOpen) return;
    const handler = (e: MouseEvent) => {
      if (googleAppsMenuRef.current && !googleAppsMenuRef.current.contains(e.target as Node)) {
        setGoogleAppsOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [googleAppsOpen, setGoogleAppsOpen, googleAppsMenuRef]);

  const toggleTheme = () => {
    const cycle = { dark: 'light', light: 'system', system: 'dark' } as const;
    saveSetting('theme', cycle[settings.theme] ?? 'dark');
  };

  const visibleApps = GOOGLE_APPS.filter(a => (settings.visibleApps ?? []).includes(a.id));
  const compact = settings.navDisplay === 'compact';

  const isPinned = settings.folderSidebarMode === 'pinned';

  return (
    <header className="topbar">
      <div className="topbar-brand" data-tooltip={isPinned ? extName : undefined}>
        <div className="topbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" width="22" height="22"
               aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span className="topbar-title">{extName}</span>
        {version && <span className="topbar-version" id="topbar-version">{version}</span>}
      </div>

      <nav className="topbar-nav">
        <button
          className={`nav-link${activeView === 'recent' ? ' active' : ''}`}
          onClick={() => setActiveView(activeView === 'recent' ? 'bookmarks' : 'recent')}
          data-tooltip={compact ? `${t('nav-recent')} (R)` : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {!compact && <span>{t('nav-recent')}</span>}
        </button>

        <button
          className={`nav-link${activeView === 'domains' ? ' active' : ''}`}
          onClick={() => setActiveView(activeView === 'domains' ? 'bookmarks' : 'domains')}
          data-tooltip={compact ? `${t('nav-domains')} (D)` : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="8" height="8" rx="2"/>
            <rect x="14" y="2" width="8" height="8" rx="2"/>
            <rect x="2" y="14" width="8" height="8" rx="2"/>
            <path d="M18 14v4"/><path d="M16 18h4"/>
          </svg>
          {!compact && <span>{t('nav-domains')}</span>}
        </button>

        <button
          className={`nav-link${activeView === 'ai' ? ' active' : ''}`}
          onClick={() => setActiveView(activeView === 'ai' ? 'bookmarks' : 'ai')}
          data-tooltip={compact ? `${t('nav-ai')} (A)` : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
          </svg>
          {!compact && <span>{t('nav-ai')}</span>}
        </button>

        <button
          className={`nav-link${activeView === 'reading' ? ' active' : ''}`}
          onClick={() => setActiveView(activeView === 'reading' ? 'bookmarks' : 'reading')}
          data-tooltip={compact ? 'Reading List (L)' : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          {!compact && <span>Reading</span>}
        </button>

        <div className="nav-google-apps" ref={googleAppsMenuRef} style={{ position: 'relative' }}>
          <button
            className={`nav-link${googleAppsOpen ? ' active' : ''}`}
            id="btn-google-apps"
            onClick={(e) => { e.stopPropagation(); setGoogleAppsOpen(!googleAppsOpen); }}
            data-tooltip={compact ? `Google Apps (G)` : undefined}
            aria-haspopup="menu"
            aria-expanded={googleAppsOpen}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="18" height="18"
                 aria-hidden="true">
              <rect x="3" y="3" width="4" height="4" rx="0.6"/>
              <rect x="10" y="3" width="4" height="4" rx="0.6"/>
              <rect x="17" y="3" width="4" height="4" rx="0.6"/>
              <rect x="3" y="10" width="4" height="4" rx="0.6"/>
              <rect x="10" y="10" width="4" height="4" rx="0.6"/>
              <rect x="17" y="10" width="4" height="4" rx="0.6"/>
              <rect x="3" y="17" width="4" height="4" rx="0.6"/>
              <rect x="10" y="17" width="4" height="4" rx="0.6"/>
              <rect x="17" y="17" width="4" height="4" rx="0.6"/>
            </svg>
            {!compact && <span>{t('nav-apps')}</span>}
          </button>
          <div className={`google-apps-menu${googleAppsOpen ? ' open' : ''}`} id="google-apps-menu">
            {(() => {
              const regularApps = visibleApps.filter(a => !AI_APP_IDS.includes(a.id));
              const aiApps = visibleApps.filter(a => AI_APP_IDS.includes(a.id));
              return (
                <>
                  {regularApps.length > 0 && (
                    <>
                      <p className="gam-title">Google Apps</p>
                      <div className="gam-grid gam-grid-4">
                        {regularApps.map(app => (
                          <a key={app.id} className="gam-item" href={app.url} target="_blank" rel="noopener">
                            <AppIcon app={app} />
                            <span>{app.label}</span>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                  {aiApps.length > 0 && (
                    <>
                      <div className="gam-divider" />
                      <p className="gam-title gam-title-ai">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
                        </svg>
                        AI
                      </p>
                      <div className="gam-grid gam-grid-4">
                        {aiApps.map(app => (
                          <a key={app.id} className="gam-item" href={app.url} target="_blank" rel="noopener">
                            <AppIcon app={app} />
                            <span>{app.label}</span>
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </nav>

      <div className="topbar-utils">
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn${settings.displayMode === 'list' ? ' active' : ''}`}
            onClick={() => saveSetting('displayMode', 'list')}
            data-tooltip="List view"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" width="15" height="15"
                 aria-hidden="true">
              <line x1="8" x2="21" y1="6" y2="6"/>
              <line x1="8" x2="21" y1="12" y2="12"/>
              <line x1="8" x2="21" y1="18" y2="18"/>
              <line x1="3" x2="3.01" y1="6" y2="6"/>
              <line x1="3" x2="3.01" y1="12" y2="12"/>
              <line x1="3" x2="3.01" y1="18" y2="18"/>
            </svg>
          </button>
          <button
            className={`view-mode-btn${settings.displayMode === 'grid' ? ' active' : ''}`}
            onClick={() => saveSetting('displayMode', 'grid')}
            data-tooltip="Grid view"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" width="15" height="15"
                 aria-hidden="true">
              <rect width="7" height="7" x="3" y="3" rx="1"/>
              <rect width="7" height="7" x="14" y="3" rx="1"/>
              <rect width="7" height="7" x="14" y="14" rx="1"/>
              <rect width="7" height="7" x="3" y="14" rx="1"/>
            </svg>
          </button>
          <button
            className={`view-mode-btn${settings.displayMode === 'compact' ? ' active' : ''}`}
            onClick={() => saveSetting('displayMode', 'compact')}
            data-tooltip="Compact view"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" width="15" height="15"
                 aria-hidden="true">
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="10" y2="10"/>
              <line x1="4" x2="20" y1="14" y2="14"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
        </div>

        <button
          className="util-btn"
          onClick={toggleTheme}
          aria-label={`Theme: ${settings.theme}`}
          data-tooltip={`Theme: ${settings.theme} (T)`}
        >
          {settings.theme === 'dark' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
          )}
          {settings.theme === 'light' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2m-8.66-14 1.41 1.41M19.07 4.93l1.41 1.41M2 12h2M20 12h2m-14.07 5.07 1.41 1.41M17.66 17.66l1.41 1.41"/>
            </svg>
          )}
          {settings.theme === 'system' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="14" x="2" y="3" rx="2"/>
              <path d="M8 21h8"/><path d="M12 17v4"/>
            </svg>
          )}
        </button>

        <button
          className="util-btn"
          onClick={openKbdModal}
          aria-label="Keyboard shortcuts"
          data-tooltip="Shortcuts (?)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
          </svg>
        </button>

        <button
          className="util-btn"
          onClick={() => openSettings()}
          aria-label="Settings"
          data-tooltip="Settings (S)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        <button
          className="nav-add-btn"
          onClick={openAddBookmark}
          data-tooltip="Add bookmark (N)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               strokeLinecap="round" strokeLinejoin="round" width="14" height="14"
               aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
