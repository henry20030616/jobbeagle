import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";

// 優先使用環境變數；若 Vercel build 時未帶入則使用預設 ID，確保 GA 一定會載入
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-5EV9NSSJRW";

export const metadata: Metadata = {
  title: "Jobbeagle | AI Job Match Analysis",
  description: "AI-powered job match analysis and interview preparation for job seekers.",
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