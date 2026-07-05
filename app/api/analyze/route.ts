import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type {
  AnalyzeRequestBody,
  LiteReport,
  FullReport,
  ReportType,
  ResumeInput,
} from '@/types';
import {
  decodeExtensionPayload,
  payloadToPreFlightData,
  deriveJobId,
  truncateText,
} from '@/lib/payload';
import {
  ensureProfile,
  checkDeviceSybil,
  bindDeviceFingerprint,
  canAffordReport,
  deductCredit,
  findCachedReport,
} from '@/lib/profiles';
import {
  countCombinedTokens,
  isTokenLimitExceeded,
  executeLiteAnalysis,
  executeFullAnalysis,
} from '@/lib/gemini-analyze';
import { normalizeLiteReport, isEnrichedLiteReport } from '@/lib/normalize-lite-report';
import { resolveResumeForAnalysis } from '@/lib/resume-parser';
import { rateLimitAnalyze } from '@/lib/redis';
import { tryActivateReferralMilestone } from '@/lib/referrals';
import { MAX_JD_CHARS, MAX_RESUME_CHARS } from '@/constants/models';
import { validateJobDescription } from '@/lib/validate-job-description';

export const maxDuration = 60;

interface ResolvedInput {
  company_name: string;
  job_title: string;
  raw_jd: string;
  linkedin_job_id: string;
  resume_text: string;
  pdf_inline?: { data: string; mimeType: string };
}

async function resolveInput(
  body: AnalyzeRequestBody,
  resume?: ResumeInput,
): Promise<ResolvedInput> {
  if (body.payload) {
    const ext = decodeExtensionPayload(body.payload);
    const pf = payloadToPreFlightData(ext);
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
        pdf_inline: resolved.pdfInline,
      };
    }
    return {
      company_name: pf.company_name,
      job_title: pf.job_title,
      raw_jd: truncateText(pf.raw_jd, MAX_JD_CHARS),
      linkedin_job_id: deriveJobId(pf.linkedin_job_id, pf.raw_jd, pf.company_name),
      resume_text: truncateText(resumeText, MAX_RESUME_CHARS),
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
    const reportType: ReportType = body.report_type === 'full' ? 'full' : 'lite';

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

    const cached = await findCachedReport(
      admin,
      user.id,
      input.linkedin_job_id,
      reportType,
    );
    if (cached?.report_json) {
      const useCache =
        reportType !== 'lite' || isEnrichedLiteReport(cached.report_json);
      if (useCache) {
        const cachedReport =
          reportType === 'lite'
            ? normalizeLiteReport(cached.report_json as LiteReport)
            : cached.report_json;
        return NextResponse.json({
          report: cachedReport,
          report_type: reportType,
          report_id: cached.id,
          cached: true,
          model_used: 'cache',
        });
      }
    }

    if (!canAffordReport(profile, reportType)) {
      return NextResponse.json(
        {
          error: 'Insufficient credits. Upgrade or purchase to continue.',
          code: 'PAYMENT_REQUIRED',
          profile: {
            lite_credits: profile.available_lite_credits,
            full_credits: profile.available_full_credits,
            membership_tier: profile.membership_tier,
          },
        },
        { status: 402 },
      );
    }

    let report: LiteReport | FullReport;
    let modelUsed: string;

    if (reportType === 'lite') {
      const result = await executeLiteAnalysis(
        input.resume_text,
        input.raw_jd,
        input.pdf_inline,
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
      );
      report = result.report;
      modelUsed = result.model;
    }

    const remaining = await deductCredit(admin, user.id, reportType);
    if (remaining < 0 && profile.membership_tier === 'free') {
      console.warn('[Analyze] Credit deduction returned -1 after success');
    }

    if (reportType === 'lite') {
      await tryActivateReferralMilestone(admin, user.id);
    }

    const score =
      reportType === 'lite'
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
        linkedin_job_id: input.linkedin_job_id,
        report_type: reportType,
        is_single_drop: body.is_single_drop === true,
        report_json: report,
        report: report,
        score,
        language: body.language || 'en',
        is_premium: reportType === 'full',
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
      cached: false,
      model_used: modelUsed,
      credits_remaining: {
        lite: reportType === 'lite' ? remaining : profile.available_lite_credits,
        full: reportType === 'full' ? remaining : profile.available_full_credits,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    console.error('[Analyze] Error:', message);
    return NextResponse.json(
      { error: message, code: 'ANALYSIS_ERROR' },
      { status: 500 },
    );
  }
}
