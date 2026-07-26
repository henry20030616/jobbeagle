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
  CalendarDays,
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { getScoreInfo, BeagleIcon } from '@/components/AnalysisDashboard';
import { getBeagleTierLegend } from '@/lib/beagle-tiers';
import {
  evidenceTierLabel,
  formatOfferRange,
  formatPredictedOffer,
  offerEvaluationSummary,
} from '@/lib/offer-display';
import { scoreSummaryPoints, splitScoreSummaryPoint } from '@/lib/score-summary';
import { formatJobSourceDate } from '@/lib/job-source';
import {
  REPORT_SLIDE_SURFACE,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
  REPORT_SHELL_WIDTH,
} from '@/constants/report-frame';
import { splitDecisionBrief } from '@/lib/decision-brief';
import { SampleMark } from '@/components/SampleMark';
import PredictedLandSquircle from '@/components/PredictedLandSquircle';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';
import { getSnapshotUiCopy } from '@/lib/report-ui-copy';

/** Fixed slide type — no viewport breakpoints (scale stage handles size). */
const SECTION_TITLE = 'text-lg font-bold uppercase tracking-[0.14em]';
/** Body copy inside the slide — keep ≥ text-lg so it stays readable when zoomed. */
const BODY = 'text-lg';
const BODY_MUTED = 'text-lg text-slate-400';
const META = 'text-base';

