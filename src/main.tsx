import React from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsProvider } from '@/context/SettingsContext';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { UIProvider } from '@/context/UIContext';
import { TagProvider } from '@/context/TagContext';
import { ReadingListProvider } from '@/context/ReadingListContext';
import { readSkeletonSettings } from '@/utils/skeletonSettings';
import App from '@/App';
import './styles/main.css';
import './styles/tags.css';
import './styles/reading-list.css';

try {
  const mf = chrome.runtime.getManifest();
  document.title = `New Tab - ${mf.name}`;
} catch { /* dev environment */ }

// Sync body classes from localStorage cache so first paint matches user settings
const _sk = readSkeletonSettings();
const _effective = _sk.theme === 'system'
  ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  : _sk.theme;
document.body.classList.remove('theme-dark', 'theme-light');
document.body.classList.add(`theme-${_effective}`);
document.body.classList.toggle('sidebar-mode-pinned', _sk.folderSidebarMode === 'pinned');
document.body.classList.toggle('nav-compact', _sk.navDisplay === 'compact');

const root = document.getElementById('root')!;
createRoot(root).render(
  <React.StrictMode>
    <SettingsProvider>
      <BookmarkProvider>
        <UIProvider>
          <TagProvider>
            <ReadingListProvider>
              <App />
            </ReadingListProvider>
          </TagProvider>
        </UIProvider>
      </BookmarkProvider>
    </SettingsProvider>
  </React.StrictMode>
);
