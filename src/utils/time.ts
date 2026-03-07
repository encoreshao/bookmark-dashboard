import type { Language } from '@/types';

const LOCALE_MAP: Record<Language, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
};

const RELATIVE_LABELS: Record<Language, {
  now: string;
  m: string; h: string; d: string; w: string; mo: string; y: string;
}> = {
  en: { now: 'just now', m: 'm ago', h: 'h ago', d: 'd ago', w: 'w ago', mo: 'mo ago', y: 'y ago' },
  zh: { now: '刚刚', m: '分钟前', h: '小时前', d: '天前', w: '周前', mo: '个月前', y: '年前' },
  ja: { now: 'たった今', m: '分前', h: '時間前', d: '日前', w: '週間前', mo: 'ヶ月前', y: '年前' },
};

export function relativeTime(ms: number, lang: Language = 'en'): string {
  const labels = RELATIVE_LABELS[lang] ?? RELATIVE_LABELS.en;
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return labels.now;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}${labels.m}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${labels.h}`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}${labels.d}`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}${labels.w}`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}${labels.mo}`;
  return `${Math.floor(mo / 12)}${labels.y}`;
}

export function formatClock(date: Date, lang: Language = 'en'): { time: string; dateStr: string } {
  const locale = LOCALE_MAP[lang] ?? LOCALE_MAP.en;

  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dateStr = date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return { time, dateStr };
}
