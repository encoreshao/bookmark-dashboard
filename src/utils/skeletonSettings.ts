import type { AppSettings, DisplayMode, FolderSidebarMode, NavDisplay, PinnedDisplay, Theme } from '@/types';
import { DEFAULTS } from '@/context/SettingsContext';

export type SkeletonSettings = Pick<AppSettings,
  'theme' | 'folderSidebarOpen' | 'folderSidebarMode' |
  'displayMode' | 'navDisplay' | 'pinnedDisplay'
>;

const SK_KEYS: Record<keyof SkeletonSettings, string> = {
  theme:             'bd_sk_theme',
  folderSidebarOpen: 'bd_sk_folderSidebarOpen',
  folderSidebarMode: 'bd_sk_folderSidebarMode',
  displayMode:       'bd_sk_displayMode',
  navDisplay:        'bd_sk_navDisplay',
  pinnedDisplay:     'bd_sk_pinnedDisplay',
};

export function readSkeletonSettings(): SkeletonSettings {
  const s: SkeletonSettings = {
    theme:             DEFAULTS.theme,
    folderSidebarOpen: DEFAULTS.folderSidebarOpen,
    folderSidebarMode: DEFAULTS.folderSidebarMode,
    displayMode:       DEFAULTS.displayMode,
    navDisplay:        DEFAULTS.navDisplay,
    pinnedDisplay:     DEFAULTS.pinnedDisplay,
  };
  try {
    const theme = localStorage.getItem(SK_KEYS.theme);
    if (theme) s.theme = theme as Theme;

    const open = localStorage.getItem(SK_KEYS.folderSidebarOpen);
    if (open !== null) s.folderSidebarOpen = open === 'true';

    const mode = localStorage.getItem(SK_KEYS.folderSidebarMode);
    if (mode) s.folderSidebarMode = mode as FolderSidebarMode;

    const display = localStorage.getItem(SK_KEYS.displayMode);
    if (display) s.displayMode = display as DisplayMode;

    const nav = localStorage.getItem(SK_KEYS.navDisplay);
    if (nav) s.navDisplay = nav as NavDisplay;

    const pinned = localStorage.getItem(SK_KEYS.pinnedDisplay);
    if (pinned) s.pinnedDisplay = pinned as PinnedDisplay;
  } catch { /* localStorage unavailable */ }
  return s;
}

export function writeSkeletonSettings(s: Partial<AppSettings>): void {
  try {
    if (s.theme             !== undefined) localStorage.setItem(SK_KEYS.theme,             s.theme);
    if (s.folderSidebarOpen !== undefined) localStorage.setItem(SK_KEYS.folderSidebarOpen, String(s.folderSidebarOpen));
    if (s.folderSidebarMode !== undefined) localStorage.setItem(SK_KEYS.folderSidebarMode, s.folderSidebarMode);
    if (s.displayMode       !== undefined) localStorage.setItem(SK_KEYS.displayMode,       s.displayMode);
    if (s.navDisplay        !== undefined) localStorage.setItem(SK_KEYS.navDisplay,         s.navDisplay);
    if (s.pinnedDisplay     !== undefined) localStorage.setItem(SK_KEYS.pinnedDisplay,      s.pinnedDisplay);
  } catch { /* localStorage unavailable */ }
}
