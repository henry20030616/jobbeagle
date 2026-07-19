'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleHelp, GitCompareArrows, Star, X } from 'lucide-react';
import {
  REPORT_COMPARE_CLOSE,
  REPORT_COMPARE_COL,
  REPORT_COMPARE_FIELD_HELP_ARIA,
  REPORT_COMPARE_FIELD_HELP_HINT,
  REPORT_COMPARE_ROWS,
  REPORT_COMPARE_SECTION_HINT,
  REPORT_COMPARE_SECTION_LABEL,
  REPORT_COMPARE_STAR_MAX,
  REPORT_COMPARE_SUBTITLE,
  REPORT_COMPARE_TITLE,
  REPORT_COMPARE_TRIGGER,
  REPORT_COMPARE_WHY_PRO,
  resolveCompareLang,
  type ReportCompareCell,
  type ReportCompareLang,
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

/** Stars for shared depth; green check for Guide-only Yes; plain text otherwise. */
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
      <span className="inline-flex flex-col gap-1 min-w-0">
        <StarRating value={cell.stars} />
        <span className="text-slate-400 text-sm leading-snug">{text}</span>
      </span>
    );
  }

  const match = /^(Yes|有)\s*(.*)$/i.exec(text.trim());
  if (match) {
    const suffix = match[2].trim();
    return (
      <span className="inline-flex items-start gap-1.5">
        <Check
          className="w-4 h-4 sm:w-[1.125rem] sm:h-[1.125rem] text-emerald-400 shrink-0 mt-0.5"
          strokeWidth={2.75}
          aria-hidden
        />
        <span className="sr-only">Yes</span>
        {suffix ? <span className="text-slate-300">{suffix}</span> : null}
      </span>
    );
  }
  return <span className="text-slate-300">{text}</span>;
}

function FeatureHelpLabel({
  label,
  help,
  lang,
  rowKey,
  openKey,
  onToggle,
}: {
  label: string;
  help: string;
  lang: ReportCompareLang;
  rowKey: string;
  openKey: string | null;
  onToggle: (key: string | null) => void;
}) {
  const open = openKey === rowKey;
  const tipId = `compare-help-${rowKey}`;

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        className="group inline-flex items-start gap-1.5 text-left font-medium text-slate-200 hover:text-white transition-colors max-w-full"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => onToggle(open ? null : rowKey)}
      >
        <span className="underline decoration-slate-600 decoration-dotted underline-offset-2 group-hover:decoration-slate-400">
          {label}
        </span>
        <CircleHelp
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-hover:text-indigo-300 shrink-0 mt-0.5"
          aria-hidden
        />
        <span className="sr-only">{REPORT_COMPARE_FIELD_HELP_ARIA[lang]}</span>
      </button>
      {open ? (
        <div
          id={tipId}
          role="note"
          className="absolute z-30 left-0 top-full mt-1.5 w-[min(20rem,calc(100vw-3rem))] rounded-lg border border-indigo-400/40 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 leading-snug shadow-xl"
        >
          {help}
        </div>
      ) : null}
    </div>
  );
}

type ReportCompareModalProps = {
  language?: string;
  className?: string;
  variant?: 'link' | 'button';
};

export default function ReportCompareModal({
  language = 'en',
  className = '',
  variant = 'link',
}: ReportCompareModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [helpKey, setHelpKey] = useState<string | null>(null);
  const titleId = useId();
  const lang: ReportCompareLang = resolveCompareLang(language);

  const sections = useMemo(() => {
    return SECTION_ORDER.map((id) => ({
      id,
      label: REPORT_COMPARE_SECTION_LABEL[id][lang],
      rows: REPORT_COMPARE_ROWS.filter((r) => r.section === id),
    })).filter((s) => s.rows.length > 0);
  }, [lang]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setHelpKey(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (helpKey) {
        setHelpKey(null);
        return;
      }
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, helpKey]);

  const triggerClass =
    variant === 'button'
      ? `inline-flex items-center gap-1.5 rounded-lg border border-slate-400 bg-slate-900/80 px-2.5 py-2 text-base font-semibold text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors ${className}`
      : `inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors ${className}`;

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="jb-compare-overlay"
            role="presentation"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'grid',
              placeItems: 'center',
              padding: '1rem',
              boxSizing: 'border-box',
            }}
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
              className="relative z-10 w-full max-w-3xl max-h-[min(90dvh,52rem)] overflow-hidden rounded-2xl border border-slate-600 bg-slate-950 shadow-2xl flex flex-col"
              style={{ margin: 0 }}
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

              <div className="overflow-auto px-2 sm:px-4 py-3 space-y-3">
                <div className="mx-2 sm:mx-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-3">
                  <p className="text-sm font-bold text-emerald-200">
                    {REPORT_COMPARE_WHY_PRO.title[lang]}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {REPORT_COMPARE_WHY_PRO.bullets.map((b) => (
                      <li
                        key={b.en}
                        className="flex gap-2 text-sm text-slate-300 leading-snug"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                          aria-hidden
                        />
                        <span>{b[lang]}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <table className="w-full text-left text-sm sm:text-base border-collapse">
                  <thead className="sticky top-0 bg-slate-950 z-10">
                    <tr className="border-b border-slate-700">
                      <th className="py-2.5 px-2 sm:px-3 font-semibold text-slate-400 w-[28%]">
                        <span className="block">{REPORT_COMPARE_COL.feature[lang]}</span>
                        <span className="mt-0.5 block text-[11px] font-medium normal-case tracking-normal text-slate-500">
                          {REPORT_COMPARE_FIELD_HELP_HINT[lang]}
                        </span>
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
                    {sections.map((section) => (
                      <React.Fragment key={section.id}>
                        {section.label.trim() ? (
                          <tr>
                            <td
                              colSpan={3}
                              className={`pt-4 pb-1 px-2 sm:px-3 text-xs font-bold uppercase tracking-wider ${
                                section.id === 'guide_only'
                                  ? 'text-emerald-400'
                                  : section.id === 'shared'
                                    ? 'text-violet-300'
                                    : 'text-slate-500'
                              }`}
                            >
                              {section.label}
                              {REPORT_COMPARE_SECTION_HINT[section.id] ? (
                                <span className="block mt-1 normal-case tracking-normal font-medium text-slate-500 text-[13px] leading-snug">
                                  {REPORT_COMPARE_SECTION_HINT[section.id]![lang]}
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        ) : null}
                        {section.rows.map((row) => (
                          <tr
                            key={row.feature.en}
                            className="border-b border-slate-800/80 align-top"
                          >
                            <td className="py-2.5 px-2 sm:px-3">
                              <FeatureHelpLabel
                                label={row.feature[lang]}
                                help={row.help[lang]}
                                lang={lang}
                                rowKey={row.feature.en}
                                openKey={helpKey}
                                onToggle={setHelpKey}
                              />
                            </td>
                            <td className="py-2.5 px-2 sm:px-3">
                              <CompareCell cell={row.snapshot} lang={lang} />
                            </td>
                            <td className="py-2.5 px-2 sm:px-3">
                              <CompareCell cell={row.guide} lang={lang} />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
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
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        <GitCompareArrows className="w-4 h-4 shrink-0" aria-hidden />
        {REPORT_COMPARE_TRIGGER[lang]}
      </button>
      {dialog}
    </>
  );
}
