'use client';

import React from 'react';
import type { LiteReport } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Home,
  RotateCcw,
  Sparkles,
  Building2,
  Briefcase,
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { getScoreInfo, BeagleIcon } from '@/components/AnalysisDashboard';
import { startCheckout } from '@/lib/checkout-client';
import { formatOfferRange, offerEvaluationSummary } from '@/lib/offer-display';

interface LiteReportDashboardProps {
  report: LiteReport;
  /** Snapshot UI is English-only per product direction */
  language?: 'en';
  onNewAnalysis?: () => void;
  embedded?: boolean;
}

/**
 * Job Fit Snapshot — single English page.
 * Dual heroes only: Fit Score (named Beagle tier) + Expected Offer.
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
  const [checkoutBusy, setCheckoutBusy] = React.useState(false);

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

  const handleUpgrade = async () => {
    setCheckoutBusy(true);
    await startCheckout('single_interview_strategy_guide');
    setCheckoutBusy(false);
  };

  return (
    <div className={`animate-fade-in ${embedded ? 'space-y-4 p-4' : 'space-y-5'}`}>
      {!embedded && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

      {/* Header */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-4 shadow-xl backdrop-blur-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 mb-1">
          Job Fit Snapshot
        </p>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
          <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
          {report.job_title || 'Unknown Role'}
        </h1>
        <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 shrink-0" />
          {report.company_name || 'Unknown Company'}
        </p>
      </div>

      {/* Dual heroes — Fit + Offer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 flex flex-col shadow-xl backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 mb-3">
            Candidate Fit Score
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-center shrink-0">
              <BeagleIcon
                className={`w-20 h-20 sm:w-24 sm:h-24 ${scoreInfo.glowClass}`}
                color={scoreInfo.fill}
                spotColor={scoreInfo.spotColor}
              />
            </div>
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
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
              <p className={`text-xl sm:text-2xl font-black leading-tight ${scoreInfo.color}`}>
                {scoreInfo.level}
              </p>
              <p className="text-sm font-semibold text-slate-200 mt-1">{scoreInfo.label}</p>
            </div>
          </div>

          {/* Comprehensive score summary under the Beagle + score */}
          <div className="mt-4 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-1.5">
              Score Summary
            </p>
            <p className={`text-sm font-bold ${scoreInfo.color} mb-1.5`}>
              {score}/100 · {scoreInfo.level}
              {report.fit_score?.band ? ` · ${report.fit_score.band}` : ''}
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">
              {report.fit_score?.sharp_verdict
                || report.recruiter_verdict
                || report.one_sentence_sharp_critique
                || scoreInfo.description}
            </p>
            {report.apply_decision?.label && (
              <p className="text-xs text-slate-400 mt-2">
                Bottom line:{' '}
                <span className="font-semibold text-slate-200">{report.apply_decision.label}</span>
                {report.apply_decision.reason
                  ? ` — ${report.apply_decision.reason}`
                  : ''}
              </p>
            )}
            {report.apply_decision?.next_best_action && (
              <p className="text-xs text-slate-500 mt-1">
                Next: {report.apply_decision.next_best_action}
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 flex flex-col shadow-xl backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/90 mb-1 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Expected Offer Range
          </p>
          <p className="text-[11px] text-slate-500 mb-3">
            {[offer?.region, offer?.currency].filter(Boolean).join(' · ') || 'USD'}
            {offer?.evidence_tier ? ` · Tier ${offer.evidence_tier}` : ''}
          </p>

          <div className="flex-1 flex flex-col justify-center py-2">
            {offerRange ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/90 mb-1.5">
                  Expected range
                </p>
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {offerRange}
                </p>
                {offer?.candidate_position_label && (
                  <p className="text-sm text-emerald-100/90 leading-relaxed mt-2">
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

          {/* Aligns with Score Summary on the left */}
          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1.5">
              Range Evaluation
            </p>
            <p className="text-sm font-bold text-emerald-100 mb-1.5">{offerEval.headline}</p>
            <p className="text-sm text-slate-200 leading-relaxed">{offerEval.basis}</p>
            {offerEval.detail && (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{offerEval.detail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Strengths / Gaps — compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-xl">
          <h3 className="text-xs font-bold text-emerald-400 mb-3 flex items-center uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Top Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.map((item, idx) => (
              <li key={idx}>
                <p className="text-sm font-semibold text-slate-200">{item.point}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-xl">
          <h3 className="text-xs font-bold text-violet-300 mb-3 flex items-center uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            Critical Gaps
          </h3>
          <ul className="space-y-2">
            {gaps.map((item, idx) => (
              <li key={idx}>
                <p className="text-sm font-semibold text-slate-200">{item.gap}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!embedded && (
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/80 to-indigo-950/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div>
            <p className="font-bold text-white flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Need interview strategy?
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Upgrade for hiring context, concerns & defenses, interview playbook, and offer strategy.
            </p>
          </div>
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={handleUpgrade}
            className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/10"
          >
            {checkoutBusy ? '…' : 'Interview Strategy Guide · $9.99'}
          </button>
        </div>
      )}
    </div>
  );
}
