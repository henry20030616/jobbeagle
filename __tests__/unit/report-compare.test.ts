import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ReportCompareTable from '@/components/ReportCompareTable';
import {
  REPORT_COMPARE_ROWS,
  REPORT_COMPARE_TRIGGER,
  REPORT_COMPARE_WHY_PRO,
  resolveCompareLang,
} from '@/constants/report-compare';

const TABLE_SRC = readFileSync(
  join(process.cwd(), 'components/ReportCompareTable.tsx'),
  'utf8',
);
const CSS_SRC = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

describe('report-compare', () => {
  it('resolves language for the compare modal', () => {
    expect(resolveCompareLang('en')).toBe('en');
    expect(resolveCompareLang('zh-TW')).toBe('zh-TW');
    expect(resolveCompareLang('es')).toBe('en');
  });

  it('explains why Pro / deep report matters', () => {
    expect(REPORT_COMPARE_WHY_PRO.bullets.length).toBeGreaterThanOrEqual(3);
    expect(REPORT_COMPARE_WHY_PRO.title.en).toMatch(/professional/i);
  });

  it('puts Best for first, then shared (stars) → guide-only → price', () => {
    expect(REPORT_COMPARE_TRIGGER.en).toBe('Report differences');
    expect(REPORT_COMPARE_TRIGGER['zh-TW']).toBe('兩種報告差異');
    expect(REPORT_COMPARE_TRIGGER['zh-CN']).toBe('两种报告差异');

    const sections = REPORT_COMPARE_ROWS.map((r) => r.section);
    expect(REPORT_COMPARE_ROWS[0]?.feature.en).toBe('Best for');
    expect(sections[0]).toBe('best_for');
    const shared = REPORT_COMPARE_ROWS.filter((r) => r.section === 'shared');
    expect(shared.map((r) => r.feature['zh-TW'])).toEqual([
      '匹配度分析',
      '市場薪資水準',
      '職位核心解析',
    ]);
    const guideOnly = REPORT_COMPARE_ROWS.filter((r) => r.section === 'guide_only');
    expect(guideOnly.map((r) => r.feature['zh-TW'])).toEqual([
      '個人化薪資落點',
      '公司與職位評價',
      '面試真題準備',
      '面試談判建議',
    ]);
    expect(REPORT_COMPARE_ROWS.some((r) => r.feature.en === 'Live web search')).toBe(false);
    expect(shared[0]?.snapshot.text.en).not.toMatch(/no web/i);
    expect(sections.filter((s) => s === 'shared').length).toBe(3);
    expect(sections.filter((s) => s === 'guide_only').length).toBe(4);
    expect(sections.filter((s) => s === 'meta').length).toBeGreaterThanOrEqual(1);

    const firstGuide = sections.indexOf('guide_only');
    const firstMeta = sections.indexOf('meta');
    const lastShared = sections.lastIndexOf('shared');
    expect(lastShared).toBeLessThan(firstGuide);
    expect(firstGuide).toBeLessThan(firstMeta);

    for (const row of REPORT_COMPARE_ROWS) {
      expect(row.feature.en.length).toBeGreaterThan(0);
      expect(row.help.en.length).toBeGreaterThan(20);
      expect(row.help['zh-TW'].length).toBeGreaterThan(10);
      expect(`${row.help.en} ${row.help['zh-TW']} ${row.help['zh-CN']}`).not.toMatch(
        /50\s*[–-]\s*100|0\s*[–-]\s*100/,
      );
      expect(row.snapshot.text.en.length).toBeGreaterThan(0);
      expect(row.guide.text.en.length).toBeGreaterThan(0);
      if (row.section === 'shared') {
        expect(row.snapshot.stars).toBeGreaterThanOrEqual(1);
        expect(row.guide.stars).toBeGreaterThanOrEqual(row.snapshot.stars!);
        expect(row.guide.stars).toBeLessThanOrEqual(5);
      } else {
        expect(row.snapshot.stars).toBeUndefined();
        expect(row.guide.stars).toBeUndefined();
      }
    }
  });

  it('sizes section headings at or above row labels (overlay-mapped type scale)', () => {
    expect(TABLE_SRC).toContain(
      "const SECTION_TITLE_LG =\n  'compare-section-title text-lg sm:text-xl font-bold tracking-wide'",
    );
    expect(TABLE_SRC).toContain(
      "const ROW_LABEL_LG = 'compare-row-label text-base sm:text-lg font-medium'",
    );
    expect(TABLE_SRC).not.toMatch(/SECTION_TITLE_LG[\s\S]{0,80}text-sm/);
    expect(TABLE_SRC).not.toMatch(
      /section\.id === 'guide_only'[\s\S]{0,180}text-\[10px\]/,
    );
  });

  it('lays out Snapshot / Guide as equal left-aligned grid columns', () => {
    expect(TABLE_SRC).toContain(
      'grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]',
    );
    expect(TABLE_SRC).toContain('compare-col-snapshot');
    expect(TABLE_SRC).toContain('compare-col-guide');
    expect(TABLE_SRC).toContain('compare-cards grid gap-4 p-3 sm:hidden');
    expect(TABLE_SRC).not.toMatch(/text-right/);
    expect(TABLE_SRC).not.toMatch(/inline-flex flex-col gap-1/);
    expect(TABLE_SRC).toContain('inline-flex shrink-0 flex-nowrap items-center');
    expect(TABLE_SRC).toContain('flex min-w-0 items-center gap-2');
    expect(CSS_SRC).toMatch(
      /\.compare-font-large \.compare-star \{[\s\S]*?width: 1\.15rem !important;/,
    );
    expect(CSS_SRC).not.toMatch(
      /\.compare-font-large \.compare-star \{[\s\S]*?width: 2\.5rem !important;/,
    );
  });

  it('keeps $3 / $9.99 in separate Snapshot and Guide cells', () => {
    const html = renderToStaticMarkup(
      createElement(ReportCompareTable, {
        language: 'zh-TW',
        size: 'lg',
        showHeader: false,
      }),
    );
    expect(html).toContain('兩者都有（深度不同）');
    expect(html).toContain('僅面試指南');
    expect(html).toContain('決定要不要投');
    expect(html).toContain('面試準備與談薪');
    expect(html).toContain('compare-section-title text-lg sm:text-xl font-bold');
    expect(html).toContain('compare-row-label text-base sm:text-lg font-medium');
    expect(html).toContain('compare-col-snapshot');
    expect(html).toContain('compare-col-guide');
    expect(html).toMatch(/compare-col-snapshot[\s\S]*?\$3/);
    expect(html).toMatch(/compare-col-guide[\s\S]*?\$9\.99/);
    expect(html).not.toMatch(/\$3\s*\$9\.99/);
  });
});
