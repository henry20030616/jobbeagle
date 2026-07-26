'use client';

/**
 * Interview Strategy Guide — Pages 2–5.
 * Layout mirrors LiteReportDashboard (Page 1) 4-row grid. No duplicate $ salary ranges on 2–3.
 */

import React, { useMemo, useState } from 'react';
import type {
  CompanyTruth,
  FullReport,
  InterviewQuestionCard,
  ReferenceCitation,
  RoleTeamInsights,
} from '@/types';
import { CheckCircle2, AlertTriangle, ChevronDown, ExternalLink } from 'lucide-react';
import {
  ActionDualRow,
  BODY,
  BODY_MUTED,
  BulletList,
  ContrastDualRow,
  DetailDualRow,
  GuideSlideShell,
  HeroDualRow,
  InsufficientDataBadge,
  META,
  PageHeaderBar,
  SECTION_TITLE,
} from '@/components/guide/GuideSlideChrome';

export type GuideStrategyTab = 'hiring' | 'interview' | 'salary' | 'provenance';

function isBehavioral(q: string): boolean {
  const s = q.toLowerCase();
  return (
    s.includes('tell me about')
    || s.includes('walk me through')
    || s.includes('time you')
    || s.includes('example of')
    || s.includes('how do you')
    || s.includes('describe a')
  );
}

function synthesizeRoleTeam(report: FullReport): RoleTeamInsights {
  if (report.role_team_insights) return report.role_team_insights;
  const role = report.role_read;
  const hard = report.hard_filter?.items ?? [];
  const insights = report.hiring_context?.insights ?? [];
  const insufficient = insights.length === 0;
  return {
    team_fit_badge: insufficient ? 'UNKNOWN' : 'MEDIUM',
    career_trajectory: {
      current_label: report.job_title || 'This role',
      next_role: role?.hiring_signals?.[0] || 'Senior ownership track (validate leveling)',
      growth_potential_pct: '—',
    },
    work_arrangement: {
      mode: 'UNKNOWN',
      hours_per_week: undefined,
      notes: 'Confirm RTO / remote with recruiter — not stated in structured output.',
    },
    role_core: role?.responsibilities?.length
      ? role.responsibilities
      : [role?.mission || 'Role mission not extracted.'],
    hard_requirements: hard.length
      ? hard.map((h) => `${h.requirement} (${h.status})`)
      : role?.hiring_signals ?? [],
    team_vibe: insights[0]
      ? `${insights[0].claim} — ${insights[0].why_it_matters}`
      : 'Limited public team-culture signals for this seat.',
    vibe_source_tag: insights[0]?.source_url
      ? '[ Official JD vs. Web-Grounded Verified ]'
      : '[ Official JD — web signals thin ]',
    team_highlights: (report.candidate_case?.top_facts ?? []).slice(0, 3),
    team_pain_points: (report.proof_map?.gaps ?? [])
      .slice(0, 3)
      .map((g) => `${g.gap}${g.description ? `: ${g.description}` : ''}`),
    promotion_drivers: role?.hiring_signals?.slice(0, 3) ?? [],
    hm_verification_questions: [
      ...(report.hiring_context?.validation_questions ?? []),
      ...(report.strategy_fit_salary?.validate_with_recruiter ?? []),
    ]
      .filter((q, i, a) => a.indexOf(q) === i)
      .slice(0, 3),
    data_insufficient: insufficient,
  };
}

