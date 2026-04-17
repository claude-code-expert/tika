# Testing

**Analysis Date:** 2026-04-11

## Test Frameworks

### Unit & Integration Tests

**Test Runner:** Jest 29.7.0
- Config: `jest.config.ts`
- Environment: jsdom (React 컴포넌트) + node (API 라우트)
- Setup: `jest.setup.ts` — Next.js 모듈 mock 및 테스트 유틸리티 설정

**Assertion Library:** Jest built-in + `@testing-library/jest-dom` 6.6.0

**React 테스트:** `@testing-library/react` 16.0.0 + `@testing-library/user-event` 14.5.0

### E2E Tests

**Framework:** Playwright 1.58.2
- Config: `playwright.config.ts`
- Test Dir: `tests/e2e/pages/`
- Global Setup: `tests/e2e/global.setup.ts` — 인증(JWT 쿠키) 설정
- Storage State: `tests/e2e/.auth/user.json` — 세션 유지

## Running Tests

```bash
# Unit & Integration Tests (Jest)
npm run test                 # 1회 실행
npm run test:watch          # 감시 모드 (변경 감지)
npm run test:coverage       # 커버리지 리포트 생성

# E2E Tests (Playwright)
npm run test:e2e            # Playwright 테스트 실행 (headless)
npm run test:e2e:ui         # UI 모드 (브라우저 창)
npm run test:e2e:report     # HTML 리포트 보기
```

## Test File Organization

**Jest 테스트:**

| 타입 | 위치 | 파일명 패턴 | 예제 |
|------|------|-----------|------|
| **유닛 - 함수** | `__tests__/lib/` | `*.test.ts` | `__tests__/lib/utils.test.ts` |
| **유닛 - 컴포넌트** | `__tests__/components/` | `*.test.tsx` | `__tests__/components/Button.test.tsx` |
| **유닛 - 훅** | `__tests__/hooks/` | `*.test.ts` | `__tests__/hooks/useTickets.test.ts` |
| **API 라우트** | `__tests__/api/` | `*.test.ts` | `__tests__/api/tickets.test.ts` |
| **통합** | `__tests__/integration/` | `TC-INT-*.test.ts` | `__tests__/integration/TC-INT-001-dnd-api.test.ts` |

**Playwright 테스트:**

| 타입 | 위치 | 파일명 패턴 |
|------|------|-----------|
| **E2E** | `tests/e2e/pages/` | `*.spec.ts` |
| **Fixtures** | `tests/e2e/fixtures/` | `*.ts` |
| **Global Setup** | `tests/e2e/` | `global.setup.ts` |

## Jest Test Structure

### 기본 구조

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/client/components/ui/Button';

describe('Button', () => {
  // 각 테스트 전 실행 (필요시)
  beforeEach(() => {
    // 초기화 코드
  });

  // 각 테스트 후 정리 (필요시)
  afterEach(() => {
    // 정리 코드
  });

  // 개별 테스트
  it('렌더링 테스트', () => {
    render(<Button>클릭</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('클릭');
  });

  // 파라미터화 테스트
  it.each([
    ['primary', 'btn-primary'],
    ['secondary', 'btn-secondary'],
  ])('variant=%s일 때 %s 클래스가 적용된다', (variant, expected) => {
    render(<Button variant={variant}>테스트</Button>);
    expect(screen.getByRole('button')).toHaveClass(expected);
  });
});
```

### 컴포넌트 테스트 예제

`__tests__/components/ConfirmDialog.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/client/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('isOpen=false이면 렌더링되지 않는다', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        message="삭제하시겠습니까?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.queryByText('삭제하시겠습니까?')).not.toBeInTheDocument();
  });

  it('확인 버튼을 클릭하면 onConfirm이 호출된다', async () => {
    const user = userEvent.setup();  // userEvent 초기화
    const onConfirm = jest.fn();
    
    render(
      <ConfirmDialog
        isOpen={true}
        message="삭제하시겠습니까?"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );
    
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
```

### 유틸리티 함수 테스트 예제

`__tests__/lib/utils.test.ts` (fake timer 사용):

```typescript
import { isOverdue } from '@/lib/utils';

describe('isOverdue', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-02-24T12:00:00.000Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('dueDate가 오늘보다 과거면 true를 반환한다', () => {
    expect(isOverdue('2026-02-23', 'TODO')).toBe(true);
  });

  it('status가 DONE이면 false를 반환한다', () => {
    expect(isOverdue('2026-01-01', 'DONE')).toBe(false);
  });
});
```

## Mocking Strategy

### Next.js 모듈 Mock

`jest.setup.ts`에서 전역으로 설정:

```typescript
// next/navigation mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// next/image mock
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => React.createElement('img', props),
}));

