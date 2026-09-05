'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import { decodePayloadParamForPreFlight, formatCapturedJd } from '@/lib/payload';
import { getExtensionScrapeError } from '@/constants/extension-scrape-errors';
import type { LiteReport, ReportType, UserInputs, UserProfile } from '@/types';
import { normalizeLiteReport, normalizeFullReport } from '@/lib/normalize-lite-report';
import {
  getAnalysisProgressAtTime,
  getAnalysisStageLabel,
} from '@/lib/analysis-progress';
import DogLoading from '@/components/DogLoading';
import LoginButton from '@/components/LoginButton';
import QuotaPaywallCard from '@/components/QuotaPaywallCard';
import AccountDeactivatedBanner from '@/components/AccountDeactivatedBanner';
import BrandLogo from '@/components/BrandLogo';
import InputForm from '@/components/InputForm';
import ReferralCard from '@/components/ReferralCard';
import FooterSection from '@/components/FooterSection';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { saveReportSession } from '@/lib/report-session';
import { REPORT_CODES, normalizeReportType } from '@/constants/report-products';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { FitStage } from '@/components/FitStage';
import { DOC_DESIGN_WIDTH } from '@/constants/fit-stage';
import { ANALYTICS_EVENTS, trackCheckoutReturn, trackEvent } from '@/lib/analytics';

