import type { Metadata } from 'next';
import CareerContextPageClient from './CareerContextPageClient';

export const metadata: Metadata = {
  title: 'Career Context | JobBeagle',
  description:
    'Set optional floors for level, location, work authorization, target TC, and walk-away. Injected into every Job Fit Snapshot and Interview Strategy Guide.',
  alternates: { canonical: '/career-context' },
};

export default function CareerContextPage() {
  return <CareerContextPageClient />;
}
