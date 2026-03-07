/* ========================================
   Bookmark Dashboard - Main Application
   Vanilla JS, no dependencies
   ======================================== */

(function () {
  'use strict';

  /* ---------- Settings ---------- */
  /* ---------- Google Apps Catalogue ---------- */
  const GOOGLE_APPS = [
    { id: 'gmail',       label: 'Gmail',       url: 'https://mail.google.com/',              bg: '#EA4335', type: 'solid' },
    { id: 'calendar',    label: 'Calendar',    url: 'https://calendar.google.com/',          bg: '#1A73E8', type: 'solid' },
    { id: 'drive',       label: 'Drive',       url: 'https://drive.google.com/',             bg: '#2196F3', type: 'solid' },
    { id: 'docs',        label: 'Docs',        url: 'https://docs.google.com/',              bg: '#4285F4', type: 'solid' },
    { id: 'sheets',      label: 'Sheets',      url: 'https://sheets.google.com/',            bg: '#0F9D58', type: 'solid' },
    { id: 'slides',      label: 'Slides',      url: 'https://slides.google.com/',            bg: '#F4B400', type: 'solid' },
    { id: 'meet',        label: 'Meet',        url: 'https://meet.google.com/',              bg: '#00897B', type: 'solid' },
    { id: 'keep',        label: 'Keep',        url: 'https://keep.google.com/',              bg: '#FBBC04', type: 'solid' },
    { id: 'ai-search',   label: 'AI Search',   url: 'https://www.google.com/search?udm=50', bg: null,      type: 'google' },
    { id: 'gemini',      label: 'Gemini',      url: 'https://gemini.google.com/',            bg: null,      type: 'gemini' },
    { id: 'notebooklm',  label: 'NotebookLM',  url: 'https://notebooklm.google.com/',       bg: '#5F6368', type: 'solid' },
    { id: 'youtube',     label: 'YouTube',     url: 'https://www.youtube.com/',              bg: '#FF0000', type: 'solid' },
  ];

  const ALL_APP_IDS = GOOGLE_APPS.map(a => a.id);

  /* ---------- Settings ---------- */
  const DEFAULTS = {
    theme: 'dark',
    displayMode: 'list',
    userName: 'Guest',
    backgroundImage: '',
    pinnedIds: [],
    pinnedDisplay: 'top',
    folderSidebarMode: 'pinned',
    language: 'en',
    navDisplay: 'compact',
    visibleApps: ALL_APP_IDS,
  };

  const STORAGE_KEYS = {
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
  };

  /* ---------- Translations ---------- */
  const TRANSLATIONS = {
    en: {
      // Greetings
      'good-night': 'Good night', 'good-morning': 'Good morning',
      'good-afternoon': 'Good afternoon', 'good-evening': 'Good evening',
      // Nav
      'search-placeholder': 'Search bookmarks...',
      'nav-domains': 'Domains', 'nav-apps': 'Apps', 'nav-theme': 'Theme',
      'nav-view': 'View', 'nav-shortcuts': 'Shortcuts', 'nav-settings': 'Settings',
      // Sidebar
      'folders-header': 'Folders', 'search-folders': 'Search folders...',
      'pinned-header': 'Pinned',
      // Settings panel
      'settings-title': 'Settings',
      'tab-general': 'General', 'tab-appearance': 'Appearance',
      'tab-sidebar': 'Sidebar', 'tab-account': 'Account',
      'sp-display-name': 'Display Name',
      'sp-display-name-desc': 'Shown in the greeting on your new tab',
      'sp-display-mode': 'Display Mode',
      'sp-language': 'Language',
      'sp-nav-display': 'Nav Display',
      'sp-nav-display-desc': 'Show icon + label or icon only in the navigation bar',
      'sp-nav-full': 'Icon & Label', 'sp-nav-compact': 'Icon Only',
      'sp-theme': 'Theme',
      'sp-bg-image': 'Background Image',
      'sp-bg-image-desc': 'Pick a preset or paste your own URL',
      'sp-bg-custom-url': 'Or use a custom URL',
      'sp-folder-sidebar': 'Folder Sidebar',
      'sp-folder-sidebar-desc': 'Pinned stays open and pushes content; Float overlays on click',
      'sp-pinned-display': 'Pinned Display',
      'sp-pinned-display-desc': 'Where to show your pinned bookmarks',
      'sp-google-account': 'Google Account',
      'sp-google-account-desc': 'Sign in to sync your pinned bookmarks across devices',
      'save-settings': 'Save Settings', 'reset-defaults': 'Reset defaults',
      'sign-in-google': 'Sign in with Google', 'sign-out': 'Sign out',
      'sync-title': 'Sync coming soon',
      'sync-desc': 'Pinned bookmarks will automatically sync across your devices once signed in.',
      // Domain view
      'domain-view-title': 'Bookmark Domains',
      'domain-view-desc': 'Click any domain to explore its bookmarks',
      'domain-back': '← Back', 'domain-bookmarks': 'bookmarks', 'domain-bookmark': 'bookmark',
      'domain-search-placeholder': 'Search domains...',
      'domain-modal-search': 'Search in results...',
      // Drag & drop
      'moved': 'Bookmark moved',
      // Recently Added
      'nav-recent': 'Recent',
      'recent-view-title': 'Recently Added',
      'recent-view-desc': 'Your most recently bookmarked pages',
      'recent-back': '← Back',
    },
    zh: {
      'good-night': '晚安', 'good-morning': '早上好',
      'good-afternoon': '下午好', 'good-evening': '晚上好',
      'search-placeholder': '搜索书签...',
      'nav-domains': '域名', 'nav-apps': '应用', 'nav-theme': '主题',
      'nav-view': '视图', 'nav-shortcuts': '快捷键', 'nav-settings': '设置',
      'folders-header': '文件夹', 'search-folders': '搜索文件夹...',
      'pinned-header': '已固定',
      'settings-title': '设置',
      'tab-general': '通用', 'tab-appearance': '外观',
      'tab-sidebar': '侧栏', 'tab-account': '账户',
      'sp-display-name': '显示名称', 'sp-display-name-desc': '显示在新标签页的问候语中',
      'sp-display-mode': '显示模式', 'sp-language': '语言',
      'sp-nav-display': '导航显示',
      'sp-nav-display-desc': '在导航栏中显示图标+标签或仅图标',
      'sp-nav-full': '图标 + 标签', 'sp-nav-compact': '仅图标',
      'sp-theme': '主题',
      'sp-bg-image': '背景图片', 'sp-bg-image-desc': '选择预设或粘贴您自己的网址',
      'sp-bg-custom-url': '或使用自定义网址',
      'sp-folder-sidebar': '文件夹侧栏',
      'sp-folder-sidebar-desc': '固定模式保持展开并推移内容；浮动模式点击时叠加显示',
      'sp-pinned-display': '固定显示', 'sp-pinned-display-desc': '显示固定书签的位置',
      'sp-google-account': '谷歌账户', 'sp-google-account-desc': '登录以跨设备同步您的固定书签',
      'save-settings': '保存设置', 'reset-defaults': '重置默认',
      'sign-in-google': '使用谷歌账户登录', 'sign-out': '退出登录',
      'sync-title': '同步即将推出', 'sync-desc': '登录后，固定书签将自动跨设备同步。',
      'domain-view-title': '书签域名', 'domain-view-desc': '点击任意域名查看其书签',
      'domain-back': '← 返回', 'domain-bookmarks': '个书签', 'domain-bookmark': '个书签',
      'domain-search-placeholder': '搜索域名...', 'domain-modal-search': '在结果中搜索...',
      'moved': '书签已移动',
      'nav-recent': '最近', 'recent-view-title': '最近添加',
      'recent-view-desc': '您最近收藏的页面', 'recent-back': '← 返回',
    },
    ja: {
      'good-night': 'おやすみなさい', 'good-morning': 'おはようございます',
      'good-afternoon': 'こんにちは', 'good-evening': 'こんばんは',
      'search-placeholder': 'ブックマークを検索...',
      'nav-domains': 'ドメイン', 'nav-apps': 'アプリ', 'nav-theme': 'テーマ',
      'nav-view': '表示', 'nav-shortcuts': 'ショートカット', 'nav-settings': '設定',
      'folders-header': 'フォルダー', 'search-folders': 'フォルダーを検索...',
      'pinned-header': 'ピン留め',
      'settings-title': '設定',
      'tab-general': '全般', 'tab-appearance': '外観',
      'tab-sidebar': 'サイドバー', 'tab-account': 'アカウント',
      'sp-display-name': '表示名', 'sp-display-name-desc': '新しいタブの挨拶に表示されます',
      'sp-display-mode': '表示モード', 'sp-language': '言語',
      'sp-nav-display': 'ナビ表示',
      'sp-nav-display-desc': 'ナビゲーションバーにアイコン+ラベルまたはアイコンのみを表示',
      'sp-nav-full': 'アイコン＋ラベル', 'sp-nav-compact': 'アイコンのみ',
      'sp-theme': 'テーマ',
      'sp-bg-image': '背景画像', 'sp-bg-image-desc': 'プリセットを選ぶかURLを入力',
      'sp-bg-custom-url': 'またはカスタムURLを使用',
      'sp-folder-sidebar': 'フォルダーサイドバー',
      'sp-folder-sidebar-desc': '固定モードは常に開いてコンテンツをシフト；フロートはクリック時にオーバーレイ',
      'sp-pinned-display': 'ピン表示', 'sp-pinned-display-desc': 'ピン留めしたブックマークの表示場所',
      'sp-google-account': 'Googleアカウント',
      'sp-google-account-desc': 'サインインしてデバイス間でブックマークを同期',
      'save-settings': '設定を保存', 'reset-defaults': 'デフォルトにリセット',
      'sign-in-google': 'Googleでサインイン', 'sign-out': 'サインアウト',
      'sync-title': '同期機能は近日公開',
      'sync-desc': 'サインイン後、ピン留めしたブックマークがデバイス間で自動的に同期されます。',
      'domain-view-title': 'ブックマークドメイン',
      'domain-view-desc': 'ドメインをクリックしてブックマークを表示',
      'domain-back': '← 戻る', 'domain-bookmarks': '件', 'domain-bookmark': '件',
      'domain-search-placeholder': 'ドメインを検索...', 'domain-modal-search': '結果を検索...',
      'moved': 'ブックマークを移動しました',
      'nav-recent': '最近', 'recent-view-title': '最近追加',
      'recent-view-desc': '最近ブックマークしたページ', 'recent-back': '← 戻る',
    }
  };

  function t(key) {
    const lang = settings.language || 'en';
    return (TRANSLATIONS[lang] || TRANSLATIONS.en)[key] || (TRANSLATIONS.en[key] || key);
  }

  /* Helper: find the trailing text node of an element (after any SVG) */
  function setTextNode(el, text) {
    if (!el) return;
    for (let i = el.childNodes.length - 1; i >= 0; i--) {
      const node = el.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = text;
        return;
      }
    }
    el.appendChild(document.createTextNode(text));
  }

  function applyLanguage() {
    // data-i18n elements (nav spans, domain view, etc.)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = t(el.dataset.i18n);
      if (val) el.textContent = val;
    });

    // Placeholders
    if (searchInput) searchInput.placeholder = t('search-placeholder');
    const fsSearch = $('#folder-sidebar-search');
    if (fsSearch) fsSearch.placeholder = t('search-folders');

    // Sidebar headers
    const fsHeader = document.querySelector('.folder-sidebar-header span');
    if (fsHeader) fsHeader.textContent = t('folders-header');
    const psHeader = document.querySelector('.pinned-sidebar-header span');
    if (psHeader) psHeader.textContent = t('pinned-header');

    // Settings panel title
    const spH2 = document.querySelector('.settings-panel-title-row h2');
    if (spH2) spH2.textContent = t('settings-title');

    // Settings tabs (text node after SVG)
    [['general','tab-general'],['appearance','tab-appearance'],
     ['sidebar','tab-sidebar'],['account','tab-account']].forEach(([tab, key]) => {
      const btn = $(`.settings-tab[data-tab="${tab}"]`);
      if (btn) setTextNode(btn, ' ' + t(key));
    });

    // Settings sp-labels and sp-descs (update by position within each group)
    const settingsLabelMap = [
      ['#sp-input-name', 'sp-display-name', 'sp-display-name-desc'],
    ];
    // Labels with known IDs on their input
    [
      { input: '#sp-input-name',  label: 'sp-display-name', desc: 'sp-display-name-desc' },
      { input: '#sp-input-bg',    label: 'sp-bg-image',      desc: 'sp-bg-image-desc' },
    ].forEach(({ input, label, desc }) => {
      const inp = $(input);
      if (!inp) return;
      const group = inp.closest('.sp-group');
      if (!group) return;
      const lbl = group.querySelector('.sp-label');
      if (lbl) setTextNode(lbl, ' ' + t(label));
      const d = group.querySelector('.sp-desc');
      if (d) d.textContent = t(desc);
      const lsm = group.querySelector('.sp-label-sm');
      if (lsm) lsm.textContent = t('sp-bg-custom-url');
    });

    // Settings labels by data-setting on toggle groups
    [
      { setting: 'displayMode',      label: 'sp-display-mode' },
      { setting: 'language',         label: 'sp-language' },
      { setting: 'navDisplay',       label: 'sp-nav-display',       desc: 'sp-nav-display-desc' },
      { setting: 'theme',            label: 'sp-theme' },
      { setting: 'folderSidebarMode',label: 'sp-folder-sidebar',    desc: 'sp-folder-sidebar-desc' },
      { setting: 'pinnedDisplay',    label: 'sp-pinned-display',    desc: 'sp-pinned-display-desc' },
    ].forEach(({ setting, label, desc }) => {
      const toggle = $(`.sp-toggle[data-setting="${setting}"]`);
      if (!toggle) return;
      const group = toggle.closest('.sp-group');
      if (!group) return;
      const lbl = group.querySelector('.sp-label');
      if (lbl) setTextNode(lbl, ' ' + t(label));
      if (desc) {
        const d = group.querySelector('.sp-desc');
        if (d) d.textContent = t(desc);
      }
    });

    // Nav display toggle button labels
    const navFull    = $('.sp-toggle[data-setting="navDisplay"][data-value="full"]');
    const navCompact = $('.sp-toggle[data-setting="navDisplay"][data-value="compact"]');
    if (navFull)    setTextNode(navFull,    ' ' + t('sp-nav-full'));
    if (navCompact) setTextNode(navCompact, ' ' + t('sp-nav-compact'));

    // Google Account label + desc
    const accountToggle = $('#sp-btn-google-signin');
    if (accountToggle) {
      const group = accountToggle.closest('.sp-group');
      if (group) {
        const lbl = group.querySelector('.sp-label');
        if (lbl) setTextNode(lbl, ' ' + t('sp-google-account'));
        const d = group.querySelector('.sp-desc');
        if (d) d.textContent = t('sp-google-account-desc');
      }
      setTextNode(accountToggle, ' ' + t('sign-in-google'));
    }

    // Sign out
    const signoutBtn = $('#sp-btn-google-signout');
    if (signoutBtn) signoutBtn.textContent = t('sign-out');

    // Coming soon
    const csTitleEl = document.querySelector('.sp-coming-soon strong');
    if (csTitleEl) csTitleEl.textContent = t('sync-title');
    const csDescEl = document.querySelector('.sp-coming-soon p');
    if (csDescEl) csDescEl.textContent = t('sync-desc');

    // Save / Reset buttons
    const saveBtn = $('#sp-btn-save');
    if (saveBtn) setTextNode(saveBtn, ' ' + t('save-settings'));
    const resetBtn = $('#sp-btn-reset');
    if (resetBtn) resetBtn.textContent = t('reset-defaults');
  }

  /* ---------- Nav Display ---------- */
  function applyNavDisplay() {
    const isCompact = (settings.navDisplay || 'compact') === 'compact';
    body.classList.toggle('nav-compact', isCompact);
  }

  /* ---------- DOM Refs ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const body = document.body;
  const greetingEl = $('#greeting');
  const clockTimeEl = $('#clock-time');
  const clockDateEl = $('#clock-date');
  const clockEl = $('#clock');
  const searchInput = $('#search-input');
  const searchCount = $('#search-count');
  const bookmarksContainer = $('#bookmarks');
  const backToTopBtn = $('#back-to-top');
  const btnTheme = $('#btn-theme');
  const btnView = $('#btn-view');
  const linkSettings = $('#link-settings');
  const iconThemeDark = $('#icon-theme-dark');
  const iconThemeLight = $('#icon-theme-light');
  const iconViewGrid = $('#icon-view-grid');
  const iconViewList = $('#icon-view-list');

  /* Folder sidebar refs */
  const folderSidebar = $('#folder-sidebar');
  const folderSidebarTrigger = $('#folder-sidebar-trigger');
  const folderSidebarList = $('#folder-sidebar-list');
  const folderSidebarSearch = $('#folder-sidebar-search');

  /* Pinned sidebar refs */
  const pinnedSidebar = $('#pinned-sidebar');
  const pinnedSidebarTrigger = $('#pinned-sidebar-trigger');
  const pinnedSidebarList = $('#pinned-sidebar-list');

  /* Settings panel refs */
  const settingsOverlay = $('#settings-overlay');
  const settingsPanel = $('#settings-panel');
  const settingsClose = $('#settings-close');
  const spNameInput = $('#sp-input-name');
  const spBgInput = $('#sp-input-bg');
  const spBgPreview = $('#sp-bg-preview');
  const spBgPreviewImg = $('#sp-bg-preview-img');
  const spBtnClearBg = $('#sp-btn-clear-bg');
  const spBtnReset = $('#sp-btn-reset');
  const spToggles = $$('.sp-toggle');
  const toast = $('#toast');

  /* ---------- State ---------- */
  let settings = { ...DEFAULTS };
  let allBookmarks = [];

  /* ---------- Storage Helpers (chrome.storage.local) ---------- */
  function loadSettings() {
    return new Promise((resolve) => {
      const keys = Object.values(STORAGE_KEYS);
      chrome.storage.local.get(keys, (result) => {
        for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
          if (result[storageKey] !== undefined) {
            settings[key] = key === 'pinnedIds'
              ? (Array.isArray(result[storageKey]) ? result[storageKey] : [])
              : result[storageKey];
          }
        }
        resolve();
      });
    });
  }

  function saveSetting(key, value) {
    settings[key] = value;
    chrome.storage.local.set({
      [STORAGE_KEYS[key]]: (key === 'pinnedIds' || key === 'pinnedDisplay') ? value : String(value)
    });
  }

  function findBookmarkById(nodes, id) {
    if (!nodes) return null;
    const targetId = String(id);
    for (const node of nodes) {
      if (String(node.id) === targetId) return node;
      if (node.children) {
        const found = findBookmarkById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /* ---------- Theme ---------- */
  const iconThemeSystem = $('#icon-theme-system');

  function getEffectiveTheme() {
    if (settings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme || 'dark';
  }

  function applyTheme() {
    const effective = getEffectiveTheme();
    body.classList.remove('theme-dark', 'theme-light');
    body.classList.add(`theme-${effective}`);

    const isSystem = settings.theme === 'system';
    const isDark = settings.theme === 'dark';
    iconThemeDark.classList.toggle('hidden', !isDark);
    iconThemeLight.classList.toggle('hidden', isDark || isSystem);
    if (iconThemeSystem) iconThemeSystem.classList.toggle('hidden', !isSystem);
  }

  function toggleTheme() {
    const cycle = { dark: 'light', light: 'system', system: 'dark' };
    const newTheme = cycle[settings.theme] || 'dark';
    saveSetting('theme', newTheme);
    applyTheme();
  }

  // Track system preference changes when theme is set to 'system'
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settings.theme === 'system') applyTheme();
  });

  /* ---------- Display Mode ---------- */
  function applyDisplayMode() {
    bookmarksContainer.classList.remove('view-grid', 'view-list');
    bookmarksContainer.classList.add(`view-${settings.displayMode}`);

    const isGrid = settings.displayMode === 'grid';
    iconViewGrid.classList.toggle('hidden', !isGrid);
    iconViewList.classList.toggle('hidden', isGrid);
  }

  function toggleDisplayMode() {
    const newMode = settings.displayMode === 'grid' ? 'list' : 'grid';
    saveSetting('displayMode', newMode);
    applyDisplayMode();
    renderBookmarks(searchInput.value.trim());
  }

  /* ---------- Greeting ---------- */
  function updateGreeting() {
    const hour = new Date().getHours();
    let key;
    if (hour >= 0 && hour < 5) key = 'good-night';
    else if (hour < 12) key = 'good-morning';
    else if (hour < 17) key = 'good-afternoon';
    else if (hour < 22) key = 'good-evening';
    else key = 'good-night';

    greetingEl.textContent = `${t(key)}, ${settings.userName}`;
  }

  /* ---------- Clock ---------- */
  function updateClock() {
    const now = new Date();

    const timeStr = now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    clockTimeEl.textContent = timeStr;

    const dateStr = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    clockDateEl.textContent = dateStr;
  }

  function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
  }

  /* ---------- Bookmarks ---------- */
  function getFaviconUrl(url) {
    try {
      const urlObj = new URL(url);
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(urlObj.origin)}&size=32`;
    } catch {
      return '';
    }
  }

  function collectFolders(nodes, depth = 0) {
    const folders = [];

    for (const node of nodes) {
      if (node.children) {
        const items = [];
        const subfolders = [];

        for (const child of node.children) {
          if (child.url && child.url.startsWith('http')) {
            items.push(child);
          } else if (child.children) {
            subfolders.push(child);
          }
        }

        if (items.length > 0) {
          folders.push({
            id: node.id,
            title: node.title || 'Bookmarks',
            items,
            depth
          });
        }

        const nested = collectFolders(subfolders, depth + 1);
        folders.push(...nested);
      }
    }

    return folders;
  }

  // Chrome's built-in root container IDs and titles to skip/flatten.
  const CHROME_ROOT_IDS = new Set(['0', '1', '2', '3']);
  const CHROME_ROOT_TITLES = new Set([
    'Bookmarks bar', 'Bookmarks Bar',
    'Other bookmarks', 'Other Bookmarks',
    'Mobile bookmarks', 'Mobile Bookmarks',
    'Bookmarks'
  ]);

  // Build sidebar tree directly from the raw Chrome bookmarks tree so that
  // container-only parent folders (no direct items) are still shown.
  // Chrome root containers are flattened — their children appear at the top level.
  function buildSidebarTree(nodes, flatFolderMap, depth = 0) {
    const tree = [];
    for (const node of nodes) {
      if (!node.children) continue;

      // Flatten Chrome's built-in root containers
      if (CHROME_ROOT_IDS.has(String(node.id)) || CHROME_ROOT_TITLES.has(node.title)) {
        tree.push(...buildSidebarTree(node.children, flatFolderMap, depth));
        continue;
      }

      const subfolders = node.children.filter(c => c.children);
      const children = buildSidebarTree(subfolders, flatFolderMap, depth + 1);
      const flatIndex = flatFolderMap.get(node.id);
      const hasContent = flatIndex !== undefined || children.length > 0;
      if (!hasContent) continue;
      tree.push({
        title: node.title || 'Bookmarks',
        flatIndex,
        itemCount: flatIndex !== undefined ? sidebarFolders[flatIndex].items.length : null,
        depth,
        children
      });
    }
    return tree;
  }

  function filterBookmarks(folders, keyword) {
    if (!keyword) return folders;
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return folders.map(folder => ({
      ...folder,
      items: folder.items.filter(item =>
        regex.test(item.title) || regex.test(item.url)
      )
    })).filter(folder => folder.items.length > 0);
  }

  /* ---------- Custom Confirm Dialog ---------- */
  const confirmOverlay = $('#confirm-overlay');
  const confirmDialog = $('#confirm-dialog');
  const confirmTitle = $('#confirm-title');
  const confirmMessage = $('#confirm-message');
  const confirmOk = $('#confirm-ok');
  const confirmCancel = $('#confirm-cancel');
  let confirmResolver = null;

  function showConfirm(title, message) {
    return new Promise((resolve) => {
      confirmResolver = resolve;
      confirmTitle.textContent = title;
      confirmMessage.textContent = message;
      confirmOverlay.classList.add('open');
      confirmDialog.classList.add('open');
      body.style.overflow = 'hidden';
      confirmOk.focus();
    });
  }

  function closeConfirm(result) {
    confirmOverlay.classList.remove('open');
    confirmDialog.classList.remove('open');
    body.style.overflow = '';
    if (confirmResolver) {
      confirmResolver(result);
      confirmResolver = null;
    }
  }

  confirmOk.addEventListener('click', () => closeConfirm(true));
  confirmCancel.addEventListener('click', () => closeConfirm(false));
  confirmOverlay.addEventListener('click', () => closeConfirm(false));

  function removeBookmark(id) {
    const ids = settings.pinnedIds || [];
    const idx = ids.indexOf(String(id));
    if (idx >= 0) {
      ids.splice(idx, 1);
      saveSetting('pinnedIds', [...ids]);
    }
    chrome.bookmarks.remove(id, () => {
      loadBookmarks();
      showToast('Bookmark removed');
    });
  }

  function createBookmarkElement(bookmark, opts = {}) {
    const { isPinned = false, showPin = true } = opts;
    const isGrid = settings.displayMode === 'grid';
    const wrapper = document.createElement('div');
    wrapper.className = 'bookmark-item-wrapper' + (isPinned ? ' is-pinned' : '');
    wrapper.draggable = true;
    wrapper.dataset.bookmarkId = bookmark.id;

    wrapper.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(bookmark.id));
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => wrapper.classList.add('bm-dragging'), 0);
    });
    wrapper.addEventListener('dragend', () => {
      wrapper.classList.remove('bm-dragging');
      document.querySelectorAll('.folder-drop-active').forEach(el => el.classList.remove('folder-drop-active'));
    });

    const a = document.createElement('a');
    a.href = bookmark.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'bookmark-item';
    a.title = bookmark.title;

    const faviconUrl = getFaviconUrl(bookmark.url);

    if (isGrid) {
      a.innerHTML = `
        <div class="bookmark-favicon-wrap">
          <img class="bookmark-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">
        </div>
        <span class="bookmark-title">${escapeHTML(bookmark.title)}</span>
      `;
    } else {
      let hostname = '';
      try { hostname = new URL(bookmark.url).hostname; } catch {}
      a.innerHTML = `
        <img class="bookmark-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">
        <span class="bookmark-title">${escapeHTML(bookmark.title)}</span>
        <span class="bookmark-url">${escapeHTML(hostname)}</span>
      `;
    }

    const btnRemove = document.createElement('button');
    btnRemove.className = 'bookmark-remove';
    btnRemove.title = 'Remove bookmark';
    btnRemove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
    btnRemove.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = await showConfirm('Remove bookmark?', bookmark.title);
      if (ok) removeBookmark(bookmark.id);
    });

    wrapper.appendChild(a);
    if (showPin) {
      const btnPin = document.createElement('button');
      btnPin.className = 'bookmark-pin' + (isPinned ? ' is-pinned' : '');
      btnPin.title = isPinned ? 'Unpin' : 'Pin';
      btnPin.innerHTML = '<svg class="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><polyline points="12 2 19 9 12 16 5 9 12 2"/></svg>';
      btnPin.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(bookmark.id);
      });
      wrapper.appendChild(btnPin);
    }
    wrapper.appendChild(btnRemove);
    return wrapper;
  }

  function togglePin(bookmarkId) {
    const ids = [...(settings.pinnedIds || [])];
    const idStr = String(bookmarkId);
    const idx = ids.indexOf(idStr);
    const wasPinned = idx >= 0;
    if (wasPinned) {
      ids.splice(idx, 1);
    } else {
      ids.push(idStr);
    }
    saveSetting('pinnedIds', ids);
    renderBookmarks(searchInput.value.trim());
    showToast(wasPinned ? 'Unpinned' : 'Pinned');
  }

  function createFolderElement(folder, index, pinnedIds = []) {
    const div = document.createElement('div');
    div.className = 'bookmark-folder';
    div.id = `folder-${index}`;
    div.dataset.folderId = folder.id;

    const header = document.createElement('div');
    header.className = 'folder-header';
    header.innerHTML = `
      <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      <span class="folder-name">${escapeHTML(folder.title)}</span>
      <span class="folder-count">${folder.items.length}</span>
    `;

    const children = document.createElement('div');
    children.className = 'folder-children';

    const items = document.createElement('div');
    items.className = 'folder-items';

    for (const bookmark of folder.items) {
      const isPinned = (pinnedIds || []).includes(String(bookmark.id));
      items.appendChild(createBookmarkElement(bookmark, { isPinned, showPin: true }));
    }

    children.appendChild(items);
    div.appendChild(header);
    div.appendChild(children);

    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      children.classList.toggle('collapsed');
    });

    // Drag & drop — allow other bookmark items to be dropped onto this folder
    div.addEventListener('dragover', (e) => {
      if (!e.dataTransfer.types.includes('text/plain')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      div.classList.add('folder-drop-active');
    });
    div.addEventListener('dragleave', (e) => {
      if (!div.contains(e.relatedTarget)) div.classList.remove('folder-drop-active');
    });
    div.addEventListener('drop', (e) => {
      e.preventDefault();
      div.classList.remove('folder-drop-active');
      const bookmarkId = e.dataTransfer.getData('text/plain');
      const targetFolderId = folder.id;
      if (!bookmarkId || !targetFolderId) return;
      // Don't move if already in this folder
      const dragged = bookmarksContainer.querySelector(`[data-bookmark-id="${bookmarkId}"]`);
      if (dragged && div.contains(dragged)) return;
      chrome.bookmarks.move(bookmarkId, { parentId: targetFolderId }, () => {
        loadBookmarks();
        showToast(t('moved'));
      });
    });

    return div;
  }

  function getPinnedBookmarks(keyword) {
    const pinnedIds = settings.pinnedIds || [];
    const regex = keyword ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
    const list = [];
    for (const id of pinnedIds) {
      const bm = findBookmarkById(allBookmarks, id);
      if (bm && bm.url && bm.url.startsWith('http')) {
        if (!regex || regex.test(bm.title) || regex.test(bm.url)) {
          list.push(bm);
        }
      }
    }
    return list;
  }

  function renderBookmarks(keyword = '') {
    const folders = collectFolders(allBookmarks);
    const filtered = filterBookmarks(folders, keyword);
    const pinnedIds = settings.pinnedIds || [];
    const pinnedBookmarks = getPinnedBookmarks(keyword);
    const showPinnedAtTop = (settings.pinnedDisplay || 'top') === 'top';

    bookmarksContainer.innerHTML = '';

    if (showPinnedAtTop && pinnedBookmarks.length > 0) {
      const pinnedSection = document.createElement('div');
      pinnedSection.className = 'bookmark-folder pinned-section';
      pinnedSection.id = 'folder-pinned';
      const header = document.createElement('div');
      header.className = 'folder-header';
      header.innerHTML = `
        <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        <span class="folder-name">Pinned</span>
        <span class="folder-count">${pinnedBookmarks.length}</span>
      `;
      const children = document.createElement('div');
      children.className = 'folder-children';
      const items = document.createElement('div');
      items.className = 'folder-items';
      for (const bm of pinnedBookmarks) {
        items.appendChild(createBookmarkElement(bm, { isPinned: true, showPin: true }));
      }
      children.appendChild(items);
      pinnedSection.appendChild(header);
      pinnedSection.appendChild(children);
      header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        children.classList.toggle('collapsed');
      });
      bookmarksContainer.appendChild(pinnedSection);
    }

    if (pinnedSidebar) {
      pinnedSidebar.hidden = showPinnedAtTop;
      if (!showPinnedAtTop) renderPinnedSidebar();
    }

    let totalCount = pinnedBookmarks.length;
    filtered.forEach((folder, i) => {
      totalCount += folder.items.length;
      const folderEl = createFolderElement(folder, i, pinnedIds);
      bookmarksContainer.appendChild(folderEl);
    });

    if (keyword) {
      searchCount.textContent = `${totalCount} result${totalCount !== 1 ? 's' : ''}`;
    } else {
      searchCount.textContent = '';
    }

    if (filtered.length === 0 && pinnedBookmarks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <p>${keyword ? 'No bookmarks match your search' : 'No bookmarks found'}</p>
      `;
      bookmarksContainer.appendChild(empty);
    }

    buildFolderSidebar(filtered, showPinnedAtTop && pinnedBookmarks.length > 0);
  }

  function renderPinnedSidebar() {
    if (!pinnedSidebarList) return;
    const pinnedBookmarks = getPinnedBookmarks('');
    pinnedSidebarList.innerHTML = '';
    for (const bm of pinnedBookmarks) {
      const el = createBookmarkElement(bm, { isPinned: true, showPin: true });
      pinnedSidebarList.appendChild(el);
    }
    if (pinnedBookmarks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pinned-sidebar-empty';
      empty.textContent = 'No pinned bookmarks';
      pinnedSidebarList.appendChild(empty);
    }
  }

  function loadBookmarks() {
    chrome.bookmarks.getTree((tree) => {
      allBookmarks = tree;
      renderBookmarks(searchInput.value.trim());
    });
  }

  /* ---------- Utilities ---------- */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Back to Top ---------- */
  function handleScroll() {
    const scrollY = window.scrollY;
    backToTopBtn.classList.toggle('visible', scrollY > 300);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Background Image ---------- */
  function applyBackgroundImage() {
    const url = settings.backgroundImage;
    if (url && url.trim()) {
      body.style.backgroundImage = `url('${url.trim()}')`;
      body.classList.add('has-bg-image');
    } else {
      body.style.backgroundImage = '';
      body.classList.remove('has-bg-image');
    }
  }

  /* ---------- Settings Panel ---------- */
  const BG_PRESETS = [
    { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80', label: 'Starry Mountains' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80', label: 'Tropical Beach' },
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80', label: 'Forest Path' },
    { url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80', label: 'Northern Lights' },
    { url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1920&q=80', label: 'Desert Dunes' },
    { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80', label: 'Mountain Peak' },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80', label: 'Foggy Valley' },
    { url: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=1920&q=80', label: 'Purple Sky' },
    { url: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=1920&q=80', label: 'Lake Reflection' },
    { url: 'https://images.unsplash.com/photo-1500534314263-a834e5e29c8e?w=1920&q=80', label: 'Sunset Ridge' },
  ];

  const spBgGallery = $('#sp-bg-gallery');

  let panelSettings = {};

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }

  function updateSpBgPreview(url) {
    if (url && url.trim()) {
      spBgPreviewImg.style.backgroundImage = `url('${url.trim()}')`;
      spBgPreview.classList.add('visible');
    } else {
      spBgPreviewImg.style.backgroundImage = '';
      spBgPreview.classList.remove('visible');
    }
  }

  function buildBgGallery() {
    BG_PRESETS.forEach(preset => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sp-bg-thumb';
      btn.dataset.url = preset.url;
      btn.title = preset.label;
      btn.style.backgroundImage = `url('${preset.url.replace('w=1920', 'w=200')}')`;
      btn.addEventListener('click', () => selectBgPreset(preset.url));
      spBgGallery.appendChild(btn);
    });
  }

  function selectBgPreset(url) {
    spBgInput.value = url;
    updateSpBgPreview(url);
    syncBgGalleryActive(url);
  }

  function syncBgGalleryActive(url) {
    spBgGallery.querySelectorAll('.sp-bg-thumb').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.url === (url || ''));
    });
  }

  function syncPanelToggles() {
    spToggles.forEach(btn => {
      const key = btn.dataset.setting;
      const val = btn.dataset.value;
      btn.classList.toggle('active', String(panelSettings[key]) === val);
    });
  }

  function populatePanel() {
    const keys = Object.values(STORAGE_KEYS);
    chrome.storage.local.get(keys, (result) => {
      panelSettings = {};
      for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
        if (key === 'pinnedIds') {
          panelSettings[key] = Array.isArray(result[storageKey]) ? result[storageKey] : [];
        } else if (key === 'pinnedDisplay') {
          panelSettings[key] = result[storageKey] || DEFAULTS.pinnedDisplay;
        } else {
          panelSettings[key] = result[storageKey] !== undefined ? result[storageKey] : String(DEFAULTS[key]);
        }
      }
      if (!Array.isArray(panelSettings.visibleApps)) {
        panelSettings.visibleApps = ALL_APP_IDS.slice();
      }
      spNameInput.value = panelSettings.userName || '';
      spBgInput.value = panelSettings.backgroundImage || '';
      updateSpBgPreview(panelSettings.backgroundImage);
      syncPanelToggles();
      syncBgGalleryActive(panelSettings.backgroundImage || '');
      buildAppsGrid();
    });
  }

  function openSettings() {
    populatePanel();
    settingsOverlay.classList.add('open');
    settingsPanel.classList.add('open');
    body.style.overflow = 'hidden';
    // Always start on the General tab
    const firstTab = $('.settings-tab[data-tab="general"]');
    if (firstTab) firstTab.click();
  }

  function closeSettings() {
    settingsOverlay.classList.remove('open');
    settingsPanel.classList.remove('open');
    body.style.overflow = '';
  }

  function saveAllSettings() {
    panelSettings.userName = spNameInput.value.trim() || String(DEFAULTS.userName);
    panelSettings.backgroundImage = spBgInput.value.trim();

    const toStore = {};
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      toStore[storageKey] = panelSettings[key];
    }
    chrome.storage.local.set(toStore, () => {
      loadSettings().then(() => {
        applyTheme();
        applyBackgroundImage();
        applyDisplayMode();
        applyFolderSidebarMode();
        applyLanguage();
        applyNavDisplay();
        renderGoogleAppsMenu();
        updateGreeting();
        initClock();
        renderBookmarks(searchInput.value.trim());
        showToast('Settings saved');
      });
    });
  }

  function resetAllSettings() {
    for (const [key] of Object.entries(STORAGE_KEYS)) {
      if (key === 'pinnedIds') continue;
      panelSettings[key] = key === 'pinnedDisplay' ? DEFAULTS.pinnedDisplay : String(DEFAULTS[key]);
    }
    spNameInput.value = panelSettings.userName;
    spBgInput.value = panelSettings.backgroundImage;
    updateSpBgPreview(panelSettings.backgroundImage);
    syncPanelToggles();
    syncBgGalleryActive(panelSettings.backgroundImage || '');
    showToast('Reset to defaults');
  }

  function buildAppsGrid() {
    const grid = $('#sp-apps-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const visibleApps = panelSettings.visibleApps || ALL_APP_IDS;
    GOOGLE_APPS.forEach(app => {
      const checked = visibleApps.includes(app.id);
      const item = document.createElement('label');
      item.className = 'sp-app-toggle' + (checked ? ' active' : '');
      item.innerHTML = `
        <input type="checkbox" class="sp-app-checkbox" data-app-id="${app.id}" ${checked ? 'checked' : ''} style="display:none">
        <span class="sp-app-name">${escapeHTML(app.label)}</span>
      `;
      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', () => {
        item.classList.toggle('active', checkbox.checked);
        const ids = GOOGLE_APPS
          .filter(a => {
            const cb = grid.querySelector(`[data-app-id="${a.id}"]`);
            return cb ? cb.checked : true;
          })
          .map(a => a.id);
        panelSettings.visibleApps = ids;
      });
      grid.appendChild(item);
    });
  }

  function initSettingsTabs() {
    const tabs = $$('.settings-tab');
    const panes = $$('.settings-tab-pane');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const pane = $(`[data-pane="${tab.dataset.tab}"]`);
        if (pane) pane.classList.add('active');
      });
    });
  }

  function initSettingsPanel() {
    buildBgGallery();
    initSettingsTabs();

    linkSettings.addEventListener('click', openSettings);
    settingsOverlay.addEventListener('click', closeSettings);
    settingsClose.addEventListener('click', closeSettings);

    spToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.setting;
        panelSettings[key] = btn.dataset.value;
        syncPanelToggles();
      });
    });

    // Save button
    $('#sp-btn-save')?.addEventListener('click', saveAllSettings);

    spBtnReset.addEventListener('click', resetAllSettings);

    spBgInput.addEventListener('input', () => {
      const val = spBgInput.value.trim();
      updateSpBgPreview(val);
      syncBgGalleryActive(val);
    });

    spBtnClearBg.addEventListener('click', () => {
      selectBgPreset('');
    });

    spBgGallery.querySelector('.sp-bg-thumb-none').addEventListener('click', () => {
      selectBgPreset('');
    });

    initAccountTab();
  }

  /* ---------- Account Tab ---------- */
  function initAccountTab() {
    const signInBtn = $('#sp-btn-google-signin');
    const signOutBtn = $('#sp-btn-google-signout');

    function showSignedIn(profile) {
      const emptyEl = $('#sp-account-empty');
      const displayEl = $('#sp-account-display');
      if (emptyEl) emptyEl.style.display = 'none';
      if (displayEl) {
        displayEl.style.display = 'flex';
        const avatar = $('#sp-account-avatar');
        const name = $('#sp-account-name');
        const email = $('#sp-account-email');
        if (avatar && profile.picture) avatar.src = profile.picture;
        if (name) name.textContent = profile.name || '';
        if (email) email.textContent = profile.email || '';
      }
    }

    function showSignedOut() {
      const emptyEl = $('#sp-account-empty');
      const displayEl = $('#sp-account-display');
      if (emptyEl) emptyEl.style.display = '';
      if (displayEl) displayEl.style.display = 'none';
    }

    function fetchProfile(token) {
      fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(p => showSignedIn(p))
        .catch(() => showSignedOut());
    }

    signInBtn?.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.identity) {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError || !token) {
            showToast('Sign-in requires identity permission in manifest');
            return;
          }
          fetchProfile(token);
        });
      } else {
        showToast('Google sign-in not available in this context');
      }
    });

    signOutBtn?.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.identity) {
        chrome.identity.clearAllCachedAuthTokens(() => {
          showSignedOut();
          showToast('Signed out');
        });
      } else {
        showSignedOut();
      }
    });
  }

  /* ---------- Google Apps Menu ---------- */
  function getAppIconHTML(app) {
    if (app.type === 'google') {
      return `<div class="gam-icon gam-icon-multi">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      </div>`;
    }
    if (app.type === 'gemini') {
      return `<div class="gam-icon gam-icon-gemini">
        <svg viewBox="0 0 28 28" fill="none" width="22" height="22">
          <path d="M14 2C14 2 9 9 2 14C9 14 14 9 14 2Z" fill="url(#g1)"/>
          <path d="M14 2C14 2 19 9 26 14C19 14 14 9 14 2Z" fill="url(#g2)"/>
          <path d="M14 26C14 26 9 19 2 14C9 14 14 19 14 26Z" fill="url(#g3)"/>
          <path d="M14 26C14 26 19 19 26 14C19 14 14 19 14 26Z" fill="url(#g4)"/>
          <defs>
            <linearGradient id="g1" x1="14" y1="2" x2="2" y2="14"><stop stop-color="#4285F4"/><stop offset="1" stop-color="#9334E6"/></linearGradient>
            <linearGradient id="g2" x1="14" y1="2" x2="26" y2="14"><stop stop-color="#9334E6"/><stop offset="1" stop-color="#4285F4"/></linearGradient>
            <linearGradient id="g3" x1="14" y1="26" x2="2" y2="14"><stop stop-color="#4285F4"/><stop offset="1" stop-color="#34A853"/></linearGradient>
            <linearGradient id="g4" x1="14" y1="26" x2="26" y2="14"><stop stop-color="#34A853"/><stop offset="1" stop-color="#4285F4"/></linearGradient>
          </defs>
        </svg>
      </div>`;
    }
    // Solid color icons
    const svgMap = {
      gmail: '<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>',
      calendar: '<path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3.01 3.9 3.01 5L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>',
      drive: '<path d="M7.71 3.5L1.15 15l3.43 6 6.56-11.5zm.57 1L14.41 15H7.57l-3.42-6zM16.5 3.5h-6l6 10.5H23zm-.54 1.07L21.79 14.5H17l-3-5.25zM1.15 15L4.58 21h14.84l3.43-6z"/>',
      docs: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-5 9v-2h8v2H8zm0-4v-2h8v2H8zm0-4V8h3v2H8z"/>',
      sheets: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-2h7v2zm5-4H5v-2h12v2zm0-4H5V7h12v2z"/>',
      slides: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 12H7v-2h5v2zm5-4H7V9h10v2z"/>',
      meet: '<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>',
      keep: '<path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>',
      notebooklm: '<path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V6h8v2z"/>',
      youtube: '<path d="M21.58 7.19c-.23-.86-.9-1.54-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42c-.86.23-1.53.91-1.76 1.77C2 8.76 2 12 2 12s0 3.24.42 4.81c.23.86.9 1.54 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42c.86-.23 1.53-.91 1.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>',
    };
    const icon = svgMap[app.id] || svgMap.docs;
    return `<div class="gam-icon" style="background:${app.bg}"><svg viewBox="0 0 24 24" fill="white">${icon}</svg></div>`;
  }

  function renderGoogleAppsMenu() {
    const menu = $('#google-apps-menu');
    if (!menu) return;
    const visibleApps = settings.visibleApps || ALL_APP_IDS;
    const apps = GOOGLE_APPS.filter(a => visibleApps.includes(a.id));
    const grid = $('#gam-grid') || menu.querySelector('.gam-grid');
    if (!grid) return;
    grid.innerHTML = '';
    apps.forEach(app => {
      const a = document.createElement('a');
      a.className = 'gam-item';
      a.href = app.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `${getAppIconHTML(app)}<span>${escapeHTML(app.label)}</span>`;
      grid.appendChild(a);
    });
  }

  function initGoogleAppsMenu() {
    const btn = $('#btn-google-apps');
    const menu = $('#google-apps-menu');
    const container = $('#nav-google-apps');
    if (!btn || !menu) return;

    renderGoogleAppsMenu();

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (menu.classList.contains('open') && !container.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
      }
    });
  }

  /* ---------- Folder Sidebar ---------- */
  let sidebarFolders = [];
  let sidebarFolderTree = [];
  let sidebarHasPinned = false;

  function buildFolderSidebar(folders, hasPinned = false) {
    sidebarFolders = folders;
    const flatFolderMap = new Map();
    folders.forEach((f, i) => { if (f.id) flatFolderMap.set(f.id, i); });
    sidebarFolderTree = buildSidebarTree(allBookmarks, flatFolderMap, 0);
    sidebarHasPinned = hasPinned;
    folderSidebarSearch.value = '';
    renderSidebarList('');
  }

  function folderTreeNodeMatches(node, regex) {
    if (!regex) return true;
    if (regex.test(node.title)) return true;
    return node.children?.some(child => folderTreeNodeMatches(child, regex));
  }

  const INDENT_BASE = 14;
  const INDENT_STEP = 14;

  function renderSidebarTreeNode(node, regex) {
    if (regex && !folderTreeNodeMatches(node, regex)) return null;
    const isHeader = node.flatIndex === undefined;
    const li = document.createElement('li');
    li.className = 'folder-sidebar-item folder-tree-item' + (isHeader ? ' folder-header-only' : '');
    if (!isHeader) li.dataset.target = `folder-${node.flatIndex}`;
    li.style.paddingLeft = `${INDENT_BASE + node.depth * INDENT_STEP}px`;

    const countHtml = !isHeader
      ? `<span class="folder-sidebar-item-count">${node.itemCount}</span>`
      : '';
    li.innerHTML = `
      <svg class="folder-sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
      <span class="folder-sidebar-item-name">${escapeHTML(node.title)}</span>
      ${countHtml}
    `;
    if (!isHeader) {
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = document.getElementById(`folder-${node.flatIndex}`);
        if (target) {
          const topbarHeight = 56;
          const y = target.getBoundingClientRect().top + window.scrollY - topbarHeight - 12;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    }
    return li;
  }

  function appendTreeToSidebar(container, tree, regex) {
    for (const node of tree) {
      const li = renderSidebarTreeNode(node, regex);
      if (li) container.appendChild(li);
      if (node.children && node.children.length > 0) {
        appendTreeToSidebar(container, node.children, regex);
      }
    }
  }

  function renderSidebarList(keyword) {
    folderSidebarList.innerHTML = '';
    const regex = keyword
      ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : null;

    let hasMatch = false;

    if (sidebarHasPinned && (!regex || regex.test('Pinned'))) {
      hasMatch = true;
      const li = document.createElement('li');
      li.className = 'folder-sidebar-item';
      li.dataset.target = 'folder-pinned';
      li.style.paddingLeft = `${INDENT_BASE}px`;
      li.innerHTML = `
        <svg class="folder-sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><polyline points="12 2 19 9 12 16 5 9 12 2"/></svg>
        <span class="folder-sidebar-item-name">Pinned</span>
      `;
      li.addEventListener('click', () => {
        const target = document.getElementById('folder-pinned');
        if (target) {
          const topbarHeight = 56;
          const y = target.getBoundingClientRect().top + window.scrollY - topbarHeight - 12;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
      folderSidebarList.appendChild(li);

      // Divider after Pinned
      const divider = document.createElement('li');
      divider.className = 'folder-sidebar-divider';
      folderSidebarList.appendChild(divider);
    }

    for (const node of sidebarFolderTree) {
      const li = renderSidebarTreeNode(node, regex);
      if (li) {
        hasMatch = true;
        folderSidebarList.appendChild(li);
        if (node.children?.length) appendTreeToSidebar(folderSidebarList, node.children, regex);
      }
    }

    if (!hasMatch) {
      const empty = document.createElement('li');
      empty.className = 'folder-sidebar-empty';
      empty.textContent = 'No folders found';
      folderSidebarList.appendChild(empty);
    }
  }

  function updateActiveSidebarItem() {
    const items = folderSidebarList.querySelectorAll('.folder-sidebar-item');
    if (items.length === 0) return;

    const topbarHeight = 56;
    const threshold = topbarHeight + 40;
    let activeIndex = 0;

    items.forEach((item, i) => {
      item.classList.remove('active');
      const target = document.getElementById(item.dataset.target);
      if (target && target.getBoundingClientRect().top <= threshold) {
        activeIndex = i;
      }
    });

    items[activeIndex].classList.add('active');
  }

  function saveFolderSidebarOpen(open) {
    chrome.storage.local.set({ [STORAGE_KEYS.folderSidebarOpen]: open ? 'true' : 'false' });
  }

  function applyFolderSidebarMode() {
    const isDocked = (settings.folderSidebarMode || 'float') === 'pinned';
    body.classList.toggle('sidebar-mode-pinned', isDocked);

    if (isDocked) {
      // In docked mode: always open, clicking outside does nothing
      folderSidebar.classList.add('pinned');
      body.classList.add('folder-panel-open');
      saveFolderSidebarOpen(true);
    } else {
      // In float mode: restore persisted open state
      const wasOpen = settings.folderSidebarOpen === 'true';
      folderSidebar.classList.toggle('pinned', wasOpen);
      body.classList.toggle('folder-panel-open', wasOpen);
    }
  }

  function setFolderPanelOpen(open) {
    folderSidebar.classList.toggle('pinned', open);
    body.classList.toggle('folder-panel-open', open);
    saveFolderSidebarOpen(open);
  }

  function initFolderSidebar() {
    applyFolderSidebarMode();

    folderSidebarTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isDocked = (settings.folderSidebarMode || 'float') === 'pinned';
      if (isDocked) {
        // In docked mode the trigger switches the whole mode to float
        settings.folderSidebarMode = 'float';
        chrome.storage.local.set({ [STORAGE_KEYS.folderSidebarMode]: 'float' });
        applyFolderSidebarMode();
      } else {
        const isOpen = folderSidebar.classList.toggle('pinned');
        body.classList.toggle('folder-panel-open', isOpen);
        saveFolderSidebarOpen(isOpen);
      }
    });

    document.addEventListener('click', (e) => {
      const isDocked = (settings.folderSidebarMode || 'float') === 'pinned';
      if (!isDocked && folderSidebar.classList.contains('pinned') && !folderSidebar.contains(e.target)) {
        setFolderPanelOpen(false);
      }
    });

    folderSidebarSearch.addEventListener('input', () => {
      renderSidebarList(folderSidebarSearch.value.trim());
    });

    window.addEventListener('scroll', updateActiveSidebarItem, { passive: true });
  }

  function initPinnedSidebar() {
    if (!pinnedSidebar || !pinnedSidebarTrigger) return;
    const showPopup = (settings.pinnedDisplay || 'top') === 'popup';
    pinnedSidebar.hidden = !showPopup;
    if (showPopup) renderPinnedSidebar();
  }

  /* ---------- Search ---------- */
  let searchDebounce = null;
  function handleSearch() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      renderBookmarks(searchInput.value.trim());
    }, 150);
  }

  /* ---------- Keyboard Shortcuts ---------- */
  const kbdOverlay = $('#kbd-overlay');
  const kbdModal = $('#kbd-modal');
  const kbdClose = $('#kbd-modal-close');

  function openShortcutsModal() {
    kbdOverlay.classList.add('open');
    kbdModal.classList.add('open');
  }

  function closeShortcutsModal() {
    kbdOverlay.classList.remove('open');
    kbdModal.classList.remove('open');
  }

  function isTyping() {
    const tag = document.activeElement?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
  }

  function initKeyboardShortcuts() {
    $('#btn-shortcuts').addEventListener('click', openShortcutsModal);
    kbdOverlay.addEventListener('click', closeShortcutsModal);
    kbdClose.addEventListener('click', closeShortcutsModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (confirmDialog.classList.contains('open')) {
          closeConfirm(false);
          return;
        }
        if (kbdModal.classList.contains('open')) {
          closeShortcutsModal();
          return;
        }
        if (settingsPanel.classList.contains('open')) {
          closeSettings();
          return;
        }
        if (folderSidebar.classList.contains('pinned') && (settings.folderSidebarMode || 'float') === 'float') {
          setFolderPanelOpen(false);
          return;
        }
        if (pinnedSidebar && pinnedSidebar.classList.contains('pinned')) {
          pinnedSidebar.classList.remove('pinned');
          return;
        }
        if (document.activeElement === searchInput) {
          searchInput.value = '';
          searchInput.blur();
          renderBookmarks();
          return;
        }
        return;
      }

      if (isTyping()) return;

      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        searchInput.focus();
        return;
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        kbdModal.classList.contains('open') ? closeShortcutsModal() : openShortcutsModal();
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          window.open('https://www.google.com/', '_blank');
        } else {
          const menu = $('#google-apps-menu');
          if (menu) {
            menu.classList.toggle('open');
          }
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 't':
          toggleTheme();
          break;
        case 'v':
          toggleDisplayMode();
          break;
        case 's':
          e.preventDefault();
          settingsPanel.classList.contains('open') ? closeSettings() : openSettings();
          break;
        case 'f':
          folderSidebar.classList.add('pinned');
          saveFolderSidebarOpen(true);
          break;
        case 'd':
          e.preventDefault();
          domainViewOpen ? closeDomainView() : openDomainView();
          break;
        case 'r':
          e.preventDefault();
          recentViewOpen ? closeRecentView() : openRecentView();
          break;
        case 'home':
          e.preventDefault();
          scrollToTop();
          break;
      }
    });
  }

  /* ---------- Domain Graph Dashboard ---------- */
  function getDomainFromUrl(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
  }

  function getDomainColor(domain) {
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 62%, 52%)`;
  }

  function buildDomainMap() {
    const map = new Map();
    function traverse(nodes) {
      if (!nodes) return;
      for (const node of nodes) {
        if (node.url && node.url.startsWith('http')) {
          const domain = getDomainFromUrl(node.url);
          if (domain) {
            if (!map.has(domain)) map.set(domain, []);
            map.get(domain).push(node);
          }
        }
        if (node.children) traverse(node.children);
      }
    }
    traverse(allBookmarks);
    return map;
  }

  let domainViewOpen = false;

  function openDomainView() {
    const domainView = $('#domain-view');
    const bookmarksSection = $('.bookmarks-section');
    const heroSection = $('.hero');
    const searchSection = $('.search-section');
    if (!domainView) return;
    domainViewOpen = true;
    domainView.classList.add('active');
    if (bookmarksSection) bookmarksSection.hidden = true;
    if (heroSection) heroSection.style.display = 'none';
    if (searchSection) searchSection.style.display = 'none';
    $('#btn-domains')?.classList.add('active');
    renderDomainView();
  }

  function closeDomainView() {
    const domainView = $('#domain-view');
    const bookmarksSection = $('.bookmarks-section');
    const heroSection = $('.hero');
    const searchSection = $('.search-section');
    if (!domainView) return;
    domainViewOpen = false;
    domainView.classList.remove('active');
    if (bookmarksSection) bookmarksSection.hidden = false;
    if (heroSection) heroSection.style.display = '';
    if (searchSection) searchSection.style.display = '';
    $('#btn-domains')?.classList.remove('active');
  }

  function renderDomainView() {
    const domainView = $('#domain-view');
    if (!domainView) return;
    domainView.innerHTML = '';

    const domainMap = buildDomainMap();
    const domains = [...domainMap.entries()].sort((a, b) => b[1].length - a[1].length);
    const maxCount = domains.length ? domains[0][1].length : 1;
    const totalBm = [...domainMap.values()].reduce((s, a) => s + a.length, 0);

    // Header
    const header = document.createElement('div');
    header.className = 'domain-view-header';
    header.innerHTML = `
      <div class="domain-view-header-left">
        <h2 class="domain-view-title">${t('domain-view-title')}</h2>
        <p class="domain-view-desc">${t('domain-view-desc')} &mdash; <strong>${domains.length}</strong> domains, <strong>${totalBm}</strong> bookmarks</p>
      </div>
      <button class="domain-view-back" id="domain-view-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        ${t('domain-back')}
      </button>
    `;
    domainView.appendChild(header);
    $('#domain-view-back')?.addEventListener('click', closeDomainView);

    // Search bar for domains
    const searchWrap = document.createElement('div');
    searchWrap.className = 'domain-view-search-wrap';
    searchWrap.innerHTML = `
      <svg class="domain-view-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" id="domain-view-search" class="domain-view-search-input" placeholder="${t('domain-search-placeholder')}" autocomplete="off" spellcheck="false">
    `;
    domainView.appendChild(searchWrap);

    if (domains.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'domain-empty';
      empty.textContent = 'No bookmarks found';
      domainView.appendChild(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'domain-grid';

    const cards = [];
    domains.forEach(([domain, bookmarks], idx) => {
      const pct = Math.round((bookmarks.length / maxCount) * 100);
      const color = getDomainColor(domain);
      const faviconUrl = getFaviconUrl(`https://${domain}`);
      const card = document.createElement('div');
      card.className = 'domain-card';
      card.dataset.domain = domain;
      card.style.animationDelay = `${Math.min(idx * 30, 400)}ms`;
      card.innerHTML = `
        <div class="domain-card-bar-track">
          <div class="domain-card-bar" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="domain-card-body">
          <div class="domain-card-icon" style="background:${color}18;border-color:${color}30">
            <img src="${faviconUrl}" alt="" class="domain-favicon" loading="lazy" onerror="this.style.display='none'">
          </div>
          <div class="domain-card-info">
            <span class="domain-name">${escapeHTML(domain)}</span>
            <span class="domain-count" style="color:${color}">${bookmarks.length}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => openDomainModal(domain, bookmarks, color));
      grid.appendChild(card);
      cards.push(card);
    });

    domainView.appendChild(grid);

    // Wire up domain search filter
    const domainSearchInput = $('#domain-view-search');
    if (domainSearchInput) {
      domainSearchInput.addEventListener('input', () => {
        const q = domainSearchInput.value.trim().toLowerCase();
        let visibleCount = 0;
        cards.forEach(card => {
          const domain = (card.dataset.domain || '').toLowerCase();
          const visible = !q || domain.includes(q);
          card.style.display = visible ? '' : 'none';
          if (visible) visibleCount++;
        });
        // Show/hide no-results message
        let noRes = grid.querySelector('.domain-no-results');
        if (visibleCount === 0) {
          if (!noRes) {
            noRes = document.createElement('p');
            noRes.className = 'domain-no-results';
            noRes.textContent = 'No matching domains';
            grid.appendChild(noRes);
          }
          noRes.style.display = '';
        } else if (noRes) {
          noRes.style.display = 'none';
        }
      });
      domainSearchInput.focus();
    }
  }

  function openDomainModal(domain, bookmarks, color) {
    const modal = $('#domain-modal');
    const overlay = $('#domain-modal-overlay');
    if (!modal) return;

    const favicon = $('#domain-modal-favicon');
    const title = $('#domain-modal-title');
    const count = $('#domain-modal-count');
    const list = $('#domain-modal-list');

    if (favicon) { favicon.src = getFaviconUrl(`https://${domain}`); favicon.onerror = () => favicon.style.display = 'none'; }
    if (title) { title.textContent = domain; title.style.borderBottomColor = color || ''; }
    if (count) {
      const n = bookmarks.length;
      count.textContent = `${n} ${n === 1 ? t('domain-bookmark') : t('domain-bookmarks')}`;
      count.style.background = (color || '#4285F4') + '20';
      count.style.color = color || '#4285F4';
    }

    // Optional search bar if > 10 results
    let modalSearch = modal.querySelector('.domain-modal-search-wrap');
    if (!modalSearch) {
      modalSearch = document.createElement('div');
      modalSearch.className = 'domain-modal-search-wrap';
      modalSearch.innerHTML = `
        <svg class="domain-modal-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" class="domain-modal-search-input" placeholder="${t('domain-modal-search')}" autocomplete="off" spellcheck="false">
      `;
      // Insert after header
      const modalHeader = modal.querySelector('.domain-modal-header');
      if (modalHeader && modalHeader.nextSibling) {
        modal.insertBefore(modalSearch, modalHeader.nextSibling);
      } else {
        modal.appendChild(modalSearch);
      }
    }
    const searchInput = modalSearch.querySelector('.domain-modal-search-input');
    if (searchInput) searchInput.value = '';
    modalSearch.style.display = bookmarks.length > 10 ? '' : 'none';

    if (list) {
      list.innerHTML = '';
      const items = [];
      bookmarks.forEach(bm => {
        const item = document.createElement('a');
        item.href = bm.url;
        item.target = '_blank';
        item.rel = 'noopener';
        item.className = 'domain-modal-item';
        item.innerHTML = `
          <img class="domain-modal-favicon" src="${getFaviconUrl(bm.url)}" alt="" loading="lazy" onerror="this.style.display='none'">
          <div class="domain-modal-item-info">
            <span class="domain-modal-item-title">${escapeHTML(bm.title || bm.url)}</span>
            <span class="domain-modal-item-url">${escapeHTML(bm.url)}</span>
          </div>
          <svg class="domain-modal-item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        `;
        list.appendChild(item);
        items.push({ el: item, title: (bm.title || '').toLowerCase(), url: bm.url.toLowerCase() });
      });

      // Wire modal search filter
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim().toLowerCase();
          items.forEach(({ el, title, url }) => {
            el.style.display = q && !title.includes(q) && !url.includes(q) ? 'none' : '';
          });
        });
      }
    }

    overlay?.classList.add('open');
    modal.classList.add('open');
    body.style.overflow = 'hidden';
  }

  function closeDomainModal() {
    $('#domain-modal')?.classList.remove('open');
    $('#domain-modal-overlay')?.classList.remove('open');
    body.style.overflow = '';
  }

  function initDomainView() {
    const btn = $('#btn-domains');
    btn?.addEventListener('click', () => {
      domainViewOpen ? closeDomainView() : openDomainView();
    });

    $('#domain-modal-close')?.addEventListener('click', closeDomainModal);
    $('#domain-modal-overlay')?.addEventListener('click', closeDomainModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('#domain-modal')?.classList.contains('open')) {
        closeDomainModal();
      }
    });
  }

  /* ---------- Recently Added View ---------- */
  let recentViewOpen = false;

  function relativeTime(ms) {
    const diff = Date.now() - ms;
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w ago`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo ago`;
    return `${Math.floor(mo / 12)}y ago`;
  }

  function collectAllBookmarks(nodes = allBookmarks) {
    const results = [];
    for (const node of nodes) {
      if (node.url && node.dateAdded) results.push(node);
      if (node.children) results.push(...collectAllBookmarks(node.children));
    }
    return results;
  }

  function openRecentView() {
    if (domainViewOpen) closeDomainView();
    recentViewOpen = true;
    const recentView = $('#recent-view');
    const bookmarksSection = $('.bookmarks-section');
    const heroSection = $('.hero');
    const searchSection = $('.search-section');
    if (!recentView) return;
    recentView.classList.add('active');
    if (bookmarksSection) bookmarksSection.hidden = true;
    if (heroSection) heroSection.style.display = 'none';
    if (searchSection) searchSection.style.display = 'none';
    $('#btn-recent')?.classList.add('active');
    renderRecentView();
  }

  function closeRecentView() {
    const recentView = $('#recent-view');
    const bookmarksSection = $('.bookmarks-section');
    const heroSection = $('.hero');
    const searchSection = $('.search-section');
    if (!recentView) return;
    recentViewOpen = false;
    recentView.classList.remove('active');
    if (bookmarksSection) bookmarksSection.hidden = false;
    if (heroSection) heroSection.style.display = '';
    if (searchSection) searchSection.style.display = '';
    $('#btn-recent')?.classList.remove('active');
  }

  function renderRecentView() {
    const view = $('#recent-view');
    if (!view) return;
    view.innerHTML = '';

    const all = collectAllBookmarks();
    all.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
    const recent = all.slice(0, 50);

    // Header
    const header = document.createElement('div');
    header.className = 'recent-view-header';
    header.innerHTML = `
      <div class="recent-view-header-left">
        <h2 class="recent-view-title">Recently Added</h2>
        <p class="recent-view-desc">Your ${recent.length} most recently bookmarked pages, sorted by date added</p>
      </div>
      <button class="recent-view-back" id="recent-view-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back
      </button>
    `;
    view.appendChild(header);
    $('#recent-view-back')?.addEventListener('click', closeRecentView);

    if (recent.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'recent-empty';
      empty.textContent = 'No bookmarks found';
      view.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'recent-list';

    recent.forEach((bm, idx) => {
      const item = document.createElement('a');
      item.href = bm.url;
      item.target = '_blank';
      item.rel = 'noopener';
      item.className = 'recent-item';
      item.style.animationDelay = `${Math.min(idx * 20, 300)}ms`;
      const faviconUrl = getFaviconUrl(bm.url);
      let hostname = '';
      try { hostname = new URL(bm.url).hostname; } catch {}
      const time = relativeTime(bm.dateAdded);
      item.innerHTML = `
        <img class="recent-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">
        <div class="recent-info">
          <span class="recent-title">${escapeHTML(bm.title || bm.url)}</span>
          <span class="recent-url">${escapeHTML(hostname)}</span>
        </div>
        <span class="recent-time">${time}</span>
        <svg class="recent-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      `;
      list.appendChild(item);
    });

    view.appendChild(list);
  }

  function initRecentView() {
    $('#btn-recent')?.addEventListener('click', () => {
      recentViewOpen ? closeRecentView() : openRecentView();
    });
  }

  /* ---------- Init ---------- */
  function init() {
    loadSettings().then(() => {
      applyTheme();
      applyBackgroundImage();
      applyDisplayMode();
      applyLanguage();
      applyNavDisplay();
      updateGreeting();
      initClock();
      initFolderSidebar();   // must run after settings are loaded
      initPinnedSidebar();
      loadBookmarks();
    });

    // Event listeners (no settings dependency)
    btnTheme.addEventListener('click', toggleTheme);
    btnView.addEventListener('click', toggleDisplayMode);
    searchInput.addEventListener('input', handleSearch);
    window.addEventListener('scroll', handleScroll, { passive: true });
    backToTopBtn.addEventListener('click', scrollToTop);

    // Pinned sidebar (visibility set in loadBookmarks after settings load)
    if (pinnedSidebar && pinnedSidebarTrigger) {
      pinnedSidebarTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        pinnedSidebar.classList.toggle('pinned');
      });
      document.addEventListener('click', (e) => {
        if (pinnedSidebar.classList.contains('pinned') && !pinnedSidebar.contains(e.target)) {
          pinnedSidebar.classList.remove('pinned');
        }
      });
    }

    // Settings panel
    initSettingsPanel();

    // Google Apps menu
    initGoogleAppsMenu();

    // Domain graph dashboard
    initDomainView();

    // Recently added view
    initRecentView();

    // Keyboard shortcuts
    initKeyboardShortcuts();

    // Update greeting every minute
    setInterval(updateGreeting, 60000);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
