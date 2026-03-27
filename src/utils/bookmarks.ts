import type { BookmarkNode, FolderItem } from '@/types';

export function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return '';
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}

/**
 * Flatten bookmark tree into a list of folder objects with their direct bookmark children.
 * Chrome's root children are "Bookmarks bar", "Other bookmarks", etc. We traverse into
 * subfolders with paths like "Dev / React". Root containers themselves are listed only
 * when they hold direct bookmark links (not only nested folders); otherwise those links
 * would be missing because URL nodes are not traversed separately.
 *
 * Only folders that contain at least one direct bookmark URL are included.
 * Each folder title is the full path from root (e.g. "Dev / React / Hooks").
 */
export function collectFolders(nodes: BookmarkNode[]): FolderItem[] {
  const ROOT_IDS = new Set(['0', '1', '2', '3']);
  const folders: FolderItem[] = [];

  function traverse(node: BookmarkNode, pathParts: string[]) {
    if (!node.url && node.children) {
      const isRoot = ROOT_IDS.has(node.id);
      const currentPath = isRoot ? pathParts : [...pathParts, node.title];
      const items = node.children.filter(c => c.url);
      if (node.title && items.length > 0) {
        const title = isRoot ? node.title : currentPath.join(' / ');
        folders.push({ id: node.id, title, items });
      }
      node.children.forEach(c => traverse(c, currentPath));
    }
  }

  nodes.forEach(n => traverse(n, []));
  return folders;
}

/** Filter folders/bookmarks by search query */
export function filterFolders(folders: FolderItem[], query: string): FolderItem[] {
  if (!query.trim()) return folders;
  const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return folders
    .map(f => ({ ...f, items: f.items.filter(b => re.test(b.title) || re.test(b.url ?? '')) }))
    .filter(f => f.items.length > 0 || re.test(f.title));
}

/** Find a single bookmark by ID across the whole tree */
export function findBookmarkById(nodes: BookmarkNode[], id: string): BookmarkNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findBookmarkById(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** Collect every bookmark URL node from the tree */
export function collectAllBookmarks(nodes: BookmarkNode[]): BookmarkNode[] {
  const results: BookmarkNode[] = [];
  function traverse(n: BookmarkNode) {
    if (n.url && n.dateAdded) results.push(n);
    n.children?.forEach(traverse);
  }
  nodes.forEach(traverse);
  return results;
}

/** Build domain → bookmark[] map from the whole tree */
export function buildDomainMap(nodes: BookmarkNode[]): Map<string, BookmarkNode[]> {
  const map = new Map<string, BookmarkNode[]>();
  function traverse(node: BookmarkNode) {
    if (node.url) {
      try {
        const host = new URL(node.url).hostname;
        if (!map.has(host)) map.set(host, []);
        map.get(host)!.push(node);
      } catch { /* invalid URL */ }
    }
    node.children?.forEach(traverse);
  }
  nodes.forEach(traverse);
  return map;
}

/** Deterministic HSL color from a domain string */
export function getDomainColor(domain: string): string {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

/** Build sidebar folder tree (hierarchical) */
export interface SidebarNode {
  id: string;
  title: string;
  count: number;
  children: SidebarNode[];
}

export function buildSidebarTree(nodes: BookmarkNode[], depth = 0, maxDepth = 8): SidebarNode[] {
  if (depth > maxDepth) return [];
  const result: SidebarNode[] = [];
  for (const node of nodes) {
    if (!node.url && node.children && node.title) {
      const count = node.children.filter(c => c.url).length;
      result.push({
        id: node.id,
        title: node.title,
        count,
        children: buildSidebarTree(node.children, depth + 1, maxDepth),
      });
    }
  }
  return result;
}
