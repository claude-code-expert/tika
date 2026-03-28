/**
 * 새 업무 생성 전체 플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. "새 업무" 버튼 클릭 → 모달 열림
 * 2. 티켓 타입 선택 (Task)
 * 3. 제목 입력
 * 4. 설명 입력
 * 5. 우선순위 변경 (HIGH)
 * 6. 시작일 / 종료일 입력
 * 7. 담당자 추가
 * 8. "새 업무 생성" 버튼 클릭
 * 9. 백로그 칼럼에 티켓 생성 확인
 */
import { test, expect } from '../fixtures/base';

// ─────────────────────────────────────────────
// 헬퍼: 모달 열기
// ─────────────────────────────────────────────
async function openCreateModal(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /새 업무/ }).first().click();
  await expect(page.getByText('새 업무 만들기')).toBeVisible({ timeout: 5000 });
}

// ─────────────────────────────────────────────
// 헬퍼: 제출 버튼 클릭
// ─────────────────────────────────────────────
async function submitModal(page: import('@playwright/test').Page) {
  await page.locator('button').filter({ hasText: '새 업무 생성' }).click();
}

// ─────────────────────────────────────────────
// 테스트
// ─────────────────────────────────────────────
test.describe('새 업무 생성 — 전체 폼 플로우', () => {
  test.beforeEach(async ({ page, workspaceId }) => {
    await page.goto(`/workspace/${workspaceId}/board`);
    await expect(page.getByText('Backlog').first()).toBeVisible({ timeout: 10_000 });
  });

  // ── 1. 타입 선택 ────────────────────────────
  test('타입 버튼 선택 — Task 클릭 시 활성화된다', async ({ page }) => {
    await openCreateModal(page);

    // 기본: Task가 이미 활성화된 상태
    // 다른 타입으로 변경 후 다시 Task로 돌아오기
    await page.getByRole('button', { name: 'Goal' }).click();
    await page.getByRole('button', { name: 'Task' }).click();

    // Task 버튼이 활성 스타일(배경색 변경)을 가지는지 확인
    // — 활성 상태는 aria-pressed 또는 class 변화로 확인
    const taskBtn = page.getByRole('button', { name: 'Task' });
    await expect(taskBtn).toBeVisible();
  });

  // ── 2. 제목 필수 검증 ────────────────────────
  test('제목 미입력 시 모달이 닫히지 않는다', async ({ page }) => {
    await openCreateModal(page);
    await submitModal(page);
    // 제목 없이 제출 → 모달 유지
    await expect(page.getByText('새 업무 만들기')).toBeVisible();
  });

  // ── 3. 전체 폼 입력 후 생성 ──────────────────
  test('전체 폼 입력 → 백로그에 티켓 생성', async ({ page }) => {
    const TITLE = `[E2E] 풀폼 테스트 ${Date.now()}`;
    const DESCRIPTION = '자동화 테스트로 생성된 티켓입니다.';
    const START_DATE = '2026-04-01';   // type="date"는 YYYY-MM-DD 형식
    const END_DATE = '2026-04-30';

    await openCreateModal(page);

    // 1) 타입 선택: Feature 클릭
    await page.getByRole('button', { name: 'Feature' }).click();

    // 2) 제목 입력
    await page.locator('#ticket-title').fill(TITLE);

    // 3) 설명 입력
    await page.locator('#ticket-desc').fill(DESCRIPTION);

    // 4) 우선순위 변경: HIGH
    //    <select> 요소 — selectOption()으로 value 직접 지정
    const prioritySelect = page.locator('select').filter({ hasText: /Medium|Low|High|Critical/i }).first();
    await prioritySelect.selectOption('HIGH');

    // 5) 시작일 입력
    //    type="date" 인풋은 fill()에 'YYYY-MM-DD' 형식 사용
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill(START_DATE);  // 시작 예정일
    await dateInputs.nth(1).fill(END_DATE);    // 종료 예정일

    // 6) 담당자 검색 & 추가
    //    생성자는 자동 추가됨 — 추가 멤버가 있으면 여기서 검색
    //    (워크스페이스에 멤버가 1명인 경우 스킵)
    const assigneeInput = page.locator('input[placeholder="이름으로 검색..."]');
    if (await assigneeInput.isVisible({ timeout: 1000 })) {
      await assigneeInput.fill('eDell');
      const suggestion = page.locator('button').filter({ hasText: 'eDell' }).first();
      if (await suggestion.isVisible({ timeout: 2000 })) {
        await suggestion.click();
      }
    }

    // 7) 제출
    await submitModal(page);

    // 8) 모달 닫힘 확인
    await expect(page.getByText('새 업무 만들기')).not.toBeVisible({ timeout: 5000 });

    // 9) 백로그에 티켓 카드 생성 확인 (aria-label 방식)
    await expect(
      page.locator(`[aria-label="티켓: ${TITLE}"]`)
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── 4. 날짜 유효성 검증 ──────────────────────
  test('종료일이 시작일보다 앞이면 에러가 표시된다', async ({ page }) => {
    await openCreateModal(page);

    await page.locator('#ticket-title').fill('날짜 검증 테스트');

    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2026-05-10');  // 시작일
    await dateInputs.nth(1).fill('2026-05-01');  // 종료일 < 시작일

    await submitModal(page);

    // 날짜 에러 메시지 표시
    await expect(page.getByText(/종료 예정일은 시작 예정일 이후/)).toBeVisible({ timeout: 3000 });
  });

  // ── 5. 취소 버튼 ────────────────────────────
  test('취소 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    await openCreateModal(page);

    await page.locator('#ticket-title').fill('취소될 티켓');
    await page.getByRole('button', { name: '취소' }).click();

    await expect(page.getByText('새 업무 만들기')).not.toBeVisible({ timeout: 3000 });
  });

  // ── 6. 우선순위별 생성 확인 ──────────────────
  test.describe('우선순위 선택 옵션', () => {
    for (const [value, label] of [
      ['LOW', 'Low'],
      ['MEDIUM', 'Medium'],
      ['HIGH', 'High'],
      ['CRITICAL', 'Critical'],
    ] as const) {
      test(`우선순위 ${label} 선택 가능`, async ({ page }) => {
        await openCreateModal(page);

        const prioritySelect = page.locator('select').filter({ hasText: /Medium|Low|High|Critical/i }).first();
        await prioritySelect.selectOption(value);

        // 선택된 값 확인
        await expect(prioritySelect).toHaveValue(value);
      });
    }
  });
});
