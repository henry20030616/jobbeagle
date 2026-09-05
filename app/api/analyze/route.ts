import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type {
  AnalyzeRequestBody,
  CareerContext,
  LiteReport,
  FullReport,
  ReportType,
  ResumeInput,
} from '@/types';
import {
  careerContextHasSignal,
  normalizeCareerContext,
} from '@/lib/career-context';
import {
  decodeExtensionPayload,
  payloadToPreFlightData,
  deriveJobId,
  truncateText,
} from '@/lib/payload';
import { verifyHandoffToken } from '@/lib/extension-handoff';
import {
  ensureProfile,
  checkDeviceSybil,
  bindDeviceFingerprint,
  canAffordReport,
  deductCredit,
  refundCredit,
  hasSubscriptionCredits,
  type ProfileRow,
} from '@/lib/profiles';
import {
  countCombinedTokens,
  isTokenLimitExceeded,
  executeLiteAnalysis,
  executeFullAnalysis,
} from '@/lib/gemini-analyze';
import { normalizeLiteReport, normalizeFullReport } from '@/lib/normalize-lite-report';
import { resolveResumeForAnalysis } from '@/lib/resume-parser';
import { clientIpFromRequest, rateLimit, rateLimitAnalyze } from '@/lib/rate-limit';
import { tryActivateReferralMilestone } from '@/lib/referrals';
import { upsertResumeForUser } from '@/lib/resumes';
import { MAX_JD_CHARS, MAX_RESUME_CHARS } from '@/constants/models';
import { validateJobDescription } from '@/lib/validate-job-description';
import { notifyFailure } from '@/lib/transactional-email';
import {
  REPORT_CODES,
  isInterviewStrategyGuide,
  normalizeReportType,
} from '@/constants/report-products';

export const maxDuration = 180;

function paymentRequiredResponse(profile: ProfileRow) {
  return NextResponse.json(
    {
      error: 'Insufficient credits. Upgrade or purchase to continue.',
      code: 'PAYMENT_REQUIRED',
      profile: {
        job_fit_snapshot_credits: profile.available_job_fit_snapshot_credits,
        interview_strategy_guide_credits:
          profile.available_interview_strategy_guide_credits,
        /** @deprecated */
        lite_credits: profile.available_job_fit_snapshot_credits,
        /** @deprecated */
        full_credits: profile.available_interview_strategy_guide_credits,
        membership_tier: profile.membership_tier,
      },
    },
    { status: 402 },
  );
}

interface ResolvedInput {
  company_name: string;
  job_title: string;
  raw_jd: string;
  linkedin_job_id: string;
  resume_text: string;
  page_url?: string;
  pdf_inline?: { data: string; mimeType: string };
}

