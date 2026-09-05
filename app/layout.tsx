import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL, buildJsonLdGraph } from "@/lib/seo";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: ["job search", "AI job analysis", "job matching", "interview preparation", "career", "resume analysis", "LinkedIn"],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = buildJsonLdGraph();

  return (
    <html lang="en" className="h-full w-full overflow-x-hidden" suppressHydrationWarning>
      {/* Never use max-w-[100vw] — scrollbar gutter inflates width past the viewport */}
      <body className="min-h-screen w-full overflow-x-hidden antialiased" suppressHydrationWarning>
        <Script id="jobbeagle-jsonld" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(jsonLd)}
        </Script>
        <LanguageProvider>
          {/* items-stretch: pages without w-full (e.g. /extension) collapse to a phone sliver if this is items-center */}
          <div className="flex min-h-screen w-full flex-col items-stretch">
            {children}
          </div>
        </LanguageProvider>
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false, anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
