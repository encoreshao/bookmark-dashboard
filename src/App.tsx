import { useEffect, useCallback, useRef, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useUI } from '@/context/UIContext';
import { useBookmarks } from '@/context/BookmarkContext';
import Topbar from '@/components/Topbar';
import FolderSidebar from '@/components/FolderSidebar';
import PinnedSidebar from '@/components/PinnedSidebar';
import BookmarkView from '@/components/BookmarkView';
import DomainView from '@/components/DomainView';
import RecentView from '@/components/RecentView';
import SettingsPanel from '@/components/SettingsPanel';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import DomainModal from '@/components/DomainModal';
import Hero from '@/components/Hero';
import SearchSection from '@/components/SearchSection';
import AIInsightsView from '@/components/AIInsightsView';
import ReadingListView from '@/components/ReadingListView';
import Footer from '@/components/Footer';

function App() {
  const { settings, isLoaded, saveSetting } = useSettings();
  const {
    activeView, setActiveView,
    settingsPanelOpen, openSettings, closeSettings,
    kbdModalOpen, openKbdModal, closeKbdModal,
    searchQuery, setSearchQuery,
    confirmState, resolveConfirm,
    domainModal, closeDomainModal,
  } = useUI();
  const { loadBookmarks } = useBookmarks();
  const googleAppsMenuRef = useRef<HTMLDivElement>(null);
  const [googleAppsOpen, setGoogleAppsOpen] = useState(false);

  const isTyping = () => {
    const el = document.activeElement as HTMLElement | null;
    return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (confirmState.open) { resolveConfirm(false); return; }
      if (kbdModalOpen) { closeKbdModal(); return; }
      if (settingsPanelOpen) { closeSettings(); return; }
      if (googleAppsOpen) { setGoogleAppsOpen(false); return; }
      if (domainModal) { closeDomainModal(); return; }
      if (activeView !== 'bookmarks') { setActiveView('bookmarks'); return; }
      setSearchQuery('');
      return;
    }

    if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
      return;
    }
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      kbdModalOpen ? closeKbdModal() : openKbdModal();
      return;
    }

    if (isTyping()) return;

    if (e.key.toLowerCase() === 'g') {
      e.preventDefault();
      if (e.shiftKey) window.open('https://www.google.com/', '_blank');
      else setGoogleAppsOpen(prev => !prev);
      return;
    }

    switch (e.key.toLowerCase()) {
      case 't': {
        e.preventDefault();
        const cycle = { dark: 'light', light: 'system', system: 'dark' } as const;
        saveSetting('theme', cycle[settings.theme] ?? 'dark');
        break;
      }
      case 'v': {
        e.preventDefault();
        saveSetting('displayMode', settings.displayMode === 'grid' ? 'list' : 'grid');
        break;
      }
      case 's': e.preventDefault(); settingsPanelOpen ? closeSettings() : openSettings(); break;
      case 'd': e.preventDefault(); setActiveView(activeView === 'domains' ? 'bookmarks' : 'domains'); break;
      case 'r': e.preventDefault(); setActiveView(activeView === 'recent' ? 'bookmarks' : 'recent'); break;
      case 'a': e.preventDefault(); setActiveView(activeView === 'ai' ? 'bookmarks' : 'ai'); break;
      case 'l': e.preventDefault(); setActiveView(activeView === 'reading' ? 'bookmarks' : 'reading'); break;
    }
  }, [activeView, confirmState, kbdModalOpen, settingsPanelOpen, googleAppsOpen, domainModal,
      settings.theme, settings.displayMode, saveSetting,
      resolveConfirm, closeKbdModal, openKbdModal, closeSettings, openSettings,
      setActiveView, setSearchQuery, setGoogleAppsOpen, closeDomainModal]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isLoaded) return;
    chrome.storage.local.get('bd_pendingSettingsTab', (result) => {
      const tab = result.bd_pendingSettingsTab as string | undefined;
      if (tab) {
        chrome.storage.local.remove('bd_pendingSettingsTab');
        openSettings(tab);
      }
    });
  }, [isLoaded, openSettings]);

  const showHeroSearch = activeView === 'bookmarks';

  if (!isLoaded) return null;

  return (
    <>
      <Topbar
        googleAppsOpen={googleAppsOpen}
        setGoogleAppsOpen={setGoogleAppsOpen}
        googleAppsMenuRef={googleAppsMenuRef}
      />
      <FolderSidebar />
      <PinnedSidebar />

      <main className="main-content">
        {showHeroSearch && (
          <>
            <Hero />
            <SearchSection value={searchQuery} onChange={setSearchQuery} />
          </>
        )}

        {activeView === 'bookmarks' && <BookmarkView searchQuery={searchQuery} />}
        {activeView === 'domains' && (
          <DomainView onBack={() => { setActiveView('bookmarks'); loadBookmarks(); }} />
        )}
        {activeView === 'recent' && (
          <RecentView onBack={() => setActiveView('bookmarks')} />
        )}
        {activeView === 'ai' && (
          <AIInsightsView onBack={() => setActiveView('bookmarks')} />
        )}
        {activeView === 'reading' && (
          <ReadingListView onBack={() => setActiveView('bookmarks')} />
        )}
      </main>

      <Footer />

      <SettingsPanel />
      <KeyboardShortcuts />
      <ConfirmDialog />
      <Toast />
      {domainModal && <DomainModal />}
    </>
  );
}

export default App;
