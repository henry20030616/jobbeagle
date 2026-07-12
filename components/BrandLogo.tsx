'use client';

import Link from 'next/link';
import { BeagleIcon } from '@/components/AnalysisDashboard';

/** Canonical wordmark: Job (white) + beagle (blue) — matches homepage hero. */
export const BRAND_JOB_CLASS = 'text-white';
export const BRAND_BEAGLE_CLASS = 'text-blue-500';

type BrandLogoProps = {
  href?: string | null;
  /** nav = header; hero = homepage main visual; inline = text-only mid-size */
  size?: 'nav' | 'hero' | 'inline';
  /** Show beagle icon (hero default on; nav/inline default off) */
  showIcon?: boolean;
  className?: string;
  as?: 'span' | 'h1';
};

const sizeClasses = {
  nav: 'text-2xl sm:text-3xl font-black tracking-tight',
  inline: 'text-xl font-bold tracking-tight',
  hero: 'text-5xl md:text-7xl font-black tracking-tight',
} as const;

export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      <span className={BRAND_JOB_CLASS}>Job</span>
      <span className={BRAND_BEAGLE_CLASS}>beagle</span>
    </span>
  );
}

export default function BrandLogo({
  href = '/',
  size = 'nav',
  showIcon,
  className = '',
  as: Tag = 'span',
}: BrandLogoProps) {
  const withIcon = showIcon ?? size === 'hero';

  const inner = (
    <Tag
      className={`inline-flex items-center text-white hover:opacity-90 transition-opacity ${sizeClasses[size]} ${className}`}
    >
      {withIcon && (
        <span className={size === 'hero' ? 'mr-6' : 'mr-2'}>
          <BeagleIcon
            className={
              size === 'hero'
                ? 'w-20 h-20 md:w-32 md:h-32 drop-shadow-xl'
                : 'w-8 h-8 sm:w-9 sm:h-9'
            }
            color="#cbd5e1"
            spotColor="#5d4037"
            bellyColor="#94a3b8"
          />
        </span>
      )}
      <BrandWordmark />
    </Tag>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 inline-flex">
        {inner}
      </Link>
    );
  }

  return inner;
}
