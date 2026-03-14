/**
 * Global Setup — 테스트용 NextAuth JWT 쿠키 생성
 *
 * 동작 방식:
 * 1. .env.local의 TEST_USER_ID를 sub로 사용해 NextAuth JWT를 직접 서명
 * 2. 서명된 토큰을 authjs.session-token 쿠키에 저장
 * 3. tests/e2e/.auth/user.json에 쿠키 상태 저장 → 모든 테스트에서 재사용
 *
 * 사전 조건:
 * - .env.local에 TEST_USER_ID, NEXTAUTH_SECRET 설정
 * - TEST_USER_ID는 DB에 실존하는 유저 ID (userType이 설정된 상태)
 */
import { chromium, FullConfig } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

export default async function globalSetup(_config: FullConfig) {
  const userId = process.env.TEST_USER_ID;
  const secret = process.env.NEXTAUTH_SECRET;

  if (!userId || !secret) {
    throw new Error(
      '[E2E Setup] .env.local에 TEST_USER_ID와 NEXTAUTH_SECRET이 필요합니다.\n' +
        '  TEST_USER_ID: DB users 테이블의 실제 id 값\n' +
        '  예: TEST_USER_ID=google-oauth-sub-값',
    );
  }

  // NextAuth v5 JWT 서명 (서버 auth() 미들웨어가 그대로 검증)
  const now = Math.floor(Date.now() / 1000);
  const token = await encode({
    token: {
      sub: userId,
      iat: now,
      exp: now + 60 * 60 * 24, // 24시간
    },
    secret,
    salt: 'authjs.session-token',
  });

  const browser = await chromium.launch();
  const context = await browser.newContext();

  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // 쿠키 상태 저장
  const authDir = path.join(__dirname, '.auth');
  fs.mkdirSync(authDir, { recursive: true });
  await context.storageState({ path: path.join(authDir, 'user.json') });

  await browser.close();
  console.log(`✓ E2E auth setup complete (userId: ${userId})`);
}
