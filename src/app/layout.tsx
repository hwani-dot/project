import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "./providers";
import { HomeHeader } from "@/components/home/HomeHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "운세 웹앱 | 오늘의 운세, 타로, 오하아사",
  description: "오늘의 운세, 타로, 오하아사(별자리 순위)를 한 번에",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansKR.variable} font-sans min-h-screen antialiased bg-background text-foreground`}
      >
        <ProfileProvider>
          <HomeHeader />
          {children}
        </ProfileProvider>
      </body>
    </html>
  );
}
