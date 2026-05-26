import { readSkeletonSettings, writeSkeletonSettings } from '@/utils/skeletonSettings';

describe('skeletonSettings', () => {
  beforeEach(() => localStorage.clear());

  it('returns DEFAULTS when localStorage is empty', () => {
    const s = readSkeletonSettings();
    expect(s.theme).toBe('dark');
    expect(s.folderSidebarOpen).toBe(true);
    expect(s.folderSidebarMode).toBe('pinned');
    expect(s.displayMode).toBe('list');
    expect(s.navDisplay).toBe('compact');
    expect(s.pinnedDisplay).toBe('top');
  });

  it('returns cached theme after write', () => {
    writeSkeletonSettings({ theme: 'light' });
    expect(readSkeletonSettings().theme).toBe('light');
  });

  it('returns cached displayMode after write', () => {
    writeSkeletonSettings({ displayMode: 'grid' });
    expect(readSkeletonSettings().displayMode).toBe('grid');
  });

  it('returns cached folderSidebarOpen=false after write', () => {
    writeSkeletonSettings({ folderSidebarOpen: false });
    expect(readSkeletonSettings().folderSidebarOpen).toBe(false);
  });

  it('returns cached folderSidebarMode after write', () => {
    writeSkeletonSettings({ folderSidebarMode: 'float' });
    expect(readSkeletonSettings().folderSidebarMode).toBe('float');
  });

  it('leaves unwritten keys at their defaults', () => {
    writeSkeletonSettings({ theme: 'light' });
    const s = readSkeletonSettings();
    expect(s.displayMode).toBe('list');
    expect(s.folderSidebarOpen).toBe(true);
  });

  it('returns cached navDisplay after write', () => {
    writeSkeletonSettings({ navDisplay: 'full' });
    expect(readSkeletonSettings().navDisplay).toBe('full');
  });

  it('returns cached pinnedDisplay after write', () => {
    writeSkeletonSettings({ pinnedDisplay: 'sidebar' });
    expect(readSkeletonSettings().pinnedDisplay).toBe('sidebar');
  });

  it('ignores non-skeleton keys passed to writeSkeletonSettings', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writeSkeletonSettings({ userName: 'test' } as any);
    expect(localStorage.getItem('bd_sk_userName')).toBeNull();
  });
});
