import { describe, expect, it } from 'vitest';
import {
  localizeLabeledFactLine,
  localizeReportFieldLabel,
} from '@/lib/report-field-labels';

describe('report field labels', () => {
  it('maps stance prefixes between English and zh-TW', () => {
    expect(localizeReportFieldLabel('Core fit', 'zh-TW')).toBe('核心適配');
    expect(localizeReportFieldLabel('Level/tenure', 'zh-TW')).toBe('職級／年資');
    expect(localizeReportFieldLabel('Main gap', 'zh-TW')).toBe('主要缺口');
    expect(localizeReportFieldLabel('核心適配', 'en')).toBe('Core fit');
    expect(localizeReportFieldLabel('职级／年资', 'zh-TW')).toBe('職級／年資');
    expect(localizeReportFieldLabel('Level/tenure align', 'zh-TW')).toBe('職級／年資');
  });

  it('maps hiring-signal Kind keys', () => {
    expect(localizeReportFieldLabel('Years', 'zh-TW')).toBe('年資');
    expect(localizeReportFieldLabel('Skill', 'zh-TW')).toBe('技能');
    expect(localizeReportFieldLabel('System', 'zh-TW')).toBe('系統');
    expect(localizeReportFieldLabel('Domain', 'zh-TW')).toBe('領域');
    expect(localizeReportFieldLabel('年資', 'en')).toBe('Years');
    expect(localizeReportFieldLabel('年资', 'en')).toBe('Years');
  });

  it('maps common responsibility prefixes', () => {
    expect(localizeReportFieldLabel('Requirements backlog', 'zh-TW')).toBe('需求 backlog');
    expect(localizeReportFieldLabel('Acceptance criteria', 'zh-TW')).toBe('驗收標準');
    expect(localizeReportFieldLabel('Ops KPI pack', 'zh-TW')).toBe('營運指標');
    expect(localizeReportFieldLabel('Project execution plan', 'zh-TW')).toBe('專案執行計畫');
    expect(localizeReportFieldLabel('專案執行計畫', 'en')).toBe('Project execution plan');
  });

  it('leaves unknown labels unchanged', () => {
    expect(localizeReportFieldLabel('招募狀態', 'en')).toBe('招募狀態');
    expect(localizeReportFieldLabel('Seat still posted', 'zh-TW')).toBe('Seat still posted');
    expect(localizeReportFieldLabel('System analysis', 'zh-TW')).toBe('System analysis');
  });

  it('rebuilds labeled lines with a CJK colon on zh-TW', () => {
    expect(
      localizeLabeledFactLine('Core fit: SQL/Looker ownership maps to the JD.', 'zh-TW'),
    ).toBe('核心適配：SQL/Looker ownership maps to the JD.');
    expect(
      localizeLabeledFactLine('Years：具備 IT、軟體或系統整合專案管理經驗', 'zh-TW'),
    ).toBe('年資：具備 IT、軟體或系統整合專案管理經驗');
    expect(
      localizeLabeledFactLine('核心適配：SQL／Looker 擁有權對齊此 JD。', 'en'),
    ).toBe('Core fit: SQL／Looker 擁有權對齊此 JD。');
  });
});