function synthesizeCompanyTruth(report: FullReport): CompanyTruth {
  if (report.company_truth) return report.company_truth;
  const insights = report.hiring_context?.insights ?? [];
  const insufficient = insights.length < 2;
  return {
    risk_audit_badge: insufficient ? 'DATA THIN' : 'PASSED',
    strategic_focus: insights[0]?.claim || 'No recent strategic news extracted for this company.',
    leadership_notes:
      insights[1]?.claim
      || insights[0]?.why_it_matters
      || 'CEO / leadership public signals unavailable for this run.',
    competitors: insights.slice(0, 3).map((ins, i) => ({
      name: `Signal ${i + 1}`,
      note: ins.claim,
    })),
    culture_forum_takeaways: insights.map((i) => i.claim).slice(0, 4),
    layoff_legal_flags: [],
    company_moat: insights.slice(0, 2).map((i) => i.why_it_matters).filter(Boolean),
    org_risks: (report.hiring_context?.limitations ?? []).slice(0, 3),
    insufficient_public_data: insufficient,
    strategic_questions: (report.hiring_context?.validation_questions ?? []).slice(0, 3),
    suggested_search_query: report.company_name
      ? `"${report.company_name}" Glassdoor OR Blind OR layoff`
      : undefined,
  };
}

function synthesizeCitations(report: FullReport): ReferenceCitation[] {
  if (report.reference_citations?.length) return report.reference_citations;
  const out: ReferenceCitation[] = [];
  for (const e of report.provenance?.entries ?? []) {
    out.push({
      source_badge: e.kind || 'source',
      description: e.label,
      date: e.date || '—',
      evidence_tier: e.status === 'valid' ? 2 : 3,
      url: e.url || '',
    });
  }
  if (out.length) return out;
  for (const ins of report.hiring_context?.insights ?? []) {
    out.push({
      source_badge: 'web',
      description: ins.claim,
      date: ins.date || '—',
      evidence_tier: ins.source_url ? 2 : 3,
      url: ins.source_url || '',
    });
  }
  for (const q of report.interview_playbook?.reported ?? []) {
    if (!q.source_url && !q.question) continue;
    out.push({
      source_badge: 'interview',
      description: q.question.slice(0, 120),
      date: q.source_date || '—',
      evidence_tier: q.source_url ? 2 : 3,
      url: q.source_url || '',
    });
  }
  return out;
}

