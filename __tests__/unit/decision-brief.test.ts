import { describe, expect, it } from 'vitest';
import { splitDecisionBrief } from '@/lib/decision-brief';

describe('splitDecisionBrief', () => {
  it('splits a multi-sentence reason into bullets', () => {
    const points = splitDecisionBrief(
      'Strengths clear the bar. Main risk is thin domain proof. Confirm the requirement before applying.',
    );
    expect(points).toHaveLength(3);
    expect(points[0]).toMatch(/Strengths/);
    expect(points[2]).toMatch(/Confirm/);
  });

  it('prefers newline bullets when present', () => {
    const points = splitDecisionBrief('- Fit is solid\n- Gap is payments\n- Clarify first');
    expect(points).toEqual(['Fit is solid', 'Gap is payments', 'Clarify first']);
  });

  it('returns empty for blank input', () => {
    expect(splitDecisionBrief('')).toEqual([]);
    expect(splitDecisionBrief(null)).toEqual([]);
  });
});
