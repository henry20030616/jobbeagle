import { describe, expect, it } from 'vitest';
import { isWordFileName } from '@/lib/resume-client';

describe('resume-client', () => {
  it('detects Word uploads by name and mime', () => {
    expect(
      isWordFileName({
        name: '許瀚文中英文履歷20261025.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      } as File),
    ).toBe(true);
    expect(isWordFileName({ name: 'cv.pdf', type: 'application/pdf' } as File)).toBe(false);
  });
});
