import { describe, expect, it } from 'vitest';
import {
  blockingFindings,
  reviewGeneratedDiff,
  shouldSkipStaticReview,
} from '@/lib/generated-code-review';

describe('generated-code review', () => {
  it('blocks eval in added lines', () => {
    const diff = [
      '+++ b/lib/gemini-analyze.ts',
      '+const x = eval(userInput);',
    ].join('\n');
    const findings = reviewGeneratedDiff(diff);
    expect(blockingFindings(findings).some((f) => f.message.includes('eval()'))).toBe(true);
  });

  it('blocks server secret names added to a client component', () => {
    const diff = [
      '+++ b/components/InputForm.tsx',
      '+const k = process.env.PADDLE_API_KEY;',
    ].join('\n');
    const blocked = blockingFindings(reviewGeneratedDiff(diff));
    expect(blocked.some((f) => f.file === 'components/InputForm.tsx')).toBe(true);
  });

  it('asks to refactor as-any in lib, but does not block a clean fence wrap', () => {
    const dirty = ['+++ b/lib/profiles.ts', '+const row = data as any;'].join('\n');
    const dirtyFindings = reviewGeneratedDiff(dirty);
    expect(dirtyFindings.some((f) => f.severity === 'refactor' && f.message.includes('as any'))).toBe(
      true,
    );
    expect(blockingFindings(dirtyFindings)).toHaveLength(0);

    const clean = [
      '+++ b/lib/gemini-analyze.ts',
      '+text: assembleAnalysisDocuments({ rawJd, resumeText, resumeIsPdf: false }),',
    ].join('\n');
    const cleanFindings = reviewGeneratedDiff(clean);
    expect(blockingFindings(cleanFindings)).toHaveLength(0);
  });

  it('does not block the scanner or its fixtures when they mention banned APIs', () => {
    expect(shouldSkipStaticReview('lib/generated-code-review.ts')).toBe(true);
    const diff = [
      '+++ b/lib/generated-code-review.ts',
      "+{ name: 'eval()', re: /\\beval\\s*\\(/ },",
      '+++ b/lib/gemini-analyze.ts',
      '+const ok = wrapUntrusted(jd);',
    ].join('\n');
    expect(blockingFindings(reviewGeneratedDiff(diff))).toHaveLength(0);
  });
});
