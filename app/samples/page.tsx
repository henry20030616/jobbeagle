import type { Metadata } from 'next';
import { Suspense } from 'react';
import SampleReportClient from './SampleReportClient';

export const metadata: Metadata = {
  title: 'Sample Reports | JobBeagle',
  description:
    'Preview a Job Fit Snapshot and an Interview Strategy Guide. Same report format as a live JobBeagle analysis.',
  alternates: { canonical: '/samples' },
  openGraph: {
    title: 'JobBeagle sample reports',
    description: 'See the Job Fit Snapshot and Interview Strategy Guide before you run one.',
    url: '/samples',
  },
};

export default function SamplesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading sample…
        </div>
      }
    >
      <SampleReportClient />
    </Suspense>
  );
}
