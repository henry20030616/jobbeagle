import LegalDocumentPage from '@/components/LegalDocumentPage';

export const metadata = {
  title: 'Terms of Service | JobBeagle',
  description: 'JobBeagle terms of service — rules for using our AI job tools and Chrome extension.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <LegalDocumentPage type="terms" />;
}
