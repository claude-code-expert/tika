/**
 * 칸반 보드 페이지 E2E 테스트
 * 경로: /workspace/[workspaceId]/board
 */
import { test, expect } from '../fixtures/base';

test.describe('칸반 보드', () => {
  test.beforeEach(async ({ page, workspaceId }) => {
    await page.goto(`/workspace/${workspaceId}/board`);
    await expect(page.getByText('Backlog').first()).toBeVisible({ timeout: 10_000 });
  });

  test('4개 칼럼이 모두 렌더링된다', async ({ page }) => {
    await expect(page.getByText('Backlog').first()).toBeVisible();
    await expect(page.getByText('TODO').first()).toBeVisible();
    await expect(page.getByText('In Progress').first()).toBeVisible();
    await expect(page.getByText('Done').first()).toBeVisible();
  });

  test('헤더 "+ 새 업무" 버튼이 존재한다', async ({ page }) => {
    await expect(page.getByRole('button', { name: /새 업무/ })).toBeVisible();
  });

  test('티켓 생성 모달 — 제목 없이 제출 시 에러가 표시된다', async ({ page }) => {
    await page.getByRole('button', { name: /새 업무/ }).first().click();
    await expect(page.getByText('새 업무 만들기')).toBeVisible({ timeout: 3000 });

    // 모달 내 제출 버튼: 정확한 텍스트 "+ 새 업무 생성" (aria-label 없는 순수 텍스트 버튼)
    await page.locator('button').filter({ hasText: '새 업무 생성' }).click();

    // 제목 미입력 → 모달이 닫히지 않아야 함
    await expect(page.getByText('새 업무 만들기')).toBeVisible();
  });

  test('티켓 생성 모달 — 제목 입력 후 생성된다', async ({ page }) => {
    const TITLE = `[E2E] board-test-${Date.now()}`;

    await page.getByRole('button', { name: /새 업무/ }).first().click();
    await expect(page.getByText('새 업무 만들기')).toBeVisible({ timeout: 3000 });

    await page.getByPlaceholder('업무 제목을 입력하세요').fill(TITLE);
    await page.locator('button').filter({ hasText: '새 업무 생성' }).click();

    // 모달이 닫히고 보드에 티켓 표시 (API 응답 후 상태 반영 대기)
    // TicketCard의 aria-label="티켓: {title}" 속성으로 확인
    await expect(page.getByText('새 업무 만들기')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(`[aria-label="티켓: ${TITLE}"]`)).toBeVisible({ timeout: 15000 });
  });

  test('티켓 카드 클릭 시 상세 모달이 열린다', async ({ page }) => {
    // 보드에 티켓이 있는 경우에만 테스트
    const firstCard = page.locator('[draggable="true"]').first();
    if (await firstCard.isVisible({ timeout: 3000 })) {
      await firstCard.click();
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 3000 });
    }
  });
});
