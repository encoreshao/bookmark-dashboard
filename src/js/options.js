/* ========================================
   Bookmark Dashboard - Options Page
   Vanilla JS
   ======================================== */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    theme: 'bd_theme',
    displayMode: 'bd_displayMode',
    userName: 'bd_userName',
    backgroundImage: 'bd_backgroundImage'
  };

  const DEFAULTS = {
    theme: 'dark',
    displayMode: 'list',
    userName: 'Guest',
    backgroundImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80'
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const form = $('#settings-form');
  const nameInput = $('#input-name');
  const bgImageInput = $('#input-bg-image');
  const bgPreview = $('#bg-preview');
  const bgPreviewImage = $('#bg-preview-image');
  const btnClearBg = $('#btn-clear-bg');
  const btnReset = $('#btn-reset');
  const toast = $('#toast');
  const toggleBtns = $$('.toggle-btn');

  let settings = {};

  function loadSettings() {
    return new Promise((resolve) => {
      const keys = Object.values(STORAGE_KEYS);
      chrome.storage.local.get(keys, (result) => {
        for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
          settings[key] = result[storageKey] !== undefined ? result[storageKey] : DEFAULTS[key];
        }
        resolve();
      });
    });
  }

  function updateBgPreview(url) {
    if (url && url.trim()) {
      bgPreviewImage.style.backgroundImage = `url('${url.trim()}')`;
      bgPreview.classList.add('visible');
    } else {
      bgPreviewImage.style.backgroundImage = '';
      bgPreview.classList.remove('visible');
    }
  }

  function applyToUI() {
    nameInput.value = settings.userName;
    bgImageInput.value = settings.backgroundImage || '';
    updateBgPreview(settings.backgroundImage);

    toggleBtns.forEach(btn => {
      const settingKey = btn.dataset.setting;
      const value = btn.dataset.value;
      btn.classList.toggle('active', settings[settingKey] === value);
    });
  }

  function saveSettings() {
    const toStore = {};
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      toStore[storageKey] = settings[key];
    }
    chrome.storage.local.set(toStore);
  }

  function showToast(message = 'Settings saved') {
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }

  function handleToggle(e) {
    const btn = e.currentTarget;
    const settingKey = btn.dataset.setting;
    const value = btn.dataset.value;

    settings[settingKey] = value;

    toggleBtns.forEach(b => {
      if (b.dataset.setting === settingKey) {
        b.classList.toggle('active', b.dataset.value === value);
      }
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    settings.userName = nameInput.value.trim() || DEFAULTS.userName;
    settings.backgroundImage = bgImageInput.value.trim();
    saveSettings();
    updateBgPreview(settings.backgroundImage);
    showToast('Settings saved');
  }

  function handleReset() {
    settings = { ...DEFAULTS };
    saveSettings();
    applyToUI();
    showToast('Settings reset to defaults');
  }

  function init() {
    loadSettings().then(() => {
      applyToUI();
    });

    toggleBtns.forEach(btn => btn.addEventListener('click', handleToggle));
    form.addEventListener('submit', handleSubmit);
    btnReset.addEventListener('click', handleReset);

    bgImageInput.addEventListener('input', () => {
      updateBgPreview(bgImageInput.value.trim());
    });

    btnClearBg.addEventListener('click', () => {
      bgImageInput.value = '';
      updateBgPreview('');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
