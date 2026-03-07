import { useEffect, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { createTranslator } from '@/utils/i18n';

function Footer() {
  const { settings } = useSettings();
  const t = createTranslator(settings.language);
  const [version, setVersion] = useState('');
  const [extName, setExtName] = useState('Bookmark Dashboard');

  useEffect(() => {
    try {
      const mf = chrome.runtime.getManifest();
      setVersion(`v${mf.version}`);
      setExtName(mf.name);
    } catch { /* dev environment */ }
  }, []);

  return (
    <footer className="app-footer">
      <div className="app-footer-accent" />
      <div className="app-footer-inner">
        <span className="app-footer-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" className="app-footer-icon">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          {extName} <span className="app-footer-version">{version}</span>
        </span>
        <span className="app-footer-dot" />
        <span className="app-footer-author">Made by Encore Shao</span>
        <span className="app-footer-dot" />
        <a
          className="app-footer-link"
          href="https://github.com/encoreshao/bookmark-dashboard/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('footer-feedback')}
        </a>
      </div>
    </footer>
  );
}

export default Footer;
