import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Report | JobBeagle',
  ...noIndexMetadata(),
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
