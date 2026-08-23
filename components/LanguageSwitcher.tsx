'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LANGUAGE_OPTIONS, AppLanguage, useLanguage } from '@/lib/language-context';

interface Props {
  /** Visual variant: 'light' for dark backgrounds (Shorts), 'dark' for light/dark page header */
  variant?: 'light' | 'dark';
  /** lg matches sample/report chrome next to Back to Home */
  size?: 'md' | 'lg';
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

  const large = size === 'lg';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center rounded-xl font-semibold transition-all select-none ${
          large ? 'gap-3 px-6 py-4 text-xl' : 'gap-1.5 px-3 py-2 text-sm'
        } ${
          isDark
            ? 'bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-700/70'
            : 'bg-black/40 backdrop-blur-md border-2 border-white/20 text-white hover:bg-black/55'
        }`}
      >
        <span className={`${large ? 'text-xl leading-none' : 'text-base leading-none'}`}>{currentOption.flag}</span>
        <span className={`hidden sm:inline ${large ? 'text-xl' : ''}`}>{currentOption.nativeName}</span>
        <ChevronDown
          className={`${large ? 'w-7 h-7' : 'w-3.5 h-3.5'} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-1.5 rounded-xl border shadow-xl z-50 overflow-hidden ${
            large ? 'w-72' : 'w-48'
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
              className={`w-full flex items-center gap-3 px-4 transition-colors ${
                large ? 'px-5 py-4 text-xl' : 'py-2.5 text-sm'
              } ${
                language === opt.code
                  ? 'bg-indigo-600/30 text-indigo-300'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className={`${large ? 'text-2xl w-8' : 'text-base w-6'} text-center`}>{opt.flag}</span>
              <span className="font-medium">{opt.nativeName}</span>
              {language === opt.code && (
                <span className={`ml-auto text-indigo-400 ${large ? 'text-lg' : 'text-xs'}`}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
