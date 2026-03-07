import type { AIProvider, BookmarkNode } from '@/types';

/* ======== Model Registry ======== */

const AI_MODELS: Record<AIProvider, { label: string; value: string }[]> = {
  openai: [
    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
  ],
  gemini: [
    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
    { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro-preview-06-05' },
  ],
  claude: [
    { label: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
    { label: 'Claude Haiku', value: 'claude-haiku-4-20250414' },
  ],
};

export function getModelsForProvider(provider: AIProvider) {
  return AI_MODELS[provider] ?? [];
}

export function getDefaultModel(provider: AIProvider): string {
  return AI_MODELS[provider]?.[0]?.value ?? '';
}

/* ======== Data Types ======== */

export interface FlatBookmark {
  id: string;
  title: string;
  url: string;
  folderId: string;
  folderPath: string;
}

export interface FlatFolder {
  id: string;
  title: string;
  path: string;
  bookmarkCount: number;
}

export interface DuplicateGroup {
  url: string;
  bookmarks: FlatBookmark[];
}

export interface DeadLink {
  bookmark: FlatBookmark;
  reason: string;
}

export interface AIOverview {
  score: number;
  summary: string;
  insights: { type: 'info' | 'warning' | 'suggestion'; title: string; description: string }[];
  categories: { name: string; count: number; percentage: number }[];
}

export type AIActionType = 'move' | 'delete' | 'create_folder' | 'merge_folders' | 'rename_folder';

export interface AIAction {
  id: string;
  type: AIActionType;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  bookmarkIds?: string[];
  targetFolderId?: string;
  newFolderName?: string;
  parentFolderId?: string;
  sourceFolderIds?: string[];
  newName?: string;
}

export interface ReorganizeResult {
  summary: string;
  actions: AIAction[];
}

/* ======== Local Scanners (no AI needed) ======== */

function flattenTree(
  nodes: BookmarkNode[],
  parentPath = '',
  parentId = '',
): { bookmarks: FlatBookmark[]; folders: FlatFolder[] } {
  const bookmarks: FlatBookmark[] = [];
  const folders: FlatFolder[] = [];

  for (const node of nodes) {
    const path = parentPath ? `${parentPath}/${node.title}` : node.title;
    if (node.url) {
      bookmarks.push({
        id: node.id,
        title: node.title,
        url: node.url,
        folderId: parentId,
        folderPath: parentPath || '(root)',
      });
    }
    if (node.children) {
      if (node.title) {
        folders.push({
          id: node.id,
          title: node.title,
          path,
          bookmarkCount: node.children.filter(c => c.url).length,
        });
      }
      const sub = flattenTree(node.children, path, node.id);
      bookmarks.push(...sub.bookmarks);
      folders.push(...sub.folders);
    }
  }
  return { bookmarks, folders };
}

export function findDuplicates(nodes: BookmarkNode[]): DuplicateGroup[] {
  const { bookmarks } = flattenTree(nodes);
  const urlMap = new Map<string, FlatBookmark[]>();

  for (const bm of bookmarks) {
    try {
      const normalized = new URL(bm.url).href.replace(/\/+$/, '').toLowerCase();
      if (!urlMap.has(normalized)) urlMap.set(normalized, []);
      urlMap.get(normalized)!.push(bm);
    } catch { /* skip invalid URLs */ }
  }

  return Array.from(urlMap.entries())
    .filter(([, bms]) => bms.length > 1)
    .map(([url, bms]) => ({ url, bookmarks: bms }))
    .sort((a, b) => b.bookmarks.length - a.bookmarks.length);
}

export async function checkDeadLinks(
  nodes: BookmarkNode[],
  onProgress: (checked: number, total: number) => void,
  signal?: AbortSignal,
): Promise<DeadLink[]> {
  const { bookmarks } = flattenTree(nodes);
  const webBookmarks = bookmarks.filter(b => /^https?:\/\//.test(b.url));
  const dead: DeadLink[] = [];
  const batchSize = 5;

  for (let i = 0; i < webBookmarks.length; i += batchSize) {
    if (signal?.aborted) break;
    const batch = webBookmarks.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async bm => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(bm.url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (res.status >= 400) {
            dead.push({ bookmark: bm, reason: `HTTP ${res.status}` });
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          if (msg.includes('abort')) {
            dead.push({ bookmark: bm, reason: 'Timeout' });
          }
        }
      }),
    );
    void results;
    onProgress(Math.min(i + batchSize, webBookmarks.length), webBookmarks.length);
  }
  return dead;
}

export function getBookmarkStats(nodes: BookmarkNode[]) {
  const { bookmarks, folders } = flattenTree(nodes);
  const domains = new Set<string>();
  for (const bm of bookmarks) {
    try { domains.add(new URL(bm.url).hostname); } catch { /* skip */ }
  }
  const emptyFolders = folders.filter(f => f.bookmarkCount === 0);
  return {
    totalBookmarks: bookmarks.length,
    totalFolders: folders.length,
    totalDomains: domains.size,
    emptyFolders: emptyFolders.length,
    emptyFolderList: emptyFolders,
  };
}

/* ======== AI Prompt Builders ======== */

function buildStructuredData(nodes: BookmarkNode[]): string {
  const { bookmarks, folders } = flattenTree(nodes);
  const lines: string[] = [];

  lines.push(`=== FOLDERS (${folders.length}) ===`);
  for (const f of folders.slice(0, 100)) {
    lines.push(`FOLDER[id=${f.id}] "${f.title}" path="${f.path}" count=${f.bookmarkCount}`);
  }

  lines.push(`\n=== BOOKMARKS (${bookmarks.length}, showing first 400) ===`);
  for (const bm of bookmarks.slice(0, 400)) {
    lines.push(`BM[id=${bm.id}] "${bm.title}" url=${bm.url} folder="${bm.folderPath}"`);
  }

  return lines.join('\n');
}

function buildOverviewPrompt(nodes: BookmarkNode[], lang: string, customInstructions?: string): string {
  const data = buildStructuredData(nodes);
  const langNote = lang === 'zh' ? 'Respond in Chinese.' : lang === 'ja' ? 'Respond in Japanese.' : 'Respond in English.';
  const userNote = customInstructions?.trim() ? `\n\nAdditional user instructions:\n${customInstructions.trim()}\n` : '';

  return `You are a bookmark organization expert. Analyze this browser bookmark collection and provide a comprehensive overview. ${langNote}${userNote}

${data}

Respond ONLY with valid JSON (no markdown fences):
{
  "score": <1-100, overall organization quality>,
  "summary": "<one paragraph analysis of the bookmark collection, its strengths and weaknesses>",
  "insights": [
    { "type": "info|warning|suggestion", "title": "<short title>", "description": "<detail>" }
  ],
  "categories": [
    { "name": "<topic/category>", "count": <approx bookmarks>, "percentage": <of total> }
  ]
}

Provide 5-7 insights covering: folder structure quality, naming consistency, content diversity, potential issues (broken patterns, orphaned items), and improvement opportunities.
Provide 6-10 categories based on content themes you identify.`;
}

function buildReorganizePrompt(nodes: BookmarkNode[], lang: string, customInstructions?: string): string {
  const data = buildStructuredData(nodes);
  const langNote = lang === 'zh' ? 'Respond in Chinese.' : lang === 'ja' ? 'Respond in Japanese.' : 'Respond in English.';
  const userNote = customInstructions?.trim() ? `\n\nAdditional user instructions:\n${customInstructions.trim()}\n` : '';

  return `You are a bookmark organization expert. Analyze this bookmark collection and suggest CONCRETE reorganization actions. ${langNote}${userNote}

IMPORTANT: Use the exact bookmark IDs and folder IDs from the data below. Every action must reference real IDs.

${data}

Respond ONLY with valid JSON (no markdown fences):
{
  "summary": "<one paragraph explaining the reorganization strategy>",
  "actions": [
    {
      "type": "create_folder",
      "label": "<human-readable action label>",
      "description": "<why this helps>",
      "priority": "high|medium|low",
      "newFolderName": "<folder name>",
      "parentFolderId": "<existing folder ID to create under>"
    },
    {
      "type": "move",
      "label": "<human-readable label, e.g. 'Move dev tools together'>",
      "description": "<why>",
      "priority": "high|medium|low",
      "bookmarkIds": ["<real bookmark IDs from above>"],
      "targetFolderId": "<existing folder ID>"
    },
    {
      "type": "delete",
      "label": "<label>",
      "description": "<reason — e.g. duplicate, outdated>",
      "priority": "medium|low",
      "bookmarkIds": ["<real bookmark IDs>"]
    },
    {
      "type": "rename_folder",
      "label": "<label>",
      "description": "<why rename>",
      "priority": "low",
      "targetFolderId": "<folder ID>",
      "newName": "<better name>"
    },
    {
      "type": "merge_folders",
      "label": "<label>",
      "description": "<why merge>",
      "priority": "medium",
      "sourceFolderIds": ["<folder IDs to merge>"],
      "targetFolderId": "<keep this folder>",
      "newFolderName": "<optional new name>"
    }
  ]
}

Provide 5-10 specific, actionable operations. Focus on:
1. Moving scattered bookmarks of similar topics into proper folders
2. Creating new categorization folders that don't exist yet
3. Merging folders that overlap in purpose
4. Cleaning up empty or poorly named folders
5. Removing obviously outdated or duplicate bookmarks

Every bookmark ID and folder ID MUST come from the data above.`;
}

/* ======== AI API Callers ======== */

async function callOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callClaude(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callAI(provider: AIProvider, apiKey: string, model: string, prompt: string): Promise<string> {
  switch (provider) {
    case 'openai': return callOpenAI(apiKey, model, prompt);
    case 'gemini': return callGemini(apiKey, model, prompt);
    case 'claude': return callClaude(apiKey, model, prompt);
  }
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

/* ======== Public AI Functions ======== */

export async function runOverviewAnalysis(
  provider: AIProvider, apiKey: string, model: string,
  bookmarks: BookmarkNode[], lang: string, customInstructions?: string,
): Promise<AIOverview> {
  const prompt = buildOverviewPrompt(bookmarks, lang, customInstructions);
  const raw = await callAI(provider, apiKey, model, prompt);
  return parseJSON<AIOverview>(raw);
}

export async function runReorganizeAnalysis(
  provider: AIProvider, apiKey: string, model: string,
  bookmarks: BookmarkNode[], lang: string, customInstructions?: string,
): Promise<ReorganizeResult> {
  const prompt = buildReorganizePrompt(bookmarks, lang, customInstructions);
  const raw = await callAI(provider, apiKey, model, prompt);
  const result = parseJSON<ReorganizeResult>(raw);
  result.actions = result.actions.map((a, i) => ({ ...a, id: `action-${i}` }));
  return result;
}
