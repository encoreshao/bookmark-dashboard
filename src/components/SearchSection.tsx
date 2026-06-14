import { useRef, useState } from 'react';
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
  const [focused, setFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    ref.current?.focus();
  };

  return (
    <section className="search-section">
      <div className={`search-wrapper${focused ? ' is-focused' : ''}`}>
        <svg
          className="search-icon"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          ref={ref}
          id="search-input"
          type="text"
          className="search-input"
          placeholder={t('search-placeholder')}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="search-right-group">
          <span className="search-count" id="search-count" />
          {!value && (
            <span className="search-kbd-hint">⌘K</span>
          )}
          {value && (
            <button
              className="search-clear"
              onClick={handleClear}
              aria-label={t('clear-search')}
              tabIndex={-1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                   width="10" height="10"
                   aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default SearchSection;
