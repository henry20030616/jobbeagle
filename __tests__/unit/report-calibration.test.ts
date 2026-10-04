import { describe, expect, it } from 'vitest';
import {
  calibrateLiteReport,
  rescaleBreakdownWeights,
  stripCoachingActions,
} from '@/lib/report-calibration';
import { getSampleSnapshotReport } from '@/lib/sample-reports';
import type { LiteReport } from '@/types';

function withWeakCore(overrides: Partial<LiteReport> = {}): LiteReport {
  const base = getSampleSnapshotReport('en');
  return {
    ...base,
    competency_map: [
      { competency: 'ACH returns', weight: 'core', proficiency: 'adjacent', resume_evidence: 'Bank ops' },
    ],
    risk_assessment: [
      { category: 'competency', severity: 'low', statement: 'minor', basis: 'resume' },
    ],
    ...overrides,
  };
}

describe('rescaleBreakdownWeights', () => {
  it('rescales fractional weights and leaves 0-100 weights alone', () => {
    const frac = rescaleBreakdownWeights([
      { dimension: 'a', weight_pct: 0.3, score: 70, note: '' },
      { dimension: 'b', weight_pct: 0.7, score: 70, note: '' },
    ]);
    expect(frac.map((b) => b.weight_pct)).toEqual([30, 70]);
    const ok = [{ dimension: 'a', weight_pct: 30, score: 70, note: '' }];
    expect(rescaleBreakdownWeights(ok)).toBe(ok);
  });
});

describe('stripCoachingActions', () => {
  it('drops imperative resume coaching and keeps missing-proof facts', () => {
    expect(
      stripCoachingActions([
        'Explicitly mention any exposure to NACHA rules.',
        'Highlight vendor management.',
        'ACH returns ownership is not evidenced.',
      ]),
    ).toEqual(['ACH returns ownership is not evidenced.']);
  });
});

describe('calibrateLiteReport', () => {
  it('downgrades "Apply now" when a core competency lacks direct proof', () => {
    const report = withWeakCore({
      apply_decision: { label: 'Apply now', reason: 'ok', next_best_action: 'Apply now.' },
    });
    const out = calibrateLiteReport(report);
    expect(out.apply_decision.label).toBe('Apply after fixes');
    expect(out.apply_decision.next_best_action).toContain('ACH returns');
    expect(out.fit_score.score).toBe(report.fit_score.score);
  });

  it('derives a competency risk from the map when the model rated it too low', () => {
    const out = calibrateLiteReport(withWeakCore());
    expect(out.risk_assessment?.[0]).toMatchObject({ category: 'competency', severity: 'medium' });
  });

  it('drops a self-contradicting ATS warning', () => {
    const out = calibrateLiteReport(
      withWeakCore({
        ats_warning: {
          pass_rate_pct: null,
          missing_keyword_count: 2,
          summary: 'Candidate is highly screenable.',
        },
      }),
    );
    expect(out.ats_warning).toBeNull();
  });

  it('leaves a fully evidenced report untouched', () => {
    const base = getSampleSnapshotReport('en');
    const strong: LiteReport = {
      ...base,
      competency_map: [{ competency: 'SQL', weight: 'core', proficiency: 'demonstrated', resume_evidence: 'x' }],
      apply_decision: { label: 'Apply now', reason: 'r', next_best_action: 'Ask about band.' },
    };
    expect(calibrateLiteReport(strong).apply_decision.label).toBe('Apply now');
  });
});
