'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import { REPORT_CODES, normalizeReportType } from '@/constants/report-products';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function SampleReportClient() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type') || REPORT_CODES.JOB_FIT_SNAPSHOT;
  const reportType =
    normalizeReportType(rawType) ?? REPORT_CODES.JOB_FIT_SNAPSHOT;
  const isGuide = reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE;

  const snapshot = useMemo(() => getSampleSnapshotReport(), []);
  const guide = useMemo(() => getSampleStrategyGuideReport(), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <BrandLogo size="inline" />
        <div className="flex items-center gap-2">
          <Link
            href={`/samples?type=${REPORT_CODES.JOB_FIT_SNAPSHOT}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
              !isGuide
                ? 'border-violet-500 bg-violet-500/15 text-violet-100'
                : 'border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Snapshot sample
          </Link>
          <Link
            href={`/samples?type=${REPORT_CODES.INTERVIEW_STRATEGY_GUIDE}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${
              isGuide
                ? 'border-violet-500 bg-violet-500/15 text-violet-100'
                : 'border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Guide sample
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-3">
        {/* Compact sample chip — not a left rail */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-indigo-200/80">
          <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Sample {isGuide ? 'Guide' : 'Snapshot'}
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden>
            ·
          </span>
          <span className="text-slate-500">
            Preview only — not saved, no credits used
          </span>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to analyze
          </Link>
        </div>

        {isGuide ? (
          <FullReportDashboard
            report={guide}
            language="en"
            onNewAnalysis={() => {
              window.location.href = '/';
            }}
          />
        ) : (
          <LiteReportDashboard
            report={snapshot}
            language="en"
            onNewAnalysis={() => {
              window.location.href = '/';
            }}
          />
        )}
      </main>
    </div>
  );
}
