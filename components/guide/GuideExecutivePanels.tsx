import React from 'react';
import { ExternalLink } from 'lucide-react';
import type {
  FullReport,
  LeverageDirection,
  LeverageStrength,
  ReferenceEvidenceTier,
} from '@/types';
import { getExecutiveUiCopy } from '@/lib/executive-ui-copy';
import { SECTION_TITLE, BODY, BODY_MUTED, META } from '@/components/guide/GuideSlideChrome';

const CHIP = 'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider';

const STRENGTH_TONE: Record<LeverageStrength, string> = {
  strong: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200',
  moderate: 'border-sky-400/50 bg-sky-500/10 text-sky-200',
  weak: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
  unknown: 'border-slate-500/60 bg-slate-500/10 text-slate-300',
};

const DIRECTION_TONE: Record<LeverageDirection, string> = {
  for_candidate: 'text-emerald-300',
  for_employer: 'text-amber-300',
  neutral: 'text-slate-400',
};

const TIER_TONE: Record<ReferenceEvidenceTier, string> = {
  1: 'border-blue-400/40 bg-blue-500/10 text-blue-200',
  2: 'border-indigo-400/40 bg-indigo-500/10 text-indigo-200',
  3: 'border-slate-400/40 bg-slate-500/10 text-slate-200',
};

/** Guide Page 4 (right column): who holds the bargaining power, and why. */
export function LeverageAnalysisCard({
  report,
  language,
}: {
  report: FullReport;
  language: string;
}) {
  const t = getExecutiveUiCopy(language);
  const analysis = report.leverage_analysis;
  if (!analysis) return null;

  return (
    <section
      className="mb-4 rounded-lg border border-sky-400/40 bg-indigo-500/10 px-4 py-3"
      aria-label={t.leverageAnalysis}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={`${SECTION_TITLE} text-sky-300`}>{t.leverageAnalysis}</p>
        <span className={`${CHIP} ${STRENGTH_TONE[analysis.candidate_leverage]}`}>
          {t.leverageStrength[analysis.candidate_leverage]}
        </span>
      </div>
      {analysis.factors.length > 0 ? (
        <ul className="space-y-2">
          {analysis.factors.map((f, i) => (
            <li key={i} className="min-w-0">
              <p className={`${BODY} font-semibold text-slate-100 leading-snug`}>
                <span
                  className={`mr-2 font-mono text-xs font-bold uppercase tracking-wider ${DIRECTION_TONE[f.direction]}`}
                >
                  {t.direction[f.direction]}
                </span>
                {f.factor}
              </p>
              <p className={`${META} text-slate-400 leading-snug`}>
                {f.evidence}
                {f.source_url ? (
                  <a
                    href={f.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-sky-300 underline underline-offset-2"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    <span className="sr-only">{f.source_url}</span>
                  </a>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {analysis.bargaining_posture ? (
        <p className={`${BODY} mt-3 border-t border-sky-400/25 pt-2 text-slate-200 leading-snug`}>
          <span className="font-semibold text-sky-200">{t.bargainingPosture}: </span>
          {analysis.bargaining_posture}
        </p>
      ) : null}
    </section>
  );
}

/** Guide Page 5: sourced insider data points (wage filings, SEC, forums). */
export function InsiderSignalsTable({
  report,
  language,
}: {
  report: FullReport;
  language: string;
}) {
  const t = getExecutiveUiCopy(language);
  const signals = report.insider_signals ?? [];
  if (signals.length === 0) return null;

  return (
    <div className="border-b border-slate-700/90 px-5 py-5" aria-label={t.insiderSignals}>
      <p className={`${SECTION_TITLE} text-sky-400 mb-3`}>{t.insiderSignals}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              {[t.colSource, t.colFinding, t.colDate, t.colTier].map((h) => (
                <th
                  key={h}
                  className={`${META} text-left px-3 py-2 font-bold uppercase text-slate-400`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {signals.map((s, i) => (
              <tr key={i} className="border-b border-slate-800/50">
                <td className="px-3 py-3 whitespace-nowrap">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-sky-300 underline underline-offset-2"
                    >
                      {t.insiderSource[s.source]}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    </a>
                  ) : (
                    <span className="font-mono text-sm font-semibold text-slate-300">
                      {t.insiderSource[s.source]}
                      <span className="ml-2 text-xs text-slate-500">{t.noCitation}</span>
                    </span>
                  )}
                </td>
                <td className={`${BODY} px-3 py-3 text-slate-200 leading-snug max-w-md`}>
                  {s.finding}
                </td>
                <td className={`${BODY_MUTED} px-3 py-3 font-mono tabular-nums whitespace-nowrap`}>
                  {s.date || '—'}
                </td>
                <td className="px-3 py-3">
                  <span className={`${CHIP} ${TIER_TONE[s.evidence_tier]}`}>
                    {`T${s.evidence_tier}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
