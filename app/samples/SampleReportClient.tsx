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
  REPORT_ACTION_BTN,
  REPORT_ACTION_TEXT,
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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <BrandLogo size="sm" showIcon />
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <ReportCompareModal language="en" variant="button" />
          <Link
            href={`/samples?type=${REPORT_CODES.JOB_FIT_SNAPSHOT}`}
            className={`inline-flex items-center rounded-lg px-3.5 py-2.5 ${REPORT_ACTION_TEXT} border transition-colors ${
              !isGuide
                ? 'border-violet-500 bg-violet-500/15 text-violet-100'
                : 'border-slate-400 text-slate-200 hover:bg-slate-800 hover:border-slate-300'
            }`}
          >
            Snapshot sample
          </Link>
          <Link
            href={`/samples?type=${REPORT_CODES.INTERVIEW_STRATEGY_GUIDE}`}
            className={`inline-flex items-center rounded-lg px-3.5 py-2.5 ${REPORT_ACTION_TEXT} border transition-colors ${
              isGuide
                ? 'border-violet-500 bg-violet-500/15 text-violet-100'
                : 'border-slate-400 text-slate-200 hover:bg-slate-800 hover:border-slate-300'
            }`}
          >
            Guide sample
          </Link>
        </div>
      </header>

      <main className="px-2 sm:px-4 py-4 sm:py-5 min-w-0 overflow-x-auto">
        <ReportFitStage className="mx-auto w-full max-w-[98vw] min-w-0">
          {/*
            Narrow: stack (actions → notice → report).
            Wide (xl+): 2×2 side-by-side so report keeps enough width.
          */}
          <div
            className="flex flex-col gap-3 xl:grid xl:gap-x-5 xl:gap-y-2 xl:items-start min-w-0"
            style={{
              gridTemplateColumns: 'minmax(0,16rem) minmax(0,1fr)',
              gridTemplateRows: 'auto auto',
              gridTemplateAreas: `
                "actions mark"
                "notice report"
              `,
            }}
          >
            <div
              className="grid grid-cols-2 gap-2 w-full sm:w-auto"
              style={{ gridArea: 'actions' }}
            >
              <button
                type="button"
                onClick={goHome}
                className={`${REPORT_ACTION_BTN} w-full justify-center whitespace-nowrap`}
              >
                <Home className={REPORT_ACTION_ICON} />
                Back to Home
              </button>
              <button
                type="button"
                onClick={goHome}
                className={`${REPORT_ACTION_BTN} w-full justify-center whitespace-nowrap`}
              >
                <RotateCcw className={REPORT_ACTION_ICON} />
                New Analysis
              </button>
            </div>

            <div
              className="hidden xl:flex items-end justify-center pb-0.5 min-w-0"
              style={{ gridArea: 'mark' }}
            >
              <SampleMark />
            </div>

            <div
              className={`${SAMPLE_NOTICE_SURFACE} w-full min-w-0 px-5 py-5 flex flex-col gap-3.5`}
              style={{ gridArea: 'notice' }}
            >
              <SampleMark variant="notice" />
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
                  <ReportCompareModal
                    language="en"
                    className="mt-2.5 text-white hover:text-blue-50"
                  />
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

            <div className="min-w-0 w-full" style={{ gridArea: 'report' }}>
              {/* isSample=false: SAMPLE mark is rendered in the grid above the frame */}
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
            </div>
          </div>
        </ReportFitStage>
      </main>
    </div>
  );
}
