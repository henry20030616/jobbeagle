'use client';

import React from 'react';
import type { LiteReport } from '@/types';
import { Shield, DollarSign, Target } from 'lucide-react';

interface LiteReportDashboardProps {
  report: LiteReport;
}

export default function LiteReportDashboard({ report }: LiteReportDashboardProps) {
  const scoreColor =
    report.match_score >= 75
      ? 'text-emerald-400'
      : report.match_score >= 60
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Lite Snapshot</h2>
        <span className={`text-3xl font-black ${scoreColor}`}>{report.match_score}</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Archetype</p>
            <p className="font-semibold">{report.dog_breed_archetype}</p>
          </div>
        </div>

        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-xs text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Target className="w-4 h-4" /> Sharp Critique
          </p>
          <p className="text-sm leading-relaxed">{report.one_sentence_sharp_critique}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">FLSA Status</p>
          <p className="text-sm font-medium">{report.flsa_status}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <DollarSign className="w-4 h-4" /> Radford 2026 Compensation Matrix
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-slate-500 mb-1">25th</p>
              <p className="font-medium">{report.radford_2026_compensation_matrix.tier_25th_low}</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-slate-500 mb-1">50th</p>
              <p className="font-semibold">{report.radford_2026_compensation_matrix.tier_50th_mid}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-slate-500 mb-1">75th</p>
              <p className="font-medium">{report.radford_2026_compensation_matrix.tier_75th_high}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 border-t border-white/10 pt-4">
          Lite reports use JD + resume only — no live web intel. Upgrade to Full for Blind/Glassdoor
          grounding and interview bank.
        </p>
      </div>
    </div>
  );
}
