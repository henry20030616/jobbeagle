'use client';

import React from 'react';
import type { FullReport, GuideQuestion, GuideResumeRewrite, GuideSource, LiteReport } from '@/types';
import { ExternalLink } from 'lucide-react';
import { Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { BeagleIcon, getScoreInfo } from '@/components/AnalysisDashboard';
import {
  BODY,
  BODY_MUTED,
  GuideSlideShell,
  PageHeaderBar,
  SECTION_TITLE,
} from '@/components/guide/GuideSlideChrome';
import { formatOfferRange, payEstimateScope } from '@/lib/offer-display';
import { splitDecisionBrief } from '@/lib/decision-brief';
import { getSnapshotUiCopy } from '@/lib/report-ui-copy';
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
  conditions: string;
  duties: string;
  band: string;
  where: string;
  role: string;
  level: string;
  score: string;
  keywords: string;
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
  buyer: string;
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
  reported: string;
  predicted: string;
  extra: string;
  answer: string;
  process: string;
  pay: string;
  benefits: string;
  say: string;
  sources: string;
  empty: string;
  noBand: string;
  notOffer: string;
  deck: Record<GuideItemId, string>;
  badge: Record<GuideItemId, string>;
};

function itemCopy(language: AppLanguage): ItemCopy {
  if (language === 'zh-TW' || language === 'zh-CN') {
    const s = language === 'zh-CN';
    return {
      core: s ? '职位核心解析' : '職位核心解析',
      market: s ? '市场薪资水准' : '市場薪資水準',
      fit: s ? '匹配分数、履历分析' : '匹配分數、履歷分析',
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
      conditions: s ? '关键条件' : '關鍵條件',
      duties: s ? '关键职责' : '關鍵職責',
      band: s ? '市场总包区间' : '市場總包區間',
      where: s ? '地点' : '地點',
      role: s ? '职位' : '職位',
      level: s ? '职级或年资' : '職級或年資',
      score: s ? '匹配分数与灯号' : '匹配分數與燈號',
      keywords: s ? '欠缺的硬性关键字' : '欠缺的硬性關鍵字',
      apply: s ? '应征建议' : '應徵建議',
      lockPay: s
        ? '🔒 升级 Interview Guide 可解锁个人化精准落点与 TC 结构拆解'
        : '🔒 升級 Interview Guide 可解鎖個人化精準落點與 TC 結構拆解',
      lockRewrite: s
        ? '🔒 升级 Interview Guide 可解锁针对该硬伤的具体修改范例与满分话术'
        : '🔒 升級 Interview Guide 可解鎖針對該硬傷的具體修改範例與滿分話術',
      before: s ? '修改前' : '修改前',
      after: s ? '修改后' : '修改後',
      target: s ? '战略目标价' : '戰略目標價',
      ceiling: s ? '议价天花板' : '議價天花板',
      judgment: s ? '判断：为什么是这些数字' : '判斷：為什麼是這些數字',
      base: s ? '底薪' : '底薪',
      equity: s ? '股票' : '股票',
      bonus: s ? '奖金' : '獎金',
      buyer: s ? '买方 / 卖方筹码' : '買方 / 賣方籌碼',
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
      reported: s ? '网络真题' : '網路真題',
      predicted: s ? 'AI 预测题' : 'AI 預測題',
      extra: s ? '补充资料列表' : '補充資料列表',
      answer: s ? '建议答案' : '建議答案',
      process: s ? '面试流程' : '面試流程',
      pay: s ? '薪资筹码策略' : '薪資籌碼策略',
      benefits: s ? '权益与福利争取' : '權益與福利爭取',
      say: s ? '开口这样说' : '開口這樣說',
      sources: s ? '来源' : '來源',
      empty: s ? '这次没有抽出这项。' : '這次沒有抽出這項。',
      noBand: s ? '这次没有足够的薪酬信号。' : '這次沒有足夠的薪酬信號。',
      notOffer: s ? '这不是这家公司的报价。' : '這不是這家公司的報價。',
      deck: {
        core: '',
        market: s ? '依职位与地区给出的宽总包。个人落点在面试指南。' : '依職缺與地區給出的寬總包。個人落點在面試指南。',
        fit: s ? '分数是适配灯号。下方是履历对不上的硬关键字。' : '分數是適配燈號。下方是履歷對不上的硬關鍵字。',
        land: s ? '这一席你比较可能落到的总包，以及底薪、股票、奖金。' : '這一席你比較可能落到的總包，以及底薪、股票、獎金。',
        company: s ? '公开来源里的文化、裁员、H-1B，以及这个职位的评价。' : '公開來源裡的文化、裁員、H-1B，以及這個職位的評價。',
        questions: s ? '近三年专业题与行为题各 10 题。真题附来源。' : '近三年專業題與行為題各 10 題。真題附來源。',
        negotiate: s ? '先谈总包与底薪。底薪定了，再谈签约金、股票、远端与休假。' : '先談總包與底薪。底薪定了，再談簽約金、股票、遠端與休假。',
      },
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
    fit: 'Fit score and resume',
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
    conditions: 'Must-haves',
    duties: 'Real duties',
    band: 'Market total-comp range',
    where: 'Where',
    role: 'Role',
    level: 'Level or years',
    score: 'Score and signal',
    keywords: 'Missing hard keywords',
    apply: 'Whether to apply',
    lockPay: '🔒 Upgrade to Interview Guide for your pay landing and TC split',
    lockRewrite: '🔒 Upgrade to Interview Guide for line-by-line rewrites of these gaps',
    before: 'Before',
    after: 'After',
    target: 'Target',
    ceiling: 'Ceiling',
    judgment: 'Judgment: why these numbers',
    base: 'Base',
    equity: 'Equity',
    bonus: 'Bonus',
    buyer: 'Buyer / seller leverage',
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
    reported: 'Reported question',
    predicted: 'AI prediction',
    extra: 'Additional reported questions',
    answer: 'Suggested answer',
    process: 'Interview process',
    pay: 'Pay leverage',
    benefits: 'Benefits to negotiate',
    say: 'What to say',
    sources: 'Sources',
    empty: 'This section came back empty.',
    noBand: 'Not enough pay signal for a market range.',
    notOffer: 'This is not the company’s offer.',
    deck: {
      core: '',
      market: 'A wide total-comp band for this role and region. Your landing is in the Interview Guide.',
      fit: 'The score is the fit signal. Below are the hard keywords the resume does not show.',
      land: 'Where you are likely to land, split into base, equity, and bonus.',
      company: 'Public culture, layoff, H-1B, and what people say about this role.',
      questions: 'Ten professional and ten behavioral questions from the last three years, with sources.',
      negotiate: 'Settle total and base first. Then sign-on, equity, remote, and PTO.',
    },
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

export function guideItemNav(language?: AppLanguage | string): Array<{ id: GuideItemId; label: string }> {
  const copy = itemCopy(normalizeReportLanguage(language));
  return GUIDE_ITEM_IDS.map((id) => ({ id, label: copy.nav[id] }));
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
}: {
  rows: Array<[string, string]>;
  totalLabel: string;
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
    <div className="grid grid-cols-1 items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 md:grid-cols-[16rem_1fr]">
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
      <ul className="space-y-3">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: slice.fill }} aria-hidden />
            <span className={`${BODY} min-w-0 flex-1 font-semibold text-slate-100`}>{slice.label}</span>
            <span className={`${BODY} font-semibold text-white`}>{slice.value}</span>
            <span className={`${BODY} w-12 text-right text-slate-300`}>
              {Math.round((slice.amount / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BriefRows({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2 py-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300/90" aria-hidden />
          <span className={`${BODY} font-medium text-slate-100 leading-snug`}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BriefColumn({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-xl border ${accent}`}>
      <header className="border-b border-white/10 bg-black/20 px-4 py-3">
        <h3 className="text-xl font-black text-white">{title}</h3>
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function LockLine({ children }: { children: string }) {
  return (
    <p className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-base font-semibold text-slate-100">
      {children}
    </p>
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

function ReviewColumn({
  title,
  prosLabel,
  consLabel,
  pros,
  cons,
  sourcesTitle,
  sources,
  accent,
}: {
  title: string;
  prosLabel: string;
  consLabel: string;
  pros: string[];
  cons: string[];
  sourcesTitle: string;
  sources: GuideSource[];
  accent: string;
}) {
  return (
    <section className={`rounded-xl border p-4 ${accent}`}>
      <h3 className="mb-4 text-2xl font-black text-white">{title}</h3>
      <p className={`${SECTION_TITLE} mb-2 text-emerald-200`}>{prosLabel}</p>
      <PointList items={pros} dot="bg-emerald-300" />
      <p className={`${SECTION_TITLE} mb-2 mt-4 text-slate-200`}>{consLabel}</p>
      <PointList items={cons} dot="bg-slate-300" />
      <SourceList title={sourcesTitle} sources={sources} />
    </section>
  );
}

function SourceList({ title, sources }: { title: string; sources: GuideSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-3">
      <p className={`${SECTION_TITLE} text-slate-400 mb-2`}>{title}</p>
      <ul className="space-y-1.5">
        {sources.map((source) => (
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

function ItemBlock({
  kicker,
  title,
  deck,
  children,
}: {
  kicker: string;
  title: string;
  deck: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-700/90 px-5 py-4">
      <div className="mb-3">
        {kicker ? (
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-indigo-300">{kicker}</p>
        ) : null}
        <h2 className={`${kicker ? 'mt-1 ' : ''}text-2xl font-black text-white`}>{title}</h2>
        {deck ? <p className="mt-1 text-base leading-snug text-slate-400">{deck}</p> : null}
      </div>
      {children}
    </section>
  );
}

function CoreBody({ report, copy }: { report: LiteReport; copy: ItemCopy }) {
  const conditions = (report.role_read?.hiring_signals ?? []).slice(0, 5);
  const duties = (report.role_read?.responsibilities ?? []).slice(0, 5);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <BriefColumn
        title={copy.conditions}
        accent="border-sky-400/50 bg-indigo-500/10"
      >
        {conditions.length > 0 ? <BriefRows items={conditions} /> : <p className={`${BODY_MUTED} py-3`}>{copy.empty}</p>}
      </BriefColumn>
      <BriefColumn
        title={copy.duties}
        accent="border-sky-400/50 bg-slate-900/40"
      >
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
  const blocks: Array<{ title: string; lines: string[] }> = [
    { title: copy.where, lines: [scope.where] },
    { title: copy.role, lines: [scope.role] },
    { title: copy.level, lines: levelLines.length > 0 ? levelLines : [scope.level] },
    {
      title: copy.band,
      lines: range ? [`${range} (${money})`, copy.notOffer] : [copy.noBand],
    },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-400/55 bg-emerald-500/10">
      <ul className="space-y-4 px-5 py-4">
        {blocks.map((block) => (
          <li key={block.title}>
            <p className={`${SECTION_TITLE} text-emerald-200`}>{block.title}</p>
            {block.lines.map((line) => (
              <p key={line} className={`${BODY} mt-1 font-semibold text-white leading-snug`}>
                {line}
              </p>
            ))}
          </li>
        ))}
      </ul>
      {locked ? <div className="px-5 pb-4"><LockLine>{copy.lockPay}</LockLine></div> : null}
    </div>
  );
}

function FitBody({
  report,
  copy,
  language,
  locked,
  rewrites,
}: {
  report: LiteReport;
  copy: ItemCopy;
  language: AppLanguage;
  locked: boolean;
  rewrites: GuideResumeRewrite[];
}) {
  const ui = getSnapshotUiCopy(language);
  const score = report.fit_score?.score ?? report.match_score ?? 0;
  const scoreInfo = getScoreInfo(score, language);
  const keywords = report.ats_warning?.missing_keywords ?? [];
  const gaps = (report.proof_map?.gaps ?? report.critical_gaps ?? []).slice(0, 4);
  const apply = report.apply_decision;
  const verdict = report.fit_score?.sharp_verdict
    || report.recruiter_verdict
    || report.one_sentence_sharp_critique
    || '';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-sky-400/50 bg-indigo-500/10 p-4">
          <p className={`${SECTION_TITLE} text-indigo-200 mb-3`}>{copy.score}</p>
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
          <p className={`text-2xl font-black mt-3 ${scoreInfo.color}`}>{scoreInfo.level}</p>
          <p className={`${BODY} text-slate-300 mt-1`}>{scoreInfo.label}</p>
          {verdict ? <p className={`${BODY} text-slate-200 leading-relaxed mt-3`}>{verdict}</p> : null}
        </div>
        <div className="rounded-xl border border-violet-400/40 bg-violet-500/10 p-4">
          <p className={`${SECTION_TITLE} text-violet-200 mb-3`}>
            {(apply?.label && ui.applyLabels[apply.label]) || apply?.label || copy.apply}
          </p>
          {apply?.reason ? (
            <ul className="space-y-1.5">
              {splitDecisionBrief(apply.reason).map((point) => (
                <li key={point} className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
                  <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-violet-300/90" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={BODY_MUTED}>{copy.empty}</p>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
        <p className={`${SECTION_TITLE} text-slate-100 mb-3`}>{copy.keywords}</p>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
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
                <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-slate-300/80" aria-hidden />
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
        {locked ? <LockLine>{copy.lockRewrite}</LockLine> : null}
        {!locked && rewrites.length > 0 ? (
          <ul className="mt-3 space-y-2 border-t border-amber-400/30 pt-3">
            {rewrites.map((item) => (
              <li key={`${item.gap}-${item.after}`} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
                <p className={`${BODY} font-semibold text-emerald-100`}>{item.gap}</p>
                {item.before ? <p className={`${BODY_MUTED} mt-1`}>{copy.before}: {item.before}</p> : null}
                <p className={`${BODY} mt-1 text-slate-100`}>{copy.after}: {item.after}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
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
  return (
    <>
      <ItemBlock kicker="" title={copy.core} deck={copy.deck.core}>
        <CoreBody report={report} copy={copy} />
      </ItemBlock>
      <ItemBlock kicker="" title={copy.market} deck={copy.deck.market}>
        <MarketBody report={report} copy={copy} language={lang} locked={locked} />
      </ItemBlock>
      <ItemBlock kicker="" title={copy.fit} deck={copy.deck.fit}>
        <FitBody report={report} copy={copy} language={lang} locked={locked} rewrites={rewrites} />
      </ItemBlock>
    </>
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
                  {item.origin === 'reported' && item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-sky-300 hover:text-sky-200"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      {item.source_url.replace(/^https?:\/\//, '').slice(0, 42)}
                    </a>
                  ) : null}
                </div>
                <p className={`${BODY} font-semibold text-slate-100`}>{item.question}</p>
              </div>
            </div>
          </div>
          <div className="min-w-0 border-l border-white/10 bg-black/25 p-4">
            <p className="text-xl font-black text-slate-100">{copy.answer}</p>
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
          <li key={item.question} className={`${BODY} text-slate-300`}>
            {item.question}
            {item.source_url ? (
              <>
                {' '}
                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:text-sky-200">
                  {item.source_url.replace(/^https?:\/\//, '').slice(0, 42)}
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
  const title: Record<GuideItemId, string> = {
    core: copy.core,
    market: copy.market,
    fit: copy.fit,
    land: copy.land,
    company: copy.company,
    questions: copy.questions,
    negotiate: copy.negotiate,
  };

  let body: React.ReactNode = null;
  if (item === 'core') body = <CoreBody report={report} copy={copy} />;
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
    body = salary ? (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-emerald-400/55 bg-emerald-500/10 p-4">
            <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>{copy.target}</p>
            <p className="text-3xl font-black text-white">{salary.target || '—'}</p>
          </div>
          <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4">
            <p className={`${SECTION_TITLE} text-slate-200 mb-2`}>{copy.ceiling}</p>
            <p className="text-3xl font-black text-white">{salary.ceiling || '—'}</p>
          </div>
        </div>
        {salary.rationale ? (
          <section className="rounded-xl border border-sky-400/50 bg-indigo-500/10 p-4">
            <p className={`${SECTION_TITLE} text-indigo-200 mb-2`}>{copy.judgment}</p>
            <p className={`${BODY} text-slate-100 leading-relaxed`}>{salary.rationale}</p>
          </section>
        ) : null}
        {mix.length > 0 ? <PayMixPie rows={mix} totalLabel={salary.target || '—'} /> : null}
        {salary.buyer_seller ? (
          <div className="rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.buyer}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{salary.buyer_seller}</p>
          </div>
        ) : null}
        <SourceList title={copy.sources} sources={salary.sources} />
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ReviewColumn
            title={copy.companyReview}
            prosLabel={copy.pros}
            consLabel={copy.cons}
            pros={company.company_pros}
            cons={company.company_cons}
            sourcesTitle={copy.sources}
            sources={company.sources}
            accent="border-sky-400/50 bg-indigo-500/10"
          />
          <ReviewColumn
            title={copy.roleReviews}
            prosLabel={copy.pros}
            consLabel={copy.cons}
            pros={company.role_pros}
            cons={company.role_cons}
            sourcesTitle={copy.sources}
            sources={company.role_sources}
            accent="border-emerald-400/40 bg-emerald-500/10"
          />
        </div>
      ) : (
      <div className="space-y-3">
        <section className="rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
          <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.culture}</p>
          <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.culture || '—'}</p>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <section className="rounded-lg border border-red-400/40 bg-red-500/10 p-4">
            <p className={`${SECTION_TITLE} text-red-300 mb-2`}>{copy.layoff}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.layoff_risk || '—'}</p>
            {company.labor_risk ? <p className={`${BODY_MUTED} mt-2`}>{copy.labor}: {company.labor_risk}</p> : null}
          </section>
          <section className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4">
            <p className={`${SECTION_TITLE} text-slate-200 mb-2`}>{copy.h1b}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.h1b || '—'}</p>
            <p className={`${BODY_MUTED} mt-2`}>{copy.remote}: {company.remote_sponsorship || '—'}</p>
          </section>
        </div>
        <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
          <p className={`${SECTION_TITLE} text-slate-300 mb-2`}>{copy.roleReviews}</p>
          <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.role_reviews || '—'}</p>
        </section>
        <SourceList title={copy.sources} sources={company.sources} />
      </div>
      )
    ) : <p className={BODY_MUTED}>{copy.empty}</p>;
  }
  if (item === 'questions') {
    const bank = modules?.interview_bank;
    body = bank && (bank.professional.length > 0 || bank.behavioral.length > 0) ? (
      <div className="space-y-5">
        <section>
          <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.professional}</p>
          <QuestionList items={bank.professional} copy={copy} />
          <ExtraList items={bank.professional_extra} title={copy.extra} />
        </section>
        <section>
          <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>{copy.behavioral}</p>
          <QuestionList items={bank.behavioral} copy={copy} />
          <ExtraList items={bank.behavioral_extra} title={copy.extra} />
        </section>
        {bank.process ? (
          <section className="rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
            <p className={`${SECTION_TITLE} text-sky-300 mb-2`}>{copy.process}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{bank.process}</p>
          </section>
        ) : null}
      </div>
    ) : <p className={BODY_MUTED}>{copy.empty}</p>;
  }
  if (item === 'negotiate') {
    const negotiation = modules?.negotiation;
    body = negotiation && (negotiation.pay_strategy || negotiation.benefits_strategy || negotiation.script) ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
          <p className={`${SECTION_TITLE} text-indigo-300 mb-3`}>{copy.pay}</p>
          <PointList items={briefLines(negotiation.pay_strategy)} dot="bg-indigo-300" />
          {negotiation.script ? (
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className={`${SECTION_TITLE} mb-2 text-slate-100`}>{copy.say}</p>
              <p className={`${BODY} font-medium leading-relaxed text-slate-100`}>{negotiation.script}</p>
            </div>
          ) : null}
        </section>
        <section className="rounded-lg border border-violet-400/40 bg-violet-500/10 p-4">
          <p className={`${SECTION_TITLE} text-violet-300 mb-3`}>{copy.benefits}</p>
          <PointList items={briefLines(negotiation.benefits_strategy)} dot="bg-violet-300" />
        </section>
      </div>
    ) : <p className={BODY_MUTED}>{copy.empty}</p>;
  }

  return (
    <GuideSlideShell>
      <PageHeaderBar pageOf="" title={title[item]} badge="" badgeTone="sky" />
      <p className="border-b border-slate-700/90 px-5 py-3 text-lg leading-relaxed text-slate-300">
        {copy.deck[item]}
      </p>
      <div className="px-5 py-4">{body}</div>
    </GuideSlideShell>
  );
}
