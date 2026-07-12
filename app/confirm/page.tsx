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
import { FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS } from '@/constants/credits';
import { normalizeLiteReport } from '@/lib/normalize-lite-report';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import DogLoading from '@/components/DogLoading';
import LoginButton from '@/components/LoginButton';
import QuotaPaywallCard from '@/components/QuotaPaywallCard';
import ResumeInputPanel from '@/components/ResumeInputPanel';
import {
  CONFIRM_PAGE,
  REPORT_CODES,
  normalizeReportType,
  reportBlurb,
  reportLabel,
} from '@/constants/report-products';
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
    'zh-TW': '請先在左側列表點選一個職缺，等右側詳情出現後再點外掛；或點「在新分頁中查看」/ 職缺標題進入完整頁面。',
    en: 'Select a job in the left list and wait for details on the right, or open the job in a full page before clicking the extension.',
  },
  scrape_failed: {
    'zh-TW': '職缺內容抓取失敗或太短。請在右側職缺詳情載入完成後再點外掛；或點「在新分頁中查看」打開完整職缺頁後再試。',
    en: 'Job scrape failed or content too short. Wait for the job detail panel to load, or open the job in a new tab and try again.',
  },
  capture_failed: {
    'zh-TW': '已抓到職缺，但傳送到 JobBeagle 伺服器失敗。請稍後再試，或到 chrome://extensions 點 JobBeagle 的「Service Worker」查看錯誤。',
    en: 'Job was scraped but server handoff failed. Retry later or inspect the extension service worker console.',
  },
  site_access: {
    'zh-TW': 'Chrome 未允許外掛存取此職缺網站。請到 chrome://extensions → JobBeagle →「網站存取權限」→ 打開對應網站（LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs），或選「在所有網站上」。',
    en: 'Chrome blocked site access. Open chrome://extensions → JobBeagle → enable site access for LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs.',
  },
  no_job_page: {
    'zh-TW': '此頁面不在支援清單。目前支援：LinkedIn、Indeed、ZipRecruiter、Glassdoor、GovernmentJobs（與台灣 104）。請在職缺詳情頁再點外掛。',
    en: 'This page is not supported. Supported: LinkedIn, Indeed, ZipRecruiter, Glassdoor, GovernmentJobs (and Taiwan 104). Open a job detail page and try again.',
  },
};

