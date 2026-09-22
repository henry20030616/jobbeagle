'use client';

/**
 * Guide Page 5: References (Audit) — Trinity Data Table
 * High-density citation table with URL truncation, external link icons,
 * and Evidence Tier badges
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { FullReport, ReferenceCitation, ReferenceEvidenceTier } from '@/types';
import type { GuideUiCopy } from '@/lib/report-ui-copy';
import {
  GuideSlideShell,
  PageHeaderBar,
  SECTION_TITLE,
  BODY,
  BODY_MUTED,
  META,
  InsufficientDataBadge,
} from '@/components/guide/GuideSlideChrome';

interface Page5Props {
  report: FullReport;
  copy: GuideUiCopy;
}

function citationsOrEmpty(report: FullReport): ReferenceCitation[] {
  if (report.reference_citations?.length) return report.reference_citations;
  const out: ReferenceCitation[] = [];
  for (const e of report.provenance?.entries ?? []) {
    out.push({
      source_badge: e.kind || 'source',
      description: e.label,
      date: e.date || '—',
      evidence_tier: e.status === 'valid' ? 2 : 3,
      url: e.url || '',
      manual_verify_keywords: e.url ? undefined : e.label.slice(0, 80),
    });
  }
  for (const ins of report.hiring_context?.insights ?? []) {
    out.push({
      source_badge: 'web',
      description: ins.claim,
      date: ins.date || '—',
      evidence_tier: ins.source_url ? 2 : 3,
      url: ins.source_url || '',
      manual_verify_keywords: ins.source_url
        ? undefined
        : `${report.company_name} Glassdoor Blind`,
    });
  }
  for (const q of report.interview_playbook?.reported ?? []) {
    out.push({
      source_badge: 'interview',
      description: q.question.slice(0, 120),
      date: q.source_date || '—',
      evidence_tier: q.source_url ? 2 : 3,
      url: q.source_url || '',
      manual_verify_keywords: q.source_url
        ? undefined
        : `${report.company_name} interview`,
    });
  }
  return out.sort(
    (a, b) => (a.evidence_tier || 3) - (b.evidence_tier || 3) || 0,
  );
}

function truncateUrl(url: string, maxLength: number = 60): string {
  if (url.length <= maxLength) return url;
  const start = url.slice(0, 40);
  const end = url.slice(-17);
  return `${start}...${end}`;
}

/** Evidence Tier Badge: Tier 1 = Blue, Tier 2 = Indigo, Tier 3 = Gray */
function EvidenceTierBadge({ tier }: { tier: 1 | 2 | 3 }) {
  const config = {
    1: {
      label: 'Tier 1',
      bg: 'bg-blue-500/10',
      border: 'border-blue-400/40',
      text: 'text-blue-200',
    },
    2: {
      label: 'Tier 2',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-400/40',
      text: 'text-indigo-200',
    },
    3: {
      label: 'Tier 3',
      bg: 'bg-slate-500/10',
      border: 'border-slate-400/40',
      text: 'text-slate-200',
    },
  };

  const c = config[tier] ?? config[3];

  return (
    <span
      className={`inline-flex items-center justify-center rounded border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${c.bg} ${c.border} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

export default function GuidePage5Trinity({ report, copy }: Page5Props) {
  const citations = citationsOrEmpty(report);
  const citationCount = citations.length;
  const invalidCount = report.provenance?.invalid_url_count ?? 0;

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page5Of}
        title={copy.page5Title}
        badge={copy.page5Badge}
        badgeTone="sky"
      />

      {/* Trinity Top Banner: Citation Stats */}
      <div className="border-b border-slate-700/90 px-5 py-5 bg-gradient-to-r from-indigo-950/40 to-sky-950/40">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Left: Total Sources */}
          <div>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>
              {copy.ragCount || 'Total Sources'}
            </p>
            <p className="text-5xl font-black text-white tabular-nums leading-none">
              {citationCount}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>
              {copy.ragSourcesHint || 'Web references grounding this report'}
            </p>
          </div>

          {/* Right: Invalid URL Warning */}
          <div>
            <p className={`${SECTION_TITLE} text-amber-400 mb-2`}>
              {copy.invalidLinkTitle || 'Data Integrity Notice'}
            </p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>
              {copy.invalidLinkBody || 'If any URL is invalid, report it. '}{' '}
              <strong className="text-amber-200">
                {copy.neverFakeUrl || 'JobBeagle NEVER fabricates URLs.'}
              </strong>
            </p>
            {invalidCount > 0 ? (
              <p className={`${BODY} text-amber-200/90 mt-2`}>
                ⚠️ {invalidCount} URL(s) flagged during validation
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Trinity Data Table: High-Density Citations */}
      <div className="px-5 py-5">
        <p className={`${SECTION_TITLE} text-sky-400 mb-3`}>
          {copy.webReferences || 'Web References'}
        </p>

        {citations.length === 0 ? (
          <div>
            <InsufficientDataBadge label={copy.noDirectUrl || 'No citations available'} />
            <p className={`${BODY_MUTED} mt-3`}>
              {copy.manualVerifyPrefix || 'Manually verify: '}{' '}
              <span className="text-slate-300 font-semibold">
                {report.company_name || 'Company'} Glassdoor Blind Levels.fyi layoff
              </span>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className={`${META} text-left px-3 py-2 font-bold uppercase text-slate-400`}>
                    #
                  </th>
                  <th className={`${META} text-left px-3 py-2 font-bold uppercase text-slate-400`}>
                    Category
                  </th>
                  <th className={`${META} text-left px-3 py-2 font-bold uppercase text-slate-400`}>
                    Description
                  </th>
                  <th className={`${META} text-left px-3 py-2 font-bold uppercase text-slate-400`}>
                    URL
                  </th>
                  <th className={`${META} text-left px-3 py-2 font-bold uppercase text-slate-400`}>
                    Tier
                  </th>
                </tr>
              </thead>
              <tbody>
                {citations.map((c, i) => {
                  const tier = (c.evidence_tier ?? 3) as 1 | 2 | 3;
                  const url = c.url?.trim();
                  const displayUrl = url ? truncateUrl(url) : '—';

                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className={`${BODY} px-3 py-3 text-slate-300 font-semibold tabular-nums`}>
                        {i + 1}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center justify-center rounded border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-200">
                          {c.source_badge || 'General'}
                        </span>
                      </td>
                      <td className={`${BODY} px-3 py-3 text-slate-200 leading-snug max-w-md`}>
                        {c.description || '—'}
                      </td>
                      <td className="px-3 py-3 min-w-0">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 underline underline-offset-2 hover:text-sky-200 transition-colors"
                            title={url}
                          >
                            <span className="truncate max-w-[300px]">{displayUrl}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className={`${META} text-slate-500`}>—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <EvidenceTierBadge tier={tier} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trinity Bottom Note: Manual Verification Guidance */}
      <div className="border-t border-slate-700/90 px-5 py-3 bg-slate-900/40">
        <p className={`${META} text-slate-500 leading-relaxed`}>
          <strong className="text-slate-400">Verification:</strong> All URLs were validated at generation time. If any link is dead, it may have moved or been removed after this report was created.
        </p>
      </div>
    </GuideSlideShell>
  );
}
