import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chrome Extension | JobBeagle',
  description:
    'Add JobBeagle to Chrome. Capture LinkedIn, Indeed, ZipRecruiter, Glassdoor, GovernmentJobs, and 104 postings in one click, then run a Job Fit Snapshot or Interview Strategy Guide.',
  alternates: { canonical: '/extension' },
  openGraph: {
    title: 'JobBeagle Chrome Extension',
    description: 'One-click job capture for LinkedIn and other boards.',
    url: '/extension',
  },
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
