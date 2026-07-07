import { NextRequest, NextResponse } from 'next/server';
import {
  createHandoffToken,
  validateCaptureInput,
  verifyHandoffToken,
} from '@/lib/extension-handoff';
import { payloadToPreFlightData } from '@/lib/payload';

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = validateCaptureInput(body);
    const sid = createHandoffToken(input);

    return NextResponse.json(
      {
        sid,
        expiresInSec: 30 * 60,
        preflightUrl: `${request.nextUrl.origin}/pre-flight?sid=${encodeURIComponent(sid)}`,
      },
      { headers: corsHeaders() },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid capture payload';
    const status = message.includes('too short') ? 400 : 400;
    return NextResponse.json(
      { error: message, errorCode: 'INVALID_CAPTURE' },
      { status, headers: corsHeaders() },
    );
  }
}

export async function GET(request: NextRequest) {
  const sid = request.nextUrl.searchParams.get('sid');
  if (!sid) {
    return NextResponse.json(
      { error: 'Missing sid parameter', errorCode: 'MISSING_SID' },
      { status: 400, headers: corsHeaders() },
    );
  }

  try {
    const payload = verifyHandoffToken(sid);
    const job = payloadToPreFlightData(payload);
    return NextResponse.json(
      {
        sid,
        payload,
        job: {
          company_name: job.company_name,
          job_title: job.job_title,
          raw_jd: job.raw_jd,
          char_count: job.raw_jd.length,
          linkedin_job_id: job.linkedin_job_id,
          page_url: job.page_url,
        },
      },
      { headers: corsHeaders() },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid handoff token';
    return NextResponse.json(
      { error: message, errorCode: 'INVALID_SID' },
      { status: 410, headers: corsHeaders() },
    );
  }
}
