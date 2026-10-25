'use client';

import React, { useMemo, useState } from 'react';
import type { FullReport } from '@/types';
import { Home, RotateCcw } from 'lucide-react';
import { GuideItemPage, guideItemNav, type GuideItemId } from '@/components/report/SevenItemPages';
import { ReportJobHeader } from '@/components/report/ReportJobHeader';
import type { AppLanguage } from '@/lib/language-context';
import { normalizeReportLanguage } from '@/lib/report-language';
import { getGuideUiCopy } from '@/lib/report-ui-copy';
import {
  REPORT_SLIDE_SURFACE,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
  REPORT_GUIDE_TAB_TYPE,
  REPORT_GUIDE_TAB_GAP,
  REPORT_SHELL_WIDTH,
} from '@/constants/report-frame';

type GuideTab = GuideItemId;

interface FullReportDashboardProps {
  report: FullReport;
  embedded?: boolean;
  language?: AppLanguage | string;
  onNewAnalysis?: () => void;
  /** Show large SAMPLE mark at top of the Guide frame (sample preview pages) */
  isSample?: boolean;
  /** Controlled page when the parent owns the left rail (live /report). */
  activeItem?: GuideItemId;
  onItemChange?: (id: GuideItemId) => void;
  /** Hide in-slide chips when pages are switched from the shared left rail. */
  hideInnerNav?: boolean;
}

export default function FullReportDashboard({
  report,
  embedded = false,
  language = 'en',
  onNewAnalysis,
  isSample = false,
  activeItem,
  onItemChange,
  hideInnerNav = false,
}: FullReportDashboardProps) {
  const lang = normalizeReportLanguage(language);
  const copy = getGuideUiCopy(lang);
  const [uncontrolledTab, setUncontrolledTab] = useState<GuideTab>('core');
  const tab = activeItem ?? uncontrolledTab;
  const selectTab = (id: GuideTab) => {
    if (onItemChange) onItemChange(id);
    if (activeItem === undefined) setUncontrolledTab(id);
  };

  const nav = useMemo(
    () => guideItemNav(lang).map((item) => ({ ...item, blurb: '' })),
    [lang],
  );

  const handleBack = () => {
    if (onNewAnalysis) onNewAnalysis();
    else window.location.href = '/';
  };

  return (
    <div
      className={`w-full min-w-0 mx-auto ${
        embedded ? '' : `${REPORT_SHELL_WIDTH} space-y-4`
      }`}
    >
      {!embedded && (
        <div className="no-print flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <Home className={REPORT_ACTION_ICON} />
            {copy.backHome}
          </button>
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <RotateCcw className={REPORT_ACTION_ICON} />
            {copy.newAnalysis}
          </button>
        </div>
      )}

      <div className={`@container/report relative min-w-0 overflow-x-auto ${REPORT_SLIDE_SURFACE}`}>
        <ReportJobHeader
          productTitle={copy.productTitle}
          report={report}
          language={lang}
          isSample={isSample}
        />

        {hideInnerNav ? null : (
        <nav className={`px-4 sm:px-6 py-3 border-b border-slate-700 bg-slate-900/60 flex flex-wrap sm:flex-nowrap ${REPORT_GUIDE_TAB_GAP}`}>
          {nav.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 ${REPORT_GUIDE_TAB_TYPE} transition-colors border ${
                  active
                    ? 'border-blue-500 bg-blue-500/10 text-sky-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        )}

        <section className="p-4 sm:p-6 space-y-4 bg-slate-950 min-w-0 min-h-[28rem]">
          <div key={tab} className="animate-fade-in space-y-4">
            <GuideItemPage report={report} item={tab} language={lang} />
          </div>
        </section>
      </div>
    </div>
  );
}
