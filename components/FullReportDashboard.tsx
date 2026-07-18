'use client';

import React, { useMemo, useState } from 'react';
import type { FullReport, StarTemplate } from '@/types';
import {
  AlertTriangle,
  MessageSquare,
  HandCoins,
  Globe,
  ShieldAlert,
  HelpCircle,
  Home,
  RotateCcw,
  Layers,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  ScanSearch,
  FileText,
} from 'lucide-react';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import type { AppLanguage } from '@/lib/language-context';
import { formatOfferRange } from '@/lib/offer-display';
import { REPORT_SLIDE_SURFACE, REPORT_ACTION_BTN, REPORT_SHELL_WIDTH } from '@/constants/report-frame';
import { SampleMark } from '@/components/SampleMark';

type GuideTab = 'snapshot' | 'hiring' | 'interview' | 'salary' | 'provenance';

interface FullReportDashboardProps {
  report: FullReport;
  embedded?: boolean;
  language?: AppLanguage;
  onNewAnalysis?: () => void;
  /** Show large SAMPLE mark at top of the Guide frame (sample preview pages) */
  isSample?: boolean;
}

const NAV: { id: GuideTab; label: string; icon: React.ReactNode; blurb: string }[] = [
  {
    id: 'snapshot',
    label: 'Snapshot',
    icon: <ScanSearch className="w-5 h-5" />,
    blurb: 'One-page fit score, offer range, strengths and gaps.',
  },
  {
    id: 'hiring',
    label: 'Hiring Context',
    icon: <Globe className="w-5 h-5" />,
    blurb: 'Why they may be hiring — public signals only.',
  },
  {
    id: 'interview',
    label: 'Interview',
    icon: <MessageSquare className="w-5 h-5" />,
    blurb: 'Answer templates, concerns, and the interview playbook.',
  },
  {
    id: 'salary',
    label: 'Salary',
    icon: <HandCoins className="w-5 h-5" />,
    blurb: 'Expected offer range and negotiation script templates.',
  },
  {
    id: 'provenance',
    label: 'Provenance',
    icon: <Layers className="w-5 h-5" />,
    blurb: 'Sources and confidence limits for this guide.',
  },
];

function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {badge ? (
          <span className="shrink-0 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-slate-600 text-slate-300 bg-white/5">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy template'}
    </button>
  );
}

