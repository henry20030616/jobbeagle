'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LANGUAGE_OPTIONS, AppLanguage, useLanguage } from '@/lib/language-context';
import { REPORT_ACTION_BTN, REPORT_ACTION_ICON } from '@/constants/report-frame';

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
        <span className={`${chrome ? 'text-6xl leading-none' : 'text-sm leading-none'} shrink-0`}>{currentOption.flag}</span>
        <span className={`ms-2 whitespace-nowrap ${chrome ? 'text-6xl font-bold tracking-tight leading-none' : 'text-sm'}`}>{currentOption.nativeName}</span>
        <ChevronDown
          className={`${chrome ? REPORT_ACTION_ICON : 'w-3.5 h-3.5 lg:w-6 lg:h-6'} shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1.5 rounded-xl border shadow-xl z-50 overflow-hidden ${
            chrome ? 'min-w-[28rem] w-max' : 'min-w-[16rem] w-max'
          } ${
            isDark
              ? 'bg-slate-900 border-slate-700'
              : 'bg-slate-900/95 backdrop-blur-xl border-white/15'
          }`}
        >
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.code}
              type="button"
              onClick={() => handleSelect(opt.code)}
              className={`w-full flex items-center gap-3 px-4 whitespace-nowrap transition-colors ${
                chrome ? 'px-6 py-5 text-4xl' : 'py-2.5 text-sm'
              } ${
                language === opt.code
                  ? 'bg-indigo-600/30 text-indigo-300'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className={`${chrome ? 'text-5xl w-16' : 'text-base w-6'} shrink-0 text-center`}>{opt.flag}</span>
              <span className="ms-2 font-medium whitespace-nowrap">{opt.nativeName}</span>
              {language === opt.code && (
                <span className={`ml-auto shrink-0 text-indigo-400 ${chrome ? 'text-3xl' : 'text-xs'}`}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
