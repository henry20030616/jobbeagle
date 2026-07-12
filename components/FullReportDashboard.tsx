'use client';

import React from 'react';
import type { FullReport } from '@/types';
import {
  AlertTriangle,
  Users,
  MessageSquare,
  HandCoins,
  Globe,
  Layers,
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
  return (
    <div className="space-y-6">
      {/* Complete Job Fit Snapshot first */}
      <div className="rounded-2xl border border-indigo-500/25 overflow-hidden">
        <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-5 py-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-300" />
          <p className="text-sm font-semibold text-indigo-100">
            Includes Job Fit Snapshot
          </p>
          <span className="text-[11px] text-indigo-300/80 ml-auto">
            Match · Comp · Gaps · Starters
          </span>
        </div>
        <LiteReportDashboard
          report={report}
          language={language}
          embedded
          onNewAnalysis={onNewAnalysis}
        />
      </div>

      {/* Live strategy layer */}
      <div
        className={`rounded-2xl border border-violet-500/30 bg-slate-900/80 overflow-hidden ${
          embedded ? '' : 'shadow-xl'
        }`}
      >
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Globe className="w-5 h-5 text-violet-400" />
            Interview Strategy Guide — Live Intel
          </h2>
          <span className="text-xs font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 rounded-full shrink-0">
            Blind · Glassdoor · Reddit
          </span>
        </div>

        <div className="p-6 space-y-6">
          {report.online_intel_warning ? (
            <div className="rounded-xl bg-red-600/20 border border-red-500/40 p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-red-300 uppercase tracking-wider mb-1 font-bold">
                  Live Intel Warning
                </p>
                <p className="text-sm text-red-100/90 leading-relaxed">
                  {report.online_intel_warning}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-200">
              No critical layoff / ghost-job red flags detected in live grounding.
            </div>
          )}

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1 font-bold">
              <Users className="w-4 h-4 text-indigo-400" />
              Culture Blackbox
            </p>
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
              {report.corporate_culture_blackbox}
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1 font-bold">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              STAR Interview Bank (10)
            </p>
            <ol className="space-y-3">
              {(report.custom_star_interview_bank || []).map((q, i) => (
                <li
                  key={i}
                  className="text-sm rounded-lg bg-slate-900/50 border border-white/10 px-4 py-3 text-slate-300 leading-relaxed"
                >
                  <span className="text-violet-400 font-mono text-xs font-bold mr-2">
                    Q{i + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-5">
            <p className="text-xs text-emerald-400/90 uppercase tracking-wider mb-3 flex items-center gap-1 font-bold">
              <HandCoins className="w-4 h-4" />
              Salary Negotiation Script
            </p>
            <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
              {report.salary_negotiation_script}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
