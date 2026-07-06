import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GCK.gg",
  description: "학교 친구들을 위한 League of Legends 전적/내전 기록 사이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#070a12] text-slate-100">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070a12]/95 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-xl font-black tracking-tight text-white">GCK.gg</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300 sm:inline">KR School Rift</span>
            </Link>
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-300">
              <Link href="/scrims" className="hover:text-cyan-300">
                내전
              </Link>
              <Link href="/scrims/new" className="hover:text-cyan-300">
                경기 생성
              </Link>
              <Link href="/admin" className="hover:text-cyan-300">
                Admin
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
