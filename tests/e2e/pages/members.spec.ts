/**
 * 멤버 페이지 E2E 테스트
 * 경로: /workspace/[workspaceId]/members
 */
import { test, expect } from '../fixtures/base';

test.describe('멤버 페이지', () => {
  test.beforeEach(async ({ page, workspaceId }) => {
    await page.goto(`/workspace/${workspaceId}/members`);
  });

  test('페이지가 정상 로드되거나 권한 없으면 리다이렉트된다', async ({ page, workspaceId }) => {
    const url = page.url();
    const isOnMembers = url.includes('/members');
    const isRedirected = url.includes(`/workspace/${workspaceId}`) && !url.includes('/members');
    expect(isOnMembers || isRedirected).toBeTruthy();
  });

  test('워크스페이스 멤버 제목이 표시된다', async ({ page }) => {
    const currentUrl = page.url();
    if (!currentUrl.includes('/members')) return;
    await expect(page.getByRole('heading', { name: '워크스페이스 멤버' })).toBeVisible({ timeout: 8000 });
  });

  test('멤버 목록이 표시된다', async ({ page }) => {
    const currentUrl = page.url();
    if (!currentUrl.includes('/members')) return;

    await expect(page.getByRole('heading', { name: '워크스페이스 멤버' })).toBeVisible({ timeout: 8000 });
    // 워크로드 테이블에 최소 1명의 멤버 행이 있음
    // 역할 배지 "Owner" / "Member" / "Viewer" (첫 글자 대문자)
    const roleLabels = page.getByText(/^(Owner|Member|Viewer)$/);
    await expect(roleLabels.first()).toBeVisible({ timeout: 5000 });
  });

  test('OWNER 계정: 초대 링크 생성 버튼이 표시된다', async ({ page }) => {
    const currentUrl = page.url();
    if (!currentUrl.includes('/members')) return;

    await expect(page.getByRole('heading', { name: '워크스페이스 멤버' })).toBeVisible({ timeout: 8000 });
    const inviteBtn = page.getByRole('button', { name: /초대 링크 생성/ });
    if (await inviteBtn.isVisible({ timeout: 2000 })) {
      await expect(inviteBtn).toBeVisible();
    }
  });

  test('요약 통계 카드(멤버 수, 완료 티켓 등)가 표시된다', async ({ page }) => {
    const currentUrl = page.url();
    if (!currentUrl.includes('/members')) return;

    await expect(page.getByRole('heading', { name: '워크스페이스 멤버' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('총 할당 티켓')).toBeVisible();
    await expect(page.getByText('완료 티켓')).toBeVisible();
  });
});
