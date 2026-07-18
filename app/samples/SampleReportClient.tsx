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
import { SAMPLE_NOTICE_SURFACE, REPORT_ACTION_BTN } from '@/constants/report-frame';
import { SampleMark } from '@/components/SampleMark';
import { ArrowLeft, Home, RotateCcw, Sparkles } from 'lucide-react';

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
        <div className="mx-auto w-full max-w-7xl">
          {/*
            Left column: actions (same width as Sample) + Sample box
            Right column: report — tops of actions & report aligned
          */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <aside className="w-full sm:w-64 lg:w-72 shrink-0 flex flex-col gap-3">
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={goHome}
                  className={`${REPORT_ACTION_BTN} w-full justify-center whitespace-nowrap px-3`}
                >
                  <Home className="w-3.5 h-3.5 shrink-0" />
                  Back to Home
                </button>
                <button
                  type="button"
                  onClick={goHome}
                  className={`${REPORT_ACTION_BTN} w-full justify-center whitespace-nowrap px-3`}
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  New Analysis
                </button>
              </div>

              <div className={`${SAMPLE_NOTICE_SURFACE} w-full px-5 py-5 flex flex-col gap-3.5`}>
                <SampleMark className="text-white/35" />
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15 border border-blue-950/40">
                    <Sparkles className="w-5 h-5 text-white" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg font-bold text-white leading-snug">
                      {isGuide ? 'Interview Strategy Guide' : 'Job Fit Snapshot'}
                    </p>
                    <p className="text-sm text-blue-50/95 mt-2 leading-relaxed">
                      Fictional candidate & role for product preview — not saved, no credits used.
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-blue-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to analyze
                </Link>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {isGuide ? (
                <FullReportDashboard
                  report={guide}
                  language="en"
                  embedded
                  isSample
                  onNewAnalysis={goHome}
                />
              ) : (
                <LiteReportDashboard
                  report={snapshot}
                  language="en"
                  embedded
                  isSample
                  onNewAnalysis={goHome}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
