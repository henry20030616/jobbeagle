'use client';

import React, { useEffect, useId, useState } from 'react';
import { GitCompareArrows, X } from 'lucide-react';
import {
  REPORT_COMPARE_CLOSE,
  REPORT_COMPARE_COL,
  REPORT_COMPARE_ROWS,
  REPORT_COMPARE_SUBTITLE,
  REPORT_COMPARE_TITLE,
  REPORT_COMPARE_TRIGGER,
  resolveCompareLang,
  type ReportCompareLang,
} from '@/constants/report-compare';

type ReportCompareModalProps = {
  language?: string;
  /** Extra classes on the trigger button */
  className?: string;
  /** Visual density for samples header vs homepage */
  variant?: 'link' | 'button';
};

export default function ReportCompareModal({
  language = 'en',
  className = '',
  variant = 'link',
}: ReportCompareModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const lang: ReportCompareLang = resolveCompareLang(language);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const triggerClass =
    variant === 'button'
      ? `inline-flex items-center gap-1.5 rounded-lg border border-slate-400 bg-slate-900/80 px-2.5 py-2 text-base font-semibold text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors ${className}`
      : `inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors ${className}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        <GitCompareArrows className="w-4 h-4 shrink-0" aria-hidden />
        {REPORT_COMPARE_TRIGGER[lang]}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label={REPORT_COMPARE_CLOSE[lang]}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full sm:max-w-3xl max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-slate-600 bg-slate-950 shadow-2xl flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-800">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg sm:text-xl font-bold text-white">
                  {REPORT_COMPARE_TITLE[lang]}
                </h2>
                <p className="text-sm text-slate-400 mt-1">{REPORT_COMPARE_SUBTITLE[lang]}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label={REPORT_COMPARE_CLOSE[lang]}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto px-2 sm:px-4 py-3">
              <table className="w-full text-left text-sm sm:text-base border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2.5 px-2 sm:px-3 font-semibold text-slate-400 w-[28%]">
                      {REPORT_COMPARE_COL.feature[lang]}
                    </th>
                    <th className="py-2.5 px-2 sm:px-3 font-semibold text-violet-300 w-[36%]">
                      {REPORT_COMPARE_COL.snapshot[lang]}
                    </th>
                    <th className="py-2.5 px-2 sm:px-3 font-semibold text-emerald-300 w-[36%]">
                      {REPORT_COMPARE_COL.guide[lang]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REPORT_COMPARE_ROWS.map((row) => (
                    <tr
                      key={row.feature.en}
                      className="border-b border-slate-800/80 align-top"
                    >
                      <td className="py-2.5 px-2 sm:px-3 font-medium text-slate-200">
                        {row.feature[lang]}
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-slate-300">
                        {row.snapshot[lang]}
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-slate-300">
                        {row.guide[lang]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-500 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
              >
                {REPORT_COMPARE_CLOSE[lang]}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