function starTemplateText(t: StarTemplate): string {
  return [
    t.title,
    t.for_question ? `Question: ${t.for_question}` : '',
    t.situation ? `Situation: ${t.situation}` : '',
    t.task ? `Task: ${t.task}` : '',
    t.action ? `Action: ${t.action}` : '',
    t.result ? `Result: ${t.result}` : '',
    t.resume_anchor ? `Resume anchor: ${t.resume_anchor}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function StarTemplateCard({ template, index }: { template: StarTemplate; index: number }) {
  const rows = [
    { key: 'S', label: 'Situation', value: template.situation },
    { key: 'T', label: 'Task', value: template.task },
    { key: 'A', label: 'Action', value: template.action },
    { key: 'R', label: 'Result', value: template.result },
  ].filter((r) => r.value?.trim());

  return (
    <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
            Template {index + 1}
          </p>
          <p className="text-lg font-semibold text-white">{template.title}</p>
          {template.for_question ? (
            <p className="text-base text-slate-400 mt-1 leading-relaxed">{template.for_question}</p>
          ) : null}
        </div>
        <CopyButton text={starTemplateText(template)} />
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex gap-2.5 text-lg">
            <span className="shrink-0 w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-200 text-sm font-bold flex items-center justify-center">
              {r.key}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{r.label}</p>
              <p className="text-slate-200 leading-relaxed">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
      {template.resume_anchor ? (
        <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-700/80">
          Resume anchor: {template.resume_anchor}
        </p>
      ) : null}
    </div>
  );
}

export default function FullReportDashboard({
  report,
  embedded = false,
  onNewAnalysis,
  isSample = false,
}: FullReportDashboardProps) {
  const [tab, setTab] = useState<GuideTab>('snapshot');
  const [provenanceOpen, setProvenanceOpen] = useState(false);

  const playbook = report.interview_playbook;
  const concerns = report.concerns_defenses ?? [];
  const hiring = report.hiring_context;
  const offer = report.offer_strategy;
  const fitSalary = report.strategy_fit_salary;
  const expected = report.expected_offer;
  const offerRange = formatOfferRange(expected);

  const sources = useMemo(() => {
    const list: { label: string; url?: string; date?: string }[] = [];
    for (const s of expected?.sources ?? []) {
      if (s?.trim()) list.push({ label: s.trim() });
    }
    for (const ins of hiring?.insights ?? []) {
      if (ins.source_url || ins.claim) {
        list.push({
          label: ins.claim || ins.source_url || 'Insight',
          url: ins.source_url || undefined,
          date: ins.date || undefined,
        });
      }
    }
    for (const q of playbook?.reported ?? []) {
      if (q.source_url) {
        list.push({
          label: q.question.slice(0, 80),
          url: q.source_url,
          date: q.source_date || undefined,
        });
      }
    }
    return list;
  }, [expected?.sources, hiring?.insights, playbook?.reported]);

  const handleBack = () => {
    if (onNewAnalysis) onNewAnalysis();
    else window.location.href = '/';
  };

  const activeNav = NAV.find((n) => n.id === tab) ?? NAV[0];

  return (
    <div
      className={`w-full mx-auto ${
        embedded ? '' : `${REPORT_SHELL_WIDTH} space-y-4`
      }`}
    >
      {!embedded && (
        <div className="no-print flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button type="button" onClick={handleBack} className={REPORT_ACTION_BTN}>
            <RotateCcw className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      )}

      <div className={`overflow-hidden ${REPORT_SLIDE_SURFACE}`}>
      {isSample && (
        <div className="pt-4 pb-1 px-4 sm:px-6 border-b border-slate-800/80">
          <SampleMark />
        </div>
      )}
      {/* Title bar inside slide */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-700">
        <div className="min-w-0">
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Interview Strategy Guide
          </p>
          <p className="text-lg text-slate-400 mt-1.5">
            Snapshot + playbook — switch pages from the top nav
          </p>
        </div>
      </div>

      {/* Page nav — wrap so no tab is clipped */}
      <nav className="px-4 sm:px-6 py-3 border-b border-slate-700 bg-slate-900/60 flex flex-wrap gap-2">
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-base sm:text-lg font-bold transition-colors border ${
                active
                  ? 'border-violet-500 bg-violet-500/10 text-violet-100'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span className={active ? 'text-violet-300' : 'text-slate-500'}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Content panel */}
      <section className="p-4 sm:p-6 space-y-4 bg-slate-950 min-w-0 min-h-[28rem]">
          {tab !== 'snapshot' && (
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-1">
                {activeNav.label}
              </p>
              <p className="text-base text-slate-500">{activeNav.blurb}</p>
            </div>
          )}

          <div key={tab} className="animate-fade-in space-y-4">
            {tab === 'snapshot' && (
              <LiteReportDashboard
                report={report}
                language="en"
                embedded
                onNewAnalysis={onNewAnalysis}
              />
            )}

            {tab === 'hiring' && (
                <>
                  {fitSalary && (
                    <Card title="Fit implications">
                      <p className="text-lg text-slate-300 leading-relaxed mb-2">
                        {fitSalary.score_implications}
                      </p>
                      {(fitSalary.validate_with_recruiter?.length ?? 0) > 0 && (
                        <ul className="mt-3 space-y-1">
                          {fitSalary.validate_with_recruiter.map((q, i) => (
                            <li key={i} className="text-lg text-slate-400">
                              · {q}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  )}

                  <Card
                    title="Public hiring signals"
                    badge={`${hiring?.insights?.length ?? 0} insights`}
                  >
                    {(hiring?.insights?.length ?? 0) > 0 ? (
                      <ul className="space-y-3">
                        {hiring!.insights.map((ins, i) => (
                          <li
                            key={i}
                            className="rounded-xl border border-slate-700/80 bg-black/20 p-4"
                          >
                            <p className="text-lg font-semibold text-slate-100">{ins.claim}</p>
                            <p className="text-base text-slate-400 mt-1 leading-relaxed">
                              {ins.why_it_matters}
                            </p>
                            {(ins.source_url || ins.date) && (
                              <p className="text-sm text-indigo-300/80 mt-2 flex items-center gap-1">
                                {ins.date ? <span>{ins.date}</span> : null}
                                {ins.source_url ? (
                                  <a
                                    href={ins.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 underline underline-offset-2"
                                  >
                                    source <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : null}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-lg text-indigo-100 flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        Limited public hiring-context signals — use validation questions below.
                      </div>
                    )}

                    {(hiring?.limitations?.length ?? 0) > 0 && (
                      <ul className="mt-4 space-y-1">
                        {hiring!.limitations.map((l, i) => (
                          <li key={i} className="text-base text-slate-500">
                            · {l}
                          </li>
                        ))}
                      </ul>
                    )}

                    {(hiring?.validation_questions?.length ?? 0) > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">
                          Validate with recruiter
                        </p>
                        <ul className="space-y-1">
                          {hiring!.validation_questions.map((q, i) => (
                            <li key={i} className="text-lg text-slate-300">
                              · {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {tab === 'interview' && (
                <>
                  <Card
                    title="STAR Answer Templates"
                    badge={`${Math.min(playbook?.star_templates?.length || 0, 4) || '3-4'}`}
                  >
                    <p className="text-base text-slate-500 mb-4 leading-relaxed">
                      Copy-ready practice scripts built only from your resume facts. Rehearse out loud before the interview.
                    </p>
                    <div className="space-y-3">
                      {(playbook?.star_templates?.length
                        ? playbook.star_templates
                        : []
                      )
                        .slice(0, 4)
                        .map((t, i) => (
                          <StarTemplateCard key={i} template={t} index={i} />
                        ))}
                      {(playbook?.star_templates?.length ?? 0) === 0 && (
                        <p className="text-lg text-slate-400">
                          Templates will appear after a fresh Strategy Guide run.
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card title="Concerns & Defenses" badge="3">
                    <div className="space-y-3">
                      {concerns.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4"
                        >
                          <p className="text-lg font-bold text-violet-100 mb-1 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            {i + 1}. {c.concern}
                          </p>
                          <p className="text-base text-slate-400 mb-2">{c.why}</p>
                          {c.evidence && (
                            <p className="text-base text-slate-300 mb-1">
                              <span className="font-semibold text-slate-500">Evidence: </span>
                              {c.evidence}
                            </p>
                          )}
                          {c.missing_proof && (
                            <p className="text-base text-slate-300 mb-1">
                              <span className="font-semibold text-slate-500">Missing: </span>
                              {c.missing_proof}
                            </p>
                          )}
                          <div className="mt-3 rounded-lg border border-violet-500/20 bg-black/20 p-3">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-xs font-bold uppercase tracking-wide text-violet-300">
                                Answer template
                              </p>
                              {c.answer_guide ? <CopyButton text={c.answer_guide} /> : null}
                            </div>
                            <p className="text-lg text-slate-200 leading-relaxed">{c.answer_guide}</p>
                          </div>
                          {c.do_not_claim && (
                            <p className="text-base text-red-300/90 mt-2">
                              Do not claim: {c.do_not_claim}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Interview Playbook">
                    {(playbook?.reported?.length ?? 0) > 0 && (
                      <div className="mb-5">
                        <p className="text-sm font-bold uppercase tracking-wide text-emerald-400/90 mb-2">
                          Reported (cited)
                        </p>
                        <ol className="space-y-3">
                          {playbook!.reported.map((q, i) => (
                            <li
                              key={i}
                              className="text-lg rounded-xl bg-black/25 border border-emerald-500/20 px-4 py-3 text-slate-300"
                            >
                              <p className="leading-relaxed">{q.question}</p>
                              {(q.source_url || q.source_date) && (
                                <p className="text-sm text-emerald-300/80 mt-1">
                                  {q.source_date ? `${q.source_date} · ` : ''}
                                  {q.source_url ? (
                                    <a
                                      href={q.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      source
                                    </a>
                                  ) : null}
                                </p>
                              )}
                              {q.star_outline && (
                                <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/50 p-2.5">
                                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                                    Answer outline
                                  </p>
                                  <p className="text-base text-slate-400 whitespace-pre-wrap">{q.star_outline}</p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="mb-5">
                      <p className="text-sm font-bold uppercase tracking-wide text-violet-300/90 mb-2">
                        Predicted
                      </p>
                      <ol className="space-y-3">
                        {(playbook?.predicted?.length
                          ? playbook.predicted
                          : (report.custom_star_interview_bank || []).map((question) => ({
                              question,
                              predicted: true as const,
                            }))
                        ).map((q, i) => (
                          <li
                            key={i}
                            className="text-lg rounded-xl bg-black/25 border border-slate-700 px-4 py-3 text-slate-300 leading-relaxed"
                          >
                            <span className="text-violet-400 font-mono text-base font-bold mr-2">
                              P{i + 1}
                            </span>
                            {q.question}
                            {'star_outline' in q && q.star_outline ? (
                              <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/50 p-2.5">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                                  Answer outline
                                </p>
                                <p className="text-base text-slate-400 whitespace-pre-wrap">{q.star_outline}</p>
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {(playbook?.reverse_questions?.length ?? 0) > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Reverse questions
                        </p>
                        <ul className="space-y-1">
                          {playbook!.reverse_questions.map((q, i) => (
                            <li key={i} className="text-lg text-slate-300">
                              · {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(playbook?.validate_before_join?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">
                          Validate before join
                        </p>
                        <ul className="space-y-1">
                          {playbook!.validate_before_join.map((q, i) => (
                            <li key={i} className="text-lg text-slate-400">
                              · {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {tab === 'salary' && (
                <>
                  <Card
                    title="Expected Offer Range"
                    badge={expected?.evidence_tier ? `Tier ${expected.evidence_tier}` : undefined}
                  >
                    <p className="text-sm text-slate-500 mb-3">
                      {[expected?.region, expected?.currency].filter(Boolean).join(' · ') || 'USD'}
                    </p>
                    {offerRange ? (
                      <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-4 py-5 mb-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
                          Expected range
                        </p>
                        <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                          {offerRange}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 mb-3">
                        <p className="text-lg font-semibold text-indigo-100">
                          No reliable offer band yet
                        </p>
                        <p className="text-base text-indigo-100/80 mt-1">
                          Ask the recruiter for the approved cash range before anchoring.
                        </p>
                      </div>
                    )}
                    {expected?.candidate_position_label && (
                      <p className="text-lg text-slate-300 leading-relaxed mb-2">
                        {expected.candidate_position_label}
                      </p>
                    )}
                    {expected?.target_gap && (
                      <p className="text-base text-slate-500 leading-relaxed">{expected.target_gap}</p>
                    )}
                    {fitSalary?.offer_implications && (
                      <p className="text-lg text-slate-300 leading-relaxed mt-4 pt-4 border-t border-slate-700">
                        {fitSalary.offer_implications}
                      </p>
                    )}
                  </Card>

                  {offer && (
                    <Card title="Offer Strategy">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-lg">
                        <div className="rounded-xl bg-black/25 border border-slate-700 p-3">
                          <p className="text-sm text-slate-500 mb-1">Target</p>
                          <p className="text-slate-100 font-medium">{offer.target || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-black/25 border border-slate-700 p-3">
                          <p className="text-sm text-slate-500 mb-1">Acceptable</p>
                          <p className="text-slate-100 font-medium">{offer.acceptable || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-black/25 border border-slate-700 p-3">
                          <p className="text-sm text-slate-500 mb-1">Walk away</p>
                          <p className="text-slate-100 font-medium">{offer.walk_away || '—'}</p>
                        </div>
                      </div>
                      {(offer.levers?.length ?? 0) > 0 && (
                        <p className="text-base text-slate-400 mb-3">
                          Levers: {offer.levers.join(' · ')}
                        </p>
                      )}
                      {offer.script && (
                        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 mb-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-indigo-300">
                              Negotiation script template
                            </p>
                            <CopyButton text={offer.script} />
                          </div>
                          <p className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap">
                            {offer.script}
                          </p>
                        </div>
                      )}
                      {(offer.discovery_questions?.length ?? 0) > 0 && (
                        <ul className="space-y-1">
                          {offer.discovery_questions.map((q, i) => (
                            <li key={i} className="text-lg text-indigo-100/80">
                              · {q}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  )}

                  {!offer && report.salary_negotiation_script && (
                    <Card title="Negotiation Script">
                      <p className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap">
                        {report.salary_negotiation_script}
                      </p>
                    </Card>
                  )}
                </>
              )}

              {tab === 'provenance' && (
                <Card title="Provenance" badge={`${sources.length} sources`}>
                  {sources.length === 0 ? (
                    <p className="text-lg text-slate-400">
                      No citable public sources were attached for this run. Treat salary and culture
                      claims as hypotheses until you validate with the recruiter.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {sources.map((s, i) => (
                        <li
                          key={i}
                          className="rounded-xl border border-slate-700 bg-black/20 px-4 py-3 text-lg text-slate-300"
                        >
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="leading-relaxed">{s.label}</p>
                              <p className="text-sm text-slate-500 mt-1">
                                {s.date ? `${s.date} · ` : ''}
                                {s.url ? (
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-violet-300/90 underline underline-offset-2"
                                  >
                                    open source
                                  </a>
                                ) : (
                                  'Listed source note'
                                )}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(hiring?.limitations?.length ?? 0) > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Limitations
                      </p>
                      <ul className="space-y-1">
                        {hiring!.limitations.map((l, i) => (
                          <li key={i} className="text-base text-slate-500">
                            · {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Collapsible provenance log footer — style cue from mock */}
            {tab !== 'provenance' && tab !== 'snapshot' && (
              <button
                type="button"
                onClick={() => setProvenanceOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-black/30 px-4 py-3 text-left hover:bg-black/40 transition-colors"
              >
                <span className="text-base text-slate-400 flex items-center gap-2 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">
                    Provenance Log · {sources.length} sources
                    {sources[0]?.date ? ` · latest: ${sources[0].date}` : ''}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                    provenanceOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
            {provenanceOpen && tab !== 'provenance' && tab !== 'snapshot' && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 space-y-2">
                {sources.length === 0 ? (
                  <p className="text-base text-slate-500">No sources listed for this panel.</p>
                ) : (
                  sources.slice(0, 5).map((s, i) => (
                    <p key={i} className="text-base text-slate-400 truncate">
                      · {s.label}
                    </p>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => setTab('provenance')}
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 mt-1"
                >
                  Open full provenance →
                </button>
              </div>
            )}
          </section>
      </div>
    </div>
  );
}
