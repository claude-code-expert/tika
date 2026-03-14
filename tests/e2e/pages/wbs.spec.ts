/**
 * WBS 페이지 E2E 테스트
 * 경로: /workspace/[workspaceId]/wbs
 */
import { test, expect } from '../fixtures/base';

test.describe('WBS 페이지', () => {
  test.beforeEach(async ({ page, workspaceId }) => {
    await page.goto(`/workspace/${workspaceId}/wbs`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('WBS 페이지가 로드된다 (통계 카드 표시)', async ({ page }) => {
    // 상단 통계 카드 — Goal / Story / Feature / Task 카운트
    await expect(page.getByText('Goal').first()).toBeVisible({ timeout: 8000 });
  });

  test('"작업 항목" 컬럼 헤더가 표시된다', async ({ page }) => {
    await expect(page.getByText('작업 항목')).toBeVisible({ timeout: 8000 });
  });

  test('티켓 행이 표시되거나 빈 상태 메시지가 표시된다', async ({ page }) => {
    // 실제 행 데이터 여부 확인 — 텍스트가 있는 링크/셀
    const ticketLinks = page.locator('a[href*="/workspace"]').filter({ hasText: /[가-힣a-zA-Z]/ });
    const emptyMsg = page.getByText('이슈 또는 티켓 데이터 없음');

    const hasLinks = (await ticketLinks.count()) > 0;
    if (hasLinks) {
      await expect(ticketLinks.first()).toBeVisible();
    } else {
      await expect(emptyMsg).toBeVisible({ timeout: 3000 });
    }
  });
});
