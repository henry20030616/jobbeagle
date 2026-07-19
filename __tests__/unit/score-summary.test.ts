import { describe, expect, it } from 'vitest';
import {
  parallelizeVerdictPoint,
  scoreSummaryPoints,
  splitScoreSummaryPoint,
} from '@/lib/score-summary';

describe('scoreSummaryPoints', () => {
  it('prefers explicit bullets', () => {
    expect(
      scoreSummaryPoints('ignored prose', ['A.', 'B.', 'C.']),
    ).toEqual(['A.', 'B.', 'C.']);
  });

  it('splits prose into sentences', () => {
    const points = scoreSummaryPoints(
      'Strong BA fit for this seat. Level aligns with senior ownership. Main gap is ACH depth.',
    );
    expect(points).toHaveLength(3);
    expect(points[0]).toContain('Strong BA');
  });

  it('splits label and detail for muted body copy', () => {
    expect(splitScoreSummaryPoint('Main gap: ACH depth is thin.')).toEqual({
      label: 'Main gap',
      detail: 'ACH depth is thin.',
    });
  });

  it('normalizes dash separators to colon for parallel labels', () => {
    expect(parallelizeVerdictPoint('Level/tenure align — six years of fintech ops')).toBe(
      'Level/tenure align: six years of fintech ops',
    );
    expect(
      scoreSummaryPoints('', [
        'Strong BA fit: SQL ownership.',
        'Level/tenure align — six years of fintech ops.',
        'Main gap: ACH depth.',
      ]),
    ).toEqual([
      'Strong BA fit: SQL ownership.',
      'Level/tenure align: six years of fintech ops.',
      'Main gap: ACH depth.',
    ]);
  });
});
