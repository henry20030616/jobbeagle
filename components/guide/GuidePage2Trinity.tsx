'use client';

/**
 * Guide Page 2: Team & Role (Micro) — Trinity Bento Grid Edition
 * Maps to GuideStrategyPayload.page2_team_and_role
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Users, TrendingUp, XCircle } from 'lucide-react';
import type { FullReport } from '@/types';
import type { AppLanguage } from '@/lib/language-context';
import type { GuideUiCopy } from '@/lib/report-ui-copy';
import {
  GuideSlideShell,
  PageHeaderBar,
  SECTION_TITLE,
  BODY,
  BODY_MUTED,
  META,
} from '@/components/guide/GuideSlideChrome';

interface Page2Props {
  report: FullReport;
  copy: GuideUiCopy;
  language: AppLanguage;
}

/**
 * Trinity Page 2 — Bento Grid Layout
 * - Top Banner: Career Path Highlight (next_title_1_3yr + salary_growth_trajectory)
 * - Left 60%: High-density Role Overview (responsibilities + requirements + RTO badge)
 * - Right 40%: WLB Dashboard + Pros/Cons
 */
export default function GuidePage2Trinity({ report, copy, language }: Page2Props) {
  const t = report.role_team_insights;

  // Fallback to empty structure if no data
  if (!t) {
    return (
      <GuideSlideShell>
        <PageHeaderBar
          pageOf={copy.page2Of}
          title={copy.page2Title}
          badge={copy.badgeSampleThin}
          badgeTone="amber"
        />
        <div className="px-5 py-8 text-center">
          <p className={`${BODY} text-slate-400`}>
            {copy.emptyRoleContent || 'No team & role data available.'}
          </p>
        </div>
      </GuideSlideShell>
    );
  }

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

      {/* Top Banner: Career Path & Growth */}
      <div className="border-b border-slate-700/90 bg-gradient-to-r from-emerald-950/40 to-indigo-950/40 px-5 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
            <TrendingUp className="h-6 w-6 text-emerald-300" />
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

      {/* Bento Grid: Left 60% + Right 40% */}
      <div className="grid lg:grid-cols-[60%_40%] gap-0 border-b border-slate-700/90">
        {/* Left Column: Role Overview (High-Density) */}
        <div className="border-r border-slate-700/90 px-5 py-4 space-y-4">
          {/* RTO Badge (Top Right Corner) */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className={`${SECTION_TITLE} text-indigo-400`}>
              {copy.roleContent || 'Role Overview'}
            </h3>
            <div className="flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-1.5">
              <Clock className="h-4 w-4 text-sky-300" />
              <span className="text-sm font-bold text-sky-100">{rtoPolicy}</span>
            </div>
          </div>

          {/* Responsibilities (High-Density Bullets) */}
          <div>
            <p className={`${META} text-slate-500 mb-2`}>
              {copy.roleContentHint || 'High-density responsibilities'}
            </p>
            <ul className="space-y-1.5">
              {responsibilities.slice(0, 4).map((item: string, i: number) => (
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
              {requirements.slice(0, 4).map((item: string, i: number) => (
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
              <Users className="h-5 w-5" />
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
                  {copy.teamSampleInsufficient || 'Team Vibe'}
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
                  <XCircle className="h-4 w-4" />
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
          {(t.promotion_skill_gaps || []).map((skill, i) => (
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
