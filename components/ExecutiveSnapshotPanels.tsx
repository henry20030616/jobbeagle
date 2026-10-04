import React from 'react';
import type {
  CompetencyProficiency,
  LiteReport,
  RiskSeverity,
} from '@/types';
import { getExecutiveUiCopy } from '@/lib/executive-ui-copy';

/** Mirror LiteReportDashboard slide typography. */
const SECTION_TITLE = 'text-lg font-bold uppercase tracking-[0.14em]';
const BODY = 'text-lg';
const BODY_MUTED = 'text-lg text-slate-400';
const CHIP = 'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider';

const PROFICIENCY_TONE: Record<CompetencyProficiency, string> = {
  demonstrated: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200',
  adjacent: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
  absent: 'border-slate-500/60 bg-slate-500/10 text-slate-300',
};

const SEVERITY_TONE: Record<RiskSeverity, string> = {
  high: 'border-red-400/60 bg-red-500/10 text-red-200',
  medium: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
  low: 'border-slate-500/60 bg-slate-500/10 text-slate-300',
};

/**
 * Executive layer for the Snapshot slide: Competency Map | Risk Assessment.
 * Renders nothing for reports that predate the executive layer.
 */
export function ExecutiveSnapshotRow({
  report,
  language,
}: {
  report: LiteReport;
  language: string;
}) {
  const t = getExecutiveUiCopy(language);
  const competencies = report.competency_map ?? [];
  const positioning = report.market_positioning ?? null;
  const risks = report.risk_assessment ?? [];
  const hasLeft = competencies.length > 0 || positioning !== null;
  const hasRight = risks.length > 0;
  if (!hasLeft && !hasRight) return null;

  return (
    <div className="border-t border-slate-700/90 px-5 py-3.5">
      <div
        className={`w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 grid items-stretch ${
          hasLeft && hasRight ? 'grid-cols-2 divide-x divide-sky-400/25' : 'grid-cols-1'
        }`}
      >
        {hasLeft ? (
          <section className="p-4 min-w-0 flex flex-col" aria-label={t.competencyMap}>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{t.competencyMap}</p>
            {positioning ? (
              <div className="mb-3 rounded-md border border-slate-700/80 bg-black/20 px-3 py-2">
                <p className={`${BODY} text-slate-200 leading-snug`}>
                  <span className="mr-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    {t.marketPositioning}
                  </span>
                  <span className={`${CHIP} border-indigo-400/50 bg-indigo-500/10 text-indigo-200`}>
                    {t.alignment[positioning.seniority_alignment]}
                  </span>
                </p>
                <p className={`${BODY_MUTED} mt-1 leading-snug`}>{positioning.rationale}</p>
                {positioning.differentiator ? (
                  <p className={`${BODY} mt-1 text-slate-200 leading-snug`}>
                    <span className="font-semibold text-indigo-200">{t.differentiator}: </span>
                    {positioning.differentiator}
                  </p>
                ) : null}
              </div>
            ) : null}
            <ul className="space-y-2 flex-1">
              {competencies.map((c, i) => (
                <li key={i} className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`${BODY} font-semibold text-slate-100 leading-snug`}>
                      {c.competency}
                      <span className="ml-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t.weight[c.weight]}
                      </span>
                    </p>
                    <span className={`${CHIP} shrink-0 ${PROFICIENCY_TONE[c.proficiency]}`}>
                      {t.proficiency[c.proficiency]}
                    </span>
                  </div>
                  <p className={`${BODY_MUTED} leading-snug`}>
                    {c.resume_evidence ?? t.noEvidence}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {hasRight ? (
          <section className="p-4 min-w-0 flex flex-col" aria-label={t.riskAssessment}>
            <p className={`${SECTION_TITLE} text-amber-300 mb-2`}>{t.riskAssessment}</p>
            <ul className="space-y-2.5 flex-1">
              {risks.map((r, i) => (
                <li key={i} className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className={`${CHIP} ${SEVERITY_TONE[r.severity]}`}>
                      {t.severity[r.severity]}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                      {t.category[r.category]}
                    </span>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t.basis[r.basis]}
                    </span>
                  </div>
                  <p className={`${BODY} text-slate-200 leading-snug`}>{r.statement}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
