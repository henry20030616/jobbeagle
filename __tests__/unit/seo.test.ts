import { describe, expect, it } from 'vitest';
import {
  SITE_URL,
  absoluteUrl,
  buildJsonLdGraph,
  buildPublicSitemap,
  buildRobots,
} from '@/lib/seo';

describe('seo helpers', () => {
  it('builds absolute marketing URLs', () => {
    expect(absoluteUrl('/extension')).toBe(`${SITE_URL}/extension`);
    expect(absoluteUrl(SITE_URL)).toBe(SITE_URL);
  });

  it('keeps private funnels out of robots and the sitemap', () => {
    const robots = buildRobots();
    const firstRule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    const disallowed = firstRule?.disallow ?? [];
    expect(disallowed).toEqual(
      expect.arrayContaining(['/api/', '/account', '/confirm', '/report']),
    );
    expect(robots.sitemap).toBe(`${SITE_URL}/sitemap.xml`);

    const urls = buildPublicSitemap(new Date('2026-09-05T00:00:00.000Z')).map((row) => row.url);
    expect(urls).toContain(`${SITE_URL}/extension`);
    expect(urls).toContain(`${SITE_URL}/samples`);
    expect(urls).not.toContain(`${SITE_URL}/confirm`);
    expect(urls).not.toContain(`${SITE_URL}/account`);
    expect(urls).not.toContain(`${SITE_URL}/report`);
    expect(urls).not.toContain(`${SITE_URL}/shorts`);
  });

  it('emits Organization + SoftwareApplication JSON-LD', () => {
    const graph = buildJsonLdGraph();
    const nodes = graph['@graph'];
    expect(Array.isArray(nodes)).toBe(true);
    const types = (nodes as Array<{ '@type': string }>).map((node) => node['@type']);
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'SoftwareApplication']));
  });
});
