'use client';

import React from 'react';
import Link from 'next/link';
import type { LiteReport, HardRequirementStatus } from '@/types';
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
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { AppLanguage } from '@/lib/language-context';
import { getScoreInfo } from '@/components/AnalysisDashboard';
import { startCheckout } from '@/lib/checkout-client';

interface LiteReportDashboardProps {
  report: LiteReport;
  language?: AppLanguage;
  onNewAnalysis?: () => void;
}

type Copy = {
  newAnalysis: string;
  backHome: string;
  matchSection: string;
  strengths: string;
  gaps: string;
  sharpCritique: string;
  recruiterVerdict: string;
  hardReqs: string;
  interviewStarters: string;
  compensation: string;
  flsa: string;
  upgradeTitle: string;
  upgradeDesc: string;
  upgradeBtn: string;
  liteBadge: string;
  met: string;
  partial: string;
  missing: string;
};

const copy: Record<AppLanguage, Copy> = {
  'zh-TW': {
    newAnalysis: '重新分析',
    backHome: '回首頁',
    matchSection: '職位匹配分析',
    strengths: '核心優勢',
    gaps: '待補強項目',
    sharpCritique: '一針見血',
    recruiterVerdict: '人資判斷',
    hardReqs: '硬性條件檢核',
    interviewStarters: '預測面試題（依 JD）',
    compensation: 'Radford 2026 薪酬矩陣',
    flsa: 'FLSA 分類',
    upgradeTitle: '需要 Blind / Glassdoor 即時情報？',
    upgradeDesc: 'Lite 僅分析 JD + 履歷。升級 Full 可取得網路情報、文化黑箱與 STAR 面試題庫。',
    upgradeBtn: '升級 Full 報告 · $9.99',
    liteBadge: 'Lite 快照',
    met: '符合',
    partial: '部分',
    missing: '缺失',
  },
  'zh-CN': {
    newAnalysis: '重新分析',
    backHome: '回首页',
    matchSection: '职位匹配分析',
    strengths: '核心优势',
    gaps: '待补强项目',
    sharpCritique: '一针见血',
    recruiterVerdict: '人资判断',
    hardReqs: '硬性条件检核',
    interviewStarters: '预测面试题（依 JD）',
    compensation: 'Radford 2026 薪酬矩阵',
    flsa: 'FLSA 分类',
    upgradeTitle: '需要 Blind / Glassdoor 即时情报？',
    upgradeDesc: 'Lite 仅分析 JD + 简历。升级 Full 可取得网络情报、文化黑箱与 STAR 面试题库。',
    upgradeBtn: '升级 Full 报告 · $9.99',
    liteBadge: 'Lite 快照',
    met: '符合',
    partial: '部分',
    missing: '缺失',
  },
  en: {
    newAnalysis: 'New Analysis',
    backHome: 'Back to Home',
    matchSection: 'Job Match Analysis',
    strengths: 'Core Strengths',
    gaps: 'Critical Gaps',
    sharpCritique: 'Sharp Critique',
    recruiterVerdict: 'Recruiter Verdict',
    hardReqs: 'Hard Requirements Check',
    interviewStarters: 'Predicted Interview Questions (JD-based)',
    compensation: 'Radford 2026 Compensation Matrix',
    flsa: 'FLSA Classification',
    upgradeTitle: 'Need live Blind / Glassdoor intel?',
    upgradeDesc:
      'Lite uses JD + resume only. Full adds web grounding, culture blackbox, and a STAR interview bank.',
    upgradeBtn: 'Upgrade to Full · $9.99',
    liteBadge: 'Lite Snapshot',
    met: 'Met',
    partial: 'Partial',
    missing: 'Missing',
  },
  es: {
    newAnalysis: 'Nuevo análisis',
    backHome: 'Inicio',
    matchSection: 'Análisis de coincidencia',
    strengths: 'Fortalezas',
    gaps: 'Brechas críticas',
    sharpCritique: 'Crítica directa',
    recruiterVerdict: 'Veredicto del reclutador',
    hardReqs: 'Requisitos obligatorios',
    interviewStarters: 'Preguntas de entrevista previstas',
    compensation: 'Matriz salarial Radford 2026',
    flsa: 'Clasificación FLSA',
    upgradeTitle: '¿Necesitas intel en vivo?',
    upgradeDesc: 'Lite: JD + CV. Full: web + cultura + banco STAR.',
    upgradeBtn: 'Full · $9.99',
    liteBadge: 'Instantánea Lite',
    met: 'Cumple',
    partial: 'Parcial',
    missing: 'Falta',
  },
  hi: {
    newAnalysis: 'नया विश्लेषण',
    backHome: 'होम',
    matchSection: 'नौकरी मिलान',
    strengths: 'मुख्य ताकत',
    gaps: 'महत्वपूर्ण अंतर',
    sharpCritique: 'तीखी आलोचना',
    recruiterVerdict: 'भर्ती निर्णय',
    hardReqs: 'कठोर आवश्यकताएँ',
    interviewStarters: 'अनुमानित साक्षात्कार प्रश्न',
    compensation: 'Radford 2026 वेतन',
    flsa: 'FLSA',
    upgradeTitle: 'लाइव इंटेल चाहिए?',
    upgradeDesc: 'Lite: JD + रिज़्यूमे। Full: वेब + संस्कृति + STAR।',
    upgradeBtn: 'Full · $9.99',
    liteBadge: 'Lite स्नैपशॉट',
    met: 'पूरा',
    partial: 'आंशिक',
    missing: 'अनुपस्थित',
  },
  ar: {
    newAnalysis: 'تحليل جديد',
    backHome: 'الرئيسية',
    matchSection: 'تحليل التوافق',
    strengths: 'نقاط القوة',
    gaps: 'الفجوات الحرجة',
    sharpCritique: 'نقد حاد',
    recruiterVerdict: 'حكم المسؤول عن التوظيف',
    hardReqs: 'المتطلبات الصلبة',
    interviewStarters: 'أسئلة مقابلة متوقعة',
    compensation: 'مصفوفة Radford 2026',
    flsa: 'تصنيف FLSA',
    upgradeTitle: 'تحتاج معلومات مباشرة؟',
    upgradeDesc: 'Lite: JD + السيرة. Full: ويب + ثقافة + STAR.',
    upgradeBtn: 'Full · $9.99',
    liteBadge: 'لمحة Lite',
    met: 'متحقق',
    partial: 'جزئي',
    missing: 'مفقود',
  },
};

