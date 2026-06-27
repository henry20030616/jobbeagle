'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppLanguage = 'en' | 'zh' | 'ja' | 'ko' | 'id' | 'vi';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  /** UI component language fallback: only 'zh' and 'en' have full translations */
  uiLang: 'zh' | 'en';
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English',            nativeName: 'English',       flag: '🇺🇸', uiLang: 'en' },
  { code: 'zh', name: 'Traditional Chinese', nativeName: '繁體中文',      flag: '🇹🇼', uiLang: 'zh' },
  { code: 'ja', name: 'Japanese',            nativeName: '日本語',        flag: '🇯🇵', uiLang: 'en' },
  { code: 'ko', name: 'Korean',              nativeName: '한국어',        flag: '🇰🇷', uiLang: 'en' },
  { code: 'id', name: 'Indonesian',          nativeName: 'Bahasa Indonesia', flag: '🇮🇩', uiLang: 'en' },
  { code: 'vi', name: 'Vietnamese',          nativeName: 'Tiếng Việt',   flag: '🇻🇳', uiLang: 'en' },
];

interface LanguageContextValue {
  language: AppLanguage;
  /** 'zh' or 'en' — used as prop for UI components that only have zh/en translations */
  uiLanguage: 'zh' | 'en';
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
      if (saved && LANGUAGE_OPTIONS.some(o => o.code === saved)) {
        setLanguageState(saved);
      }
    } catch {
      // localStorage unavailable (SSR or private mode)
    }
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* ignore */ }
  };

  const currentOption = LANGUAGE_OPTIONS.find(o => o.code === language)!;
  const uiLanguage = currentOption.uiLang;

  return (
    <LanguageContext.Provider value={{ language, uiLanguage, setLanguage, currentOption }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
