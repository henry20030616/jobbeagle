import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Account | JobBeagle',
  description: 'Manage JobBeagle credits, billing, and Career Context.',
  ...noIndexMetadata(),
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
