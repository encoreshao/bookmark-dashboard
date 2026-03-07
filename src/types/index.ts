// Chrome bookmark tree node alias
export type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

export type Theme = 'dark' | 'light' | 'system';
export type DisplayMode = 'grid' | 'list';
export type Language = 'en' | 'zh' | 'ja';
export type NavDisplay = 'full' | 'compact';
export type PinnedDisplay = 'top' | 'sidebar';
export type FolderSidebarMode = 'pinned' | 'float';
export type ActiveView = 'bookmarks' | 'domains' | 'recent' | 'ai';
export type AIProvider = 'openai' | 'gemini' | 'claude';

export interface AppSettings {
  theme: Theme;
  displayMode: DisplayMode;
  userName: string;
  backgroundImage: string;
  pinnedIds: string[];
  pinnedDisplay: PinnedDisplay;
  folderSidebarOpen: boolean;
  folderSidebarMode: FolderSidebarMode;
  language: Language;
  navDisplay: NavDisplay;
  visibleApps: string[];
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;
  aiCustomInstructions: string;
}

export interface GoogleApp {
  id: string;
  label: string;
  url: string;
  bg: string | null;
  type: 'solid' | 'google' | 'gemini';
}

export interface FolderItem {
  id: string;
  title: string;
  items: BookmarkNode[];
  children?: FolderItem[];
}

export interface DomainEntry {
  domain: string;
  bookmarks: BookmarkNode[];
  color: string;
  pct: number;
}

export interface ConfirmState {
  message: string;
  detail: string;
  resolve: (value: boolean) => void;
}

export interface ToastState {
  message: string;
  id: number;
}

export interface DomainModalState {
  domain: string;
  bookmarks: BookmarkNode[];
  color: string;
}
