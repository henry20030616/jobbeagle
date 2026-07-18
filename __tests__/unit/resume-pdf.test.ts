import { describe, expect, it } from 'vitest';
import {
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
