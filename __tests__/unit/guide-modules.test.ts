import { describe, expect, it } from 'vitest';
import {
  ANTHROPIC_WRITING_MODEL,
  GEMINI_FULL_MODEL,
  GEMINI_LITE_MODEL,
} from '@/constants/models';
import {
  applyInterviewAnswers,
  GUIDE_INTEL_MODULE_IDS,
  GUIDE_MODULE_ROUTES,
  GUIDE_WRITING_MODULE_IDS,
  parseGuideQuestions,
  resolveGuideModuleRoute,
  selectInterviewBank,
} from '@/lib/guide-modules';
import { QUESTION_RETRIEVAL_PROMPT } from '@/lib/prompts/guide-modules';
import type { GuideInterviewBank, GuideQuestion } from '@/types';
import { isCitableSourceUrl } from '@/lib/provenance';

describe('guide module routes', () => {
  it('keeps the free snapshot on Flash-Lite with search off', () => {
    const snapshot = GUIDE_MODULE_ROUTES.find((route) => route.id === 'snapshot');
    expect(snapshot).toEqual({
      id: 'snapshot',
      provider: 'gemini',
      model: GEMINI_LITE_MODEL,
      search: false,
    });
  });

  it('uses Gemini Pro with search only for salary, company, and question retrieval', () => {
    const searched = GUIDE_MODULE_ROUTES.filter((route) => route.search).map((route) => route.id);
    expect(searched).toEqual([...GUIDE_INTEL_MODULE_IDS]);
    for (const id of GUIDE_INTEL_MODULE_IDS) {
      const route = GUIDE_MODULE_ROUTES.find((item) => item.id === id);
      expect(route).toMatchObject({
        provider: 'gemini',
        model: GEMINI_FULL_MODEL,
        search: true,
      });
    }
  });

  it('routes writing modules to Claude Sonnet with search off', () => {
    for (const id of GUIDE_WRITING_MODULE_IDS) {
      const route = GUIDE_MODULE_ROUTES.find((item) => item.id === id);
      expect(route).toMatchObject({
        provider: 'anthropic',
        model: ANTHROPIC_WRITING_MODEL,
        search: false,
      });
    }
  });

  it('writes answers only after retrieval, and negotiation after salary', () => {
    const answers = GUIDE_MODULE_ROUTES.find((route) => route.id === 'question_answers');
    const negotiation = GUIDE_MODULE_ROUTES.find((route) => route.id === 'negotiation');
    expect(answers?.search).toBe(false);
    expect(answers?.after).toBe('question_retrieval');
    expect(negotiation?.search).toBe(false);
    expect(negotiation?.after).toBe('salary_land');
  });

  it('keeps writing on Claude when the Anthropic key is present', () => {
    for (const id of GUIDE_WRITING_MODULE_IDS) {
      expect(resolveGuideModuleRoute(id, true)).toMatchObject({
        provider: 'anthropic',
        model: ANTHROPIC_WRITING_MODEL,
        search: false,
      });
    }
  });

  it('falls writing back to Gemini Pro when the Anthropic key is missing', () => {
    for (const id of GUIDE_WRITING_MODULE_IDS) {
      expect(resolveGuideModuleRoute(id, false)).toMatchObject({
        provider: 'gemini',
        model: GEMINI_FULL_MODEL,
        search: false,
      });
    }
  });

  it('labels the questions summary process line as Hiring process / 招募流程', () => {
    expect(QUESTION_RETRIEVAL_PROMPT).toContain('Hiring process/招募流程');
    expect(QUESTION_RETRIEVAL_PROMPT).not.toContain('Process/流程,');
  });

  it('never routes intel or snapshot to Anthropic', () => {
    expect(resolveGuideModuleRoute('snapshot', true).provider).toBe('gemini');
    for (const id of GUIDE_INTEL_MODULE_IDS) {
      expect(resolveGuideModuleRoute(id, true)).toMatchObject({
        provider: 'gemini',
        model: GEMINI_FULL_MODEL,
        search: true,
      });
      expect(resolveGuideModuleRoute(id, false).provider).toBe('gemini');
    }
  });
});

describe('isCitableSourceUrl', () => {
  it('rejects example.com placeholders and keeps public interview hosts', () => {
    expect(isCitableSourceUrl('https://example.com/northstar/professional/5')).toBe(false);
    expect(isCitableSourceUrl('https://www.glassdoor.com/Interview/index.htm')).toBe(true);
  });
});

