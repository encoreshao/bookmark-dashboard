/* Bookmark Dashboard - Service Worker (Manifest V3) */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Bookmark Dashboard installed');
  }
});