// next/link mock
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }) =>
    React.createElement('a', { href, ...rest }, children),
}));

// fetch mock (기본값)
global.fetch = jest.fn();

// window.matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});
```

### 서비스/쿼리 Mock

`__tests__/api/tickets.test.ts` 예제 (API 라우트 테스트):

```typescript
jest.mock('@/db/queries/tickets', () => ({
  getBoardData: jest.fn(),
  createTicket: jest.fn(),
  getTicketCount: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/permissions', () => ({
  requireRole: jest.fn(),
  isRoleError: jest.fn(),
}));

import { getBoardData, createTicket } from '@/db/queries/tickets';
import { auth } from '@/lib/auth';

const mockedGetBoardData = getBoardData as jest.Mock;
const mockedAuth = auth as jest.Mock;

// 테스트 내에서 반환값 설정
beforeEach(() => {
  mockedAuth.mockResolvedValue({ user: { id: 'user-1', workspaceId: 1 } });
  mockedGetBoardData.mockResolvedValue({
    board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] },
    total: 0,
  });
});
```

### 서비스 Mock 파일

`src/server/services/__mocks__/ticketService.ts`:

```typescript
// 필요시 서비스 mock을 별도 파일로 관리
export const ticketService = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

## Test Fixtures & Test Data

### 기본 테스트 데이터 (여러 테스트 파일에서 공유)

`__tests__/integration/TC-INT-001-dnd-api.test.ts`:

```typescript
const baseTicket: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: '테스트 티켓',
  description: null,
  type: 'TASK',
  status: 'BACKLOG',
  priority: 'MEDIUM',
  position: 0,
  dueDate: null,
  parentId: null,
  assigneeId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isOverdue: false,
  labels: [],
  checklistItems: [],
  parent: null,
  assignee: null,
  assignees: [],
};

const boardWithTicket: BoardData = {
  board: { BACKLOG: [baseTicket], TODO: [], IN_PROGRESS: [], DONE: [] },
  total: 1,
};
```

### Playwright Fixtures

`tests/e2e/fixtures/base.ts`:

```typescript
// Playwright custom fixture로 workspaceId 등을 주입
test.extend({
  workspaceId: async ({ }, use) => {
    const wsId = process.env.TEST_WORKSPACE_ID || '1';
    await use(parseInt(wsId));
  },
});
```

사용:
```typescript
test('칸반 보드 테스트', async ({ page, workspaceId }) => {
  await page.goto(`/workspace/${workspaceId}/board`);
  // ...
});
```

## Validation & Schema Tests

**Zod 검증 테스트:** `__tests__/lib/validations.test.ts`

```typescript
import { createTicketSchema } from '@/shared/validations/ticket';

describe('createTicketSchema', () => {
  it('최소 유효한 입력(title만)으로 파싱에 성공한다', () => {
    const result = createTicketSchema.safeParse({ title: '제목' });
    expect(result.success).toBe(true);
  });

  it('title이 비어 있으면 에러를 반환한다', () => {
    const result = createTicketSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('제목을 입력해주세요');
    }
  });

  it('title이 최대 길이를 초과하면 에러를 반환한다', () => {
    const result = createTicketSchema.safeParse({
      title: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
```

## Async & User Interaction Tests

### async/await 테스트

```typescript
it('API 호출 후 결과를 표시한다', async () => {
  const user = userEvent.setup();
  render(<TicketForm />);

  await user.type(screen.getByPlaceholderText('제목'), '새 티켓');
  await user.click(screen.getByRole('button', { name: '생성' }));

  // API 응답 대기
  await expect(screen.findByText('생성되었습니다')).resolves.toBeInTheDocument();
});
```

### 네트워크 요청 Mock

```typescript
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ id: 1, title: '테스트' }),
    })
  );
});

it('티켓 생성 API를 호출한다', async () => {
  const user = userEvent.setup();
  render(<TicketForm />);
  
  await user.type(screen.getByPlaceholderText('제목'), '새 티켓');
  await user.click(screen.getByRole('button', { name: '생성' }));

  expect(global.fetch).toHaveBeenCalledWith(
    '/api/tickets',
    expect.objectContaining({ method: 'POST' })
  );
});
```

