import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ActiveView, ConfirmState, ToastState, DomainModalState, BookmarkNode } from '@/types';

interface UIContextValue {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  settingsPanelOpen: boolean;
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  activeSettingsTab: string;
  setActiveSettingsTab: (tab: string) => void;
  kbdModalOpen: boolean;
  openKbdModal: () => void;
  closeKbdModal: () => void;
  addBookmarkOpen: boolean;
  openAddBookmark: () => void;
  closeAddBookmark: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  confirm: (message: string, detail?: string) => Promise<boolean>;
  confirmState: (ConfirmState & { open: true }) | { open: false };
  resolveConfirm: (value: boolean) => void;
  toasts: ToastState[];
  showToast: (message: string) => void;
  domainModal: DomainModalState | null;
  openDomainModal: (domain: string, bookmarks: BookmarkNode[], color: string) => void;
  closeDomainModal: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<ActiveView>('bookmarks');
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [kbdModalOpen, setKbdModalOpen] = useState(false);
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmState, setConfirmState] = useState<(ConfirmState & { open: true }) | { open: false }>({ open: false });
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [domainModal, setDomainModal] = useState<DomainModalState | null>(null);
  const toastIdRef = useRef(0);

  const openSettings = useCallback((tab = 'general') => {
    setActiveSettingsTab(tab);
    setSettingsPanelOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsPanelOpen(false);
    document.body.style.overflow = '';
  }, []);

  const openKbdModal = useCallback(() => setKbdModalOpen(true), []);
  const closeKbdModal = useCallback(() => setKbdModalOpen(false), []);
  const openAddBookmark = useCallback(() => setAddBookmarkOpen(true), []);
  const closeAddBookmark = useCallback(() => setAddBookmarkOpen(false), []);

  const confirm = useCallback((message: string, detail = ''): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, message, detail, resolve });
    });
  }, []);

  const resolveConfirm = useCallback((value: boolean) => {
    if (confirmState.open) {
      confirmState.resolve(value);
      setConfirmState({ open: false });
    }
  }, [confirmState]);

  const showToast = useCallback((message: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { message, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  }, []);

  const openDomainModal = useCallback((domain: string, bookmarks: BookmarkNode[], color: string) => {
    setDomainModal({ domain, bookmarks, color });
    document.body.style.overflow = 'hidden';
  }, []);

  const closeDomainModal = useCallback(() => {
    setDomainModal(null);
    document.body.style.overflow = '';
  }, []);

  return (
    <UIContext.Provider value={{
      activeView, setActiveView,
      settingsPanelOpen, openSettings, closeSettings,
      activeSettingsTab, setActiveSettingsTab,
      kbdModalOpen, openKbdModal, closeKbdModal,
      addBookmarkOpen, openAddBookmark, closeAddBookmark,
      searchQuery, setSearchQuery,
      confirm, confirmState, resolveConfirm,
      toasts, showToast,
      domainModal, openDomainModal, closeDomainModal,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
