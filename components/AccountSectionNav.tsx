'use client';

import React from 'react';
import Link from 'next/link';
import {
  Ban,
  Gift,
  Heart,
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

const ICONS: Record<AccountNavItem['id'], typeof LayoutList> = {
  overview: LayoutList,
  'career-context': Target,
  plans: ShoppingCart,
  'subscription-actions': Ban,
  sponsor: Heart,
  billing: Receipt,
  referrals: Gift,
  danger: ShieldAlert,
};

const ITEM_CLASS =
  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-base font-semibold transition-colors lg:w-full';
const IDLE_CLASS =
  'border-blue-500/40 bg-blue-950/30 text-zinc-100 hover:border-blue-400 hover:text-white';
const ACTIVE_CLASS = 'border-blue-500 bg-blue-900 text-white';
const DANGER_IDLE_CLASS =
  'border-red-800/70 bg-red-950/25 text-red-100 hover:border-red-500 hover:text-white';

function itemClassName(item: AccountNavItem, active: boolean): string {
  if (item.id === 'danger') {
    return `${ITEM_CLASS} ${active ? ACTIVE_CLASS : DANGER_IDLE_CLASS}`;
  }
  return `${ITEM_CLASS} ${active ? ACTIVE_CLASS : IDLE_CLASS}`;
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
    <nav
      aria-label={copy.ariaLabel}
      data-account-nav=""
      className="lg:sticky lg:top-6 lg:w-[22rem] lg:shrink-0 lg:self-start"
    >
      <ul
        role="tablist"
        className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1.5"
      >
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const label = accountNavLabel(item, copy);
          const Icon = ICONS[item.id];
          const isHash = item.href.startsWith('#');
          const active = item.id === activeId;
          const className = itemClassName(item, active);
          return (
            <li key={item.id} role="none">
              {isHash ? (
                <a
                  href={item.href}
                  role="tab"
                  className={className}
                  aria-selected={active}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-[1em] w-[1em] shrink-0" aria-hidden />
                  {label}
                </a>
              ) : (
                <Link href={item.href} className={className}>
                  <Icon className="h-[1em] w-[1em] shrink-0" aria-hidden />
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
