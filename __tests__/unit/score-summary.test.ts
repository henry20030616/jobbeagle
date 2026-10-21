import { describe, expect, it } from 'vitest';
import {
  parallelizeVerdictPoint,
  scoreSummaryPoints,
  splitLabeledFact,
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

  it('splits CJK fullwidth colon without rewriting dashes inside the fact', () => {
    expect(splitLabeledFact('年資：5 年以上 Business Analyst 或產品營運。')).toEqual({
      label: '年資',
      detail: '5 年以上 Business Analyst 或產品營運。',
    });
    expect(splitLabeledFact('技能：SQL — 須能獨立使用。')).toEqual({
      label: '技能',
      detail: 'SQL — 須能獨立使用。',
    });
    expect(parallelizeVerdictPoint('技能：SQL — 須能獨立使用。')).toBe(
      '技能：SQL — 須能獨立使用。',
    );
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
