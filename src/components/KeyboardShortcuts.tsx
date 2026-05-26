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
          <button className="kbd-modal-close" onClick={closeKbdModal} title="Close">
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
        </div>
      </div>
    </>
  );
}

export default KeyboardShortcuts;
