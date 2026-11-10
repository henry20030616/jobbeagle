import { describe, expect, it } from 'vitest';
import {
  isIncompleteSavedPdf,
  pickDefaultSavedResume,
  resumeLibraryTimestamp,
  savedResumeToInput,
} from '@/lib/resume-default';

describe('pickDefaultSavedResume', () => {
  it('picks the newest complete resume', () => {
    const pick = pickDefaultSavedResume([
      {
        type: 'text',
        content: 'older',
        fileName: 'old.txt',
        timestamp: 100,
      },
      {
        type: 'text',
        content: 'newer',
        fileName: 'new.txt',
        timestamp: 200,
      },
    ]);
    expect(pick?.content).toBe('newer');
    expect(savedResumeToInput(pick!).fileName).toBe('new.txt');
  });

  it('skips incomplete PDF stubs and falls back to the next resume', () => {
    const pick = pickDefaultSavedResume([
      {
        type: 'file',
        content: '[PDF resume: big.pdf]',
        mimeType: 'application/pdf',
        fileName: 'big.pdf',
        timestamp: 300,
      },
      {
        type: 'text',
        content: 'plain resume text',
        fileName: 'cv.txt',
        timestamp: 100,
      },
    ]);
    expect(pick?.fileName).toBe('cv.txt');
  });

  it('returns null when the library is empty', () => {
    expect(pickDefaultSavedResume([])).toBeNull();
  });
});

describe('isIncompleteSavedPdf / resumeLibraryTimestamp', () => {
  it('detects stub PDFs', () => {
    expect(
      isIncompleteSavedPdf({
        mimeType: 'application/pdf',
        content: '[PDF resume attached]',
      }),
    ).toBe(true);
    expect(
      isIncompleteSavedPdf({
        mimeType: 'text/plain',
        content: 'hello',
      }),
    ).toBe(false);
  });

  it('uses the later of last_used and created', () => {
    expect(
      resumeLibraryTimestamp('2026-01-02T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
    ).toBe(Date.parse('2026-01-02T00:00:00.000Z'));
    expect(
      resumeLibraryTimestamp(null, '2026-01-01T00:00:00.000Z'),
    ).toBe(Date.parse('2026-01-01T00:00:00.000Z'));
  });
});
