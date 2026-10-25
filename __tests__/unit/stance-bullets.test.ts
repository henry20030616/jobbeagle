import { describe, expect, it } from 'vitest';
import { getSampleStrategyGuideReport } from '@/lib/sample-reports';
import { splitLabeledFact } from '@/lib/score-summary';
import { splitBuyerSellerStances, splitSentenceBullets } from '@/lib/stance-bullets';

describe('splitSentenceBullets', () => {
  it('splits CJK sentences and keeps a single sentence intact', () => {
    expect(splitSentenceBullets('職缺仍在公開招募。')).toEqual(['職缺仍在公開招募。']);
    expect(splitSentenceBullets('第一句。第二句。')).toEqual(['第一句。', '第二句。']);
  });

  it('splits English on period+space and does not split $1.2K', () => {
    expect(
      splitSentenceBullets(
        'The seat is still posted. They can hold a mid-band first offer.',
      ),
    ).toEqual([
      'The seat is still posted.',
      'They can hold a mid-band first offer.',
    ]);
    expect(splitSentenceBullets('Equity is about $1.2K a year.')).toEqual([
      'Equity is about $1.2K a year.',
    ]);
  });

  it('treats newlines and markdown bullets as list items', () => {
    expect(splitSentenceBullets('- First fact\n• Second fact')).toEqual([
      'First fact',
      'Second fact',
    ]);
  });
});

describe('splitBuyerSellerStances', () => {
  it('uses the first line for company and remaining lines for candidate', () => {
    const split = splitBuyerSellerStances(
      '職缺仍在公開招募。雇主可維持中帶首報。\n履歷可證 28%。ACH 退票未記載。',
    );
    expect(split.company).toEqual(['職缺仍在公開招募。', '雇主可維持中帶首報。']);
    expect(split.candidate).toEqual(['履歷可證 28%。', 'ACH 退票未記載。']);
  });

  it('falls unlabeled prose to first sentence vs the rest', () => {
    expect(splitBuyerSellerStances('公司還在招。履歷只證 28%。')).toEqual({
      company: ['公司還在招。'],
      candidate: ['履歷只證 28%。'],
    });
  });

  it('splits four titled lines into two company and two candidate bullets', () => {
    const split = splitBuyerSellerStances(
      '招募狀態：職缺仍在公開招募，雇主有補位需求。\n首報空間：沒有第二份 offer，可維持中帶首報。\n履歷證據：SQL 與 Looker 將對帳週期縮短 28%。\n範圍未記載：ACH 退票未記載於履歷。',
    );
    expect(split.company).toEqual([
      '招募狀態：職缺仍在公開招募，雇主有補位需求。',
      '首報空間：沒有第二份 offer，可維持中帶首報。',
    ]);
    expect(split.candidate).toEqual([
      '履歷證據：SQL 與 Looker 將對帳週期縮短 28%。',
      '範圍未記載：ACH 退票未記載於履歷。',
    ]);
  });

  it('keeps a titled bullet intact when the gist has two sentences', () => {
    expect(
      splitBuyerSellerStances(
        '招募狀態：職缺仍在公開招募。公開來源未顯示到職時程。\n履歷證據：對帳週期縮短 28%。ACH 未記載。',
      ),
    ).toEqual({
      company: ['招募狀態：職缺仍在公開招募。公開來源未顯示到職時程。'],
      candidate: ['履歷證據：對帳週期縮短 28%。ACH 未記載。'],
    });
  });

  it.each(['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar'] as const)(
    'splits the Guide sample into titled bullets per column (%s)',
    (lang) => {
      const split = splitBuyerSellerStances(
        getSampleStrategyGuideReport(lang).guide_modules!.salary_land.buyer_seller,
      );
      expect(split.company).toHaveLength(2);
      expect(split.candidate).toHaveLength(2);
      for (const bullet of [...split.company, ...split.candidate]) {
        const { label, detail } = splitLabeledFact(bullet);
        expect(label.length).toBeGreaterThan(0);
        expect(label.length).toBeLessThanOrEqual(48);
        expect(detail.length).toBeGreaterThan(0);
      }
      expect(split.company.join(' ')).toMatch(/posted|招募|招聘|vacante|प्रकाशित|منشور/i);
      expect(split.candidate.join(' ')).toMatch(/28%/);
      expect(split.candidate.join(' ')).toMatch(/ACH/);
    },
  );
});
