import '@testing-library/jest-dom';
import React from 'react';
import { config } from 'dotenv';

// 테스트 환경 변수 로드
config({ path: '.env.test' });

// TextEncoder/TextDecoder polyfill (Node.js 환경에서 필요)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// ============================================
// Next.js Mock: next/navigation
// ============================================
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// ============================================
// Next.js Mock: next/image
// ============================================
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return React.createElement('img', rest);
  },
}));

// ============================================
// Next.js Mock: next/link
// ============================================
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...rest }, children),
}));

// ============================================
// window.matchMedia mock (jsdom에서 미구현)
// ============================================
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}

// ============================================
// fetch: 기본 mock (개별 테스트에서 재정의 가능)
// ============================================
global.fetch = jest.fn();

// ============================================
// console 출력 제어
// ============================================
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
