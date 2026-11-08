import { MAX_ANALYZE_BODY_CHARS } from '@/constants/models';

export type AnalyzeResponseJson = {
  status: number;
  ok: boolean;
  data: Record<string, unknown>;
  rawText: string;
};

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
