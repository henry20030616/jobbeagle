import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jobbeagle 職位分析米格魯",
  description: "專家級 AI 職缺戰略分析中心",
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}