async function resolveInput(
  body: AnalyzeRequestBody,
  resume?: ResumeInput,
): Promise<ResolvedInput> {
  const fromExtension = (ext: ReturnType<typeof verifyHandoffToken>) => {
    const pf = payloadToPreFlightData(ext);
    return pf;
  };

  if (body.handoff_sid) {
    const pf = fromExtension(verifyHandoffToken(body.handoff_sid));
    const resolved = resume ? await resolveResumeForAnalysis(resume) : null;
    return {
      company_name: pf.company_name,
      job_title: pf.job_title,
      raw_jd: truncateText(pf.raw_jd, MAX_JD_CHARS),
      linkedin_job_id: deriveJobId(pf.linkedin_job_id, pf.raw_jd, pf.company_name),
      resume_text: resolved?.pdfInline
        ? '[PDF resume attached]'
        : truncateText(resolved?.text || '', MAX_RESUME_CHARS),
      page_url: pf.page_url,
      pdf_inline: resolved?.pdfInline,
    };
  }

  if (body.payload) {
    const pf = fromExtension(decodeExtensionPayload(body.payload));
    let resumeText = '';
    if (resume) {
      const resolved = await resolveResumeForAnalysis(resume);
      resumeText = resolved.text;
      return {
        company_name: pf.company_name,
        job_title: pf.job_title,
        raw_jd: truncateText(pf.raw_jd, MAX_JD_CHARS),
        linkedin_job_id: deriveJobId(pf.linkedin_job_id, pf.raw_jd, pf.company_name),
        resume_text: truncateText(resumeText, MAX_RESUME_CHARS),
        page_url: pf.page_url,
        pdf_inline: resolved.pdfInline,
      };
    }
    return {
      company_name: pf.company_name,
      job_title: pf.job_title,
      raw_jd: truncateText(pf.raw_jd, MAX_JD_CHARS),
      linkedin_job_id: deriveJobId(pf.linkedin_job_id, pf.raw_jd, pf.company_name),
      resume_text: truncateText(resumeText, MAX_RESUME_CHARS),
      page_url: pf.page_url,
    };
  }

  const jd = truncateText(body.jobDescription || '', MAX_JD_CHARS);
  if (!jd) throw new Error('Job description is required.');
  if (!resume) throw new Error('Resume is required.');

  const resolved = await resolveResumeForAnalysis(resume);
  const companyMatch = jd.match(/(?:Company|公司)[：:]\s*(.+)/i);
  const titleMatch = jd.match(/(?:職位|Position|Title)[：:]\s*(.+)/i);

  return {
    company_name: companyMatch?.[1]?.trim().split('\n')[0] || 'Unknown Company',
    job_title: titleMatch?.[1]?.trim().split('\n')[0] || 'Unknown Role',
    raw_jd: jd,
    linkedin_job_id: deriveJobId(undefined, jd, companyMatch?.[1] || 'unknown'),
    resume_text: resolved.pdfInline
      ? '[PDF resume attached]'
      : truncateText(resolved.text, MAX_RESUME_CHARS),
    pdf_inline: resolved.pdfInline,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as AnalyzeRequestBody;
    const reportType = normalizeReportType(body.report_type);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized Login Required', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Server configuration error: quota service unavailable', code: 'SERVER_CONFIG' },
        { status: 503 },
      );
    }

    const profile = await ensureProfile(admin, user.id, {
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
    });

    if (profile.deactivated_at) {
      return NextResponse.json(
        {
          error: 'Account is deactivated. Reactivate from Account management.',
          code: 'ACCOUNT_DEACTIVATED',
        },
        { status: 403 },
      );
    }

    const clientIp = clientIpFromRequest(request);
    const sybil = await checkDeviceSybil(
      admin,
      user.id,
      body.device_fingerprint,
      profile.membership_tier,
    );
    if (!sybil.allowed) {
      return NextResponse.json({ error: sybil.reason, code: 'DEVICE_LIMIT' }, { status: 403 });
    }

    if (body.device_fingerprint) {
      await bindDeviceFingerprint(admin, user.id, body.device_fingerprint);
    }

    // Dual anti-abuse for free tier: device fingerprint + IP rate limit.
    // Missing fingerprint → much tighter IP cap (still allowed, not free-open).
    if (profile.membership_tier === 'free') {
      const ipLimit = sybil.mode === 'fingerprinted' ? 20 : 3;
      const ipWindowSec = sybil.mode === 'fingerprinted' ? 3600 : 86400;
      const ipRl = await rateLimit('analyze-ip', clientIp, ipLimit, ipWindowSec);
      if (!ipRl.allowed) {
        return NextResponse.json(
          {
            error:
              sybil.mode === 'no_fingerprint'
                ? 'Too many free analyses from this network without a device check. Sign in on a normal browser, or buy credits.'
                : 'Too many free analyses from this network. Try again later or buy credits.',
            code: 'RATE_LIMIT',
          },
          { status: 429 },
        );
      }
    }

    const rl = await rateLimitAnalyze(user.id, 30, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.', code: 'RATE_LIMIT' },
        { status: 429 },
      );
    }

    const input = await resolveInput(body, body.resume);
    if (!input.resume_text && !input.pdf_inline) {
      return NextResponse.json({ error: 'Resume is required.', code: 'MISSING_RESUME' }, { status: 400 });
    }

    const jdCheck = validateJobDescription(input.raw_jd, body.language || 'en');
    if (!jdCheck.valid) {
      return NextResponse.json(
        { error: jdCheck.message, code: jdCheck.code || 'INVALID_JD' },
        { status: 400 },
      );
    }

    if (
      input.raw_jd.length > MAX_JD_CHARS
      || (!input.pdf_inline && input.resume_text.length > MAX_RESUME_CHARS)
    ) {
      return NextResponse.json(
        { error: 'Text length boundary breached.', code: 'TEXT_TOO_LONG' },
        { status: 400 },
      );
    }

    const tokenCount = await countCombinedTokens(
      input.raw_jd,
      input.pdf_inline
        ? `${input.resume_text}\n[PDF attachment ~${Math.ceil(input.pdf_inline.data.length * 0.75)} bytes]`
        : input.resume_text,
    );
    if (isTokenLimitExceeded(tokenCount)) {
      return NextResponse.json(
        { error: 'Context window safe limit breached.', code: 'TOKEN_LIMIT' },
        { status: 400 },
      );
    }

    // No analyze cache — every run spends a credit; users reopen reports from History.
    if (!canAffordReport(profile, reportType)) {
      return paymentRequiredResponse(profile);
    }

    let resumeId: string | null = null;
    try {
      const resumeTextForStore = input.pdf_inline
        ? input.pdf_inline.data
        : input.resume_text;
      const hashMaterial = input.pdf_inline
        ? `pdf:${input.pdf_inline.data.slice(0, 64)}:${input.pdf_inline.data.length}`
        : resumeTextForStore;
      const upserted = await upsertResumeForUser(admin, user.id, {
        contentText: resumeTextForStore,
        hashMaterial,
        fileName: body.resume?.fileName ?? null,
        mimeType: body.resume?.mimeType ?? input.pdf_inline?.mimeType ?? null,
        type: body.resume?.type === 'file' || input.pdf_inline ? 'file' : 'text',
        source: 'analyze',
      });
      resumeId = upserted.id;
    } catch (resumeErr) {
      console.warn(
        '[Analyze] Resume upsert failed (report will still save):',
        resumeErr instanceof Error ? resumeErr.message : resumeErr,
      );
    }

    // Deduct before AI call so concurrent requests cannot overspend
    const remaining = await deductCredit(admin, user.id, reportType);
    if (remaining < 0) {
      return paymentRequiredResponse(profile);
    }

    let report: LiteReport | FullReport;
    let modelUsed: string;

    const careerContext: CareerContext = careerContextHasSignal(body.career_context)
      ? normalizeCareerContext(body.career_context)
      : normalizeCareerContext(profile.career_context);

    try {
      const reportLanguage = body.language || 'en';

      if (reportType === REPORT_CODES.JOB_FIT_SNAPSHOT) {
        const result = await executeLiteAnalysis(
          input.resume_text,
          input.raw_jd,
          input.pdf_inline,
          careerContext,
          input.page_url,
          reportLanguage,
        );
        report = result.report;
        modelUsed = result.model;
      } else {
        const result = await executeFullAnalysis(
          input.resume_text,
          input.raw_jd,
          input.company_name,
          input.job_title,
          input.pdf_inline,
          careerContext,
          input.page_url,
          reportLanguage,
        );
        report = normalizeFullReport(result.report, { careerContext });
        modelUsed = result.model;
      }
    } catch (analysisErr) {
      let refunded = true;
      try {
        await refundCredit(admin, user.id, reportType);
      } catch (refundErr) {
        refunded = false;
        console.error('[Analyze] Credit refund failed:', refundErr);
      }
      const productLabel =
        reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
          ? 'Job Fit Snapshot'
          : 'Interview Strategy Guide';
      await notifyFailure({
        scenario: 'analysis_failed',
        userEmail: user.email,
        userId: user.id,
        jobLabel: `${input.job_title} at ${input.company_name}`,
        planLabel: productLabel,
        refunded,
        technicalDetail: analysisErr instanceof Error ? analysisErr.message : 'Analysis failed',
      });
      throw analysisErr;
    }

    if (reportType === REPORT_CODES.JOB_FIT_SNAPSHOT) {
      await tryActivateReferralMilestone(admin, user.id);
    }

    const score =
      typeof (report as LiteReport).fit_score?.score === 'number'
        ? (report as LiteReport).fit_score.score
        : typeof (report as LiteReport).match_score === 'number'
          ? (report as LiteReport).match_score
          : null;

    const { data: inserted, error: dbError } = await admin
      .from('analysis_reports')
      .insert({
        user_id: user.id,
        job_title: input.job_title,
        company_name: input.company_name,
        job_description_preview: input.raw_jd.substring(0, 300),
        raw_jd_text: input.raw_jd,
        resume_snapshot_text: input.resume_text,
        resume_id: resumeId,
        linkedin_job_id: input.linkedin_job_id,
        report_type: reportType,
        is_single_drop: !hasSubscriptionCredits(profile.membership_tier),
        report_json: report,
        report: report,
        score,
        language: body.language || 'en',
        is_premium: isInterviewStrategyGuide(reportType),
      })
      .select('id')
      .single();

    if (dbError) {
      console.warn('[DB] Report save failed:', dbError.message);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[Analyze] ${reportType} complete in ${duration}s model=${modelUsed}`);

    return NextResponse.json({
      report,
      report_type: reportType,
      report_id: inserted?.id ?? null,
      resume_id: resumeId,
      cached: false,
      model_used: modelUsed,
      credits_remaining: {
        job_fit_snapshot:
          reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
            ? remaining
            : profile.available_job_fit_snapshot_credits,
        interview_strategy_guide:
          reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
            ? remaining
            : profile.available_interview_strategy_guide_credits,
        lite:
          reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
            ? remaining
            : profile.available_job_fit_snapshot_credits,
        full:
          reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
            ? remaining
            : profile.available_interview_strategy_guide_credits,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    console.error('[Analyze] Error:', message);
    const friendly =
      message.includes('Base64 decoding failed')
      || message.includes('inline_data.data')
        ? 'Resume PDF could not be read. Please re-upload the PDF file (do not reuse an old Saved Resume stub), then launch again.'
        : message;
    return NextResponse.json(
      { error: friendly, code: 'ANALYSIS_ERROR' },
      { status: 500 },
    );
  }
}
