'use client';

/**
 * Interview Strategy Guide Pages 2–5 — Excel《Jobbeagle報告範圍》A–E 原稿。
 * Layout mirrors Page 1. No invented sections. No $ salary on Pages 2–3.
 * Chrome labels follow the report language button.
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
import PredictedLandSquircle from '@/components/PredictedLandSquircle';
import type { AppLanguage } from '@/lib/language-context';
import {
  evidenceTierLabel,
  formatOfferRange,
  formatPredictedOffer,
} from '@/lib/offer-display';
import { normalizeReportLanguage } from '@/lib/report-language';
import { getGuideUiCopy, type GuideUiCopy } from '@/lib/report-ui-copy';

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

function roleTeamOrEmpty(report: FullReport, copy: GuideUiCopy): RoleTeamInsights {
  if (report.role_team_insights) return report.role_team_insights;
  return {
    role_content_refined: report.role_read?.responsibilities?.slice(0, 6) ?? [],
    requirements_refined: report.role_read?.hiring_signals?.slice(0, 6) ?? [],
    rto_official: '—',
    rto_employee_reality: copy.teamSampleInsufficient,
    next_title_1_3yr: '',
    promotion_skill_gaps: (report.proof_map?.gaps ?? []).slice(0, 3).map((g) => g.gap),
    team_sample_insufficient: true,
    department_fallback_note: copy.downgradeNote,
  };
}

function companyTruthOrEmpty(report: FullReport): CompanyTruth {
  if (report.company_truth) return report.company_truth;
  const insights = report.hiring_context?.insights ?? [];
  return {
    current_strategy:
      insights[0]?.claim || '—',
    competitors: [],
    insider_voice: insights.map((i) => i.claim).slice(0, 4),
    forum_sample_thin: insights.length < 2,
    layoff_legal_flags: [],
    interviewer_strategy_questions: (
      report.hiring_context?.validation_questions ?? []
    ).slice(0, 3),
  };
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
        : `${report.company_name} interview questions`,
    });
  }
  return out;
}

function QuestionAccordion({
  items,
  title,
  titleClass,
  copy,
}: {
  items: InterviewQuestionCard[];
  title: string;
  titleClass: string;
  copy: GuideUiCopy;
}) {
  const [open, setOpen] = useState(0);
  if (items.length === 0) {
    return (
      <div>
        <p className={`${SECTION_TITLE} ${titleClass} mb-2`}>{title}</p>
        <p className={`${BODY} text-slate-500`}>—</p>
      </div>
    );
  }
  return (
    <div>
      <p className={`${SECTION_TITLE} ${titleClass} mb-2`}>{title}</p>
      <div className="space-y-2">
        {items.map((q, i) => {
          const expanded = open === i;
          const isGuess = q.predicted !== false && !q.source_url;
          const blueprint =
            q.star_blueprint
            || q.star_outline
            || '—';
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
                <span className="min-w-0 flex-1">
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {isGuess ? (
                      <span className="rounded border border-amber-400/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                        {copy.predictedBadge}
                      </span>
                    ) : (
                      <span className="rounded border border-emerald-400/50 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                        {copy.reportedBadge}
                      </span>
                    )}
                    <span className={`${BODY} font-semibold text-slate-100`}>{q.question}</span>
                  </span>
                </span>
              </button>
              {expanded ? (
                <div className="border-t border-slate-700/80 px-3 py-3 space-y-2">
                  <p className={BODY_MUTED}>
                    <span className="font-semibold text-slate-300">{copy.intentLabel}</span>
                    {q.interviewer_intent || q.evidence || '—'}
                  </p>
                  <p className={`${BODY} text-slate-200 whitespace-pre-wrap`}>
                    <span className="font-semibold text-indigo-200">{copy.starLabel}</span>
                    {blueprint}
                  </p>
                  <p className={BODY_MUTED}>
                    <span className="font-semibold text-amber-200">{copy.dosDontsLabel}</span>
                    {q.dos_donts || '—'}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Page2({ report, copy }: { report: FullReport; copy: GuideUiCopy }) {
  const t = roleTeamOrEmpty(report, copy);

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page2Of}
        title={copy.page2Title}
        badge={t.team_sample_insufficient ? copy.badgeSampleThin : copy.badgeTeamSignals}
        badgeTone={t.team_sample_insufficient ? 'amber' : 'sky'}
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>{copy.roleContent}</p>
            <p className={`${META} text-slate-500 mb-2`}>{copy.roleContentHint}</p>
            <BulletList
              items={
                t.role_content_refined.length
                  ? t.role_content_refined
                  : [copy.emptyRoleContent]
              }
              tone="indigo"
            />
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>{copy.requirements}</p>
            <p className={`${META} text-slate-500 mb-2`}>{copy.requirementsHint}</p>
            <BulletList
              items={
                t.requirements_refined.length
                  ? t.requirements_refined
                  : [copy.emptyRequirements]
              }
              tone="emerald"
            />
          </>
        }
      />
      <DetailDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.rtoOfficial}</p>
            <p className={`${BODY} text-slate-100 font-semibold leading-relaxed`}>
              {t.rto_official || '—'}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>{copy.rtoOfficialSource}</p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>{copy.rtoReality}</p>
            {t.team_sample_insufficient ? (
              <div className="mb-2">
                <InsufficientDataBadge label={copy.teamSampleInsufficient} />
              </div>
            ) : null}
            <p className={`${BODY} text-slate-200 leading-relaxed`}>
              {t.rto_employee_reality}
            </p>
            {t.department_fallback_note ? (
              <p className={`${BODY_MUTED} mt-2`}>{t.department_fallback_note}</p>
            ) : null}
            <p className={`${META} text-slate-500 mt-2`}>{copy.rtoRealitySource}</p>
          </>
        }
      />
      <ContrastDualRow
        left={
          <>
            <h3 className={`${SECTION_TITLE} text-emerald-400 mb-2 flex items-center`}>
              <CheckCircle2 className="w-5 h-5 mr-1.5" />
              {copy.nextTitle}
            </h3>
            <p className="text-2xl font-black text-white leading-snug">
              {t.next_title_1_3yr || '—'}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>
              {t.career_path_basis?.trim() || copy.nextTitleBasisFallback}
            </p>
            <p className={`${META} text-slate-500 mt-2`}>{copy.noSalaryOnPage}</p>
          </>
        }
        right={
          <>
            <h3 className={`${SECTION_TITLE} text-violet-300 mb-2 flex items-center`}>
              <AlertTriangle className="w-5 h-5 mr-1.5" />
              {copy.promotionGaps}
            </h3>
            <BulletList
              items={
                t.promotion_skill_gaps.length
                  ? t.promotion_skill_gaps
                  : ['—']
              }
              tone="violet"
            />
          </>
        }
      />
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.downgradeTitle}</p>
            <p className={`${BODY_MUTED} leading-relaxed`}>{copy.downgradeNote}</p>
          </>
        }
      />
    </GuideSlideShell>
  );
}

function Page3({ report, copy }: { report: FullReport; copy: GuideUiCopy }) {
  const c = companyTruthOrEmpty(report);
  const layoffDisplay =
    c.layoff_legal_flags.length > 0
      ? c.layoff_legal_flags
      : [copy.noLayoffRecord];

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page3Of}
        title={copy.page3Title}
        badge={c.forum_sample_thin ? copy.badgeForumThin : copy.badgeRiskAudit}
        badgeTone={c.forum_sample_thin ? 'amber' : 'emerald'}
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>{copy.currentStrategy}</p>
            <p className={`${META} text-slate-500 mb-2`}>{copy.currentStrategyHint}</p>
            <p className={`${BODY} text-slate-100 font-semibold leading-relaxed`}>
              {c.current_strategy}
            </p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>{copy.competitors}</p>
            <p className={`${META} text-slate-500 mb-2`}>{copy.competitorsHint}</p>
            {c.competitors.length > 0 ? (
              <ul className="space-y-2.5">
                {c.competitors.slice(0, 3).map((comp, i) => (
                  <li key={i} className={`${BODY} text-slate-200`}>
                    <span className="font-bold text-emerald-100">{comp.name}</span>
                    {comp.strengths ? (
                      <span className="block text-slate-300 mt-0.5">
                        {copy.strengthLabel}{comp.strengths}
                      </span>
                    ) : null}
                    {comp.weaknesses ? (
                      <span className="block text-slate-400 mt-0.5">
                        {copy.weaknessLabel}{comp.weaknesses}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${BODY} text-slate-500`}>—</p>
            )}
          </>
        }
      />
      <DetailDualRow
        leftAccent="violet"
        rightAccent="amber"
        left={
          <>
            <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>{copy.insiderVoice}</p>
            {c.forum_sample_thin ? (
              <div className="mb-2">
                <InsufficientDataBadge label={copy.forumThinBadge} />
              </div>
            ) : null}
            <BulletList
              items={
                c.insider_voice.length
                  ? c.insider_voice
                  : [copy.forumThinFallback]
              }
              tone="violet"
            />
            <p className={`${META} text-slate-500 mt-2`}>{copy.insiderHint}</p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-amber-200 mb-2`}>{copy.layoffLegal}</p>
            <BulletList items={layoffDisplay} tone="amber" />
          </>
        }
      />
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>{copy.strategyQuestions}</p>
            <p className={`${BODY_MUTED} mb-2`}>{copy.strategyQuestionsNote}</p>
            <BulletList
              items={
                c.interviewer_strategy_questions.length
                  ? c.interviewer_strategy_questions
                  : ['—']
              }
              tone="indigo"
            />
          </>
        }
      />
    </GuideSlideShell>
  );
}

function enrichQuestionCard(
  q: InterviewQuestionCard,
  playbook: FullReport['interview_playbook'],
  concerns: FullReport['concerns_defenses'],
): InterviewQuestionCard {
  const cat =
    q.category || (isBehavioral(q.question) ? 'behavioral' : 'technical');
  const template = playbook?.star_templates?.find(
    (tmpl) => tmpl.for_question && q.question.includes(tmpl.for_question.slice(0, 24)),
  );
  const concern = (concerns ?? []).find((c) =>
    q.question.toLowerCase().includes(c.concern.toLowerCase().slice(0, 12)),
  );
  const isReported = q.predicted === false || Boolean(q.source_url);
  return {
    ...q,
    predicted: isReported ? false : true,
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
}

/** Exactly 5 cards per column: reported (full STAR) first, then system analysis. */
function takeFiveForCategory(
  enriched: InterviewQuestionCard[],
  category: 'behavioral' | 'technical',
  pads: InterviewQuestionCard[],
): InterviewQuestionCard[] {
  const primary = enriched.filter((q) => q.category === category);
  const out = [...primary];
  for (const pad of pads) {
    if (out.length >= 5) break;
    if (out.some((q) => q.question === pad.question)) continue;
    out.push({ ...pad, category, predicted: true });
  }
  return out.slice(0, 5);
}

