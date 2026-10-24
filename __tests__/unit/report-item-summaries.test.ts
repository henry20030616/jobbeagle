import { describe, expect, it } from 'vitest';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import {
  firstSummarySentences,
  guideItemSummaries,
  snapshotItemSummaries,
  splitSummaryPoints,
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
    expect(splitSummaryPoints(summaries.land)).toEqual([
      '目標價：$168K。美國遠端 Senior Business Analyst 市場帶約 $145K–$190K；履歷可證 SQL／Looker 將對帳週期縮短 28%，ACH 退票僅相鄰，故不站上緣。',
      '天花板：$185K。沒有 Staff 級範圍，也沒有第二份 offer。',
      '結構：底薪 $145K、股票約 $12K／年、獎金 $11K。股票與獎金為目標總薪酬的結構拆分，實際以錄取條件為準。',
    ]);
  });

  it('keeps a short overview as one block and splits long copy into points', () => {
    expect(splitSummaryPoints('職缺仍在公開招募。')).toEqual(['職缺仍在公開招募。']);
    expect(splitSummaryPoints('第一句。\n第二句。\n第三句。')).toEqual([
      '第一句。',
      '第二句。',
      '第三句。',
    ]);
  });

  it('keeps the first two sentences of a multiline strategy as the fallback', () => {
    expect(firstSummarySentences('第一句。\n第二句。\n第三句。', 2)).toBe('第一句。 第二句。');
  });
});
