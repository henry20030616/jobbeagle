'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import { ReportFitStage } from '@/components/ReportFitStage';
import {
  getSampleSnapshotReport,
  getSampleStrategyGuideReport,
} from '@/lib/sample-reports';
import { REPORT_CODES, normalizeReportType } from '@/constants/report-products';
import {
  SAMPLE_NOTICE_SURFACE,
  SAMPLE_HEADER_BTN,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
} from '@/constants/report-frame';
import { SampleMark } from '@/components/SampleMark';
import ReportCompareModal from '@/components/ReportCompareModal';
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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="border-b border-slate-800 px-4 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <BrandLogo size="nav" showIcon />
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <ReportCompareModal language="en" variant="button" />
          <Link
            href={`/samples?type=${REPORT_CODES.JOB_FIT_SNAPSHOT}`}
            className={`${SAMPLE_HEADER_BTN} ${
              !isGuide
                ? 'border-violet-500 bg-violet-500/15 text-violet-100'
                : 'border-slate-400 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:border-slate-300'
            }`}
          >
            Snapshot sample
          </Link>
          <Link
            href={`/samples?type=${REPORT_CODES.INTERVIEW_STRATEGY_GUIDE}`}
            className={`${SAMPLE_HEADER_BTN} ${
              isGuide
                ? 'border-violet-500 bg-violet-500/15 text-violet-100'
                : 'border-slate-400 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:border-slate-300'
            }`}
          >
            Guide sample
          </Link>
        </div>
      </header>

      {/* Stretch full width — do NOT items-center (that shrink-wraps the stage to 1280px). */}
      <main className="flex-1 min-h-0 w-full px-2 sm:px-4 py-3 flex flex-col items-stretch gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
          <button
            type="button"
            onClick={goHome}
            className={`${REPORT_ACTION_BTN} whitespace-nowrap`}
          >
            <Home className={REPORT_ACTION_ICON} />
            Back to Home
          </button>
          <button
            type="button"
            onClick={goHome}
            className={`${REPORT_ACTION_BTN} whitespace-nowrap`}
          >
            <RotateCcw className={REPORT_ACTION_ICON} />
            New Analysis
          </button>
          <div
            className={`${SAMPLE_NOTICE_SURFACE} px-3 py-2 flex flex-wrap items-center gap-2.5`}
          >
            <SampleMark variant="notice" />
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 border border-blue-950/40">
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            <p className="text-sm font-bold text-white leading-snug">
              {isGuide ? 'Guide' : 'Snapshot'} sample · no credits
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-blue-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Analyze
            </Link>
          </div>
        </div>

        <ReportFitStage className="w-full flex-1 min-h-0">
          {isGuide ? (
            <FullReportDashboard
              report={guide}
              language="en"
              embedded
              isSample={false}
              onNewAnalysis={goHome}
            />
          ) : (
            <LiteReportDashboard
              report={snapshot}
              language="en"
              embedded
              isSample={false}
              onNewAnalysis={goHome}
            />
          )}
        </ReportFitStage>
      </main>
    </div>
  );
}
