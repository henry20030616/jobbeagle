import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId, jobTitle, companyName, contactEmail,
      applicantName, applicantEmail, applicantPhone,
      coverLetter, resumeUrl, resumeFileName,
    } = body;

    if (!applicantName || !applicantEmail || !jobTitle) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
    }

    // Save application to Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('job_applications').insert({
      job_id: jobId || null,
      job_title: jobTitle,
      company_name: companyName,
      applicant_user_id: user?.id || null,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      applicant_phone: applicantPhone || null,
      cover_letter: coverLetter || null,
      resume_url: resumeUrl || null,
      resume_file_name: resumeFileName || null,
      status: 'pending',
    });

    // Send notification via Web3Forms (uses the key already set for the contact form)
    const web3key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
    if (web3key) {
      const message = [
        `【職缺】${jobTitle} @ ${companyName}`,
        contactEmail ? `【企業聯絡信箱】${contactEmail}` : '',
        ``,
        `【應徵者】${applicantName}`,
        `【Email】${applicantEmail}`,
        applicantPhone ? `【電話】${applicantPhone}` : '',
        ``,
        coverLetter ? `【求職信】\n${coverLetter}` : '',
        resumeUrl ? `【履歷下載】${resumeUrl}` : '（未附履歷）',
      ].filter(Boolean).join('\n');

      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: web3key,
          subject: `[Jobbeagle] 新應徵：${applicantName} → ${jobTitle}`,
          from_name: `${applicantName} (Jobbeagle)`,
          email: applicantEmail,
          message,
        }),
      });
    }

    return NextResponse.json({ success: true, emailSent: !!web3key });
  } catch (e: any) {
    console.error('Apply API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
