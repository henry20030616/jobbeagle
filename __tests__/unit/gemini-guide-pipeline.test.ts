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

describe('runPaidGuideModules source honesty', () => {
  const liveUrl = 'https://www.glassdoor.com/Interview/live';
  const goneUrl = 'https://www.glassdoor.com/Interview/gone';
  const intel = {
    questions: [
      { question: 'Live SQL question?', track: 'professional', origin: 'reported', proximity: 'same_company_role', source_url: liveUrl, source_date: '2025' },
      { question: 'Gone SQL question?', track: 'professional', origin: 'reported', proximity: 'same_company_role', source_url: goneUrl, source_date: '2025' },
    ],
    target: '$150K',
    ceiling: '$170K',
    rationale: 'Target total: x',
    buyer_seller: 'a',
    sources: [
      { title: 'Live', url: liveUrl },
      { title: 'Gone', url: goneUrl },
    ],
    summary_company: 'Culture: x',
    role_sources: [{ title: 'Gone', url: goneUrl }],
  };
  const sourceFetch = async (url: string) => ({ status: url === goneUrl ? 404 : 200, body: null });

  function allQuestions(bank: Awaited<ReturnType<typeof runPaidGuideModules>>['interview_bank']) {
    return [...bank.professional, ...bank.professional_extra, ...bank.behavioral, ...bank.behavioral_extra];
  }

  it('drops 404 links and downgrades their questions to predicted', async () => {
    getAnthropicApiKey.mockReturnValue('sk-ant-test');
    generateContent.mockResolvedValue(geminiJson(intel));

    const modules = await runPaidGuideModules({ ...input, sourceFetch });

    const questions = allQuestions(modules.interview_bank);
    expect(questions.find((q) => q.question === 'Live SQL question?')).toMatchObject({ origin: 'reported', source_url: liveUrl });
    expect(questions.find((q) => q.question === 'Gone SQL question?')).toMatchObject({ origin: 'predicted', source_url: null });
    expect(modules.salary_land.sources.map((s) => s.url)).toEqual([liveUrl]);
    expect(modules.company_eval.role_sources).toEqual([]);
  });

  it('does not label anything as web-sourced when search fell back to closed-book', async () => {
    getAnthropicApiKey.mockReturnValue('sk-ant-test');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    generateContent.mockImplementation(async (req: { config?: { tools?: unknown } }) => {
      if (req.config?.tools) throw new Error('search quota');
      return geminiJson(intel);
    });

    const modules = await runPaidGuideModules({ ...input, sourceFetch });
    warn.mockRestore();

    expect(allQuestions(modules.interview_bank).every((q) => q.origin === 'predicted')).toBe(true);
    expect(modules.salary_land.sources).toEqual([]);
    expect(modules.company_eval.sources).toEqual([]);
    expect(modules.limitations.some((line) => line.includes('Interview search unavailable'))).toBe(true);
  });
});
