import { Suspense } from 'react';
import SampleReportClient from './SampleReportClient';

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
