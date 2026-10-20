import { describe, expect, it } from 'vitest';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import {
  firstSummarySentences,
  guideItemSummaries,
  snapshotItemSummaries,
} from '@/lib/report-item-summaries';

describe('report item summaries', () => {
  it('gives Snapshot core, fit, and market a job-specific overview paragraph', () => {
    const report = getSampleSnapshotReport('zh-TW');
    const summaries = snapshotItemSummaries(report);
    expect(summaries.core).toMatch(/Senior Business Analyst|資深|商業分析/);
    expect(summaries.fit.length).toBeGreaterThan(40);
    expect(summaries.market).toMatch(/\$145K|\$190K|遠端|remote/i);
  });

  it('gives Guide pay, company, questions, and negotiation a summary paragraph', () => {
    const report = getSampleStrategyGuideReport('zh-TW');
    const summaries = guideItemSummaries(report);
    expect(summaries.land).toMatch(/\$168K/);
    expect(summaries.company.length).toBeGreaterThan(20);
    expect(summaries.questions.length).toBeGreaterThan(20);
    expect(summaries.negotiate).toMatch(/\$168K|28%/);
  });

  it('keeps the first two sentences of a multiline strategy as the fallback', () => {
    expect(firstSummarySentences('第一句。\n第二句。\n第三句。', 2)).toBe('第一句。 第二句。');
  });
});
