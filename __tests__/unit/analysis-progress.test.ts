import { describe, it, expect } from 'vitest';
import {
  getAnalysisProgressAtTime,
  getAnalysisStageLabel,
} from '@/lib/analysis-progress';

describe('analysis progress simulation', () => {
  it('starts at 0 and approaches 99 over time', () => {
    expect(getAnalysisProgressAtTime(0)).toBe(0);
    expect(getAnalysisProgressAtTime(34)).toBe(72);
    expect(getAnalysisProgressAtTime(100)).toBe(99);
    expect(getAnalysisProgressAtTime(200)).toBe(99);
  });

  it('advances between schedule points', () => {
    const mid = getAnalysisProgressAtTime(17);
    expect(mid).toBeGreaterThan(35);
    expect(mid).toBeLessThan(55);
  });

  it('returns stage labels by progress', () => {
    expect(getAnalysisStageLabel(0, 'en')).toMatch(/Reading/i);
    expect(getAnalysisStageLabel(72, 'en')).toMatch(/resume match/i);
    expect(getAnalysisStageLabel(93, 'zh-TW')).toMatch(/整合/);
  });
});
