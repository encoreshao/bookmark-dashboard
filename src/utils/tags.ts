import type { TagMap, TagColorMap } from '@/types';

export const TAG_PALETTE = [
  '#cba6f7', // purple
  '#89b4fa', // blue
  '#a6e3a1', // green
  '#f38ba8', // pink
  '#fab387', // peach
  '#89dceb', // teal
  '#f9e2af', // yellow
  '#b4befe', // lavender
  '#94e2d5', // cyan
  '#eba0ac', // mauve
];

/** Lowercase, trim, collapse spaces to hyphens */
export function normalizeTag(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Pick the next unused palette color. Falls back to cycling by count
 * if all palette colors are taken.
 */
export function assignTagColor(existingColors: TagColorMap): string {
  const usedColors = new Set(Object.values(existingColors));
  const available = TAG_PALETTE.find(c => !usedColors.has(c));
  return available ?? TAG_PALETTE[Object.keys(existingColors).length % TAG_PALETTE.length];
}

/** Count how many bookmarks in tagMap have each tag. */
export function getTagCounts(tagMap: TagMap): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tags of Object.values(tagMap)) {
    for (const tag of tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}
