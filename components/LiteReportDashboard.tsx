'use client';

import React from 'react';
import type { HardFilterStatus, LiteReport } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  Target,
  DollarSign,
  Home,
  RotateCcw,
  FileQuestion,
  Sparkles,
  Building2,
  Briefcase,
  ListChecks,
  Shield,
  Compass,
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { AppLanguage } from '@/lib/language-context';
import { getScoreInfo } from '@/components/AnalysisDashboard';
import { startCheckout } from '@/lib/checkout-client';

interface LiteReportDashboardProps {
  report: LiteReport;
  language?: AppLanguage;
  onNewAnalysis?: () => void;
  embedded?: boolean;
}

type Copy = {
  newAnalysis: string;
  backHome: string;
  fitHero: string;
  offerHero: string;
  evidenceCoverage: string;
  hardFilter: string;
  strengths: string;
  gaps: string;
  resumeActions: string;
  sharpVerdict: string;
  applyDecision: string;
  nextAction: string;
  roleRead: string;
  interviewStarters: string;
  postedRange: string;
  targetGap: string;
  evidenceTier: string;
  upgradeTitle: string;
  upgradeDesc: string;
  upgradeBtn: string;
  liteBadge: string;
  completeness: string;
};

const en: Copy = {
  newAnalysis: 'New Analysis',
  backHome: 'Back to Home',
  fitHero: 'Candidate Fit Score',
  offerHero: 'Expected Offer Range',
  evidenceCoverage: 'Evidence Coverage',
  hardFilter: 'Hard Filter',
  strengths: 'Proof Strengths',
  gaps: 'Critical Gaps',
  resumeActions: 'Resume Actions',
  sharpVerdict: 'Sharp Verdict',
  applyDecision: 'Apply Decision',
  nextAction: 'Next best action',
  roleRead: 'Role Read',
  interviewStarters: 'Predicted Interview Starters',
  postedRange: 'Posted range',
  targetGap: 'Target gap',
  evidenceTier: 'Evidence tier',
  upgradeTitle: 'Need interview strategy?',
  upgradeDesc:
    'Snapshot answers fit + offer. Interview Strategy Guide adds hiring context, concerns & defenses, reported vs predicted questions, and offer strategy.',
  upgradeBtn: 'Upgrade to Interview Strategy Guide · $9.99',
  liteBadge: 'Job Fit Snapshot',
  completeness: 'Data completeness',
};

const copy: Record<AppLanguage, Copy> = {
  en,
  'zh-TW': {
    ...en,
    newAnalysis: '重新分析',
    backHome: '回首頁',
    fitHero: '候選人匹配分數',
    offerHero: '預期薪酬區間',
    evidenceCoverage: '證據覆蓋度',
    hardFilter: '硬性條件',
    strengths: '可證明優勢',
    gaps: '關鍵缺口',
    resumeActions: '履歷動作',
    sharpVerdict: '一針見血',
    applyDecision: '投遞決策',
    nextAction: '下一步',
    roleRead: '職位解讀',
    interviewStarters: '預測面試題',
    postedRange: '職缺標示薪資',
    targetGap: '目標差距',
    evidenceTier: '薪資證據等級',
    upgradeTitle: '需要面試作戰策略？',
    upgradeDesc:
      'Snapshot 回答匹配與預期薪資。Interview Strategy Guide 加上招募情境、疑慮防禦、真實／預測面試題與談薪策略。',
    upgradeBtn: '升級 Interview Strategy Guide · $9.99',
    liteBadge: 'Job Fit Snapshot',
    completeness: '資料完整度',
  },
  'zh-CN': {
    ...en,
    newAnalysis: '重新分析',
    backHome: '回首页',
    fitHero: '候选人匹配分数',
    offerHero: '预期薪酬区间',
    liteBadge: 'Job Fit Snapshot',
  },
  es: { ...en, liteBadge: 'Job Fit Snapshot' },
  hi: { ...en, liteBadge: 'Job Fit Snapshot' },
  ar: { ...en, liteBadge: 'Job Fit Snapshot' },
};

