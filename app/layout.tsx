import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jobbeagle - 職位分析米格魯",
  description: "專家級 AI 職缺戰略分析中心：結合求職專家分析與獵頭視角，助您掌握應對策略。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
