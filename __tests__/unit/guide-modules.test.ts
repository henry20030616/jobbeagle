import { describe, expect, it } from 'vitest';
import { GEMINI_FULL_MODEL, GEMINI_LITE_MODEL } from '@/constants/models';
import {
  GUIDE_MODULE_ROUTES,
  parseGuideQuestions,
  selectInterviewBank,
} from '@/lib/guide-modules';
import { isCitableSourceUrl } from '@/lib/provenance';

describe('guide module routes', () => {
  it('keeps the free snapshot on Flash-Lite with search off', () => {
    const snapshot = GUIDE_MODULE_ROUTES.find((route) => route.id === 'snapshot');
    expect(snapshot).toEqual({
      id: 'snapshot',
      model: GEMINI_LITE_MODEL,
      search: false,
    });
  });

  it('uses Pro with search only for salary, company, and question retrieval', () => {
    const searched = GUIDE_MODULE_ROUTES.filter((route) => route.search).map((route) => route.id);
    expect(searched).toEqual(['salary_land', 'company_intel', 'question_retrieval']);
    for (const route of GUIDE_MODULE_ROUTES) {
      if (route.id === 'snapshot') continue;
      expect(route.model).toBe(GEMINI_FULL_MODEL);
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
