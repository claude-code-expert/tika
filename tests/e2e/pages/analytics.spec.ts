/**
 * 분석 페이지 E2E 테스트
 * 경로: /workspace/[workspaceId]/analytics
 */
import { test, expect } from '../fixtures/base';

test.describe('분석 페이지', () => {
  test.beforeEach(async ({ page, workspaceId }) => {
    await page.goto(`/workspace/${workspaceId}/analytics`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('분석 페이지가 로드된다 (차트 영역 존재)', async ({ page }) => {
    // 차트 섹션이나 통계 카드가 1개 이상 표시되는지 확인
    const charts = page.locator('canvas, [class*="chart"], [class*="analytics"]');
    const statsCards = page.locator('[class*="stat"], [class*="card"]');

    const chartCount = await charts.count();
    const cardCount = await statsCards.count();

    expect(chartCount + cardCount).toBeGreaterThan(0);
  });

  test('Goal 진척 섹션이 표시된다', async ({ page }) => {
    const goalSection = page.getByText(/goal|목표/i).first();
    await expect(goalSection).toBeVisible({ timeout: 5000 });
  });

  test('번다운 차트 섹션이 표시된다', async ({ page }) => {
    const burndown = page.getByText(/번다운|burndown/i).first();
    await expect(burndown).toBeVisible({ timeout: 5000 });
  });
});
