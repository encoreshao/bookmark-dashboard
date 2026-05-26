import type { AppSettings, DisplayMode, FolderSidebarMode, NavDisplay, PinnedDisplay, Theme } from '@/types';
import { DEFAULTS } from '@/utils/settingsDefaults';

export type SkeletonSettings = Pick<AppSettings,
  'theme' | 'folderSidebarOpen' | 'folderSidebarMode' |
  'displayMode' | 'pinnedDisplay' | 'navDisplay'
>;

const SK_KEYS: Record<keyof SkeletonSettings, string> = {
  theme:             'bd_sk_theme',
  folderSidebarOpen: 'bd_sk_folderSidebarOpen',
  folderSidebarMode: 'bd_sk_folderSidebarMode',
  displayMode:       'bd_sk_displayMode',
  pinnedDisplay:     'bd_sk_pinnedDisplay',
  navDisplay:        'bd_sk_navDisplay',
};

const VALID_THEMES = new Set(['dark', 'light', 'system']);
const VALID_DISPLAY_MODES = new Set(['grid', 'list', 'compact']);
const VALID_SIDEBAR_MODES = new Set(['pinned', 'float']);
const VALID_NAV_DISPLAYS = new Set(['compact', 'full']);
const VALID_PINNED_DISPLAYS = new Set(['top', 'sidebar']);

export function readSkeletonSettings(): SkeletonSettings {
  const s: SkeletonSettings = {
    theme:             DEFAULTS.theme,
    folderSidebarOpen: DEFAULTS.folderSidebarOpen,
    folderSidebarMode: DEFAULTS.folderSidebarMode,
    displayMode:       DEFAULTS.displayMode,
    pinnedDisplay:     DEFAULTS.pinnedDisplay,
    navDisplay:        DEFAULTS.navDisplay,
  };
  try {
    const theme = localStorage.getItem(SK_KEYS.theme);
    if (theme !== null && VALID_THEMES.has(theme)) s.theme = theme as Theme;

    const open = localStorage.getItem(SK_KEYS.folderSidebarOpen);
    if (open !== null) s.folderSidebarOpen = open === 'true';

    const mode = localStorage.getItem(SK_KEYS.folderSidebarMode);
    if (mode !== null && VALID_SIDEBAR_MODES.has(mode)) s.folderSidebarMode = mode as FolderSidebarMode;

    const display = localStorage.getItem(SK_KEYS.displayMode);
    if (display !== null && VALID_DISPLAY_MODES.has(display)) s.displayMode = display as DisplayMode;

    const nav = localStorage.getItem(SK_KEYS.navDisplay);
    if (nav !== null && VALID_NAV_DISPLAYS.has(nav)) s.navDisplay = nav as NavDisplay;

    const pinned = localStorage.getItem(SK_KEYS.pinnedDisplay);
    if (pinned !== null && VALID_PINNED_DISPLAYS.has(pinned)) s.pinnedDisplay = pinned as PinnedDisplay;
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