interface JobDisplayData {
  company_name: string;
  job_title: string;
  raw_jd: string;
  char_count: number;
}

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const sidParam = searchParams.get('sid');
  const payloadParam = searchParams.get('payload');
  const scrapeErrorKey = searchParams.get('error');
  const embedded = searchParams.get('embedded') === '1';

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobData, setJobData] = useState<JobDisplayData | null>(null);
  const [handoffSid, setHandoffSid] = useState<string | null>(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [reportType, setReportType] = useState<ReportType>(REPORT_CODES.JOB_FIT_SNAPSHOT);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('Running headhunter triage...');
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopProgressSimulation = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgressSimulation = useCallback(() => {
    stopProgressSimulation();
    const startTime = Date.now();
    setAnalysisProgress(0);
    setAnalysisElapsed(0);
    setAnalysisStage(getAnalysisStageLabel(0, 'en'));
    progressTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const prog = getAnalysisProgressAtTime(elapsed);
      setAnalysisProgress(prog);
      setAnalysisElapsed(elapsed);
      setAnalysisStage(getAnalysisStageLabel(prog, 'en'));
    }, 400);
  }, [stopProgressSimulation]);

  useEffect(() => () => stopProgressSimulation(), [stopProgressSimulation]);

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
    if (embedded) return;
    const qs = searchParams.toString();
    router.replace(qs ? `/?${qs}` : '/');
  }, [embedded, router, searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadJob() {
      if (!embedded) return;
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
    const scrapeMsg = scrapeErrorKey
      ? getExtensionScrapeError(scrapeErrorKey, language)
      : null;
    if (scrapeMsg) {
      setError(scrapeMsg);
    }
    loadSession();

    return () => {
      cancelled = true;
    };
  }, [sidParam, payloadParam, scrapeErrorKey, loadSession, embedded, language]);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.confirmView, {
      has_sid: Boolean(sidParam),
      embedded: Boolean(embedded),
    });
  }, [sidParam, embedded]);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      trackCheckoutReturn('success');
      loadSession();
    } else if (checkout === 'cancel' || checkout === 'cancelled') {
      trackCheckoutReturn('cancel');
    } else if (checkout === 'error') {
      trackCheckoutReturn('error');
    }
  }, [searchParams, loadSession]);

  const initialJobDescription = useMemo(
    () => (jobData ? formatCapturedJd(jobData) : ''),
    [jobData],
  );

  const jdTooShort = jobData != null && jobData.char_count < 40;

  const handleSubmit = async (inputs: UserInputs) => {
    if (!user) {
      setError('Please sign in with Google to launch analysis.');
      setErrorCode('AUTH_REQUIRED');
      return;
    }
    if (!jobData && !(inputs.jobDescription || '').trim()) {
      setError('Missing job data. Use the Chrome extension or paste a JD on the homepage.');
      return;
    }
    if (!inputs.resume || (!(inputs.resume.content || '').trim() && inputs.resume.type !== 'file')) {
      setError('Please upload your resume file before launching.');
      return;
    }
    if (jdTooShort) {
      setError(
        `Job content is too short (${jobData?.char_count} chars). Re-capture from the full job detail page, or paste the full JD.`,
      );
      return;
    }

    setAnalyzing(true);
    setError(null);
    setErrorCode(null);
    startProgressSimulation();
    trackEvent(ANALYTICS_EVENTS.analyzeStart, {
      report_type: reportType,
      source: 'confirm',
    });

    let failedAfterTrack = false;
    try {
      const fingerprint = await getDeviceFingerprint();

      const body: Record<string, unknown> = {
        report_type: reportType,
        resume: inputs.resume,
        device_fingerprint: fingerprint,
        language: inputs.language || language || 'en',
      };

      if (handoffSid) {
        body.handoff_sid = handoffSid;
      } else if (payloadParam) {
        body.payload = payloadParam;
      } else {
        body.jobDescription = inputs.jobDescription;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.status === 401) {
        setError(data.error || 'Please sign in to continue.');
        setErrorCode('AUTH_REQUIRED');
        return;
      }

      if (res.status === 402) {
        setError(data.error || 'Insufficient credits.');
        setErrorCode('PAYMENT_REQUIRED');
        await loadSession();
        return;
      }

      if (!res.ok) {
        failedAfterTrack = true;
        trackEvent(ANALYTICS_EVENTS.analyzeError, {
          report_type: reportType,
          source: 'confirm',
          error_code: typeof data.code === 'string' ? data.code : 'ANALYSIS_ERROR',
        });
        throw new Error(
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || 'Analysis failed',
        );
      }

      trackEvent(ANALYTICS_EVENTS.analyzeComplete, {
        report_type: reportType,
        source: 'confirm',
      });
      const normalizedType = normalizeReportType(data.report_type);
      const report =
        normalizedType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
          ? normalizeFullReport(data.report)
          : normalizeLiteReport(data.report as LiteReport);

      saveReportSession({
        report,
        report_type: normalizedType,
        report_id: typeof data.report_id === 'string' ? data.report_id : null,
        language: inputs.language || language || 'en',
      });
      await loadSession();
      router.push('/report');
    } catch (e: unknown) {
      if (!failedAfterTrack) {
        trackEvent(ANALYTICS_EVENTS.analyzeError, {
          report_type: reportType,
          source: 'confirm',
          error_code: 'CLIENT_EXCEPTION',
        });
      }
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      stopProgressSimulation();
      setAnalyzing(false);
    }
  };

  if (!embedded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <DogLoading language={language} />
      </div>
    );
  }

  if (analyzing || loadingJob) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <DogLoading
          progress={loadingJob ? Math.max(analysisProgress, 20) : analysisProgress}
          elapsed={loadingJob ? 0 : analysisElapsed}
          stageLabel={loadingJob ? 'Loading job capture...' : analysisStage}
          language={language}
        />
      </div>
    );
  }

  const loginRedirect = `/confirm?${new URLSearchParams({
    ...(sidParam ? { sid: sidParam } : {}),
    ...(embedded ? { embedded: '1' } : {}),
  }).toString()}`;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200">
      <FitStage designWidth={DOC_DESIGN_WIDTH} minScale={1} maxScale={2.6} className="w-full">
      <main className={`max-w-[90rem] mx-auto px-4 sm:px-6 ${embedded ? 'py-4 sm:py-6' : 'py-8 sm:py-10'}`} data-fit-ref="confirm">
        {!embedded && (
          <div className="flex items-center justify-between gap-4 mb-6">
            <BrandLogo size="nav" showIcon />
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher variant="dark" />
              <Link
                href="/"
                className="hidden sm:inline text-sm text-slate-400 hover:text-white transition-colors"
              >
                Home
              </Link>
              <LoginButton redirectTo={loginRedirect} />
            </div>
          </div>
        )}

        {embedded && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <BrandLogo size="nav" showIcon />
            {user ? (
              <span className="text-xs text-slate-500 truncate max-w-[10rem]">{user.email}</span>
            ) : (
              <LoginButton redirectTo={`${loginRedirect}&embedded=1`} />
            )}
          </div>
        )}

        {profile?.deactivated_at && <AccountDeactivatedBanner language={language} />}

        {embedded && (
          <p className="text-xs text-indigo-300/80 mb-4">
            Opened in Chrome Side Panel — you can stay on LinkedIn.
          </p>
        )}

        {error && (errorCode === 'PAYMENT_REQUIRED' || errorCode === 'AUTH_REQUIRED') && (
          <div className="mb-6">
            <QuotaPaywallCard
              language={language === 'zh-TW' || language === 'zh-CN' ? language : 'en'}
              message={error}
              isLoggedIn={!!user}
              onDismiss={() => {
                setError(null);
                setErrorCode(null);
              }}
            />
          </div>
        )}
        {error && errorCode !== 'PAYMENT_REQUIRED' && errorCode !== 'AUTH_REQUIRED' && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              className="text-amber-300/80 hover:text-amber-100"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {jdTooShort && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>
              Job content is too short ({jobData?.char_count} chars). Re-capture from the full job
              detail page, or paste the complete JD below.
            </span>
          </div>
        )}

        <div className="max-w-[90rem] mx-auto">
          <InputForm
            onSubmit={handleSubmit}
            isLoading={analyzing}
            language={language}
            initialJobDescription={initialJobDescription}
            reportType={reportType}
            onReportTypeChange={setReportType}
            userProfile={profile}
            extensionCapture={
              jobData
                ? {
                    company_name: jobData.company_name,
                    job_title: jobData.job_title,
                  }
                : null
            }
            compactChrome={embedded}
          />

          {user && profile && !embedded && (
            <div className="mt-4 mb-1">
              <ReferralCard
                referralCode={profile.referral_code}
                language={language}
                userProfile={profile}
              />
            </div>
          )}

          {!embedded && <FooterSection language={language} />}
        </div>
      </main>
      </FitStage>
    </div>
  );
}
