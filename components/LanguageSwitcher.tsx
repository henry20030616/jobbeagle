'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LANGUAGE_OPTIONS, AppLanguage, useLanguage } from '@/lib/language-context';
import {
  HOMEPAGE_POPOVER_OPTION,
  HOMEPAGE_POPOVER_PANEL,
  REPORT_ACTION_BTN,
  REPORT_ACTION_ICON,
} from '@/constants/report-frame';

interface Props {
  /** Visual variant: 'light' for dark backgrounds (Shorts), 'dark' for light/dark page header */
  variant?: 'light' | 'dark';
  /** md = compact; lg = homepage History; chrome = samples Back to Home */
  size?: 'md' | 'lg' | 'chrome';
}

export default function LanguageSwitcher({ variant = 'dark', size = 'md' }: Props) {
  const { language, setLanguage, currentOption } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code: AppLanguage) => {
    setLanguage(code);
    setOpen(false);
  };

  const isDark = variant === 'dark';

  const chrome = size === 'chrome';
  const large = size === 'lg' || chrome;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={
          chrome
            ? `${REPORT_ACTION_BTN} whitespace-nowrap`
            : `inline-flex items-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all select-none ${
                large
                  ? 'h-9 sm:h-10 lg:h-16 lg:gap-3 px-2.5 sm:px-3 lg:px-5 text-sm'
                  : 'h-9 px-3 py-2 text-sm'
              } ${
                isDark
                  ? 'bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-700/70'
                  : 'bg-black/40 backdrop-blur-md border-2 border-white/20 text-white hover:bg-black/55'
              }`
        }
      >
        <span className={`${chrome ? 'text-xl lg:text-6xl leading-none' : 'text-sm leading-none'} shrink-0`}>{currentOption.flag}</span>
        <span className={`ms-2 whitespace-nowrap ${chrome ? 'text-xl lg:text-6xl font-bold tracking-tight leading-none' : 'text-sm'}`}>{currentOption.nativeName}</span>
        <ChevronDown
          className={`${chrome ? REPORT_ACTION_ICON : 'w-3.5 h-3.5 lg:w-6 lg:h-6'} shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute right-0 top-full ${
            chrome
              ? 'z-50 mt-1.5 min-w-0 w-max max-w-[calc(100vw-2rem)] lg:min-w-[28rem] rounded-xl border shadow-xl'
              : large
                ? `${HOMEPAGE_POPOVER_PANEL} min-w-0 w-max max-w-[calc(100vw-2rem)] sm:min-w-[18em]`
                : 'z-50 mt-1.5 min-w-0 w-max max-w-[calc(100vw-2rem)] sm:min-w-[18rem] rounded-xl border shadow-xl'
          } ${
            chrome || !large
              ? isDark
                ? 'bg-slate-900 border-slate-700'
                : 'bg-slate-900/95 backdrop-blur-xl border-white/15'
              : ''
          }`}
        >
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.code}
              type="button"
              role="option"
              aria-selected={language === opt.code}
              onClick={() => handleSelect(opt.code)}
              className={`w-full whitespace-nowrap transition-colors ${
                chrome
                  ? 'flex items-center gap-3 px-4 py-2.5 text-base lg:px-6 lg:py-5 lg:text-4xl'
                  : large
                    ? HOMEPAGE_POPOVER_OPTION
                    : 'flex items-center gap-3 px-4 py-2.5 text-base'
              } ${
                language === opt.code
                  ? 'bg-indigo-600/30 text-indigo-300'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className={`${chrome ? 'text-xl w-8 lg:text-5xl lg:w-16' : 'text-[1.15em] w-[1.4em]'} shrink-0 text-center`}>{opt.flag}</span>
              <span className="ms-2 font-medium whitespace-nowrap">{opt.nativeName}</span>
              {language === opt.code && (
                <span className={`ml-auto shrink-0 text-indigo-400 ${chrome ? 'text-lg lg:text-3xl' : 'text-[0.9em]'}`}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
