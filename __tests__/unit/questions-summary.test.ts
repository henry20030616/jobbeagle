import { describe, expect, it } from 'vitest';
import {
  analysisSearchText,
  composeQuestionsSummary,
  mergeInterviewSummary,
  parseQuestionsSummary,
  QUESTIONS_SUMMARY_MAX,
} from '@/lib/questions-summary';
import { getSampleStrategyGuideReport } from '@/lib/sample-reports';
import { SAMPLE_GUIDE_NARRATIVE } from '@/lib/sample-guide-locale';

describe('parseQuestionsSummary', () => {
  it('splits 總結分析 into titled professional and behavioral points', () => {
    const parsed = parseQuestionsSummary(SAMPLE_GUIDE_NARRATIVE['zh-TW'].questions_summary);
    expect(parsed.process).toMatch(/^招募流程：/);
    expect(parsed.process).toMatch(/約三週/);
    expect(parsed.professional).toHaveLength(3);
    expect(parsed.behavioral).toHaveLength(3);
    expect(parsed.professional[0]).toMatchObject({
      title: '數據專業要求',
      gist: '面試重點考察 SQL 等數據能力',
    });
    expect(parsed.professional[1]?.title).toBe('席位第一天工作');
    expect(parsed.professional[2]?.title).toBe('履歷準備範圍');
    expect(parsed.behavioral[0]?.title).toBe('書面狀態交接');
    expect(parsed.behavioral[1]?.title).toBe('遠端書面營運');
    expect(parsed.behavioral[2]?.title).toBe('STAR 準備');
    expect(analysisSearchText(parsed.professional)).toMatch(/ACH/);
    expect(analysisSearchText(parsed.professional)).toMatch(/截止/);
    expect(analysisSearchText(parsed.professional)).toMatch(/SQL/);
    expect(analysisSearchText(parsed.behavioral)).toMatch(/書面狀態/);
    expect(analysisSearchText(parsed.behavioral)).toMatch(/跨團隊/);
    expect(analysisSearchText(parsed.professional)).not.toMatch(/^ACH 退票、截止、SQL 核對/);
  });

  it('reads English titled points', () => {
    const parsed = parseQuestionsSummary(SAMPLE_GUIDE_NARRATIVE.en.questions_summary);
    expect(parsed.process).toMatch(/^Hiring process:/);
    expect(parsed.professional[0]?.title).toBe('Data skill probe');
    expect(parsed.professional[0]?.body).toMatch(/ACH returns queue/);
    expect(parsed.behavioral[0]?.title).toBe('Written handoff');
    expect(parsed.behavioral[0]?.body).toMatch(/written status/);
  });

  it('still reads the old three-line keyword dump', () => {
    const parsed = parseQuestionsSummary(
      '招募流程：約三週。\n專業題：ACH 退票、截止、SQL 核對。\n行為題：書面狀態與跨團隊失誤。',
    );
    expect(parsed.process).toBe('招募流程：約三週。');
    expect(parsed.professional).toEqual([{ title: '', gist: '', body: 'ACH 退票、截止、SQL 核對。' }]);
    expect(parsed.behavioral).toEqual([{ title: '', gist: '', body: '書面狀態與跨團隊失誤。' }]);
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
      { title: '', gist: '', body: 'Probe the ACH returns queue against cutoff.' },
      { title: '', gist: '', body: 'Prepare one SQL close from the resume.' },
    ]);
    expect(parsed.behavioral).toEqual([
      { title: '', gist: '', body: 'Probe written status under cutoff.' },
      { title: '', gist: '', body: 'Prepare a cross-team miss STAR.' },
    ]);
  });

  it('accepts structured title/body analysis from the writing module', () => {
    const merged = mergeInterviewSummary(
      SAMPLE_GUIDE_NARRATIVE.en.questions_summary,
      {
        professional_analysis: [
          {
            title: 'Data skill probe',
            body: 'The interview tests SQL. Sequence an ACH returns queue against cutoff.',
          },
        ],
        behavioral_analysis: [
          { title: 'Written handoff', body: 'The interview tests whether a status can be acted on.' },
        ],
      },
    );
    const parsed = parseQuestionsSummary(merged);
    expect(parsed.process).toMatch(/^Hiring process:/);
    expect(parsed.professional[0]).toMatchObject({
      title: 'Data skill probe',
      gist: 'The interview tests SQL.',
      body: 'Sequence an ACH returns queue against cutoff.',
    });
    expect(parsed.behavioral[0]?.title).toBe('Written handoff');
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
    expect(parseQuestionsSummary(composed).professional[0]?.body.length).toBe(900);
  });
});

describe('sample interview summaries', () => {
  it.each(['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar'] as const)(
    'gives %s titled professional and behavioral analysis',
    (lang) => {
      const summary = getSampleStrategyGuideReport(lang).guide_modules!.interview_bank.summary ?? '';
      const parsed = parseQuestionsSummary(summary);
      expect(parsed.process.length).toBeGreaterThan(10);
      expect(parsed.professional.length).toBe(3);
      expect(parsed.behavioral.length).toBe(3);
      expect(parsed.professional.every((point) => point.title.length > 0)).toBe(true);
      expect(parsed.behavioral.every((point) => point.title.length > 0)).toBe(true);
      expect(summary).toMatch(/ACH/);
      expect(analysisSearchText(parsed.professional)).not.toMatch(
        /^(ACH returns, cutoff, and SQL checks\.|ACH 退票、截止、SQL 核對。)$/,
      );
    },
  );
});
