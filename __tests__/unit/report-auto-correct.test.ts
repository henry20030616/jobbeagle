import { describe, expect, it } from 'vitest';
import {
  autoCorrectFullReport,
  autoCorrectLiteReport,
  formatQualityRetryHint,
  needsQualityRetry,
} from '@/lib/report-auto-correct';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';

describe('report auto-correct', () => {
  it('leaves a valid Fit Snapshot unchanged', () => {
    const sample = getSampleSnapshotReport('en');
    const { report, corrections } = autoCorrectLiteReport(sample);
    expect(needsQualityRetry(corrections)).toBe(false);
    expect(report.job_title).toBe(sample.job_title);
    expect(report.fit_score.score).toBe(sample.fit_score.score);
  });

  it('clamps out-of-range scores and strips fake offer URLs', () => {
    const sample = getSampleSnapshotReport('en');
    const { report, corrections } = autoCorrectLiteReport({
      ...sample,
      fit_score: { ...sample.fit_score, score: 140 },
      expected_offer: {
        ...sample.expected_offer,
        currency: '',
        sources: ['https://not a url', 'Levels.fyi market notes'],
      },
    });
    expect(report.fit_score.score).toBe(100);
    expect(report.expected_offer.currency).toBe('USD');
    expect(report.expected_offer.sources).toEqual(['Levels.fyi market notes']);
    expect(corrections.some((item) => item.code === 'score_clamped')).toBe(true);
    expect(corrections.some((item) => item.code === 'invalid_offer_source_url')).toBe(true);
    expect(needsQualityRetry(corrections)).toBe(false);
  });

  it('flags an empty job title for retry', () => {
    const sample = getSampleSnapshotReport('en');
    const { corrections } = autoCorrectLiteReport({ ...sample, job_title: '   ' });
    expect(needsQualityRetry(corrections)).toBe(true);
    expect(formatQualityRetryHint(corrections)).toMatch(/job_title/);
  });

  it('clears invalid Interview Guide citation URLs', () => {
    const sample = getSampleStrategyGuideReport('en');
    const first = sample.interview_playbook.reported[0];
    const { report, corrections } = autoCorrectFullReport({
      ...sample,
      interview_playbook: {
        ...sample.interview_playbook,
        reported: first
          ? [{ ...first, source_url: 'http://not a real url' }]
          : sample.interview_playbook.reported,
      },
    });
    expect(report.interview_playbook.reported[0]?.source_url).toBe('');
    expect(corrections.some((item) => item.code === 'invalid_interview_source_url')).toBe(true);
  });

  it('retries when the interview playbook is empty', () => {
    const sample = getSampleStrategyGuideReport('en');
    const { corrections } = autoCorrectFullReport({
      ...sample,
      interview_playbook: {
        ...sample.interview_playbook,
        reported: [],
        predicted: [],
      },
      offer_strategy: { ...sample.offer_strategy, script: '' },
    });
    expect(needsQualityRetry(corrections)).toBe(true);
    expect(corrections.some((item) => item.code === 'empty_interview_playbook')).toBe(true);
    expect(corrections.some((item) => item.code === 'empty_offer_script')).toBe(true);
  });
});
