'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppLanguage = 'en' | 'zh-TW' | 'zh-CN' | 'es' | 'hi' | 'fr';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en',    name: 'English',             nativeName: 'English',      flag: '🇺🇸' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文',     flag: '🇹🇼' },
  { code: 'zh-CN', name: 'Simplified Chinese',  nativeName: '简体中文',     flag: '🇨🇳' },
  { code: 'es',    name: 'Spanish',             nativeName: 'Español',      flag: '🇪🇸' },
  { code: 'hi',    name: 'Hindi',               nativeName: 'हिन्दी',       flag: '🇮🇳' },
  { code: 'fr',    name: 'French',              nativeName: 'Français',     flag: '🇫🇷' },
];

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  currentOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'jobbeagle_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
      // handle legacy 'zh' stored value → upgrade to 'zh-TW'
      const raw = saved as string;
      const resolved: AppLanguage | null =
        raw === 'zh' ? 'zh-TW' :
        (raw && LANGUAGE_OPTIONS.some(o => o.code === raw)) ? (raw as AppLanguage) : null;
      if (resolved) setLanguageState(resolved);
    } catch { /* SSR / private mode */ }
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  };

  const currentOption = LANGUAGE_OPTIONS.find(o => o.code === language)!;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentOption }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
