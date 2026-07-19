'use client';

import React from 'react';
import type { LiteReport } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Home,
  RotateCcw,
  Building2,
  Briefcase,
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { getScoreInfo, BeagleIcon } from '@/components/AnalysisDashboard';
import { getBeagleTierLegend } from '@/lib/beagle-tiers';
import { formatOfferRange, offerEvaluationSummary } from '@/lib/offer-display';
import { scoreSummaryPoints } from '@/lib/score-summary';
import { REPORT_SLIDE_SURFACE, REPORT_ACTION_BTN, REPORT_SHELL_WIDTH } from '@/constants/report-frame';
import { SampleMark } from '@/components/SampleMark';

/** Primary section labels (Job Fit Snapshot, Candidate Fit Score, …) */
const SECTION_TITLE =
  'text-sm sm:text-base font-bold uppercase tracking-[0.14em]';

interface LiteReportDashboardProps {
  report: LiteReport;
  /** Snapshot UI is English-only per product direction */
  language?: 'en';
  onNewAnalysis?: () => void;
  embedded?: boolean;
  /** Show large SAMPLE mark at top of the slide (sample preview pages) */
  isSample?: boolean;
}

/**
 * Job Fit Snapshot — one-page slide frame.
 * Dual heroes: Fit Score (named Beagle tier) + Expected Offer.
 * Shows: Score Summary, breakdown, Apply Decision, strengths/gaps.
 * Hidden by product decision: Evidence Coverage, Hard Filter panel, Role Read, starters.
 */
