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
    expect(t.reportTypeStep).toBe('3. Pick one report');
    expect(t.launchStep).toBe('4. Launch');
    expect(t.jobUrlPlaceholder).toContain('Paste the full job posting');
    expect(t.snapshotBlurb).toContain('one-page fit check');
    expect(t.sampleLink).toBe('View report samples');
    expect(t.featuresAccordion).toBe('Jobbeagle advantages');
  });

  it('does not advertise the backend score floor to customers', () => {
    const scoreBand = /50\s*[–-]\s*100|0\s*[–-]\s*100|不低於\s*50|不低于\s*50/;
    for (const copy of Object.values(HOMEPAGE_FORM_COPY)) {
      expect(copy.snapshotBlurb).not.toMatch(scoreBand);
      expect(copy.strategyBlurb).not.toMatch(scoreBand);
    }
  });

  it('puts live web search on Guide, not Fit Snapshot', () => {
    const noWebPitch =
      /no web|closed-book|flash-lite|不上網|不聯網|不联网|sin búsqueda|वेब सर्च नहीं|بلا بحث/i;
    const webSearchPitch = /web search|網搜|网搜|búsqueda web|वेब सर्च|الويب/i;
    for (const copy of Object.values(HOMEPAGE_FORM_COPY)) {
      expect(copy.snapshotBlurb).not.toMatch(noWebPitch);
      expect(copy.snapshotBlurb).not.toMatch(webSearchPitch);
      expect(copy.strategyBlurb).toMatch(webSearchPitch);
    }
  });

  it('covers every app language', () => {
    expect(Object.keys(HOMEPAGE_FORM_COPY).sort()).toEqual(
      ['ar', 'en', 'es', 'hi', 'zh-CN', 'zh-TW'].sort(),
    );
  });
});
