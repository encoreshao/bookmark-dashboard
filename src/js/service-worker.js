/* Service Worker (Manifest V3) */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    const name = chrome.runtime.getManifest().name;
    console.log(`${name} installed`);
  }
});
