import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  testDir: './tests/e2e/pages',
  fullyParallel: false,   // DB 상태 공유 — 순차 실행
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  // 모든 테스트 전에 1회 실행 — JWT 쿠키 생성
  globalSetup: './tests/e2e/global.setup.ts',

  use: {
    baseURL: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    storageState: 'tests/e2e/.auth/user.json',
  },

  projects: [
    {
      name: 'e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 개발 서버가 이미 실행 중이면 재사용, 없으면 자동 시작
  webServer: {
    command: 'npm run dev',
    url: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
