'use client';

import React from 'react';
import type { GuideResumeRewrite, LiteReport } from '@/types';
import {
  Home,
  RotateCcw,
  Building2,
  Briefcase,
  CalendarDays,
} from 'lucide-react';
import {
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
  REPORT_SHELL_WIDTH,
  REPORT_SLIDE_SURFACE,
} from '@/constants/report-frame';
import { SampleMark } from '@/components/SampleMark';
import { SnapshotItemStack } from '@/components/report/SevenItemPages';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';
import { getSnapshotUiCopy } from '@/lib/report-ui-copy';
import { formatJobSourceDate } from '@/lib/job-source';

const SECTION_TITLE = 'text-lg font-bold uppercase tracking-[0.14em]';
const BODY = 'text-lg';

interface LiteReportDashboardProps {
  report: LiteReport;
  language?: AppLanguage | string;
  onNewAnalysis?: () => void;
  embedded?: boolean;
  isSample?: boolean;
  /** Snapshot is items 1–3 with upgrade locks. Guide pages render items separately. */
  edition?: 'snapshot' | 'guide';
  rewrites?: GuideResumeRewrite[];
}

/**
 * Fit Snapshot — one slide, three sections: role core, fit and resume, market band.
 */
export default function LiteReportDashboard({
  report,
  language = 'en',
  onNewAnalysis,
  embedded = false,
  isSample = false,
  edition = 'snapshot',
  rewrites = [],
}: LiteReportDashboardProps) {
  const lang = normalizeReportLanguage(language);
  const t = getSnapshotUiCopy(lang);
  const locked = edition === 'snapshot';

  const handleBack = () => {
    if (onNewAnalysis) {
      onNewAnalysis();
      return;
    }
    window.location.href = '/';
  };

  return (
    <div
      className={`animate-fade-in w-full min-w-0 mx-auto ${
        embedded ? '' : `${REPORT_SHELL_WIDTH} space-y-4`
      }`}
    >
      {!embedded && (
        <div className="no-print flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <Home className={REPORT_ACTION_ICON} />
            {t.backHome}
          </button>
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <RotateCcw className={REPORT_ACTION_ICON} />
            {t.newAnalysis}
          </button>
        </div>
      )}

      <article
        className={`relative w-full min-w-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 ${REPORT_SLIDE_SURFACE}`}
      >
        <header className="border-b border-slate-700/90 px-5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`${SECTION_TITLE} text-sky-400 mb-1`}>{t.productTitle}</p>
              <h1 className="text-4xl font-black text-white flex items-center gap-2 flex-wrap leading-tight">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
                {report.job_title || t.unknownRole}
              </h1>
              <dl className={`mt-2 space-y-1 ${BODY}`}>
                <div className="flex items-center gap-2 text-slate-300">
                  <Building2 className="w-5 h-5 shrink-0 text-slate-500" aria-hidden />
                  <dt className="sr-only">{t.company}</dt>
                  <dd>
                    <span className="text-slate-500 text-base font-semibold uppercase tracking-wide mr-2">
                      {t.company}
                    </span>
                    {report.company_name || t.unknownCompany}
                  </dd>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CalendarDays className="w-5 h-5 shrink-0 text-slate-500" aria-hidden />
                  <dt className="sr-only">{t.posted}</dt>
                  <dd>
                    <span className="text-slate-500 text-base font-semibold uppercase tracking-wide mr-2">
                      {t.posted}
                    </span>
                    {formatJobSourceDate(report.job_source, report.job_posted_date)}
                  </dd>
                </div>
              </dl>
            </div>
            {isSample ? <SampleMark /> : null}
          </div>
        </header>

        <SnapshotItemStack
          report={report}
          language={lang}
          locked={locked}
          rewrites={rewrites}
        />
      </article>
    </div>
  );
}
