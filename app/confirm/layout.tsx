import type { Metadata } from 'next';
import { Suspense } from 'react';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Confirm | JobBeagle',
  ...noIndexMetadata(),
};

export default function ConfirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          Loading confirm…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
