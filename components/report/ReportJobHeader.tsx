'use client';

import React from 'react';
import { Briefcase, Building2, CalendarDays } from 'lucide-react';
import {
  REPORT_HEADER_JOB_ICON,
  REPORT_HEADER_JOB_LINE,
  REPORT_HEADER_META,
  REPORT_HEADER_META_ICON,
  REPORT_HEADER_META_LABEL,
  REPORT_HEADER_META_ROW,
  REPORT_HEADER_PRODUCT_LABEL,
  REPORT_HEADER_SHELL,
} from '@/constants/report-header';
import { SampleMark } from '@/components/SampleMark';
import { formatJobSourceDate } from '@/lib/job-source';
import { getSnapshotUiCopy } from '@/lib/report-ui-copy';
import { normalizeReportLanguage } from '@/lib/report-language';
import type { LiteReport } from '@/types';

export type ReportJobHeaderFields = Pick<
  LiteReport,
  'job_title' | 'company_name' | 'job_source' | 'job_posted_date'
>;

interface ReportJobHeaderProps {
  productTitle: string;
  report: ReportJobHeaderFields;
  language?: string;
  isSample?: boolean;
}

/**
 * Shared Snapshot / Guide frame header: small product label, job title,
 * company, posted source+date. Do not invert this stack.
 */
export function ReportJobHeader({
  productTitle,
  report,
  language = 'en',
  isSample = false,
}: ReportJobHeaderProps) {
  const t = getSnapshotUiCopy(normalizeReportLanguage(language));

  return (
    <header className={REPORT_HEADER_SHELL}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={REPORT_HEADER_PRODUCT_LABEL}>{productTitle}</p>
          <h1 className={REPORT_HEADER_JOB_LINE}>
            <Briefcase className={REPORT_HEADER_JOB_ICON} aria-hidden />
            {report.job_title?.trim() || t.unknownRole}
          </h1>
          <dl className={REPORT_HEADER_META}>
            <div className={REPORT_HEADER_META_ROW}>
              <Building2 className={REPORT_HEADER_META_ICON} aria-hidden />
              <dt className="sr-only">{t.company}</dt>
              <dd>
                <span className={REPORT_HEADER_META_LABEL}>{t.company}</span>
                {report.company_name?.trim() || t.unknownCompany}
              </dd>
            </div>
            <div className={REPORT_HEADER_META_ROW}>
              <CalendarDays className={REPORT_HEADER_META_ICON} aria-hidden />
              <dt className="sr-only">{t.posted}</dt>
              <dd>
                <span className={REPORT_HEADER_META_LABEL}>{t.posted}</span>
                {formatJobSourceDate(report.job_source, report.job_posted_date)}
              </dd>
            </div>
          </dl>
        </div>
        {isSample ? <SampleMark /> : null}
      </div>
    </header>
  );
}
