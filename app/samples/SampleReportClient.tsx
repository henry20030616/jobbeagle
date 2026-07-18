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

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-5">
          {/* Sample notice — left of the one-page slide */}
          <aside className="lg:w-56 xl:w-60 shrink-0 lg:sticky lg:top-6">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-4 h-full">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-indigo-100 leading-snug">
                    Sample {isGuide ? 'Interview Strategy Guide' : 'Job Fit Snapshot'}
                  </p>
                  <p className="text-xs text-indigo-200/70 mt-2 leading-relaxed">
                    Fictional candidate & role for product preview — not saved to your account, no
                    credits used.
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to analyze
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
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
          </div>
        </div>
      </main>
    </div>
  );
}