describe('selectInterviewBank', () => {
  it('keeps the 10 newest same-company questions and lists the overflow', () => {
    const questions = parseGuideQuestions(
      Array.from({ length: 12 }, (_, index) => ({
        question: `Pro ${index}`,
        track: 'professional',
        origin: 'reported',
        proximity: 'same_company_role',
        source_url: `https://www.glassdoor.com/Interview/${index}`,
        source_date: `2024-${String(index + 1).padStart(2, '0')}`,
      })),
    );
    const bank = selectInterviewBank(questions);
    expect(bank.professional).toHaveLength(10);
    expect(bank.professional[0]?.question).toBe('Pro 11');
    expect(bank.professional_extra.map((item) => item.question)).toEqual(['Pro 1', 'Pro 0']);
    expect(bank.behavioral).toHaveLength(0);
  });

  it('demotes a reported question with no URL and fills the rest with predictions', () => {
    const questions = parseGuideQuestions([
      {
        question: 'No source',
        track: 'behavioral',
        origin: 'reported',
        proximity: 'same_company_role',
        source_url: null,
      },
      {
        question: 'Real',
        track: 'behavioral',
        origin: 'reported',
        proximity: 'same_industry_role',
        source_url: 'https://www.glassdoor.com/Interview/index.htm',
        source_date: '2025-01',
      },
      {
        question: 'Predicted',
        track: 'behavioral',
        origin: 'predicted',
        source_url: null,
      },
    ]);
    const bank = selectInterviewBank(questions);
    expect(bank.behavioral.map((item) => item.question)).toEqual(['Real', 'No source', 'Predicted']);
    expect(bank.behavioral[1]?.origin).toBe('predicted');
    expect(bank.behavioral_extra).toHaveLength(0);
  });

  it('drops invented example.com sources so reported questions are not clickable placeholders', () => {
    const questions = parseGuideQuestions([
      {
        question: 'Placeholder',
        track: 'professional',
        origin: 'reported',
        proximity: 'same_industry_role',
        source_url: 'https://example.com/northstar/professional/5',
        source_date: '2025-01',
      },
    ]);
    expect(questions[0]?.origin).toBe('predicted');
    expect(questions[0]?.source_url).toBeNull();
  });
});

function q(question: string, answer = ''): GuideQuestion {
  return {
    question,
    track: 'professional',
    origin: 'predicted',
    proximity: null,
    source_url: null,
    source_date: null,
    answer,
  };
}

function bankOf(questions: string[]): GuideInterviewBank {
  return {
    professional: questions.slice(0, 2).map((text) => q(text)),
    behavioral: questions.slice(2, 4).map((text) => q(text)),
    professional_extra: questions.slice(4).map((text) => q(text)),
    behavioral_extra: [],
    process: '',
  };
}

describe('applyInterviewAnswers', () => {
  it('fills unique answers onto matching questions including extras', () => {
    const filled = applyInterviewAnswers(bankOf(['A', 'B', 'C', 'D', 'E']), {
      answers: [
        { question: 'A', answer: 'Queue ranking with the Looker board.' },
        { question: 'B', answer: 'SQL match then Looker triage.' },
        { question: 'C', answer: 'NACHA sit-with-owner plan.' },
        { question: 'D', answer: 'Merchant impact from cycle time.' },
        { question: 'E', answer: 'Handoff note for the next shift.' },
      ],
    });
    expect(filled.professional[0]?.answer).toMatch(/Queue ranking/);
    expect(filled.professional[1]?.answer).toMatch(/SQL match/);
    expect(filled.professional_extra[0]?.answer).toMatch(/Handoff/);
  });

  it('drops a cloned majority so identical answers never stamp the bank', () => {
    const clone =
      'Use only the resume fact: a 28% reconciliation cycle-time cut with SQL and Looker.';
    const filled = applyInterviewAnswers(bankOf(['A', 'B', 'C', 'D']), {
      answers: [
        { question: 'A', answer: clone },
        { question: 'B', answer: clone },
        { question: 'C', answer: clone },
        { question: 'D', answer: 'Unique merchant-payroll answer.' },
      ],
    });
    expect(filled.professional[0]?.answer).toBe('');
    expect(filled.professional[1]?.answer).toBe('');
    expect(filled.behavioral[0]?.answer).toBe('');
    expect(filled.behavioral[1]?.answer).toMatch(/merchant-payroll/);
  });
});
