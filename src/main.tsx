import React from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsProvider } from '@/context/SettingsContext';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { UIProvider } from '@/context/UIContext';
import { TagProvider } from '@/context/TagContext';
import { ReadingListProvider } from '@/context/ReadingListContext';
import App from '@/App';
import './styles/main.css';
import './styles/tags.css';
import './styles/reading-list.css';

try {
  const mf = chrome.runtime.getManifest();
  document.title = `New Tab - ${mf.name}`;
} catch { /* dev environment */ }

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
