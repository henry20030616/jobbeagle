'use client';

/**
 * Interview Strategy Guide Pages 2–5 — Excel《Jobbeagle報告範圍》A–E 原稿。
 * Layout mirrors Page 1. No invented sections. No $ salary on Pages 2–3.
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

function roleTeamOrEmpty(report: FullReport): RoleTeamInsights {
  if (report.role_team_insights) return report.role_team_insights;
  return {
    role_content_refined: report.role_read?.responsibilities?.slice(0, 6) ?? [],
    requirements_refined: report.role_read?.hiring_signals?.slice(0, 6) ?? [],
    rto_official: 'Not stated on JD',
    rto_employee_reality: '該團隊公開樣本不足',
    next_title_1_3yr: '',
    promotion_skill_gaps: (report.proof_map?.gaps ?? []).slice(0, 3).map((g) => g.gap),
    team_sample_insufficient: true,
    department_fallback_note:
      'Public sample for this specific team is insufficient — validate with the hiring manager.',
  };
}

function companyTruthOrEmpty(report: FullReport): CompanyTruth {
  if (report.company_truth) return report.company_truth;
  const insights = report.hiring_context?.insights ?? [];
  return {
    current_strategy:
      insights[0]?.claim || 'No current-strategy public signal — do not invent company history.',
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
      <p className={`${SECTION_TITLE} ${titleClass} mb-2`}>
        {title}{' '}
        <span className="text-slate-500 font-semibold normal-case tracking-normal">
          ({items.length})
        </span>
      </p>
      <div className="space-y-2">
        {items.map((q, i) => {
          const expanded = open === i;
          const isGuess = q.predicted !== false && !q.source_url;
          const blueprint =
            q.star_blueprint
            || q.star_outline
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
                <span className="min-w-0 flex-1">
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {isGuess ? (
                      <span className="rounded border border-amber-400/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                        猜題 Predicted
                      </span>
                    ) : (
                      <span className="rounded border border-emerald-400/50 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                        真題 Reported
                      </span>
                    )}
                    <span className={`${BODY} font-semibold text-slate-100`}>{q.question}</span>
                  </span>
                </span>
              </button>
              {expanded ? (
                <div className="border-t border-slate-700/80 px-3 py-3 space-y-2">
                  <p className={BODY_MUTED}>
                    <span className="font-semibold text-slate-300">考察意圖 Intent: </span>
                    {q.interviewer_intent || q.evidence || '—'}
                  </p>
                  <p className={`${BODY} text-slate-200 whitespace-pre-wrap`}>
                    <span className="font-semibold text-indigo-200">STAR 大綱: </span>
                    {blueprint}
                  </p>
                  <p className={BODY_MUTED}>
                    <span className="font-semibold text-amber-200">Do&apos;s &amp; Don&apos;ts: </span>
                    {q.dos_donts || 'Do not invent resume facts; stay inside verified experience.'}
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

/** Excel B — 職位與團隊現況 */
function Page2({ report }: { report: FullReport }) {
  const t = roleTeamOrEmpty(report);

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf="PAGE 2 OF 5 · Excel B"
        title="職位與團隊現況"
        badge={t.team_sample_insufficient ? '樣本不足' : 'TEAM SIGNALS'}
        badgeTone={t.team_sample_insufficient ? 'amber' : 'sky'}
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>
              職位內容（重構精練）
            </p>
            <p className={`${META} text-slate-500 mb-2`}>嚴禁照抄 JD 原文</p>
            <BulletList
              items={
                t.role_content_refined.length
                  ? t.role_content_refined
                  : ['Role content not extracted in this run.']
              }
              tone="indigo"
            />
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>
              要求條件（重構精練）
            </p>
            <BulletList
              items={
                t.requirements_refined.length
                  ? t.requirements_refined
                  : ['Requirements not extracted in this run.']
              }
              tone="emerald"
            />
          </>
        }
      />
      <DetailDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>
              工作型態 / RTO（官方）
            </p>
            <p className={`${BODY} text-slate-100 font-semibold leading-relaxed`}>
              {t.rto_official || 'Not stated on JD'}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>來源：JD / Company Career Page</p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>
              真實體感（加班 / WLB）
            </p>
            {t.team_sample_insufficient ? (
              <div className="mb-2">
                <InsufficientDataBadge label="該團隊公開樣本不足" />
              </div>
            ) : null}
            <p className={`${BODY} text-slate-200 leading-relaxed`}>
              {t.rto_employee_reality}
            </p>
            {t.department_fallback_note ? (
              <p className={`${BODY_MUTED} mt-2`}>{t.department_fallback_note}</p>
            ) : null}
            <p className={`${META} text-slate-500 mt-2`}>
              來源：LinkedIn / Glassdoor / 論壇（非官方 PR）
            </p>
          </>
        }
      />
      <ContrastDualRow
        left={
          <>
            <h3 className={`${SECTION_TITLE} text-emerald-400 mb-2 flex items-center`}>
              <CheckCircle2 className="w-5 h-5 mr-1.5" />
              1–3 年下一階段職銜
            </h3>
            <p className="text-2xl font-black text-white leading-snug">
              {t.next_title_1_3yr || 'Validate leveling path with hiring manager'}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>
              嚴禁出現任何具體薪資金額（薪資見 Page 1 / Page 4）
            </p>
          </>
        }
        right={
          <>
            <h3 className={`${SECTION_TITLE} text-violet-300 mb-2 flex items-center`}>
              <AlertTriangle className="w-5 h-5 mr-1.5" />
              升遷核心能力缺口
            </h3>
            <BulletList
              items={
                t.promotion_skill_gaps.length
                  ? t.promotion_skill_gaps
                  : ['Promotion skill gaps not extracted — ask HM what “next level” looks like.']
              }
              tone="violet"
            />
          </>
        }
      />
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>降級說明</p>
            <p className={`${BODY_MUTED} leading-relaxed`}>
              若該特定 Team/職位在網路上無公開評價：降級為同部門/同職等整體風向，或標註「該團隊公開樣本不足」。不得編造團隊八卦。
            </p>
          </>
        }
      />
    </GuideSlideShell>
  );
}

