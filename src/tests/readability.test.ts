import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAndParse } from '@/utils/readability';

const ARTICLE_HTML = `<!DOCTYPE html><html><head><title>Test Article</title></head>
<body>
  <article>
    <h1>Test Article</h1>
    <p class="byline">By Jane Smith</p>
    <p>This is a paragraph with some content about the topic at hand.</p>
    <p>Another paragraph with more details to ensure readability picks it up.</p>
  </article>
</body></html>`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchAndParse', () => {
  it('returns parsed article for a valid HTML response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => ARTICLE_HTML,
    } as Response);

    const result = await fetchAndParse('https://example.com/article');
    expect(result).not.toBeNull();
    expect(result!.title).toBeTruthy();
    expect(result!.content).toBeTruthy();
    expect(typeof result!.content).toBe('string');
  });

  it('returns null when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const result = await fetchAndParse('https://example.com/article');
    expect(result).toBeNull();
  });

  it('returns null when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '',
    } as Response);
    const result = await fetchAndParse('https://example.com/article');
    expect(result).toBeNull();
  });

  it('strips script tags from content (DOMPurify sanitization)', async () => {
    const maliciousHtml = `<!DOCTYPE html><html><body>
      <article>
        <h1>Safe Article</h1>
        <p>Safe content here that is long enough for readability to parse it correctly.</p>
        <p>More safe content that ensures the article is picked up.</p>
        <script>alert('xss')</script>
        <p>Even more content to ensure Readability processes this document.</p>
      </article>
    </body></html>`;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => maliciousHtml,
    } as Response);

    const result = await fetchAndParse('https://example.com/article');
    expect(result).not.toBeNull();
    expect(result!.content).not.toContain('<script');
    expect(result!.content).not.toContain('alert(');
  });
});
