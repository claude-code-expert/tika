import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vercel Postgres 연동 시 서버리스 함수에서 DB 접근 허용
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
};

export default nextConfig;
