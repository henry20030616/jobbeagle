import { describe, expect, it } from 'vitest';
import { followUpLetterParagraphs, parseFollowUpEmail } from '@/lib/follow-up-email';
import { getSampleStrategyGuideReport } from '@/lib/sample-reports';

describe('parseFollowUpEmail', () => {
  it('splits coaching note, subject, and letter paragraphs', () => {
    const parsed = parseFollowUpEmail(
      [
        'Send after the interview. Do not send once pay is discussed.',
        'Subject: Thank you — Senior Business Analyst',
        'Dear Hiring Team,',
        'Thank you for today.',
        'Best regards,\n[Your name]',
      ].join('\n\n'),
    );
    expect(parsed.when).toMatch(/after the interview/);
    expect(parsed.subject).toBe('Thank you — Senior Business Analyst');
    expect(followUpLetterParagraphs(parsed.body)).toEqual([
      'Dear Hiring Team,',
      'Thank you for today.',
      'Best regards,\n[Your name]',
    ]);
  });

  it('reads CJK 主旨 and keeps greeting on its own line', () => {
    const parsed = parseFollowUpEmail(
      '面試結束再寄。\n\n主旨：Senior Business Analyst 面試後續\n\n您好：\n\n感謝您今天撥冗面試。\n\n此致\n[您的姓名]',
    );
    expect(parsed.subject).toBe('Senior Business Analyst 面試後續');
    expect(followUpLetterParagraphs(parsed.body)[0]).toBe('您好：');
  });
});

describe('sample follow-up letter', () => {
  it('is a copy-ready letter, not one paragraph', () => {
    const letter = getSampleStrategyGuideReport('zh-TW').guide_modules?.negotiation.follow_up_email ?? '';
    const parsed = parseFollowUpEmail(letter);
    expect(parsed.when).toMatch(/面試結束/);
    expect(parsed.subject).toMatch(/Senior Business Analyst/);
    const paragraphs = followUpLetterParagraphs(parsed.body);
    expect(paragraphs[0]).toBe('您好：');
    expect(paragraphs.join('\n')).toMatch(/此致/);
    expect(paragraphs.length).toBeGreaterThanOrEqual(4);
  });
});
