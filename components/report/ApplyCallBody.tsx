'use client';

import React from 'react';
import { BODY_MUTED } from '@/components/guide/GuideSlideChrome';
import { ReportProse } from '@/components/report/ReportProse';
import type { ApplyDecision } from '@/types';

/** Snapshot / Guide page-1 應徵建議: reason under the heading + verdict row in FitBody. */
export function ApplyCallBody({
  apply,
  empty,
}: {
  apply: ApplyDecision | null | undefined;
  empty: string;
}) {
  const reason = apply?.reason?.trim() ?? '';
  if (!apply?.label) {
    return <p className={`${BODY_MUTED} py-3`}>{empty}</p>;
  }
  return reason ? <ReportProse text={reason} className="mt-3" /> : null;
}
