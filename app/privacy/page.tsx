import LegalDocumentPage from '@/components/LegalDocumentPage';

export const metadata = {
  title: 'Privacy Policy | JobBeagle',
  description: 'JobBeagle privacy policy — how we collect, use, and protect your data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return <LegalDocumentPage type="privacy" />;
}
