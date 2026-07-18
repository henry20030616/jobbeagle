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
  ChevronDown,
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { getScoreInfo, BeagleIcon } from '@/components/AnalysisDashboard';
import { getBeagleTierLegend } from '@/lib/beagle-tiers';
import { formatOfferRange, offerEvaluationSummary } from '@/lib/offer-display';

interface LiteReportDashboardProps {
  report: LiteReport;
  /** Snapshot UI is English-only per product direction */
  language?: 'en';
  onNewAnalysis?: () => void;
  embedded?: boolean;
}

/**
 * Job Fit Snapshot — one-page slide frame.
 * Dual heroes: Fit Score (named Beagle tier) + Expected Offer.
 * No Evidence Coverage. No role-read / interview starters / long checklists.
 */
export default function LiteReportDashboard({
  report,
  onNewAnalysis,
  embedded = false,
}: LiteReportDashboardProps) {
  const score = report.fit_score?.score ?? report.match_score ?? 0;
  const scoreInfo = getScoreInfo(score, 'en');
  const scoreData = [{ name: 'Score', value: score, fill: scoreInfo.fill }];
  const [expandedBeagleTier, setExpandedBeagleTier] = React.useState<number | null>(null);

  const strengths = (report.proof_map?.strengths ?? report.matching_strengths ?? []).slice(0, 4);
  const gaps = (report.proof_map?.gaps ?? report.critical_gaps ?? []).slice(0, 4);
  const offer = report.expected_offer;
  const offerRange = formatOfferRange(offer);
  const offerEval = offerEvaluationSummary(offer);

  const handleBack = () => {
    if (onNewAnalysis) {
      onNewAnalysis();
      return;
    }
    window.location.href = '/';
  };

  return (
    <div className={`animate-fade-in ${embedded ? '' : 'space-y-4'}`}>
      {!embedded && (
        <div className="no-print flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      )}

      {/* One-page slide frame */}
      <article
        className={`overflow-hidden rounded-2xl border border-slate-600/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_25px_50px_-12px_rgba(0,0,0,0.55)] ${
          embedded ? '' : 'max-w-5xl'
        }`}
      >
        {/* Slide header */}
        <header className="border-b border-slate-700/90 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1.5">
                Job Fit Snapshot
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap leading-tight">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
                {report.job_title || 'Unknown Role'}
              </h1>
              <p className="text-slate-400 mt-1.5 flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 shrink-0" />
                {report.company_name || 'Unknown Company'}
              </p>
            </div>
            <div
              className="shrink-0 rounded-lg border border-slate-600/80 bg-slate-950/60 px-3 py-1.5 text-right"
              style={{ borderColor: `${scoreInfo.fill}66` }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fit</p>
              <p className={`text-lg font-black tabular-nums leading-none ${scoreInfo.color}`}>
                {score}
              </p>
            </div>
          </div>
        </header>

        {/* Heroes: Fit | Offer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-y lg:divide-y-0 divide-slate-700/90">
          <section className="flex flex-col p-5 sm:p-6 min-h-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400 mb-3">
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
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
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
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-black ${scoreInfo.color}`}>{score}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-lg sm:text-xl font-black leading-tight ${scoreInfo.color}`}>
                  {scoreInfo.level}
                </p>
                <p className="text-sm font-semibold text-slate-200 mt-1">{scoreInfo.label}</p>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                  {scoreInfo.description}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Beagle Scale — what each level means
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {getBeagleTierLegend(score, 'en').map((tier) => {
                  const open = expandedBeagleTier === tier.index;
                  return (
                    <button
                      key={tier.index}
                      type="button"
                      aria-expanded={open}
                      onMouseEnter={() => setExpandedBeagleTier(tier.index)}
                      onMouseLeave={() =>
                        setExpandedBeagleTier((cur) => (cur === tier.index ? null : cur))
                      }
                      onFocus={() => setExpandedBeagleTier(tier.index)}
                      onBlur={() =>
                        setExpandedBeagleTier((cur) => (cur === tier.index ? null : cur))
                      }
                      onClick={() => setExpandedBeagleTier(open ? null : tier.index)}
                      className={`w-full text-left rounded-md border px-2.5 py-1.5 transition-colors ${
                        tier.active
                          ? 'border-indigo-400/50 bg-indigo-500/15'
                          : 'border-slate-700/60 bg-slate-950/40 hover:bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-1">
                            <p className={`text-[11px] font-bold ${tier.visual.color}`}>
                              {tier.name}
                              {tier.active ? ' · You' : ''}
                            </p>
                            <span className="text-[9px] font-semibold text-slate-500 tabular-nums shrink-0">
                              {tier.scoreRange}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-300 mt-0.5">
                            {tier.label}
                          </p>
                        </div>
                        <ChevronDown
                          className={`w-3 h-3 text-slate-500 shrink-0 mt-0.5 transition-transform duration-200 ${
                            open ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                      </div>
                      <div
                        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug pb-0.5">
                            {tier.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <div className="rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-3 min-h-[7.5rem] flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-1">
                  Score Summary
                </p>
                <p className={`text-sm font-bold ${scoreInfo.color} mb-1`}>
                  {score}/100 · {scoreInfo.level}
                  {report.fit_score?.band ? ` · ${report.fit_score.band}` : ''}
                </p>
                <p className="text-sm text-slate-200 leading-relaxed flex-1">
                  {report.fit_score?.sharp_verdict
                    || report.recruiter_verdict
                    || report.one_sentence_sharp_critique
                    || scoreInfo.description}
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col p-5 sm:p-6 min-h-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/90 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Expected Offer Range
            </p>
            <p className="text-[11px] text-slate-500 mb-4">
              {[offer?.region, offer?.currency].filter(Boolean).join(' · ') || 'USD'}
              {offer?.evidence_tier ? ` · Tier ${offer.evidence_tier}` : ''}
            </p>

            <div className="flex-1 flex flex-col justify-center py-1">
              {offerRange ? (
                <>
                  <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                    {offerRange}
                  </p>
                  {offer?.candidate_position_label && (
                    <p className="text-sm text-emerald-100/90 leading-relaxed mt-3">
                      {offer.candidate_position_label}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-200">No reliable offer band yet</p>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    Ask the recruiter for the approved cash range before you invest interview time.
                  </p>
                </>
              )}
            </div>

            <div className="mt-auto pt-4">
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3 min-h-[7.5rem] flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1">
                  Range Evaluation
                </p>
                <p className="text-sm font-bold text-emerald-100 mb-1">{offerEval.headline}</p>
                <p className="text-sm text-slate-200 leading-relaxed flex-1">{offerEval.body}</p>
                {offerEval.note ? (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{offerEval.note}</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        {/* Strengths | Gaps — bottom of same slide */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-slate-700/90 border-t border-slate-700/90">
          <section className="p-5 sm:px-6 sm:py-5">
            <h3 className="text-[10px] font-bold text-emerald-400 mb-3 flex items-center uppercase tracking-[0.18em]">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Top Strengths
            </h3>
            <ul className="space-y-2.5">
              {strengths.map((item, idx) => (
                <li key={idx} className="border-l-2 border-emerald-500/40 pl-3">
                  <p className="text-sm font-semibold text-slate-200">{item.point}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="p-5 sm:px-6 sm:py-5">
            <h3 className="text-[10px] font-bold text-violet-300 mb-3 flex items-center uppercase tracking-[0.18em]">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              Critical Gaps
            </h3>
            <ul className="space-y-2.5">
              {gaps.map((item, idx) => (
                <li key={idx} className="border-l-2 border-violet-400/40 pl-3">
                  <p className="text-sm font-semibold text-slate-200">{item.gap}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.description}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </div>
  );
}
