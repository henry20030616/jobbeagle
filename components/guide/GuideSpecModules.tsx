'use client';

import React from 'react';
import type { FullReport, GuideQuestion } from '@/types';
import { ExternalLink } from 'lucide-react';
import {
  BODY,
  BODY_MUTED,
  GuideSlideShell,
  HeroDualRow,
  PageHeaderBar,
  SECTION_TITLE,
} from '@/components/guide/GuideSlideChrome';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';

function copyFor(language: AppLanguage) {
  if (language === 'zh-TW' || language === 'zh-CN') {
    const s = language === 'zh-CN';
    return {
      item4: s ? '个人化薪资落点' : '個人化薪資落點',
      item5: s ? '公司与职位评价' : '公司與職位評價',
      item6: s ? '面试真题准备' : '面試真題準備',
      item7: s ? '面试谈判建议' : '面試談判建議',
      target: s ? '战略目标价' : '戰略目標價',
      ceiling: s ? '议价天花板' : '議價天花板',
      buyer: s ? '买方 / 卖方筹码' : '買方 / 賣方籌碼',
      tc: 'TC',
      base: s ? '底薪' : '底薪',
      equity: s ? '股票' : '股票',
      bonus: s ? '奖金' : '獎金',
      culture: s ? '公司情报' : '公司情報',
      layoff: s ? '裁员风险' : '裁員風險',
      labor: s ? '劳工争议' : '勞工爭議',
      h1b: s ? '1.2 签证赞助状况评估' : '1.2 簽證贊助狀況評估',
      remote: 'Remote / Sponsorship',
      roleReviews: s ? '职位评价' : '職位評價',
      professional: s ? '专业题' : '專業題',
      behavioral: s ? '行为题' : '行為題',
      reported: s ? '网络真题' : '網路真題',
      predicted: s ? 'AI 预测题' : 'AI 預測題',
      extra: s ? '补充资料列表' : '補充資料列表',
      answer: s ? '建议答案' : '建議答案',
      process: s ? '面试流程' : '面試流程',
      pay: s ? '1.1 薪资筹码策略' : '1.1 薪資籌碼策略',
      benefits: s ? '1.2 权益与福利争取' : '1.2 權益與福利爭取',
      source: s ? '来源' : '來源',
    };
  }
  return {
    item4: 'Personalized pay landing',
    item5: 'Company and role reputation',
    item6: 'Interview questions',
    item7: 'Negotiation',
    target: 'Target',
    ceiling: 'Ceiling',
    buyer: 'Buyer / seller leverage',
    tc: 'TC mix',
    base: 'Base',
    equity: 'Equity',
    bonus: 'Bonus',
    culture: 'Company intel',
    layoff: 'Layoff risk',
    labor: 'Labor risk',
    h1b: '1.2 Visa sponsorship',
    remote: 'Remote / Sponsorship',
    roleReviews: 'Role reviews',
    professional: 'Professional',
    behavioral: 'Behavioral',
    reported: 'Reported question',
    predicted: 'AI prediction',
    extra: 'Additional reported questions',
    answer: 'Suggested answer',
    process: 'Interview process',
    pay: '1.1 Pay leverage',
    benefits: '1.2 Benefits to negotiate',
    source: 'Source',
  };
}

