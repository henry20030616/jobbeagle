'use client';

import React from 'react';
import type { FullReport } from '@/types';
import { AlertTriangle, Users, MessageSquare, HandCoins } from 'lucide-react';

interface FullReportDashboardProps {
  report: FullReport;
}

export default function FullReportDashboard({ report }: FullReportDashboardProps) {
  return (
    <div className="rounded-2xl border border-violet-500/30 bg-slate-900/80 overflow-hidden">
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          Full Intel Report
          <span className="text-xs font-normal text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
            Live Grounding
          </span>
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {report.online_intel_warning && (
          <div className="rounded-xl bg-red-600/20 border border-red-500/40 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-xs text-red-300 uppercase tracking-wider mb-1">Intel Warning</p>
              <p className="text-sm">{report.online_intel_warning}</p>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Users className="w-4 h-4" /> Culture Blackbox
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {report.corporate_culture_blackbox}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <MessageSquare className="w-4 h-4" /> STAR Interview Bank (10)
          </p>
          <ol className="space-y-3">
            {report.custom_star_interview_bank.map((q, i) => (
              <li
                key={i}
                className="text-sm rounded-lg bg-white/5 border border-white/10 px-4 py-3"
              >
                <span className="text-violet-400 font-mono text-xs mr-2">Q{i + 1}</span>
                {q}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <HandCoins className="w-4 h-4" /> Salary Negotiation Script
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            {report.salary_negotiation_script}
          </p>
        </div>
      </div>
    </div>
  );
}