export default function LiteReportDashboard({
  report,
  onNewAnalysis,
  embedded = false,
  isSample = false,
}: LiteReportDashboardProps) {
  const score = report.fit_score?.score ?? report.match_score ?? 0;
  const scoreInfo = getScoreInfo(score, 'en');
  const scoreData = [{ name: 'Score', value: score, fill: scoreInfo.fill }];
  const [showBeagleScale, setShowBeagleScale] = React.useState(false);
  const beagleTiers = getBeagleTierLegend(score, 'en');

  const strengths = (report.proof_map?.strengths ?? report.matching_strengths ?? []).slice(0, 4);
  const gaps = (report.proof_map?.gaps ?? report.critical_gaps ?? []).slice(0, 4);
  const offer = report.expected_offer;
  const offerRange = formatOfferRange(offer);
  const offerEval = offerEvaluationSummary(offer);
  const breakdown = (report.fit_score?.breakdown ?? []).slice(0, 5);
  const apply = report.apply_decision;
  const summaryPoints = scoreSummaryPoints(
    report.fit_score?.sharp_verdict
      || report.recruiter_verdict
      || report.one_sentence_sharp_critique
      || scoreInfo.description,
    report.fit_score?.sharp_verdict_points,
  );

  const handleBack = () => {
    if (onNewAnalysis) {
      onNewAnalysis();
      return;
    }
    window.location.href = '/';
  };

  return (
    <div
      className={`animate-fade-in w-full mx-auto ${
        embedded ? '' : `${REPORT_SHELL_WIDTH} space-y-4`
      }`}
    >
      {!embedded && (
        <div className="no-print flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleBack}
            className={REPORT_ACTION_BTN}
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            type="button"
            onClick={handleBack}
            className={REPORT_ACTION_BTN}
          >
            <RotateCcw className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      )}

      {/* One-page slide frame — brighter outer border (was on upgrade CTA) */}
      <article
        className={`overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 ${REPORT_SLIDE_SURFACE}`}
      >
        {isSample && (
          <div className="pt-4 pb-1 px-5 sm:px-6 border-b border-slate-800/80">
            <SampleMark />
          </div>
        )}
        {/* Slide header */}
        <header className="border-b border-slate-700/90 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`${SECTION_TITLE} text-indigo-400 mb-1.5`}>
                Job Fit Snapshot
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2 flex-wrap leading-tight">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
                {report.job_title || 'Unknown Role'}
              </h1>
              <p className="text-slate-400 mt-1.5 flex items-center gap-2 text-lg">
                <Building2 className="w-4 h-4 shrink-0" />
                {report.company_name || 'Unknown Company'}
              </p>
            </div>
            <div
              className="shrink-0 rounded-lg border border-sky-400/70 bg-slate-950/60 px-3 py-1.5 text-right"
              style={{ borderColor: `${scoreInfo.fill}66` }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Fit</p>
              <p className={`text-2xl font-black tabular-nums leading-none ${scoreInfo.color}`}>
                {score}
              </p>
            </div>
          </div>
        </header>

        {/* Heroes: Fit | Offer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-700/90">
          <section className="flex flex-col p-5 sm:p-6">
            <p className={`${SECTION_TITLE} text-indigo-400 mb-3`}>
              Candidate Fit Score
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col items-center shrink-0">
                <BeagleIcon
                  className={`w-16 h-16 sm:w-20 sm:h-20 ${scoreInfo.glowClass}`}
                  color={scoreInfo.fill}
                  spotColor={scoreInfo.spotColor}
                />
              </div>
              <div
                className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0"
                onMouseEnter={() => setShowBeagleScale(true)}
                onMouseLeave={() => setShowBeagleScale(false)}
              >
                <button
                  type="button"
                  aria-expanded={showBeagleScale}
                  aria-controls="beagle-scale-popover"
                  aria-label={`Fit score ${score}. Hover or focus for Beagle Scale.`}
                  onFocus={() => setShowBeagleScale(true)}
                  onBlur={() => setShowBeagleScale(false)}
                  onClick={() => setShowBeagleScale((open) => !open)}
                  className="relative w-full h-full flex items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-400/80 cursor-help"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="70%"
                      outerRadius="100%"
                      barSize={10}
                      data={scoreData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={30} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className={`text-5xl font-black ${scoreInfo.color}`}>{score}</span>
                  </div>
                </button>

                {showBeagleScale && (
                  <div
                    id="beagle-scale-popover"
                    role="tooltip"
                    className="absolute left-1/2 top-[calc(100%+0.5rem)] z-30 w-[min(20rem,calc(100vw-2.5rem))] -translate-x-1/2 rounded-xl border border-slate-600/90 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md animate-fade-in"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Beagle Scale — what each level means
                    </p>
                    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {beagleTiers.map((tier) => (
                        <li
                          key={tier.index}
                          className={`rounded-md border px-2.5 py-1.5 ${
                            tier.active
                              ? 'border-indigo-400/50 bg-indigo-500/15'
                              : 'border-slate-700/60 bg-slate-900/50'
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-1">
                            <p className={`text-sm font-bold ${tier.visual.color}`}>
                              {tier.name}
                              {tier.active ? ' · You' : ''}
                            </p>
                            <span className="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0">
                              {tier.scoreRange}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-300 mt-0.5">
                            {tier.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">
                            {tier.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-2xl sm:text-3xl font-black leading-tight ${scoreInfo.color}`}>
                  {scoreInfo.level}
                </p>
                <p className="text-lg font-semibold text-slate-200 mt-1">{scoreInfo.label}</p>
                <p className="text-base text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                  {scoreInfo.description}
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col p-5 sm:p-6 border-t border-slate-700/90 lg:border-t-0">
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-1 flex items-center gap-1.5`}>
              <DollarSign className="w-4 h-4" />
              Expected Offer Range
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {[offer?.region, offer?.currency].filter(Boolean).join(' · ') || 'USD'}
              {offer?.evidence_tier ? ` · Tier ${offer.evidence_tier}` : ''}
            </p>

            <div className="flex-1 flex flex-col justify-center py-1">
              {offerRange ? (
                <>
                  <p className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none">
                    {offerRange}
                  </p>
                  {offer?.candidate_position_label && (
                    <p className="text-lg text-emerald-100/90 leading-relaxed mt-3">
                      {offer.candidate_position_label}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-200">No reliable offer band yet</p>
                  <p className="text-lg text-slate-400 mt-1 leading-relaxed">
                    Ask the recruiter for the approved cash range before you invest interview time.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Score breakdown (left) | Range Evaluation (right) */}
        <div className="border-t border-slate-700/90 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 lg:items-stretch">
            <div className="h-full rounded-lg border border-sky-400/50 bg-indigo-500/10 px-3.5 py-3 sm:px-4 sm:py-4 flex flex-col">
              <p className={`${SECTION_TITLE} text-indigo-300 mb-3`}>
                Score breakdown
              </p>
              {breakdown.length > 0 ? (
                <ul className="space-y-2.5 flex-1">
                  {breakdown.map((b, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-200">
                          {b.dimension}
                          <span className="ml-2 text-xs font-medium text-slate-500">
                            {b.weight_pct}%
                          </span>
                        </p>
                        {b.note ? (
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{b.note}</p>
                        ) : null}
                      </div>
                      <span className="text-lg font-black tabular-nums text-indigo-200 shrink-0">
                        {Math.round(b.score)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-slate-500">Breakdown unavailable for this run.</p>
              )}
            </div>

            <div className="h-full rounded-lg border border-emerald-400/55 bg-emerald-500/10 px-3.5 py-3 sm:px-4 sm:py-4 flex flex-col">
              <p className={`${SECTION_TITLE} text-emerald-300 mb-1`}>
                Range Evaluation
              </p>
              <p className="text-lg font-bold text-emerald-100 mb-1">{offerEval.headline}</p>
              <p className="text-lg text-slate-200 leading-relaxed flex-1">{offerEval.body}</p>
              {offerEval.note ? (
                <p className="text-base text-slate-400 mt-2 leading-relaxed">{offerEval.note}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Full-width Score Summary — Apply Decision at bottom */}
        <div className="border-t border-slate-700/90 px-5 py-5 sm:px-6 sm:py-6">
          <div className="w-full rounded-lg border border-sky-400/50 bg-indigo-500/10 px-4 py-4 sm:px-5 sm:py-5 flex flex-col">
            <p className={`${SECTION_TITLE} text-indigo-300 mb-1`}>
              Score Summary
            </p>
            <p className={`text-lg font-bold ${scoreInfo.color} mb-1`}>
              {score}/100 · {scoreInfo.level}
              {report.fit_score?.band ? ` · ${report.fit_score.band}` : ''}
            </p>
            <ul className="mt-2 space-y-2">
              {summaryPoints.map((point, i) => (
                <li key={i} className="flex gap-2.5 text-lg text-slate-200 leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300/90" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {apply?.label ? (
              <div className="mt-4 pt-4 border-t border-sky-400/30">
                <p className={`text-lg font-bold ${scoreInfo.color}`}>
                  {apply.label}
                </p>
                {apply.reason ? (
                  <p className="text-base text-slate-300 mt-1.5 leading-relaxed">{apply.reason}</p>
                ) : null}
                {apply.next_best_action ? (
                  <p className="text-base text-slate-400 mt-2 leading-relaxed">
                    <span className="font-semibold text-slate-300">Next: </span>
                    {apply.next_best_action}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Strengths | Gaps — shared outer frame */}
        <div className="border-t border-slate-700/90 px-5 py-5 sm:px-6 sm:py-6">
          <div className="w-full rounded-lg border border-slate-500/45 bg-slate-950/40 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-slate-700/90">
              <section className="p-4 sm:p-5">
                <h3 className={`${SECTION_TITLE} text-emerald-400 mb-3 flex items-center`}>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Top Strengths
                </h3>
                <ul className="space-y-2.5">
                  {strengths.map((item, idx) => (
                    <li key={idx} className="border-l-2 border-emerald-500/40 pl-3">
                      <p className="text-lg font-semibold text-slate-200">{item.point}</p>
                      <p className="text-base text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="p-4 sm:p-5">
                <h3 className={`${SECTION_TITLE} text-violet-300 mb-3 flex items-center`}>
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Critical Gaps
                </h3>
                <ul className="space-y-2.5">
                  {gaps.map((item, idx) => (
                    <li key={idx} className="border-l-2 border-violet-400/40 pl-3">
                      <p className="text-lg font-semibold text-slate-200">{item.gap}</p>
                      <p className="text-base text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