function QuestionAccordion({
  items,
  title,
  titleClass,
}: {
  items: InterviewQuestionCard[];
  title: string;
  titleClass: string;
}) {
  const [open, setOpen] = useState(0);
  if (items.length === 0) {
    return (
      <div>
        <p className={`${SECTION_TITLE} ${titleClass} mb-2`}>{title}</p>
        <p className={`${BODY} text-slate-500`}>No questions in this category for this run.</p>
      </div>
    );
  }
  return (
    <div>
      <p className={`${SECTION_TITLE} ${titleClass} mb-2`}>{title}</p>
      <div className="space-y-2">
        {items.map((q, i) => {
          const expanded = open === i;
          const blueprint =
            q.star_blueprint
            || q.star_outline
            || (q.missing_facts ? `Missing facts to prepare: ${q.missing_facts}` : '')
            || 'Outline Situation → Task → Action → Result with one resume proof point.';
          return (
            <div
              key={i}
              className="rounded-lg border border-slate-700/80 bg-black/20 overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left"
                onClick={() => setOpen(expanded ? -1 : i)}
              >
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                    expanded ? 'rotate-180' : ''
                  }`}
                />
                <span className={`${BODY} font-semibold text-slate-100`}>{q.question}</span>
              </button>
              {expanded ? (
                <div className="border-t border-slate-700/80 px-3 py-3 space-y-2">
                  {q.interviewer_intent || q.evidence ? (
                    <p className={BODY_MUTED}>
                      <span className="font-semibold text-slate-300">Intent: </span>
                      {q.interviewer_intent || q.evidence}
                    </p>
                  ) : null}
                  <p className={`${BODY} text-slate-200 whitespace-pre-wrap`}>
                    <span className="font-semibold text-indigo-200">STAR blueprint: </span>
                    {blueprint}
                  </p>
                  {q.dos_donts ? (
                    <p className={BODY_MUTED}>
                      <span className="font-semibold text-amber-200">Do&apos;s &amp; Don&apos;ts: </span>
                      {q.dos_donts}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Page2({ report }: { report: FullReport }) {
  const t = synthesizeRoleTeam(report);
  const badgeTone =
    t.team_fit_badge.toUpperCase().includes('HIGH')
      ? 'emerald'
      : t.team_fit_badge.toUpperCase().includes('LOW')
        ? 'red'
        : t.data_insufficient
          ? 'amber'
          : 'sky';

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf="PAGE 2 OF 5"
        title="Role & Team Insights"
        badge={`TEAM FIT: ${t.team_fit_badge}`}
        badgeTone={badgeTone}
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>Career Trajectory & Growth</p>
            <p className="text-2xl font-black text-white leading-snug">
              {t.career_trajectory.current_label}
              <span className="text-slate-500 mx-2">→</span>
              <span className="text-indigo-200">{t.career_trajectory.next_role}</span>
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-indigo-400/50 bg-indigo-500/10"
                aria-label={`Growth potential ${t.career_trajectory.growth_potential_pct}`}
              >
                <span className="text-2xl font-black text-indigo-200 tabular-nums text-center px-1">
                  {t.career_trajectory.growth_potential_pct}
                </span>
              </div>
              <p className={BODY_MUTED}>
                1–3yr growth potential (relative). Confirm leveling — no dollar ranges on this page.
              </p>
            </div>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>RTO & Work-Life Balance</p>
            <p className="text-4xl font-black text-white tracking-tight leading-none break-words">
              {t.work_arrangement.mode}
            </p>
            {t.work_arrangement.hours_per_week ? (
              <p className={`${BODY} text-emerald-100/90 mt-3`}>
                Est. {t.work_arrangement.hours_per_week}
              </p>
            ) : null}
            {t.work_arrangement.notes ? (
              <p className={`${BODY_MUTED} mt-2 leading-relaxed`}>{t.work_arrangement.notes}</p>
            ) : null}
          </>
        }
      />
      <DetailDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>Role Core & Hard Requirements</p>
            <BulletList items={[...t.role_core, ...t.hard_requirements].slice(0, 8)} tone="indigo" />
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>Team Vibe & Work Culture</p>
            <p className={`${BODY} text-slate-200 leading-relaxed flex-1`}>{t.team_vibe}</p>
            <p className={`${META} text-slate-500 mt-3`}>{t.vibe_source_tag}</p>
          </>
        }
      />
      <ContrastDualRow
        left={
          <>
            <h3 className={`${SECTION_TITLE} text-emerald-400 mb-2 flex items-center`}>
              <CheckCircle2 className="w-5 h-5 mr-1.5" />
              Team Highlights
            </h3>
            <BulletList
              items={
                t.team_highlights.length
                  ? t.team_highlights
                  : ['Limited verified team highlights — validate with HM.']
              }
              tone="emerald"
            />
          </>
        }
        right={
          <>
            <h3 className={`${SECTION_TITLE} text-violet-300 mb-2 flex items-center`}>
              <AlertTriangle className="w-5 h-5 mr-1.5" />
              Team Pain Points & Risks
            </h3>
            <BulletList
              items={
                t.team_pain_points.length
                  ? t.team_pain_points
                  : ['No structured team risks extracted — ask about on-call and meeting load.']
              }
              tone="violet"
            />
          </>
        }
      />
      <ActionDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>Promotion Drivers</p>
            <BulletList items={t.promotion_drivers} tone="indigo" />
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>Recruiter / HM Verification</p>
            {t.data_insufficient ? (
              <div className="mb-2">
                <InsufficientDataBadge label="Insufficient Team Data" />
              </div>
            ) : null}
            <BulletList
              items={
                t.hm_verification_questions.length
                  ? t.hm_verification_questions
                  : [
                      'What does 90-day success look like for this hire?',
                      'Is this backfill or net-new scope?',
                    ]
              }
              tone="violet"
            />
          </>
        }
      />
    </GuideSlideShell>
  );
}

function Page3({ report }: { report: FullReport }) {
  const c = synthesizeCompanyTruth(report);
  const flags =
    c.layoff_legal_flags.length > 0
      ? c.layoff_legal_flags
      : ['No Major Public Red Flags'];

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf="PAGE 3 OF 5"
        title="Company Truth & Macro Audit"
        badge={`RISK AUDIT: ${c.risk_audit_badge}`}
        badgeTone={c.insufficient_public_data ? 'amber' : 'emerald'}
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>Strategic Focus & Leadership</p>
            <p className={`${BODY} text-slate-100 font-semibold leading-relaxed`}>
              {c.strategic_focus}
            </p>
            <p className={`${BODY_MUTED} mt-3 leading-relaxed`}>{c.leadership_notes}</p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>Market Position & Competitors</p>
            {c.competitors.length > 0 ? (
              <ul className="space-y-2.5 flex-1">
                {c.competitors.slice(0, 3).map((comp, i) => (
                  <li key={i} className={`${BODY} text-slate-200`}>
                    <span className="font-bold text-emerald-100">{comp.name}</span>
                    <span className="text-slate-400"> — {comp.note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${BODY} text-slate-500`}>Competitor map unavailable for this run.</p>
            )}
          </>
        }
      />
      <DetailDualRow
        leftAccent="violet"
        rightAccent="amber"
        left={
          <>
            <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>Internal Culture & Forum Rumors</p>
            <BulletList
              items={
                c.culture_forum_takeaways.length
                  ? c.culture_forum_takeaways
                  : ['No Glassdoor / Blind / Reddit takeaways extracted.']
              }
              tone="violet"
            />
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-amber-200 mb-2`}>Layoff & Legal Red Flags</p>
            <BulletList items={flags} tone="amber" />
          </>
        }
      />
      <ContrastDualRow
        left={
          <>
            <h3 className={`${SECTION_TITLE} text-emerald-400 mb-2 flex items-center`}>
              <CheckCircle2 className="w-5 h-5 mr-1.5" />
              Company Moat & Advantages
            </h3>
            <BulletList
              items={c.company_moat.length ? c.company_moat : ['Moat signals not extracted.']}
              tone="emerald"
            />
          </>
        }
        right={
          <>
            <h3 className={`${SECTION_TITLE} text-violet-300 mb-2 flex items-center`}>
              <AlertTriangle className="w-5 h-5 mr-1.5" />
              Organizational Risks
            </h3>
            <BulletList
              items={c.org_risks.length ? c.org_risks : ['No org-risk bullets for this run.']}
              tone="violet"
            />
          </>
        }
      />
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>Fallback & Strategic Verification</p>
            {c.insufficient_public_data ? (
              <div className="mb-3">
                <InsufficientDataBadge label="Insufficient Public Forum Data" />
              </div>
            ) : null}
            <BulletList
              items={
                c.strategic_questions.length
                  ? c.strategic_questions
                  : [
                      'Why is this role open now — backfill or new initiative?',
                      'How has headcount on this team changed in the last 12 months?',
                    ]
              }
              tone="indigo"
            />
            {c.suggested_search_query ? (
              <p className={`${BODY_MUTED} mt-3`}>
                Suggested search:{' '}
                <span className="font-semibold text-slate-300">{c.suggested_search_query}</span>
              </p>
            ) : null}
          </>
        }
      />
    </GuideSlideShell>
  );
}

function Page4({ report }: { report: FullReport }) {
  const offer = report.offer_strategy;
  const tc = offer?.tc_breakdown || report.expected_offer?.tc_breakdown;
  const playbook = report.interview_playbook;
  const predicted = playbook?.predicted?.length
    ? playbook.predicted
    : (report.custom_star_interview_bank || []).map(
        (question): InterviewQuestionCard => ({ question, predicted: true }),
      );

  const enriched = useMemo(() => {
    return predicted.map((q) => {
      const cat =
        q.category
        || (isBehavioral(q.question) ? 'behavioral' : 'technical');
      const template = playbook?.star_templates?.find(
        (t) => t.for_question && q.question.includes(t.for_question.slice(0, 24)),
      );
      const concern = report.concerns_defenses?.find((c) =>
        q.question.toLowerCase().includes(c.concern.toLowerCase().slice(0, 12)),
      );
      return {
        ...q,
        category: cat as 'behavioral' | 'technical',
        star_blueprint:
          q.star_blueprint
          || q.star_outline
          || (template
            ? `S: ${template.situation}\nT: ${template.task}\nA: ${template.action}\nR: ${template.result}`
            : undefined),
        dos_donts:
          q.dos_donts
          || (concern ? `Do not claim: ${concern.do_not_claim}` : undefined),
        interviewer_intent: q.interviewer_intent || concern?.why || q.evidence,
      };
    });
  }, [predicted, playbook?.star_templates, report.concerns_defenses]);

  const behavioral = enriched.filter((q) => q.category === 'behavioral').slice(0, 3);
  const technical = enriched.filter((q) => q.category === 'technical').slice(0, 3);
  const realList = playbook?.reported ?? [];

  const tcRows = (
    [
      ['Base', tc?.base],
      ['Bonus', tc?.bonus],
      ['Equity', tc?.equity],
      ['Total', tc?.total],
    ] as const
  ).filter(([, v]) => Boolean(v?.trim()));

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf="PAGE 4 OF 5"
        title="Interview & Comp Playbook"
        badge="HIGH ROI STRATEGY"
        badgeTone="violet"
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>TC Structure Breakdown</p>
            {tcRows.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 flex-1">
                {tcRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-indigo-400/30 bg-black/20 px-3 py-2.5"
                  >
                    <p className={`${META} text-slate-400 mb-0.5`}>{label}</p>
                    <p className={`${BODY} font-semibold text-indigo-50 tabular-nums`}>{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${BODY} text-slate-500`}>
                TC mix unavailable — use discovery before anchoring (Page 1 seat band still applies).
              </p>
            )}
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>Negotiation Playbook</p>
            <ol className="space-y-2 flex-1">
              {[
                {
                  step: '1. Prepare',
                  body:
                    offer?.discovery_questions?.[0]
                    || offer?.target
                    || 'Confirm approved cash band before sharing a number.',
                },
                {
                  step: '2. Pitch',
                  body: offer?.script?.slice(0, 220) || offer?.acceptable || 'Anchor to mid-band once scope is clear.',
                },
                {
                  step: '3. Counter',
                  body:
                    offer?.walk_away
                    || (offer?.structured_levers?.[0]
                      ? `${offer.structured_levers[0].name}: ${offer.structured_levers[0].note}`
                      : 'Trade scope / sign-on / flexibility if cash is low-mid.'),
                },
              ].map((s) => (
                <li
                  key={s.step}
                  className="rounded-lg border border-emerald-500/25 bg-black/20 px-3 py-2"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    {s.step}
                  </p>
                  <p className={`${BODY} text-slate-200 mt-1 leading-snug`}>{s.body}</p>
                </li>
              ))}
            </ol>
          </>
        }
      />
      <DetailDualRow
        leftAccent="violet"
        rightAccent="indigo"
        left={<QuestionAccordion items={behavioral} title="Behavioral Questions" titleClass="text-violet-300" />}
        right={
          <QuestionAccordion
            items={technical}
            title="Technical / Case Questions"
            titleClass="text-indigo-300"
          />
        }
      />
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>
              All Real Interview Questions List
            </p>
            {realList.length > 0 ? (
              <ul className="space-y-2">
                {realList.map((q, i) => (
                  <li
                    key={i}
                    className={`flex flex-wrap items-start justify-between gap-2 ${BODY} text-slate-200`}
                  >
                    <span className="flex gap-2.5 min-w-0">
                      <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400/90" />
                      <span>{q.question}</span>
                    </span>
                    {q.source_url ? (
                      <a
                        href={q.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-300 shrink-0"
                      >
                        Source <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-sm text-slate-500 shrink-0">Summary only</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${BODY} text-slate-500`}>
                No citable real interview questions for this run — practice the predicted set above.
              </p>
            )}
          </>
        }
      />
    </GuideSlideShell>
  );
}

function Page5({ report }: { report: FullReport }) {
  const citations = synthesizeCitations(report);
  const tier1 = citations.filter((c) => c.evidence_tier === 1).length;
  const tier2 = citations.filter((c) => c.evidence_tier === 2).length;
  const tier3 = citations.filter((c) => c.evidence_tier === 3).length;

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf="PAGE 5 OF 5"
        title="References & Audit Trail"
        badge="VERIFIED SOURCES"
        badgeTone="sky"
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>Grounding Confidence</p>
            <p className="text-5xl font-black text-white tabular-nums leading-none">
              {citations.length}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>Total citations / source notes in this guide.</p>
            {report.provenance?.invalid_url_count ? (
              <p className={`${BODY} text-amber-200/90 mt-3`}>
                {report.provenance.invalid_url_count} URL(s) failed validation and were downgraded.
              </p>
            ) : null}
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>Evidence Tier Distribution</p>
            <div className="grid grid-cols-3 gap-2 flex-1">
              {[
                ['Tier 1', tier1, 'Official'],
                ['Tier 2', tier2, 'Multi-source'],
                ['Tier 3', tier3, 'Forum'],
              ].map(([label, count, sub]) => (
                <div
                  key={String(label)}
                  className="rounded-md border border-emerald-400/30 bg-black/20 px-2.5 py-3 text-center"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="text-3xl font-black text-emerald-100 tabular-nums">{count}</p>
                  <p className={`${META} text-slate-400`}>{sub}</p>
                </div>
              ))}
            </div>
          </>
        }
      />
      <div className="border-t border-slate-700/90 px-5 py-3.5">
        <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
          <p className={`${SECTION_TITLE} text-indigo-300 mb-3`}>Citation Audit</p>
          {citations.length === 0 ? (
            <div>
              <InsufficientDataBadge />
              <p className={`${BODY_MUTED} mt-3`}>
                No citable public sources attached. Treat culture and salary claims as hypotheses
                until you validate with the recruiter.
              </p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[22rem] overflow-y-auto pr-1">
              {citations.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-700/80 bg-black/20 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-sky-200">
                      {c.source_badge}
                    </span>
                    <span className="rounded border border-slate-600 px-2 py-0.5 text-xs font-bold text-slate-300">
                      Tier {c.evidence_tier}
                    </span>
                    <span className={`${META} text-slate-500`}>{c.date}</span>
                  </div>
                  <p className={`${BODY} text-slate-200`}>{c.description}</p>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-violet-300 underline underline-offset-2"
                      title={c.url}
                    >
                      <span className="truncate">{c.url}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    <p className={`${META} text-slate-500 mt-1`}>
                      Summary Only — Direct Link Unavailable
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-slate-400 mb-2`}>Disclaimer</p>
            <p className={`${BODY_MUTED} leading-relaxed`}>
              JobBeagle cites public web signals when available. Paywalled or unverified forum claims
              are marked or omitted. Snapshot timestamp / report version:{' '}
              <span className="text-slate-300 font-semibold">
                {report.report_version || 'v3'}
                {report.provenance?.validated_at
                  ? ` · ${report.provenance.validated_at}`
                  : ''}
              </span>
              . Never treat model memory as a live offer letter.
            </p>
            {(report.hiring_context?.limitations?.length ?? 0) > 0 ? (
              <ul className="mt-3 space-y-1">
                {report.hiring_context!.limitations.map((l, i) => (
                  <li key={i} className={`${META} text-slate-500`}>
                    · {l}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        }
      />
    </GuideSlideShell>
  );
}

export default function GuideStrategyPages({
  tab,
  report,
}: {
  tab: GuideStrategyTab;
  report: FullReport;
}) {
  if (tab === 'hiring') return <Page2 report={report} />;
  if (tab === 'interview') return <Page3 report={report} />;
  if (tab === 'salary') return <Page4 report={report} />;
  return <Page5 report={report} />;
}
