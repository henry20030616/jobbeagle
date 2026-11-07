import { describe, expect, it } from 'vitest';
import {
  extractResumeText,
  isPdfPlaceholderContent,
  isValidPdfBase64,
  sanitizePdfBase64,
} from '@/lib/resume-parser';

describe('PDF resume base64 guards', () => {
  it('detects library placeholder stubs', () => {
    expect(
      isPdfPlaceholderContent('[PDF resume: 許瀚文中英文履歷 .pdf]\n[PDF resume attached]'),
    ).toBe(true);
    expect(isValidPdfBase64('[PDF resume: x.pdf]\n[PDF resume attached]')).toBe(false);
  });

  it('accepts real PDF magic in base64', () => {
    // "%PDF-1.4" as base64
    const b64 = Buffer.from('%PDF-1.4\n%âãÏÓ\n').toString('base64') + 'A'.repeat(80);
    expect(isValidPdfBase64(b64)).toBe(true);
    expect(sanitizePdfBase64(`data:application/pdf;base64,${b64}`)).toBe(b64);
  });
});

describe('Word resume extract', () => {
  it('rejects fake base64 that is not a DOCX zip', async () => {
    const fake = Buffer.from('%PDF-1.4 not a docx').toString('base64');
    await expect(
      extractResumeText({
        type: 'file',
        content: fake,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileName: 'resume.docx',
      }),
    ).rejects.toThrow(/couldn't read your resume|PDF|Word/i);
  });

  it('accepts library rows that kept .docx mime but stored extracted plain text', async () => {
    const plain =
      '許瀚文\nBusiness Analyst\n5 years experience in payments and product operations.';
    const text = await extractResumeText({
      type: 'file',
      content: plain,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName: '許瀚文中英文履歷20261025.docx',
    });
    expect(text).toContain('許瀚文');
    expect(text).toContain('Business Analyst');
  });
});
