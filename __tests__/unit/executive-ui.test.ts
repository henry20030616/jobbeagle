import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExecutiveSnapshotRow } from '@/components/ExecutiveSnapshotPanels';
import { TerminalWindow } from '@/components/TerminalWindow';
import {
  InsiderSignalsTable,
  LeverageAnalysisCard,
} from '@/components/guide/GuideExecutivePanels';
import { getExecutiveUiCopy } from '@/lib/executive-ui-copy';
import { getSampleSnapshotReport, getSampleStrategyGuideReport } from '@/lib/sample-reports';
import { HOMEPAGE_FORM_COPY } from '@/constants/homepage-form-copy';
import { normalizeFullReport } from '@/lib/normalize-lite-report';
import type { FullReport } from '@/types';

const SAMPLE_LANGUAGES = ['en', 'zh-TW', 'zh-CN', 'es'] as const;

describe('executive sample fixtures', () => {
  it.each(SAMPLE_LANGUAGES)('Snapshot sample (%s) carries the executive layer', (lang) => {
    const report = getSampleSnapshotReport(lang);
    expect(report.competency_map?.length).toBe(5);
    expect(report.market_positioning?.rationale.length).toBeGreaterThan(10);
    expect(report.risk_assessment?.[0].severity).toBe('high');
  });

  it.each(SAMPLE_LANGUAGES)('Guide sample (%s) mirrors the Snapshot layer and adds Guide fields', (lang) => {
    const snapshot = getSampleSnapshotReport(lang);
    const guide = getSampleStrategyGuideReport(lang);
    expect(guide.competency_map).toEqual(snapshot.competency_map);
    expect(guide.leverage_analysis?.factors.length).toBeGreaterThanOrEqual(2);
    expect(guide.insider_signals?.map((s) => s.source)).toContain('h1bdata');
  });

  it('never claims evidence for an absent competency', () => {
    for (const lang of SAMPLE_LANGUAGES) {
      for (const c of getSampleSnapshotReport(lang).competency_map ?? []) {
        if (c.proficiency === 'absent') expect(c.resume_evidence).toBeNull();
      }
    }
  });
});

describe('executive panels', () => {
  it('Snapshot row renders competencies, risks, and localized labels', () => {
    const en = renderToStaticMarkup(
      createElement(ExecutiveSnapshotRow, { report: getSampleSnapshotReport('en'), language: 'en' }),
    );
    expect(en).toContain('Competency Map');
    expect(en).toContain('Risk Assessment');
    expect(en).toContain('ACH returns and settlement');

    const zh = renderToStaticMarkup(
      createElement(ExecutiveSnapshotRow, {
        report: getSampleSnapshotReport('zh-TW'),
        language: 'zh-TW',
      }),
    );
    expect(zh).toContain('能力對照');
    expect(zh).toContain('風險評估');
  });

  it('renders nothing for reports without the executive layer', () => {
    const legacy = { ...getSampleSnapshotReport('en') };
    delete legacy.competency_map;
    delete legacy.market_positioning;
    delete legacy.risk_assessment;
    expect(
      renderToStaticMarkup(
        createElement(ExecutiveSnapshotRow, { report: legacy, language: 'en' }),
      ),
    ).toBe('');
  });

  it('Guide panels render for the sample and stay empty for legacy reports', () => {
    const guide = getSampleStrategyGuideReport('en');
    expect(
      renderToStaticMarkup(createElement(LeverageAnalysisCard, { report: guide, language: 'en' })),
    ).toContain('Leverage Analysis');
    const table = renderToStaticMarkup(
      createElement(InsiderSignalsTable, { report: guide, language: 'en' }),
    );
    expect(table).toContain('H-1B filings');
    expect(table).toContain('href="https://h1bdata.info"');

    const legacy: FullReport = normalizeFullReport({ ...guide, leverage_analysis: undefined, insider_signals: undefined });
    expect(
      renderToStaticMarkup(createElement(LeverageAnalysisCard, { report: legacy, language: 'en' })),
    ).toBe('');
    expect(
      renderToStaticMarkup(createElement(InsiderSignalsTable, { report: legacy, language: 'en' })),
    ).toBe('');
  });

  it('TerminalWindow shows its title', () => {
    const html = renderToStaticMarkup(
      createElement(TerminalWindow, { title: 'negotiation', children: 'x' }),
    );
    expect(html).toContain('negotiation');
  });

  it('has a copy pack for every report language', () => {
    for (const lang of ['en', 'zh-TW', 'zh-CN', 'es', 'hi', 'ar']) {
      const t = getExecutiveUiCopy(lang);
      expect(t.competencyMap.length).toBeGreaterThan(0);
      expect(Object.keys(t.category)).toHaveLength(5);
    }
  });
});

describe('homepage value propositions', () => {
  it('uses austere titles without emoji in every language', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const copy of Object.values(HOMEPAGE_FORM_COPY)) {
      for (const text of [
        copy.matchAnalysis,
        copy.salaryResearch,
        copy.industryAnalysis,
        copy.interviewPrep,
        copy.snapshotBlurb,
        copy.strategyBlurb,
      ]) {
        expect(text).not.toMatch(emoji);
      }
    }
    expect(HOMEPAGE_FORM_COPY.en.matchAnalysis).toBe('Executive Competency Mapping');
    expect(HOMEPAGE_FORM_COPY.en.salaryResearch).toBe('Federal Compensation Benchmarking');
  });
});
