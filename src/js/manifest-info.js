/* Shared manifest info — populates version, name & author across all pages */
(function () {
  'use strict';

  const manifest = chrome.runtime.getManifest();

  document.title = `Settings - ${manifest.name}`;

  document.querySelectorAll('#app-version').forEach(el => {
    el.textContent = `${manifest.name} v${manifest.version}`;
  });

  document.querySelectorAll('#app-subtitle').forEach(el => {
    el.textContent = `Customize your ${manifest.name}`;
  });

  document.querySelectorAll('#topbar-version').forEach(el => {
    el.textContent = `v${manifest.version}`;
  });

  document.querySelectorAll('#app-author').forEach(el => {
    el.textContent = manifest.author || '';
    if (el.tagName === 'A') {
      el.href = `https://github.com/${(manifest.author || '').toLowerCase().replace(/\s+/g, '')}/`;
    }
  });
})();