interface LiteReportDashboardProps {
  report: LiteReport;
  /** UI chrome + Beagle tiers follow the language button */
  language?: AppLanguage | string;
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
  language = 'en',
  onNewAnalysis,
  embedded = false,
  isSample = false,
}: LiteReportDashboardProps) {
  const lang = normalizeReportLanguage(language);
  const t = getSnapshotUiCopy(lang);
  const score = report.fit_score?.score ?? report.match_score ?? 0;
  const scoreInfo = getScoreInfo(score, lang);
  const scoreData = [{ name: 'Score', value: score, fill: scoreInfo.fill }];
  const [showBeagleScale, setShowBeagleScale] = React.useState(false);
  const beagleTiers = getBeagleTierLegend(score, lang);

  const strengths = (report.proof_map?.strengths ?? report.matching_strengths ?? []).slice(0, 4);
  const gaps = (report.proof_map?.gaps ?? report.critical_gaps ?? []).slice(0, 4);
  const offer = report.expected_offer;
  const offerRange = formatOfferRange(offer);
  const predictedOffer = formatPredictedOffer(offer);
  const offerEval = offerEvaluationSummary(offer, lang);
  const tc = offer?.tc_breakdown;
  const tcRows = (
    [
      [t.base, tc?.base],
      [t.equityRsu, tc?.equity],
      [t.signOn, tc?.sign_on ?? tc?.bonus],
      [t.total, tc?.total],
    ] as const
  ).filter(([, v]) => Boolean(v?.trim()));
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
      className={`animate-fade-in w-full min-w-0 mx-auto ${
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
            <Home className={REPORT_ACTION_ICON} />
            {t.backHome}
          </button>
          <button
            type="button"
            onClick={handleBack}
            className={REPORT_ACTION_BTN}
          >
            <RotateCcw className={REPORT_ACTION_ICON} />
            {t.newAnalysis}
          </button>
        </div>
      )}

      {/* One-page slide — fixed desktop proportions; outer ReportFitStage scales uniformly */}
      <article
        className={`relative w-full min-w-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 ${REPORT_SLIDE_SURFACE}`}
      >
        {/* Slide header */}
        <header className="border-b border-slate-700/90 px-5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`${SECTION_TITLE} text-indigo-400 mb-1`}>
                {t.productTitle}
              </p>
              <h1 className="text-4xl font-black text-white flex items-center gap-2 flex-wrap leading-tight">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
                {report.job_title || t.unknownRole}
              </h1>
              <dl className={`mt-2 space-y-1 ${BODY}`}>
                <div className="flex items-center gap-2 text-slate-300">
                  <Building2 className="w-5 h-5 shrink-0 text-slate-500" aria-hidden />
                  <dt className="sr-only">{t.company}</dt>
                  <dd>
                    <span className="text-slate-500 text-base font-semibold uppercase tracking-wide mr-2">
                      {t.company}
                    </span>
                    {report.company_name || t.unknownCompany}
                  </dd>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CalendarDays className="w-5 h-5 shrink-0 text-slate-500" aria-hidden />
                  <dt className="sr-only">{t.posted}</dt>
                  <dd>
                    <span className="text-slate-500 text-base font-semibold uppercase tracking-wide mr-2">
                      {t.posted}
                    </span>
                    {formatJobSourceDate(report.job_source, report.job_posted_date)}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {isSample ? <SampleMark /> : null}
              <div
                className="rounded-lg border border-sky-400/70 bg-slate-950/60 px-3.5 py-2 text-center"
                style={{ borderColor: `${scoreInfo.fill}66` }}
              >
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">{t.fit}</p>
                <p className={`text-3xl font-black tabular-nums leading-none ${scoreInfo.color}`}>
                  {score}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Heroes: Fit | Offer — same title row + circle row so gauges align */}
        <div className="grid grid-cols-2 items-stretch divide-x divide-slate-700/90">
          <section className="flex flex-col p-4 min-w-0">
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2 min-h-[1.25rem]`}>
              {t.candidateFitScore}
            </p>
            <div className="flex flex-1 items-center gap-5 min-h-[11rem]">
              <div className="flex flex-col items-center shrink-0">
                <BeagleIcon
                  className={`w-32 h-32 ${scoreInfo.glowClass}`}
                  color={scoreInfo.fill}
                  spotColor={scoreInfo.spotColor}
                  glassesColor={scoreInfo.fill}
                />
              </div>
              <div
                className="relative w-40 h-40 shrink-0"
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
                      innerRadius="68%"
                      outerRadius="100%"
                      barSize={14}
                      data={scoreData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={30} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className={`text-7xl font-black tabular-nums leading-none ${scoreInfo.color}`}>
                      {score}
                    </span>
                  </div>
                </button>

                {showBeagleScale && (
                  <div
                    id="beagle-scale-popover"
                    role="tooltip"
                    className="absolute left-1/2 top-[calc(100%+0.5rem)] z-30 w-80 -translate-x-1/2 rounded-xl border border-slate-600/90 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md animate-fade-in"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Beagle Scale — what each level means
                    </p>
                    <ul className="grid grid-cols-2 gap-1.5">
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
                <p className={`text-3xl font-black leading-tight ${scoreInfo.color}`}>
                  {scoreInfo.level}
                </p>
                <p className="text-xl font-semibold text-slate-200 mt-1">{scoreInfo.label}</p>
                <p className={`${BODY_MUTED} mt-1.5 leading-relaxed line-clamp-3`}>
                  {scoreInfo.description}
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col p-4 min-w-0">
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2 min-h-[1.25rem] flex items-center gap-1.5`}>
              <DollarSign className="w-4 h-4 shrink-0" />
              {t.expectedOffer}
            </p>

            <div className="flex flex-1 items-center gap-4 min-w-0 min-h-[7.5rem]">
              <div className="min-w-0 flex-1">
                <p className={`${BODY_MUTED} mb-1.5 break-words leading-snug`}>
                  {[offer?.region, offer?.currency].filter(Boolean).join(' · ') || 'USD'}
                  {offer?.evidence_tier ? ` · ${evidenceTierLabel(offer.evidence_tier, lang)}` : ''}
                </p>
                {offerRange ? (
                  <>
                    <p className="text-5xl font-black text-white tracking-tight leading-none break-words">
                      {offerRange}
                    </p>
                    {offer?.candidate_position_label && (
                      <p className={`${BODY} text-emerald-100/90 leading-relaxed mt-2 break-words line-clamp-3`}>
                        {offer.candidate_position_label}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-slate-200">{t.noOfferBand}</p>
                    <p className={`${BODY_MUTED} mt-1 leading-relaxed`}>
                      Ask the recruiter for the approved cash range before you invest interview time.
                    </p>
                  </>
                )}
              </div>

              {predictedOffer ? (
                <PredictedLandSquircle value={predictedOffer} />
              ) : null}
            </div>
          </section>
        </div>

        {/* Score breakdown | Range Evaluation */}
        <div className="border-t border-slate-700/90 px-5 py-3.5">
          <div className="grid grid-cols-2 gap-3 items-stretch">
            <div className="h-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 px-3.5 py-3 flex flex-col">
              <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>
                Score breakdown
              </p>
              {breakdown.length > 0 ? (
                <ul className="space-y-2.5 flex-1">
                  {breakdown.map((b, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`${BODY} font-semibold text-slate-200`}>
                          {b.dimension}
                          <span className="ml-2 text-sm font-medium text-slate-500">
                            {b.weight_pct}%
                          </span>
                        </p>
                        {b.note ? (
                          <p className={`${BODY_MUTED} mt-1 leading-snug line-clamp-3`}>
                            {b.note}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xl font-black tabular-nums text-indigo-200 shrink-0">
                        {Math.round(b.score)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`${BODY} text-slate-500`}>Breakdown unavailable for this run.</p>
              )}
            </div>

            <div className="h-full min-w-0 rounded-lg border border-emerald-400/55 bg-emerald-500/10 px-3.5 py-3 flex flex-col">
              <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>
                Range Evaluation
              </p>
              {tcRows.length > 0 ? (
                <div className="mb-2.5">
                  <p className={`${META} font-bold uppercase tracking-wider text-emerald-200/80 mb-1.5`}>
                    Est. salary mix
                  </p>
                  <div className={`grid gap-2 ${tcRows.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    {tcRows.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-md border border-emerald-400/25 bg-black/20 px-2.5 py-2 min-w-0"
                      >
                        <p className={`${META} text-slate-400 mb-0.5`}>{label}</p>
                        <p className={`${BODY} font-semibold text-emerald-50 tabular-nums break-words leading-tight`}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <p className="text-xl font-bold text-emerald-100 mb-1 break-words">{offerEval.headline}</p>
              <p className={`${BODY} text-slate-200 leading-relaxed flex-1 break-words`}>{offerEval.body}</p>
              {offerEval.note ? (
                <p className={`${BODY_MUTED} mt-1.5 leading-relaxed break-words`}>{offerEval.note}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Strengths | Gaps — one shared frame, bullet lists */}
        <div className="border-t border-slate-700/90 px-5 py-3.5">
          <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10">
            <div className="grid grid-cols-2 divide-x divide-sky-400/25">
              <section className="p-4 min-w-0">
                <h3 className={`${SECTION_TITLE} text-emerald-400 mb-2 flex items-center`}>
                  <CheckCircle2 className="w-5 h-5 mr-1.5" />
                  {t.topStrengths}
                </h3>
                <ul className="space-y-1.5">
                  {strengths.map((item, idx) => (
                    <li key={idx} className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
                      <span
                        className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400/90"
                        aria-hidden
                      />
                      <span>
                        {item.skill_kind ? (
                          <span className="mr-1.5 text-xs font-bold uppercase tracking-wider text-emerald-200/80">
                            [{item.skill_kind === 'hard' ? t.hardSkill : t.softSkill}]
                          </span>
                        ) : null}
                        <span className="font-semibold text-slate-100">{item.point}</span>
                        {item.description ? (
                          <span className="text-slate-400">: {item.description}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="p-4 min-w-0">
                <h3 className={`${SECTION_TITLE} text-violet-300 mb-2 flex items-center`}>
                  <AlertTriangle className="w-5 h-5 mr-1.5" />
                  {t.criticalGaps}
                </h3>
                {report.ats_warning ? (
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 mb-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                        {t.atsWarningTitle}
                      </span>
                      {typeof report.ats_warning.pass_rate_pct === 'number' ? (
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-500/20 text-red-300 border border-red-500/40">
                          {t.atsPassRate(Math.round(report.ats_warning.pass_rate_pct))}
                        </span>
                      ) : null}
                    </div>
                    <p className={`${META} text-slate-300 mt-1.5 leading-snug`}>
                      <strong className="text-red-400">{t.atsHighRiskPrefix}</strong>
                      {report.ats_warning.summary}
                      {report.ats_warning.missing_keyword_count > 0
                        ? t.atsMissingKeywords(
                            report.ats_warning.missing_keyword_count,
                            report.ats_warning.missing_keywords?.length
                              ? report.ats_warning.missing_keywords.slice(0, 4).join(', ')
                              : '',
                          )
                        : null}
                    </p>
                  </div>
                ) : null}
                <ul className="space-y-1.5">
                  {gaps.map((item, idx) => (
                    <li key={idx} className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
                      <span
                        className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-violet-300/90"
                        aria-hidden
                      />
                      <span>
                        {item.skill_kind ? (
                          <span className="mr-1.5 text-xs font-bold uppercase tracking-wider text-violet-200/80">
                            [{item.skill_kind === 'hard' ? t.hardSkill : t.softSkill}]
                          </span>
                        ) : null}
                        <span className="font-semibold text-slate-100">{item.gap}</span>
                        {item.description ? (
                          <span className="text-slate-400">: {item.description}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>

        {/* Score Summary | Apply decision — parallel to Strengths | Gaps */}
        <div className="border-t border-slate-700/90 px-5 py-3.5">
          <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10">
            <div className="grid grid-cols-2 divide-x divide-sky-400/25 items-stretch">
              <section className="p-4 min-w-0 flex flex-col">
                <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>
                  {t.scoreSummary}
                </p>
                <p className={`text-xl font-bold ${scoreInfo.color} mb-2`}>
                  {score}/100 · {scoreInfo.level}
                  {report.fit_score?.band ? ` · ${report.fit_score.band}` : ''}
                </p>
                <ul className="space-y-1.5 flex-1">
                  {summaryPoints.map((point, i) => {
                    const { label, detail } = splitScoreSummaryPoint(point);
                    return (
                      <li key={i} className={`flex gap-2.5 ${BODY} leading-snug`}>
                        <span
                          className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300/90"
                          aria-hidden
                        />
                        <span>
                          <span className="font-semibold text-slate-100">{label}</span>
                          {detail ? (
                            <span className="text-slate-400">: {detail}</span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="p-4 min-w-0 flex flex-col">
                <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>
                  {(apply?.label && t.applyLabels[apply.label]) || apply?.label || t.applyDecisionFallback}
                </p>
                {apply?.reason ? (
                  <ul className="space-y-1.5 flex-1">
                    {splitDecisionBrief(apply.reason).map((point, i) => (
                      <li key={i} className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
                        <span
                          className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-violet-300/90"
                          aria-hidden
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`${BODY} text-slate-500 flex-1`}>
                    Decision brief unavailable for this run.
                  </p>
                )}
                {apply?.next_best_action ? (
                  <ul className="mt-3 pt-3 border-t border-sky-400/25 space-y-1.5">
                    <li className={`flex gap-2.5 ${BODY} text-slate-200 leading-snug`}>
                      <span
                        className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-violet-200"
                        aria-hidden
                      />
                      <span>
                        <span className="font-semibold text-violet-200">Next: </span>
                        {apply.next_best_action}
                      </span>
                    </li>
                  </ul>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
