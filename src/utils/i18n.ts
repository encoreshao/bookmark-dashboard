import type { Language } from '@/types';

type TranslationMap = Record<string, string>;
type Translations = Record<Language, TranslationMap>;

const TRANSLATIONS: Translations = {
  en: {
    'good-night': 'Good night', 'good-morning': 'Good morning',
    'good-afternoon': 'Good afternoon', 'good-evening': 'Good evening',
    'search-placeholder': 'Search bookmarks...',
    'nav-recent': 'Recent', 'nav-domains': 'Domains', 'nav-apps': 'Apps',
    'nav-theme': 'Theme', 'nav-view': 'View', 'nav-shortcuts': 'Shortcuts', 'nav-settings': 'Settings',
    'folders-header': 'Folders', 'search-folders': 'Search folders...',
    'pinned-header': 'Pinned',
    'settings-title': 'Settings',
    'tab-general': 'General', 'tab-appearance': 'Appearance', 'tab-sidebar': 'Sidebar', 'tab-account': 'Account',
    'sp-display-name': 'Display Name', 'sp-display-name-desc': 'Shown in the greeting on your new tab',
    'sp-display-mode': 'Display Mode', 'sp-language': 'Language',
    'sp-nav-display': 'Nav Display', 'sp-nav-display-desc': 'Show icon + label or icon only in the navigation bar',
    'sp-nav-full': 'Icon & Label', 'sp-nav-compact': 'Icon Only',
    'sp-google-apps': 'Google Apps', 'sp-google-apps-desc': 'Choose which apps appear in the Google Apps popup menu',
    'sp-theme': 'Theme', 'sp-bg-image': 'Background Image', 'sp-bg-image-desc': 'Pick a preset or paste your own URL',
    'sp-bg-custom-url': 'Or use a custom URL',
    'sp-folder-sidebar': 'Folder Sidebar', 'sp-folder-sidebar-desc': 'Pinned stays open and pushes content; Float overlays on click',
    'sp-pinned-display': 'Pinned Display', 'sp-pinned-display-desc': 'Where to show your pinned bookmarks',
    'sp-google-account': 'Google Account', 'sp-google-account-desc': 'Sign in to sync your pinned bookmarks across devices',
    'save-settings': 'Save Settings', 'reset-defaults': 'Reset defaults',
    'sign-in-google': 'Sign in with Google', 'sign-out': 'Sign out',
    'sync-title': 'Sync coming soon', 'sync-desc': 'Pinned bookmarks will automatically sync across your devices once signed in.',
    'domain-view-title': 'Bookmark Domains', 'domain-view-desc': 'Click any domain to explore its bookmarks',
    'domain-back': '← Back', 'domain-bookmarks': 'bookmarks', 'domain-bookmark': 'bookmark',
    'domain-search-placeholder': 'Search domains...', 'domain-modal-search': 'Search in results...',
    'recent-view-title': 'Recently Added', 'recent-view-desc': 'Your 50 most recently added bookmarks',
    'recent-back': '← Back',
    'moved': 'Bookmark moved', 'pinned': 'Pinned', 'unpinned': 'Unpinned',
    'remove-bookmark': 'Remove bookmark?', 'removed': 'Removed',
  },
  zh: {
    'good-night': '晚安', 'good-morning': '早上好', 'good-afternoon': '下午好', 'good-evening': '晚上好',
    'search-placeholder': '搜索书签...', 'nav-recent': '最近', 'nav-domains': '域名',
    'nav-apps': '应用', 'nav-theme': '主题', 'nav-view': '视图', 'nav-shortcuts': '快捷键', 'nav-settings': '设置',
    'folders-header': '文件夹', 'search-folders': '搜索文件夹...', 'pinned-header': '已固定',
    'settings-title': '设置', 'tab-general': '通用', 'tab-appearance': '外观', 'tab-sidebar': '侧栏', 'tab-account': '账户',
    'sp-display-name': '显示名称', 'sp-display-name-desc': '显示在新标签页的问候语中',
    'sp-display-mode': '显示模式', 'sp-language': '语言',
    'sp-nav-display': '导航显示', 'sp-nav-display-desc': '在导航栏中显示图标+标签或仅图标',
    'sp-nav-full': '图标 + 标签', 'sp-nav-compact': '仅图标',
    'sp-google-apps': 'Google 应用', 'sp-google-apps-desc': '选择在 Google 应用弹出菜单中显示的应用',
    'sp-theme': '主题', 'sp-bg-image': '背景图片', 'sp-bg-image-desc': '选择预设或粘贴您自己的网址',
    'sp-bg-custom-url': '或使用自定义网址', 'sp-folder-sidebar': '文件夹侧栏',
    'sp-folder-sidebar-desc': '固定模式保持展开并推移内容；浮动模式点击时叠加显示',
    'sp-pinned-display': '固定显示', 'sp-pinned-display-desc': '显示固定书签的位置',
    'sp-google-account': '谷歌账户', 'sp-google-account-desc': '登录以跨设备同步您的固定书签',
    'save-settings': '保存设置', 'reset-defaults': '重置默认',
    'sign-in-google': '使用谷歌账户登录', 'sign-out': '退出登录',
    'sync-title': '同步即将推出', 'sync-desc': '登录后，固定书签将自动跨设备同步。',
    'domain-view-title': '书签域名', 'domain-view-desc': '点击任意域名查看其书签',
    'domain-back': '← 返回', 'domain-bookmarks': '个书签', 'domain-bookmark': '个书签',
    'domain-search-placeholder': '搜索域名...', 'domain-modal-search': '在结果中搜索...',
    'recent-view-title': '最近添加', 'recent-view-desc': '最近添加的50个书签',
    'recent-back': '← 返回',
    'moved': '书签已移动', 'pinned': '已固定', 'unpinned': '已取消固定',
    'remove-bookmark': '删除书签?', 'removed': '已删除',
  },
  ja: {
    'good-night': 'おやすみなさい', 'good-morning': 'おはようございます',
    'good-afternoon': 'こんにちは', 'good-evening': 'こんばんは',
    'search-placeholder': 'ブックマークを検索...', 'nav-recent': '最近',
    'nav-domains': 'ドメイン', 'nav-apps': 'アプリ', 'nav-theme': 'テーマ',
    'nav-view': '表示', 'nav-shortcuts': 'ショートカット', 'nav-settings': '設定',
    'folders-header': 'フォルダー', 'search-folders': 'フォルダーを検索...', 'pinned-header': 'ピン留め',
    'settings-title': '設定', 'tab-general': '全般', 'tab-appearance': '外観', 'tab-sidebar': 'サイドバー', 'tab-account': 'アカウント',
    'sp-display-name': '表示名', 'sp-display-name-desc': '新しいタブの挨拶に表示されます',
    'sp-display-mode': '表示モード', 'sp-language': '言語',
    'sp-nav-display': 'ナビ表示', 'sp-nav-display-desc': 'ナビゲーションバーにアイコン+ラベルまたはアイコンのみを表示',
    'sp-nav-full': 'アイコン＋ラベル', 'sp-nav-compact': 'アイコンのみ',
    'sp-google-apps': 'Googleアプリ', 'sp-google-apps-desc': 'Googleアプリポップアップメニューに表示するアプリを選択',
    'sp-theme': 'テーマ', 'sp-bg-image': '背景画像', 'sp-bg-image-desc': 'プリセットを選ぶかURLを入力',
    'sp-bg-custom-url': 'またはカスタムURLを使用', 'sp-folder-sidebar': 'フォルダーサイドバー',
    'sp-folder-sidebar-desc': '固定モードは常に開いてコンテンツをシフト；フロートはクリック時にオーバーレイ',
    'sp-pinned-display': 'ピン表示', 'sp-pinned-display-desc': 'ピン留めしたブックマークの表示場所',
    'sp-google-account': 'Googleアカウント', 'sp-google-account-desc': 'サインインしてデバイス間でブックマークを同期',
    'save-settings': '設定を保存', 'reset-defaults': 'デフォルトにリセット',
    'sign-in-google': 'Googleでサインイン', 'sign-out': 'サインアウト',
    'sync-title': '同期機能は近日公開', 'sync-desc': 'サインイン後、ピン留めしたブックマークがデバイス間で自動的に同期されます。',
    'domain-view-title': 'ブックマークドメイン', 'domain-view-desc': 'ドメインをクリックしてブックマークを表示',
    'domain-back': '← 戻る', 'domain-bookmarks': '件', 'domain-bookmark': '件',
    'domain-search-placeholder': 'ドメインを検索...', 'domain-modal-search': '結果を検索...',
    'recent-view-title': '最近追加', 'recent-view-desc': '最近追加された50件のブックマーク',
    'recent-back': '← 戻る',
    'moved': 'ブックマークを移動しました', 'pinned': 'ピン留め', 'unpinned': 'ピン留め解除',
    'remove-bookmark': 'ブックマークを削除?', 'removed': '削除しました',
  },
};

export function createTranslator(lang: Language) {
  return (key: string): string => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  };
}

export function getGreeting(lang: Language, hour: number): string {
  const t = createTranslator(lang);
  if (hour >= 5 && hour < 12) return t('good-morning');
  if (hour >= 12 && hour < 17) return t('good-afternoon');
  if (hour >= 17 && hour < 21) return t('good-evening');
  return t('good-night');
}
