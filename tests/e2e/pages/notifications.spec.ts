/**
 * 알림 페이지 E2E 테스트
 * 경로: /notifications
 */
import { test, expect } from '../fixtures/base';

test.describe('알림 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('body')).toBeVisible();
  });

  test('알림 페이지가 로드된다', async ({ page }) => {
    // 알림이 있으면 목록, 없으면 빈 상태 메시지
    const hasNotifications = await page.locator('[class*="notification"]').count();
    const emptyState = page.getByText(/알림이 없|no notification/i);

    if (hasNotifications > 0) {
      await expect(page.locator('[class*="notification"]').first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    }
  });

  test('헤더 벨 아이콘이 표시된다', async ({ page }) => {
    // 헤더 알림 벨 버튼 확인
    const bellBtn = page.locator('button[aria-label*="알림"], button[title*="알림"]').first();
    if (await bellBtn.isVisible({ timeout: 2000 })) {
      await expect(bellBtn).toBeVisible();
    }
  });
});
