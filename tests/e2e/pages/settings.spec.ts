/**
 * 설정 페이지 E2E 테스트
 * 경로: /settings (헤더 설정 클릭 → 이동)
 *
 * 테스트 시나리오:
 * 1. 탭 구조 확인
 * 2. 일반 설정 — 프로젝트 이름 수정 저장
 * 3. 일반 설정 — 프로젝트 설명 수정 저장
 * 4. 일반 설정 — 아이콘 색상 변경 저장
 * 5. 알림 설정 — 카테고리 헤더 표시
 * 6. 알림 설정 — 토글 클릭 시 상태 변경
 * 7. 라벨 관리 — 새 라벨 추가 폼 열림
 * 8. 라벨 관리 — 라벨 생성 후 목록 반영
 * 9. 라벨 관리 — 라벨 삭제 (확인 다이얼로그 포함)
 * 10. 라벨 관리 — 기본 라벨 자동 생성 다이얼로그 확인
 * 11. 라벨 관리 — 기본 라벨 자동 생성 후 토스트 표시
 */
import { test, expect } from '../fixtures/base';

// ─────────────────────────────────────────────
// 헬퍼: 설정 페이지 이동 & 헤더 확인
// ─────────────────────────────────────────────
async function gotoSettings(page: import('@playwright/test').Page) {
  await page.goto('/settings');
  await expect(page.getByRole('button', { name: '일반 설정', exact: true })).toBeVisible({ timeout: 10_000 });
}

// ─────────────────────────────────────────────
// 헬퍼: 탭 이동
// ─────────────────────────────────────────────
async function clickTab(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
}

// ─────────────────────────────────────────────
// 헬퍼: 토스트 대기
// ─────────────────────────────────────────────
async function waitForToast(page: import('@playwright/test').Page, text: string | RegExp) {
  await expect(page.locator('[role="status"]')).toContainText(text, { timeout: 8000 });
}

