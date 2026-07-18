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
import { SAMPLE_NOTICE_SURFACE } from '@/constants/report-frame';
import { ArrowLeft, Home, RotateCcw, Sparkles } from 'lucide-react';

const actionBtnClass =
  'inline-flex items-center gap-2 rounded-xl border border-slate-500/50 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 hover:border-slate-400/60 transition-colors';

export default function SampleReportClient() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type') || REPORT_CODES.JOB_FIT_SNAPSHOT;
  const reportType =
    normalizeReportType(rawType) ?? REPORT_CODES.JOB_FIT_SNAPSHOT;
  const isGuide = reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE;

  const snapshot = useMemo(() => getSampleSnapshotReport(), []);
  const guide = useMemo(() => getSampleStrategyGuideReport(), []);

  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Absolute top — above logo / Sample / report */}
      <div className="border-b border-slate-800/80 bg-slate-950 px-4 sm:px-6 py-3">
        <div className="mx-auto w-full max-w-5xl flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" onClick={goHome} className={actionBtnClass}>
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button type="button" onClick={goHome} className={actionBtnClass}>
            <RotateCcw className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      </div>

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

      <main className="px-4 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <div
            className={`${SAMPLE_NOTICE_SURFACE} px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5`}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Sample {isGuide ? 'Interview Strategy Guide' : 'Job Fit Snapshot'}
            </span>
            <span className="text-[11px] text-slate-500">
              Preview only — not saved, no credits used
            </span>
            <Link
              href="/"
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to analyze
            </Link>
          </div>

          {isGuide ? (
            <FullReportDashboard report={guide} language="en" embedded onNewAnalysis={goHome} />
          ) : (
            <LiteReportDashboard report={snapshot} language="en" embedded onNewAnalysis={goHome} />
          )}
        </div>
      </main>
    </div>
  );
}