function Page4({
  report,
  copy,
  language,
}: {
  report: FullReport;
  copy: GuideUiCopy;
  language: AppLanguage;
}) {
  const offer = report.offer_strategy;
  const expected = report.expected_offer;
  const offerRange = formatOfferRange(expected);
  const predictedOffer = formatPredictedOffer(expected);
  const seatMedian = expected?.p50?.trim() && expected.p50.trim() !== '—'
    ? expected.p50.trim()
    : null;
  const tc = offer?.tc_breakdown || expected?.tc_breakdown;
  const playbook = report.interview_playbook;

  const { behavioral, technical } = useMemo(() => {
    const predicted = playbook?.predicted?.length
      ? playbook.predicted
      : (report.custom_star_interview_bank || []).map(
          (question): InterviewQuestionCard => ({ question, predicted: true }),
        );
    const reported = playbook?.reported ?? [];
    // All reported + predicted get full STAR write-ups — no list-only dump.
    const merged = [
      ...reported.map((q) => ({ ...q, predicted: false as const })),
      ...predicted,
    ].map((q) => enrichQuestionCard(q, playbook, report.concerns_defenses));

    const pads: InterviewQuestionCard[] = [
      ...(report.interview_starters ?? []).map(
        (question): InterviewQuestionCard => ({
          question,
          predicted: true,
          interviewer_intent: 'Likely probe from resume↔JD gaps.',
          star_blueprint: 'S → T → A → R with one resume proof point.',
          dos_donts: 'Stay inside verified resume facts.',
        }),
      ),
      ...(report.concerns_defenses ?? []).map(
        (c): InterviewQuestionCard => ({
          question: c.concern,
          predicted: true,
          interviewer_intent: c.why,
          star_blueprint: c.answer_guide,
          dos_donts: c.do_not_claim,
        }),
      ),
      ...(report.proof_map?.gaps ?? []).map(
        (g): InterviewQuestionCard => ({
          question: g.gap,
          predicted: true,
          interviewer_intent: g.description || 'Gap screeners will probe.',
          star_blueprint: 'S → T → A → R bridging adjacent proof to this gap.',
          dos_donts: 'Do not invent experience you do not have.',
        }),
      ),
    ];

    return {
      behavioral: takeFiveForCategory(merged, 'behavioral', pads),
      technical: takeFiveForCategory(merged, 'technical', pads),
    };
  }, [
    playbook,
    report.custom_star_interview_bank,
    report.concerns_defenses,
    report.interview_starters,
    report.proof_map?.gaps,
  ]);

  const tcRows = (
    [
      [copy.tcBase, tc?.base],
      [copy.tcRsu, tc?.equity],
      [copy.tcSignOn, tc?.sign_on ?? tc?.bonus],
      ['Total TC', tc?.total],
    ] as const
  ).filter(([, v]) => Boolean(v?.trim()));

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page4Of}
        title={copy.page4Title}
        badge="HIGH ROI"
        badgeTone="violet"
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>
              {copy.offerRangeTitle}
            </p>
            <p className={`${BODY_MUTED} mb-2 break-words leading-snug`}>
              {[expected?.region, expected?.currency].filter(Boolean).join(' · ') || 'USD'}
              {expected?.evidence_tier
                ? ` · ${evidenceTierLabel(expected.evidence_tier, language)}`
                : ''}
            </p>
            <div className="flex items-center gap-3 min-w-0 mb-3">
              <div className="min-w-0 flex-1">
                {offerRange ? (
                  <>
                    <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none break-words">
                      {offerRange}
                    </p>
                    {seatMedian ? (
                      <p className={`${BODY} text-emerald-100/90 mt-2`}>
                        <span className="text-slate-400 font-semibold">
                          {copy.offerMedianLabel}:{' '}
                        </span>
                        <span className="font-bold tabular-nums text-emerald-50">
                          {seatMedian}
                        </span>
                      </p>
                    ) : null}
                    {expected?.candidate_position_label ? (
                      <p className={`${BODY_MUTED} mt-1.5 leading-snug line-clamp-2`}>
                        {expected.candidate_position_label}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xl font-bold text-slate-200">{copy.noOfferBand}</p>
                )}
              </div>
              {predictedOffer ? (
                <PredictedLandSquircle
                  value={predictedOffer}
                  label={copy.predictedLandLabel}
                  size="sm"
                />
              ) : null}
            </div>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-1.5`}>{copy.tcBreakdown}</p>
            <p className={`${META} text-slate-500 mb-2`}>{copy.tcHint}</p>
            {tcRows.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
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
              <p className={`${BODY} text-slate-500`}>—</p>
            )}
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>{copy.negotiateScript}</p>
            <ol className="space-y-2">
              {[
                {
                  step: copy.prepareStep,
                  body:
                    offer?.discovery_questions?.[0]
                    || offer?.target
                    || '—',
                },
                {
                  step: copy.pitchStep,
                  body:
                    offer?.script?.slice(0, 280)
                    || offer?.acceptable
                    || '—',
                },
                {
                  step: copy.counterStep,
                  body:
                    offer?.walk_away
                    || (offer?.structured_levers?.[0]
                      ? `${offer.structured_levers[0].name}: ${offer.structured_levers[0].note}`
                      : '—'),
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
        left={
          <QuestionAccordion
            items={behavioral}
            title={copy.behavioralTitle}
            titleClass="text-violet-300"
            copy={copy}
          />
        }
        right={
          <QuestionAccordion
            items={technical}
            title={copy.technicalTitle}
            titleClass="text-indigo-300"
            copy={copy}
          />
        }
      />
    </GuideSlideShell>
  );
}

function Page5({ report, copy }: { report: FullReport; copy: GuideUiCopy }) {
  const citations = citationsOrEmpty(report);

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf={copy.page5Of}
        title={copy.page5Title}
        badge="AUDIT TRAIL"
        badgeTone="sky"
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>{copy.ragCount}</p>
            <p className="text-5xl font-black text-white tabular-nums leading-none">
              {citations.length}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>{copy.ragSourcesHint}</p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>{copy.invalidLinkTitle}</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>
              {copy.invalidLinkBody}
              <strong className="text-amber-200">{copy.neverFakeUrl}</strong>
            </p>
            {report.provenance?.invalid_url_count ? (
              <p className={`${BODY} text-amber-200/90 mt-3`}>
                {report.provenance.invalid_url_count}
              </p>
            ) : null}
          </>
        }
      />
      <div className="border-t border-slate-700/90 px-5 py-3.5">
        <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
          <p className={`${SECTION_TITLE} text-indigo-300 mb-3`}>{copy.webReferences}</p>
          {citations.length === 0 ? (
            <div>
              <InsufficientDataBadge label={copy.noDirectUrl} />
              <p className={`${BODY_MUTED} mt-3`}>
                {copy.manualVerifyPrefix}{' '}
                <span className="text-slate-300 font-semibold">
                  {report.company_name} Glassdoor Blind Levels.fyi layoff
                </span>
              </p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
              {citations.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-700/80 bg-black/20 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-sky-200">
                      {c.source_badge}
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
                    <p className={`${META} text-amber-200/90 mt-1`}>
                      {copy.manualVerifyPrefix}
                      {c.manual_verify_keywords
                        ? c.manual_verify_keywords
                        : copy.noDirectLinkParen}
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
          <p className={`${BODY_MUTED} leading-relaxed`}>
            Report version: {report.report_version || 'v3'}
            {report.provenance?.validated_at
              ? ` · validated ${report.provenance.validated_at}`
              : ''}
            . {copy.provenanceFooter}
          </p>
        }
      />
    </GuideSlideShell>
  );
}

export default function GuideStrategyPages({
  tab,
  report,
  language = 'en',
}: {
  tab: GuideStrategyTab;
  report: FullReport;
  language?: AppLanguage | string;
}) {
  const lang = normalizeReportLanguage(language);
  const copy = getGuideUiCopy(lang);
  if (tab === 'hiring') return <Page2 report={report} copy={copy} />;
  if (tab === 'interview') return <Page3 report={report} copy={copy} />;
  if (tab === 'salary') return <Page4 report={report} copy={copy} language={lang} />;
  return <Page5 report={report} copy={copy} />;
}
