'use client';

import React from 'react';
import type { FullReport, GuideQuestion, GuideResumeRewrite, GuideSource, LiteReport } from '@/types';
import { ExternalLink } from 'lucide-react';
import { Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { BeagleIcon, getScoreInfo } from '@/components/AnalysisDashboard';
import {
  BODY,
  BODY_MUTED,
} from '@/components/guide/GuideSlideChrome';
import {
  GUIDE_SECTION_FRAME,
  REPORT_H1,
  REPORT_H2,
  REPORT_H3,
} from '@/constants/report-frame';
import { formatOfferRange, marketBandDisclaimer, parseMoneyAmount, payEstimateScope } from '@/lib/offer-display';
import { isCitableSourceUrl } from '@/lib/provenance';
import { splitDecisionBrief } from '@/lib/decision-brief';
import { splitLabeledFact } from '@/lib/score-summary';
import { followUpLetterParagraphs, parseFollowUpEmail } from '@/lib/follow-up-email';
import { parseQuestionsSummary } from '@/lib/questions-summary';
import { guideItemSummaries, snapshotItemSummaries, splitSummaryPoints } from '@/lib/report-item-summaries';
import { splitBuyerSellerStances } from '@/lib/stance-bullets';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';

export const GUIDE_ITEM_IDS = [
  'core',
  'market',
  'fit',
  'land',
  'company',
  'questions',
  'negotiate',
] as const;

export type GuideItemId = (typeof GUIDE_ITEM_IDS)[number];

type ItemCopy = {
  core: string;
  market: string;
  fit: string;
  land: string;
  company: string;
  questions: string;
  negotiate: string;
  nav: Record<GuideItemId, string>;
  summary: string;
  analysisSummary: string;
  nextAction: string;
  conditions: string;
  duties: string;
  band: string;
  where: string;
  role: string;
  level: string;
  score: string;
  keywords: string;
  keywordsNote: string;
  apply: string;
  lockPay: string;
  lockRewrite: string;
  before: string;
  after: string;
  target: string;
  ceiling: string;
  judgment: string;
  base: string;
  equity: string;
  bonus: string;
  companyStance: string;
  candidateStance: string;
  culture: string;
  pros: string;
  cons: string;
  companyReview: string;
  layoff: string;
  labor: string;
  h1b: string;
  remote: string;
  roleReviews: string;
  professional: string;
  behavioral: string;
  professionalAnalysis: string;
  behavioralAnalysis: string;
  reported: string;
  predicted: string;
  extra: string;
  extraRule: string;
  answer: string;
  process: string;
  pay: string;
  benefits: string;
  say: string;
  askCompany: string;
  followUp: string;
  subject: string;
  sources: string;
  empty: string;
  noBand: string;
  badge: Record<GuideItemId, string>;
};

function extraRuleCopy(language: AppLanguage): string {
  switch (language) {
    case 'zh-TW':
      return '以下十題為近期最重要的面試題；近三年其餘真題列於補充資料列表。';
    case 'zh-CN':
      return '以下十题为近期最重要的面试题；近三年其余真题列于补充资料列表。';
    case 'es':
      return 'Estas diez son las de mayor prioridad reciente. El resto de preguntas reales de los últimos tres años aparece abajo.';
    case 'hi':
      return 'ये दस हाल की प्राथमिकता वाले प्रश्न हैं। पिछले तीन वर्षों के शेष वास्तविक प्रश्न नीचे हैं।';
    case 'ar':
      return 'هذه العشر هي المجموعة الأحدث والأولى أولوية. بقية الأسئلة الحقيقية من السنوات الثلاث الماضية أدناه.';
    default:
      return 'These ten are the most recent priority set. Remaining reported questions from the last three years appear below.';
  }
}

function itemCopy(language: AppLanguage): ItemCopy {
  if (language === 'zh-TW' || language === 'zh-CN') {
    const s = language === 'zh-CN';
    return {
      core: s ? '职位核心解析' : '職位核心解析',
      market: s ? '市场薪资水准' : '市場薪資水準',
      fit: '匹配度分析',
      land: s ? '个人化薪资落点' : '個人化薪資落點',
      company: s ? '公司与职位评价' : '公司與職位評價',
      questions: s ? '面试真题准备' : '面試真題準備',
      negotiate: s ? '面试谈判建议' : '面試談判建議',
      nav: {
        core: s ? '职位核心' : '職位核心',
        market: s ? '市场薪资' : '市場薪資',
        fit: s ? '匹配履历' : '匹配履歷',
        land: s ? '薪资落点' : '薪資落點',
        company: s ? '公司评价' : '公司評價',
        questions: s ? '面试真题' : '面試真題',
        negotiate: s ? '谈判建议' : '談判建議',
      },
      summary: s ? '职位概述' : '職位概述',
      analysisSummary: s ? '总结分析' : '總結分析',
      nextAction: s ? '下一步' : '下一步',
      conditions: s ? '关键条件' : '關鍵條件',
      duties: s ? '关键职责' : '關鍵職責',
      band: s ? '市场总薪酬区间' : '市場總薪酬區間',
      where: s ? '地点' : '地點',
      role: s ? '职位' : '職位',
      level: s ? '职级或年资' : '職級或年資',
      score: s ? '匹配分数与灯号' : '匹配分數與燈號',
      keywords: s ? '欠缺的硬性关键字' : '欠缺的硬性關鍵字',
      keywordsNote: s
        ? '这些是人力资源筛选系统用来比对简历的重要关键字。简历里没有这些词，申请可能在招聘人员阅读之前就被系统排除。'
        : '這些是人資篩選系統用來比對履歷的重要關鍵字。履歷裡沒有這些詞，申請可能在招募人員閱讀之前就被系統排除。',
      apply: s ? '应征建议' : '應徵建議',
      lockPay: s
        ? '🔒 升级 Interview Guide 可解锁个人化精准落点与 TC 结构拆解'
        : '🔒 升級 Interview Guide 可解鎖個人化精準落點與 TC 結構拆解',
      lockRewrite: s
        ? '🔒 升级 Interview Guide 可解锁针对该硬伤的具体修改范例与满分话术'
        : '🔒 升級 Interview Guide 可解鎖針對該硬傷的具體修改範例與滿分話術',
      before: s ? '修改前' : '修改前',
      after: s ? '修改后' : '修改後',
      target: s ? '个人战略目标薪资' : '個人戰略目標薪資',
      ceiling: s ? '议价天花板' : '議價天花板',
      judgment: s ? '判断：为什么是这些数字' : '判斷：為什麼是這些數字',
      base: s ? '底薪' : '底薪',
      equity: s ? '股票' : '股票',
      bonus: s ? '奖金' : '獎金',
      companyStance: s ? '公司立场' : '公司立場',
      candidateStance: s ? '求职者立场' : '求職者立場',
      culture: s ? '公司情报' : '公司情報',
      pros: s ? '优点' : '優點',
      cons: s ? '缺点' : '缺點',
      companyReview: s ? '公司评价' : '公司評價',
      layoff: s ? '裁员风险' : '裁員風險',
      labor: s ? '劳工争议' : '勞工爭議',
      h1b: s ? '签证赞助状况评估' : '簽證贊助狀況評估',
      remote: s ? '远端 / 签证赞助' : '遠端 / 簽證贊助',
      roleReviews: s ? '职位评价' : '職位評價',
      professional: s ? '专业题' : '專業題',
      behavioral: s ? '行为题' : '行為題',
      professionalAnalysis: s ? '专业题分析' : '專業題分析',
      behavioralAnalysis: s ? '行为题分析' : '行為題分析',
      reported: s ? '网络真题' : '網路真題',
      predicted: s ? 'AI 预测题' : 'AI 預測題',
      extra: s ? '补充资料列表' : '補充資料列表',
      extraRule: extraRuleCopy(language),
      answer: s ? '建议答案' : '建議答案',
      process: s ? '面试流程' : '面試流程',
      pay: s ? '薪资筹码策略' : '薪資籌碼策略',
      benefits: s ? '权益与福利争取' : '權益與福利爭取',
      say: s ? '开口这样说' : '開口這樣說',
      askCompany: s ? '建议问公司的问题' : '建議問公司的問題',
      followUp: s ? '建议面试后寄给公司的信（如果需要）' : '建議面試後寄給公司的信（如果需要）',
      subject: '主旨',
      sources: s ? '资料来源' : '資料來源',
      empty: s ? '这次没有抽出这项。' : '這次沒有抽出這項。',
      noBand: s ? '这次没有足够的薪酬信号。' : '這次沒有足夠的薪酬信號。',
      badge: {
        core: 'JD',
        market: 'BAND',
        fit: 'FIT',
        land: 'TC',
        company: 'INTEL',
        questions: '20',
        negotiate: 'OFFER',
      },
    };
  }
  return {
    core: 'Role core',
    market: 'Market pay',
    fit: 'Fit analysis',
    land: 'Personalized pay landing',
    company: 'Company and role reputation',
    questions: 'Interview questions',
    negotiate: 'Negotiation',
    nav: {
      core: 'Role core',
      market: 'Market pay',
      fit: 'Fit',
      land: 'Pay landing',
      company: 'Company',
      questions: 'Questions',
      negotiate: 'Negotiation',
    },
    summary: 'Job overview',
    analysisSummary: 'Analysis summary',
    nextAction: 'Next step',
    conditions: 'Must-haves',
    duties: 'Real duties',
    band: 'Market total compensation range',
    where: 'Where',
    role: 'Role',
    level: 'Level or years',
    score: 'Score and signal',
    keywords: 'Missing hard keywords',
    keywordsNote:
      'These are keywords the applicant tracking system uses to screen resumes. If the resume does not contain them, the application can be filtered out before a recruiter reads it.',
    apply: 'Apply advice',
    lockPay: '🔒 Upgrade to Interview Guide for your pay landing and TC split',
    lockRewrite: '🔒 Upgrade to Interview Guide for line-by-line rewrites of these gaps',
    before: 'Before',
    after: 'After',
    target: 'Personal target compensation',
    ceiling: 'Ceiling',
    judgment: 'Judgment: why these numbers',
    base: 'Base',
    equity: 'Equity',
    bonus: 'Bonus',
    companyStance: 'Company position',
    candidateStance: 'Candidate position',
    culture: 'Company intel',
    pros: 'Pros',
    cons: 'Cons',
    companyReview: 'Company reviews',
    layoff: 'Layoff risk',
    labor: 'Labor risk',
    h1b: 'Visa sponsorship',
    remote: 'Remote / Sponsorship',
    roleReviews: 'Role reviews',
    professional: 'Professional',
    behavioral: 'Behavioral',
    professionalAnalysis: 'Professional analysis',
    behavioralAnalysis: 'Behavioral analysis',
    reported: 'Reported question',
    predicted: 'AI prediction',
    extra: 'Additional reported questions',
    extraRule: extraRuleCopy(language),
    answer: 'Suggested answer',
    process: 'Interview process',
    pay: 'Pay leverage',
    benefits: 'Benefits to negotiate',
    say: 'What to say',
    askCompany: 'Questions to ask the company',
    followUp: 'Note to send after the interview, if one is needed',
    subject: 'Subject',
    sources: 'Data sources',
    empty: 'This section came back empty.',
    noBand: 'Not enough pay signal for a market range.',
    badge: {
      core: 'JD',
      market: 'BAND',
      fit: 'FIT',
      land: 'TC',
      company: 'INTEL',
      questions: '20',
      negotiate: 'OFFER',
    },
  };
}

const GUIDE_PAGE_IDS = ['core', 'land', 'company', 'questions', 'negotiate'] as const;

export function guideItemNav(language?: AppLanguage | string): Array<{ id: GuideItemId; label: string }> {
  const copy = itemCopy(normalizeReportLanguage(language));
  return GUIDE_PAGE_IDS.map((id) => ({ id, label: copy.nav[id] }));
}

const PAY_SLICE_COLORS = ['#34d399', '#38bdf8', '#a5b4fc'] as const;

function parsePayAmount(raw: string): number | null {
  const match = raw.replace(/,/g, '').match(/([\d.]+)\s*([kKmM])?/);
  const digits = match?.[1];
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match?.[2]?.toLowerCase();
  if (unit === 'k') return value * 1000;
  if (unit === 'm') return value * 1_000_000;
  return value;
}

function PayMixPie({
  rows,
  totalLabel,
  bare = false,
}: {
  rows: Array<[string, string]>;
  totalLabel: string;
  bare?: boolean;
}) {
  const slices = rows.flatMap((row, index) => {
    const amount = parsePayAmount(row[1]);
    if (amount === null) return [];
    return [{ label: row[0], value: row[1], amount, fill: PAY_SLICE_COLORS[index % PAY_SLICE_COLORS.length] ?? '#34d399' }];
  });
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  if (slices.length < 2 || total <= 0) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border border-emerald-400/25 bg-black/20 px-2.5 py-2">
            <p className={BODY_MUTED}>{label}</p>
            <p className={`${BODY} font-semibold text-emerald-50`}>{value}</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`grid w-fit max-w-full grid-cols-1 items-center justify-items-start gap-x-6 gap-y-2 md:grid-cols-[16rem_auto] ${bare ? '' : 'rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4'}`}>
      <div className="relative mx-auto h-56 w-full max-w-[16rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="label"
              innerRadius="62%"
              outerRadius="90%"
              stroke="none"
              paddingAngle={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.label} fill={slice.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
          <span className="text-2xl font-black leading-tight text-white">{totalLabel}</span>
        </div>
      </div>
      <ul className="grid w-max max-w-full grid-cols-[auto_auto_auto_auto] items-center gap-x-3 gap-y-3">
        {slices.map((slice) => (
          <li key={slice.label} className="contents">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} aria-hidden />
            <span className={`${BODY} font-semibold text-slate-100`}>{slice.label}</span>
            <span className={`${BODY} font-semibold text-white`}>{slice.value}</span>
            <span className={`${BODY} tabular-nums text-slate-300`}>
              {Math.round((slice.amount / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function bandEnds(offer: LiteReport['expected_offer']): { low: string | null; high: string | null } {
  const range = formatOfferRange(offer);
  if (!range) return { low: null, high: null };
  const parts = range.split(/\s*[–—-]\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { low: parts[0] ?? null, high: parts[parts.length - 1] ?? null };
  }
  return { low: range, high: null };
}

function markerPercent(value: number | null, min: number, span: number): number | null {
  if (value === null) return null;
  if (span <= 0) return 50;
  return Math.max(2, Math.min(98, ((value - min) / span) * 100));
}

function onBarPayLabel(label: string): string {
  if (label === '個人戰略目標薪資') return '個人目標';
  if (label === '个人战略目标薪资') return '个人目标';
  if (label === 'Personal target compensation') return 'Target';
  return label;
}

function markerLabelTransform(pct: number): string {
  if (pct <= 16) return 'translateX(0%)';
  if (pct >= 84) return 'translateX(-100%)';
  return 'translateX(-50%)';
}

function PayRangeMark({
  pct,
  label,
  value,
  tone,
  side,
}: {
  pct: number;
  label: string;
  value: string;
  tone: 'target' | 'ceiling';
  side: 'above' | 'below';
}) {
  const mark = onBarPayLabel(label);
  const dot = tone === 'target'
    ? 'border-2 border-white bg-emerald-400'
    : 'border-2 border-white bg-sky-400';
  const nameColor = tone === 'target' ? 'text-emerald-300' : 'text-sky-300';
  return (
    <>
      <span
        className={`absolute top-1/2 z-[1] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${dot}`}
        style={{ left: `${pct}%` }}
        data-range-mark={tone}
        title={`${mark} ${value}`}
      />
      <span
        className={`pointer-events-none absolute z-[2] w-max max-w-[8.5rem] text-center leading-tight ${
          side === 'above' ? 'bottom-[calc(100%+0.45rem)]' : 'top-[calc(100%+0.45rem)]'
        }`}
        style={{ left: `${pct}%`, transform: markerLabelTransform(pct) }}
        data-range-label={tone}
      >
        <span className={`block text-sm font-bold ${nameColor}`}>{mark}</span>
        <span className="block text-sm font-semibold tabular-nums text-white">{value}</span>
      </span>
    </>
  );
}

function PayRangeLine({
  offer,
  currency,
  targetLabel,
  targetValue,
  ceilingLabel,
  ceilingValue,
  variant = 'compact',
}: {
  offer: LiteReport['expected_offer'];
  currency?: string;
  targetLabel?: string;
  targetValue?: string;
  ceilingLabel?: string;
  ceilingValue?: string;
  variant?: 'hero' | 'compact';
}) {
  const { low, high } = bandEnds(offer);
  const rangeText = formatOfferRange(offer);
  const money = currency?.trim() || offer?.currency || 'USD';
  const amounts = [
    parseMoneyAmount(low),
    parseMoneyAmount(high),
    parseMoneyAmount(targetValue),
    parseMoneyAmount(ceilingValue),
  ].filter((n): n is number => n !== null);
  const min = amounts.length > 0 ? Math.min(...amounts) : null;
  const max = amounts.length > 0 ? Math.max(...amounts) : null;
  const span = min !== null && max !== null && max > min ? max - min : 0;
  const lowPct = min !== null ? markerPercent(parseMoneyAmount(low), min, span) : null;
  const highPct = min !== null ? markerPercent(parseMoneyAmount(high), min, span) : null;
  const targetPct = min !== null ? markerPercent(parseMoneyAmount(targetValue), min, span) : null;
  const ceilingPct = min !== null ? markerPercent(parseMoneyAmount(ceilingValue), min, span) : null;
  const fillLeft = lowPct ?? 0;
  const fillRight = 100 - (highPct ?? 100);
  const hero = variant === 'hero';
  const staggerCeiling =
    targetPct !== null && ceilingPct !== null;
  const aria = [
    rangeText ? `${rangeText} (${money})` : money,
    targetLabel && targetValue ? `${targetLabel} ${targetValue}` : null,
    ceilingLabel && ceilingValue ? `${ceilingLabel} ${ceilingValue}` : null,
  ].filter(Boolean).join('. ');
  return (
    <div
      className={hero ? 'min-w-0' : 'w-full min-w-0'}
      data-pay-range={variant}
      role="img"
      aria-label={aria}
    >
      {hero ? (
        <div className="mb-3 flex items-end justify-between gap-3">
          <span className="text-3xl font-black tabular-nums tracking-tight text-white">{low ?? rangeText ?? '—'}</span>
          <span className={`${BODY_MUTED} mb-0.5 shrink-0`}>{money}</span>
          {high ? (
            <span className="text-3xl font-black tabular-nums tracking-tight text-white">{high}</span>
          ) : null}
        </div>
      ) : rangeText ? (
        <p className={`${BODY} mb-2 font-semibold text-white`}>{rangeText}</p>
      ) : null}
      <div className={hero ? undefined : 'px-[3.25rem]'}>
        <div className={`relative ${hero ? 'mx-1 mt-1 mb-2 h-3.5' : 'mt-12 mb-12 h-2.5'} rounded-full bg-slate-700`}>
          <span
            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
            style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
          />
          {hero ? (
            <>
              <span className="absolute left-0 top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-white" aria-hidden />
              <span className="absolute right-0 top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-white" aria-hidden />
            </>
          ) : null}
          {targetPct !== null && targetValue ? (
            <PayRangeMark
              pct={targetPct}
              label={targetLabel || ''}
              value={targetValue}
              tone="target"
              side="above"
            />
          ) : null}
          {ceilingPct !== null && ceilingValue ? (
            <PayRangeMark
              pct={ceilingPct}
              label={ceilingLabel || ''}
              value={ceilingValue}
              tone="ceiling"
              side={staggerCeiling ? 'below' : 'above'}
            />
          ) : null}
          {!hero ? (
            <>
              <span
                className={`pointer-events-none absolute left-0 top-1/2 -translate-x-[calc(100%+0.5rem)] -translate-y-1/2 ${BODY} tabular-nums text-slate-300`}
              >
                {low ?? ''}
              </span>
              <span
                className={`pointer-events-none absolute right-0 top-1/2 translate-x-[calc(100%+0.5rem)] -translate-y-1/2 ${BODY} tabular-nums text-slate-300`}
              >
                {high ?? ''}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BriefRows({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2 py-1">
      {items.map((item) => {
        const { label, detail } = splitLabeledFact(item);
        return (
          <li key={item} className="flex gap-2.5">
            <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300/90" aria-hidden />
            <span className={`${BODY} font-medium text-slate-100 leading-snug`}>
              {detail ? (
                <>
                  <span className="font-bold text-blue-300">{label}</span>
                  {item.includes('：') ? '：' : ': '}
                  {detail}
                </>
              ) : (
                item
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function BriefColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className={`mb-2 ${REPORT_H2}`}>{title}</h3>
      {children}
    </section>
  );
}

function LockLine({ children }: { children: string }) {
  return (
    <p className="mt-3 text-base font-semibold text-slate-300">
      {children}
    </p>
  );
}

function groupRewrites(items: GuideResumeRewrite[]): Array<{ title: string; items: GuideResumeRewrite[] }> {
  const groups: Array<{ title: string; items: GuideResumeRewrite[] }> = [];
  for (const item of items) {
    const title = item.category?.trim() || item.gap;
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(item);
    else groups.push({ title, items: [item] });
  }
  return groups;
}

function RewriteGroups({
  rewrites,
  beforeLabel,
  afterLabel,
}: {
  rewrites: GuideResumeRewrite[];
  beforeLabel: string;
  afterLabel: string;
}) {
  return (
    <div className="w-full min-w-0 space-y-3">
      {groupRewrites(rewrites).map((group) => (
        <section
          key={group.title}
          className="w-full min-w-0 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4"
        >
          <h3 className={`mb-2 ${REPORT_H2}`}>{group.title}</h3>
          <ul className="space-y-4">
            {group.items.map((item) => {
              const showGap = item.gap.trim() !== group.title;
              return (
                <li key={`${item.gap}-${item.after}`}>
                  {showGap ? (
                    <p className={`flex gap-2.5 ${BODY} font-semibold text-slate-100 leading-snug`}>
                      <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-emerald-300/90" aria-hidden />
                      <span>{item.gap}</span>
                    </p>
                  ) : null}
                  <ul className={showGap ? 'mt-2 space-y-2 pl-5' : 'space-y-2'}>
                    {item.before ? (
                      <li className={`flex gap-2.5 ${BODY_MUTED} leading-snug`}>
                        <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-slate-400/80" aria-hidden />
                        <span>
                          <span className="font-semibold text-slate-300">{beforeLabel}</span>
                          {': '}
                          {item.before}
                        </span>
                      </li>
                    ) : null}
                    <li className={`flex gap-2.5 ${BODY} text-slate-100 leading-snug`}>
                      <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-slate-300/80" aria-hidden />
                      <span>
                        <span className="font-semibold">{afterLabel}</span>
                        {': '}
                        {item.after}
                      </span>
                    </li>
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function briefLines(text: string): string[] {
  const lined = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lined.length > 1) return lined;
  const sentences = text.split(/(?<=[。！？])/).map((line) => line.trim()).filter(Boolean);
  return sentences.length > 0 ? sentences : lined;
}

function PointList({ items, dot }: { items: string[]; dot: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
          <span className={`${BODY} font-medium leading-snug text-slate-100`}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionCard({
  title,
  children,
  className,
  heading = REPORT_H2,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  heading?: string;
}) {
  return (
    <section className={className ? `${GUIDE_SECTION_FRAME} ${className}` : GUIDE_SECTION_FRAME}>
      <h2 className={heading}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** L3 label inside a shared GUIDE_SECTION_FRAME — no extra outer card. */
function InnerSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `min-w-0 ${className}` : 'min-w-0'}>
      <h3 className={REPORT_H3}>{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SummaryCard({ label, summary }: { label: string; summary: string }) {
  const points = splitSummaryPoints(summary);
  if (points.length === 0) return null;
  return (
    <SectionCard title={label} heading={REPORT_H1}>
      {points.length > 1 ? (
        <BriefRows items={points} />
      ) : (
        <p className={`${BODY} font-medium leading-relaxed text-slate-100`}>{points[0]}</p>
      )}
    </SectionCard>
  );
}

function AnalysisBody({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  if (lines.length === 1) {
    return <p className={`${BODY} font-medium leading-relaxed text-slate-100`}>{lines[0]}</p>;
  }
  return <PointList items={lines} dot="bg-indigo-300" />;
}

function QuestionsSummaryCard({
  label,
  summary,
  professionalTitle,
  behavioralTitle,
}: {
  label: string;
  summary: string;
  professionalTitle: string;
  behavioralTitle: string;
}) {
  const parts = parseQuestionsSummary(summary);
  const hasColumns = parts.professional.length > 0 || parts.behavioral.length > 0;
  if (!parts.process && !hasColumns) {
    return <SummaryCard label={label} summary={summary} />;
  }
  return (
    <SectionCard title={label} heading={REPORT_H1}>
      {parts.process ? <BriefRows items={[parts.process]} /> : null}
      {hasColumns ? (
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${parts.process ? 'mt-4' : ''}`}>
          <InnerSection title={professionalTitle}>
            <AnalysisBody lines={parts.professional} />
          </InnerSection>
          <InnerSection title={behavioralTitle}>
            <AnalysisBody lines={parts.behavioral} />
          </InnerSection>
        </div>
      ) : null}
    </SectionCard>
  );
}

function ReviewColumn({
  title,
  prosLabel,
  consLabel,
  pros,
  cons,
  sourcesTitle,
  sources,
  columnClass,
}: {
  title: string;
  prosLabel: string;
  consLabel: string;
  pros: string[];
  cons: string[];
  sourcesTitle: string;
  sources: GuideSource[];
  columnClass: string;
}) {
  return (
    <section
      className={`${GUIDE_SECTION_FRAME} min-w-0 ${columnClass} md:row-span-4 md:grid md:grid-rows-subgrid`}
    >
      <h2 className={REPORT_H2}>{title}</h2>
      <div className="mt-4 min-w-0 md:mt-0">
        <p className={`${REPORT_H3} mb-2`}>{prosLabel}</p>
        <PointList items={pros} dot="bg-emerald-300" />
      </div>
      <div className="mt-4 min-w-0 md:mt-0">
        <p className={`${REPORT_H3} mb-2`}>{consLabel}</p>
        <PointList items={cons} dot="bg-slate-300" />
      </div>
      <div className="min-w-0">
        <SourceList title={sourcesTitle} sources={sources} className="mt-3 md:mt-0" />
      </div>
    </section>
  );
}

function SourceList({
  title,
  sources,
  className = 'mt-3',
}: {
  title: string;
  sources: GuideSource[];
  className?: string;
}) {
  const cited = sources.filter((source) => isCitableSourceUrl(source.url));
  if (cited.length === 0) return null;
  return (
    <div className={className}>
      <p className={`${REPORT_H3} mb-2`}>{title}</p>
      <ul className="space-y-1.5">
        {cited.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 ${BODY} font-semibold text-sky-300 hover:text-sky-200`}
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              {source.title || source.url.replace(/^https?:\/\//, '')}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionOverview({ label, summary }: { label: string; summary: string }) {
  const points = splitSummaryPoints(summary);
  if (points.length === 0) return null;
  return (
    <div className="mt-4">
      <p className={REPORT_H2}>{label}</p>
      {points.length > 1 ? (
        <div className="mt-2">
          <BriefRows items={points} />
        </div>
      ) : (
        <p className={`${BODY} mt-2 font-medium leading-relaxed text-slate-100`}>{points[0]}</p>
      )}
    </div>
  );
}

function ItemBlock({
  title,
  summaryLabel,
  summary,
  children,
}: {
  title: string;
  summaryLabel?: string;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={GUIDE_SECTION_FRAME}>
      <h2 className={REPORT_H1}>{title}</h2>
      {summaryLabel ? <SectionOverview label={summaryLabel} summary={summary ?? ''} /> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CoreBody({ report, copy }: { report: LiteReport; copy: ItemCopy }) {
  const conditions = (report.role_read?.hiring_signals ?? []).slice(0, 5);
  const duties = (report.role_read?.responsibilities ?? []).slice(0, 5);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <BriefColumn title={copy.conditions}>
        {conditions.length > 0 ? <BriefRows items={conditions} /> : <p className={`${BODY_MUTED} py-3`}>{copy.empty}</p>}
      </BriefColumn>
      <BriefColumn title={copy.duties}>
        {duties.length > 0 ? <BriefRows items={duties} /> : <p className={`${BODY_MUTED} py-3`}>{copy.empty}</p>}
      </BriefColumn>
    </div>
  );
}

function MarketBody({
  report,
  copy,
  language,
  locked,
}: {
  report: LiteReport;
  copy: ItemCopy;
  language: AppLanguage;
  locked: boolean;
}) {
  const offer = report.expected_offer;
  const range = formatOfferRange(offer);
  const scope = payEstimateScope(report, language);
  const levelLines = scope.level.split(' — ').map((part) => part.trim()).filter(Boolean);
  const money = offer?.currency || 'USD';
  const disclaimer = marketBandDisclaimer(offer, scope, language);
  const caveat = [disclaimer.nature, disclaimer.method].filter(Boolean).join(' ');
  const facts: Array<{ title: string; lines: string[] }> = [
    { title: copy.where, lines: [scope.where] },
    { title: copy.role, lines: [scope.role] },
    { title: copy.level, lines: levelLines.length > 0 ? levelLines : [scope.level] },
  ];
  return (
    <div className="space-y-4">
      <div>
        <p className={REPORT_H2}>{copy.band}</p>
        {range ? (
          <div className="mt-3">
            <PayRangeLine offer={offer} currency={money} variant="hero" />
          </div>
        ) : (
          <p className={`${BODY} mt-1 font-semibold text-white leading-snug`}>{copy.noBand}</p>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {facts.map((fact) => (
          <li key={fact.title} className="min-w-0">
            <p className={REPORT_H3}>{fact.title}</p>
            {fact.lines.map((line) => (
              <p key={line} className={`${BODY} mt-1 font-semibold text-white leading-snug`}>
                {line}
              </p>
            ))}
          </li>
        ))}
      </ul>
      {range && caveat ? (
        <p className={`${BODY} font-medium leading-relaxed text-slate-200`}>{caveat}</p>
      ) : null}
      {locked ? <LockLine>{copy.lockPay}</LockLine> : null}
    </div>
  );
}

function FitBody({
  report,
  copy,
  language,
  locked,
  rewrites,
  analysisSummary = '',
}: {
  report: LiteReport;
  copy: ItemCopy;
  language: AppLanguage;
  locked: boolean;
  rewrites: GuideResumeRewrite[];
  analysisSummary?: string;
}) {
  const score = report.fit_score?.score ?? report.match_score ?? 0;
  const scoreInfo = getScoreInfo(score, language);
  const keywords = report.ats_warning?.missing_keywords ?? [];
  const gaps = (report.proof_map?.gaps ?? report.critical_gaps ?? []).slice(0, 4);
  const apply = report.apply_decision;
  const verdict = report.fit_score?.sharp_verdict
    || report.recruiter_verdict
    || report.one_sentence_sharp_critique
    || '';
  const verdictPoints = (report.fit_score?.sharp_verdict_points ?? [])
    .map((point) => point.trim())
    .filter(Boolean);
  const verdictLines = verdictPoints.length >= 2 ? verdictPoints : splitDecisionBrief(verdict);
  return (
    <div className="space-y-5">
      <section>
        <p className={`${REPORT_H2} mb-3`}>{copy.score}</p>
        <div className="flex items-center gap-4">
          <BeagleIcon
            className={`h-24 w-24 shrink-0 ${scoreInfo.glowClass}`}
            color={scoreInfo.fill}
            spotColor={scoreInfo.spotColor}
            glassesColor={scoreInfo.fill}
          />
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="68%"
                outerRadius="100%"
                barSize={12}
                data={[{ name: 'Score', value: score, fill: scoreInfo.fill }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={30} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className={`text-4xl font-black tabular-nums ${scoreInfo.color}`}>{score}</span>
            </div>
          </div>
        </div>
        <SectionOverview label={copy.analysisSummary} summary={analysisSummary} />
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
          <div className="min-w-0">
            <p className={`${REPORT_H1} ${scoreInfo.color}`}>{scoreInfo.level}</p>
            <p className={`${BODY} text-slate-300 mt-1`}>{scoreInfo.label}</p>
            {verdictLines.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {verdictLines.map((point) => (
                  <li key={point} className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
                    <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300/90" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <section className="min-w-0">
            <h3 className={`mb-2 ${REPORT_H1}`}>{copy.apply}</h3>
            {apply?.next_best_action ? (
              <p className={`${BODY} font-medium text-slate-100 leading-snug`}>
                {apply.next_best_action}
              </p>
            ) : (
              <p className={`${BODY_MUTED} py-3`}>{copy.empty}</p>
            )}
          </section>
        </div>
      </section>
      <section className="w-full min-w-0 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
        <h3 className={`mb-2 ${REPORT_H2}`}>{copy.keywords}</h3>
        <p className={`${BODY} mb-3 leading-relaxed text-slate-300`}>{copy.keywordsNote}</p>
        {keywords.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {keywords.slice(0, 8).map((word) => (
              <span key={word} className="rounded-md bg-slate-900 px-2 py-1 text-base font-semibold text-slate-100">
                {word}
              </span>
            ))}
          </div>
        ) : null}
        {gaps.length > 0 ? (
          <ul className="space-y-2">
            {gaps.map((item) => (
              <li key={item.gap} className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
                <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-emerald-300/90" aria-hidden />
                <span>
                  <span className="font-semibold text-slate-100">{item.gap}</span>
                  {item.description ? <span className="text-slate-300"> — {item.description}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : keywords.length === 0 ? (
          <p className={BODY_MUTED}>{copy.empty}</p>
        ) : null}
      </section>
      {locked ? <LockLine>{copy.lockRewrite}</LockLine> : null}
      {!locked && rewrites.length > 0 ? (
        <RewriteGroups rewrites={rewrites} beforeLabel={copy.before} afterLabel={copy.after} />
      ) : null}
    </div>
  );
}

export function SnapshotItemStack({
  report,
  language = 'en',
  locked = true,
  rewrites = [],
}: {
  report: LiteReport;
  language?: AppLanguage | string;
  locked?: boolean;
  rewrites?: GuideResumeRewrite[];
}) {
  const lang = normalizeReportLanguage(language);
  const copy = itemCopy(lang);
  const summaries = snapshotItemSummaries(report);
  return (
    <div className="space-y-4 px-5 py-4">
      <ItemBlock title={copy.fit}>
        <FitBody
          report={report}
          copy={copy}
          language={lang}
          locked={locked}
          rewrites={rewrites}
          analysisSummary={summaries.fit}
        />
      </ItemBlock>
      <ItemBlock title={copy.market} summaryLabel={copy.analysisSummary} summary={summaries.market}>
        <MarketBody report={report} copy={copy} language={lang} locked={locked} />
      </ItemBlock>
      <ItemBlock title={copy.core} summaryLabel={copy.summary} summary={summaries.core}>
        <CoreBody report={report} copy={copy} />
      </ItemBlock>
    </div>
  );
}

function QuestionList({
  items,
  copy,
}: {
  items: GuideQuestion[];
  copy: ItemCopy;
}) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.question} className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-600/80 bg-slate-900/60">
          <div className="min-w-0 p-4">
            <div className="flex items-start gap-3">
              <span className="w-9 shrink-0 font-mono text-2xl font-black tabular-nums leading-none text-indigo-200">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1 text-xl font-black text-indigo-100">
                    {item.origin === 'reported' ? copy.reported : copy.predicted}
                  </span>
                  {item.origin === 'reported' && isCitableSourceUrl(item.source_url) ? (
                    <a
                      href={item.source_url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-sky-300 hover:text-sky-200"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      {(item.source_url ?? '').replace(/^https?:\/\//, '').slice(0, 42)}
                    </a>
                  ) : null}
                </div>
                <p className="text-2xl font-bold leading-snug text-slate-100">{item.question}</p>
              </div>
            </div>
          </div>
          <div className="min-w-0 border-l border-white/10 bg-black/25 p-4">
            <p className={REPORT_H3}>{copy.answer}</p>
            <p className={`${BODY} mt-2 text-slate-100 leading-relaxed`}>{item.answer || '—'}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ExtraList({ items, title }: { items: GuideQuestion[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <details className="mt-3 rounded-lg border border-dashed border-slate-600 p-3">
      <summary className={`${BODY} font-semibold text-slate-200 cursor-pointer`}>{title}</summary>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.question} className="text-xl font-semibold leading-snug text-slate-200">
            {item.question}
            {isCitableSourceUrl(item.source_url) ? (
              <>
                {' '}
                <a href={item.source_url ?? undefined} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200">
                  {(item.source_url ?? '').replace(/^https?:\/\//, '').slice(0, 42)}
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function GuideItemPage({
  report,
  item,
  language = 'en',
}: {
  report: FullReport;
  item: GuideItemId;
  language?: AppLanguage | string;
}) {
  const lang = normalizeReportLanguage(language);
  const copy = itemCopy(lang);
  const modules = report.guide_modules;

  if (item === 'core') {
    return (
      <SnapshotItemStack
        report={report}
        language={lang}
        locked={false}
        rewrites={modules?.resume_rewrites ?? []}
      />
    );
  }

  let body: React.ReactNode = null;
  if (item === 'market') {
    body = <MarketBody report={report} copy={copy} language={lang} locked={false} />;
  }
  if (item === 'fit') {
    body = (
      <FitBody
        report={report}
        copy={copy}
        language={lang}
        locked={false}
        rewrites={modules?.resume_rewrites ?? []}
      />
    );
  }
  if (item === 'land') {
    const salary = modules?.salary_land;
    const mix = [
      [copy.base, salary?.base],
      [copy.equity, salary?.equity],
      [copy.bonus, salary?.bonus],
    ].filter((row): row is [string, string] => Boolean(row[1]));
    const stances = splitBuyerSellerStances(salary?.buyer_seller ?? '');
    const landPoints = splitSummaryPoints(salary?.rationale ?? '');
    body = salary ? (
      <div className="space-y-4">
        <section className={GUIDE_SECTION_FRAME}>
          <h2 className={REPORT_H1}>{copy.land}</h2>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {mix.length > 0 ? (
              <PayMixPie rows={mix} totalLabel={salary.target || '—'} bare />
            ) : (
              <p className="text-3xl font-black text-white">{salary.target || '—'}</p>
            )}
            <InnerSection title={copy.band} className="w-full max-w-sm sm:min-w-[20rem] lg:ml-auto lg:w-[24rem] lg:shrink-0">
              <PayRangeLine
                offer={report.expected_offer}
                targetLabel={copy.target}
                targetValue={salary.target}
                ceilingLabel={copy.ceiling}
                ceilingValue={salary.ceiling}
              />
            </InnerSection>
          </div>
          {landPoints.length > 0 ? (
            <div className="mt-4">
              {landPoints.length > 1 ? (
                <BriefRows items={landPoints} />
              ) : (
                <p className={`${BODY} font-medium leading-relaxed text-slate-100`}>{landPoints[0]}</p>
              )}
            </div>
          ) : null}
          <SourceList title={copy.sources} sources={salary.sources} />
        </section>
        {salary.buyer_seller ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SectionCard title={copy.companyStance}>
              {stances.company.length > 0 ? (
                <BriefRows items={stances.company} />
              ) : (
                <p className={`${BODY_MUTED} py-3`}>{copy.empty}</p>
              )}
            </SectionCard>
            <SectionCard title={copy.candidateStance}>
              {stances.candidate.length > 0 ? (
                <BriefRows items={stances.candidate} />
              ) : (
                <p className={`${BODY_MUTED} py-3`}>{copy.empty}</p>
              )}
            </SectionCard>
          </div>
        ) : null}
      </div>
    ) : <p className={BODY_MUTED}>{copy.empty}</p>;
  }
  if (item === 'company') {
    const company = modules?.company_eval;
    const split = company
      ? company.company_pros.length + company.company_cons.length + company.role_pros.length + company.role_cons.length > 0
      : false;
    body = company ? (
      split ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:grid-rows-[auto_auto_auto_auto]">
          <ReviewColumn
            title={copy.companyReview}
            prosLabel={copy.pros}
            consLabel={copy.cons}
            pros={company.company_pros}
            cons={company.company_cons}
            sourcesTitle={copy.sources}
            sources={company.sources}
            columnClass="md:col-start-1"
          />
          <ReviewColumn
            title={copy.roleReviews}
            prosLabel={copy.pros}
            consLabel={copy.cons}
            pros={company.role_pros}
            cons={company.role_cons}
            sourcesTitle={copy.sources}
            sources={company.role_sources}
            columnClass="md:col-start-2"
          />
        </div>
      ) : (
      <div className="space-y-4">
        <SectionCard title={copy.culture}>
          <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.culture || '—'}</p>
        </SectionCard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title={copy.layoff}>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.layoff_risk || '—'}</p>
            {company.labor_risk ? <p className={`${BODY_MUTED} mt-2`}>{copy.labor}: {company.labor_risk}</p> : null}
          </SectionCard>
          <SectionCard title={copy.h1b}>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.h1b || '—'}</p>
            <p className={`${BODY_MUTED} mt-2`}>{copy.remote}: {company.remote_sponsorship || '—'}</p>
          </SectionCard>
        </div>
        <SectionCard title={copy.roleReviews}>
          <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.role_reviews || '—'}</p>
        </SectionCard>
        <SourceList title={copy.sources} sources={company.sources} />
      </div>
      )
    ) : <p className={BODY_MUTED}>{copy.empty}</p>;
  }
  if (item === 'questions') {
    const bank = modules?.interview_bank;
    body = bank && (bank.professional.length > 0 || bank.behavioral.length > 0) ? (
      <div className="space-y-4">
        <p className={`${BODY} font-medium leading-relaxed text-slate-200`}>{copy.extraRule}</p>
        {bank.professional.length > 0 ? (
          <SectionCard title={copy.professional} heading={REPORT_H1}>
            <QuestionList items={bank.professional} copy={copy} />
            <ExtraList items={bank.professional_extra} title={copy.extra} />
          </SectionCard>
        ) : null}
        {bank.behavioral.length > 0 ? (
          <SectionCard title={copy.behavioral} heading={REPORT_H1}>
            <QuestionList items={bank.behavioral} copy={copy} />
            <ExtraList items={bank.behavioral_extra} title={copy.extra} />
          </SectionCard>
        ) : null}
      </div>
    ) : <p className={BODY_MUTED}>{copy.empty}</p>;
  }
  if (item === 'negotiate') {
    const negotiation = modules?.negotiation;
    const followUp = parseFollowUpEmail(negotiation?.follow_up_email ?? '');
    const followUpParagraphs = followUpLetterParagraphs(followUp.body);
    const playbook = Boolean(
      negotiation?.pay_strategy || negotiation?.benefits_strategy || negotiation?.script,
    );
    body = negotiation && (playbook || negotiation.company_questions || negotiation.follow_up_email) ? (
      <div className="space-y-4">
      {playbook ? (
        <section className={GUIDE_SECTION_FRAME}>
          {negotiation.pay_strategy || negotiation.benefits_strategy ? (
            <div
              className={`grid grid-cols-1 gap-4 ${
                negotiation.pay_strategy && negotiation.benefits_strategy ? 'md:grid-cols-2' : ''
              }`}
            >
              {negotiation.pay_strategy ? (
                <InnerSection title={copy.pay}>
                  <PointList items={briefLines(negotiation.pay_strategy)} dot="bg-indigo-300" />
                </InnerSection>
              ) : null}
              {negotiation.benefits_strategy ? (
                <InnerSection title={copy.benefits}>
                  <PointList items={briefLines(negotiation.benefits_strategy)} dot="bg-violet-300" />
                </InnerSection>
              ) : null}
            </div>
          ) : null}
          {negotiation.script ? (
            <InnerSection
              title={copy.say}
              className={negotiation.pay_strategy || negotiation.benefits_strategy ? 'mt-4' : undefined}
            >
              <p className={`${BODY} font-medium leading-relaxed text-slate-100`}>{negotiation.script}</p>
            </InnerSection>
          ) : null}
        </section>
      ) : null}
      {negotiation.company_questions ? (
        <SectionCard title={copy.askCompany}>
          <PointList items={briefLines(negotiation.company_questions)} dot="bg-sky-300" />
        </SectionCard>
      ) : null}
      {followUp.body || followUp.subject ? (
        <SectionCard title={copy.followUp}>
          {followUp.when ? (
            <p className={`${BODY_MUTED} mb-4 leading-relaxed`}>{followUp.when}</p>
          ) : null}
          <div className="rounded-xl border border-slate-600/80 bg-slate-950/50 px-6 py-5">
            {followUp.subject ? (
              <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/10 pb-3">
                <span className={`${BODY_MUTED} shrink-0`}>{copy.subject}</span>
                <span className={`${BODY} font-medium text-slate-100`}>{followUp.subject}</span>
              </div>
            ) : null}
            <div className="space-y-4">
              {followUpParagraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={`${BODY} whitespace-pre-wrap leading-[1.75] text-slate-100`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </SectionCard>
      ) : null}
      </div>
    ) : <p className={BODY_MUTED}>{copy.empty}</p>;
  }

  const summaries = guideItemSummaries(report);
  const snapshotSummaries = snapshotItemSummaries(report);
  const summaryByItem: Record<GuideItemId, string> = {
    core: snapshotSummaries.core,
    market: snapshotSummaries.market,
    fit: snapshotSummaries.fit,
    land: summaries.land,
    company: summaries.company,
    questions: summaries.questions,
    negotiate: summaries.negotiate,
  };
  return (
    <div className="space-y-4">
      {item === 'land' ? null : item === 'questions' ? (
        <QuestionsSummaryCard
          label={copy.analysisSummary}
          summary={summaryByItem.questions}
          professionalTitle={copy.professionalAnalysis}
          behavioralTitle={copy.behavioralAnalysis}
        />
      ) : (
        <SummaryCard label={copy.analysisSummary} summary={summaryByItem[item]} />
      )}
      {body}
    </div>
  );
}
