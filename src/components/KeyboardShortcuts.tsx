import React from 'react';
import { useUI } from '@/context/UIContext';

const SHORTCUTS = [
  { key: '/', description: 'Focus search' },
  { key: '?', description: 'Toggle this modal' },
  { key: 'S', description: 'Open Settings' },
  { key: 'T', description: 'Cycle theme' },
  { key: 'V', description: 'Toggle view (list/grid)' },
  { key: 'D', description: 'Domain graph' },
  { key: 'R', description: 'Recently added' },
  { key: 'G', description: 'Google Apps menu' },
  { key: 'Shift + G', description: 'Google.com' },
  { key: 'Esc', description: 'Close / go back' },
];

function KeyboardShortcuts() {
  const { kbdModalOpen, closeKbdModal } = useUI();
  if (!kbdModalOpen) return null;

  return (
    <>
      <div className="kbd-overlay open" onClick={closeKbdModal} />
      <div className="kbd-modal open" role="dialog" aria-modal="true">
        <div className="kbd-modal-header">
          <h3 className="kbd-modal-title">Keyboard Shortcuts</h3>
          <button className="kbd-modal-close" onClick={closeKbdModal} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <div className="kbd-modal-body">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="kbd-row">
              <span className="kbd-desc">{s.description}</span>
              <span className="kbd-keys">
                {s.key.split(' + ').map((k, i) => (
                  <React.Fragment key={k}>
                    {i > 0 && <span className="kbd-plus"> + </span>}
                    <kbd>{k}</kbd>
                  </React.Fragment>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default KeyboardShortcuts;
