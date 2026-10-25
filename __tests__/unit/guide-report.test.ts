import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { guideSalaryLand, isGuideReport } from '@/lib/guide-report';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import type { LiteReport } from '@/types';

type LiteHasGuideModules = 'guide_modules' extends keyof LiteReport ? true : false;
const liteReportHasNoGuideModules: LiteHasGuideModules = false;

function rejectGuideModulesKey(_key: Exclude<keyof LiteReport, 'guide_modules'>): void {
  /* compile-time: LiteReport must not list guide_modules */
}

describe('guideSalaryLand', () => {
  it('keeps guide_modules off LiteReport so Snapshot cannot read salary land', () => {
    expect(liteReportHasNoGuideModules).toBe(false);
    // @ts-expect-error LiteReport must not include guide_modules
    rejectGuideModulesKey('guide_modules');
    const snapshot = getSampleSnapshotReport('en');
    expect(isGuideReport(snapshot)).toBe(false);
    expect(guideSalaryLand(snapshot)).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(snapshot, 'guide_modules')).toBe(false);
  });

  it('returns Guide salary target and ceiling after the type guard', () => {
    const guide = getSampleStrategyGuideReport('en');
    expect(isGuideReport(guide)).toBe(true);
    const land = guideSalaryLand(guide);
    expect(land?.target).toMatch(/\$168K/);
    expect(land?.ceiling).toMatch(/\$185K/);
  });

  it('does not let SnapshotItemStack read salary land or guide_modules', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/report/SevenItemPages.tsx'),
      'utf8',
    );
    const stack = source.slice(
      source.indexOf('export function SnapshotItemStack'),
      source.indexOf('function QuestionList'),
    );
    expect(stack).not.toContain('guideSalaryLand');
    expect(stack).not.toContain('report.guide_modules');
    expect(stack).not.toContain('targetValue');
    expect(stack).not.toContain('ceilingValue');
    expect(source).not.toContain('salaryLandFrom');
    expect(source).not.toContain('as any');
    const land = source.slice(
      source.indexOf("if (item === 'land')"),
      source.indexOf("if (item === 'company')"),
    );
    expect(land).toContain('guideSalaryLand(report)');
    expect(land).toContain('targetValue={salary.target}');
    expect(land).toContain('ceilingValue={salary.ceiling}');
  });
});
