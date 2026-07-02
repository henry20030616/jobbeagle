import LegalDocumentPage from '@/components/LegalDocumentPage';

export const metadata = {
  title: 'Privacy Policy | Jobbeagle',
  description: 'Jobbeagle privacy policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return <LegalDocumentPage type="privacy" />;
}
