'use client';

import React from 'react';
import Link from 'next/link';
import {
  Gift,
  LayoutList,
  Receipt,
  ShieldAlert,
  ShoppingCart,
  Target,
} from 'lucide-react';
import type { AppLanguage } from '@/lib/language-context';
import {
  ACCOUNT_NAV_ITEMS,
  accountNavLabel,
  getAccountNavCopy,
  type AccountHashId,
  type AccountNavItem,
} from '@/constants/account-nav';
import {
  SAMPLE_RAIL_ICON,
  SAMPLE_RAIL_ITEM_GAP,
  SAMPLE_REPORT_TAB_LAYOUT,
  sampleReportTabClass,
} from '@/constants/report-frame';
import FunctionRail from '@/components/FunctionRail';

const ICONS: Record<AccountNavItem['id'], typeof LayoutList> = {
  overview: LayoutList,
  'career-context': Target,
  plans: ShoppingCart,
  billing: Receipt,
  referrals: Gift,
  danger: ShieldAlert,
};

/** Same card size as /samples idle/active tabs; lighter red fill, white type. */
const DANGER_IDLE =
  'rounded-2xl border border-red-500 bg-red-600 text-white hover:bg-red-500';
const DANGER_ACTIVE =
  'rounded-2xl border border-white bg-red-600 text-white ring-4 ring-white/90';

function itemClassName(item: AccountNavItem, active: boolean): string {
  if (item.id === 'danger') {
    return `${SAMPLE_REPORT_TAB_LAYOUT} ${active ? DANGER_ACTIVE : DANGER_IDLE}`;
  }
  return sampleReportTabClass(active);
}

export default function AccountSectionNav({
  language,
  activeId = 'overview',
}: {
  language: AppLanguage;
  activeId?: AccountHashId | 'danger';
}) {
  const copy = getAccountNavCopy(language);

  return (
    <FunctionRail label={copy.ariaLabel} data-account-nav="">
      <ul className={`flex flex-col ${SAMPLE_RAIL_ITEM_GAP}`}>
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const label = accountNavLabel(item, copy);
          const Icon = ICONS[item.id];
          const isHash = item.href.startsWith('#');
          const active = item.id === activeId;
          const className = itemClassName(item, active);
          return (
            <li key={item.id} className="w-full">
              {isHash ? (
                <a
                  href={item.href}
                  className={className}
                  aria-current={active ? 'location' : undefined}
                >
                  <Icon className={SAMPLE_RAIL_ICON} aria-hidden />
                  <span className="min-w-0 text-left">{label}</span>
                </a>
              ) : (
                <Link href={item.href} className={className}>
                  <Icon className={SAMPLE_RAIL_ICON} aria-hidden />
                  <span className="min-w-0 text-left">{label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </FunctionRail>
  );
}
