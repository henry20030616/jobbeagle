import { describe, expect, it } from 'vitest';
import {
  emptyTrackAnalysisCopy,
  groundInterviewSummary,
  reportedQuestionStems,
  resolveTrackAnalysis,
} from '@/lib/questions-analysis-grounding';

const REPORTED = {
  question: 'Walk me through how you prioritized an ACH return queue before cutoff.',
  origin: 'reported' as const,
  source_url: 'https://www.glassdoor.com/Interview/index.htm',
};

describe('questions analysis grounding', () => {
  it('collects only reported questions with a citeable URL', () => {
    const stems = reportedQuestionStems([
      REPORTED,
      { question: 'Invented curriculum?', origin: 'predicted', source_url: null },
      {
        question: 'Placeholder',
        origin: 'reported',
        source_url: 'https://example.com/fake',
      },
    ]);
    expect(stems).toEqual([REPORTED.question]);
  });

  it('drops analysis points that do not match a reported question', () => {
    const resolved = resolveTrackAnalysis(
      [
        { title: 'Queue', gist: 'ACH return queue against cutoff', body: '' },
        { title: 'Invented', gist: 'A NACHA seminar that was never retrieved', body: '' },
      ],
      [REPORTED.question],
    );
    expect(resolved.empty).toBe(false);
    expect(resolved.points).toHaveLength(1);
    expect(resolved.points[0]?.question).toBe(REPORTED.question);
  });

  it('uses empty-track copy when no reported questions exist', () => {
    const summary = groundInterviewSummary(
      'Hiring process: three weeks.',
      {
        professional_analysis: 'Invent a payments curriculum.',
        behavioral_analysis: 'Invent a leadership seminar.',
      },
      { professional: [{ question: 'Predicted SQL quiz', origin: 'predicted', source_url: null }], behavioral: [] },
    );
    expect(summary).toContain(emptyTrackAnalysisCopy('en', 'professional'));
    expect(summary).toContain(emptyTrackAnalysisCopy('en', 'behavioral'));
    expect(summary).not.toMatch(/payments curriculum|leadership seminar/);
  });
});
