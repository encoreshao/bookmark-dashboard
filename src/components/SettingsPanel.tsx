import React, { useState, useEffect } from 'react';
import { useSettings, DEFAULTS } from '@/context/SettingsContext';
import { useUI } from '@/context/UIContext';
import { createTranslator } from '@/utils/i18n';
import { GOOGLE_APPS, ALL_APP_IDS, AppIcon } from '@/utils/googleApps';
import type { AppSettings, Theme, DisplayMode, Language, NavDisplay, PinnedDisplay, FolderSidebarMode, AIProvider } from '@/types';
import { getModelsForProvider, getDefaultModel } from '@/utils/ai';

const BG_PRESETS = [
  { label: 'None', value: '' },
  { label: 'Mountains', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920' },
  { label: 'Ocean', value: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920' },
  { label: 'Forest', value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920' },
  { label: 'City', value: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920' },
];

function Toggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactElement }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="sp-toggle-group">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`sp-toggle${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SettingsPanel() {
  const { settings, saveSettings } = useSettings();
  const { settingsPanelOpen, closeSettings, activeSettingsTab, setActiveSettingsTab, showToast } = useUI();
  const t = createTranslator(settings.language);

  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  useEffect(() => { if (settingsPanelOpen) setDraft({ ...settings }); }, [settingsPanelOpen]);

  if (!settingsPanelOpen) return null;

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  const handleSave = () => {
    saveSettings(draft);
    showToast(t('save-settings'));
    closeSettings();
  };

  const handleReset = () => {
    const preserved = { ...DEFAULTS, pinnedIds: settings.pinnedIds };
    setDraft(preserved);
  };

  const toggleApp = (id: string) => {
    const current = draft.visibleApps ?? ALL_APP_IDS;
    const next = current.includes(id) ? current.filter(a => a !== id) : [...current, id];
    set('visibleApps', next);
  };

  const handleProviderChange = (provider: AIProvider) => {
    set('aiProvider', provider);
    set('aiModel', getDefaultModel(provider));
  };

  const tabs = [
    { id: 'general',         label: t('tab-general') },
    { id: 'personalization', label: t('tab-personalization') },
    { id: 'ai-apps',         label: t('tab-ai-apps') },
  ];

  return (
    <>
      <div className="settings-overlay open" onClick={closeSettings} />
      <div className="settings-panel open" role="dialog" aria-modal="true">
        <div className="settings-panel-header">
          <div className="settings-panel-title-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <h2>{t('settings-title')}</h2>
          </div>
          <button className="settings-panel-close" onClick={closeSettings} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab${activeSettingsTab === tab.id ? ' active' : ''}`}
              data-tab={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-panel-body">

          {/* ═══════════ GENERAL ═══════════ */}
          {activeSettingsTab === 'general' && (
            <div className="settings-tab-pane active">
              <div className="sp-group">
                <label className="sp-label">{t('sp-display-name')}</label>
                <p className="sp-desc">{t('sp-display-name-desc')}</p>
                <input
                  type="text"
                  className="sp-input"
                  value={draft.userName}
                  onChange={e => set('userName', e.target.value)}
                />
              </div>

              <div className="sp-group">
                <label className="sp-label">{t('sp-language')}</label>
                <Toggle<Language>
                  value={draft.language}
                  onChange={v => set('language', v)}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'zh', label: '中文' },
                    { value: 'ja', label: '日本語' },
                  ]}
                />
              </div>

              <div className="sp-group">
                <label className="sp-label">{t('sp-display-mode')}</label>
                <Toggle<DisplayMode>
                  value={draft.displayMode}
                  onChange={v => set('displayMode', v)}
                  options={[
                    { value: 'list', label: 'List' },
                    { value: 'grid', label: 'Grid' },
                  ]}
                />
              </div>

              <div className="sp-group">
                <label className="sp-label">{t('sp-nav-display')}</label>
                <p className="sp-desc">{t('sp-nav-display-desc')}</p>
                <Toggle<NavDisplay>
                  value={draft.navDisplay}
                  onChange={v => set('navDisplay', v)}
                  options={[
                    { value: 'full', label: t('sp-nav-full') },
                    { value: 'compact', label: t('sp-nav-compact') },
                  ]}
                />
              </div>

              <div className="sp-group">
                <label className="sp-label">{t('sp-folder-sidebar')}</label>
                <p className="sp-desc">{t('sp-folder-sidebar-desc')}</p>
                <Toggle<FolderSidebarMode>
                  value={draft.folderSidebarMode}
                  onChange={v => set('folderSidebarMode', v)}
                  options={[
                    { value: 'pinned', label: 'Pinned' },
                    { value: 'float', label: 'Float' },
                  ]}
                />
              </div>

              <div className="sp-group">
                <label className="sp-label">{t('sp-pinned-display')}</label>
                <p className="sp-desc">{t('sp-pinned-display-desc')}</p>
                <Toggle<PinnedDisplay>
                  value={draft.pinnedDisplay}
                  onChange={v => set('pinnedDisplay', v)}
                  options={[
                    { value: 'top', label: 'Top of page' },
                    { value: 'sidebar', label: 'Right sidebar' },
                  ]}
                />
              </div>

              <div className="sp-divider" />

              <div className="sp-group">
                <label className="sp-label">{t('sp-theme')}</label>
                <Toggle<Theme>
                  value={draft.theme}
                  onChange={v => set('theme', v)}
                  options={[
                    { value: 'dark', label: 'Dark' },
                    { value: 'light', label: 'Light' },
                    { value: 'system', label: 'System' },
                  ]}
                />
              </div>

              <div className="sp-group">
                <label className="sp-label">{t('sp-bg-image')}</label>
                <p className="sp-desc">{t('sp-bg-image-desc')}</p>
                <div className="sp-bg-gallery">
                  {BG_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`sp-bg-thumb${draft.backgroundImage === preset.value ? ' active' : ''}${!preset.value ? ' sp-bg-thumb-none' : ''}`}
                      onClick={() => set('backgroundImage', preset.value)}
                      style={preset.value
                        ? { backgroundImage: `url(${preset.value})`, backgroundSize: 'cover' }
                        : undefined}
                    >
                      {!preset.value && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <p className="sp-desc" style={{ marginTop: 10 }}>{t('sp-bg-custom-url')}</p>
                <input
                  type="text"
                  className="sp-input"
                  placeholder="https://example.com/image.jpg"
                  value={draft.backgroundImage}
                  onChange={e => set('backgroundImage', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ═══════════ PERSONALIZATION ═══════════ */}
          {activeSettingsTab === 'personalization' && (
            <div className="settings-tab-pane active">
              <div className="sp-group">
                <label className="sp-label">{t('sp-ai-instructions')}</label>
                <p className="sp-desc">{t('sp-ai-instructions-desc')}</p>
                <textarea
                  className="sp-textarea"
                  rows={5}
                  placeholder={t('sp-ai-instructions-placeholder')}
                  value={draft.aiCustomInstructions}
                  onChange={e => set('aiCustomInstructions', e.target.value)}
                />
              </div>

              <div className="sp-divider" />

              <div className="sp-group">
                <label className="sp-label">{t('sp-google-account')}</label>
                <p className="sp-desc">{t('sp-google-account-desc')}</p>
                <button type="button" className="sp-btn-google-signin" id="sp-signin-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {t('sign-in-google')}
                </button>
                <div className="sp-sync-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  <div>
                    <strong>{t('sync-title')}</strong>
                    <p className="sp-desc">{t('sync-desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ AI & APPS ═══════════ */}
          {activeSettingsTab === 'ai-apps' && (
            <div className="settings-tab-pane active">
              <div className="sp-group">
                <label className="sp-label">{t('sp-ai-provider')}</label>
                <p className="sp-desc">{t('sp-ai-provider-desc')}</p>
                <Toggle<AIProvider>
                  value={draft.aiProvider}
                  onChange={handleProviderChange}
                  options={[
                    { value: 'openai', label: 'OpenAI' },
                    { value: 'gemini', label: 'Gemini' },
                    { value: 'claude', label: 'Claude' },
                  ]}
                />
              </div>

              <div className="sp-group">
                <label className="sp-label">{t('sp-ai-model')}</label>
                <p className="sp-desc">{t('sp-ai-model-desc')}</p>
                <select
                  className="sp-input sp-select"
                  value={draft.aiModel}
                  onChange={e => set('aiModel', e.target.value)}
                >
                  {getModelsForProvider(draft.aiProvider).map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="sp-group">
                <label className="sp-label">{t('sp-ai-api-key')}</label>
                <p className="sp-desc">{t('sp-ai-api-key-desc')}</p>
                <input
                  type="password"
                  className="sp-input"
                  placeholder="sk-..."
                  value={draft.aiApiKey}
                  onChange={e => set('aiApiKey', e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="sp-divider" />

              <div className="sp-group">
                <label className="sp-label">{t('sp-google-apps')}</label>
                <p className="sp-desc">{t('sp-google-apps-desc')}</p>
                <div className="sp-apps-grid">
                  {GOOGLE_APPS.map(app => {
                    const active = (draft.visibleApps ?? ALL_APP_IDS).includes(app.id);
                    return (
                      <label
                        key={app.id}
                        className={`sp-app-toggle${active ? ' active' : ''}`}
                        onClick={() => toggleApp(app.id)}
                      >
                        <AppIcon app={app} />
                        <span>{app.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="settings-panel-save">
          <button type="button" className="sp-btn sp-btn-secondary" onClick={handleReset}>
            {t('reset-defaults')}
          </button>
          <button type="button" className="sp-btn sp-btn-primary" onClick={handleSave}>
            {t('save-settings')}
          </button>
        </div>
      </div>
    </>
  );
}

export default SettingsPanel;
