import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send email if API key and target email exist
    const targetEmail = contactEmail || process.env.PLATFORM_CONTACT_EMAIL;
    if (!targetEmail) {
      return NextResponse.json({ success: true, emailSent: false, reason: 'no_contact_email' });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: true, emailSent: false, reason: 'no_resend_key' });
    }

    const emailHtml = `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
        <div style="background: #1e293b; border-radius: 10px; padding: 24px; color: white; margin-bottom: 20px;">
          <h2 style="margin: 0 0 4px 0; font-size: 20px;">📩 新應徵通知</h2>
          <p style="margin: 0; opacity: 0.7; font-size: 14px;">透過 Jobbeagle Shorts 收到一份應徵</p>
        </div>

        <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">職缺資訊</h3>
          <p style="margin: 4px 0; font-size: 16px; font-weight: 600; color: #0f172a;">${jobTitle}</p>
          <p style="margin: 4px 0; color: #64748b;">${companyName}</p>
        </div>

        <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">應徵者資訊</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 80px;">姓名</td><td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${applicantName}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Email</td><td style="padding: 6px 0;"><a href="mailto:${applicantEmail}" style="color: #3b82f6;">${applicantEmail}</a></td></tr>
            ${applicantPhone ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">電話</td><td style="padding: 6px 0; color: #0f172a;">${applicantPhone}</td></tr>` : ''}
          </table>
        </div>

        ${coverLetter ? `
        <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 10px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">自我介紹 / 求職信</h3>
          <p style="margin: 0; color: #374151; line-height: 1.7; white-space: pre-wrap;">${coverLetter}</p>
        </div>` : ''}

        ${resumeUrl ? `
        <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 10px 0; color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">履歷</h3>
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">${resumeFileName || '履歷檔案'}</p>
          <a href="${resumeUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">📄 下載履歷</a>
        </div>` : ''}

        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 20px 0 0 0;">此信件由 <a href="https://www.jobbeagle.com/shorts" style="color: #3b82f6;">Jobbeagle Shorts</a> 自動發送</p>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'Jobbeagle <noreply@jobbeagle.com>',
      to: [targetEmail],
      replyTo: applicantEmail,
      subject: `【應徵】${applicantName} 應徵 ${jobTitle}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json({ success: true, emailSent: false, reason: emailError.message });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (e: any) {
    console.error('Apply API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