function hardFilterTone(status: HardFilterStatus): string {
  switch (status) {
    case 'Pass':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Risk':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Blocked':
      return 'bg-red-500/15 text-red-300 border-red-500/30';
    default:
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  }
}

function applyTone(label: string): string {
  if (label === 'Apply now') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  if (label === 'Skip') return 'border-red-500/40 bg-red-500/10 text-red-200';
  if (label === 'Clarify first') return 'border-amber-500/40 bg-amber-500/10 text-amber-100';
  return 'border-indigo-500/40 bg-indigo-500/10 text-indigo-100';
}

function displayMoney(v: string | null | undefined): string {
  return v && v.trim() ? v : '—';
}

export default function LiteReportDashboard({
  report,
  language = 'en',
  onNewAnalysis,
  embedded = false,
}: LiteReportDashboardProps) {
  const t = copy[language] ?? copy.en;
  const score = report.fit_score?.score ?? report.match_score ?? 0;
  const scoreInfo = getScoreInfo(score, language);
  const band = report.fit_score?.band ?? scoreInfo.level;
  const scoreData = [{ name: 'Score', value: score, fill: scoreInfo.fill }];
  const [checkoutBusy, setCheckoutBusy] = React.useState(false);

  const strengths = report.proof_map?.strengths ?? report.matching_strengths ?? [];
  const gaps = report.proof_map?.gaps ?? report.critical_gaps ?? [];
  const hardItems = report.hard_filter?.items ?? [];
  const offer = report.expected_offer;

  const handleBack = () => {
    if (onNewAnalysis) {
      onNewAnalysis();
      return;
    }
    window.location.href = '/';
  };

  const handleUpgrade = async () => {
    setCheckoutBusy(true);
    await startCheckout('single_interview_strategy_guide');
    setCheckoutBusy(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!embedded && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors active:scale-95"
          >
            <Home className="w-4 h-4" />
            {t.backHome}
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20 transition-colors active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            {t.newAnalysis}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">{t.liteBadge}</p>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
              {report.job_title || 'Unknown Role'}
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              {report.company_name || 'Unknown Company'}
            </p>
          </div>
          {report.data_completeness && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">{t.completeness}</p>
              <p className="text-sm font-semibold text-slate-200">{report.data_completeness.level}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dual heroes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400/90 mb-4">{t.fitHero}</p>
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex flex-col items-center shrink-0">
              {scoreInfo.icon}
              <span className={`text-sm font-bold mt-2 ${scoreInfo.color}`}>{band}</span>
            </div>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  barSize={10}
                  data={scoreData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={30} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-4xl font-black ${scoreInfo.color}`}>{score}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">/ 100</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded border border-slate-600 text-slate-300">
              {t.evidenceCoverage}: {report.fit_score?.evidence_coverage ?? '—'}
            </span>
            <span
              className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded border ${hardFilterTone(
                report.hard_filter?.status ?? 'Unknown',
              )}`}
            >
              {t.hardFilter}: {report.hard_filter?.status ?? 'Unknown'}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {report.fit_score?.sharp_verdict
              || report.one_sentence_sharp_critique
              || report.recruiter_verdict
              || ''}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/90 mb-1 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {t.offerHero}
          </p>
          <p className="text-[11px] text-slate-500 mb-4">
            {t.evidenceTier} {offer?.evidence_tier ?? 'D'}
            {offer?.region ? ` · ${offer.region}` : ''}
            {offer?.currency ? ` · ${offer.currency}` : ''}
          </p>
          {offer?.posted_range && (
            <p className="text-xs text-slate-400 mb-3">
              {t.postedRange}: <span className="text-slate-200">{offer.posted_range}</span>
            </p>
          )}
          <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-slate-500 mb-1">P25</p>
              <p className="font-medium text-white">{displayMoney(offer?.p25)}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <p className="text-xs text-emerald-300 mb-1 font-bold">P50</p>
              <p className="font-semibold text-white text-base">{displayMoney(offer?.p50)}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-slate-500 mb-1">P75</p>
              <p className="font-medium text-white">{displayMoney(offer?.p75)}</p>
            </div>
          </div>
          {offer?.candidate_position_label && (
            <p className="text-sm text-emerald-100/90 mb-2 leading-relaxed">{offer.candidate_position_label}</p>
          )}
          {offer?.target_gap && (
            <div className="rounded-lg bg-slate-900/50 p-3 mt-auto">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">{t.targetGap}</p>
              <p className="text-sm text-slate-300 leading-relaxed">{offer.target_gap}</p>
            </div>
          )}
          {(offer?.sources?.length ?? 0) > 0 && (
            <p className="text-[11px] text-slate-500 mt-3">
              Sources: {offer!.sources.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Apply decision */}
      {report.apply_decision && (
        <div className={`rounded-xl border p-5 ${applyTone(report.apply_decision.label)}`}>
          <div className="flex items-start gap-3">
            <Compass className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">{t.applyDecision}</p>
              <p className="text-lg font-black mb-1">{report.apply_decision.label}</p>
              <p className="text-sm leading-relaxed opacity-90">{report.apply_decision.reason}</p>
              {report.apply_decision.next_best_action && (
                <p className="text-sm mt-2 opacity-80">
                  <span className="font-semibold">{t.nextAction}: </span>
                  {report.apply_decision.next_best_action}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proof map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t.strengths}
          </h3>
          <ul className="space-y-3">
            {strengths.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mt-2 mr-3 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-200">{item.point}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center uppercase tracking-wide">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {t.gaps}
          </h3>
          <ul className="space-y-3">
            {gaps.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mt-2 mr-3 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-200">{item.gap}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(report.proof_map?.resume_actions?.length ?? 0) > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            {t.resumeActions}
          </h3>
          <ol className="space-y-2 list-decimal list-inside">
            {report.proof_map!.resume_actions.map((a, i) => (
              <li key={i} className="text-sm text-slate-300 leading-relaxed">
                {a}
              </li>
            ))}
          </ol>
          {report.proof_map?.screenability_note && (
            <p className="text-xs text-slate-500 mt-3">{report.proof_map.screenability_note}</p>
          )}
        </div>
      )}

      {hardItems.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-indigo-400" />
            {t.hardFilter}
          </h3>
          <ul className="space-y-3">
            {hardItems.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700/50"
              >
                <div>
                  <span className="text-sm text-slate-300">{item.requirement}</span>
                  {item.evidence && (
                    <p className="text-xs text-slate-500 mt-1">{item.evidence}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${hardFilterTone(
                    (['Pass', 'Risk', 'Blocked', 'Unknown'].includes(String(item.status))
                      ? item.status
                      : item.status === 'met'
                        ? 'Pass'
                        : item.status === 'missing'
                          ? 'Blocked'
                          : 'Risk') as HardFilterStatus,
                  )}`}
                >
                  {String(item.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.role_read?.mission && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" />
            {t.roleRead}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-3">{report.role_read.mission}</p>
          {(report.role_read.responsibilities?.length ?? 0) > 0 && (
            <ul className="space-y-1 mb-2">
              {report.role_read.responsibilities.map((r, i) => (
                <li key={i} className="text-sm text-slate-400">
                  · {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(report.interview_starters?.length ?? 0) > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-violet-400" />
            {t.interviewStarters}
          </h3>
          <ol className="space-y-3 list-decimal list-inside">
            {report.interview_starters.map((q, idx) => (
              <li key={idx} className="text-sm text-slate-300 leading-relaxed pl-1">
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}

      {!embedded && (
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/80 to-indigo-950/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              {t.upgradeTitle}
            </p>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">{t.upgradeDesc}</p>
          </div>
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={handleUpgrade}
            className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-5 py-3 text-sm font-bold text-white transition-colors"
          >
            {checkoutBusy ? '…' : t.upgradeBtn}
          </button>
        </div>
      )}
    </div>
  );
}