export default function PreFlightPage() {
  const searchParams = useSearchParams();
  const sidParam = searchParams.get('sid');
  const payloadParam = searchParams.get('payload');
  const scrapeErrorKey = searchParams.get('error');
  const embedded = searchParams.get('embedded') === '1';

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobData, setJobData] = useState<JobDisplayData | null>(null);
  const [handoffSid, setHandoffSid] = useState<string | null>(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [resume, setResume] = useState<ResumeInput | null>(null);
  const [reportType, setReportType] = useState<ReportType>(REPORT_CODES.JOB_FIT_SNAPSHOT);
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
    let cancelled = false;

    async function loadJob() {
      if (sidParam) {
        setLoadingJob(true);
        setHandoffSid(sidParam);
        try {
          const res = await fetch(`/api/extension-capture?sid=${encodeURIComponent(sidParam)}`);
          const data = await res.json();
          if (cancelled) return;
          if (!res.ok) {
            setError(data.error || 'Handoff session expired. Re-capture from LinkedIn.');
            return;
          }
          setJobData({
            company_name: data.job.company_name,
            job_title: data.job.job_title,
            raw_jd: data.job.raw_jd,
            char_count: data.job.char_count,
          });
        } catch {
          if (!cancelled) setError('Could not load captured job data.');
        } finally {
          if (!cancelled) setLoadingJob(false);
        }
        return;
      }

      setHandoffSid(null);
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
    }

    loadJob();
    if (scrapeErrorKey && SCRAPE_ERRORS[scrapeErrorKey]) {
      setError(SCRAPE_ERRORS[scrapeErrorKey]['zh-TW']);
    }
    loadSession();

    return () => {
      cancelled = true;
    };
  }, [sidParam, payloadParam, scrapeErrorKey, loadSession]);

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
    if (!jobData) {
      setError('Missing job data. Use the Chrome extension or paste a JD on the homepage.');
      return;
    }
    if (!resume || (!(resume.content || '').trim() && resume.type !== 'file')) {
      setError('Please upload your resume file before launching.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setLiteReport(null);
    setFullReport(null);

    try {
      const fingerprint = await getDeviceFingerprint();

      const body: Record<string, unknown> = {
        report_type: reportType,
        resume,
        device_fingerprint: fingerprint,
        language: 'en',
      };

      if (handoffSid) {
        body.handoff_sid = handoffSid;
      } else if (payloadParam) {
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

      if (normalizeReportType(data.report_type) === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE) {
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

  if (analyzing || loadingJob) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <DogLoading progress={loadingJob ? 35 : 72} stageLabel={loadingJob ? 'Loading job capture...' : 'Running headhunter triage...'} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white ${embedded ? 'text-sm' : ''}`}>
      {!embedded && (
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          JobBeagle
        </Link>
        {user ? (
          <span className="text-sm text-slate-400">{user.email}</span>
        ) : (
          <LoginButton redirectTo="/confirm" />
        )}
      </header>
      )}

      <main className={`max-w-3xl mx-auto px-4 space-y-8 ${embedded ? 'py-6' : 'py-10'}`}>
        <div>
          <h1 className={`font-bold mb-2 ${embedded ? 'text-xl' : 'text-2xl'}`}>
            {CONFIRM_PAGE.titleEn}
          </h1>
          <p className="text-slate-400 text-sm">
            {CONFIRM_PAGE.subtitleEn}
          </p>
          {embedded && (
            <p className="text-xs text-indigo-300/80 mt-2">Opened in Chrome Side Panel — you can stay on LinkedIn.</p>
          )}
        </div>

        {embedded && !user && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
            <LoginButton redirectTo={`/confirm?sid=${encodeURIComponent(sidParam || '')}&embedded=1`} />
          </div>
        )}

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
              <div className="max-h-48 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-3 text-sm text-slate-300 whitespace-pre-wrap">
                {jobData?.raw_jd || 'No extension payload — paste JD on homepage.'}
              </div>
              {jobData && (
                <p className="text-xs text-slate-500 mt-2">{jobData.char_count.toLocaleString()} characters</p>
              )}
            </div>
          </div>
        </div>

        {/* Resume — same capabilities as homepage */}
        <ResumeInputPanel
          value={resume}
          onChange={setResume}
          language="en"
          libraryLimit={3}
        />

        {/* Report type */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setReportType(REPORT_CODES.JOB_FIT_SNAPSHOT)}
            className={`flex-1 rounded-xl border p-4 text-left transition ${
              reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold">{reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT)}</p>
            <p className="text-xs text-slate-400 mt-1">{reportBlurb(REPORT_CODES.JOB_FIT_SNAPSHOT)}</p>
          </button>
          <button
            type="button"
            onClick={() => setReportType(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}
            className={`flex-1 rounded-xl border p-4 text-left transition ${
              reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <p className="font-semibold flex items-center gap-1">
              {reportLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)} <Sparkles className="w-4 h-4 text-violet-400" />
            </p>
            <p className="text-xs text-slate-400 mt-1">{reportBlurb(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}</p>
          </button>
        </div>

        {/* Credits */}
        {profile && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between gap-3 flex-wrap">
              <span className="text-slate-400">Your credits</span>
              <span>
                {reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT)}:{' '}
                <strong>{profile.available_job_fit_snapshot_credits ?? profile.available_lite_credits}</strong> ·{' '}
                {reportLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}:{' '}
                <strong>
                  {profile.available_interview_strategy_guide_credits ?? profile.available_full_credits}
                </strong>
                {profile.membership_tier !== 'free' && (
                  <span className="ml-2 text-emerald-400 capitalize">({profile.membership_tier.replace('_', ' ')})</span>
                )}
              </span>
            </div>
            {profile.membership_tier === 'free' && (
              <p className="text-xs text-slate-500">
                Free accounts include {FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS} lifetime{' '}
                {reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT)} credits; they do not reset monthly.
              </p>
            )}
          </div>
        )}

        {creditsExhausted && user && (
          <QuotaPaywallCard
            language="en"
            isLoggedIn
            onDismiss={() => {}}
          />
        )}

        <button
          type="button"
          onClick={handleLaunch}
          disabled={!resume || creditsExhausted || jdTooShort || !jobData}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-4 font-semibold transition"
        >
          <Rocket className="w-5 h-5" />
          {creditsExhausted ? 'Out of credits — unlock to continue' : 'Launch AI Analysis'}
          <ChevronRight className="w-5 h-5" />
        </button>

        {!creditsExhausted && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <p className="text-sm font-medium text-slate-300">Need more credits?</p>
          <p className="text-xs text-slate-500">
            Free accounts include {FREE_LIFETIME_JOB_FIT_SNAPSHOT_CREDITS} lifetime Job Fit Snapshot credits. Buy more below.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['single_job_fit_snapshot', 'Job Fit Snapshot · $3'],
                ['single_interview_strategy_guide', 'Interview Strategy Guide · $9.99'],
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
