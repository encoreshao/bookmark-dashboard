import { useRef } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { createTranslator } from '@/utils/i18n';

interface Props {
  value: string;
  onChange: (q: string) => void;
}

function SearchSection({ value, onChange }: Props) {
  const { settings } = useSettings();
  const t = createTranslator(settings.language);
  const ref = useRef<HTMLInputElement>(null);

  // Global "/" shortcut handled in App.tsx focuses this input by id
  return (
    <section className="search-section">
      <div className="search-wrapper">
        <input
          ref={ref}
          id="search-input"
          type="text"
          className="search-input"
          placeholder={t('search-placeholder')}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        {value && (
          <span className="search-count" id="search-count">
            {/* count updated by BookmarkView */}
          </span>
        )}
      </div>
    </section>
  );
}

export default SearchSection;
