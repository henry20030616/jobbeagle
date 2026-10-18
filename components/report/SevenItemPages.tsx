'use client';

import React from 'react';
import type { FullReport, GuideQuestion, GuideResumeRewrite, GuideSource, LiteReport } from '@/types';
import { ExternalLink } from 'lucide-react';
import { getScoreInfo } from '@/components/AnalysisDashboard';
import {
  BODY,
  BODY_MUTED,
  GuideSlideShell,
  PageHeaderBar,
  SECTION_TITLE,
} from '@/components/guide/GuideSlideChrome';
import { evidenceTierLabel, formatOfferRange, offerEvaluationSummary } from '@/lib/offer-display';
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
  score: string;
  keywords: string;
  apply: string;
  lockPay: string;
  lockRewrite: string;
  before: string;
  after: string;
  target: string;
  ceiling: string;
  base: string;
  equity: string;
  bonus: string;
  buyer: string;
  culture: string;
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
  sources: string;
  empty: string;
  noBand: string;
};

function itemCopy(language: AppLanguage): ItemCopy {
  if (language === 'zh-TW' || language === 'zh-CN') {
    const s = language === 'zh-CN';
    return {
      core: s ? '1. 职位核心解析' : '1. 職位核心解析',
      market: s ? '2. 市场薪资水准' : '2. 市場薪資水準',
      fit: s ? '3. 匹配分数、履历分析' : '3. 匹配分數、履歷分析',
      land: s ? '4. 个人化薪资落点' : '4. 個人化薪資落點',
      company: s ? '5. 公司与职位评价' : '5. 公司與職位評價',
      questions: s ? '6. 面试真题准备' : '6. 面試真題準備',
      negotiate: s ? '7. 面试谈判建议' : '7. 面試談判建議',
      nav: {
        core: s ? '1 职位核心' : '1 職位核心',
        market: s ? '2 市场薪资' : '2 市場薪資',
        fit: s ? '3 匹配履历' : '3 匹配履歷',
        land: s ? '4 薪资落点' : '4 薪資落點',
        company: s ? '5 公司评价' : '5 公司評價',
        questions: s ? '6 面试真题' : '6 面試真題',
        negotiate: s ? '7 谈判建议' : '7 談判建議',
      },
      conditions: s ? '关键条件' : '關鍵條件',
      duties: s ? '关键职责' : '關鍵職責',
      band: s ? '市场总包区间' : '市場總包區間',
      score: s ? '匹配分数与灯号' : '匹配分數與燈號',
      keywords: s ? '欠缺的硬性关键字' : '欠缺的硬性關鍵字',
      apply: s ? '应征建议' : '應徵建議',
      lockPay: s
        ? '🔒 升级 Interview Guide 可解锁个人化精准落点与 TC 结构拆解'
        : '🔒 升級 Interview Guide 可解鎖個人化精準落點與 TC 結構拆解',
      lockRewrite: s
        ? '🔒 升级 Interview Guide 可解锁针对该硬伤的具体修改范例与满分话术'
        : '🔒 升級 Interview Guide 可解鎖針對該硬傷的具體修改範例與滿分話術',
      before: 'Before',
      after: 'After',
      target: s ? '战略目标价' : '戰略目標價',
      ceiling: s ? '议价天花板' : '議價天花板',
      base: s ? '底薪' : '底薪',
      equity: s ? '股票' : '股票',
      bonus: s ? '奖金' : '獎金',
      buyer: s ? '买方 / 卖方筹码' : '買方 / 賣方籌碼',
      culture: s ? '1.1 公司情报' : '1.1 公司情報',
      layoff: s ? '裁员风险' : '裁員風險',
      labor: s ? '劳工争议' : '勞工爭議',
      h1b: s ? '1.2 签证赞助状况评估' : '1.2 簽證贊助狀況評估',
      remote: 'Remote / Sponsorship',
      roleReviews: s ? '2. 职位评价' : '2. 職位評價',
      professional: s ? '专业题' : '專業題',
      behavioral: s ? '行为题' : '行為題',
      reported: s ? '网络真题' : '網路真題',
      predicted: s ? 'AI 预测题' : 'AI 預測題',
      extra: s ? '补充资料列表' : '補充資料列表',
      answer: s ? '建议答案' : '建議答案',
      process: s ? '2. 面试流程' : '2. 面試流程',
      pay: s ? '1.1 薪资筹码策略' : '1.1 薪資籌碼策略',
      benefits: s ? '1.2 权益与福利争取' : '1.2 權益與福利爭取',
      sources: s ? '来源' : '來源',
      empty: s ? '这次没有抽出这项。' : '這次沒有抽出這項。',
      noBand: s ? '这次没有足够的薪酬信号。' : '這次沒有足夠的薪酬信號。',
    };
  }
  return {
    core: '1. Role core',
    market: '2. Market pay',
    fit: '3. Fit score and resume',
    land: '4. Personalized pay landing',
    company: '5. Company and role reputation',
    questions: '6. Interview questions',
    negotiate: '7. Negotiation',
    nav: {
      core: '1 Role core',
      market: '2 Market pay',
      fit: '3 Fit',
      land: '4 Pay landing',
      company: '5 Company',
      questions: '6 Questions',
      negotiate: '7 Negotiation',
    },
    conditions: 'Must-haves',
    duties: 'Real duties',
    band: 'Market total-comp range',
    score: 'Score and signal',
    keywords: 'Missing hard keywords',
    apply: 'Whether to apply',
    lockPay: '🔒 Upgrade to Interview Guide for your pay landing and TC split',
    lockRewrite: '🔒 Upgrade to Interview Guide for line-by-line rewrites of these gaps',
    before: 'Before',
    after: 'After',
    target: 'Target',
    ceiling: 'Ceiling',
    base: 'Base',
    equity: 'Equity',
    bonus: 'Bonus',
    buyer: 'Buyer / seller leverage',
    culture: '1.1 Company intel',
    layoff: 'Layoff risk',
    labor: 'Labor risk',
    h1b: '1.2 Visa sponsorship',
    remote: 'Remote / Sponsorship',
    roleReviews: '2. Role reviews',
    professional: 'Professional',
    behavioral: 'Behavioral',
    reported: 'Reported question',
    predicted: 'AI prediction',
    extra: 'Additional reported questions',
    answer: 'Suggested answer',
    process: '2. Interview process',
    pay: '1.1 Pay leverage',
    benefits: '1.2 Benefits to negotiate',
    sources: 'Sources',
    empty: 'This section came back empty.',
    noBand: 'Not enough pay signal for a market range.',
  };
}

