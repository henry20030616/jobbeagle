import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('[Contact] RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const senderLabel = name?.trim() || '匿名用戶';
    const replyLine = email?.trim()
      ? `<p><strong>回覆信箱：</strong> <a href="mailto:${email}">${email}</a></p>`
      : '';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Jobbeagle 留言 <onboarding@resend.dev>',
        to: ['henry061680@gmail.com'],
        subject: `Jobbeagle 用戶留言 — ${senderLabel}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
            <h2 style="color:#4f46e5;margin-top:0;">Jobbeagle 用戶留言</h2>
            <p><strong>稱呼：</strong> ${senderLabel}</p>
            ${replyLine}
            <p><strong>留言內容：</strong></p>
            <blockquote style="border-left:4px solid #6366f1;padding:12px 16px;margin:8px 0;background:#eef2ff;border-radius:4px;color:#1e1b4b;font-size:15px;white-space:pre-wrap;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</blockquote>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:12px;">此信件由 Jobbeagle 網站自動發送</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[Contact] Resend API error:', res.status, errorBody);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
