import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import { REPORT_GUIDE_TAB_TYPE } from '@/constants/report-frame';
import {
  REPORT_HEADER_JOB_ICON,
  REPORT_HEADER_JOB_LINE,
  REPORT_HEADER_META,
  REPORT_HEADER_META_ICON,
  REPORT_HEADER_META_LABEL,
  REPORT_HEADER_META_ROW,
  REPORT_HEADER_PRODUCT_LABEL,
  REPORT_HEADER_SHELL,
} from '@/constants/report-header';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';

describe('shared Snapshot/Guide report header', () => {
  it('keeps product label small cyan and job title large white', () => {
    expect(REPORT_HEADER_PRODUCT_LABEL).toMatch(/text-lg/);
    expect(REPORT_HEADER_PRODUCT_LABEL).toMatch(/text-sky-400/);
    expect(REPORT_HEADER_PRODUCT_LABEL).toMatch(/uppercase/);
    expect(REPORT_HEADER_JOB_LINE).toMatch(/text-4xl/);
    expect(REPORT_HEADER_JOB_LINE).toMatch(/font-black/);
    expect(REPORT_HEADER_JOB_LINE).toMatch(/text-white/);
    expect(REPORT_HEADER_JOB_LINE).not.toContain(REPORT_GUIDE_TAB_TYPE);
    expect(REPORT_HEADER_JOB_LINE).not.toMatch(/text-2xl/);
    expect(REPORT_HEADER_META_LABEL).toMatch(/text-slate-500/);
    expect(REPORT_HEADER_SHELL).toMatch(/px-5/);
    expect(REPORT_HEADER_JOB_ICON).toMatch(/w-5/);
    expect(REPORT_HEADER_META).toMatch(/text-lg/);
    expect(REPORT_HEADER_META_ROW).toMatch(/text-slate-300/);
    expect(REPORT_HEADER_META_ICON).toMatch(/text-slate-500/);
  });

  it('is the only header chrome for Snapshot and Guide dashboards', () => {
    const headerSrc = readFileSync(
      join(process.cwd(), 'components/report/ReportJobHeader.tsx'),
      'utf8',
    );
    expect(headerSrc).toContain("from '@/constants/report-header'");
    expect(headerSrc).toContain('REPORT_HEADER_PRODUCT_LABEL');
    expect(headerSrc).toContain('REPORT_HEADER_JOB_LINE');
    expect(headerSrc).toContain('formatJobSourceDate');
    expect(headerSrc).toContain('Briefcase');
    expect(headerSrc).toContain('Building2');
    expect(headerSrc).toContain('CalendarDays');
    expect(headerSrc).not.toContain('overflow-hidden');
    expect(headerSrc).not.toContain('guide_modules');

    const snapshot = readFileSync(
      join(process.cwd(), 'components/LiteReportDashboard.tsx'),
      'utf8',
    );
    const guide = readFileSync(
      join(process.cwd(), 'components/FullReportDashboard.tsx'),
      'utf8',
    );
    expect(snapshot).toContain('ReportJobHeader');
    expect(guide).toContain('ReportJobHeader');
    expect(snapshot).not.toContain('guide_modules');
    expect(guide).not.toMatch(/text-3xl sm:text-4xl font-black text-white tracking-tight/);
    expect(guide).not.toContain('companyLine');
    expect(guide).not.toContain('roleLine');
    expect(guide).toContain('REPORT_GUIDE_TAB_TYPE');
  });

  it('renders matching sample headers: label + title + company + posted', () => {
    const snapHtml = renderToStaticMarkup(
      createElement(LiteReportDashboard, {
        report: getSampleSnapshotReport('zh-TW'),
        language: 'zh-TW',
        embedded: true,
      }),
    );
    const guideHtml = renderToStaticMarkup(
      createElement(FullReportDashboard, {
        report: getSampleStrategyGuideReport('zh-TW'),
        language: 'zh-TW',
        embedded: true,
      }),
    );

    const snapHeader = snapHtml.slice(
      snapHtml.indexOf('<header'),
      snapHtml.indexOf('</header>') + '</header>'.length,
    );
    const guideHeader = guideHtml.slice(
      guideHtml.indexOf('<header'),
      guideHtml.indexOf('</header>') + '</header>'.length,
    );
    expect(snapHeader).toContain('適配快照');
    expect(guideHeader).toContain('面試指南');
    expect(snapHeader.replace('適配快照', 'PRODUCT')).toBe(
      guideHeader.replace('面試指南', 'PRODUCT'),
    );
    for (const html of [snapHeader, guideHeader]) {
      expect(html).toContain('Senior Business Analyst');
      expect(html).toContain('公司');
      expect(html).toContain('Northstar Payments');
      expect(html).toContain('刊登');
      expect(html).toContain('LinkedIn 2026-06-18');
      expect(html).toContain(REPORT_HEADER_PRODUCT_LABEL);
      expect(html).toContain(REPORT_HEADER_JOB_LINE);
      expect(html).not.toContain('overflow-hidden');
    }
    expect(guideHtml.indexOf('面試指南')).toBeLessThan(guideHtml.indexOf('職位核心分析'));
    expect(guideHtml).toContain('職位核心分析');
    expect(guideHtml).toContain('個人薪資落點');
  });
});
