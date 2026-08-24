import type { Metadata } from 'next';
import CareerContextPageClient from './CareerContextPageClient';

export const metadata: Metadata = {
  title: 'Career Context | Jobbeagle',
  description:
    'Set optional floors for level, location, work authorization, target TC, and walk-away. Injected into every Job Fit Snapshot and Interview Strategy Guide.',
};

export default function CareerContextPage() {
  return <CareerContextPageClient />;
}