// ─────────────────────────────────────────────
// 테스트
// ─────────────────────────────────────────────
test.describe('설정 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await gotoSettings(page);
  });

  // ── 1. 탭 구조 ────────────────────────────
  test('3개 탭(일반 설정 / 알림 설정 / 라벨 관리)이 모두 표시된다', async ({ page }) => {
    await expect(page.getByRole('button', { name: '일반 설정', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '알림 설정', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '라벨 관리', exact: true })).toBeVisible();
  });

  // ── 2-4. 일반 설정 ────────────────────────
  test.describe('일반 설정', () => {
    test('프로젝트 이름 수정 후 저장하면 성공 토스트가 표시된다', async ({ page }) => {
      // :not([readonly]) → 워크스페이스 로딩 완료 + OWNER 확인 후 편집 가능한 input 선택
      const nameInput = page.locator('input[placeholder="프로젝트 이름"]:not([readonly])');
      await expect(nameInput).not.toBeEmpty({ timeout: 8000 });

      const original = await nameInput.inputValue();
      const newName = `[E2E] 수정 ${Date.now()}`;

      await nameInput.clear();
      await nameInput.fill(newName);
      await page.locator('button').filter({ hasText: '저장' }).click();

      await waitForToast(page, '프로젝트 정보가 저장되었습니다');

      // 원래 이름으로 복원
      await nameInput.clear();
      await nameInput.fill(original);
      await page.locator('button').filter({ hasText: '저장' }).click();
      await waitForToast(page, '프로젝트 정보가 저장되었습니다');
    });

    test('프로젝트 설명 수정 후 저장하면 성공 토스트가 표시된다', async ({ page }) => {
      const descInput = page.locator('textarea[placeholder="프로젝트 설명"]:not([readonly])');
      await expect(descInput).toBeVisible({ timeout: 8000 });

      await descInput.clear();
      await descInput.fill('E2E 자동화 테스트로 수정된 설명입니다.');
      await page.locator('button').filter({ hasText: '저장' }).click();

      await waitForToast(page, '프로젝트 정보가 저장되었습니다');

      // 복원
      await descInput.clear();
      await page.locator('button').filter({ hasText: '저장' }).click();
    });

    test('아이콘 색상 변경 후 저장하면 성공 토스트가 표시된다', async ({ page }) => {
      // readonly 아닌 편집 가능한 이름 input이 채워질 때까지 대기
      await expect(page.locator('input[placeholder="프로젝트 이름"]:not([readonly])')).not.toBeEmpty({ timeout: 8000 });

      // 빨간색 선택
      await page.locator('button[aria-label="아이콘 색상 #E8392A"]').click();
      await page.locator('button').filter({ hasText: '저장' }).click();

      await waitForToast(page, '프로젝트 정보가 저장되었습니다');

      // 기본 그린으로 복원
      await page.locator('button[aria-label="아이콘 색상 #629584"]').click();
      await page.locator('button').filter({ hasText: '저장' }).click();
    });
  });

  // ── 5-6. 알림 설정 ────────────────────────
  test.describe('알림 설정', () => {
    test.beforeEach(async ({ page }) => {
      await clickTab(page, '알림 설정');
      // 토글 버튼이 로드될 때까지 대기
      await expect(
        page.locator('button[aria-label*="알림 끄기"], button[aria-label*="알림 켜기"]').first()
      ).toBeVisible({ timeout: 10_000 });
    });

    test('카테고리 헤더(티켓 / 마감일 / 워크스페이스)가 표시된다', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '티켓', level: 3 })).toBeVisible();
      await expect(page.getByRole('heading', { name: '마감일', level: 3 })).toBeVisible();
      await expect(page.getByRole('heading', { name: '워크스페이스', level: 3 })).toBeVisible();
    });

    test('알림 토글 클릭 시 상태(켜기/끄기)가 변경된다', async ({ page }) => {
      const toggle = page.locator('button[aria-label*="알림 끄기"], button[aria-label*="알림 켜기"]').first();
      await expect(toggle).toBeVisible();

      const before = await toggle.getAttribute('aria-label');

      await toggle.click();

      // aria-label이 반전됐는지 확인 (끄기 → 켜기 또는 켜기 → 끄기)
      await expect(toggle).not.toHaveAttribute('aria-label', before ?? '', { timeout: 5000 });

      // 원복
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-label', before ?? '', { timeout: 5000 });
    });
  });

  // ── 7-11. 라벨 관리 ───────────────────────
  test.describe('라벨 관리', () => {
    test.beforeEach(async ({ page }) => {
      await clickTab(page, '라벨 관리');
      await expect(page.getByRole('heading', { name: /라벨 관리/ })).toBeVisible({ timeout: 5000 });
      // 라벨 목록 API 완료 대기 (fetchLabels 비동기)
      await page.waitForLoadState('networkidle', { timeout: 10_000 });

      // 이전 테스트 실행이 남긴 E2E 테스트 라벨 정리 (20개 한도 방지)
      const res = await page.request.get('/api/labels');
      if (res.ok()) {
        const data = await res.json() as { labels?: { id: number; name: string }[] };
        const e2eLabels = (data.labels ?? []).filter((l) => l.name.startsWith('E2E'));
        for (const label of e2eLabels) {
          await page.request.delete(`/api/labels/${label.id}`);
        }
        if (e2eLabels.length > 0) {
          await page.reload();
          await clickTab(page, '라벨 관리');
          await page.waitForLoadState('networkidle', { timeout: 10_000 });
        }
      }
    });

    // ── 7. 새 라벨 추가 폼 열림 ──
    test('"새 라벨 추가" 버튼 클릭 시 입력 폼이 나타난다', async ({ page }) => {
      await page.locator('button').filter({ hasText: '새 라벨 추가' }).click();
      await expect(page.locator('input[placeholder="라벨 이름"]')).toBeVisible({ timeout: 3000 });
    });

    // ── 8. 라벨 생성 ──────────────
    test('라벨 이름 입력 후 추가하면 목록에 나타난다', async ({ page }) => {
      // 특수문자 없는 이름 사용 (대괄호 등 regex 특수문자 회피)
      const LABEL_NAME = `E2E라벨${Date.now()}`;
      const beforeCount = await page.locator('button[title="삭제"]').count();

      await page.locator('button').filter({ hasText: '새 라벨 추가' }).click();
      await page.locator('input[placeholder="라벨 이름"]').fill(LABEL_NAME);
      await page.getByRole('button', { name: '추가', exact: true }).click();

      await waitForToast(page, '라벨이 추가되었습니다');
      // 입력 폼이 닫히고 삭제 버튼 수가 1개 증가했는지 확인
      await expect(page.locator('input[placeholder="라벨 이름"]')).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('button[title="삭제"]')).toHaveCount(beforeCount + 1, { timeout: 5000 });
    });

    // ── 9. 라벨 삭제 ──────────────
    test('라벨 삭제 시 확인 다이얼로그 → 목록에서 제거된다', async ({ page }) => {
      const LABEL_NAME = `E2E삭제${Date.now()}`;

      // 1) 삭제 대상 라벨 생성
      const beforeCount = await page.locator('button[title="삭제"]').count();
      await page.locator('button').filter({ hasText: '새 라벨 추가' }).click();
      await page.locator('input[placeholder="라벨 이름"]').fill(LABEL_NAME);
      await page.getByRole('button', { name: '추가', exact: true }).click();
      await waitForToast(page, '추가되었습니다');
      await expect(page.locator('button[title="삭제"]')).toHaveCount(beforeCount + 1, { timeout: 5000 });

      // 2) 생성된 라벨 행을 특정해서 삭제 아이콘 클릭 (hasText 특수문자 없어 안전)
      const labelRow = page.locator('div').filter({
        has: page.locator('button[title="삭제"]'),
      }).filter({ hasText: LABEL_NAME }).last();
      await labelRow.locator('button[title="삭제"]').click();

      // 3) 확인 다이얼로그 → "삭제" 클릭
      await expect(page.getByText('라벨 삭제', { exact: true })).toBeVisible({ timeout: 5000 });
      await page.locator('button').filter({ hasText: '삭제' }).last().click();

      // 4) 토스트 & 개수 복원 확인
      await waitForToast(page, '삭제되었습니다');
      await expect(page.locator('button[title="삭제"]')).toHaveCount(beforeCount, { timeout: 5000 });
    });

    // ── 10. 기본 라벨 자동 생성 다이얼로그 ──
    test('"기본 라벨 자동 생성" 클릭 시 확인 다이얼로그가 열린다', async ({ page }) => {
      await page.locator('button').filter({ hasText: '기본 라벨 자동 생성' }).click();

      // 다이얼로그 제목 & 생성 확인 버튼
      await expect(page.getByText('기본 라벨 자동 생성').first()).toBeVisible({ timeout: 3000 });
      await expect(page.locator('button').filter({ hasText: /^생성 \(/ })).toBeVisible();

      // 취소로 닫기
      await page.locator('button').filter({ hasText: '취소' }).last().click();
      await expect(page.locator('button').filter({ hasText: /^생성 \(/ })).not.toBeVisible({ timeout: 2000 });
    });

    // ── 11. 기본 라벨 자동 생성 실행 ──
    test('기본 라벨 자동 생성 확인 후 토스트가 표시된다', async ({ page }) => {
      await page.locator('button').filter({ hasText: '기본 라벨 자동 생성' }).click();
      await expect(page.locator('button').filter({ hasText: /^생성 \(/ })).toBeVisible({ timeout: 3000 });

      // 생성 버튼 클릭 (이미 존재하면 "이미 모든 기본 라벨이 존재합니다" 토스트)
      await page.locator('button').filter({ hasText: /^생성 \(/ }).click();

      // 성공 또는 "이미 존재" 중 하나의 토스트 표시 확인
      await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10_000 });
      const toastText = await page.locator('[role="status"]').textContent();
      expect(
        toastText?.includes('기본 라벨') || toastText?.includes('이미 모든')
      ).toBeTruthy();
    });
  });
});
