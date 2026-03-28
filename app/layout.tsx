import type { Metadata } from 'next';
import Script from "next/script";
import { SessionProvider } from 'next-auth/react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Tika', template: '%s | Tika' },
  description: '티켓 기반 칸반 보드 TODO 앱 — Tika로 업무를 체계적으로 관리하세요.',
  icons: {
    icon: [
      { url: '/images/icon/favicon.ico', sizes: 'any' },
      { url: '/images/icon/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/icon/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/images/icon/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Tika',
    description: '티켓 기반 칸반 보드 TODO 앱',
    siteName: 'Tika',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Tika',
    description: '티켓 기반 칸반 보드 TODO 앱',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
