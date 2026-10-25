import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const generateAnthropicJson = vi.hoisted(() => vi.fn());
const getAnthropicApiKey = vi.hoisted(() => vi.fn());
const generateContent = vi.hoisted(() => vi.fn());

vi.mock('@/lib/anthropic-writing', () => ({
  generateAnthropicJson,
  getAnthropicApiKey,
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { runPaidGuideModules } from '@/lib/gemini-guide-pipeline';

function geminiJson(payload: unknown) {
  return { text: JSON.stringify(payload) };
}

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'test-gemini');
  generateContent.mockResolvedValue(geminiJson({}));
  generateAnthropicJson.mockResolvedValue({});
});

afterEach(() => {
  vi.unstubAllEnvs();
  generateAnthropicJson.mockReset();
  getAnthropicApiKey.mockReset();
  generateContent.mockReset();
});

const input = {
  parts: [{ text: '<<<JOBBEAGLE_UNTRUSTED kind="job_description">>>\nSQL role\n<<<END_JOBBEAGLE_UNTRUSTED>>>' }],
  language: 'en' as const,
  companyName: 'Acme',
  jobTitle: 'Analyst',
};

describe('runPaidGuideModules provider split', () => {
  it('calls Claude for writing and Gemini+Search for intel when the Anthropic key is set', async () => {
    getAnthropicApiKey.mockReturnValue('sk-ant-test');
    await runPaidGuideModules(input);

    expect(generateAnthropicJson).toHaveBeenCalledTimes(3);
    expect(generateContent).toHaveBeenCalledTimes(3);

    const claudeSystems = generateAnthropicJson.mock.calls.map(
      (call) => (call[0] as { system: string }).system,
    );
    expect(claudeSystems.some((system) => system.includes('resume-adjustment'))).toBe(true);
    expect(claudeSystems.some((system) => system.includes('personalized answer directions'))).toBe(true);
    expect(claudeSystems.some((system) => system.includes('negotiation guidance'))).toBe(true);
    for (const system of claudeSystems) {
      expect(system).toContain('UNTRUSTED INPUT POLICY');
    }

    const geminiCalls = generateContent.mock.calls.map(
      (call) => call[0] as { config?: { tools?: unknown } },
    );
    expect(geminiCalls.every((call) => Boolean(call.config?.tools))).toBe(true);
  });

  it('falls writing back to Gemini Pro with search off when the Anthropic key is missing', async () => {
    getAnthropicApiKey.mockReturnValue(undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await runPaidGuideModules(input);
    error.mockRestore();

    expect(generateAnthropicJson).not.toHaveBeenCalled();
    expect(generateContent).toHaveBeenCalledTimes(6);

    const withSearch = generateContent.mock.calls.filter(
      (call) => Boolean((call[0] as { config?: { tools?: unknown } }).config?.tools),
    );
    const withoutSearch = generateContent.mock.calls.filter(
      (call) => !((call[0] as { config?: { tools?: unknown } }).config?.tools),
    );
    expect(withSearch).toHaveLength(3);
    expect(withoutSearch).toHaveLength(3);
  });
});
