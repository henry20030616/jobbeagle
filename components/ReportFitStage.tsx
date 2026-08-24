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
 * Layout at designWidth, then enlarge with CSS zoom.
 */
export function ReportFitStage({
  children,
  className = '',
  designWidth = REPORT_SLIDE_DESIGN_WIDTH,
  maxScale = 2.4,
}: ReportFitStageProps) {
  return (
    <FitStage
      designWidth={designWidth}
      minScale={0.5}
      maxScale={maxScale}
      className={className}
    >
      {children}
    </FitStage>
  );
}
