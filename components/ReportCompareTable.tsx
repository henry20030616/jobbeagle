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
  REPORT_COMPARE_SUBTITLE_LINES,
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

/** Desktop: feature | Snapshot | Guide. Snapshot/Guide share equal columns. */
const COMPARE_GRID_COLS =
  'compare-grid grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]';

/**
 * Section titles must read larger than row-item labels.
 * Overlay `.compare-font-large` maps these class names 1:1
 * (text-xl > text-lg > text-base > text-sm).
 */
const SECTION_TITLE_LG =
  'compare-section-title text-lg sm:text-xl font-bold tracking-wide';
const SECTION_TITLE_MD =
  'compare-section-title text-sm sm:text-base font-bold tracking-wide';
const ROW_LABEL_LG = 'compare-row-label text-base sm:text-lg font-medium';
const ROW_LABEL_MD = 'compare-row-label text-xs sm:text-sm font-medium';

function StarRating({
  value,
  max = REPORT_COMPARE_STAR_MAX,
}: {
  value: number;
  max?: number;
}) {
  const filled = Math.max(0, Math.min(max, Math.round(value)));
  return (
    <span
      className="compare-star-row inline-flex shrink-0 flex-nowrap items-center gap-0.5"
      aria-label={`${filled} of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`compare-star h-4 w-4 ${
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
  large,
}: {
  cell: ReportCompareCell;
  lang: ReportCompareLang;
  large?: boolean;
}) {
  const text = cell.text[lang];
  const body = large ? 'text-base sm:text-lg leading-snug' : 'text-xs sm:text-sm leading-snug';

  if (typeof cell.stars === 'number') {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <StarRating value={cell.stars} />
        <span className={`min-w-0 text-slate-400 ${body}`}>{text}</span>
      </span>
    );
  }

  if (text === '—' || text === '-') {
    return (
      <span className={`block text-slate-600 ${body}`} aria-hidden>
        —
      </span>
    );
  }

  if (/^\$/.test(text.trim())) {
    return (
      <span className={`font-semibold tabular-nums text-white ${body}`}>{text}</span>
    );
  }

  const match = /^(Yes|有)\s*(.*)$/i.exec(text.trim());
  if (match) {
    // Drop leading dash after the checkmark (copy uses "Yes — …" / "有 — …").
    const suffix = match[2].replace(/^[\s—–−-]+/u, '').trim();
    return (
      <span className={`inline-flex min-w-0 items-center gap-2.5 ${body}`}>
        <Check
          className="compare-check h-[1em] w-[1em] shrink-0 text-emerald-400"
          strokeWidth={2.75}
          aria-hidden
        />
        <span className="sr-only">Yes</span>
        {suffix ? <span className="text-slate-300">{suffix}</span> : null}
      </span>
    );
  }
  return <span className={`text-slate-300 ${body}`}>{text}</span>;
}

function FeatureLabel({
  row,
  lang,
  large,
  onOpen,
}: {
  row: ReportCompareRow;
  lang: ReportCompareLang;
  large: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={`group inline-flex max-w-full items-start gap-1.5 text-left text-slate-200 transition-colors hover:text-white ${
        large ? ROW_LABEL_LG : ROW_LABEL_MD
      }`}
      onClick={onOpen}
    >
      <span className="underline decoration-dotted decoration-slate-600 underline-offset-2 group-hover:decoration-slate-400">
        {row.feature[lang]}
      </span>
      <CircleHelp
        className={`${large ? 'mt-0.5 h-5 w-5' : 'mt-0.5 h-3.5 w-3.5'} shrink-0 text-slate-500 group-hover:text-indigo-300`}
        aria-hidden
      />
      <span className="sr-only">{REPORT_COMPARE_FIELD_HELP_ARIA[lang]}</span>
    </button>
  );
}

function sectionTitleClass(sectionId: ReportCompareSection, large: boolean): string {
  const size = large ? SECTION_TITLE_LG : SECTION_TITLE_MD;
  const color =
    sectionId === 'guide_only'
      ? 'text-emerald-400'
      : sectionId === 'shared'
        ? 'text-violet-300'
        : 'text-slate-400';
  return `${size} ${color}`;
}

type ReportCompareTableProps = {
  language?: string;
  className?: string;
  /** Show title + subtitle above the table (default true) */
  showHeader?: boolean;
  /** lg = overlay panel readable size */
  size?: 'md' | 'lg';
};

/** Snapshot vs Strategy Guide comparison table — used inside the compare overlay. */
export default function ReportCompareTable({
  language = 'en',
  className = '',
  showHeader = true,
  size = 'md',
}: ReportCompareTableProps) {
  const [helpRow, setHelpRow] = useState<ReportCompareRow | null>(null);
  const titleId = useId();
  const helpTitleId = useId();
  const lang: ReportCompareLang = resolveCompareLang(language);
  const large = size === 'lg';
  const cellPad = large ? 'min-w-0 px-3 py-3 sm:px-4 sm:py-3.5' : 'min-w-0 px-3 py-2.5 sm:px-4';
  const headerPad = large ? 'min-w-0 px-3 py-3 sm:px-4 sm:py-4' : 'min-w-0 px-3 py-2.5 sm:px-4 sm:py-3';

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
      className={`relative overflow-hidden rounded-2xl border border-slate-600 bg-slate-950/95 shadow-xl ${className}`}
    >
      {showHeader ? (
        <div className="border-b border-slate-800 px-4 py-3 sm:px-5 sm:py-3.5">
          <h2 id={titleId} className="text-lg font-bold text-white sm:text-xl">
            {REPORT_COMPARE_TITLE[lang]}
          </h2>
          <p className="mt-1 text-sm leading-snug text-slate-400">
            {REPORT_COMPARE_SUBTITLE_LINES[lang].map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      ) : null}

      {/* Desktop / tablet: 3-column grid */}
      <div
        role="table"
        aria-label={REPORT_COMPARE_TITLE[lang]}
        className={`${large ? 'px-2 py-2 sm:px-4 sm:py-3' : 'px-3 py-3 sm:px-5 sm:py-4'} hidden sm:block`}
      >
        <div role="rowgroup" className={COMPARE_GRID_COLS}>
          <div
            role="columnheader"
            className={`border-b border-slate-700 font-semibold text-slate-400 ${headerPad}`}
          >
            <span className="block">{REPORT_COMPARE_COL.feature[lang]}</span>
            <span
              className={`mt-0.5 block font-medium normal-case tracking-normal text-slate-500 ${
                large ? 'text-sm' : 'text-[10px] sm:text-[11px]'
              }`}
            >
              {REPORT_COMPARE_FIELD_HELP_HINT[lang]}
            </span>
          </div>
          <div
            role="columnheader"
            className={`compare-col-snapshot border-b border-slate-700 text-left font-semibold text-violet-300 ${headerPad}`}
          >
            {REPORT_COMPARE_COL.snapshot[lang]}
          </div>
          <div
            role="columnheader"
            className={`compare-col-guide border-b border-slate-700 text-left font-semibold text-emerald-300 ${headerPad}`}
          >
            {REPORT_COMPARE_COL.guide[lang]}
          </div>

          {sections.map((section) => (
            <React.Fragment key={section.id}>
              {section.label.trim() ? (
                <div
                  role="rowheader"
                  className={`col-span-3 ${
                    large ? 'px-3 pb-2 pt-5 sm:px-4 sm:pt-6' : 'px-3 pb-1.5 pt-4 sm:px-4 sm:pt-5'
                  } ${sectionTitleClass(section.id, large)}`}
                >
                  {section.label}
                </div>
              ) : null}
              {section.rows.map((row) => (
                <React.Fragment key={row.feature.en}>
                  <div
                    role="cell"
                    className={`border-b border-slate-800/80 ${cellPad}`}
                  >
                    <FeatureLabel
                      row={row}
                      lang={lang}
                      large={large}
                      onOpen={() => setHelpRow(row)}
                    />
                  </div>
                  <div
                    role="cell"
                    className={`compare-col-snapshot border-b border-slate-800/80 text-left ${cellPad}`}
                  >
                    <CompareCell cell={row.snapshot} lang={lang} large={large} />
                  </div>
                  <div
                    role="cell"
                    className={`compare-col-guide border-b border-slate-800/80 text-left ${cellPad}`}
                  >
                    <CompareCell cell={row.guide} lang={lang} large={large} />
                  </div>
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile: Snapshot then Guide as stacked cards */}
      <div className="compare-cards grid gap-4 p-3 sm:hidden">
        {(['snapshot', 'guide'] as const).map((col) => (
          <article
            key={col}
            className={`rounded-xl border p-3 ${
              col === 'snapshot'
                ? 'compare-col-snapshot border-violet-500/40'
                : 'compare-col-guide border-emerald-500/40'
            }`}
          >
            <h3
              className={`mb-3 font-semibold ${
                large ? 'text-lg' : 'text-sm'
              } ${col === 'snapshot' ? 'text-violet-300' : 'text-emerald-300'}`}
            >
              {REPORT_COMPARE_COL[col][lang]}
            </h3>
            {sections.map((section) => {
              if (col === 'snapshot' && section.id === 'guide_only') return null;
              return (
                <div key={section.id} className="mb-3 last:mb-0">
                  {section.label.trim() && section.id !== 'shared' ? (
                    <p className={`mb-1.5 ${sectionTitleClass(section.id, false)}`}>
                      {section.label}
                    </p>
                  ) : null}
                  <ul className="space-y-2">
                    {section.rows.map((row) => (
                      <li key={row.feature.en} className="min-w-0">
                        {section.id !== 'best_for' && section.id !== 'meta' ? (
                          <div className="mb-0.5">
                            <FeatureLabel
                              row={row}
                              lang={lang}
                              large={false}
                              onOpen={() => setHelpRow(row)}
                            />
                          </div>
                        ) : null}
                        <CompareCell cell={row[col]} lang={lang} large={false} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </article>
        ))}
      </div>

      {helpRow ? (
        <div
          className="absolute inset-0 z-20 grid place-items-center bg-black/55 p-4"
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
            className="relative z-10 w-full max-w-lg rounded-2xl border border-indigo-400/45 bg-slate-900 px-5 py-5 shadow-2xl sm:px-6 sm:py-6"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3
                id={helpTitleId}
                className="pr-2 text-lg font-bold text-white sm:text-xl"
              >
                {helpRow.feature[lang]}
              </h3>
              <button
                type="button"
                onClick={() => setHelpRow(null)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label={REPORT_COMPARE_CLOSE[lang]}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-base leading-relaxed text-slate-200 sm:text-lg">
              {helpRow.help[lang]}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpRow(null)}
                className="rounded-lg border border-slate-500 bg-slate-950 px-4 py-2 text-base font-semibold text-slate-100 transition-colors hover:bg-slate-800"
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
