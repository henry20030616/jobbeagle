import { describe, expect, it } from 'vitest';
import { getSampleStrategyGuideReport } from '@/lib/sample-reports';
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

  it('splits both Guide sample locales into two bullets per column', () => {
    const zh = splitBuyerSellerStances(
      getSampleStrategyGuideReport('zh-TW').guide_modules!.salary_land.buyer_seller,
    );
    expect(zh.company).toHaveLength(2);
    expect(zh.candidate).toHaveLength(2);
    expect(zh.company[0]).toMatch(/公開招募|補位/);
    expect(zh.candidate[0]).toMatch(/28%/);
    expect(zh.candidate[1]).toMatch(/ACH/);

    const en = splitBuyerSellerStances(
      getSampleStrategyGuideReport('en').guide_modules!.salary_land.buyer_seller,
    );
    expect(en.company.length).toBeGreaterThanOrEqual(2);
    expect(en.candidate.length).toBeGreaterThanOrEqual(2);
    expect(en.company.join(' ')).toMatch(/posted|requisition/i);
    expect(en.candidate.join(' ')).toMatch(/28%/);
  });
});
