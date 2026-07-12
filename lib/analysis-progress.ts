/** Shared simulated analysis progress (UI only — API has no streaming). */

export const ANALYSIS_PROGRESS_SCHEDULE = [
  { time: 0, progress: 0 },
  { time: 4, progress: 15 },
  { time: 11, progress: 35 },
  { time: 21, progress: 55 },
  { time: 34, progress: 72 },
  { time: 48, progress: 85 },
  { time: 65, progress: 93 },
  { time: 100, progress: 99 },
] as const;

const STAGES: Record<string, Array<{ minProgress: number; label: string }>> = {
  'zh-TW': [
    { minProgress: 0, label: '🔍 讀取職缺資訊...' },
    { minProgress: 15, label: '📋 分析職缺要求與條件...' },
    { minProgress: 35, label: '🌐 蒐集市場情報與產業資訊...' },
    { minProgress: 55, label: '💰 比對薪資市場數據...' },
    { minProgress: 72, label: '🔎 評估履歷匹配程度...' },
    { minProgress: 85, label: '🎯 挖掘真實面試情報...' },
    { minProgress: 93, label: '📊 整合戰略報告中...' },
  ],
  'zh-CN': [
    { minProgress: 0, label: '🔍 读取职位信息...' },
    { minProgress: 15, label: '📋 分析职位要求与条件...' },
    { minProgress: 35, label: '🌐 收集市场情报与行业信息...' },
    { minProgress: 55, label: '💰 对比薪资市场数据...' },
    { minProgress: 72, label: '🔎 评估简历匹配程度...' },
    { minProgress: 85, label: '🎯 挖掘真实面试情报...' },
    { minProgress: 93, label: '📊 整合战略报告中...' },
  ],
  en: [
    { minProgress: 0, label: '🔍 Reading job description...' },
    { minProgress: 15, label: '📋 Analyzing job requirements...' },
    { minProgress: 35, label: '🌐 Gathering market intelligence...' },
    { minProgress: 55, label: '💰 Benchmarking salary data...' },
    { minProgress: 72, label: '🔎 Evaluating resume match...' },
    { minProgress: 85, label: '🎯 Researching interview insights...' },
    { minProgress: 93, label: '📊 Compiling your strategy report...' },
  ],
};

export function getAnalysisProgressAtTime(elapsedSec: number): number {
  const schedule = ANALYSIS_PROGRESS_SCHEDULE;
  for (let i = 1; i < schedule.length; i++) {
    if (elapsedSec <= schedule[i].time) {
      const prev = schedule[i - 1];
      const next = schedule[i];
      const t = (elapsedSec - prev.time) / (next.time - prev.time);
      return Math.round(prev.progress + t * (next.progress - prev.progress));
    }
  }
  return 99;
}

export function getAnalysisStageLabel(
  progress: number,
  language: string = 'en',
): string {
  const stages = STAGES[language] ?? STAGES.en;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (progress >= stages[i].minProgress) return stages[i].label;
  }
  return stages[0].label;
}
