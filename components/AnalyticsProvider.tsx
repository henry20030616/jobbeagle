'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import {
  enableGaDebug,
  shouldTrackAuthOnce,
  trackAuthSuccess,
  trackException,
  trackPageView,
} from '@/lib/analytics';

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('ga_debug') === '1') enableGaDebug();
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    trackPageView(path);
  }, [pathname, searchParams]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return;
      if (!shouldTrackAuthOnce(session.user.id)) return;
      trackAuthSuccess(session.user.created_at);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.message || 'window.error';
      trackException(message, false);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'unhandledrejection';
      trackException(message, false);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
