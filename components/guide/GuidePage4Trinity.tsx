'use client';

/**
 * Guide Page 4: Interview & Comp (Tactical) — Trinity Accordion + Sticky Script
 * 4 questions (2 behavioral + 2 technical) with collapsible STAR details
 * Sticky negotiation playbook on the right
 */

import React, { useState, useMemo } from 'react';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import type { FullReport, InterviewQuestionCard } from '@/types';
import type { AppLanguage } from '@/lib/language-context';
import type { GuideUiCopy } from '@/lib/report-ui-copy';
import {
  GuideSlideShell,
  PageHeaderBar,
  SECTION_TITLE,
  BODY,
  BODY_MUTED,
  META,
} from '@/components/guide/GuideSlideChrome';
import {
  formatOfferRange,
  formatPredictedOffer,
} from '@/lib/offer-display';

interface Page4Props {
  report: FullReport;
  copy: GuideUiCopy;
  language: AppLanguage;
  behavioral: InterviewQuestionCard[];
  technical: InterviewQuestionCard[];
}

function sourceHostLabel(url?: string, sourceName?: string): string {
  if (sourceName?.trim()) return sourceName.trim();
  if (!url?.trim()) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.trim();
  }
}

/** Trinity Accordion: Collapsible interview question cards */
function AccordionQuestions({
  items,
  categoryLabel,
  copy,
}: {
  items: InterviewQuestionCard[];
  categoryLabel: string;
  copy: GuideUiCopy;
}) {
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (items.length === 0) {
    return <p className={`${BODY} text-slate-500`}>—</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((q, i) => {
        const isExpanded = expandedIndexes.has(i);
        const isReported = q.predicted === false || Boolean(q.source_url);
        const blueprint = q.star_blueprint || q.star_outline || '—';
        const host = sourceHostLabel(q.source_url, q.source_name);

        return (
          <li
            key={i}
            className="rounded-lg border border-slate-700/80 bg-black/20 overflow-hidden transition-all"
          >
            {/* Header (Always Visible, Clickable) */}
            <button
              type="button"
              onClick={() => toggleExpand(i)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black tabular-nums text-slate-300">
                    {i + 1}.
                  </span>
                  <span className="rounded border border-sky-400/40 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                    {categoryLabel}
                  </span>
                  {isReported ? (
                    <span className="rounded border border-emerald-400/50 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                      {copy.reportedBadge}
                    </span>
                  ) : (
                    <span className="rounded border border-amber-400/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                      {copy.predictedBadge}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </div>
              <p className={`${BODY} font-semibold text-slate-100 mb-1.5`}>
                {q.question}
              </p>
              <p className={`${BODY_MUTED} text-sm`}>
                <span className="font-semibold text-slate-300">
                  {copy.intentLabel || 'Intent:'}
                </span>{' '}
                {q.interviewer_intent || q.evidence || '—'}
              </p>
            </button>

            {/* Expanded Content */}
            {isExpanded ? (
              <div className="border-t border-slate-700/70 px-4 py-3 space-y-3 bg-slate-950/40">
                {/* Source */}
                <div className="rounded-md border border-slate-700/70 bg-black/25 px-3 py-2">
                  <p className={`${META} font-bold uppercase tracking-wider text-slate-400 mb-1`}>
                    {copy.questionSourceLabel || 'Source'}
                  </p>
                  {isReported ? (
                    <>
                      <p className={`${BODY} text-slate-200`}>
                        {host || copy.reportedBadge}
                        {q.source_date ? ` · ${q.source_date}` : ''}
                      </p>
                      {q.source_url ? (
                        <a
                          href={q.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-violet-300 underline underline-offset-2 mt-1"
                          title={q.source_url}
                        >
                          <span className="truncate">{q.source_url}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <p className={`${META} text-amber-200/90 mt-1`}>
                          {copy.noDirectUrl}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className={`${BODY} text-amber-100/90`}>
                      {copy.systemAnalysisSourceNote ||
                        'System-analyzed from resume↔JD gaps'}
                    </p>
                  )}
                </div>

                {/* STAR Blueprint */}
                <div>
                  <p
                    className={`${META} font-bold uppercase tracking-wider text-indigo-300 mb-1`}
                  >
                    {copy.starLabel || 'STAR Framework'}
                  </p>
                  <p
                    className={`${BODY} text-slate-200 leading-relaxed whitespace-pre-wrap`}
                  >
                    {blueprint}
                  </p>
                </div>

                {/* Resume Anchor */}
                {q.resume_anchor ? (
                  <div>
                    <p
                      className={`${META} font-bold uppercase tracking-wider text-emerald-300 mb-1`}
                    >
                      {copy.resumeAnchorLabel || 'Resume Proof'}
                    </p>
                    <p className={`${BODY} text-slate-200 leading-relaxed`}>
                      {q.resume_anchor}
                    </p>
                  </div>
                ) : null}

                {/* Dos & Don'ts */}
                <div>
                  <p
                    className={`${META} font-bold uppercase tracking-wider text-amber-300 mb-1`}
                  >
                    {copy.dosDontsLabel || "Dos & Don'ts"}
                  </p>
                  <p className={`${BODY} text-slate-200 leading-relaxed`}>
                    {q.dos_donts || '—'}
                  </p>
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function GuidePage4Trinity({
  report,
  copy,
  language,
  behavioral,
  technical,
}: Page4Props) {
  const offer = report.offer_strategy;
  const expected = report.expected_offer;
  const offerRange = formatOfferRange(expected);
  const predictedOffer = formatPredictedOffer(expected);
  const seatMedian =
    expected?.p50?.trim() && expected.p50.trim() !== '—' ? expected.p50.trim() : null;
  const tc = offer?.tc_breakdown || expected?.tc_breakdown;

  const tcRows = useMemo(
    () =>
      (
        [
          [copy.tcBase, tc?.base],
          [copy.tcRsu, tc?.equity],
          [copy.tcSignOn, tc?.sign_on ?? tc?.bonus],
          ['Total TC', tc?.total],
        ] as const
      ).filter(([, v]) => Boolean(v?.trim())),
    [copy, tc],
  );

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page4Of}
        title={copy.page4Title}
        badge={copy.page4Badge}
        badgeTone="violet"
      />

      {/* Trinity Top Dashboard: TC Breakdown Visualization */}
      <div className="border-b border-slate-700/90 px-5 py-5 bg-gradient-to-r from-indigo-950/40 to-emerald-950/40">
        <p className={`${SECTION_TITLE} text-indigo-300 mb-3`}>
          {copy.tcBreakdown || 'Total Compensation Breakdown'}
        </p>
        <p className={`${META} text-slate-500 mb-4`}>{copy.tcHint}</p>
        {tcRows.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tcRows.map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-indigo-400/40 bg-black/30 px-4 py-3 text-center"
              >
                <p className={`${META} text-slate-400 mb-1`}>{label}</p>
                <p className="text-xl sm:text-2xl font-black text-indigo-50 tabular-nums leading-tight">
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-indigo-400/40 bg-black/20 px-4 py-3">
            <p className={`${BODY} text-slate-400 text-center`}>
              {copy.noOfferBand || 'Compensation data unavailable'}
            </p>
          </div>
        )}
      </div>

      {/* Trinity Bento: Left 60% Interview Questions + Right 40% Negotiation Script (Sticky) */}
      <div className="grid lg:grid-cols-[60%_40%] gap-0">
        {/* Left Column: Interview Questions (Accordion-style, scrollable) */}
        <div className="border-r border-slate-700/90 px-5 py-4 space-y-6 max-h-[800px] overflow-y-auto">
          {/* Behavioral Questions */}
          <div>
            <p
              className={`${SECTION_TITLE} text-violet-300 mb-3 flex items-center gap-2`}
            >
              {copy.behavioralTitle || 'Behavioral Questions'}
              <span className="rounded border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-xs font-bold">
                {behavioral.length}
              </span>
            </p>
            <AccordionQuestions
              items={behavioral}
              categoryLabel={copy.categoryBehavioral}
              copy={copy}
            />
          </div>

          {/* Technical Questions */}
          <div>
            <p
              className={`${SECTION_TITLE} text-indigo-300 mb-3 flex items-center gap-2`}
            >
              {copy.technicalTitle || 'Technical Questions'}
              <span className="rounded border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-xs font-bold">
                {technical.length}
              </span>
            </p>
            <AccordionQuestions
              items={technical}
              categoryLabel={copy.categoryTechnical}
              copy={copy}
            />
          </div>
        </div>

        {/* Right Column: Negotiation Script (Sticky) */}
        <div className="px-5 py-4 bg-slate-900/30 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto">
          <p className={`${SECTION_TITLE} text-emerald-400 mb-3`}>
            {copy.negotiateScript || 'Negotiation Playbook'}
          </p>
          <p className={`${META} text-slate-400 mb-4`}>
            Word-for-word script you can use with HR
          </p>
          <ol className="space-y-3">
            {[
              {
                step: copy.prepareStep || '1. Prepare',
                body:
                  offer?.discovery_questions?.[0] || offer?.target || '—',
              },
              {
                step: copy.pitchStep || '2. Pitch (Verbatim)',
                body:
                  offer?.script?.slice(0, 320) || offer?.acceptable || '—',
                highlight: true,
              },
              {
                step: copy.counterStep || '3. Counter',
                body:
                  offer?.walk_away ||
                  (offer?.structured_levers?.[0]
                    ? `${offer.structured_levers[0].name}: ${offer.structured_levers[0].note}`
                    : '—'),
              },
            ].map((s) => (
              <li
                key={s.step}
                className={`rounded-lg border px-4 py-3 ${
                  s.highlight
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-emerald-500/25 bg-black/20'
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                  {s.step}
                </p>
                <p
                  className={`${BODY} text-slate-200 leading-snug whitespace-pre-wrap`}
                >
                  {s.body}
                </p>
              </li>
            ))}
          </ol>

          {/* Offer Range Reference */}
          {offerRange ? (
            <div className="mt-6 rounded-lg border border-emerald-400/30 bg-black/20 px-4 py-3">
              <p className={`${META} text-slate-400 mb-1`}>
                {copy.offerRangeTitle || 'Market Range'}
              </p>
              <p className="text-2xl font-black text-emerald-50 tabular-nums leading-tight">
                {offerRange}
              </p>
              {seatMedian ? (
                <p className={`${BODY} text-emerald-100/80 mt-2`}>
                  <span className="text-slate-400">Median: </span>
                  <span className="font-bold">{seatMedian}</span>
                </p>
              ) : null}
              {predictedOffer ? (
                <p className={`${BODY} text-slate-300 mt-1`}>
                  <span className="text-slate-400">Your Target: </span>
                  <span className="font-bold text-white">{predictedOffer}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </GuideSlideShell>
  );
}
