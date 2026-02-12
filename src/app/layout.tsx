import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-gradient-to-b from-violet-50/80 to-background`}
      >
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
