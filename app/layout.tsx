import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";

// 優先使用環境變數；若 Vercel build 時未帶入則使用預設 ID，確保 GA 一定會載入
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-5EV9NSSJRW";

export const metadata: Metadata = {
  title: "Jobbeagle | AI Job Match Analysis",
  description: "AI-powered job match analysis and interview preparation for job seekers. Chrome extension for LinkedIn, Indeed, ZipRecruiter, and more.",
  keywords: ["job search", "AI job analysis", "job matching", "interview preparation", "career", "resume analysis"],
  authors: [{ name: "JobBeagle" }],
  creator: "JobBeagle",
  publisher: "JobBeagle",
  metadataBase: new URL('https://www.jobbeagle.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Jobbeagle | AI Job Match Analysis",
    description: "AI-powered job match analysis and interview preparation for job seekers.",
    url: 'https://www.jobbeagle.com',
    siteName: 'Jobbeagle',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'JobBeagle Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Jobbeagle | AI Job Match Analysis",
    description: "AI-powered job match analysis and interview preparation for job seekers.",
    images: ['/icon.svg'],
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full w-full overflow-x-hidden" suppressHydrationWarning>
      {/* Never use max-w-[100vw] — scrollbar gutter inflates width past the viewport */}
      <body className="min-h-screen w-full overflow-x-hidden antialiased" suppressHydrationWarning>
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
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}