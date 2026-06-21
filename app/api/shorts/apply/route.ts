import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Lazy init so `next build` does not require RESEND_API_KEY at module load. */
let resendSingleton: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId, jobTitle, companyName, contactEmail,
      location, salary,
      applicantName, applicantEmail, applicantPhone,
      applicationMessage,
      coverLetter, coverLetterUrl, coverLetterFileName,
      resumeUrl, resumeFileName,
    } = body;

    if (!applicantName || !applicantEmail || !jobTitle) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
    }

    // Save application to Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from('job_applications').insert({
      job_id: jobId || null,
      job_title: jobTitle,
      company_name: companyName,
      applicant_user_id: user?.id?.toString() || null,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      applicant_phone: applicantPhone || null,
      application_message: applicationMessage || null,
      cover_letter: coverLetter || null,
      cover_letter_url: coverLetterUrl || null,
      cover_letter_file_name: coverLetterFileName || null,
      resume_url: resumeUrl || null,
      resume_file_name: resumeFileName || null,
      status: 'unread',
    });
    if (insertError) {
      console.error('[apply] DB insert error:', JSON.stringify(insertError));
      return NextResponse.json({ success: false, error: '應徵失敗，請稍後再試' }, { status: 500 });
    }

    if (!process.env.RESEND_API_KEY || !contactEmail) {
      return NextResponse.json({ success: true, emailSent: false, reason: !contactEmail ? 'no_contact_email' : 'no_api_key' });
    }

    const todayStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });

    // 所有使用者輸入先做 HTML 跳脫，防止郵件客戶端 XSS
    const safe = {
      applicantName:        escapeHtml(applicantName || ''),
      applicantEmail:       escapeHtml(applicantEmail || ''),
      applicantPhone:       applicantPhone ? escapeHtml(applicantPhone) : null,
      jobTitle:             escapeHtml(jobTitle || ''),
      companyName:          escapeHtml(companyName || ''),
      location:             location ? escapeHtml(location) : null,
      salary:               salary ? escapeHtml(salary) : null,
      applicationMessage:   escapeHtml(applicationMessage || ''),
      coverLetter:          coverLetter ? escapeHtml(coverLetter) : null,
      coverLetterUrl:       coverLetterUrl ? escapeHtml(coverLetterUrl) : null,
      coverLetterFileName:  coverLetterFileName ? escapeHtml(coverLetterFileName) : null,
      resumeUrl:            resumeUrl ? escapeHtml(resumeUrl) : null,
      resumeFileName:       resumeFileName ? escapeHtml(resumeFileName) : null,
    };

    const coverLetterBlock = (() => {
      if (safe.coverLetter) return `
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid #f1f5f9;">
            <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">求職信</p>
            <p style="margin:0;color:#334155;font-size:14px;line-height:1.8;white-space:pre-wrap;">${safe.coverLetter}</p>
          </td>
        </tr>`;
      if (safe.coverLetterUrl) return `
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid #f1f5f9;">
            <p style="margin:0 0 10px 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">求職信</p>
            <a href="${safe.coverLetterUrl}" style="display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;color:#0ea5e9;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
              📄 下載求職信${safe.coverLetterFileName ? ` — ${safe.coverLetterFileName}` : ''}
            </a>
          </td>
        </tr>`;
      return '';
    })();

    const resumeBlock = safe.resumeUrl ? `
      <tr>
        <td style="padding:20px 32px;border-bottom:1px solid #f1f5f9;">
          <p style="margin:0 0 10px 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">附件履歷</p>
          <a href="${safe.resumeUrl}" style="display:inline-flex;align-items:center;gap:8px;background:#0ea5e9;color:white;padding:11px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">
            📥 下載履歷${safe.resumeFileName ? ` — ${safe.resumeFileName}` : ''}
          </a>
        </td>
      </tr>` : `
      <tr>
        <td style="padding:16px 32px;border-bottom:1px solid #f1f5f9;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">（應徵者未附上履歷）</p>
        </td>
      </tr>`;

    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;border-radius:12px 12px 0 0;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 2px 0;font-size:20px;font-weight:800;color:white;letter-spacing:-.3px;">Jobbeagle</p>
                  <p style="margin:0;font-size:12px;color:#64748b;">noreply@jobbeagle.com</p>
                </td>
                <td align="right">
                  <span style="background:#16a34a;color:white;font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;letter-spacing:.03em;">新應徵通知</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Job banner -->
        <tr>
          <td style="background:#1e40af;padding:20px 32px;">
            <p style="margin:0 0 4px 0;font-size:11px;color:#93c5fd;text-transform:uppercase;letter-spacing:.08em;font-weight:600;">應徵職位</p>
            <p style="margin:0 0 6px 0;font-size:22px;font-weight:800;color:white;">${safe.jobTitle}</p>
            <p style="margin:0;font-size:14px;color:#bfdbfe;font-weight:500;">${safe.companyName}${safe.location ? `　·　${safe.location}` : ''}${safe.salary ? `　·　${safe.salary}` : ''}</p>
          </td>
        </tr>

        <!-- Canned intro -->
        <tr>
          <td style="background:white;padding:24px 32px;border-bottom:1px solid #f1f5f9;">
            <p style="margin:0 0 12px 0;font-size:14px;color:#475569;line-height:1.7;font-style:italic;background:#f8fafc;border-left:3px solid #0ea5e9;padding:12px 16px;border-radius:0 8px 8px 0;">
              「${safe.applicationMessage}」
            </p>
            <p style="margin:0;font-size:13px;color:#94a3b8;">— 以上為應徵者留言，詳細資料如下：</p>
          </td>
        </tr>

        <!-- White card body -->
        <tr>
          <td style="background:white;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Applicant info -->
              <tr>
                <td style="padding:20px 32px;border-bottom:1px solid #f1f5f9;">
                  <p style="margin:0 0 14px 0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">應徵者資訊</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 20px 5px 0;font-size:13px;color:#94a3b8;white-space:nowrap;vertical-align:top;">姓名</td>
                      <td style="padding:5px 0;font-size:14px;font-weight:700;color:#0f172a;">${safe.applicantName}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 20px 5px 0;font-size:13px;color:#94a3b8;white-space:nowrap;vertical-align:top;">Email</td>
                      <td style="padding:5px 0;font-size:14px;color:#0ea5e9;"><a href="mailto:${safe.applicantEmail}" style="color:#0ea5e9;text-decoration:none;">${safe.applicantEmail}</a></td>
                    </tr>
                    ${safe.applicantPhone ? `
                    <tr>
                      <td style="padding:5px 20px 5px 0;font-size:13px;color:#94a3b8;white-space:nowrap;vertical-align:top;">電話</td>
                      <td style="padding:5px 0;font-size:14px;color:#0f172a;">${safe.applicantPhone}</td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding:5px 20px 5px 0;font-size:13px;color:#94a3b8;white-space:nowrap;vertical-align:top;">應徵日期</td>
                      <td style="padding:5px 0;font-size:14px;color:#0f172a;">${todayStr}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              ${coverLetterBlock}
              ${resumeBlock}

            </table>
          </td>
        </tr>

        <!-- Reply CTA -->
        <tr>
          <td style="background:white;padding:24px 32px;border-top:2px solid #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 12px 0;font-size:13px;color:#475569;">對這份應徵感興趣？直接回覆此信即可聯絡求職者。</p>
                  <a href="mailto:${safe.applicantEmail}?subject=Re: 關於 ${safe.jobTitle} 應徵" style="display:inline-block;background:#0f172a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">
                    ✉️ 回覆應徵者
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-radius:0 0 12px 12px;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              此通知由 <a href="https://www.jobbeagle.com/shorts" style="color:#0ea5e9;text-decoration:none;">Jobbeagle Shorts</a> 自動發送。
              若您不希望收到此類通知，請更新您的企業設定。
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ success: true, emailSent: false, reason: 'no_api_key' });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Jobbeagle <noreply@jobbeagle.com>',
      to: [contactEmail],
      replyTo: applicantEmail,
      subject: `【應徵通知】${safe.applicantName} 應徵 ${safe.jobTitle} — ${safe.companyName}`,
      html,
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
