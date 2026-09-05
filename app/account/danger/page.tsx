import type { Metadata } from 'next';
import DangerZonePageClient from './DangerZonePageClient';

export const metadata: Metadata = {
  title: 'Danger zone | JobBeagle',
  description:
    'Pause or permanently delete your JobBeagle account. CCPA hard delete of profile, reports, and stored resumes.',
  robots: { index: false, follow: false },
};

export default function DangerZonePage() {
  return <DangerZonePageClient />;
}
