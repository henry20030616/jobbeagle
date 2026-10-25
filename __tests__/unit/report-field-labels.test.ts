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

  it('maps slangy negotiation and salary-land Kind keys to professional labels', () => {
    expect(localizeReportFieldLabel('開價', 'zh-TW')).toBe('建議報價');
    expect(localizeReportFieldLabel('上限', 'zh-TW')).toBe('議價上限');
    expect(localizeReportFieldLabel('禁區', 'zh-TW')).toBe('談判底線');
    expect(localizeReportFieldLabel('目標價', 'zh-TW')).toBe('目標總酬');
    expect(localizeReportFieldLabel('天花板', 'zh-TW')).toBe('議價上限');
    expect(localizeReportFieldLabel('結構', 'zh-TW')).toBe('薪酬結構');
    expect(localizeReportFieldLabel('先報總薪酬', 'zh-TW')).toBe('先報總酬');
    expect(localizeReportFieldLabel('還一次', 'zh-TW')).toBe('讓步節奏');
    expect(localizeReportFieldLabel('不隨競爭', 'zh-TW')).toBe('勿跟競價');
    expect(localizeReportFieldLabel('先鎖底薪', 'zh-TW')).toBe('底薪先鎖');
    expect(localizeReportFieldLabel('一次問完', 'zh-TW')).toBe('福利一次問清');
    expect(localizeReportFieldLabel('簽證另問', 'zh-TW')).toBe('簽證另議');
    expect(localizeReportFieldLabel('不換底薪', 'zh-TW')).toBe('底薪不換');
    expect(localizeReportFieldLabel('開口稿', 'zh-TW')).toBe('開場講稿');
    expect(localizeReportFieldLabel('Open', 'en')).toBe('Suggested quote');
    expect(localizeReportFieldLabel('Cap', 'en')).toBe('Negotiation ceiling');
    expect(localizeReportFieldLabel('Ban', 'en')).toBe('Walk-away line');
    expect(localizeReportFieldLabel('开价', 'zh-CN')).toBe('建议报价');
    expect(localizeLabeledFactLine('開價：總薪酬 $168K', 'zh-TW')).toBe('建議報價：總薪酬 $168K');
    expect(localizeLabeledFactLine('Ceiling: $185K', 'zh-TW')).toBe('議價上限：$185K');
  });

  it('rebuilds labeled lines with a CJK colon on zh-TW', () => {
    expect(
      localizeLabeledFactLine('Core fit: SQL/Looker ownership maps to the JD.', 'zh-TW'),
    ).toBe('核心適配：SQL/Looker ownership maps to the JD.');
    expect(
      localizeLabeledFactLine('Years：具備 IT、軟體或系統整合專案管理經驗', 'zh-TW'),
    ).toBe('年資：具備 IT、軟體或系統整合專案管理經驗');
    expect(
      localizeLabeledFactLine('核心適配：SQL／Looker 職責對齊此 JD。', 'en'),
    ).toBe('Core fit: SQL／Looker 職責對齊此 JD。');
  });
});
