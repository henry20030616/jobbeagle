import type { Metadata } from 'next';
import DangerZonePageClient from './DangerZonePageClient';

export const metadata: Metadata = {
  title: 'Danger zone | Jobbeagle',
  description:
    'Pause or permanently delete your JobBeagle account. CCPA hard delete of profile, reports, and stored resumes.',
};

export default function DangerZonePage() {
  return <DangerZonePageClient />;
}
