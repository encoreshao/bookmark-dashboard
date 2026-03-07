import { useState, useCallback, useRef } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useUI } from '@/context/UIContext';
import { useBookmarks } from '@/context/BookmarkContext';
import { createTranslator } from '@/utils/i18n';
import {
  runOverviewAnalysis, runReorganizeAnalysis,
  findDuplicates, checkDeadLinks, getBookmarkStats,
  type AIOverview, type ReorganizeResult, type DuplicateGroup,
  type DeadLink, type AIAction,
} from '@/utils/ai';

type ScanMode = 'home' | 'overview' | 'duplicates' | 'dead-links' | 'reorganize';

interface AIInsightsViewProps {
  onBack: () => void;
}

function AIInsightsView({ onBack }: AIInsightsViewProps) {
  const { settings } = useSettings();
  const { openSettings, showToast, confirm } = useUI();
  const { allBookmarks, removeMultiple, moveMultiple, createFolder, renameBookmark, loadBookmarks } = useBookmarks();
  const t = createTranslator(settings.language);

  const [mode, setMode] = useState<ScanMode>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Results
  const [overview, setOverview] = useState<AIOverview | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[] | null>(null);
  const [deadLinks, setDeadLinks] = useState<DeadLink[] | null>(null);
  const [deadProgress, setDeadProgress] = useState({ checked: 0, total: 0 });
  const [reorganize, setReorganize] = useState<ReorganizeResult | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<string, 'pending' | 'done' | 'error'>>({});
  const deadLinkAbort = useRef<AbortController | null>(null);

  const hasKey = !!settings.aiApiKey;
  const stats = getBookmarkStats(allBookmarks);

  const goHome = () => { setMode('home'); setError(''); };

  /* ---- Runners ---- */

  const runOverview = useCallback(async () => {
    if (!hasKey) { openSettings('ai-apps'); return; }
    setMode('overview');
    setLoading(true);
    setError('');
    try {
      const result = await runOverviewAnalysis(
        settings.aiProvider, settings.aiApiKey, settings.aiModel, allBookmarks, settings.language,
        settings.aiCustomInstructions,
      );
      setOverview(result);
    } catch (e) {
      setError(t('ai-error'));
      console.error(e);
    } finally { setLoading(false); }
  }, [settings, allBookmarks, hasKey, openSettings, t]);

  const runDuplicates = useCallback(() => {
    setMode('duplicates');
    setLoading(true);
    setError('');
    setTimeout(() => {
      const groups = findDuplicates(allBookmarks);
      setDuplicates(groups);
      setLoading(false);
    }, 100);
  }, [allBookmarks]);

  const runDeadLinks = useCallback(async () => {
    setMode('dead-links');
    setLoading(true);
    setError('');
    setDeadLinks(null);
    setDeadProgress({ checked: 0, total: 0 });
    const controller = new AbortController();
    deadLinkAbort.current = controller;
    try {
      const result = await checkDeadLinks(
        allBookmarks,
        (checked, total) => setDeadProgress({ checked, total }),
        controller.signal,
      );
      setDeadLinks(result);
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(String(e));
        console.error(e);
      }
    } finally { setLoading(false); }
  }, [allBookmarks]);

  const cancelDeadLinks = () => {
    deadLinkAbort.current?.abort();
    setLoading(false);
  };

  const runReorganize = useCallback(async () => {
    if (!hasKey) { openSettings('ai-apps'); return; }
    setMode('reorganize');
    setLoading(true);
    setError('');
    setActionStatus({});
    try {
      const result = await runReorganizeAnalysis(
        settings.aiProvider, settings.aiApiKey, settings.aiModel, allBookmarks, settings.language,
        settings.aiCustomInstructions,
      );
      setReorganize(result);
    } catch (e) {
      setError(t('ai-error'));
      console.error(e);
    } finally { setLoading(false); }
  }, [settings, allBookmarks, hasKey, openSettings, t]);

  /* ---- Action Executors ---- */

  const executeAction = async (action: AIAction) => {
    const confirmed = await confirm(
      action.label,
      action.description,
    );
    if (!confirmed) return;

    setActionStatus(s => ({ ...s, [action.id]: 'pending' }));
    try {
      switch (action.type) {
        case 'move':
          if (action.bookmarkIds?.length && action.targetFolderId) {
            await moveMultiple(action.bookmarkIds, action.targetFolderId);
          }
          break;
        case 'delete':
          if (action.bookmarkIds?.length) {
            await removeMultiple(action.bookmarkIds);
          }
          break;
        case 'create_folder':
          if (action.newFolderName) {
            await createFolder(action.newFolderName, action.parentFolderId);
          }
          break;
        case 'rename_folder':
          if (action.targetFolderId && action.newName) {
            await renameBookmark(action.targetFolderId, action.newName);
          }
          break;
        case 'merge_folders':
          if (action.sourceFolderIds?.length && action.targetFolderId) {
            for (const srcId of action.sourceFolderIds) {
              if (srcId === action.targetFolderId) continue;
              const children = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) => {
                chrome.bookmarks.getChildren(srcId, (c) => resolve(c ?? []));
              });
              for (const child of children) {
                await new Promise<void>((resolve) => {
                  chrome.bookmarks.move(child.id, { parentId: action.targetFolderId! }, () => resolve());
                });
              }
              await new Promise<void>((resolve) => {
                chrome.bookmarks.removeTree(srcId, () => resolve());
              });
            }
            if (action.newFolderName) {
              await renameBookmark(action.targetFolderId, action.newFolderName);
            }
            loadBookmarks();
          }
          break;
      }
      setActionStatus(s => ({ ...s, [action.id]: 'done' }));
      showToast(`✓ ${action.label}`);
    } catch (e) {
      setActionStatus(s => ({ ...s, [action.id]: 'error' }));
      console.error('Action failed:', e);
      showToast(`✗ Failed: ${action.label}`);
    }
  };

  const deleteDuplicate = async (id: string, title: string) => {
    const ok = await confirm(t('remove-bookmark'), title);
    if (ok) {
      await removeMultiple([id]);
      if (duplicates) {
        setDuplicates(
          duplicates
            .map(g => ({ ...g, bookmarks: g.bookmarks.filter(b => b.id !== id) }))
            .filter(g => g.bookmarks.length > 1)
        );
      }
      showToast(t('removed'));
    }
  };

  const deleteDeadLink = async (id: string, title: string) => {
    const ok = await confirm(t('remove-bookmark'), title);
    if (ok) {
      await removeMultiple([id]);
      if (deadLinks) {
        setDeadLinks(deadLinks.filter(d => d.bookmark.id !== id));
      }
      showToast(t('removed'));
    }
  };

  /* ---- UI Helpers ---- */

  const scoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const insightIcon = (type: string) => {
    const colors: Record<string, string> = { warning: '#F59E0B', suggestion: '#6366F1', info: '#3B82F6' };
    const color = colors[type] ?? '#3B82F6';
    if (type === 'warning') return (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <path d="M12 9v4"/><path d="M12 17h.01"/>
      </svg>
    );
    if (type === 'suggestion') return (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.73-12.73 1.41-1.41"/>
      </svg>
    );
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    );
  };

  const actionTypeIcon = (type: string) => {
    switch (type) {
      case 'move': return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      );
      case 'delete': return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </svg>
      );
      case 'create_folder': return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>
        </svg>
      );
      case 'merge_folders': return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>
        </svg>
      );
      case 'rename_folder': return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        </svg>
      );
      default: return null;
    }
  };

  const priorityColor = (p: string) => {
    if (p === 'high') return '#EF4444';
    if (p === 'medium') return '#F59E0B';
    return '#6366F1';
  };

  /* ---- Render ---- */

  return (
    <div className="ai-view active">
      <div className="ai-header">
        <div>
          <button className="ai-back" onClick={mode === 'home' ? onBack : goHome}>
            {t('domain-back')}
          </button>
          <h2 className="ai-title">{t('ai-title')}</h2>
          <p className="ai-subtitle">{t('ai-subtitle')}</p>
        </div>
        {!hasKey && mode === 'home' && (
          <div className="ai-header-actions">
            <button className="ai-btn-setup" onClick={() => openSettings('ai-apps')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {t('ai-no-key')}
            </button>
          </div>
        )}
      </div>

      {error && <div className="ai-error">{error}</div>}

      {/* ---- HOME: Stats + Scan Mode Cards ---- */}
      {mode === 'home' && (
        <div className="ai-home">
          {/* Quick Stats */}
          <div className="ai-stats-bar">
            <div className="ai-stat"><span className="ai-stat-num">{stats.totalBookmarks}</span><span className="ai-stat-label">Bookmarks</span></div>
            <div className="ai-stat"><span className="ai-stat-num">{stats.totalFolders}</span><span className="ai-stat-label">Folders</span></div>
            <div className="ai-stat"><span className="ai-stat-num">{stats.totalDomains}</span><span className="ai-stat-label">Domains</span></div>
            <div className="ai-stat"><span className="ai-stat-num">{stats.emptyFolders}</span><span className="ai-stat-label">Empty Folders</span></div>
          </div>

          {/* Scan Mode Cards */}
          <div className="ai-modes-grid">
            <button className="ai-mode-card ai-mode-overview" onClick={runOverview}>
              <div className="ai-mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
                </svg>
              </div>
              <h3>Smart Analysis</h3>
              <p>AI-powered deep analysis of your bookmark organization, categories, and quality</p>
              <span className="ai-mode-badge ai-mode-badge-ai">AI</span>
            </button>

            <button className="ai-mode-card ai-mode-duplicates" onClick={runDuplicates}>
              <div className="ai-mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </div>
              <h3>Find Duplicates</h3>
              <p>Scan for duplicate bookmarks across all folders and clean them up with one click</p>
              <span className="ai-mode-badge ai-mode-badge-local">Instant</span>
            </button>

            <button className="ai-mode-card ai-mode-deadlinks" onClick={runDeadLinks}>
              <div className="ai-mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  <path d="m2 2 20 20"/>
                </svg>
              </div>
              <h3>Dead Link Scanner</h3>
              <p>Check all bookmarks for broken or unreachable URLs and remove the dead ones</p>
              <span className="ai-mode-badge ai-mode-badge-local">Instant</span>
            </button>

            <button className="ai-mode-card ai-mode-reorganize" onClick={runReorganize}>
              <div className="ai-mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>
                  <path d="M12 10v6"/><path d="m9 13 3 3 3-3"/>
                </svg>
              </div>
              <h3>Smart Reorganize</h3>
              <p>AI suggests folder restructuring with one-click actions: move, merge, create, rename</p>
              <span className="ai-mode-badge ai-mode-badge-ai">AI</span>
            </button>
          </div>

          {/* Future teaser */}
          <div className="ai-future-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M12 2v1m0 18v1m8.66-15.66-.71.71M4.05 19.95l-.71.71M22 12h-1M3 12H2m17.66 7.66-.71-.71M4.05 4.05l-.71-.71"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
            <div>
              <strong>Coming Soon: Knowledge Base</strong>
              <p>Full page content indexing — search and chat with your bookmarked knowledge using AI.</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- LOADING ---- */}
      {loading && mode !== 'dead-links' && (
        <div className="ai-loading">
          <div className="ai-gemini-loader">
            <div className="ai-gemini-icon">
              <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#gemGrad)" opacity="0.15"/>
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" fill="url(#gemGrad)"/>
                <defs>
                  <linearGradient id="gemGrad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#4285F4"/>
                    <stop offset="35%" stopColor="#9B72CB"/>
                    <stop offset="65%" stopColor="#D96570"/>
                    <stop offset="100%" stopColor="#D96570"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="ai-gemini-bars">
              <div className="ai-gemini-bar" style={{ width: '80%', animationDelay: '0s' }} />
              <div className="ai-gemini-bar" style={{ width: '60%', animationDelay: '0.15s' }} />
              <div className="ai-gemini-bar" style={{ width: '90%', animationDelay: '0.3s' }} />
            </div>
          </div>
          <p className="ai-loading-text">{t('ai-analyzing')}</p>
        </div>
      )}

      {/* ---- OVERVIEW RESULTS ---- */}
      {mode === 'overview' && overview && !loading && (
        <div className="ai-results">
          <div className="ai-score-section">
            <div className="ai-gauge" style={{ '--score-color': scoreColor(overview.score), '--score-pct': `${overview.score}` } as React.CSSProperties}>
              <svg viewBox="0 0 200 120" className="ai-gauge-svg">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="var(--bg-tertiary)" strokeWidth="12" strokeLinecap="round" />
                <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${(overview.score / 100) * 251.3} 251.3`} className="ai-gauge-arc" />
              </svg>
              <div className="ai-gauge-center">
                <span className="ai-gauge-num">{overview.score}</span>
                <span className="ai-gauge-of">/100</span>
              </div>
              <div className="ai-gauge-label">{t('ai-score')}</div>
              <div className="ai-gauge-ticks">
                <span>0</span><span>50</span><span>100</span>
              </div>
            </div>
            <div className="ai-summary-box">
              <h3>{t('ai-summary')}</h3>
              <p>{overview.summary}</p>
            </div>
          </div>

          <div className="ai-section">
            <h3 className="ai-section-title">{t('ai-insights')}</h3>
            <div className="ai-insights-grid">
              {overview.insights.map((insight, i) => (
                <div key={i} className={`ai-insight-card ai-insight-${insight.type}`}>
                  <div className="ai-insight-icon">{insightIcon(insight.type)}</div>
                  <div>
                    <strong>{insight.title}</strong>
                    <p>{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-section">
            <h3 className="ai-section-title">{t('ai-categories')}</h3>
            <div className="ai-categories-list">
              {overview.categories.map((cat, i) => (
                <div key={i} className="ai-category-row">
                  <span className="ai-cat-name">{cat.name}</span>
                  <div className="ai-cat-bar-wrap">
                    <div className="ai-cat-bar" style={{ width: `${Math.min(cat.percentage, 100)}%` }} />
                  </div>
                  <span className="ai-cat-count">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="ai-btn-analyze" onClick={runOverview} style={{ alignSelf: 'center' }}>
            {t('ai-reanalyze')}
          </button>
        </div>
      )}

      {/* ---- DUPLICATES RESULTS ---- */}
      {mode === 'duplicates' && duplicates && !loading && (
        <div className="ai-results">
          <div className="ai-dup-summary">
            {duplicates.length === 0 ? (
              <div className="ai-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
                </svg>
                <h3>No duplicates found!</h3>
                <p>Your bookmark collection is clean.</p>
              </div>
            ) : (
              <p className="ai-dup-count">
                Found <strong>{duplicates.length}</strong> duplicate {duplicates.length === 1 ? 'group' : 'groups'} ({duplicates.reduce((s, g) => s + g.bookmarks.length - 1, 0)} extra bookmarks)
              </p>
            )}
          </div>

          {duplicates.map((group, gi) => (
            <div key={gi} className="ai-dup-group">
              <div className="ai-dup-url">
                <a href={group.url} target="_blank" rel="noopener noreferrer">{group.url}</a>
                <span className="ai-dup-badge">{group.bookmarks.length}x</span>
              </div>
              <div className="ai-dup-list">
                {group.bookmarks.map((bm, bi) => (
                  <div key={bm.id} className="ai-dup-item">
                    <div className="ai-dup-item-info">
                      <span className="ai-dup-item-title">{bm.title || '(untitled)'}</span>
                      <span className="ai-dup-item-folder">{bm.folderPath}</span>
                    </div>
                    {bi > 0 && (
                      <button className="ai-dup-delete" onClick={() => deleteDuplicate(bm.id, bm.title)} title="Remove">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                    {bi === 0 && <span className="ai-dup-keep">keep</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- DEAD LINKS ---- */}
      {mode === 'dead-links' && (
        <div className="ai-results">
          {loading && (
            <div className="ai-dead-progress">
              <div className="ai-dead-progress-bar">
                <div className="ai-dead-progress-fill" style={{ width: deadProgress.total ? `${(deadProgress.checked / deadProgress.total) * 100}%` : '0%' }} />
              </div>
              <p>Checking {deadProgress.checked} / {deadProgress.total} bookmarks...</p>
              <button className="ai-btn-cancel" onClick={cancelDeadLinks}>Cancel</button>
            </div>
          )}

          {!loading && deadLinks && (
            <>
              {deadLinks.length === 0 ? (
                <div className="ai-empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
                  </svg>
                  <h3>All links are healthy!</h3>
                  <p>No broken links detected in your bookmarks.</p>
                </div>
              ) : (
                <>
                  <p className="ai-dup-count">
                    Found <strong>{deadLinks.length}</strong> potentially broken {deadLinks.length === 1 ? 'link' : 'links'}
                  </p>
                  <div className="ai-dead-list">
                    {deadLinks.map((dl) => (
                      <div key={dl.bookmark.id} className="ai-dead-item">
                        <div className="ai-dead-item-info">
                          <span className="ai-dead-item-title">{dl.bookmark.title || '(untitled)'}</span>
                          <a className="ai-dead-item-url" href={dl.bookmark.url} target="_blank" rel="noopener noreferrer">{dl.bookmark.url}</a>
                          <span className="ai-dead-item-meta">{dl.bookmark.folderPath} · {dl.reason}</span>
                        </div>
                        <button className="ai-dup-delete" onClick={() => deleteDeadLink(dl.bookmark.id, dl.bookmark.title)} title="Remove">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ---- REORGANIZE RESULTS ---- */}
      {mode === 'reorganize' && reorganize && !loading && (
        <div className="ai-results">
          <div className="ai-reorg-summary">
            <p>{reorganize.summary}</p>
          </div>

          <div className="ai-reorg-actions">
            <h3 className="ai-section-title">
              {t('ai-actions')}
              <span className="ai-reorg-count">{reorganize.actions.length} operations</span>
            </h3>

            {reorganize.actions.map(action => {
              const status = actionStatus[action.id];
              return (
                <div key={action.id} className={`ai-reorg-card ${status === 'done' ? 'ai-reorg-done' : ''}`}>
                  <div className="ai-reorg-card-left">
                    <span className="ai-reorg-type-icon" style={{ color: priorityColor(action.priority) }}>
                      {actionTypeIcon(action.type)}
                    </span>
                    <div className="ai-reorg-card-body">
                      <div className="ai-reorg-card-header">
                        <span className="ai-action-priority" style={{ background: priorityColor(action.priority) }}>
                          {action.priority}
                        </span>
                        <span className="ai-reorg-type-badge">{action.type.replace('_', ' ')}</span>
                      </div>
                      <strong>{action.label}</strong>
                      <p>{action.description}</p>
                      {action.bookmarkIds && (
                        <span className="ai-reorg-affected">
                          {action.bookmarkIds.length} bookmark{action.bookmarkIds.length > 1 ? 's' : ''} affected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ai-reorg-card-right">
                    {status === 'done' ? (
                      <span className="ai-reorg-status-done">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
                        </svg>
                        Done
                      </span>
                    ) : status === 'error' ? (
                      <span className="ai-reorg-status-error">Failed</span>
                    ) : (
                      <button className="ai-reorg-apply-btn" onClick={() => executeAction(action)} disabled={status === 'pending'}>
                        {status === 'pending' ? (
                          <span className="ai-loading-spinner" style={{ width: 16, height: 16 }} />
                        ) : (
                          <>Apply</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="ai-btn-analyze" onClick={runReorganize} style={{ alignSelf: 'center' }}>
            {t('ai-reanalyze')}
          </button>
        </div>
      )}
    </div>
  );
}

export default AIInsightsView;
