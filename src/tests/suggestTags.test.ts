import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestTags } from '@/utils/ai';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('suggestTags', () => {
  it('returns parsed tag array on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["react", "tutorial", "frontend"]' } }],
      }),
    } as Response);

    const result = await suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'How to Learn React', 'https://css-tricks.com/react');
    expect(result).toEqual(['react', 'tutorial', 'frontend']);
  });

  it('returns at most 3 tags even when AI returns more', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["a", "b", "c", "d", "e"]' } }],
      }),
    } as Response);

    const result = await suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'Title', 'https://example.com');
    expect(result).toHaveLength(3);
  });

  it('returns empty array when AI returns malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Here are some tags: react, tutorial' } }],
      }),
    } as Response);

    const result = await suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'Title', 'https://example.com');
    expect(result).toEqual([]);
  });

  it('throws when the API returns an error status (propagates for Retry UI)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    await expect(
      suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'Title', 'https://example.com')
    ).rejects.toThrow('OpenAI API error: 401');
  });

  it('filters non-string values from the parsed array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '["react", 42, null, "tutorial"]' } }],
      }),
    } as Response);

    const result = await suggestTags('openai', 'sk-test', 'gpt-4o-mini', 'Title', 'https://example.com');
    expect(result).toEqual(['react', 'tutorial']);
  });

  it('returns parsed tag array when using Gemini provider', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '["typescript", "testing", "vitest"]' }] } }],
      }),
    } as Response);

    const result = await suggestTags('gemini', 'gemini-key', 'gemini-2.0-flash', 'Testing with Vitest', 'https://vitest.dev');
    expect(result).toEqual(['typescript', 'testing', 'vitest']);
  });
});
