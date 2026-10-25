'use client';

import React from 'react';
import {
  BODY,
  BODY_COPY,
  BODY_MUTED,
} from '@/components/guide/GuideSlideChrome';
import type { AppLanguage } from '@/lib/language-context';
import { applyCallLabel } from '@/lib/report-ui-copy';
import type { ApplyDecision } from '@/types';

/** Snapshot / Guide page-1 應徵建議: JobBeagle's apply / don't-apply call. */
export function ApplyCallBody({
  apply,
  language,
  empty,
}: {
  apply: ApplyDecision | null | undefined;
  language: AppLanguage;
  empty: string;
}) {
  const reason = apply?.reason?.trim() ?? '';
  if (!apply?.label) {
    return <p className={`${BODY_MUTED} py-3`}>{empty}</p>;
  }
  return (
    <>
      <p className={`${BODY} font-black text-white leading-snug`}>
        {applyCallLabel(apply.label, language)}
      </p>
      {reason ? <p className={`${BODY_COPY} mt-2`}>{reason}</p> : null}
    </>
  );
}
