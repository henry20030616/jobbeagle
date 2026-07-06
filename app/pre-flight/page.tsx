'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import { decodePayloadParamForPreFlight } from '@/lib/payload';
import { canAffordUserProfile } from '@/lib/profiles';
import { startCheckout } from '@/lib/checkout-client';
import type { LiteReport, FullReport, ReportType, ResumeInput, UserProfile } from '@/types';
import type { CheckoutPlanType } from '@/constants/checkout-plans';
import { FREE_LIFETIME_LITE_CREDITS } from '@/constants/credits';
import { normalizeLiteReport } from '@/lib/normalize-lite-report';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import DogLoading from '@/components/DogLoading';
import LoginButton from '@/components/LoginButton';
import QuotaPaywallCard from '@/components/QuotaPaywallCard';
import {
  Rocket,
  Building2,
  Briefcase,
  FileText,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface JobDisplayData {
  company_name: string;
  job_title: string;
  raw_jd: string;
  char_count: number;
}

const SCRAPE_ERRORS: Record<string, { 'zh-TW': string; en: string }> = {
  not_job_detail: {
    'zh-TW': '請先點進「單一職缺詳情頁」（URL 含 /jobs/view/ 或 currentJobId=），再點外掛圖示。列表頁／精選職缺無法抓取。',
    en: 'Open a single job detail page (URL with /jobs/view/ or currentJobId=) before clicking the extension. List/collection pages cannot be scraped.',
  },
  scrape_failed: {
    'zh-TW': '職缺內容抓取失敗或太短。請確認頁面已完全載入，或改到首頁手動貼上完整 JD。',
    en: 'Job scrape failed or content too short. Ensure the page is fully loaded, or paste the full JD on the homepage.',
  },
};

export default function PreFlightPage() {
  const searchParams = useSearchParams();
  const payloadParam = searchParams.get('payload');
  const scrapeErrorKey = searchParams.get('error');

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobData, setJobData] = useState<JobDisplayData | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [reportType, setReportType] = useState<ReportType>('lite');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [liteReport, setLiteReport] = useState<LiteReport | null>(null);
  const [fullReport, setFullReport] = useState<FullReport | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<CheckoutPlanType | null>(null);

  const loadSession = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    setUser(u ? { id: u.id, email: u.email } : null);

    if (u) {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    }
  }, []);

  useEffect(() => {
    if (payloadParam) {
      const decoded = decodePayloadParamForPreFlight(payloadParam);
      if (decoded) {
        setJobData({
          company_name: decoded.company_name,
          job_title: decoded.job_title,
          raw_jd: decoded.raw_jd,
          char_count: decoded.raw_jd.length,
        });
      } else {
        setError('Extension payload could not be decoded. Re-scrape from the job detail page.');
      }
    }
    if (scrapeErrorKey && SCRAPE_ERRORS[scrapeErrorKey]) {
      setError(SCRAPE_ERRORS[scrapeErrorKey]['zh-TW']);
    }
    loadSession();
  }, [payloadParam, scrapeErrorKey, loadSession]);

  const creditsExhausted =
    !!profile && !!user && !canAffordUserProfile(profile, reportType);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      loadSession();
    }
  }, [searchParams, loadSession]);

  const handleLaunch = async () => {
    if (!user) {
      setError('Please sign in with Google to launch analysis.');
      return;
    }
    if (!jobData && !resumeText) {
      setError('Missing job data. Use the Chrome extension or paste a JD on the homepage.');
      return;
    }
    if (!resumeText.trim()) {
      setError('Please paste your resume before launching.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setLiteReport(null);
    setFullReport(null);

    try {
      const fingerprint = await getDeviceFingerprint();
      const resume: ResumeInput = { type: 'text', content: resumeText };

      const body: Record<string, unknown> = {
        report_type: reportType,
        resume,
        device_fingerprint: fingerprint,
        language: 'en',
      };

      if (payloadParam) {
        body.payload = payloadParam;
      } else if (jobData) {
        body.jobDescription = jobData.raw_jd;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.status === 402) {
        setError(data.error || 'Insufficient credits.');
        setErrorCode('PAYMENT_REQUIRED');
        await loadSession();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      if (data.report_type === 'full') {
        setFullReport(data.report as FullReport);
      } else {
        setLiteReport(normalizeLiteReport(data.report as LiteReport));
      }
      await loadSession();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const jdTooShort = jobData != null && jobData.char_count < 40;

  const handleCheckout = async (plan: CheckoutPlanType) => {
    setCheckoutBusy(plan);
    const result = await startCheckout(plan);
    if (!result.ok) {
      setError(result.error);
      setErrorCode(null);
    }
    setCheckoutBusy(null);
  };

  if (analyzing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <DogLoading progress={72} stageLabel="Running headhunter triage..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          JobBeagle
        </Link>
        {user ? (
          <span className="text-sm text-slate-400">{user.email}</span>
        ) : (
          <LoginButton redirectTo="/pre-flight" />
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Pre-Flight Check</h1>
          <p className="text-slate-400 text-sm">
            Confirm scraped job data and resume before launching. You are responsible for
            data accuracy before credits are consumed.
          </p>
        </div>

        {error && errorCode === 'PAYMENT_REQUIRED' && (
          <QuotaPaywallCard
            language="zh-TW"
            message={error}
            isLoggedIn={!!user}
            onDismiss={() => { setError(null); setErrorCode(null); }}
          />
        )}
        {error && errorCode !== 'PAYMENT_REQUIRED' && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {jdTooShort && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>
              職缺內容太短（{jobData?.char_count} 字），無法分析。請在 LinkedIn 單一職缺詳情頁重新點外掛，或到首頁手動貼完整 JD。
            </span>
          </div>
        )}

        {/* Capsule cards */}
        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-start gap-4">
            <Building2 className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Company</p>
              <p className="font-semibold">{jobData?.company_name ?? '—'}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-start gap-4">
            <Briefcase className="w-6 h-6 text-violet-400 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Role</p>
              <p className="font-semibold">{jobData?.job_title ?? '—'}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-start gap-4">
            <FileText className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">JD Summary</p>
              <p className="text-sm text-slate-300 line-clamp-3">
                {jobData?.raw_jd?.slice(0, 280) || 'No extension payload — paste JD on homepage.'}
              </p>
              {jobData && (
                <p className="text-xs text-slate-500 mt-2">{jobData.char_count.toLocaleString()} characters</p>
              )}
            </div>
          </div>
        </div>

        {/* Resume */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Resume (paste text)
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={8}
            placeholder="Paste your resume here..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Report type */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setReportType('lite')}
            className={`flex-1 rounded-xl border p-4 text-left transition ${
              reportType === 'lite'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold">Lite Snapshot</p>
            <p className="text-xs text-slate-400 mt-1">No web search · 3s TTV · Match score + Radford comp</p>
          </button>
          <button
            type="button"
            onClick={() => setReportType('full')}
            className={`flex-1 rounded-xl border p-4 text-left transition ${
              reportType === 'full'
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold flex items-center gap-1">
              Full Intel <Sparkles className="w-4 h-4 text-violet-400" />
            </p>
            <p className="text-xs text-slate-400 mt-1">Live Blind/Glassdoor · 10 STAR Qs · Negotiation script</p>
          </button>
        </div>

        {/* Credits */}
        {profile && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Your credits</span>
              <span>
                Lite: <strong>{profile.available_lite_credits}</strong> · Full:{' '}
                <strong>{profile.available_full_credits}</strong>
                {profile.membership_tier !== 'free' && (
                  <span className="ml-2 text-emerald-400 capitalize">({profile.membership_tier.replace('_', ' ')})</span>
                )}
              </span>
            </div>
            {profile.membership_tier === 'free' && (
              <p className="text-xs text-slate-500">
                免費帳號終生固定 {FREE_LIFETIME_LITE_CREDITS} 次 Lite；用完需付費，按月/按日皆不重置。
              </p>
            )}
          </div>
        )}

        {creditsExhausted && user && (
          <QuotaPaywallCard
            language="zh-TW"
            isLoggedIn
            onDismiss={() => {}}
          />
        )}

        <button
          type="button"
          onClick={handleLaunch}
          disabled={!resumeText.trim() || creditsExhausted || jdTooShort || !jobData}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 font-semibold transition"
        >
          <Rocket className="w-5 h-5" />
          {creditsExhausted ? '額度已用完 — 請付費解鎖' : 'Launch AI Analysis'}
          <ChevronRight className="w-5 h-5" />
        </button>

        {!creditsExhausted && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <p className="text-sm font-medium text-slate-300">Need more credits?</p>
          <p className="text-xs text-slate-500">免費為終生 {FREE_LIFETIME_LITE_CREDITS} 次 Lite；下方為付費加購。</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['single_lite', 'Single Lite · $3'],
                ['single_full', 'Single Full · $9.99'],
                ['standard_subscription', 'Standard · $19.99/mo'],
                ['advanced_subscription', 'Advanced · $39.99/mo'],
              ] as [CheckoutPlanType, string][]
            ).map(([plan, label]) => (
              <button
                key={plan}
                type="button"
                disabled={checkoutBusy === plan || !user}
                onClick={() => handleCheckout(plan)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkoutBusy === plan && <Loader2 className="w-4 h-4 animate-spin" />}
                {label}
              </button>
            ))}
          </div>
        </div>
        )}

        {liteReport && (
          <LiteReportDashboard
            report={liteReport}
            onNewAnalysis={() => {
              setLiteReport(null);
              setFullReport(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
        {fullReport && <FullReportDashboard report={fullReport} />}
      </main>
    </div>
  );
}