## E2E Test Pattern (Playwright)

`tests/e2e/pages/board.spec.ts`:

```typescript
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

  test('티켓 생성 모달 — 제목 입력 후 생성된다', async ({ page }) => {
    const TITLE = `[E2E] board-test-${Date.now()}`;

    await page.getByRole('button', { name: /새 업무/ }).first().click();
    await expect(page.getByText('새 업무 만들기')).toBeVisible({ timeout: 3000 });

    await page.getByPlaceholder('업무 제목을 입력하세요').fill(TITLE);
    await page.locator('button').filter({ hasText: '새 업무 생성' }).click();

    // 모달이 닫히고 보드에 티켓 표시 대기
    await expect(page.locator(`[aria-label="티켓: ${TITLE}"]`)).toBeVisible({ timeout: 15000 });
  });

  test('티켓 카드 클릭 시 상세 모달이 열린다', async ({ page }) => {
    // 기존 티켓 클릭
    const ticketCard = page.locator('[aria-label*="티켓:"]').first();
    await ticketCard.click();
    
    // 상세 모달 확인
    await expect(page.getByText('업무 상세정보')).toBeVisible();
  });
});
```

## Coverage Configuration

**Coverage 제외 파일:**

`jest.config.ts`의 `collectCoverageFrom`:
```typescript
collectCoverageFrom: [
  'src/**/*.{js,jsx,ts,tsx}',
  'app/**/*.{js,jsx,ts,tsx}',
  '!**/*.d.ts',                    // TypeScript 타입 정의 파일
  '!**/node_modules/**',
  '!**/.next/**',
  '!**/drizzle/**',                // DB 마이그레이션
  '!src/server/db/seed.ts',        // Seed 스크립트
],
```

**커버리지 확인:**
```bash
npm run test:coverage
# 결과: coverage/ 디렉토리에 HTML 리포트 생성
```

## Integration Test Patterns

**TC-INT-001: 드래그앤드롭 + API 연동**

`__tests__/integration/TC-INT-001-dnd-api.test.ts`:

낙관적 업데이트 → API 호출 → 실패 시 롤백 사이클 검증:

```typescript
it('ticket을 다른 칼럼으로 옮기면 낙관적 UI 반영 후 API 호출한다', async () => {
  const { result } = renderHook(() => useTickets());

  act(() => {
    // 낙관적 업데이트 (즉시 UI에 반영)
    result.current.reorder(1, 'TODO');
  });

  // UI 상태 확인
  expect(result.current.board.TODO).toContainEqual(
    expect.objectContaining({ id: 1 })
  );

  // API 호출 확인
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tickets/reorder',
      expect.any(Object)
    );
  });
});
```

## Test Best Practices

1. **명확한 테스트 이름:** "should", "it", "when" 패턴 사용
   - ✅ `it('제목이 없으면 에러를 반환한다', ...)`
   - ❌ `it('test', ...)`

2. **Arrange-Act-Assert (AAA) 패턴:**
   ```typescript
   it('설명', () => {
     // Arrange: 테스트 데이터 준비
     const ticket = { id: 1, title: '제목' };
     
     // Act: 함수 실행
     const result = updateTicket(ticket, { title: '새 제목' });
     
     // Assert: 결과 검증
     expect(result.title).toBe('새 제목');
   });
   ```

3. **Mock 범위 최소화:** 실제 필요한 부분만 mock
   - ✅ API/DB 호출만 mock
   - ❌ 비즈니스 로직까지 mock

4. **비동기 작업 대기:** `await`, `waitFor()` 활용
   - ✅ `await expect(screen.findByText('...'))`
   - ❌ `expect(screen.getByText('...'))` (동기)

5. **테스트 격리:** 각 테스트가 독립적이어야 함
   - ✅ `beforeEach`/`afterEach`로 초기화
   - ❌ 테스트 간 상태 공유

## Test Coverage Goals

- **Unit Tests:** 유틸리티, 훅, 서비스 함수 (목표: 70% 이상)
- **Component Tests:** UI 컴포넌트 상호작용 (목표: 60% 이상)
- **Integration Tests:** API + UI 연동 (주요 flow만)
- **E2E Tests:** 사용자 여정 (critical path만)

---

*Testing analysis: 2026-04-11*
