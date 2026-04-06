import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
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

    // Send email via Gmail SMTP if configured
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const targetEmail = contactEmail;

    if (gmailUser && gmailPass && targetEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });

      const resumeSection = resumeUrl
        ? `<div style="margin-top:16px;padding:16px;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;">
            <p style="margin:0 0 10px 0;font-size:13px;color:#0369a1;font-weight:600;">📄 履歷</p>
            <p style="margin:0 0 10px 0;color:#64748b;font-size:13px;">${resumeFileName || '履歷檔案'}</p>
            <a href="${resumeUrl}" style="background:#0ea5e9;color:white;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">下載履歷</a>
          </div>`
        : '<p style="color:#94a3b8;font-size:13px;">（未附上履歷）</p>';

      await transporter.sendMail({
        from: `Jobbeagle <${gmailUser}>`,
        to: targetEmail,
        replyTo: applicantEmail,
        subject: `【應徵通知】${applicantName} 應徵 ${jobTitle}`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:580px;margin:0 auto;padding:24px;">
            <div style="background:#0f172a;border-radius:10px;padding:20px 24px;margin-bottom:20px;">
              <h2 style="color:white;margin:0 0 4px 0;font-size:18px;">📩 新應徵通知</h2>
              <p style="color:#94a3b8;margin:0;font-size:13px;">透過 Jobbeagle Shorts 收到一份應徵</p>
            </div>

            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e2e8f0;">
              <p style="margin:0 0 4px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">職缺</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${jobTitle}</p>
              <p style="margin:4px 0 0 0;color:#64748b;font-size:14px;">${companyName}</p>
            </div>

            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e2e8f0;">
              <p style="margin:0 0 12px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">應徵者資訊</p>
              <table style="border-collapse:collapse;width:100%;">
                <tr><td style="padding:5px 0;color:#64748b;font-size:13px;width:60px;">姓名</td><td style="padding:5px 0;font-weight:600;color:#0f172a;">${applicantName}</td></tr>
                <tr><td style="padding:5px 0;color:#64748b;font-size:13px;">Email</td><td style="padding:5px 0;"><a href="mailto:${applicantEmail}" style="color:#3b82f6;">${applicantEmail}</a></td></tr>
                ${applicantPhone ? `<tr><td style="padding:5px 0;color:#64748b;font-size:13px;">電話</td><td style="padding:5px 0;color:#0f172a;">${applicantPhone}</td></tr>` : ''}
              </table>
            </div>

            ${coverLetter ? `
            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #e2e8f0;">
              <p style="margin:0 0 10px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">求職信</p>
              <p style="margin:0;color:#374151;line-height:1.7;white-space:pre-wrap;font-size:14px;">${coverLetter}</p>
            </div>` : ''}

            ${resumeSection}

            <p style="text-align:center;color:#cbd5e1;font-size:11px;margin-top:24px;">
              此信件由 <a href="https://www.jobbeagle.com/shorts" style="color:#3b82f6;">Jobbeagle Shorts</a> 自動發送
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, emailSent: !!(gmailUser && gmailPass && targetEmail) });
  } catch (e: any) {
    console.error('Apply API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
