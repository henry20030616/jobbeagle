import { describe, expect, it } from 'vitest';
import {
  composeQuestionsSummary,
  mergeInterviewSummary,
  parseQuestionsSummary,
  QUESTIONS_SUMMARY_MAX,
} from '@/lib/questions-summary';
import { getSampleStrategyGuideReport } from '@/lib/sample-reports';
import { SAMPLE_GUIDE_NARRATIVE } from '@/lib/sample-guide-locale';

describe('parseQuestionsSummary', () => {
  it('splits 總結分析 into a process line plus two analysis columns', () => {
    const parsed = parseQuestionsSummary(SAMPLE_GUIDE_NARRATIVE['zh-TW'].questions_summary);
    expect(parsed.process).toMatch(/^招募流程：/);
    expect(parsed.process).toMatch(/約三週/);
    expect(parsed.professional.length).toBe(3);
    expect(parsed.behavioral.length).toBe(3);
    expect(parsed.professional.join('\n')).toMatch(/ACH/);
    expect(parsed.professional.join('\n')).toMatch(/截止/);
    expect(parsed.professional.join('\n')).toMatch(/SQL/);
    expect(parsed.behavioral.join('\n')).toMatch(/書面狀態/);
    expect(parsed.behavioral.join('\n')).toMatch(/跨團隊/);
    expect(parsed.professional.join('\n')).not.toMatch(/^ACH 退票、截止、SQL 核對/);
  });

  it('reads English headers that end with a colon and no trailing space', () => {
    const parsed = parseQuestionsSummary(SAMPLE_GUIDE_NARRATIVE.en.questions_summary);
    expect(parsed.process).toMatch(/^Hiring process:/);
    expect(parsed.professional[0]).toMatch(/ACH returns queue/);
    expect(parsed.behavioral[0]).toMatch(/written status/);
  });

  it('still reads the old three-line keyword dump', () => {
    const parsed = parseQuestionsSummary(
      '招募流程：約三週。\n專業題：ACH 退票、截止、SQL 核對。\n行為題：書面狀態與跨團隊失誤。',
    );
    expect(parsed.process).toBe('招募流程：約三週。');
    expect(parsed.professional).toEqual(['ACH 退票、截止、SQL 核對。']);
    expect(parsed.behavioral).toEqual(['書面狀態與跨團隊失誤。']);
  });
});

describe('mergeInterviewSummary', () => {
  it('keeps the hiring-process line and overwrites analysis from writing fields', () => {
    const merged = mergeInterviewSummary(
      SAMPLE_GUIDE_NARRATIVE.en.questions_summary,
      {
        professional_analysis: 'Probe the ACH returns queue against cutoff.\nPrepare one SQL close from the resume.',
        behavioral_analysis: 'Probe written status under cutoff.\nPrepare a cross-team miss STAR.',
      },
    );
    const parsed = parseQuestionsSummary(merged);
    expect(parsed.process).toMatch(/^Hiring process:/);
    expect(parsed.professional).toEqual([
      'Probe the ACH returns queue against cutoff.',
      'Prepare one SQL close from the resume.',
    ]);
    expect(parsed.behavioral).toEqual([
      'Probe written status under cutoff.',
      'Prepare a cross-team miss STAR.',
    ]);
  });

  it('does not clip a full analysis block at 800 characters', () => {
    const block = 'A'.repeat(900);
    const composed = composeQuestionsSummary({
      process: 'Hiring process: three weeks.',
      professional: [block],
      behavioral: ['Written status.'],
      locale: 'en',
    });
    expect(composed.length).toBeGreaterThan(800);
    expect(composed.length).toBeLessThanOrEqual(QUESTIONS_SUMMARY_MAX);
    expect(parseQuestionsSummary(composed).professional[0]?.length).toBe(900);
  });
});

describe('sample interview summaries', () => {
  it.each(['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar'] as const)(
    'gives %s a process line plus professional and behavioral analysis',
    (lang) => {
      const summary = getSampleStrategyGuideReport(lang).guide_modules!.interview_bank.summary ?? '';
      const parsed = parseQuestionsSummary(summary);
      expect(parsed.process.length).toBeGreaterThan(10);
      expect(parsed.professional.length).toBeGreaterThanOrEqual(2);
      expect(parsed.behavioral.length).toBeGreaterThanOrEqual(2);
      expect(summary).toMatch(/ACH/);
      expect(parsed.professional.join(' ')).not.toMatch(
        /^(ACH returns, cutoff, and SQL checks\.|ACH 退票、截止、SQL 核對。)$/,
      );
    },
  );
});
