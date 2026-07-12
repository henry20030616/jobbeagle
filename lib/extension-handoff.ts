import crypto from 'crypto';
import type { ExtensionJobPayload } from '@/types';

const HANDOFF_TTL_MS = 30 * 60 * 1000;
const MAX_RAW_TEXT_CHARS = 120_000;

function getHandoffSecret(): string {
  const secret =
    process.env.EXTENSION_HANDOFF_SECRET
    || process.env.CRON_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error(
      'Set EXTENSION_HANDOFF_SECRET or CRON_SECRET for extension handoff tokens.',
    );
  }
  return secret;
}

function sign(payloadB64: string): string {
  return crypto.createHmac('sha256', getHandoffSecret()).update(payloadB64).digest('base64url');
}

export interface HandoffCaptureInput {
  pageTitle: string;
  pageUrl: string;
  rawText: string;
  jobId: string;
  jobTitle?: string;
  companyName?: string;
}

export function validateCaptureInput(body: unknown): HandoffCaptureInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid JSON body');
  }
  const b = body as Record<string, unknown>;
  const pageTitle = typeof b.pageTitle === 'string' ? b.pageTitle.trim() : '';
  const pageUrl = typeof b.pageUrl === 'string' ? b.pageUrl.trim() : '';
  const rawText = typeof b.rawText === 'string' ? b.rawText.trim() : '';
  const jobId = typeof b.jobId === 'string' && b.jobId.trim() ? b.jobId.trim() : 'unknown';
  const jobTitle = typeof b.jobTitle === 'string' ? b.jobTitle.trim() : undefined;
  const companyName = typeof b.companyName === 'string' ? b.companyName.trim() : undefined;

  if (!rawText || rawText.length < 40) {
    throw new Error('Job text too short (min 40 characters)');
  }
  if (rawText.length > MAX_RAW_TEXT_CHARS) {
    throw new Error(`Job text too long (max ${MAX_RAW_TEXT_CHARS} characters)`);
  }
  if (!pageUrl.startsWith('http')) {
    throw new Error('Invalid pageUrl');
  }

  return { pageTitle, pageUrl, rawText, jobId, jobTitle, companyName };
}

/** Create a signed handoff token (sid) for confirm page */
export function createHandoffToken(input: HandoffCaptureInput): string {
  const payload = {
    pageTitle: input.pageTitle,
    pageUrl: input.pageUrl,
    rawText: input.rawText,
    jobId: input.jobId,
    jobTitle: input.jobTitle || undefined,
    companyName: input.companyName || undefined,
    exp: Date.now() + HANDOFF_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/** Verify sid and return extension payload */
export function verifyHandoffToken(sid: string): ExtensionJobPayload {
  const parts = sid.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid handoff token');
  }
  const [payloadB64, signature] = parts;
  const expected = sign(payloadB64);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Invalid handoff signature');
  }

  const json = Buffer.from(payloadB64, 'base64url').toString('utf-8');
  const parsed = JSON.parse(json) as ExtensionJobPayload & { exp?: number };

  if (!parsed.rawText?.trim() || !parsed.jobId) {
    throw new Error('Corrupt handoff payload');
  }
  if (!parsed.exp || Date.now() > parsed.exp) {
    throw new Error('Handoff token expired');
  }

  return {
    pageTitle: parsed.pageTitle || '',
    pageUrl: parsed.pageUrl || '',
    rawText: parsed.rawText,
    jobId: parsed.jobId,
    jobTitle: parsed.jobTitle,
    companyName: parsed.companyName,
  };
}
