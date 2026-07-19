'use client';

import React, { useId, useMemo, useState } from 'react';
import { Check, CircleHelp, Star, X } from 'lucide-react';
import {
  REPORT_COMPARE_CLOSE,
  REPORT_COMPARE_COL,
  REPORT_COMPARE_FIELD_HELP_ARIA,
  REPORT_COMPARE_FIELD_HELP_HINT,
  REPORT_COMPARE_ROWS,
  REPORT_COMPARE_SECTION_LABEL,
  REPORT_COMPARE_STAR_MAX,
  REPORT_COMPARE_SUBTITLE,
  REPORT_COMPARE_TITLE,
  resolveCompareLang,
  type ReportCompareCell,
  type ReportCompareLang,
  type ReportCompareRow,
  type ReportCompareSection,
} from '@/constants/report-compare';

const SECTION_ORDER: ReportCompareSection[] = [
  'best_for',
  'shared',
  'guide_only',
  'meta',
];

function StarRating({ value, max = REPORT_COMPARE_STAR_MAX }: { value: number; max?: number }) {
  const filled = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${filled} of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
            i < filled
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-slate-600'
          }`}
          strokeWidth={1.75}
          aria-hidden
        />
      ))}
    </span>
  );
}

function CompareCell({
  cell,
  lang,
}: {
  cell: ReportCompareCell;
  lang: ReportCompareLang;
}) {
  const text = cell.text[lang];

  if (typeof cell.stars === 'number') {
    return (
      <span className="inline-flex flex-col gap-0.5 min-w-0">
        <StarRating value={cell.stars} />
        <span className="text-slate-400 text-xs sm:text-sm leading-snug">{text}</span>
      </span>
    );
  }

  const match = /^(Yes|有)\s*(.*)$/i.exec(text.trim());
  if (match) {
    const suffix = match[2].trim();
    return (
      <span className="inline-flex items-start gap-1.5">
        <Check
          className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
          strokeWidth={2.75}
          aria-hidden
        />
        <span className="sr-only">Yes</span>
        {suffix ? (
          <span className="text-slate-300 text-xs sm:text-sm leading-snug">{suffix}</span>
        ) : null}
      </span>
    );
  }
  return <span className="text-slate-300 text-xs sm:text-sm leading-snug">{text}</span>;
}

type ReportCompareTableProps = {
  language?: string;
  className?: string;
  /** Show title + subtitle above the table (default true) */
  showHeader?: boolean;
};

/** Snapshot vs Strategy Guide comparison table — used inside the right drawer. */
export default function ReportCompareTable({
  language = 'en',
  className = '',
  showHeader = true,
}: ReportCompareTableProps) {
  const [helpRow, setHelpRow] = useState<ReportCompareRow | null>(null);
  const titleId = useId();
  const helpTitleId = useId();
  const lang: ReportCompareLang = resolveCompareLang(language);

  const sections = useMemo(() => {
    return SECTION_ORDER.map((id) => ({
      id,
      label: REPORT_COMPARE_SECTION_LABEL[id][lang],
      rows: REPORT_COMPARE_ROWS.filter((r) => r.section === id),
    })).filter((s) => s.rows.length > 0);
  }, [lang]);

  return (
    <section
      aria-labelledby={showHeader ? titleId : undefined}
      className={`relative rounded-2xl border border-slate-600 bg-slate-950/95 shadow-xl overflow-hidden ${className}`}
    >
      {showHeader ? (
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-800">
          <h2 id={titleId} className="text-lg sm:text-xl font-bold text-white">
            {REPORT_COMPARE_TITLE[lang]}
          </h2>
          <p className="text-sm text-slate-400 mt-1 leading-snug">
            {REPORT_COMPARE_SUBTITLE[lang]}
          </p>
        </div>
      ) : null}

      <div className="px-2 sm:px-4 py-2 sm:py-3 overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse table-fixed min-w-[36rem]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="py-2 px-2 sm:px-2.5 font-semibold text-slate-400 w-[26%]">
                <span className="block">{REPORT_COMPARE_COL.feature[lang]}</span>
                <span className="mt-0.5 block text-[10px] sm:text-[11px] font-medium normal-case tracking-normal text-slate-500">
                  {REPORT_COMPARE_FIELD_HELP_HINT[lang]}
                </span>
              </th>
              <th className="py-2 px-2 sm:px-2.5 font-semibold text-violet-300 w-[37%]">
                {REPORT_COMPARE_COL.snapshot[lang]}
              </th>
              <th className="py-2 px-2 sm:px-2.5 font-semibold text-emerald-300 w-[37%]">
                {REPORT_COMPARE_COL.guide[lang]}
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                {section.label.trim() ? (
                  <tr>
                    <td
                      colSpan={3}
                      className={`pt-3 pb-1 px-2 sm:px-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                        section.id === 'guide_only'
                          ? 'text-emerald-400'
                          : section.id === 'shared'
                            ? 'text-violet-300'
                            : 'text-slate-500'
                      }`}
                    >
                      {section.label}
                    </td>
                  </tr>
                ) : null}
                {section.rows.map((row) => (
                  <tr
                    key={row.feature.en}
                    className="border-b border-slate-800/80 align-middle"
                  >
                    <td className="py-2 px-2 sm:px-2.5">
                      <button
                        type="button"
                        className="group inline-flex items-start gap-1 text-left font-medium text-slate-200 hover:text-white transition-colors max-w-full"
                        onClick={() => setHelpRow(row)}
                      >
                        <span className="underline decoration-slate-600 decoration-dotted underline-offset-2 group-hover:decoration-slate-400">
                          {row.feature[lang]}
                        </span>
                        <CircleHelp
                          className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-300 shrink-0 mt-0.5"
                          aria-hidden
                        />
                        <span className="sr-only">
                          {REPORT_COMPARE_FIELD_HELP_ARIA[lang]}
                        </span>
                      </button>
                    </td>
                    <td className="py-2 px-2 sm:px-2.5">
                      <CompareCell cell={row.snapshot} lang={lang} />
                    </td>
                    <td className="py-2 px-2 sm:px-2.5">
                      <CompareCell cell={row.guide} lang={lang} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {helpRow ? (
        <div
          className="absolute inset-0 z-20 grid place-items-center p-4 bg-black/55"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label={REPORT_COMPARE_CLOSE[lang]}
            onClick={() => setHelpRow(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={helpTitleId}
            className="relative z-10 w-full max-w-md rounded-2xl border border-indigo-400/45 bg-slate-900 px-4 py-4 sm:px-5 sm:py-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 id={helpTitleId} className="text-base sm:text-lg font-bold text-white pr-2">
                {helpRow.feature[lang]}
              </h3>
              <button
                type="button"
                onClick={() => setHelpRow(null)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label={REPORT_COMPARE_CLOSE[lang]}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              {helpRow.help[lang]}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpRow(null)}
                className="rounded-lg border border-slate-500 bg-slate-950 px-3.5 py-1.5 text-sm font-semibold text-slate-100 hover:bg-slate-800 transition-colors"
              >
                {REPORT_COMPARE_CLOSE[lang]}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
