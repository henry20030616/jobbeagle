'use client';

/** Legacy URL — redirects to /confirm (canonical). */
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LegacyPreFlightRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const q = params.toString();
    router.replace(q ? `/confirm?${q}` : '/confirm');
  }, [router, params]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
      Redirecting to Confirm Job & Resume…
    </div>
  );
}
