import { useEffect } from 'react';
import { useUI } from '@/context/UIContext';

function ConfirmDialog() {
  const { confirmState, resolveConfirm } = useUI();

  useEffect(() => {
    if (!confirmState.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveConfirm(false);
      if (e.key === 'Enter') resolveConfirm(true);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [confirmState, resolveConfirm]);

  if (!confirmState.open) return null;

  return (
    <>
      <div className="confirm-overlay open" onClick={() => resolveConfirm(false)} />
      <div className="confirm-dialog open" role="alertdialog" aria-modal="true">
        <div className="confirm-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </div>
        <p className="confirm-title">{confirmState.message}</p>
        {confirmState.detail && (
          <p className="confirm-message">{confirmState.detail}</p>
        )}
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={() => resolveConfirm(false)}>
            Cancel
          </button>
          <button className="confirm-btn confirm-btn-danger" onClick={() => resolveConfirm(true)}>
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmDialog;
