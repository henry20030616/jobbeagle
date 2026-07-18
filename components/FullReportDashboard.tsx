'use client';

import React from 'react';
import type { FullReport } from '@/types';
import {
  AlertTriangle,
  MessageSquare,
  HandCoins,
  Globe,
  Layers,
  ShieldAlert,
  Crosshair,
  HelpCircle,
} from 'lucide-react';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import type { AppLanguage } from '@/lib/language-context';

interface FullReportDashboardProps {
  report: FullReport;
  embedded?: boolean;
  language?: AppLanguage;
  onNewAnalysis?: () => void;
}

export default function FullReportDashboard({
  report,
  embedded = false,
  language = 'en',
  onNewAnalysis,
}: FullReportDashboardProps) {
  const playbook = report.interview_playbook;
  const concerns = report.concerns_defenses ?? [];
  const hiring = report.hiring_context;
  const offer = report.offer_strategy;
  const fitSalary = report.strategy_fit_salary;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/25 overflow-hidden">
        <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-5 py-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-300" />
          <p className="text-sm font-semibold text-indigo-100">Includes Job Fit Snapshot</p>
          <span className="text-[11px] text-indigo-300/80 ml-auto">
            Fit · Offer · Hard Filter · Apply Decision
          </span>
        </div>
        <LiteReportDashboard
          report={report}
          language="en"
          embedded
          onNewAnalysis={onNewAnalysis}
        />
      </div>

      <div
        className={`rounded-2xl border border-violet-500/30 bg-slate-900/80 overflow-hidden ${
          embedded ? '' : 'shadow-xl'
        }`}
      >
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Globe className="w-5 h-5 text-violet-400" />
            Interview Strategy Guide
          </h2>
          <span className="text-xs font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 rounded-full shrink-0">
            Pro strategy layer
          </span>
        </div>

        <div className="p-6 space-y-6">
          {fitSalary && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1 font-bold">
                <Crosshair className="w-4 h-4 text-yellow-400" />
                Fit & Salary — Decision Deep
              </p>
              <p className="text-sm text-slate-300 leading-relaxed mb-2">
                {fitSalary.score_implications}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {fitSalary.offer_implications}
              </p>
              {(fitSalary.validate_with_recruiter?.length ?? 0) > 0 && (
                <ul className="space-y-1">
                  {fitSalary.validate_with_recruiter.map((q, i) => (
                    <li key={i} className="text-sm text-slate-400">
                      · {q}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1 font-bold">
              <Globe className="w-4 h-4 text-indigo-400" />
              Hiring Context
            </p>
            {(hiring?.insights?.length ?? 0) > 0 ? (
              <ul className="space-y-4 mb-4">
                {hiring!.insights.map((ins, i) => (
                  <li key={i} className="rounded-lg bg-slate-900/50 border border-white/10 p-4">
                    <p className="text-sm font-semibold text-slate-100">{ins.claim}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ins.why_it_matters}</p>
                    {(ins.source_url || ins.date) && (
                      <p className="text-[11px] text-indigo-300/80 mt-2">
                        {ins.date ? `${ins.date} · ` : ''}
                        {ins.source_url ? (
                          <a
                            href={ins.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2"
                          >
                            source
                          </a>
                        ) : null}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-100 mb-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                Limited public hiring-context signals — use validation questions below.
              </div>
            )}
            {(hiring?.limitations?.length ?? 0) > 0 && (
              <ul className="mb-3 space-y-1">
                {hiring!.limitations.map((l, i) => (
                  <li key={i} className="text-xs text-slate-500">
                    · {l}
                  </li>
                ))}
              </ul>
            )}
            {(hiring?.validation_questions?.length ?? 0) > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Validate with recruiter
                </p>
                <ul className="space-y-1">
                  {hiring!.validation_questions.map((q, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      · {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!hiring && report.corporate_culture_blackbox && (
              <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                {report.corporate_culture_blackbox}
              </p>
            )}
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Concerns & Defenses (3)
            </p>
            <div className="space-y-4">
              {concerns.map((c, i) => (
                <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-bold text-amber-100 mb-1">
                    {i + 1}. {c.concern}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">{c.why}</p>
                  {c.evidence && (
                    <p className="text-xs text-slate-300 mb-1">
                      <span className="font-semibold text-slate-400">Evidence: </span>
                      {c.evidence}
                    </p>
                  )}
                  {c.missing_proof && (
                    <p className="text-xs text-slate-300 mb-1">
                      <span className="font-semibold text-slate-400">Missing: </span>
                      {c.missing_proof}
                    </p>
                  )}
                  <p className="text-sm text-slate-200 mt-2 leading-relaxed">{c.answer_guide}</p>
                  {c.do_not_claim && (
                    <p className="text-xs text-red-300/90 mt-2">Do not claim: {c.do_not_claim}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1 font-bold">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              Interview Playbook
            </p>

            {(playbook?.reported?.length ?? 0) > 0 && (
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-400/90 mb-2">
                  Reported (cited)
                </p>
                <ol className="space-y-3">
                  {playbook!.reported.map((q, i) => (
                    <li
                      key={i}
                      className="text-sm rounded-lg bg-slate-900/50 border border-emerald-500/20 px-4 py-3 text-slate-300"
                    >
                      <p className="leading-relaxed">{q.question}</p>
                      {(q.source_url || q.source_date) && (
                        <p className="text-[11px] text-emerald-300/80 mt-1">
                          {q.source_date ? `${q.source_date} · ` : ''}
                          {q.source_url ? (
                            <a
                              href={q.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              source
                            </a>
                          ) : null}
                        </p>
                      )}
                      {q.star_outline && (
                        <p className="text-xs text-slate-500 mt-2">{q.star_outline}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300/90 mb-2">
                Predicted
              </p>
              <ol className="space-y-3">
                {(playbook?.predicted?.length
                  ? playbook.predicted
                  : (report.custom_star_interview_bank || []).map((question) => ({
                      question,
                      predicted: true as const,
                    }))
                ).map((q, i) => (
                  <li
                    key={i}
                    className="text-sm rounded-lg bg-slate-900/50 border border-white/10 px-4 py-3 text-slate-300 leading-relaxed"
                  >
                    <span className="text-violet-400 font-mono text-xs font-bold mr-2">P{i + 1}</span>
                    {q.question}
                    {'star_outline' in q && q.star_outline ? (
                      <p className="text-xs text-slate-500 mt-2">{q.star_outline}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            {(playbook?.reverse_questions?.length ?? 0) > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Reverse questions
                </p>
                <ul className="space-y-1">
                  {playbook!.reverse_questions.map((q, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      · {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(playbook?.validate_before_join?.length ?? 0) > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Validate before join
                </p>
                <ul className="space-y-1">
                  {playbook!.validate_before_join.map((q, i) => (
                    <li key={i} className="text-sm text-slate-400">
                      · {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {offer && (
            <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-5">
              <p className="text-xs text-emerald-400/90 uppercase tracking-wider mb-3 flex items-center gap-1 font-bold">
                <HandCoins className="w-4 h-4" />
                Offer Strategy
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-slate-500 mb-1">Target</p>
                  <p className="text-slate-100">{offer.target || '—'}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-slate-500 mb-1">Acceptable</p>
                  <p className="text-slate-100">{offer.acceptable || '—'}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[11px] text-slate-500 mb-1">Walk away</p>
                  <p className="text-slate-100">{offer.walk_away || '—'}</p>
                </div>
              </div>
              {(offer.levers?.length ?? 0) > 0 && (
                <p className="text-xs text-slate-400 mb-3">
                  Levers: {offer.levers.join(' · ')}
                </p>
              )}
              {offer.script && (
                <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap mb-3">
                  {offer.script}
                </p>
              )}
              {(offer.discovery_questions?.length ?? 0) > 0 && (
                <ul className="space-y-1">
                  {offer.discovery_questions.map((q, i) => (
                    <li key={i} className="text-sm text-emerald-100/80">
                      · {q}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!offer && report.salary_negotiation_script && (
            <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-5">
              <p className="text-xs text-emerald-400/90 uppercase tracking-wider mb-3 flex items-center gap-1 font-bold">
                <HandCoins className="w-4 h-4" />
                Salary Negotiation Script
              </p>
              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                {report.salary_negotiation_script}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
