import type { FullReport, LiteReport } from '@/types';

export type GuideReport = FullReport;
export type GuideSalaryLand = NonNullable<GuideReport['guide_modules']>['salary_land'];

/**
 * Strategy Guide reports carry required intel fields that Snapshot never has.
 * `guide_modules` is optional even on Guide, so it is not the discriminant.
 */
export function isGuideReport(report: LiteReport | GuideReport): report is GuideReport {
  return 'offer_strategy' in report && 'interview_playbook' in report;
}

/** Salary target / ceiling live on Guide only. Snapshot (LiteReport) yields undefined. */
export function guideSalaryLand(report: LiteReport | GuideReport): GuideSalaryLand | undefined {
  if (!isGuideReport(report)) return undefined;
  return report.guide_modules?.salary_land;
}
