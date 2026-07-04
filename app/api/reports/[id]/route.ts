import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isReportPremiumUnlocked,
  maskPremiumReportFields,
} from '@/lib/report-masking';
import type { InterviewReport } from '@/types';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('analysis_reports')
    .select('id, report, is_premium, job_title')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const fullReport = data.report as InterviewReport;
  const isPremium = data.is_premium === true;
  const report = isReportPremiumUnlocked(isPremium)
    ? fullReport
    : maskPremiumReportFields(fullReport);

  return NextResponse.json({
    reportId: data.id,
    jobTitle: data.job_title,
    isPremium,
    report,
  });
}
