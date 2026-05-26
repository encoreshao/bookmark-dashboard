import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AppSettings, Theme, DisplayMode, Language, NavDisplay, PinnedDisplay, FolderSidebarMode, AIProvider } from '@/types';
import { ALL_APP_IDS } from '@/utils/googleApps';
import { writeSkeletonSettings } from '@/utils/skeletonSettings';
import { DEFAULTS } from '@/utils/settingsDefaults';

const STORAGE_KEYS: Record<keyof AppSettings, string> = {
  theme: 'bd_theme',
  displayMode: 'bd_displayMode',
  userName: 'bd_userName',
  backgroundImage: 'bd_backgroundImage',
  pinnedIds: 'bd_pinnedIds',
  pinnedDisplay: 'bd_pinnedDisplay',
  folderSidebarOpen: 'bd_folderSidebarOpen',
  folderSidebarMode: 'bd_folderSidebarMode',
  language: 'bd_language',
  navDisplay: 'bd_navDisplay',
  visibleApps: 'bd_visibleApps',
  aiProvider: 'bd_aiProvider',
  aiApiKey: 'bd_aiApiKey',
  aiModel: 'bd_aiModel',
  aiCustomInstructions: 'bd_aiCustomInstructions',
  aiAutoTagEnabled: 'bd_aiAutoTagEnabled',
};

interface SettingsContextValue {
  settings: AppSettings;
  isLoaded: boolean;
  saveSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  saveSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function getEffectiveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from chrome.storage on mount
  useEffect(() => {
    const keys = Object.values(STORAGE_KEYS);
    chrome.storage.local.get(keys, (result) => {
      const loaded: AppSettings = { ...DEFAULTS };
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS) as [keyof AppSettings, string][]) {
        const val = result[storageKey];
        if (val !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (loaded as any)[key] = val;
        }
      }
      // Ensure arrays
      if (!Array.isArray(loaded.pinnedIds)) loaded.pinnedIds = [];
      if (!Array.isArray(loaded.visibleApps)) loaded.visibleApps = ALL_APP_IDS.slice();
      setSettings(loaded);
      setIsLoaded(true);
    });

    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSettings(s => ({ ...s })); // force re-render
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply body classes whenever settings change
  useEffect(() => {
    if (!isLoaded) return;
    const effective = getEffectiveTheme(settings.theme);
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${effective}`);
    document.body.classList.toggle('nav-compact', settings.navDisplay === 'compact');
    document.body.classList.toggle('sidebar-mode-pinned', settings.folderSidebarMode === 'pinned');
    document.body.classList.toggle('has-bg-image', !!settings.backgroundImage);
    if (settings.backgroundImage) {
      document.body.style.setProperty('--bg-image', `url(${settings.backgroundImage})`);
    } else {
      document.body.style.removeProperty('--bg-image');
    }
  }, [settings, isLoaded]);

  const saveSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const storageKey = STORAGE_KEYS[key];
    chrome.storage.local.set({ [storageKey]: value });
    writeSkeletonSettings({ [key]: value } as Partial<AppSettings>);
    setSettings(s => ({ ...s, [key]: value }));
  }, []);

  const saveSettings = useCallback((partial: Partial<AppSettings>) => {
    const toStore: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(partial) as [keyof AppSettings, unknown][]) {
      toStore[STORAGE_KEYS[key]] = value;
    }
    chrome.storage.local.set(toStore);
    writeSkeletonSettings(partial);
    setSettings(s => ({ ...s, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    saveSettings({ ...DEFAULTS, pinnedIds: settings.pinnedIds }); // preserve pins
  }, [settings.pinnedIds, saveSettings]);

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, saveSetting, saveSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export { getEffectiveTheme, DEFAULTS };
export type { Theme, DisplayMode, Language, NavDisplay, PinnedDisplay, FolderSidebarMode, AIProvider };
