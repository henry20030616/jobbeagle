import type { MetadataRoute } from 'next';
import { PUBLISHED_CHROME_WEBSTORE_URL } from '@/lib/chrome-webstore';
import { isShortsEnabled } from '@/constants/features';

export const SITE_URL = 'https://www.jobbeagle.com';

export const SITE_NAME = 'JobBeagle';

export const DEFAULT_TITLE = 'JobBeagle | Job Fit Snapshot & Interview Strategy';

export const DEFAULT_DESCRIPTION =
  'See if a role is worth applying for. JobBeagle turns your resume and a job post into a Job Fit Snapshot or Interview Strategy Guide — Chrome extension for LinkedIn, Indeed, ZipRecruiter, and more.';

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${suffix}`;
}

export function noIndexMetadata(): {
  robots: { index: false; follow: false; googleBot: { index: false; follow: false } };
} {
  return {
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

export function buildPublicSitemap(now = new Date()): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }> = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/extension', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/samples', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/career-context', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/terms', changeFrequency: 'monthly', priority: 0.5 },
  ];
  if (isShortsEnabled()) {
    pages.splice(4, 0, { path: '/shorts', changeFrequency: 'daily', priority: 0.6 });
  }
  return pages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/account', '/account/', '/confirm', '/report', '/employer/dashboard'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}

export function buildJsonLdGraph(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/icon.svg'),
        email: 'henry061680@gmail.com',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'JobBeagle',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Chrome',
        url: SITE_URL,
        downloadUrl: PUBLISHED_CHROME_WEBSTORE_URL,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description: DEFAULT_DESCRIPTION,
      },
    ],
  };
}
