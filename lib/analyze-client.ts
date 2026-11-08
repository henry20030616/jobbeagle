import { MAX_ANALYZE_BODY_CHARS, MAX_JD_CHARS } from '@/constants/models';
import type { ResumeInput } from '@/types';

export type AnalyzeResponseJson = {
  status: number;
  ok: boolean;
  data: Record<string, unknown>;
  rawText: string;
};

export type AnalyzeRequestParts = {
  reportType: string;
  resume: ResumeInput;
  language: string;
  deviceFingerprint?: string | null;
  /** Prefer this over handoff/payload — already on the form, user-editable. */
  jobDescription?: string | null;
  handoffSid?: string | null;
  payloadParam?: string | null;
};

/**
 * Build the /api/analyze JSON body.
 * Prefer truncated JD text over re-sending `handoff_sid` / legacy `payload`
 * (those embed the full job as base64 and easily trip Vercel’s ~4.5MB cap
 * when combined with a PDF resume).
 */
export function buildAnalyzeRequestBody(parts: AnalyzeRequestParts): {
  body: Record<string, unknown>;
  serialized: string;
  tooLarge: boolean;
} {
  const jd = (parts.jobDescription ?? '').trim().slice(0, MAX_JD_CHARS);
  const body: Record<string, unknown> = {
    report_type: parts.reportType,
    resume: parts.resume,
    language: parts.language,
    device_fingerprint: parts.deviceFingerprint ?? undefined,
  };

  if (jd) {
    body.jobDescription = jd;
  } else if (parts.handoffSid) {
    body.handoff_sid = parts.handoffSid;
  } else if (parts.payloadParam) {
    body.payload = parts.payloadParam;
  }

  const serialized = JSON.stringify(body);
  return {
    body,
    serialized,
    tooLarge: analyzeBodyTooLarge(serialized),
  };
}

/**
 * Read /api/analyze (or any analyze-shaped) response without throwing on
 * plain-text 413 "Request Entity Too Large" bodies from Vercel/nginx.
 */
export async function readAnalyzeResponseJson(
  res: Response,
): Promise<AnalyzeResponseJson> {
  const rawText = await res.text();
  const entityTooLarge =
    res.status === 413
    || /request entity too large/i.test(rawText)
    || /payload too large/i.test(rawText);

  if (entityTooLarge) {
    return {
      status: res.status === 413 ? 413 : res.status,
      ok: false,
      data: {
        error: 'Request Entity Too Large',
        code: 'PAYLOAD_TOO_LARGE',
      },
      rawText,
    };
  }

  if (!rawText.trim()) {
    return {
      status: res.status,
      ok: res.ok,
      data: {},
      rawText,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        status: res.status,
        ok: res.ok,
        data: parsed as Record<string, unknown>,
        rawText,
      };
    }
    return {
      status: res.status,
      ok: false,
      data: { error: 'Unexpected analyze response shape', code: 'BAD_GATEWAY_BODY' },
      rawText,
    };
  } catch {
    return {
      status: res.status,
      ok: false,
      data: {
        error: rawText.slice(0, 200) || 'Analysis failed',
        code: 'BAD_GATEWAY_BODY',
      },
      rawText,
    };
  }
}

/** True when the serialized POST body would likely trip the platform body cap. */
export function analyzeBodyTooLarge(serializedBody: string): boolean {
  return serializedBody.length > MAX_ANALYZE_BODY_CHARS;
}
