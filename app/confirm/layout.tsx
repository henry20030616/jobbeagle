import { Suspense } from 'react';

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
