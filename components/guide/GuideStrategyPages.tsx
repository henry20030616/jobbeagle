'use client';

/**
 * Interview Strategy Guide Pages 2–5 — Excel《Jobbeagle報告範圍》A–E 原稿。
 * Layout mirrors Page 1. No invented sections. No $ salary on Pages 2–3.
 * Chrome labels follow the report language button.
 */

import React, { useMemo } from 'react';
import type {
  CompanyNewsCategory,
  CompanyTruth,
  FullReport,
  InterviewQuestionCard,
  ReferenceCitation,
  RoleTeamInsights,
} from '@/types';
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import {
  ActionDualRow,
  BODY,
  BODY_MUTED,
  BulletList,
  ContrastDualRow,
  DetailDualRow,
  GuideSlideShell,
  HeroDualRow,
  InsufficientDataBadge,
  META,
  PageHeaderBar,
  SECTION_TITLE,
} from '@/components/guide/GuideSlideChrome';
import PredictedLandSquircle from '@/components/PredictedLandSquircle';
import type { AppLanguage } from '@/lib/language-context';
import {
  evidenceTierLabel,
  formatOfferRange,
  formatPredictedOffer,
} from '@/lib/offer-display';
import { normalizeReportLanguage } from '@/lib/report-language';
import { getGuideUiCopy, type GuideUiCopy } from '@/lib/report-ui-copy';

export type GuideStrategyTab = 'hiring' | 'interview' | 'salary' | 'provenance';

function isBehavioral(q: string): boolean {
  const s = q.toLowerCase();
  return (
    s.includes('tell me about')
    || s.includes('walk me through')
    || s.includes('time you')
    || s.includes('example of')
    || s.includes('how do you')
    || s.includes('describe a')
  );
}

function roleTeamOrEmpty(report: FullReport, copy: GuideUiCopy): RoleTeamInsights {
  if (report.role_team_insights) return report.role_team_insights;
  return {
    role_content_refined: report.role_read?.responsibilities?.slice(0, 6) ?? [],
    requirements_refined: report.role_read?.hiring_signals?.slice(0, 6) ?? [],
    rto_official: '—',
    rto_employee_reality: copy.teamSampleInsufficient,
    next_title_1_3yr: '',
    promotion_skill_gaps: (report.proof_map?.gaps ?? []).slice(0, 3).map((g) => g.gap),
    team_sample_insufficient: true,
    department_fallback_note: copy.downgradeNote,
  };
}

function companyTruthOrEmpty(report: FullReport): CompanyTruth {
  if (report.company_truth) {
    return {
      ...report.company_truth,
      company_overview: report.company_truth.company_overview || '',
      recent_developments: report.company_truth.recent_developments ?? [],
    };
  }
  const insights = report.hiring_context?.insights ?? [];
  return {
    company_overview:
      insights.slice(0, 2).map((i) => i.claim).filter(Boolean).join(' ')
      || '',
    recent_developments: insights.slice(0, 5).map((i) => ({
      headline: i.claim,
      summary: i.why_it_matters || i.claim,
      date: i.date || '—',
      category: 'other' as const,
      source_url: i.source_url || undefined,
    })),
    current_strategy:
      insights[0]?.claim || '—',
    competitors: [],
    insider_voice: insights.map((i) => i.claim).slice(0, 4),
    forum_sample_thin: insights.length < 2,
    layoff_legal_flags: [],
    interviewer_strategy_questions: (
      report.hiring_context?.validation_questions ?? []
    ).slice(0, 3),
  };
}

function newsCategoryLabel(
  category: CompanyNewsCategory,
  copy: GuideUiCopy,
): string {
  switch (category) {
    case 'leadership':
      return copy.newsCatLeadership;
    case 'product':
      return copy.newsCatProduct;
    case 'award':
      return copy.newsCatAward;
    case 'funding':
      return copy.newsCatFunding;
    default:
      return copy.newsCatOther;
  }
}

