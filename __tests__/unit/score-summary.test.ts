import { describe, expect, it } from 'vitest';
import { scoreSummaryPoints } from '@/lib/score-summary';

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
});
