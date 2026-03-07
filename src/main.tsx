import React from 'react';
import { createRoot } from 'react-dom/client';
import { SettingsProvider } from '@/context/SettingsContext';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { UIProvider } from '@/context/UIContext';
import App from '@/App';
import './styles/main.css';

const root = document.getElementById('root')!;
createRoot(root).render(
  <React.StrictMode>
    <SettingsProvider>
      <BookmarkProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </BookmarkProvider>
    </SettingsProvider>
  </React.StrictMode>
);