function citationsOrEmpty(report: FullReport): ReferenceCitation[] {
  if (report.reference_citations?.length) return report.reference_citations;
  const out: ReferenceCitation[] = [];
  for (const e of report.provenance?.entries ?? []) {
    out.push({
      source_badge: e.kind || 'source',
      description: e.label,
      date: e.date || '—',
      evidence_tier: e.status === 'valid' ? 2 : 3,
      url: e.url || '',
      manual_verify_keywords: e.url ? undefined : e.label.slice(0, 80),
    });
  }
  for (const ins of report.hiring_context?.insights ?? []) {
    out.push({
      source_badge: 'web',
      description: ins.claim,
      date: ins.date || '—',
      evidence_tier: ins.source_url ? 2 : 3,
      url: ins.source_url || '',
      manual_verify_keywords: ins.source_url
        ? undefined
        : `${report.company_name} Glassdoor Blind`,
    });
  }
  for (const q of report.interview_playbook?.reported ?? []) {
    out.push({
      source_badge: 'interview',
      description: q.question.slice(0, 120),
      date: q.source_date || '—',
      evidence_tier: q.source_url ? 2 : 3,
      url: q.source_url || '',
      manual_verify_keywords: q.source_url
        ? undefined
        : `${report.company_name} interview questions`,
    });
  }
  return out;
}

function sourceHostLabel(url?: string, sourceName?: string): string {
  if (sourceName?.trim()) return sourceName.trim();
  if (!url?.trim()) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.trim();
  }
}