export function guideItemNav(language?: AppLanguage | string): Array<{ id: GuideItemId; label: string }> {
  const copy = itemCopy(normalizeReportLanguage(language));
  return GUIDE_ITEM_IDS.map((id) => ({ id, label: copy.nav[id] }));
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
          <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300/90" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function LockLine({ children }: { children: string }) {
  return (
    <p className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-base font-semibold text-amber-100">
      {children}
    </p>
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
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-700/90 px-5 py-4">
      <h2 className="text-2xl font-black text-white mb-3">{title}</h2>
      {children}
    </section>
  );
}

function CoreBody({ report, copy }: { report: LiteReport; copy: ItemCopy }) {
  const conditions = (report.role_read?.hiring_signals ?? []).slice(0, 5);
  const duties = (report.role_read?.responsibilities ?? []).slice(0, 5);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
        <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.conditions}</p>
        {conditions.length > 0 ? <BulletList items={conditions} /> : <p className={BODY_MUTED}>{copy.empty}</p>}
      </div>
      <div className="min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
        <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.duties}</p>
        {duties.length > 0 ? <BulletList items={duties} /> : <p className={BODY_MUTED}>{copy.empty}</p>}
      </div>
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
  const evalSummary = offerEvaluationSummary(offer, language);
  const where = [offer?.region, offer?.currency].filter(Boolean).join(' · ');
  const tier = offer?.evidence_tier ? evidenceTierLabel(offer.evidence_tier, language) : '';
  return (
    <div className="rounded-lg border border-emerald-400/55 bg-emerald-500/10 p-4">
      <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>{copy.band}</p>
      <p className={`${BODY_MUTED} mb-1.5`}>{[where, tier].filter(Boolean).join(' · ') || 'USD'}</p>
      {range ? (
        <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">{range}</p>
      ) : (
        <p className="text-2xl font-bold text-slate-200">{copy.noBand}</p>
      )}
      <p className={`${BODY} text-slate-200 leading-relaxed mt-2`}>{evalSummary.body}</p>
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
        <div className="rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
          <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.score}</p>
          <p className={`text-6xl font-black tabular-nums leading-none ${scoreInfo.color}`}>{score}</p>
          <p className={`text-2xl font-bold mt-2 ${scoreInfo.color}`}>{scoreInfo.level}</p>
          <p className={`${BODY} text-slate-300 mt-1`}>{scoreInfo.label}</p>
          {verdict ? <p className={`${BODY} text-slate-200 leading-relaxed mt-3`}>{verdict}</p> : null}
        </div>
        <div className="rounded-lg border border-violet-400/40 bg-violet-500/10 p-4">
          <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>
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
      <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4">
        <p className={`${SECTION_TITLE} text-amber-200 mb-2`}>{copy.keywords}</p>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {keywords.slice(0, 8).map((word) => (
              <span key={word} className="rounded-md bg-slate-900 px-2 py-1 text-base font-semibold text-amber-100">
                {word}
              </span>
            ))}
          </div>
        ) : null}
        {gaps.length > 0 ? (
          <ul className="space-y-1.5">
            {gaps.map((item) => (
              <li key={item.gap} className={`${BODY} text-slate-200 leading-snug`}>
                <span className="font-semibold text-amber-100">{item.gap}</span>
                {item.description ? <span className="text-slate-300"> — {item.description}</span> : null}
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
      <ItemBlock title={copy.core}>
        <CoreBody report={report} copy={copy} />
      </ItemBlock>
      <ItemBlock title={copy.market}>
        <MarketBody report={report} copy={copy} language={lang} locked={locked} />
      </ItemBlock>
      <ItemBlock title={copy.fit}>
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
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.question} className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-200">
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
          {item.answer ? (
            <p className={`${BODY_MUTED} mt-1.5 leading-relaxed`}>
              <span className="font-semibold text-slate-300">{copy.answer}: </span>
              {item.answer}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
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
  const pageNo: Record<GuideItemId, string> = {
    core: '01',
    market: '02',
    fit: '03',
    land: '04',
    company: '05',
    questions: '06',
    negotiate: '07',
  };
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
            <p className={`${SECTION_TITLE} text-amber-200 mb-2`}>{copy.ceiling}</p>
            <p className="text-3xl font-black text-white">{salary.ceiling || '—'}</p>
          </div>
        </div>
        {mix.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {mix.map(([label, value]) => (
              <div key={label} className="rounded-md border border-emerald-400/25 bg-black/20 px-2.5 py-2">
                <p className={BODY_MUTED}>{label}</p>
                <p className={`${BODY} font-semibold text-emerald-50`}>{value}</p>
              </div>
            ))}
          </div>
        ) : null}
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
    body = company ? (
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
            <p className={`${SECTION_TITLE} text-amber-200 mb-2`}>{copy.h1b}</p>
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
          <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.pay}</p>
          <p className={`${BODY} text-slate-200 leading-relaxed`}>{negotiation.pay_strategy || negotiation.script}</p>
        </section>
        <section className="rounded-lg border border-violet-400/40 bg-violet-500/10 p-4">
          <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>{copy.benefits}</p>
          <p className={`${BODY} text-slate-200 leading-relaxed`}>{negotiation.benefits_strategy || '—'}</p>
        </section>
      </div>
    ) : <p className={BODY_MUTED}>{copy.empty}</p>;
  }

  return (
    <GuideSlideShell>
      <PageHeaderBar pageOf={pageNo[item]} title={title[item]} badge={pageNo[item]} badgeTone="sky" />
      <div className="px-5 py-4">{body}</div>
    </GuideSlideShell>
  );
}
