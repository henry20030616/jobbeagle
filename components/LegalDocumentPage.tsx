'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import BrandLogo from '@/components/BrandLogo';
import { getLegalDocument, LEGAL_UI, type LegalDocument } from '@/lib/legal-content';
import { isShortsEnabled } from '@/constants/features';

type LegalDocType = 'privacy' | 'terms';

export default function LegalDocumentPage({ type }: { type: LegalDocType }) {
  const { language } = useLanguage();
  const ui = LEGAL_UI[language] ?? LEGAL_UI.en;
  const doc: LegalDocument = getLegalDocument(type, language);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <BrandLogo size="nav" showIcon />
          <LanguageSwitcher variant="dark" />
        </div>
        <Link href="/" className="inline-block text-sm text-slate-400 hover:text-white transition-colors mb-8">
          {ui.backHome}
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{doc.title}</h1>
          <p className="text-sm text-slate-500">
            {ui.lastUpdated}: {doc.lastUpdated}
          </p>
          <p className="mt-4 text-slate-300 leading-relaxed">{doc.intro}</p>
        </header>

        <div className="space-y-8">
          {doc.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-white mb-3">{section.title}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm text-slate-400 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-white transition-colors">{ui.privacy}</Link>
          <Link href="/terms" className="hover:text-white transition-colors">{ui.terms}</Link>
          {isShortsEnabled() && (
            <Link href="/shorts" className="hover:text-white transition-colors">Jobbeagle Shorts</Link>
          )}
        </footer>
      </div>
    </div>
  );
}
