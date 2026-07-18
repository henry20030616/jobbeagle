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

      <main className="px-4 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <div className="rounded-2xl border-2 border-indigo-300/70 bg-indigo-800 px-5 py-4 shadow-[0_0_40px_-10px_rgba(129,140,248,0.65)] flex flex-wrap items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/45 border border-indigo-200/50">
              <Sparkles className="w-5 h-5 text-indigo-50" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-white leading-snug">
                Sample {isGuide ? 'Interview Strategy Guide' : 'Job Fit Snapshot'}
              </p>
              <p className="text-sm text-indigo-50/90 mt-1 leading-relaxed">
                Fictional candidate & role for product preview — not saved to your account, no
                credits used.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-indigo-100 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
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
        </div>
      </main>
    </div>
  );
}
