import React from 'react';
import { useUI } from '@/context/UIContext';

const SHORTCUT_GROUPS = [
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    shortcuts: [
      { key: 'N',       description: 'Add new bookmark' },
      { key: '⌘ + K',  description: 'Focus search' },
    ],
  },
  {
    id: 'views',
    label: 'Views',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    shortcuts: [
      { key: 'D', description: 'Domain graph' },
      { key: 'R', description: 'Recently added' },
      { key: 'A', description: 'AI Insights' },
      { key: 'L', description: 'Reading List' },
    ],
  },
  {
    id: 'interface',
    label: 'Interface',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
    shortcuts: [
      { key: 'S',       description: 'Settings' },
      { key: 'T',       description: 'Cycle theme' },
      { key: 'V',       description: 'Toggle view mode' },
      { key: 'G',       description: 'Google Apps menu' },
      { key: 'Shift + G', description: 'Open Google.com' },
      { key: '?',       description: 'Toggle this panel' },
      { key: 'Esc',     description: 'Close / go back' },
    ],
  },
];

function KbdKeys({ combo }: { combo: string }) {
  return (
    <span className="kbd-keys">
      {combo.split(' + ').map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 && <span className="kbd-plus">+</span>}
          <kbd>{k}</kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

function KeyboardShortcuts() {
  const { kbdModalOpen, closeKbdModal } = useUI();
  if (!kbdModalOpen) return null;

  return (
    <>
      <div className="kbd-overlay open" onClick={closeKbdModal} />
      <div className="kbd-modal open" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <div className="kbd-modal-header">
          <div className="kbd-modal-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
            </svg>
          </div>
          <h3 className="kbd-modal-title">Keyboard Shortcuts</h3>
          <button className="kbd-modal-close" onClick={closeKbdModal} aria-label="Close" data-tooltip="Close (Esc)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div className="kbd-modal-body">
          <div className="kbd-groups">
            {SHORTCUT_GROUPS.map(group => (
              <div key={group.id} className="kbd-group">
                <div className="kbd-group-label">
                  {group.icon}
                  {group.label}
                </div>
                <div className="kbd-group-rows">
                  {group.shortcuts.map(s => (
                    <div key={s.key} className="kbd-row">
                      <span className="kbd-desc">{s.description}</span>
                      <KbdKeys combo={s.key} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="kbd-ext-section">
            <div className="kbd-ext-label">Extension shortcuts</div>
            <div className="kbd-row kbd-ext-row">
              <span className="kbd-desc">AI tag current page</span>
              <a
                className="kbd-configure-link"
                href="chrome://extensions/shortcuts"
                onClick={e => { e.preventDefault(); chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }}
              >
                Configure →
              </a>
            </div>
          </div>

          <div className="kbd-modal-footer">
            <a
              className="kbd-footer-link"
              href="https://github.com/encoreshao"
              target="_blank"
              rel="noopener noreferrer"
              data-tooltip="View on GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="12" height="12" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              github.com/encoreshao
            </a>
            <span className="kbd-footer-sep" />
            <a
              className="kbd-footer-link"
              href="https://bookmark.linktr.cn"
              target="_blank"
              rel="noopener noreferrer"
              data-tooltip="Bookmark Dashboard homepage"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              bookmark.linktr.cn
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default KeyboardShortcuts;
