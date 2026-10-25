import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SnapshotItemStack } from '@/components/report/SevenItemPages';
import { getSampleSnapshotReport, getSampleStrategyGuideReport } from '@/lib/sample-reports';

function resumeAdviceSource(): string {
  const source = readFileSync(join(process.cwd(), 'components/report/SevenItemPages.tsx'), 'utf8');
  return source.slice(
    source.indexOf('function ResumeAdviceBody'),
    source.indexOf('export function SnapshotItemStack'),
  );
}

function keywordBlock(html: string): string {
  const note = '這些是人資篩選系統用來比對履歷的重要關鍵字';
  const noteIdx = html.indexOf(note);
  const headingIdx = html.indexOf('待優化改善');
  expect(noteIdx).toBeGreaterThan(-1);
  expect(headingIdx).toBeGreaterThan(noteIdx);
  return html.slice(Math.max(0, noteIdx - 80), headingIdx);
}

describe('ResumeAdvice missing-keyword type', () => {
  it('reuses 職位概述 BODY_COPY on the intro, chips, and empty copy — not muted/small chip type', () => {
    const advice = resumeAdviceSource();
    expect(advice).toContain('<p className={BODY_COPY}>{copy.keywordsNote}</p>');
    expect(advice).toContain('className={`rounded-md bg-slate-900 px-2 py-1 ${BODY_COPY}`}');
    expect(advice).toContain('<p className={`${BODY_COPY} mt-4 md:mt-0`}>{copy.empty}</p>');
    expect(advice).not.toContain('text-base font-semibold text-slate-100');
    expect(advice).not.toContain('text-sm');
    expect(advice).not.toContain('text-xs');
    expect(advice).not.toContain('text-slate-400');
    expect(advice).not.toContain('BODY_MUTED');
  });

  it('renders Snapshot and Guide page-1 keyword chips with report-body', () => {
    const snapshot = getSampleSnapshotReport('zh-TW');
    const guide = getSampleStrategyGuideReport('zh-TW');
    const snapHtml = renderToStaticMarkup(
      createElement(SnapshotItemStack, {
        report: snapshot,
        language: 'zh-TW',
        locked: true,
      }),
    );
    const guideHtml = renderToStaticMarkup(
      createElement(SnapshotItemStack, {
        report: guide,
        language: 'zh-TW',
        locked: false,
        rewrites: guide.guide_modules?.resume_rewrites ?? [],
      }),
    );

    for (const html of [snapHtml, guideHtml]) {
      const block = keywordBlock(html);
      expect(block).toContain('report-body');
      expect(block).not.toContain('text-slate-400');
      expect(block).not.toContain('text-base');
      expect(block).not.toContain('text-sm');
      expect(block).not.toContain('text-xs');
      for (const word of ['ACH 退票', '退票處理', '清算', 'NACHA 規範']) {
        expect(block).toContain(`rounded-md bg-slate-900 px-2 py-1 report-body">${word}`);
      }
    }
  });
});