/** Excel C — 公司真相與風險 */
function Page3({ report }: { report: FullReport }) {
  const c = companyTruthOrEmpty(report);
  const layoffDisplay =
    c.layoff_legal_flags.length > 0
      ? c.layoff_legal_flags
      : ['無顯著公開違法/裁員紀錄'];

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf="PAGE 3 OF 5 · Excel C"
        title="公司真相與風險"
        badge={c.forum_sample_thin ? '論壇聲量少' : 'RISK AUDIT'}
        badgeTone={c.forum_sample_thin ? 'amber' : 'emerald'}
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>
              當前核心戰略（非維基歷史）
            </p>
            <p className={`${BODY} text-slate-100 font-semibold leading-relaxed`}>
              {c.current_strategy}
            </p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>
              主要競爭對手（2–3）與競合優劣勢
            </p>
            {c.competitors.length > 0 ? (
              <ul className="space-y-2.5">
                {c.competitors.slice(0, 3).map((comp, i) => (
                  <li key={i} className={`${BODY} text-slate-200`}>
                    <span className="font-bold text-emerald-100">{comp.name}</span>
                    {comp.strengths ? (
                      <span className="block text-slate-300 mt-0.5">優：{comp.strengths}</span>
                    ) : null}
                    {comp.weaknesses ? (
                      <span className="block text-slate-400 mt-0.5">劣：{comp.weaknesses}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`${BODY} text-slate-500`}>
                Competitor set not extracted — do not invent peer maps.
              </p>
            )}
          </>
        }
      />
      <DetailDualRow
        leftAccent="violet"
        rightAccent="amber"
        left={
          <>
            <p className={`${SECTION_TITLE} text-violet-300 mb-2`}>
              內部人真實聲響（Glassdoor / Blind / Reddit）
            </p>
            {c.forum_sample_thin ? (
              <div className="mb-2">
                <InsufficientDataBadge label="公開論壇聲量較少" />
              </div>
            ) : null}
            <BulletList
              items={
                c.insider_voice.length
                  ? c.insider_voice
                  : ['公開論壇聲量較少 — 不編造風向。']
              }
              tone="violet"
            />
            <p className={`${META} text-slate-500 mt-2`}>過濾官方 PR；聚焦主管風格 / WLB / Toxic</p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-amber-200 mb-2`}>
              Layoff.fyi / 公開訴訟與爭議
            </p>
            <BulletList items={layoffDisplay} tone="amber" />
          </>
        }
      />
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-indigo-300 mb-2`}>
              面試可反問的公司營運戰略問題
            </p>
            <p className={`${BODY_MUTED} mb-2`}>
              降級條款：若無公開違法/裁員紀錄，不得編造；改輸出 2–3 題戰略問題。
            </p>
            <BulletList
              items={
                c.interviewer_strategy_questions.length
                  ? c.interviewer_strategy_questions
                  : [
                      'Why is this role open now — backfill or new initiative?',
                      'What is the 12-month operating priority for this team?',
                      'How has headcount on this org changed in the last year?',
                    ]
              }
              tone="indigo"
            />
          </>
        }
      />
    </GuideSlideShell>
  );
}

/** Excel D — 面試與談薪策略 */
function Page4({ report }: { report: FullReport }) {
  const offer = report.offer_strategy;
  const tc = offer?.tc_breakdown || report.expected_offer?.tc_breakdown;
  const playbook = report.interview_playbook;

  const enriched = useMemo(() => {
    const predicted = playbook?.predicted?.length
      ? playbook.predicted
      : (report.custom_star_interview_bank || []).map(
          (question): InterviewQuestionCard => ({ question, predicted: true }),
        );
    const reported = playbook?.reported ?? [];
    const merged = [
      ...reported.map((q) => ({ ...q, predicted: false as const })),
      ...predicted,
    ];
    return merged.map((q) => {
      const cat =
        q.category || (isBehavioral(q.question) ? 'behavioral' : 'technical');
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
  }, [playbook, report.custom_star_interview_bank, report.concerns_defenses]);

  // Excel D: 3–5 behavioral + 3–5 technical (depth STAR on up to 5 each)
  const behavioral = enriched.filter((q) => q.category === 'behavioral').slice(0, 5);
  const technical = enriched.filter((q) => q.category === 'technical').slice(0, 5);
  const deepIds = new Set(
    [...behavioral, ...technical].map((q) => q.question),
  );
  const realListOnly = (playbook?.reported ?? []).filter(
    (q) => !deepIds.has(q.question),
  );

  const tcRows = (
    [
      ['Base 底薪', tc?.base],
      ['Equity / RSU', tc?.equity],
      ['Sign-on 簽約金', tc?.sign_on ?? tc?.bonus],
      ['Total TC', tc?.total],
    ] as const
  ).filter(([, v]) => Boolean(v?.trim()));

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf="PAGE 4 OF 5 · Excel D"
        title="面試與談薪策略"
        badge="HIGH ROI"
        badgeTone="violet"
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>
              TC 結構拆解（Levels.fyi 等）
            </p>
            <p className={`${META} text-slate-500 mb-2`}>
              Base + 股票/RSU + Sign-on — 市場行情占比
            </p>
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
              <p className={`${BODY} text-slate-500`}>
                TC mix unavailable — use discovery before anchoring (seat band on Page 1).
              </p>
            )}
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>
              談薪腳本（個人 Context）
            </p>
            <ol className="space-y-2">
              {[
                {
                  step: '1. 談薪前準備（錨定點）',
                  body:
                    offer?.discovery_questions?.[0]
                    || offer?.target
                    || 'Confirm approved cash band before sharing a number.',
                },
                {
                  step: '2. 個人價值 Pitch',
                  body:
                    offer?.script?.slice(0, 280)
                    || offer?.acceptable
                    || 'Pitch mid-band once scope is confirmed.',
                },
                {
                  step: '3. 被拒時 Counter',
                  body:
                    offer?.walk_away
                    || (offer?.structured_levers?.[0]
                      ? `${offer.structured_levers[0].name}: ${offer.structured_levers[0].note}`
                      : 'Counter with scope / sign-on / leveling — never invent numbers.'),
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
            title="行為題 Behavioral（3–5）"
            titleClass="text-violet-300"
          />
        }
        right={
          <QuestionAccordion
            items={technical}
            title="專業/案例題 Technical/Case（3–5）"
            titleClass="text-indigo-300"
          />
        }
      />
      <ActionDualRow
        fullWidth={
          <>
            <p className={`${SECTION_TITLE} text-emerald-300 mb-2`}>
              其餘真實面試題清單（僅列出，不逐題 STAR）
            </p>
            {realListOnly.length > 0 ? (
              <ul className="space-y-2">
                {realListOnly.map((q, i) => (
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
                無額外真題清單 — 上方精選題已涵蓋本輪檢索結果。找不到真題時已標「猜題」。
              </p>
            )}
          </>
        }
      />
    </GuideSlideShell>
  );
}

/** Excel E — 參考資料與證據鏈 */
function Page5({ report }: { report: FullReport }) {
  const citations = citationsOrEmpty(report);

  return (
    <GuideSlideShell>
      <PageHeaderBar
        pageOf="PAGE 5 OF 5 · Excel E"
        title="參考資料與證據鏈"
        badge="AUDIT TRAIL"
        badgeTone="sky"
      />
      <HeroDualRow
        left={
          <>
            <p className={`${SECTION_TITLE} text-indigo-400 mb-2`}>RAG 引用條數</p>
            <p className="text-5xl font-black text-white tabular-nums leading-none">
              {citations.length}
            </p>
            <p className={`${BODY_MUTED} mt-2`}>
              Reddit/Blind 討論串、Levels.fyi、Layoff、新聞等原始連結
            </p>
          </>
        }
        right={
          <>
            <p className={`${SECTION_TITLE} text-emerald-400/90 mb-2`}>無效連結處理</p>
            <p className={`${BODY} text-slate-200 leading-relaxed`}>
              若 RAG 檢索不到直接 URL：寫明「檢索數據摘要與建議手動查證關鍵字」，
              <strong className="text-amber-200"> 絕不填充假網址</strong>。
            </p>
            {report.provenance?.invalid_url_count ? (
              <p className={`${BODY} text-amber-200/90 mt-3`}>
                {report.provenance.invalid_url_count} URL(s) failed validation and were downgraded.
              </p>
            ) : null}
          </>
        }
      />
      <div className="border-t border-slate-700/90 px-5 py-3.5">
        <div className="w-full min-w-0 rounded-lg border border-sky-400/50 bg-indigo-500/10 p-4">
          <p className={`${SECTION_TITLE} text-indigo-300 mb-3`}>網路資訊與參考資料</p>
          {citations.length === 0 ? (
            <div>
              <InsufficientDataBadge label="無直接 URL — 請手動查證" />
              <p className={`${BODY_MUTED} mt-3`}>
                檢索數據摘要與建議手動查證關鍵字：{' '}
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
                      檢索數據摘要與建議手動查證關鍵字
                      {c.manual_verify_keywords
                        ? `：${c.manual_verify_keywords}`
                        : '（無直接連結）'}
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
            . 定位：確保可信度，讓求職者可自主深度追蹤原始來源。
          </p>
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
