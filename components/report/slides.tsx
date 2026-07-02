'use client';

import React from 'react';
import { InterviewReport } from '@/types';
import { CheckCircle2, AlertTriangle, Target, Zap, Globe, Building2, FileQuestion } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { AppLanguage } from '@/lib/language-context';
import { Panel, SectionLabel } from '@/components/ui/primitives';
import {
  SafeContentList,
  cleanText,
  getScoreInfo,
  dashTranslations,
  DashT,
} from './report-shared';

type SlideProps = { data: InterviewReport; language: AppLanguage; t: DashT };

export function MatchSlide({ data, language, t }: SlideProps) {
  const { match_analysis } = data;
  const scoreInfo = getScoreInfo(match_analysis.score, language);
  const tierName = match_analysis.dog_type || scoreInfo.level;
  const scoreData = [{ name: 'Score', value: match_analysis.score, fill: scoreInfo.fill }];

  return (
    <Panel hover={false} className="min-h-[420px]">
      <SectionLabel>{t.matchAnalysis}</SectionLabel>
      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center lg:col-span-1">
          {scoreInfo.icon}
          <p className={`mt-3 font-display text-lg font-semibold ${scoreInfo.color}`}>{tierName}</p>
          <div className="relative mt-4 h-36 w-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={8} data={scoreData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${scoreInfo.color}`}>{match_analysis.score}</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-jb-ink-subtle">Score</span>
            </div>
          </div>
          <p className={`mt-2 text-center text-sm font-semibold ${scoreInfo.color}`}>{scoreInfo.label}</p>
          <p className="mt-1 max-w-xs text-center text-sm text-jb-ink-muted">{scoreInfo.description}</p>
          {match_analysis.recruiter_insight && (
            <div className="mt-4 w-full rounded-jb border border-jb-border bg-jb-surface/60 p-4 text-left text-sm text-jb-ink">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-jb-accent">{t.recruiterInsight}</span>
              {match_analysis.recruiter_insight}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-2">
          <div>
            <h3 className="mb-3 flex items-center text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="mr-2 h-4 w-4" /> {t.coreAdvantages}
            </h3>
            <SafeContentList content={match_analysis.matching_points} bulletColor="bg-emerald-500" />
          </div>
          <div>
            <h3 className="mb-3 flex items-center text-sm font-semibold text-amber-700">
              <AlertTriangle className="mr-2 h-4 w-4" /> {t.skillGaps}
            </h3>
            <SafeContentList content={match_analysis.skill_gaps} bulletColor="bg-amber-500" />
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function SalarySlide({ data, t }: SlideProps) {
  const { salary_analysis } = data;
  if (!salary_analysis) return null;

  return (
    <Panel hover={false} className="min-h-[420px]">
      <SectionLabel>{t.salaryInfo}</SectionLabel>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-jb border border-jb-border bg-jb-surface/50 p-5">
          <h4 className="mb-3 flex items-center text-sm font-semibold text-jb-accent">
            <Target className="mr-2 h-4 w-4" /> {t.estimatedSalary}
          </h4>
          <p className="font-display text-2xl font-semibold text-jb-ink">{cleanText(salary_analysis.estimated_range)}</p>
          <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-jb-ink-subtle">{t.analysisLogic}</p>
          <SafeContentList content={salary_analysis.rationale} bulletColor="bg-jb-accent" />
        </div>
        <div className="rounded-jb border border-jb-border bg-jb-surface/50 p-5">
          <h4 className="mb-3 flex items-center text-sm font-semibold text-jb-accent">
            <Zap className="mr-2 h-4 w-4" /> {t.negotiationStrategy}
          </h4>
          <SafeContentList content={salary_analysis.negotiation_tip} bulletColor="bg-jb-accent" />
        </div>
      </div>
    </Panel>
  );
}

export function CompanySlide({ data, t }: SlideProps) {
  const { reviews_analysis } = data;
  if (!reviews_analysis) return null;

  return (
    <Panel hover={false} className="min-h-[420px]">
      <SectionLabel>{t.workplaceEcology}</SectionLabel>
      <div className="mt-4 space-y-6">
        {reviews_analysis.company_reviews && (
          <div className="rounded-jb border border-jb-border bg-jb-surface/50 p-5">
            <h4 className="mb-3 flex items-center text-sm font-semibold text-jb-accent">
              <Building2 className="mr-2 h-4 w-4" /> {t.companyCulture}
            </h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-jb-ink">{cleanText(reviews_analysis.company_reviews.summary)}</p>
            {reviews_analysis.company_reviews.pros?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-emerald-700">{t.pros}</p>
                <SafeContentList content={reviews_analysis.company_reviews.pros} bulletColor="bg-emerald-500" />
              </div>
            )}
            {reviews_analysis.company_reviews.cons?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-rose-600">{t.cons}</p>
                <SafeContentList content={reviews_analysis.company_reviews.cons} bulletColor="bg-rose-500" />
              </div>
            )}
          </div>
        )}
        {reviews_analysis.job_reviews && (
          <div className="rounded-jb border border-jb-border bg-jb-surface/50 p-5">
            <h4 className="mb-3 flex items-center text-sm font-semibold text-jb-accent">
              <FileQuestion className="mr-2 h-4 w-4" /> {t.interviewProcess}
            </h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-jb-ink">{cleanText(reviews_analysis.job_reviews.summary)}</p>
          </div>
        )}
      </div>
    </Panel>
  );
}

export function MarketSlide({ data, t }: SlideProps) {
  const { market_analysis } = data;
  if (!market_analysis) return null;

  return (
    <Panel hover={false} className="min-h-[420px]">
      <SectionLabel>{t.companyAnalysis}</SectionLabel>
      <div className="mt-4 space-y-6">
        <div className="rounded-jb border border-jb-border bg-jb-accent-soft/40 p-5">
          <h4 className="mb-3 flex items-center text-sm font-semibold text-jb-accent">
            <Globe className="mr-2 h-4 w-4" /> {t.industryOverview}
          </h4>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-jb-ink-subtle">{t.industryTrends}</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-jb-ink">{cleanText(market_analysis.industry_trends)}</p>
          {market_analysis.key_advantages?.length > 0 && (
            <div className="mt-4 border-t border-jb-border pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-jb-accent">{t.coreMoats}</p>
              <SafeContentList content={market_analysis.key_advantages} bulletColor="bg-jb-accent" />
            </div>
          )}
          {market_analysis.potential_risks?.length > 0 && (
            <div className="mt-4 border-t border-jb-border pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-rose-600">{t.strategicRisks}</p>
              <SafeContentList content={market_analysis.potential_risks} bulletColor="bg-rose-500" />
            </div>
          )}
        </div>
        {market_analysis.competition_table?.length > 0 && (
          <div className="overflow-x-auto rounded-jb border border-jb-border">
            <table className="min-w-[520px] w-full border-collapse text-left text-sm">
              <thead className="bg-jb-surface text-jb-ink-muted">
                <tr>
                  <th className="border-b border-jb-border p-3">{t.competitors}</th>
                  <th className="border-b border-jb-border p-3">{t.strengths}</th>
                  <th className="border-b border-jb-border p-3">{t.weaknesses}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jb-border">
                {market_analysis.competition_table.map((c, i) => (
                  <tr key={i}>
                    <td className="p-3 font-medium text-jb-ink">{cleanText(c.name)}</td>
                    <td className="p-3 text-emerald-700">{cleanText(c.strengths)}</td>
                    <td className="p-3 text-rose-600">{cleanText(c.weaknesses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}

export function InterviewSlide({ data, t, start, end }: SlideProps & { start: number; end: number }) {
  const questions = data.interview_preparation?.questions?.slice(start, end) ?? [];
  if (questions.length === 0) return null;

  return (
    <Panel hover={false} className="min-h-[420px]">
      <SectionLabel>{t.mockInterview} · Q{start + 1}–{Math.min(end, start + questions.length)}</SectionLabel>
      <div className="mt-4 divide-y divide-jb-border">
        {questions.map((q, idx) => (
          <div key={start + idx} className="py-5 first:pt-0">
            <p className="mb-2 text-sm font-semibold text-jb-ink">
              Q{start + idx + 1}: {cleanText(q.question)}
            </p>
            <div className="rounded-jb border-l-2 border-jb-accent bg-jb-surface/60 p-4 text-sm leading-relaxed text-jb-ink-muted">
              {cleanText(q.answer_guide)}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function buildSlides(data: InterviewReport, language: AppLanguage) {
  const t = dashTranslations[language] ?? dashTranslations.en;
  const props = { data, language, t };
  const slides: React.ReactNode[] = [<MatchSlide key="match" {...props} />];

  if (data.salary_analysis) slides.push(<SalarySlide key="salary" {...props} />);
  if (data.reviews_analysis) slides.push(<CompanySlide key="company" {...props} />);
  if (data.market_analysis) slides.push(<MarketSlide key="market" {...props} />);

  const qCount = data.interview_preparation?.questions?.length ?? 0;
  if (qCount > 0) {
    slides.push(<InterviewSlide key="interview-1" {...props} start={0} end={5} />);
    if (qCount > 5) slides.push(<InterviewSlide key="interview-2" {...props} start={5} end={10} />);
  }

  const labels = slides.map((_, i) => {
    if (i === 0) return t.matchAnalysis;
    if (data.salary_analysis && i === 1) return t.salaryInfo;
    // dynamic labels are approximate; pager shows index anyway
    return '';
  });

  return { slides, labels, t };
}