function QuestionList({
  items,
  reportedLabel,
  predictedLabel,
  answerLabel,
}: {
  items: GuideQuestion[];
  reportedLabel: string;
  predictedLabel: string;
  answerLabel: string;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.question} className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-200">
              {item.origin === 'reported' ? reportedLabel : predictedLabel}
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
              <span className="font-semibold text-slate-300">{answerLabel}: </span>
              {item.answer}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function hasGuideSpec(report: FullReport, tab: 'hiring' | 'interview' | 'salary'): boolean {
  const modules = report.guide_modules;
  if (!modules) return false;
  if (tab === 'hiring') {
    const company = modules.company_eval;
    return Boolean(company.culture || company.h1b || company.layoff_risk || company.role_reviews);
  }
  if (tab === 'interview') {
    const bank = modules.interview_bank;
    return bank.professional.length > 0 || bank.behavioral.length > 0;
  }
  return Boolean(
    modules.salary_land.target
    || modules.salary_land.ceiling
    || modules.negotiation.pay_strategy
    || modules.negotiation.script,
  );
}

export default function GuideSpecModules({
  report,
  tab,
  language = 'en',
}: {
  report: FullReport;
  tab: 'hiring' | 'interview' | 'salary';
  language?: AppLanguage | string;
}) {
  const lang = normalizeReportLanguage(language);
  const t = copyFor(lang);
  const modules = report.guide_modules;
  if (!modules) return null;

  if (tab === 'salary') {
    const salary = modules.salary_land;
    const mix = [
      [t.base, salary.base],
      [t.equity, salary.equity],
      [t.bonus, salary.bonus],
    ].filter((row): row is [string, string] => Boolean(row[1]));
    return (
      <GuideSlideShell>
        <PageHeaderBar pageOf="" title={t.item4} badge="" badgeTone="emerald" />
        <HeroDualRow
          left={(
            <>
              <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>{t.target}</p>
              <p className="text-3xl font-black text-white">{salary.target || '—'}</p>
            </>
          )}
          right={(
            <>
              <p className={`${SECTION_TITLE} text-amber-300 mb-2`}>{t.ceiling}</p>
              <p className="text-3xl font-black text-white">{salary.ceiling || '—'}</p>
            </>
          )}
        />
        <div className="border-t border-slate-700/90 px-5 py-3.5 space-y-3">
          {mix.length > 0 ? (
            <div>
              <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>{t.tc}</p>
              <div className="grid grid-cols-3 gap-2">
                {mix.map(([label, value]) => (
                  <div key={label} className="rounded-md border border-emerald-400/25 bg-black/20 px-2.5 py-2">
                    <p className="text-base text-slate-400">{label}</p>
                    <p className={`${BODY} font-semibold text-emerald-50`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {salary.buyer_seller ? (
            <div>
              <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{t.buyer}</p>
              <p className={`${BODY} text-slate-200 leading-relaxed`}>{salary.buyer_seller}</p>
            </div>
          ) : null}
        </div>
        <div className="border-t border-slate-700/90 px-5 py-3.5">
          <PageHeaderBar pageOf="" title={t.item7} badge="" badgeTone="violet" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <section className="rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
              <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{t.pay}</p>
              <p className={`${BODY} text-slate-200 leading-relaxed`}>{modules.negotiation.pay_strategy || modules.negotiation.script}</p>
            </section>
            <section className="rounded-lg border border-violet-400/40 bg-violet-500/10 p-4">
              <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>{t.benefits}</p>
              <p className={`${BODY} text-slate-200 leading-relaxed`}>{modules.negotiation.benefits_strategy || '—'}</p>
            </section>
          </div>
        </div>
      </GuideSlideShell>
    );
  }

  if (tab === 'hiring') {
    const company = modules.company_eval;
    return (
      <GuideSlideShell>
        <PageHeaderBar pageOf="" title={t.item5} badge="" badgeTone="amber" />
        <div className="px-5 py-3.5 space-y-3">
          <section className="rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{t.culture}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.culture || '—'}</p>
          </section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section className="rounded-lg border border-red-400/40 bg-red-500/10 p-4">
              <p className={`${SECTION_TITLE} text-red-300 mb-2`}>{t.layoff}</p>
              <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.layoff_risk || '—'}</p>
              {company.labor_risk ? (
                <p className={`${BODY_MUTED} mt-2`}>{t.labor}: {company.labor_risk}</p>
              ) : null}
            </section>
            <section className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4">
              <p className={`${SECTION_TITLE} text-amber-200 mb-2`}>{t.h1b}</p>
              <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.h1b || '—'}</p>
              <p className={`${BODY_MUTED} mt-2`}>{t.remote}: {company.remote_sponsorship || '—'}</p>
            </section>
          </div>
          <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
            <p className={`${SECTION_TITLE} text-slate-300 mb-2`}>{t.roleReviews}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{company.role_reviews || '—'}</p>
          </section>
        </div>
      </GuideSlideShell>
    );
  }

  const bank = modules.interview_bank;
  return (
    <GuideSlideShell>
      <PageHeaderBar pageOf="" title={t.item6} badge="" badgeTone="sky" />
      <div className="px-5 py-3.5 space-y-5">
        <section>
          <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{t.professional}</p>
          <QuestionList
            items={bank.professional}
            reportedLabel={t.reported}
            predictedLabel={t.predicted}
            answerLabel={t.answer}
          />
          {bank.professional_extra.length > 0 ? (
            <details className="mt-3 rounded-lg border border-dashed border-slate-600 p-3">
              <summary className={`${BODY} font-semibold text-slate-200 cursor-pointer`}>{t.extra}</summary>
              <ul className="mt-3 space-y-1.5">
                {bank.professional_extra.map((item) => (
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
          ) : null}
        </section>
        <section>
          <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>{t.behavioral}</p>
          <QuestionList
            items={bank.behavioral}
            reportedLabel={t.reported}
            predictedLabel={t.predicted}
            answerLabel={t.answer}
          />
          {bank.behavioral_extra.length > 0 ? (
            <details className="mt-3 rounded-lg border border-dashed border-slate-600 p-3">
              <summary className={`${BODY} font-semibold text-slate-200 cursor-pointer`}>{t.extra}</summary>
              <ul className="mt-3 space-y-1.5">
                {bank.behavioral_extra.map((item) => (
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
          ) : null}
        </section>
        {bank.process ? (
          <section className="rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
            <p className={`${SECTION_TITLE} text-sky-300 mb-2`}>{t.process}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>{bank.process}</p>
          </section>
        ) : null}
      </div>
    </GuideSlideShell>
  );
}
