import { readSkeletonSettings } from '@/utils/skeletonSettings';
import type { DisplayMode } from '@/types';

// Shared by AppSkeleton (settings-load phase) and BookmarkView (bookmark-load phase).
export function BookmarkAreaSkeleton({ displayMode }: { displayMode: DisplayMode }) {
  if (displayMode === 'grid') {
    return (
      <section className="bookmarks-section">
        <div id="bookmarks">
          {[0, 1].map(i => (
            <div key={i} className="bookmark-folder view-grid" style={{ marginBottom: 16 }}>
              <div className="folder-header">
                <div className="skel" style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0 }} />
                <div className="skel" style={{ width: 100 + i * 40, height: 12, borderRadius: 4 }} />
                <div className="skel" style={{ width: 28, height: 12, borderRadius: 4, marginLeft: 'auto' }} />
              </div>
              <div className="folder-items" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, padding: 8 }}>
                {[0, 1, 2, 3, 4, 5].map(j => (
                  <div key={j} className="skel" style={{ height: 80, borderRadius: 8 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // list or compact
  const isCompact = displayMode === 'compact';
  return (
    <section className="bookmarks-section">
      <div id="bookmarks">
        {[3, 4, 2].map((rowCount, i) => (
          <div key={i} className={`bookmark-folder ${isCompact ? 'view-compact' : 'view-list'}`} style={{ marginBottom: 16 }}>
            <div className="folder-header">
              <div className="skel" style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0 }} />
              <div className="skel" style={{ width: 80 + i * 35, height: 12, borderRadius: 4 }} />
              <div className="skel" style={{ width: 28, height: 12, borderRadius: 4, marginLeft: 'auto' }} />
            </div>
            <div className="folder-items">
              {Array.from({ length: rowCount }).map((_, j) => (
                <div key={j} className="skel" style={{ height: isCompact ? 28 : 40, borderRadius: 6, marginBottom: 4 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AppSkeleton() {
  const sk = readSkeletonSettings();
  const isPinned = sk.folderSidebarMode === 'pinned';

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">
            <div className="skel" style={{ width: 22, height: 22, borderRadius: 4 }} />
          </div>
          <div className="skel" style={{ width: 140, height: 13, borderRadius: 4 }} />
        </div>
        <nav className="topbar-nav">
          {[72, 60, 68].map((w, i) => (
            <div key={i} className="skel" style={{ width: w, height: 30, borderRadius: 8 }} />
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skel" style={{ width: 32, height: 32, borderRadius: 6 }} />
          <div className="skel" style={{ width: 32, height: 32, borderRadius: 6 }} />
        </div>
      </header>

      {sk.folderSidebarOpen && (
        <nav className={`folder-sidebar${isPinned ? ' pinned' : ''}`}>
          <div className="folder-sidebar-panel" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isPinned ? (
              <>
                <div className="skel" style={{ width: '55%', height: 8, borderRadius: 3, marginBottom: 6 }} />
                {[130, 95, 115, 75, 105].map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px' }}>
                    <div className="skel" style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0 }} />
                    <div className="skel" style={{ width: w, height: 8, borderRadius: 3 }} />
                    <div className="skel" style={{ width: 20, height: 8, borderRadius: 3, marginLeft: 'auto' }} />
                  </div>
                ))}
                <div className="skel" style={{ width: '45%', height: 8, borderRadius: 3, marginTop: 10, marginBottom: 6 }} />
                {[105, 80].map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px' }}>
                    <div className="skel" style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0 }} />
                    <div className="skel" style={{ width: w, height: 8, borderRadius: 3 }} />
                    <div className="skel" style={{ width: 20, height: 8, borderRadius: 3, marginLeft: 'auto' }} />
                  </div>
                ))}
              </>
            ) : (
              [0, 1, 2, 3].map(i => (
                <div key={i} className="skel" style={{ width: 32, height: 32, borderRadius: 8, margin: '0 auto' }} />
              ))
            )}
          </div>
        </nav>
      )}

      {sk.pinnedDisplay === 'sidebar' && (
        <nav className="pinned-sidebar">
          <div className="pinned-sidebar-panel" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skel" style={{ width: 36, height: 36, borderRadius: 8 }} />
            ))}
          </div>
        </nav>
      )}

      <main className="main-content">
        <div className="skel" style={{ height: 52, borderRadius: 12, margin: '32px 24px 16px' }} />
        <div className="skel" style={{ height: 40, borderRadius: 20, width: '60%', margin: '0 auto 24px' }} />
        <BookmarkAreaSkeleton displayMode={sk.displayMode} />
      </main>
    </>
  );
}
