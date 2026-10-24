'use client';

import React, { useEffect, useState } from 'react';
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
  'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-indigo-500 hover:text-white';
const ACTIVE_CLASS = 'border-indigo-500 bg-indigo-500/15 text-white';
const DANGER_IDLE_CLASS =
  'border-rose-900/70 bg-rose-950/30 text-rose-100 hover:border-rose-400 hover:text-white';

function itemClassName(item: AccountNavItem, active: boolean): string {
  if (item.id === 'danger') {
    return `${ITEM_CLASS} ${active ? ACTIVE_CLASS : DANGER_IDLE_CLASS}`;
  }
  return `${ITEM_CLASS} ${active ? ACTIVE_CLASS : IDLE_CLASS}`;
}

export default function AccountSectionNav({ language }: { language: AppLanguage }) {
  const copy = getAccountNavCopy(language);
  const [hash, setHash] = useState('overview');

  useEffect(() => {
    const sync = () => {
      const next = window.location.hash.replace(/^#/, '');
      if (next) setHash(next);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return (
    <nav
      aria-label={copy.ariaLabel}
      data-account-nav=""
      className="lg:sticky lg:top-6 lg:w-52 lg:shrink-0 lg:self-start"
    >
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1.5">
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const label = accountNavLabel(item, copy);
          const Icon = ICONS[item.id];
          const isHash = item.href.startsWith('#');
          const active = isHash && hash === item.id;
          const className = itemClassName(item, active);
          return (
            <li key={item.id}>
              {isHash ? (
                <a
                  href={item.href}
                  className={className}
                  aria-current={active ? 'location' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </a>
              ) : (
                <Link href={item.href} className={className}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
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
