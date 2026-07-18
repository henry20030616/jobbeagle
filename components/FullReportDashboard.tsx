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
  Briefcase,
  Building2,
  FileText,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import type { AppLanguage } from '@/lib/language-context';
import { getScoreInfo } from '@/components/AnalysisDashboard';
import { formatOfferRange } from '@/lib/offer-display';

type GuideTab = 'snapshot' | 'hiring' | 'interview' | 'salary' | 'provenance';
type ViewMode = 'snapshot' | 'guide';

interface FullReportDashboardProps {
  report: FullReport;
  embedded?: boolean;
  language?: AppLanguage;
  onNewAnalysis?: () => void;
}

const NAV: { id: GuideTab; label: string; icon: React.ReactNode; blurb: string }[] = [
  {
    id: 'hiring',
    label: 'Hiring Context',
    icon: <Globe className="w-4 h-4" />,
    blurb: 'Why they may be hiring — public signals only.',
  },
  {
    id: 'interview',
    label: 'Interview',
    icon: <MessageSquare className="w-4 h-4" />,
    blurb: 'Answer templates, concerns, and the interview playbook.',
  },
  {
    id: 'salary',
    label: 'Salary',
    icon: <HandCoins className="w-4 h-4" />,
    blurb: 'Expected offer range and negotiation script templates.',
  },
  {
    id: 'provenance',
    label: 'Provenance',
    icon: <Layers className="w-4 h-4" />,
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
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {badge ? (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-slate-600 text-slate-300 bg-white/5">
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
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
            Template {index + 1}
          </p>
          <p className="text-sm font-semibold text-white">{template.title}</p>
          {template.for_question ? (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{template.for_question}</p>
          ) : null}
        </div>
        <CopyButton text={starTemplateText(template)} />
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="flex gap-2.5 text-sm">
            <span className="shrink-0 w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-200 text-[11px] font-bold flex items-center justify-center">
              {r.key}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{r.label}</p>
              <p className="text-slate-200 leading-relaxed">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
      {template.resume_anchor ? (
        <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-700/80">
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
}: FullReportDashboardProps) {
  const [mode, setMode] = useState<ViewMode>('guide');
  const [tab, setTab] = useState<GuideTab>('hiring');
  const [provenanceOpen, setProvenanceOpen] = useState(false);

  const playbook = report.interview_playbook;
  const concerns = report.concerns_defenses ?? [];
  const hiring = report.hiring_context;
  const offer = report.offer_strategy;
  const fitSalary = report.strategy_fit_salary;
  const expected = report.expected_offer;
  const offerRange = formatOfferRange(expected);
  const score = report.fit_score?.score ?? report.match_score ?? 0;
  const scoreInfo = getScoreInfo(score, 'en');

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
      className={`rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden ${
        embedded ? '' : 'shadow-2xl shadow-black/40'
      }`}
    >
      {/* Top bar — Snapshot LITE / Guide DEEP */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-700">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white tracking-tight">JobBeagle</p>
          <p className="text-[11px] text-slate-500">Evidence-based job intelligence</p>
        </div>
        <div className="flex items-center rounded-full border border-slate-700 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setMode('snapshot')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
              mode === 'snapshot'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Snapshot <span className="opacity-70 font-semibold">LITE</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('guide')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
              mode === 'guide'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guide <span className="opacity-70 font-semibold">DEEP</span>
          </button>
        </div>
      </div>

      {/* Job meta strip */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-700 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-white flex items-center gap-1.5 min-w-0">
          <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{report.job_title || 'Unknown Role'}</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">·</span>
        <span className="text-slate-400 flex items-center gap-1.5 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{report.company_name || 'Unknown Company'}</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">·</span>
        <span className={`text-xs font-bold ${scoreInfo.color}`}>
          {score} · {scoreInfo.level}
        </span>
        {!embedded && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/5"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-200 hover:bg-indigo-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        )}
      </div>

      {mode === 'snapshot' ? (
        <div className="p-4 sm:p-6">
          <LiteReportDashboard report={report} language="en" embedded onNewAnalysis={onNewAnalysis} />
        </div>
      ) : (
        <div className="space-y-0">
          {/* Full Guide always includes Snapshot (lite) first */}
          <div className="border-b border-slate-700 p-4 sm:p-6 bg-slate-950/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-5 bg-indigo-500 rounded-full shrink-0" />
              <p className="text-sm font-semibold text-indigo-200">
                Includes Job Fit Snapshot
              </p>
              <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">
                One-page fit · Offer · Strengths & Gaps
              </span>
            </div>
            <LiteReportDashboard
              report={report}
              language="en"
              embedded
              onNewAnalysis={onNewAnalysis}
            />
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[28rem]">
          {/* Sidebar */}
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-700 p-4 space-y-3 bg-slate-900/60">
            <p className="text-[11px] text-slate-500 leading-relaxed px-1">
              Guide · Deep — the full playbook from context to closing the offer.
            </p>
            <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
              {NAV.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors border ${
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
          </aside>

          {/* Content panel */}
          <section className="p-4 sm:p-6 space-y-4 bg-slate-950">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 mb-1">
                {activeNav.label}
              </p>
              <p className="text-xs text-slate-500">{activeNav.blurb}</p>
            </div>

            <div key={tab} className="animate-fade-in space-y-4">
              {tab === 'hiring' && (
                <>
                  {fitSalary && (
                    <Card title="Fit implications">
                      <p className="text-sm text-slate-300 leading-relaxed mb-2">
                        {fitSalary.score_implications}
                      </p>
                      {(fitSalary.validate_with_recruiter?.length ?? 0) > 0 && (
                        <ul className="mt-3 space-y-1">
                          {fitSalary.validate_with_recruiter.map((q, i) => (
                            <li key={i} className="text-sm text-slate-400">
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
                            <p className="text-sm font-semibold text-slate-100">{ins.claim}</p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {ins.why_it_matters}
                            </p>
                            {(ins.source_url || ins.date) && (
                              <p className="text-[11px] text-indigo-300/80 mt-2 flex items-center gap-1">
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
                      <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-sm text-indigo-100 flex gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        Limited public hiring-context signals — use validation questions below.
                      </div>
                    )}

                    {(hiring?.limitations?.length ?? 0) > 0 && (
                      <ul className="mt-4 space-y-1">
                        {hiring!.limitations.map((l, i) => (
                          <li key={i} className="text-xs text-slate-500">
                            · {l}
                          </li>
                        ))}
                      </ul>
                    )}

                    {(hiring?.validation_questions?.length ?? 0) > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                          Validate with recruiter
                        </p>
                        <ul className="space-y-1">
                          {hiring!.validation_questions.map((q, i) => (
                            <li key={i} className="text-sm text-slate-300">
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
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
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
                        <p className="text-sm text-slate-400">
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
                          <p className="text-sm font-bold text-violet-100 mb-1 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            {i + 1}. {c.concern}
                          </p>
                          <p className="text-xs text-slate-400 mb-2">{c.why}</p>
                          {c.evidence && (
                            <p className="text-xs text-slate-300 mb-1">
                              <span className="font-semibold text-slate-500">Evidence: </span>
                              {c.evidence}
                            </p>
                          )}
                          {c.missing_proof && (
                            <p className="text-xs text-slate-300 mb-1">
                              <span className="font-semibold text-slate-500">Missing: </span>
                              {c.missing_proof}
                            </p>
                          )}
                          <div className="mt-3 rounded-lg border border-violet-500/20 bg-black/20 p-3">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-300">
                                Answer template
                              </p>
                              {c.answer_guide ? <CopyButton text={c.answer_guide} /> : null}
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed">{c.answer_guide}</p>
                          </div>
                          {c.do_not_claim && (
                            <p className="text-xs text-red-300/90 mt-2">
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
                        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-400/90 mb-2">
                          Reported (cited)
                        </p>
                        <ol className="space-y-3">
                          {playbook!.reported.map((q, i) => (
                            <li
                              key={i}
                              className="text-sm rounded-xl bg-black/25 border border-emerald-500/20 px-4 py-3 text-slate-300"
                            >
                              <p className="leading-relaxed">{q.question}</p>
                              {(q.source_url || q.source_date) && (
                                <p className="text-[11px] text-emerald-300/80 mt-1">
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
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                                    Answer outline
                                  </p>
                                  <p className="text-xs text-slate-400 whitespace-pre-wrap">{q.star_outline}</p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="mb-5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-violet-300/90 mb-2">
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
                            className="text-sm rounded-xl bg-black/25 border border-slate-700 px-4 py-3 text-slate-300 leading-relaxed"
                          >
                            <span className="text-violet-400 font-mono text-xs font-bold mr-2">
                              P{i + 1}
                            </span>
                            {q.question}
                            {'star_outline' in q && q.star_outline ? (
                              <div className="mt-2 rounded-lg border border-slate-700 bg-slate-900/50 p-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                                  Answer outline
                                </p>
                                <p className="text-xs text-slate-400 whitespace-pre-wrap">{q.star_outline}</p>
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {(playbook?.reverse_questions?.length ?? 0) > 0 && (
                      <div className="mb-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Reverse questions
                        </p>
                        <ul className="space-y-1">
                          {playbook!.reverse_questions.map((q, i) => (
                            <li key={i} className="text-sm text-slate-300">
                              · {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(playbook?.validate_before_join?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                          Validate before join
                        </p>
                        <ul className="space-y-1">
                          {playbook!.validate_before_join.map((q, i) => (
                            <li key={i} className="text-sm text-slate-400">
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
                    <p className="text-[11px] text-slate-500 mb-3">
                      {[expected?.region, expected?.currency].filter(Boolean).join(' · ') || 'USD'}
                    </p>
                    {offerRange ? (
                      <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-4 py-5 mb-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-2">
                          Expected range
                        </p>
                        <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {offerRange}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 mb-3">
                        <p className="text-sm font-semibold text-indigo-100">
                          No reliable offer band yet
                        </p>
                        <p className="text-xs text-indigo-100/80 mt-1">
                          Ask the recruiter for the approved cash range before anchoring.
                        </p>
                      </div>
                    )}
                    {expected?.candidate_position_label && (
                      <p className="text-sm text-slate-300 leading-relaxed mb-2">
                        {expected.candidate_position_label}
                      </p>
                    )}
                    {expected?.target_gap && (
                      <p className="text-xs text-slate-500 leading-relaxed">{expected.target_gap}</p>
                    )}
                    {fitSalary?.offer_implications && (
                      <p className="text-sm text-slate-300 leading-relaxed mt-4 pt-4 border-t border-slate-700">
                        {fitSalary.offer_implications}
                      </p>
                    )}
                  </Card>

                  {offer && (
                    <Card title="Offer Strategy">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
                        <div className="rounded-xl bg-black/25 border border-slate-700 p-3">
                          <p className="text-[11px] text-slate-500 mb-1">Target</p>
                          <p className="text-slate-100 font-medium">{offer.target || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-black/25 border border-slate-700 p-3">
                          <p className="text-[11px] text-slate-500 mb-1">Acceptable</p>
                          <p className="text-slate-100 font-medium">{offer.acceptable || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-black/25 border border-slate-700 p-3">
                          <p className="text-[11px] text-slate-500 mb-1">Walk away</p>
                          <p className="text-slate-100 font-medium">{offer.walk_away || '—'}</p>
                        </div>
                      </div>
                      {(offer.levers?.length ?? 0) > 0 && (
                        <p className="text-xs text-slate-400 mb-3">
                          Levers: {offer.levers.join(' · ')}
                        </p>
                      )}
                      {offer.script && (
                        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 mb-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-300">
                              Negotiation script template
                            </p>
                            <CopyButton text={offer.script} />
                          </div>
                          <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                            {offer.script}
                          </p>
                        </div>
                      )}
                      {(offer.discovery_questions?.length ?? 0) > 0 && (
                        <ul className="space-y-1">
                          {offer.discovery_questions.map((q, i) => (
                            <li key={i} className="text-sm text-indigo-100/80">
                              · {q}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  )}

                  {!offer && report.salary_negotiation_script && (
                    <Card title="Negotiation Script">
                      <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                        {report.salary_negotiation_script}
                      </p>
                    </Card>
                  )}
                </>
              )}

              {tab === 'provenance' && (
                <Card title="Provenance" badge={`${sources.length} sources`}>
                  {sources.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No citable public sources were attached for this run. Treat salary and culture
                      claims as hypotheses until you validate with the recruiter.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {sources.map((s, i) => (
                        <li
                          key={i}
                          className="rounded-xl border border-slate-700 bg-black/20 px-4 py-3 text-sm text-slate-300"
                        >
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="leading-relaxed">{s.label}</p>
                              <p className="text-[11px] text-slate-500 mt-1">
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
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Limitations
                      </p>
                      <ul className="space-y-1">
                        {hiring!.limitations.map((l, i) => (
                          <li key={i} className="text-xs text-slate-500">
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
            {tab !== 'provenance' && (
              <button
                type="button"
                onClick={() => setProvenanceOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-black/30 px-4 py-3 text-left hover:bg-black/40 transition-colors"
              >
                <span className="text-xs text-slate-400 flex items-center gap-2 min-w-0">
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
            {provenanceOpen && tab !== 'provenance' && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 space-y-2">
                {sources.length === 0 ? (
                  <p className="text-xs text-slate-500">No sources listed for this panel.</p>
                ) : (
                  sources.slice(0, 5).map((s, i) => (
                    <p key={i} className="text-xs text-slate-400 truncate">
                      · {s.label}
                    </p>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => setTab('provenance')}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 mt-1"
                >
                  Open full provenance →
                </button>
              </div>
            )}
          </section>
        </div>
        </div>
      )}
    </div>
  );
}
