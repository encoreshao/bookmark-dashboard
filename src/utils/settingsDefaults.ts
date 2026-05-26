import type { AppSettings } from '@/types';
import { DEFAULT_VISIBLE_APP_IDS } from '@/utils/googleApps';

export const DEFAULTS: AppSettings = {
  theme: 'dark',
  displayMode: 'list',
  userName: 'Guest',
  backgroundImage: '',
  pinnedIds: [],
  pinnedDisplay: 'top',
  folderSidebarOpen: true,
  folderSidebarMode: 'pinned',
  language: 'en',
  navDisplay: 'compact',
  visibleApps: DEFAULT_VISIBLE_APP_IDS,
  aiProvider: 'openai',
  aiApiKey: '',
  aiModel: 'gpt-4o-mini',
  aiCustomInstructions: '',
  aiAutoTagEnabled: true,
};
