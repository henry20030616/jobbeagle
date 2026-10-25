'use client';

import React from 'react';
import type { GuideResumeRewrite, LiteReport } from '@/types';
import {
  Home,
  RotateCcw,
} from 'lucide-react';
import {
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
  REPORT_SHELL_WIDTH,
  REPORT_SLIDE_SURFACE,
} from '@/constants/report-frame';
import { ReportJobHeader } from '@/components/report/ReportJobHeader';
import { SnapshotItemStack } from '@/components/report/SevenItemPages';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';
import { getSnapshotUiCopy } from '@/lib/report-ui-copy';

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
 * Fit Snapshot — one slide: fit analysis, market band, role core, then resume advice.
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
        className={`relative w-full min-w-0 overflow-visible bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 ${REPORT_SLIDE_SURFACE}`}
      >
        <ReportJobHeader
          productTitle={t.productTitle}
          report={report}
          language={lang}
          isSample={isSample}
        />

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
