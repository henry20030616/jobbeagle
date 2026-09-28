import { describe, expect, it } from 'vitest';
import {
  HOMEPAGE_FORM_COPY,
  getHomepageFormCopy,
} from '@/constants/homepage-form-copy';

describe('homepage form copy', () => {
  it('keeps desktop and mobile on the same English strings', () => {
    const t = getHomepageFormCopy('en');
    expect(t.generate).toBe('AI Strategy Analysis');
    expect(t.upload).toBe('Click to upload Resume');
    expect(t.reportTypeStep).toBe('3. Report type');
    expect(t.launchStep).toBe('4. Launch');
    expect(t.jobUrlPlaceholder).toContain('Paste the full job posting');
    expect(t.snapshotBlurb).toContain('one-page fit check');
    expect(t.sampleLink).toBe('Report samples');
    expect(t.featuresAccordion).toBe('Jobbeagle advantages');
  });

  it('covers every app language', () => {
    expect(Object.keys(HOMEPAGE_FORM_COPY).sort()).toEqual(
      ['ar', 'en', 'es', 'hi', 'zh-CN', 'zh-TW'].sort(),
    );
  });
});
