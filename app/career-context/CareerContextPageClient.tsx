'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Loader2,
  Scale,
  Sparkles,
  Target,
} from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginButton from '@/components/LoginButton';
import BrandLogo from '@/components/BrandLogo';
import CareerContextForm from '@/components/CareerContextForm';
import { FitStage } from '@/components/FitStage';
import { ACCOUNT_DESIGN_WIDTH } from '@/constants/fit-stage';
import type { CareerContext } from '@/types';
import { normalizeCareerContext } from '@/lib/career-context';

export default function CareerContextPageClient() {
  const { language } = useLanguage();
  const zh = language === 'zh-TW' || language === 'zh-CN';
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [initial, setInitial] = useState<CareerContext | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        setSignedIn(false);
        setInitial(null);
        return;
      }
      if (!res.ok) {
        setSignedIn(false);
        setInitial(null);
        return;
      }
      const data = await res.json();
      setSignedIn(true);
      setInitial(normalizeCareerContext(data.profile?.career_context));
    } catch {
      setSignedIn(false);
      setInitial(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const benefits = zh
    ? [
        {
          icon: Compass,
          title: 'Snapshot 用你的標準看職缺',
          body: 'Fit 會對照職級、地點、工作權、不可妥協；薪資落差會拿這份職缺的區間去比你的目標 TC 與走人底線。',
        },
        {
          icon: Scale,
          title: 'Guide 談判對齊同一組底線',
          body: 'Interview Strategy Guide 的目標／可接受／走人，以及談判台詞，會跟你存的數字對齊，而不是只報市場中位數。',
        },
        {
          icon: Sparkles,
          title: '免費、不扣額度',
          body: '存在帳號裡。下次跑分析自動帶入。空白就當沒設，不填也能用產品。',
        },
      ]
    : [
        {
          icon: Compass,
          title: 'Snapshot scores the job against you',
          body: 'Fit uses your level, location, work auth, and deal-breakers. The offer band is compared to your target TC and walk-away — not a generic market midpoint.',
        },
        {
          icon: Scale,
          title: 'Guide negotiation uses the same floors',
          body: 'Interview Strategy Guide target / acceptable / walk-away lines, and the script, align to the numbers you saved.',
        },
        {
          icon: Sparkles,
          title: 'Free. No extra credits.',
          body: 'Saved on your account and injected on the next run. Leave fields blank if you do not want a floor.',
        },
      ];

  const floors = zh
    ? [
        { label: '目標職級', hint: '這份職缺對你是升、平、還是降級' },
        { label: '地點／遠端', hint: '地點或遠端政策有沒有踩線' },
        { label: '工作權', hint: '簽證／sponsorship 會不會卡關' },
        { label: '目標總薪酬', hint: '職缺薪資帶對你的目標是高還是低' },
        { label: '最低底線', hint: '低於這條線就該拒絕或不談' },
        { label: '不可妥協', hint: '值班、加班文化等 deal-breaker' },
        { label: '招牌優勢', hint: '報告優先用這些優勢來看 fit' },
      ]
    : [
        { label: 'Target level', hint: 'Is this role a step up, lateral, or a step down' },
        { label: 'Location / remote', hint: 'Does the site or remote policy fail your bar' },
        { label: 'Work authorization', hint: 'Will visa / sponsorship block you' },
        { label: 'Target TC', hint: 'Is the role’s band above or below your target' },
        { label: 'Walk-away floor', hint: 'Below this line, decline or walk' },
        { label: 'Non-negotiables', hint: 'On-call, unpaid overtime, and other deal-breakers' },
        { label: 'Signature strengths', hint: 'Fit write-up leads with these strengths' },
      ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      <FitStage designWidth={ACCOUNT_DESIGN_WIDTH} minScale={1} maxScale={2} className="w-full">
        <div
          className="mx-auto w-full space-y-10 px-8 py-10"
          data-fit-ref="career-context"
        >
          <div className="flex items-center justify-between gap-3">
            <BrandLogo size="nav" showIcon />
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="dark" size="lg" />
              <LoginButton redirectTo="/career-context" />
            </div>
          </div>

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              {zh ? '返回首頁' : 'Back to home'}
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-base font-semibold text-emerald-200">
              <Target className="h-5 w-5" />
              Career Context
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              {zh ? '用你的底線看每一份職缺' : 'Score every job against your floors'}
            </h1>
            <p className="mt-4 max-w-3xl text-xl leading-relaxed text-slate-400">
              {zh
                ? '履歷告訴 JobBeagle 你做過什麼。Career Context 告訴它你不願妥協什麼。存進帳號後，每次 Job Fit Snapshot 與 Interview Strategy Guide 都會自動帶入。'
                : 'Your resume tells JobBeagle what you have done. Career Context tells it what you will not compromise. Saved on your account and injected into every Job Fit Snapshot and Interview Strategy Guide.'}
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-3">
            {benefits.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-5 space-y-2"
              >
                <item.icon className="h-6 w-6 text-emerald-400" />
                <p className="text-lg font-bold text-white">{item.title}</p>
                <p className="text-base leading-relaxed text-slate-400">{item.body}</p>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-7 space-y-4">
            <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-400">
              {zh ? '會注入分析的七項底線' : 'Seven floors injected into analysis'}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {floors.map((f) => (
                <li key={f.label} className="flex items-start gap-2 text-lg">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />
                  <span>
                    <span className="font-semibold text-slate-200">{f.label}</span>
                    <span className="text-slate-500"> — {f.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 py-6 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {!loading && signedIn === false && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-4">
              <p className="text-xl text-slate-200">
                {zh
                  ? '登入後即可把底線存進帳號，之後每次分析自動使用。'
                  : 'Sign in to save your floors. Every later analysis uses them automatically.'}
              </p>
              <LoginButton redirectTo="/career-context" />
            </div>
          )}

          {!loading && signedIn && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-400">
                {zh ? '寫進你的帳號' : 'Save to your account'}
              </h2>
              <CareerContextForm initial={initial} hideIntro />
            </div>
          )}
        </div>
      </FitStage>
    </div>
  );
}
