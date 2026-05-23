import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import type { ParsedArticle } from '@/types/reading-list';

export async function fetchAndParse(url: string): Promise<ParsedArticle | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Set base URL so relative links resolve correctly inside the reader
    const base = doc.createElement('base');
    base.setAttribute('href', url);
    doc.head.prepend(base);

    const article = new Readability(doc).parse();
    if (!article) return null;

    return {
      title: article.title,
      byline: article.byline ?? null,
      content: DOMPurify.sanitize(article.content),
    };
  } catch {
    return null;
  }
}
