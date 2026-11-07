'use client';

import React from 'react';
import { REPORT_SLIDE_DESIGN_WIDTH } from '@/constants/report-frame';
import { FitStage } from '@/components/FitStage';

type ReportFitStageProps = {
  children: React.ReactNode;
  className?: string;
  /** Fixed slide canvas width (px). Internal layout always lays out at this width. */
  designWidth?: number;
  /** Upper bound so extreme ultrawides don’t become unreadably huge. */
  maxScale?: number;
};

/**
 * Report / samples slide stage — thin wrapper over FitStage.
 * minScale=1: below designWidth use fluid 100% width (no centered island);
 * at/above designWidth enlarge with CSS zoom up to maxScale.
 */
export function ReportFitStage({
  children,
  className = '',
  designWidth = REPORT_SLIDE_DESIGN_WIDTH,
  maxScale = 2.8,
}: ReportFitStageProps) {
  return (
    <FitStage
      designWidth={designWidth}
      minScale={1}
      maxScale={maxScale}
      className={className}
    >
      {children}
    </FitStage>
  );
}