/** Always-expanded Q&A cards — numbered, categorized, full source line. */
function QuestionList({
  items,
  title,
  titleClass,
  categoryLabel,
  copy,
}: {
  items: InterviewQuestionCard[];
  title: string;
  titleClass: string;
  categoryLabel: string;
  copy: GuideUiCopy;
}) {
  if (items.length === 0) {
    return (
      <div>
        <p className={`${SECTION_TITLE} ${titleClass} mb-2`}>{title}</p>
        <p className={`${BODY} text-slate-500`}>—</p>
      </div>
    );
  }
  return (
    <div>
      <p className={`${SECTION_TITLE} ${titleClass} mb-2`}>{title}</p>
      <ol className="space-y-2 list-none">
        {items.map((q, i) => {
          const isReported = q.predicted === false || Boolean(q.source_url);
          const blueprint =
            q.star_blueprint
            || q.star_outline
            || '—';
          const host = sourceHostLabel(q.source_url, q.source_name);
          return (
            <li
              key={i}
              className="rounded-lg border border-slate-700/80 bg-black/20 px-3 py-2.5 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black tabular-nums text-slate-300 shrink-0">
                  {i + 1}.
                </span>
                <span className="rounded border border-sky-400/40 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  {categoryLabel}
                </span>
                {isReported ? (
                  <span className="rounded border border-emerald-400/50 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                    {copy.reportedBadge}
                  </span>
                ) : (
                  <span className="rounded border border-amber-400/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    {copy.predictedBadge}
                  </span>
                )}
                {isReported && q.source_date ? (
                  <span className={`${META} text-slate-500`}>{q.source_date}</span>
                ) : null}
              </div>
              <p className={`${BODY} font-semibold text-slate-100`}>{q.question}</p>
              <div className="rounded-md border border-slate-700/70 bg-black/25 px-2.5 py-2 space-y-1">
                <p className={`${META} font-bold uppercase tracking-wider text-slate-400`}>
                  {copy.questionSourceLabel}
                </p>
                {isReported ? (
                  <>
                    <p className={`${BODY} text-slate-200`}>
                      {host || copy.reportedBadge}
                      {q.source_date ? ` · ${q.source_date}` : ''}
                    </p>
                    {q.source_url ? (
                      <a
                        href={q.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-violet-300 underline underline-offset-2"
                        title={q.source_url}
                      >
                        <span className="truncate">{q.source_url}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      <p className={`${META} text-amber-200/90`}>{copy.noDirectUrl}</p>
                    )}
                  </>
                ) : (
                  <p className={`${BODY} text-amber-100/90`}>{copy.systemAnalysisSourceNote}</p>
                )}
              </div>
              <p className={BODY_MUTED}>
                <span className="font-semibold text-slate-300">{copy.intentLabel}</span>
                {q.interviewer_intent || q.evidence || '—'}
              </p>
              {q.resume_anchor ? (
                <p className={BODY_MUTED}>
                  <span className="font-semibold text-emerald-200">{copy.resumeAnchorLabel}</span>
                  {q.resume_anchor}
                </p>
              ) : null}
              <p className={`${BODY} text-slate-200 whitespace-pre-wrap`}>
                <span className="font-semibold text-indigo-200">{copy.starLabel}</span>
                {blueprint}
              </p>
              <p className={BODY_MUTED}>
                <span className="font-semibold text-amber-200">{copy.dosDontsLabel}</span>
                {q.dos_donts || '—'}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Page2({ report, copy }: { report: FullReport; copy: GuideUiCopy }) {
  const t = roleTeamOrEmpty(report, copy);

  // Trinity: Extract new schema fields or fallback to legacy
  const nextTitle = t.next_title_1_3yr || '—';
  const salaryGrowth = (t as any).salary_growth_trajectory || copy.nextTitleBasisFallback;
  const responsibilities = (t as any).responsibilities_high_density || t.role_content_refined || [];
  const requirements = (t as any).hard_requirements || t.requirements_refined || [];
  const rtoPolicy = (t as any).rto_policy || t.rto_official || '—';
  const wlbAssessment = (t as any).wlb_assessment || {
    work_life_balance_rating: t.rto_employee_reality || '—',
    team_vibe_summary: t.department_fallback_note || '—',
    source_type: 'jd_official',
  };
  const roleReviews = (t as any).role_reviews || { pros: [], cons: [] };

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page2Of}
        title={copy.page2Title}
        badge={t.team_sample_insufficient ? copy.badgeSampleThin : copy.badgeTeamSignals}
        badgeTone={t.team_sample_insufficient ? 'amber' : 'sky'}
      />

      {/* Trinity Top Banner: Career Path & Growth */}
      <div className="border-b border-slate-700/90 bg-gradient-to-r from-emerald-950/40 to-indigo-950/40 px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>
              {copy.nextTitle || 'Career Path & Growth'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
              {nextTitle}
            </p>
            <p className={`${BODY} text-slate-300 leading-relaxed`}>
              {salaryGrowth}
            </p>
            {t.career_path_basis ? (
              <p className={`${META} text-slate-500 mt-2`}>
                {copy.nextTitleBasisFallback || 'Basis'}: {t.career_path_basis}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Trinity Bento Grid: Left 60% + Right 40% */}
      <div className="grid lg:grid-cols-[60%_40%] gap-0 border-b border-slate-700/90">
        {/* Left Column: Role Overview (High-Density) */}
        <div className="border-r border-slate-700/90 px-5 py-4 space-y-4">
          {/* RTO Badge (Top Right Corner) */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className={`${SECTION_TITLE} text-indigo-400`}>
              {copy.roleContent || 'Role Overview'}
            </h3>
            <div className="flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-1.5">
              <span className="text-sm font-bold text-sky-100">{rtoPolicy}</span>
            </div>
          </div>

          {/* Responsibilities (High-Density Bullets) */}
          <div>
            <p className={`${META} text-slate-500 mb-2`}>
              {copy.roleContentHint || 'High-density responsibilities'}
            </p>
            <ul className="space-y-1.5">
              {(responsibilities.length > 0 ? responsibilities : [copy.emptyRoleContent || '—']).slice(0, 4).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className={`${BODY} text-slate-200 leading-snug`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hard Requirements */}
          <div>
            <p className={`${SECTION_TITLE} text-emerald-400 mb-2`}>
              {copy.requirements || 'Hard Requirements'}
            </p>
            <p className={`${META} text-slate-500 mb-2`}>
              {copy.requirementsHint || 'Must-haves'}
            </p>
            <ul className="space-y-1.5">
              {(requirements.length > 0 ? requirements : [copy.emptyRequirements || '—']).slice(0, 4).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className={`${BODY} text-slate-200 leading-snug`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: WLB Dashboard + Pros/Cons */}
        <div className="px-5 py-4 space-y-4 bg-slate-900/30">
          {/* WLB Assessment */}
          <div>
            <h3 className={`${SECTION_TITLE} text-violet-300 mb-2 flex items-center gap-2`}>
              {copy.rtoReality || 'WLB Reality Check'}
            </h3>
            {t.team_sample_insufficient ? (
              <div className="mb-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2">
                <p className="text-sm font-bold text-amber-200">
                  {copy.teamSampleInsufficient || 'Limited team reviews'}
                </p>
              </div>
            ) : null}
            <div className="rounded-lg border border-violet-400/30 bg-black/20 px-4 py-3 space-y-2">
              <div>
                <p className={`${META} text-slate-400 mb-0.5`}>
                  {copy.rtoReality || 'WLB Rating'}
                </p>
                <p className={`${BODY} font-semibold text-violet-100`}>
                  {wlbAssessment.work_life_balance_rating}
                </p>
              </div>
              <div>
                <p className={`${META} text-slate-400 mb-0.5`}>
                  Team Vibe
                </p>
                <p className={`${BODY} text-slate-200 leading-snug`}>
                  {wlbAssessment.team_vibe_summary}
                </p>
              </div>
              <p className={`${META} text-slate-500 text-xs`}>
                Source: {wlbAssessment.source_type === 'web_grounded' ? 'Blind/Reddit' : 'JD Official'}
              </p>
            </div>
          </div>

          {/* Role Reviews: Pros (Green) + Cons (Red) */}
          <div className="space-y-3">
            {/* Pros */}
            {roleReviews.pros?.length > 0 ? (
              <div>
                <p className={`${SECTION_TITLE} text-emerald-400 mb-2 flex items-center gap-1.5`}>
                  <CheckCircle2 className="h-4 w-4" />
                  Pros
                </p>
                <ul className="space-y-1.5">
                  {roleReviews.pros.slice(0, 3).map((pro: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">🟢</span>
                      <span className={`${BODY} text-slate-200 leading-snug`}>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Cons */}
            {roleReviews.cons?.length > 0 ? (
              <div>
                <p className={`${SECTION_TITLE} text-red-400 mb-2 flex items-center gap-1.5`}>
                  <AlertTriangle className="h-4 w-4" />
                  Cons
                </p>
                <ul className="space-y-1.5">
                  {roleReviews.cons.slice(0, 3).map((con: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">🔴</span>
                      <span className={`${BODY} text-slate-200 leading-snug`}>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Promotion Skill Gaps (Bottom Full-Width) */}
      <div className="border-b border-slate-700/90 px-5 py-4">
        <p className={`${SECTION_TITLE} text-violet-300 mb-2 flex items-center gap-1.5`}>
          <AlertTriangle className="h-5 w-5" />
          {copy.promotionGaps || 'Skills to Close for Next Title'}
        </p>
        <ul className="grid sm:grid-cols-2 gap-2">
          {(t.promotion_skill_gaps.length > 0 ? t.promotion_skill_gaps : ['—']).map((skill, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-md border border-violet-400/30 bg-violet-500/5 px-3 py-2"
            >
              <span className="text-violet-400 font-bold">→</span>
              <span className={`${BODY} text-slate-200`}>{skill}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Downgrade Note */}
      <div className="px-5 py-3 bg-slate-900/40">
        <p className={`${META} text-slate-500 leading-relaxed`}>
          {copy.downgradeNote || copy.noSalaryOnPage || 'No salary figures on this page. Compensation details on Page 4.'}
        </p>
      </div>
    </GuideSlideShell>
  );
}

function Page3({ report, copy }: { report: FullReport; copy: GuideUiCopy }) {
  const c = companyTruthOrEmpty(report);
  const layoffDisplay =
    c.layoff_legal_flags.length > 0
      ? c.layoff_legal_flags
      : [copy.noLayoffRecord];

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page3Of}
        title={copy.page3Title}
        badge={c.forum_sample_thin ? copy.badgeForumThin : copy.badgeRiskAudit}
        badgeTone={c.forum_sample_thin ? 'amber' : 'emerald'}
      />
      <div className="border-b border-slate-700/90 px-5 py-4">
        <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>{copy.companyOverview}</p>
        <p className={`${META} text-slate-500 mb-2`}>{copy.companyOverviewHint}</p>
        <p className={`${BODY} text-slate-100 leading-relaxed`}>
          {c.company_overview?.trim()
            || copy.companyOverviewEmpty}
        </p>
      </div>
      <div className="border-b border-slate-700/90 px-5 py-4">
        <p className={`${SECTION_TITLE} text-sky-300 mb-2`}>{copy.recentDevelopments}</p>
        <p className={`${META} text-slate-500 mb-3`}>{copy.recentDevelopmentsHint}</p>
        {c.recent_developments.length > 0 ? (
          <ol className="space-y-2.5 list-none">
            {c.recent_developments.slice(0, 5).map((n, i) => (
              <li
                key={i}
                className="rounded-lg border border-sky-400/30 bg-sky-500/5 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-black tabular-nums text-slate-300">
                    {i + 1}.
                  </span>
                  <span className="rounded border border-sky-400/40 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                    {newsCategoryLabel(n.category, copy)}
                  </span>
                  <span className={`${META} text-slate-500`}>{n.date}</span>
                  {n.source_name ? (
                    <span className={`${META} text-slate-400`}>{n.source_name}</span>
                  ) : null}
                </div>
                <p className={`${BODY} font-semibold text-slate-100`}>{n.headline}</p>
                {n.summary ? (
                  <p className={`${BODY_MUTED} mt-1 leading-snug`}>{n.summary}</p>
                ) : null}
                {n.source_url ? (
                  <a
                    href={n.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-violet-300 underline underline-offset-2"
                    title={n.source_url}
                  >
                    <span className="truncate">{n.source_url}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className={`${BODY} text-slate-400`}>{copy.recentDevelopmentsEmpty}</p>
        )}
      </div>
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>{copy.currentStrategy}</p>
            <p className={`${META} text-slate-500 mb-2`}>{copy.currentStrategyHint}</p>
            <p className={`${BODY} text-slate-100 font-semibold leading-relaxed`}>
              {c.current_strategy}
            </p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>{copy.competitors}</p>
            <p className={`${META} text-slate-500 mb-2`}>{copy.competitorsHint}</p>
            {c.competitors.length > 0 ? (
              <ul className="space-y-2.5">
                {c.competitors.slice(0, 3).map((comp, i) => (
                  <li key={i} className={`${BODY} text-slate-200`}>
                    <span className="font-bold text-emerald-100">{comp.name}</span>
                    {comp.strengths ? (
                      <span className="block text-slate-300 mt-0.5">
                        {copy.strengthLabel}{comp.strengths}
                      </span>
                    ) : null}
                    {comp.weaknesses ? (
                      <span className="block text-slate-400 mt-0.5">
                        {copy.weaknessLabel}{comp.weaknesses}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${BODY} text-slate-500`}>—</p>
            )}
          </>
        }
      />
      <DetailDualRow
        leftAccent="violet"
        rightAccent="amber"
        left={
          <>
            <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>{copy.insiderVoice}</p>
            {c.forum_sample_thin ? (
              <div className="mb-2">
                <InsufficientDataBadge label={copy.forumThinBadge} />
              </div>
            ) : null}
            <BulletList
              items={
                c.insider_voice.length
                  ? c.insider_voice
                  : [copy.forumThinFallback]
              }
              tone="violet"
            />
            <p className={`${META} text-slate-500 mt-2`}>{copy.insiderHint}</p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-amber-200 mb-2`}>{copy.layoffLegal}</p>
            <BulletList items={layoffDisplay} tone="amber" />
          </>
        }
      />
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.strategyQuestions}</p>
            <p className={`${BODY_MUTED} mb-2`}>{copy.strategyQuestionsNote}</p>
            <BulletList
              items={
                c.interviewer_strategy_questions.length
                  ? c.interviewer_strategy_questions
                  : ['—']
              }
              tone="indigo"
            />
          </>
        }
      />
    </GuideSlideShell>
  );
}

function enrichQuestionCard(
  q: InterviewQuestionCard,
  playbook: FullReport['interview_playbook'],
  concerns: FullReport['concerns_defenses'],
  strengths: NonNullable<FullReport['proof_map']>['strengths'] | undefined,
): InterviewQuestionCard {
  const proof = strengths ?? [];
  const cat =
    q.category || (isBehavioral(q.question) ? 'behavioral' : 'technical');
  const template = playbook?.star_templates?.find(
    (tmpl) => tmpl.for_question && q.question.includes(tmpl.for_question.slice(0, 24)),
  );
  const concern = (concerns ?? []).find((c) =>
    q.question.toLowerCase().includes(c.concern.toLowerCase().slice(0, 12)),
  );
  const strength =
    proof.find((s) =>
      (q.star_blueprint || q.question || '')
        .toLowerCase()
        .includes(s.point.toLowerCase().slice(0, 12)),
    )
    || proof[0];
  const isReported = q.predicted === false || Boolean(q.source_url);
  const fromTemplate = template
    ? `S: ${template.situation}\nT: ${template.task}\nA: ${template.action}\nR: ${template.result}`
    : undefined;
  const fromStrength = strength
    ? `S/T/A/R from resume: ${strength.point} — ${strength.description}`
    : undefined;
  return {
    ...q,
    predicted: isReported ? false : true,
    category: cat as 'behavioral' | 'technical',
    resume_anchor:
      q.resume_anchor
      || template?.resume_anchor
      || strength?.point
      || undefined,
    star_blueprint:
      q.star_blueprint
      || q.star_outline
      || fromTemplate
      || fromStrength,
    dos_donts:
      q.dos_donts
      || (concern
        ? `Stay inside resume proof (${strength?.point || 'listed wins'}); do not claim: ${concern.do_not_claim}`
        : strength
          ? `Lead with resume proof: ${strength.point}. Do not invent tools, titles, or metrics not on the resume.`
          : undefined),
    interviewer_intent: q.interviewer_intent || concern?.why || q.evidence,
  };
}

/** Exactly 5 cards per column: reported (full STAR) first, then system analysis. */
function takeFiveForCategory(
  enriched: InterviewQuestionCard[],
  category: 'behavioral' | 'technical',
  pads: InterviewQuestionCard[],
): InterviewQuestionCard[] {
  const primary = enriched.filter((q) => q.category === category);
  const out = [...primary];
  for (const pad of pads) {
    if (out.length >= 5) break;
    if (out.some((q) => q.question === pad.question)) continue;
    out.push({ ...pad, category, predicted: true });
  }
  return out.slice(0, 5);
}

function Page4({
  report,
  copy,
  language,
}: {
  report: FullReport;
  copy: GuideUiCopy;
  language: AppLanguage;
}) {
  const offer = report.offer_strategy;
  const expected = report.expected_offer;
  const offerRange = formatOfferRange(expected);
  const predictedOffer = formatPredictedOffer(expected);
  const seatMedian = expected?.p50?.trim() && expected.p50.trim() !== '—'
    ? expected.p50.trim()
    : null;
  const tc = offer?.tc_breakdown || expected?.tc_breakdown;
  const playbook = report.interview_playbook;

  const { behavioral, technical } = useMemo(() => {
    const predicted = playbook?.predicted?.length
      ? playbook.predicted
      : (report.custom_star_interview_bank || []).map(
          (question): InterviewQuestionCard => ({ question, predicted: true }),
        );
    const reported = playbook?.reported ?? [];
    const strengths = report.proof_map?.strengths ?? [];
    // All reported + predicted get resume-anchored STAR write-ups.
    const merged = [
      ...reported.map((q) => ({ ...q, predicted: false as const })),
      ...predicted,
    ].map((q) =>
      enrichQuestionCard(q, playbook, report.concerns_defenses, strengths),
    );

    const pads: InterviewQuestionCard[] = [
      ...(report.interview_starters ?? []).map(
        (question, i): InterviewQuestionCard => {
          const s = strengths[i % Math.max(strengths.length, 1)];
          return {
            question,
            predicted: true,
            interviewer_intent: 'Likely probe from resume↔JD gaps.',
            resume_anchor: s?.point,
            star_blueprint: s
              ? `S/T/A/R using resume proof “${s.point}”: ${s.description}`
              : 'Use one quantified resume win in S/T/A/R — do not invent facts.',
            dos_donts: s
              ? `Lead with “${s.point}”. Stay inside verified resume facts; do not invent ACH/titles you lack.`
              : 'Stay inside verified resume facts.',
          };
        },
      ),
      ...(report.concerns_defenses ?? []).map(
        (c): InterviewQuestionCard => ({
          question: c.concern,
          predicted: true,
          interviewer_intent: c.why,
          resume_anchor: c.evidence?.slice(0, 80) || strengths[0]?.point,
          star_blueprint:
            c.answer_guide
            || (strengths[0]
              ? `Bridge with resume proof “${strengths[0].point}”: ${strengths[0].description}`
              : undefined),
          dos_donts: `Do not claim: ${c.do_not_claim}`,
        }),
      ),
      ...(report.proof_map?.gaps ?? []).map(
        (g, i): InterviewQuestionCard => {
          const s = strengths[i % Math.max(strengths.length, 1)];
          return {
            question: g.gap,
            predicted: true,
            interviewer_intent: g.description || 'Gap screeners will probe.',
            resume_anchor: s?.point,
            star_blueprint: s
              ? `Honest bridge: adjacent resume proof “${s.point}” (${s.description}) + 60-day learning plan — do not invent past ownership of this gap.`
              : 'Bridge with adjacent resume proof + honest learning plan; do not invent experience.',
            dos_donts: 'Do not invent experience you do not have.',
          };
        },
      ),
    ];

    return {
      behavioral: takeFiveForCategory(merged, 'behavioral', pads),
      technical: takeFiveForCategory(merged, 'technical', pads),
    };
  }, [
    playbook,
    report.custom_star_interview_bank,
    report.concerns_defenses,
    report.interview_starters,
    report.proof_map?.gaps,
    report.proof_map?.strengths,
  ]);

  const tcRows = (
    [
      [copy.tcBase, tc?.base],
      [copy.tcRsu, tc?.equity],
      [copy.tcSignOn, tc?.sign_on ?? tc?.bonus],
      ['Total TC', tc?.total],
    ] as const
  ).filter(([, v]) => Boolean(v?.trim()));

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page4Of}
        title={copy.page4Title}
        badge={copy.page4Badge}
        badgeTone="violet"
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>
              {copy.offerRangeTitle}
            </p>
            <p className={`${BODY_MUTED} mb-2 break-words leading-snug`}>
              {[expected?.region, expected?.currency].filter(Boolean).join(' · ') || 'USD'}
              {expected?.evidence_tier
                ? ` · ${evidenceTierLabel(expected.evidence_tier, language)}`
                : ''}
            </p>
            <div className="flex items-center gap-3 min-w-0 mb-3">
              <div className="min-w-0 flex-1">
                {offerRange ? (
                  <>
                    <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none break-words">
                      {offerRange}
                    </p>
                    {seatMedian ? (
                      <p className={`${BODY} text-emerald-100/90 mt-2`}>
                        <span className="text-slate-400 font-semibold">
                          {copy.offerMedianLabel}:{' '}
                        </span>
                        <span className="font-bold tabular-nums text-emerald-50">
                          {seatMedian}
                        </span>
                      </p>
                    ) : null}
                    {expected?.candidate_position_label ? (
                      <p className={`${BODY_MUTED} mt-1.5 leading-snug line-clamp-2`}>
                        {expected.candidate_position_label}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xl font-bold text-slate-200">{copy.noOfferBand}</p>
                )}
              </div>
              {predictedOffer ? (
                <PredictedLandSquircle
                  value={predictedOffer}
                  label={copy.predictedLandLabel}
                  size="sm"
                />
              ) : null}
            </div>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-1.5`}>{copy.tcBreakdown}</p>
            <p className={`${META} text-slate-500 mb-2`}>{copy.tcHint}</p>
            {tcRows.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {tcRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-indigo-400/30 bg-black/20 px-3 py-2.5"
                  >
                    <p className={`${META} text-slate-400 mb-0.5`}>{label}</p>
                    <p className={`${BODY} font-semibold text-indigo-50 tabular-nums`}>{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${BODY} text-slate-500`}>—</p>
            )}
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>{copy.negotiateScript}</p>
            <ol className="space-y-2">
              {[
                {
                  step: copy.prepareStep,
                  body:
                    offer?.discovery_questions?.[0]
                    || offer?.target
                    || '—',
                },
                {
                  step: copy.pitchStep,
                  body:
                    offer?.script?.slice(0, 280)
                    || offer?.acceptable
                    || '—',
                },
                {
                  step: copy.counterStep,
                  body:
                    offer?.walk_away
                    || (offer?.structured_levers?.[0]
                      ? `${offer.structured_levers[0].name}: ${offer.structured_levers[0].note}`
                      : '—'),
                },
              ].map((s) => (
                <li
                  key={s.step}
                  className="rounded-lg border border-emerald-500/25 bg-black/20 px-3 py-2"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    {s.step}
                  </p>
                  <p className={`${BODY} text-slate-200 mt-1 leading-snug`}>{s.body}</p>
                </li>
              ))}
            </ol>
          </>
        }
      />
      <DetailDualRow
        leftAccent="violet"
        rightAccent="indigo"
        left={
          <QuestionList
            items={behavioral}
            title={copy.behavioralTitle}
            titleClass="text-violet-300"
            categoryLabel={copy.categoryBehavioral}
            copy={copy}
          />
        }
        right={
          <QuestionList
            items={technical}
            title={copy.technicalTitle}
            titleClass="text-indigo-300"
            categoryLabel={copy.categoryTechnical}
            copy={copy}
          />
        }
      />
    </GuideSlideShell>
  );
}

function Page5({ report, copy }: { report: FullReport; copy: GuideUiCopy }) {
  const citations = citationsOrEmpty(report);

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page5Of}
        title={copy.page5Title}
        badge={copy.page5Badge}
        badgeTone="sky"
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>{copy.ragCount}</p>
            <p className="text-5xl font-black text-white tabular-nums leading-none">
              {citations.length}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>{copy.ragSourcesHint}</p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>{copy.invalidLinkTitle}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>
              {copy.invalidLinkBody}
              <strong className="text-amber-200">{copy.neverFakeUrl}</strong>
            </p>
            {report.provenance?.invalid_url_count ? (
              <p className={`${BODY} text-amber-200/90 mt-3`}>
                {report.provenance.invalid_url_count}
              </p>
            ) : null}
          </>
        }
      />
      <div className="border-t border-slate-700/90 px-5 py-3.5">
        <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
          <p className={`${SECTION_TITLE} text-indigo-300 mb-3`}>{copy.webReferences}</p>
          {citations.length === 0 ? (
            <div>
              <InsufficientDataBadge label={copy.noDirectUrl} />
              <p className={`${BODY_MUTED} mt-3`}>
                {copy.manualVerifyPrefix}{' '}
                <span className="text-slate-300 font-semibold">
                  {report.company_name} Glassdoor Blind Levels.fyi layoff
                </span>
              </p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
              {citations.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-700/80 bg-black/20 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-sky-200">
                      {c.source_badge}
                    </span>
                    <span className={`${META} text-slate-500`}>{c.date}</span>
                  </div>
                  <p className={`${BODY} text-slate-200`}>{c.description}</p>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-violet-300 underline underline-offset-2"
                      title={c.url}
                    >
                      <span className="truncate">{c.url}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    <p className={`${META} text-amber-200/90 mt-1`}>
                      {copy.manualVerifyPrefix}
                      {c.manual_verify_keywords
                        ? c.manual_verify_keywords
                        : copy.noDirectLinkParen}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ActionDualRow
        fullWidth={
          <p className={`${BODY_MUTED} leading-relaxed`}>
            Report version: {report.report_version || 'v3'}
            {report.provenance?.validated_at
              ? ` · validated ${report.provenance.validated_at}`
              : ''}
            . {copy.provenanceFooter}
          </p>
        }
      />
    </GuideSlideShell>
  );
}

export default function GuideStrategyPages({
  tab,
  report,
  language = 'en',
}: {
  tab: GuideStrategyTab;
  report: FullReport;
  language?: AppLanguage | string;
}) {
  const lang = normalizeReportLanguage(language);
  const copy = getGuideUiCopy(lang);
  if (tab === 'hiring') return <Page2 report={report} copy={copy} />;
  if (tab === 'interview') return <Page3 report={report} copy={copy} />;
  if (tab === 'salary') return <Page4 report={report} copy={copy} language={lang} />;
  return <Page5 report={report} copy={copy} />;
}
