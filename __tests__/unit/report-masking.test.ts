import { describe, it, expect } from 'vitest';
import {
  isReportPremiumUnlocked,
  maskPremiumReportFields,
} from '@/lib/report-masking';
import type { InterviewReport } from '@/types';

const fullReport: InterviewReport = {
  basic_analysis: {
    job_title: 'Engineer',
    company_overview: 'Overview',
    business_scope: 'Scope',
    company_trends: 'Trends',
    job_summary: 'Summary',
    hard_requirements: ['TypeScript'],
  },
  salary_analysis: {
    estimated_range: '100k',
    market_position: 'mid',
    negotiation_tip: 'Ask for 10% more',
    rationale: 'Market data',
  },
  reviews_analysis: {
    company_reviews: { summary: 'ok', pros: [], cons: [] },
    job_reviews: { summary: 'ok', pros: [], cons: [] },
    real_interview_questions: [
      { question: 'Q1', job_title: 'Co', year: '2024' },
    ],
  },
  market_analysis: {
    industry_trends: 'trends',
    positioning: 'pos',
    competition_table: [],
    key_advantages: [],
    potential_risks: [],
  },
  match_analysis: {
    score: 70,
    matching_points: [],
    skill_gaps: [],
  },
  interview_preparation: {
    questions: [{ question: 'Tech Q', source: 'JD', answer_guide: 'Guide' }],
  },
  references: { deep_research: [], data_citations: [] },
};

describe('maskPremiumReportFields', () => {
  it('removes interview_preparation entirely', () => {
    const masked = maskPremiumReportFields(fullReport);
    expect(masked.interview_preparation).toBeUndefined();
  });

  it('removes salary negotiation fields but keeps estimated_range', () => {
    const masked = maskPremiumReportFields(fullReport);
    expect(masked.salary_analysis?.estimated_range).toBe('100k');
    expect(masked.salary_analysis?.market_position).toBe('mid');
    expect(masked.salary_analysis?.negotiation_tip).toBeUndefined();
    expect(masked.salary_analysis?.rationale).toBeUndefined();
  });

  it('removes real_interview_questions from reviews_analysis', () => {
    const masked = maskPremiumReportFields(fullReport);
    expect(masked.reviews_analysis?.company_reviews.summary).toBe('ok');
    expect(masked.reviews_analysis?.real_interview_questions).toBeUndefined();
  });

  it('does not mutate the original report object', () => {
    maskPremiumReportFields(fullReport);
    expect(fullReport.interview_preparation?.questions).toHaveLength(1);
    expect(fullReport.salary_analysis.negotiation_tip).toBe('Ask for 10% more');
  });
});

describe('isReportPremiumUnlocked', () => {
  it('returns true only when isPremium is true', () => {
    expect(isReportPremiumUnlocked(true)).toBe(true);
    expect(isReportPremiumUnlocked(false)).toBe(false);
  });
});
