'use client';

import React from 'react';

type ReportFitStageProps = {
  children: React.ReactNode;
  className?: string;
  /** @deprecated ignored — zoom removed so slide proportions stay fixed */
  baselinePx?: number;
  /** @deprecated ignored — zoom removed so slide proportions stay fixed */
  maxZoom?: number;
};

/**
 * Layout wrapper for report pages.
 *
 * Previously applied CSS `zoom` from viewport width. That made the presentation
 * slide and its internal layout appear to change whenever the page/window scaled.
 * Zoom is intentionally disabled — the blue report frame keeps stable proportions.
 */
export function ReportFitStage({
  children,
  className = '',
}: ReportFitStageProps) {
  return <div className={`w-full min-w-0 ${className}`}>{children}</div>;
}
