'use client';

import React from 'react';
import { Check } from 'lucide-react';
import {
  SAMPLE_RAIL_ICON,
  SAMPLE_RAIL_ITEM_GAP,
  SAMPLE_RAIL_SHELL,
} from '@/constants/report-frame';

type FunctionRailProps = {
  children: React.ReactNode;
  label: string;
  as?: 'nav' | 'aside';
  className?: string;
} & React.HTMLAttributes<HTMLElement>;

/**
 * Shared top-left function rail for /account, live /report, and /samples.
 * Card chrome lives on children via `sampleReportTabClass` — this is the
 * width, sticky position, and vertical gap only.
 */
export default function FunctionRail({
  children,
  label,
  as: Comp = 'nav',
  className = '',
  ...rest
}: FunctionRailProps) {
  return (
    <Comp
      aria-label={label}
      className={`${SAMPLE_RAIL_SHELL} flex flex-col ${SAMPLE_RAIL_ITEM_GAP} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Selected/idle leading mark — same 16×16 circle as /samples type-switcher. */
export function FunctionRailCheck({ active }: { active: boolean }) {
  return (
    <span
      className={`flex ${SAMPLE_RAIL_ICON} items-center justify-center rounded-full border-4 ${
        active ? 'border-white bg-white text-blue-900' : 'border-white/80'
      }`}
      aria-hidden
    >
      {active ? <Check className="h-10 w-10" strokeWidth={3} /> : null}
    </span>
  );
}
