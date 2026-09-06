import { describe, expect, it } from 'vitest';
import { generate100Cases } from '../../scripts/poc-runner/dataset';
import { evaluateTestCase } from '../../scripts/poc-runner/evaluator';
import { runQualityEngine } from '../../scripts/poc-runner/quality-engine';

describe('poc-runner dataset', () => {
  it('contains exactly 100 cases with the required split', () => {
    const cases = generate100Cases();
    expect(cases).toHaveLength(100);
    expect(cases.filter((c) => c.category === 'snapshot_quality')).toHaveLength(40);
    expect(cases.filter((c) => c.category === 'guide_quality')).toHaveLength(40);
    expect(cases.filter((c) => c.category === 'system_funnel')).toHaveLength(20);
  });

  it('scores a metricless resume at Impact 0 and <= 65', () => {
    const metricless = generate100Cases().find((c) => c.assertions.requireZeroImpact);
    expect(metricless).toBeDefined();
    if (!metricless) return;
    const output = runQualityEngine(metricless);
    expect(output.breakdown.impact).toBe(0);
    expect(output.score).toBeLessThanOrEqual(65);
    const result = evaluateTestCase(metricless, output, 0, 0, 'local_rubric');
    expect(result.status).toBe('PASS');
  });
});
