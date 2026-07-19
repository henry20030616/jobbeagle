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
  SAMPLE_HEADER_ICON,
  HOME_DESIGN_WIDTH,
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

  const sampleTabClass = (active: boolean) =>
    `${SAMPLE_HEADER_BTN} w-full justify-center ${
      active
        ? 'border-violet-500 bg-violet-500/15 text-violet-100'
        : 'border-slate-400 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:border-slate-300'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <ReportFitStage
        designWidth={HOME_DESIGN_WIDTH}
        maxScale={1.85}
        className="w-full"
      >
        <div className="w-full flex flex-col min-h-[100vh]">
          {/* Top: logo left · Back to Home / New Analysis top-right */}
          <header className="border-b border-slate-800 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <BrandLogo size="nav" showIcon />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goHome}
                className={`${SAMPLE_HEADER_BTN} border-slate-400 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:border-slate-300 whitespace-nowrap`}
              >
                <Home className={SAMPLE_HEADER_ICON} />
                Back to Home
              </button>
              <button
                type="button"
                onClick={goHome}
                className={`${SAMPLE_HEADER_BTN} border-slate-400 bg-slate-900/80 text-slate-100 hover:bg-slate-800 hover:border-slate-300 whitespace-nowrap`}
              >
                <RotateCcw className={SAMPLE_HEADER_ICON} />
                New Analysis
              </button>
            </div>
          </header>

          <main className="flex-1 w-full px-4 py-4 flex flex-col gap-4">
            {/*
              Left: SAMPLE notice
              Right: Snapshot | Guide on top row; Compare full-width below (= both tabs combined)
              items-stretch → left & right columns same height
            */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
              <div
                className={`${SAMPLE_NOTICE_SURFACE} flex-1 min-w-0 px-5 py-3.5 flex flex-wrap items-center gap-3 content-center`}
              >
                <SampleMark variant="notice" />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 border border-blue-950/40">
                  <Sparkles className="w-5 h-5 text-white" />
                </span>
                <p className="text-xl font-bold text-white leading-snug">
                  {isGuide ? 'Guide' : 'Snapshot'} sample · no credits
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xl font-bold text-white hover:text-blue-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Analyze
                </Link>
              </div>

              <div className="shrink-0 w-full sm:w-auto sm:min-w-[28rem] grid grid-cols-2 gap-3 self-stretch">
                <Link
                  href={`/samples?type=${REPORT_CODES.JOB_FIT_SNAPSHOT}`}
                  className={sampleTabClass(!isGuide)}
                >
                  Snapshot sample
                </Link>
                <Link
                  href={`/samples?type=${REPORT_CODES.INTERVIEW_STRATEGY_GUIDE}`}
                  className={sampleTabClass(isGuide)}
                >
                  Guide sample
                </Link>
                <div className="col-span-2">
                  <ReportCompareModal
                    language="en"
                    variant="button"
                    className="w-full justify-center"
                  />
                </div>
              </div>
            </div>

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
          </main>
        </div>
      </ReportFitStage>
    </div>
  );
}
