'use client';

/**
 * Interview Strategy Guide — Pages 2–5 only (Company & Role / Online Intel /
 * Interview & Negotiation / References). Snapshot (Page 1) lives in LiteReportDashboard.
 */

import React, { useMemo } from 'react';
import type { FullReport, InterviewQuestionCard } from '@/types';
import {
  Building2,
  Briefcase,
  ExternalLink,
  TrendingUp,
  Newspaper,
  Quote,
  DollarSign,
  Link2,
  ListChecks,
  MessageSquare,
  HandCoins,
  ChevronDown,
} from 'lucide-react';
import PredictedLandSquircle from '@/components/PredictedLandSquircle';
import {
  evidenceTierLabel,
  formatOfferRange,
  formatPredictedOffer,
} from '@/lib/offer-display';

const SECTION_TITLE = 'text-sm font-bold uppercase tracking-[0.14em]';
const BODY = 'text-sm leading-snug text-slate-200';
const MUTED = 'text-sm leading-snug text-slate-400';

function SlidePage({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-4 text-sm">{children}</div>;
}

function TopBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5">
      {children}
    </div>
  );
}

function Pill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'indigo' | 'amber' | 'violet';
}) {
  const tones = {
    slate: 'border-slate-600 bg-slate-800/80 text-slate-200',
    emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    indigo: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200',
    amber: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
    violet: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function HeroPanel({
  title,
  icon,
  accent = 'indigo',
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  accent?: 'indigo' | 'emerald' | 'violet' | 'sky';
  children: React.ReactNode;
}) {
  const accents = {
    indigo: 'border-indigo-400/40 bg-indigo-500/10',
    emerald: 'border-emerald-400/40 bg-emerald-500/10',
    violet: 'border-violet-400/40 bg-violet-500/10',
    sky: 'border-sky-400/40 bg-sky-500/10',
  } as const;
  const titleColor = {
    indigo: 'text-indigo-300',
    emerald: 'text-emerald-300',
    violet: 'text-violet-300',
    sky: 'text-sky-300',
  } as const;
  return (
    <section className={`flex min-h-0 flex-col rounded-xl border p-4 ${accents[accent]}`}>
      <h3 className={`${SECTION_TITLE} mb-3 flex items-center gap-2 ${titleColor[accent]}`}>
        {icon}
        {title}
      </h3>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
      <h3 className={`${SECTION_TITLE} mb-3 flex items-center gap-2 text-slate-300`}>
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className={`flex gap-2 ${BODY}`}>
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300/90" aria-hidden />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className={MUTED}>{children}</p>;
}

function isBehavioral(q: string): boolean {
  const s = q.toLowerCase();
  return (
    s.includes('tell me about') ||
    s.includes('walk me through') ||
    s.includes('time you') ||
    s.includes('example of') ||
    s.includes('how do you') ||
    s.includes('describe a')
  );
}

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-slate-700 bg-black/25 open:bg-slate-900/60"
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 px-3 py-2.5 font-semibold text-slate-100 marker:content-none [&::-webkit-details-marker]:hidden">
        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
        <span className="min-w-0 text-sm leading-snug">{title}</span>
      </summary>
      <div className="border-t border-slate-700/80 px-3 py-3 text-sm text-slate-300">{children}</div>
    </details>
  );
}

export type GuideStrategyTab = 'hiring' | 'interview' | 'salary' | 'provenance';

export default function GuideStrategyPages({
  tab,
  report,
}: {
  tab: GuideStrategyTab;
  report: FullReport;
}) {
  const role = report.role_read;
  const hiring = report.hiring_context;
  const playbook = report.interview_playbook;
  const expected = report.expected_offer;
  const offer = report.offer_strategy;
  const fitSalary = report.strategy_fit_salary;
  const concerns = report.concerns_defenses ?? [];
  const hardItems = report.hard_filter?.items ?? [];
  const offerRange = formatOfferRange(expected);
  const predictedOffer = formatPredictedOffer(expected);

  const marketParagraphs = useMemo(() => {
    const fromInsights = (hiring?.insights ?? []).slice(0, 3).map((ins) => ({
      title: ins.claim,
      body: ins.why_it_matters,
      meta: [ins.date, ins.source_url].filter(Boolean).join(' · '),
      url: ins.source_url,
    }));
    if (fromInsights.length > 0) return fromInsights;
    return [] as { title: string; body: string; meta: string; url?: string }[];
  }, [hiring?.insights]);

  const predicted = useMemo(() => {
    const list = playbook?.predicted?.length
      ? playbook.predicted
      : (report.custom_star_interview_bank || []).map(
          (question): InterviewQuestionCard => ({ question, predicted: true }),
        );
    return list;
  }, [playbook?.predicted, report.custom_star_interview_bank]);

  const behavioral = predicted.filter((q) => isBehavioral(q.question));
  const professional = predicted.filter((q) => !isBehavioral(q.question));

  const qaItems = useMemo(() => {
    const out: { q: string; answer: string; kind: string; extra?: string }[] = [];
    for (const t of playbook?.star_templates ?? []) {
      const answer = [
        t.situation && `Situation: ${t.situation}`,
        t.task && `Task: ${t.task}`,
        t.action && `Action: ${t.action}`,
        t.result && `Result: ${t.result}`,
        t.resume_anchor && `Resume anchor: ${t.resume_anchor}`,
      ]
        .filter(Boolean)
        .join('\n');
      out.push({
        q: t.for_question || t.title,
        answer: answer || 'Prepare a STAR answer from your resume facts.',
        kind: 'STAR template',
      });
    }
    for (const q of [...(playbook?.reported ?? []), ...predicted]) {
      if (out.some((x) => x.q === q.question)) continue;
      out.push({
        q: q.question,
        answer:
          q.star_outline ||
          q.missing_facts ||
          'Outline Situation → Task → Action → Result with one resume proof point.',
        kind: q.predicted ? 'Predicted' : 'Reported',
      });
    }
    for (const c of concerns) {
      const extra = [
        c.why && `Why it matters: ${c.why}`,
        c.missing_proof && `Recruiter risk: ${c.missing_proof}`,
        c.evidence && `Resume evidence: ${c.evidence}`,
        c.do_not_claim && `Do not claim: ${c.do_not_claim}`,
      ]
        .filter(Boolean)
        .join('\n');
      out.push({
        q: c.concern,
        answer: c.answer_guide || c.evidence || '—',
        kind: 'Concern defense',
        extra: extra || undefined,
      });
    }
    return out;
  }, [playbook, predicted, concerns]);

  const tc = offer?.tc_breakdown || expected?.tc_breakdown;
  const refRows = useMemo(() => {
    type Row = { type: string; description: string; date: string; url: string };
    const rows: Row[] = [];
    if (report.provenance?.entries?.length) {
      for (const e of report.provenance.entries) {
        rows.push({
          type: e.kind || 'source',
          description: e.label,
          date: e.date || '—',
          url: e.url || '',
        });
      }
      return rows;
    }
    for (const s of expected?.sources ?? []) {
      if (s?.trim()) rows.push({ type: 'offer', description: s.trim(), date: '—', url: '' });
    }
    for (const ins of hiring?.insights ?? []) {
      rows.push({
        type: 'hiring',
        description: ins.claim || 'Hiring insight',
        date: ins.date || '—',
        url: ins.source_url || '',
      });
    }
    for (const q of playbook?.reported ?? []) {
      if (q.source_url) {
        rows.push({
          type: 'interview',
          description: q.question.slice(0, 100),
          date: q.source_date || '—',
          url: q.source_url,
        });
      }
    }
    return rows;
  }, [report.provenance, expected?.sources, hiring?.insights, playbook?.reported]);

  if (tab === 'hiring') {
    return (
      <SlidePage>
        <TopBand>
          <Pill tone="indigo">
            <Briefcase className="h-3.5 w-3.5" />
            Career path
          </Pill>
          <span className={`${MUTED} max-w-xl truncate`}>
            {(role?.hiring_signals ?? []).slice(0, 2).join(' · ') ||
              'Senior ownership signals from JD — validate leveling with recruiter.'}
          </span>
          <span className="hidden h-4 w-px bg-slate-600 sm:block" aria-hidden />
          <Pill tone="emerald">
            <TrendingUp className="h-3.5 w-3.5" />
            Salary trajectory
          </Pill>
          <span className={`${MUTED} truncate`}>
            {offerRange
              ? `${offerRange}${expected?.evidence_tier ? ` · ${evidenceTierLabel(expected.evidence_tier)}` : ''}`
              : 'Ask recruiter for approved cash band before anchoring.'}
          </span>
        </TopBand>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <HeroPanel
            title="2.1 Basic Role Analysis"
            icon={<Building2 className="h-4 w-4" />}
            accent="indigo"
          >
            <ul className="space-y-2.5">
              <Bullet>
                <span className="font-semibold text-slate-100">Company: </span>
                {report.company_name || '—'}
              </Bullet>
              <Bullet>
                <span className="font-semibold text-slate-100">Industry / mission: </span>
                {role?.mission || fitSalary?.score_implications || 'Mission not extracted — use JD + public filings.'}
              </Bullet>
              <Bullet>
                <span className="font-semibold text-slate-100">Role content: </span>
                {(role?.responsibilities ?? []).length > 0
                  ? role!.responsibilities.join(' · ')
                  : report.job_title || '—'}
              </Bullet>
              <Bullet>
                <span className="font-semibold text-slate-100">Requirements: </span>
                {hardItems.length > 0
                  ? hardItems.map((h) => `${h.requirement} (${h.status})`).join(' · ')
                  : (role?.hiring_signals ?? []).join(' · ') || 'See JD must-haves.'}
              </Bullet>
            </ul>
          </HeroPanel>

          <HeroPanel
            title="2.2 Company & Market Insights"
            icon={<Newspaper className="h-4 w-4" />}
            accent="sky"
          >
            {marketParagraphs.length > 0 ? (
              <div className="space-y-3">
                {marketParagraphs.map((p, i) => (
                  <div key={i} className="rounded-lg border border-slate-700/70 bg-black/20 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-300/90 mb-1">
                      Insight {i + 1}
                    </p>
                    <p className="font-semibold text-slate-100 leading-snug">{p.title}</p>
                    <p className={`${MUTED} mt-1`}>{p.body}</p>
                    {p.meta ? (
                      <p className="mt-1.5 text-xs text-indigo-300/80">
                        {p.url ? (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline underline-offset-2"
                          >
                            {p.meta} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          p.meta
                        )}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyNote>
                Limited public news / competitor / CEO signals for this run. Use validation questions
                with the recruiter and check company IR / blog separately.
              </EmptyNote>
            )}
          </HeroPanel>
        </div>

        {(report.candidate_case?.hire_thesis
          || (hiring?.validation_questions?.length ?? 0) > 0
          || (fitSalary?.validate_with_recruiter?.length ?? 0) > 0) && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {report.candidate_case?.hire_thesis ? (
              <Panel title="Hire thesis" icon={<Briefcase className="h-4 w-4" />}>
                <p className={BODY}>{report.candidate_case.hire_thesis}</p>
              </Panel>
            ) : null}
            <Panel title="Validate with recruiter" icon={<ListChecks className="h-4 w-4" />}>
              <ul className="space-y-1.5">
                {[
                  ...(hiring?.validation_questions ?? []),
                  ...(fitSalary?.validate_with_recruiter ?? []),
                ]
                  .filter((q, i, arr) => arr.indexOf(q) === i)
                  .slice(0, 8)
                  .map((q, i) => (
                    <Bullet key={i}>{q}</Bullet>
                  ))}
                {(hiring?.validation_questions?.length ?? 0) === 0
                  && (fitSalary?.validate_with_recruiter?.length ?? 0) === 0 && (
                  <EmptyNote>Ask why the seat is open and what 90-day success looks like.</EmptyNote>
                )}
              </ul>
            </Panel>
          </div>
        )}
      </SlidePage>
    );
  }

  if (tab === 'interview') {
    const reviewBullets =
      report.candidate_case?.top_facts?.length
        ? report.candidate_case.top_facts
        : (hiring?.insights ?? []).map((i) => i.claim).slice(0, 4);
    return (
      <SlidePage>
        <TopBand>
          <Pill tone={(hiring?.insights?.length ?? 0) > 0 ? 'emerald' : 'amber'}>
            <Quote className="h-3.5 w-3.5" />
            {(hiring?.insights?.length ?? 0) > 0 ? 'Public signals found' : 'Sparse public reviews'}
          </Pill>
          <Pill tone={expected?.evidence_tier === 'D' || !expected ? 'amber' : 'indigo'}>
            <DollarSign className="h-3.5 w-3.5" />
            {expected?.evidence_tier
              ? `${evidenceTierLabel(expected.evidence_tier)} salary evidence`
              : 'Salary evidence limited'}
          </Pill>
          <Pill tone="violet">
            <Link2 className="h-3.5 w-3.5" />
            {(playbook?.reported?.length ?? 0) + (hiring?.insights?.filter((i) => i.source_url).length ?? 0)}{' '}
            linked sources
          </Pill>
        </TopBand>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <HeroPanel
            title="3.1 Real Reviews (Company & Role)"
            icon={<Quote className="h-4 w-4" />}
            accent="violet"
          >
            {report.candidate_case?.hire_thesis ? (
              <p className={`${BODY} mb-3 font-semibold text-violet-100`}>
                {report.candidate_case.hire_thesis}
              </p>
            ) : null}
            {reviewBullets.length > 0 ? (
              <ul className="space-y-2">
                {reviewBullets.map((b, i) => (
                  <Bullet key={i}>{b}</Bullet>
                ))}
              </ul>
            ) : (
              <EmptyNote>
                No structured role reviews extracted. Prefer Glassdoor / Blind / Levels threads via
                links below when available.
              </EmptyNote>
            )}
            {(hiring?.limitations?.length ?? 0) > 0 && (
              <ul className="mt-3 space-y-1 border-t border-violet-500/20 pt-3">
                {hiring!.limitations.map((l, i) => (
                  <li key={i} className="text-xs text-slate-500">
                    · {l}
                  </li>
                ))}
              </ul>
            )}
          </HeroPanel>

          <HeroPanel
            title="3.2 Real Salary Info"
            icon={<DollarSign className="h-4 w-4" />}
            accent="emerald"
          >
            {offerRange ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/90">
                      Market / seat band
                    </p>
                    <p className="mt-1 text-2xl font-black text-white tracking-tight">{offerRange}</p>
                    <p className={MUTED}>
                      {[expected?.region, expected?.currency].filter(Boolean).join(' · ') || 'USD'}
                      {expected?.evidence_tier ? ` · ${evidenceTierLabel(expected.evidence_tier)}` : ''}
                    </p>
                  </div>
                  {predictedOffer ? <PredictedLandSquircle value={predictedOffer} /> : null}
                </div>
                {expected?.candidate_position_label ? (
                  <p className={BODY}>{expected.candidate_position_label}</p>
                ) : null}
                {fitSalary?.offer_implications ? (
                  <p className={MUTED}>{fitSalary.offer_implications}</p>
                ) : null}
              </div>
            ) : (
              <EmptyNote>No reliable public salary band — ask for the approved cash range.</EmptyNote>
            )}
          </HeroPanel>
        </div>

        <Panel
          title="3.3 Real Interview Questions & Resource Links"
          icon={<ExternalLink className="h-4 w-4" />}
        >
          {(playbook?.reported?.length ?? 0) > 0 ||
          (hiring?.insights?.some((i) => i.source_url) ?? false) ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(playbook?.reported ?? []).map((q, i) => (
                <a
                  key={`rq-${i}`}
                  href={q.source_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-lg border border-slate-700 bg-black/25 p-3 transition hover:border-indigo-400/50 hover:bg-slate-900/80 ${
                    q.source_url ? '' : 'pointer-events-none opacity-60'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/90 mb-1">
                    Reported question
                  </p>
                  <p className={`${BODY} line-clamp-3`}>{q.question}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-300">
                    {q.source_date ? `${q.source_date} · ` : ''}
                    Open source <ExternalLink className="h-3 w-3" />
                  </p>
                </a>
              ))}
              {(hiring?.insights ?? [])
                .filter((i) => i.source_url)
                .map((ins, i) => (
                  <a
                    key={`hi-${i}`}
                    href={ins.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-700 bg-black/25 p-3 transition hover:border-indigo-400/50 hover:bg-slate-900/80"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-300/90 mb-1">
                      Public source
                    </p>
                    <p className={`${BODY} line-clamp-3`}>{ins.claim}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-300">
                      {ins.date ? `${ins.date} · ` : ''}
                      Open source <ExternalLink className="h-3 w-3" />
                    </p>
                  </a>
                ))}
            </div>
          ) : (
            <EmptyNote>
              No citable interview-question URLs in this run. Use Glassdoor / Levels / Blind company
              threads, then paste findings into your prep notes.
            </EmptyNote>
          )}
        </Panel>
      </SlidePage>
    );
  }

  if (tab === 'salary') {
    return (
      <SlidePage>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <HeroPanel
            title="Interview Questions Prediction"
            icon={<MessageSquare className="h-4 w-4" />}
            accent="violet"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-violet-500/25 bg-black/20 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-2">
                  Behavioral
                </p>
                <ul className="space-y-2">
                  {(behavioral.length ? behavioral : predicted.slice(0, 2)).map((q, i) => (
                    <Bullet key={i}>{q.question}</Bullet>
                  ))}
                  {predicted.length === 0 && <EmptyNote>No predicted questions yet.</EmptyNote>}
                </ul>
              </div>
              <div className="rounded-lg border border-indigo-500/25 bg-black/20 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
                  Professional
                </p>
                <ul className="space-y-2">
                  {(professional.length ? professional : predicted.slice(2, 4)).map((q, i) => (
                    <Bullet key={i}>{q.question}</Bullet>
                  ))}
                  {predicted.length === 0 && <EmptyNote>No predicted questions yet.</EmptyNote>}
                </ul>
              </div>
            </div>
          </HeroPanel>

          <HeroPanel
            title="Salary Negotiation Strategy"
            icon={<HandCoins className="h-4 w-4" />}
            accent="emerald"
          >
            <ol className="space-y-2">
              {[
                { step: '1. Prepare', body: offer?.discovery_questions?.[0] || 'Confirm approved cash band before sharing a number.' },
                { step: '2. Pitch', body: offer?.target || 'Aim mid-band once scope is confirmed.' },
                { step: '3. Counter', body: offer?.script || fitSalary?.offer_implications || 'Trade scope / sign-on / flexibility if cash is low-mid.' },
              ].map((s) => (
                <li
                  key={s.step}
                  className="rounded-lg border border-emerald-500/25 bg-black/20 px-3 py-2"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">{s.step}</p>
                  <p className={`${BODY} mt-1`}>{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ['Target', offer?.target],
                ['Acceptable', offer?.acceptable],
                ['Walk away', offer?.walk_away],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-md border border-slate-700 bg-slate-950/40 px-2 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-100 line-clamp-3">{value || '—'}</p>
                </div>
              ))}
            </div>
            {(offer?.structured_levers?.length ?? 0) > 0 || (offer?.levers?.length ?? 0) > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-emerald-500/20 pt-3">
                {(offer?.structured_levers?.length
                  ? offer.structured_levers.map((l) => `${l.name}${l.note ? ` — ${l.note}` : ''}`)
                  : (offer?.levers ?? [])
                ).map((line, i) => (
                  <Bullet key={i}>{line}</Bullet>
                ))}
              </ul>
            ) : null}
            {tc && (tc.base || tc.bonus || tc.equity || tc.total) ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Base', tc.base],
                  ['Bonus', tc.bonus],
                  ['Equity', tc.equity],
                  ['Total', tc.total],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-md border border-slate-700 bg-black/20 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="text-xs font-semibold text-slate-100">{value || '—'}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </HeroPanel>
        </div>

        {(playbook?.reverse_questions?.length ?? 0) > 0
          || (playbook?.validate_before_join?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(playbook?.reverse_questions?.length ?? 0) > 0 ? (
              <Panel title="Reverse questions" icon={<MessageSquare className="h-4 w-4" />}>
                <ul className="space-y-1.5">
                  {playbook!.reverse_questions.map((q, i) => (
                    <Bullet key={i}>{q}</Bullet>
                  ))}
                </ul>
              </Panel>
            ) : null}
            {(playbook?.validate_before_join?.length ?? 0) > 0 ? (
              <Panel title="Validate before join" icon={<ListChecks className="h-4 w-4" />}>
                <ul className="space-y-1.5">
                  {playbook!.validate_before_join.map((q, i) => (
                    <Bullet key={i}>{q}</Bullet>
                  ))}
                </ul>
              </Panel>
            ) : null}
          </div>
        ) : null}

        <Panel
          title="Suggested Answers & Q&A Playbook"
          icon={<ListChecks className="h-4 w-4" />}
        >
          {qaItems.length > 0 ? (
            <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
              {qaItems.map((item, i) => (
                <AccordionItem key={i} title={`${item.kind}: ${item.q}`} defaultOpen={i === 0}>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-200">{item.answer}</p>
                  {item.extra ? (
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
                      {item.extra}
                    </p>
                  ) : null}
                </AccordionItem>
              ))}
            </div>
          ) : (
            <EmptyNote>Answer frameworks appear after a fresh Strategy Guide run.</EmptyNote>
          )}
        </Panel>
      </SlidePage>
    );
  }

  // provenance / references
  return (
    <SlidePage>
      <Panel title="5. References — Source Audit" icon={<Link2 className="h-4 w-4" />}>
        {report.provenance?.invalid_url_count ? (
          <p className="mb-3 text-xs text-amber-200/90">
            {report.provenance.invalid_url_count} URL(s) failed validation and were downgraded.
          </p>
        ) : null}
        {refRows.length === 0 ? (
          <EmptyNote>
            No citable public sources attached. Treat salary and culture claims as hypotheses until
            you validate with the recruiter.
          </EmptyNote>
        ) : (
          <div className="max-h-[26rem] overflow-auto rounded-lg border border-slate-700">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2 font-bold">Source Type</th>
                  <th className="px-3 py-2 font-bold">Description</th>
                  <th className="px-3 py-2 font-bold">Date</th>
                  <th className="px-3 py-2 font-bold">URL</th>
                </tr>
              </thead>
              <tbody>
                {refRows.map((r, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? 'bg-slate-950/40' : 'bg-slate-900/50'}
                  >
                    <td className="whitespace-nowrap px-3 py-2 align-top font-semibold capitalize text-indigo-200">
                      {r.type}
                    </td>
                    <td className="max-w-[16rem] px-3 py-2 align-top text-slate-200">{r.description}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-slate-400">{r.date}</td>
                    <td className="max-w-[12rem] px-3 py-2 align-top">
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 truncate text-violet-300 underline underline-offset-2"
                          title={r.url}
                        >
                          <span className="truncate">{r.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(hiring?.limitations?.length ?? 0) > 0 ? (
          <div className="mt-4 border-t border-slate-700 pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
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
        ) : null}
        {report.report_version ? (
          <p className="mt-3 text-xs text-slate-500">Report version: {report.report_version}</p>
        ) : null}
      </Panel>
    </SlidePage>
  );
}
