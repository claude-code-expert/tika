/**
 * 공통 테스트 픽스처
 *
 * - workspaceId: .env.local의 TEST_WORKSPACE_ID (기본: 1)
 * - 모든 spec 파일은 이 픽스처에서 test를 import해 사용
 */
import { test as base } from '@playwright/test';

export const test = base.extend<{
  workspaceId: number;
  memberId: number;
}>({
  workspaceId: async ({}, use) => {
    const id = process.env.TEST_WORKSPACE_ID ?? '1';
    await use(Number(id));
  },
  memberId: async ({}, use) => {
    const id = process.env.TEST_MEMBER_ID ?? '1';
    await use(Number(id));
  },
});

export { expect } from '@playwright/test';