function statusBadge(status: HardRequirementStatus, labels: Copy) {
  const map = {
    met: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    partial: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    missing: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  const label = status === 'met' ? labels.met : status === 'partial' ? labels.partial : labels.missing;
  return (
    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${map[status]}`}>
      {label}
    </span>
  );
}

export default function LiteReportDashboard({
  report,
  language = 'en',
  onNewAnalysis,
}: LiteReportDashboardProps) {
  const t = copy[language] ?? copy.en;
  const scoreInfo = getScoreInfo(report.match_score, language);
  const tierName = report.dog_breed_archetype || scoreInfo.level;
  const scoreData = [{ name: 'Score', value: report.match_score, fill: scoreInfo.fill }];
  const [checkoutBusy, setCheckoutBusy] = React.useState(false);

  const handleUpgrade = async () => {
    setCheckoutBusy(true);
    await startCheckout('single_full');
    setCheckoutBusy(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Home className="w-4 h-4" />
          {t.backHome}
        </Link>
        {onNewAnalysis ? (
          <button
            type="button"
            onClick={onNewAnalysis}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t.newAnalysis}
          </button>
        ) : null}
      </div>

      {/* Job header */}
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
        </div>
      </div>

      {/* Match grid — mirrors legacy AnalysisDashboard */}
      <div className="space-y-4">
        <div className="flex items-center">
          <span className="w-1.5 h-6 bg-yellow-500 rounded-full mr-3" />
          <h2 className="text-xl font-bold text-white">{t.matchSection}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col items-center">
            <div className="flex items-center justify-center w-full mt-4 mb-6 space-x-6">
              <div className="flex flex-col items-center shrink-0">
                {scoreInfo.icon}
                <span className={`text-sm font-bold mt-2 ${scoreInfo.color}`}>{tierName}</span>
              </div>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={10} data={scoreData} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={30} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-4xl font-black ${scoreInfo.color}`}>{report.match_score}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Score</span>
                </div>
              </div>
            </div>
            <p className={`text-lg font-bold ${scoreInfo.color} text-center`}>{scoreInfo.label}</p>
            <p className="text-sm text-slate-400 text-center mt-2 px-2 leading-relaxed">{scoreInfo.description}</p>
            {report.recruiter_verdict && (
              <div className="w-full mt-4 p-3 rounded-lg border border-slate-600/50 bg-slate-900/40 text-left">
                <p className="text-xs font-bold text-amber-500/90 uppercase tracking-wide mb-1">{t.recruiterVerdict}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{report.recruiter_verdict}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-700">
              <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t.strengths}
              </h3>
              <ul className="space-y-3">
                {(report.matching_strengths || []).map((item, idx) => (
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
            <div className="flex-1 p-6 bg-slate-800/50">
              <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {t.gaps}
              </h3>
              <ul className="space-y-3">
                {(report.critical_gaps || []).map((item, idx) => (
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
        </div>
      </div>

      {/* Sharp critique */}
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5">
        <p className="text-xs text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1 font-bold">
          <Target className="w-4 h-4" />
          {t.sharpCritique}
        </p>
        <p className="text-sm leading-relaxed text-red-100/90">{report.one_sentence_sharp_critique}</p>
      </div>

      {/* Hard requirements */}
      {(report.hard_requirements_checklist?.length ?? 0) > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-indigo-400" />
            {t.hardReqs}
          </h3>
          <ul className="space-y-3">
            {report.hard_requirements_checklist.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
                <span className="text-sm text-slate-300">{item.requirement}</span>
                {statusBadge(item.status, t)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interview starters */}
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

      {/* Compensation + FLSA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1 font-bold">
            <DollarSign className="w-4 h-4" />
            {t.compensation}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-slate-500 mb-1">25th</p>
              <p className="font-medium text-white">{report.radford_2026_compensation_matrix.tier_25th_low}</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-slate-500 mb-1">50th</p>
              <p className="font-semibold text-white">{report.radford_2026_compensation_matrix.tier_50th_mid}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs text-slate-500 mb-1">75th</p>
              <p className="font-medium text-white">{report.radford_2026_compensation_matrix.tier_75th_high}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">{t.flsa}</p>
          <p className="text-lg font-semibold text-white">{report.flsa_status}</p>
        </div>
      </div>

      {/* Full upgrade CTA */}
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
    </div>
  );
}
