import type { Metadata } from 'next';
import Script from "next/script";
import { SessionProvider } from 'next-auth/react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tika.vercel.app'),
  title: { default: 'Tika', template: '%s | Tika' },
  description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요. 개인 플랜 영구 무료.',
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
    description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요.',
    siteName: 'Tika',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/images/tika-hero.png',
        width: 1376,
        height: 768,
        alt: 'Tika 칸반 보드 — Plan Simply. Ship Boldly.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tika',
    description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요.',
    images: ['/images/tika-hero.png'],
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Tika',
    url: 'https://tika.vercel.app',
    description: '티켓 기반 칸반 보드 프로젝트 관리 앱',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web',
    inLanguage: 'ko-KR',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tika',
    url: 'https://tika.vercel.app',
    logo: {
      '@type': 'ImageObject',
      url: 'https://tika.vercel.app/images/icon/favicon-32.png',
    },
  },
];

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
