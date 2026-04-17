# Coding Conventions

**Analysis Date:** 2026-04-11

## Code Style

**Formatter:** Prettier 3.4.0
- Config: `.prettierrc`
- Settings:
  - `semi: true` — 세미콜론 필수
  - `singleQuote: true` — 싱글 쿼트 사용
  - `tabWidth: 2` — 2스페이스 들여쓰기
  - `trailingComma: 'all'` — 마지막 쉼표 필수
  - `printWidth: 100` — 한 줄 최대 100자
  - `plugins: ['prettier-plugin-tailwindcss']` — Tailwind 클래스 자동 정렬

**Linter:** ESLint 9.0.0
- Config: `eslint.config.mjs`
- Uses: `eslint-config-next` (Next.js 기본 규칙) + `next/typescript` (TypeScript 지원)

**Format & Lint 실행:**
```bash
npm run format     # Prettier 포맷팅
npm run lint       # ESLint 검사
```

## Naming Conventions

| 항목 | 규칙 | 예제 |
|------|------|------|
| **파일** | kebab-case (컴포넌트는 PascalCase) | `Button.tsx`, `use-tickets.ts`, `auth.ts` |
| **디렉토리** | kebab-case | `ui/`, `server/`, `shared/` |
| **함수** | camelCase | `getTickets()`, `calculatePosition()`, `toTicket()` |
| **컴포넌트** | PascalCase | `<Button />`, `<TicketCard />`, `<ConfirmDialog />` |
| **타입/인터페이스** | PascalCase | `TicketWithMeta`, `ButtonProps`, `BoardData` |
| **상수** | UPPER_SNAKE_CASE | `TICKET_STATUS`, `COLUMN_ORDER`, `POSITION_GAP` |
| **변수** | camelCase | `workspaceId`, `isOverdue`, `mockSession` |
| **Props 인터페이스** | `{컴포넌트명}Props` | `ButtonProps`, `ConfirmDialogProps`, `TicketCardProps` |
| **열거형 객체** | PascalCase (키는 UPPER_SNAKE_CASE) | `const TICKET_PRIORITY = { LOW: 'LOW', MEDIUM: 'MEDIUM' }` |

## Import Patterns

**경로 별칭 (Path Aliases):**
```typescript
@/*          → ./src/*              // 기본 alias
@/app/*      → ./app/*              // App Router 파일
@/shared/*   → ./src/shared/*       // 공유 타입/검증
@/server/*   → ./src/server/*       // 서버 전용 코드
@/client/*   → ./src/client/*       // 클라이언트 전용 코드
```

**Import 조직화 순서:**
```typescript
// 1. Node/외부 라이브러리
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 2. Next.js 기본 제공
import { auth } from '@/lib/auth';

// 3. 프로젝트 별칭 import (Path Alias)
import { createTicketSchema } from '@/shared/validations/ticket';
import { ticketService } from '@/server/services/ticketService';
import { Button } from '@/client/components/ui/Button';

// 4. 타입 import
import type { Session } from 'next-auth';
import type { Ticket, BoardData } from '@/types/index';
```

**Barrel 파일 (Index 파일):**
- `src/types/index.ts` — 중앙 타입 관리 (모든 도메인 타입이 여기서 export)
- `src/server/services/index.ts` — 서버 서비스 재export
- 컴포넌트 디렉토리는 barrel 파일 없이 직접 import

예제:
```typescript
// ✅ 올바른 방식
import { TicketWithMeta, BoardData } from '@/types/index';

// ❌ 피해야 할 방식
import { TicketWithMeta } from '@/types/ticket';  // 직접 파일 import
```

## Error Handling Pattern

**커스텀 에러 클래스:**
위치: `src/shared/errors/index.ts`

```typescript
// 에러 정의
export class TicketNotFoundError extends Error {
  constructor(id: number) {
    super(`티켓을 찾을 수 없습니다 (id: ${id})`);
    this.name = 'TicketNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**API Route Handler에서의 에러 처리:**
```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    // 2. 입력 검증 (Zod)
    const validated = createTicketSchema.parse(data);

    // 3. 비즈니스 로직
    const result = await ticketService.create(validated);
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    // 4. 에러 로깅 및 응답
    console.error('GET /api/tickets error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
```

**에러 코드 체계:**
| 코드 | HTTP 상태 | 용도 |
|------|-----------|------|
| `UNAUTHORIZED` | 401 | 인증 없음 또는 권한 부족 |
| `VALIDATION_ERROR` | 400 | Zod 검증 실패 |
| `TICKET_NOT_FOUND` | 404 | 티켓 미존재 |
| `INTERNAL_ERROR` | 500 | 서버 예외 |

## Common Patterns

### 1. 서버 함수 — 타입 변환 헬퍼

`src/server/services/ticketService.ts`에서:
```typescript
// DB 행을 도메인 모델로 변환
type DbTicket = typeof tickets.$inferSelect;

function toTicket(row: DbTicket): Ticket {
  return {
    id: row.id,
    title: row.title,
    // ... 필드 매핑
  };
}

function toTicketWithMeta(row: DbTicket): TicketWithMeta {
  const ticket = toTicket(row);
  const today = new Date().toISOString().split('T')[0];
  const isOverdue =
    ticket.dueDate !== null &&
    ticket.dueDate < today &&
    ticket.status !== TICKET_STATUS.DONE;
  return { ...ticket, isOverdue };
}

export const ticketService = {
  async create(input: CreateTicketInput): Promise<Ticket> {
    const [row] = await db.insert(tickets).values({ ... }).returning();
    return toTicket(row);
  },
};
```

### 2. Zod 검증 스키마

위치: `src/shared/validations/ticket.ts`

```typescript
import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z
    .string({ required_error: '제목을 입력해주세요' })
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요')
    .refine((val) => val.trim().length > 0, '제목을 입력해주세요'),
  priority: z
    .enum([TICKET_PRIORITY.LOW, TICKET_PRIORITY.MEDIUM, TICKET_PRIORITY.HIGH], {
      errorMap: () => ({ message: '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요' }),
    })
    .optional(),
  dueDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const today = new Date().toISOString().split('T')[0];
        return val >= today;
      },
      '종료예정일은 오늘 이후 날짜를 선택해주세요'
    ),
});

export type CreateTicketSchema = z.infer<typeof createTicketSchema>;
```

### 3. React 컴포넌트 Props 패턴

`src/components/ui/Button.tsx`:
```typescript
'use client';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-400',
  // ...
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isLoading ? '처리 중...' : children}
    </button>
  );
}
```

### 4. 상수 관리

위치: `src/lib/constants.ts`

```typescript
// 도메인 유형별로 관련 상수를 그룹화
export const POSITION_GAP = 1024;
export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 1000;

// 티켓 제한
export const TICKET_MAX_PER_WORKSPACE = 1000;
export const TICKET_MAX_TEAM_WORKSPACE = 5000;
```

### 5. 타입 정의 패턴 (열거형 + 타입)

`src/types/index.ts`:
```typescript
// 문자열 열거형 정의
export const TICKET_STATUS = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

// 타입 추출
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

// 또는
export const COLUMN_ORDER: TicketStatus[] = [
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.DONE,
];
```

## Anti-patterns to Avoid

1. **직접 SQL 문자열 사용**
   - ❌ `db.raw('SELECT * FROM tickets WHERE ...')`
   - ✅ Drizzle ORM 쿼리 빌더 사용 (`db.query.tickets.findMany()`)

2. **API Route에 비즈니스 로직 직접 작성**
   - ❌ Route Handler 내에서 복잡한 쿼리 수행
   - ✅ `src/server/services/` 또는 `src/db/queries/` 에 분리

3. **타입을 여러 파일에 산재**
   - ❌ `src/components/types.ts`, `src/services/types.ts` 등 각각 정의
   - ✅ `src/types/index.ts`에 중앙 집중식 관리

4. **CSS-in-JS 라이브러리 도입**
   - ❌ `styled-components`, `emotion` 사용
   - ✅ Tailwind CSS 유틸리티 클래스만 사용

5. **globals.css에 무분별한 클래스 추가**
   - ❌ `.custom-button { ... }` 스타일 정의
   - ✅ 인라인 Tailwind 클래스 또는 컴포넌트화

6. **Props로 모든 스타일 전달**
   - ❌ `<Button style={{ color: 'red', padding: '10px' }} />`
   - ✅ 기본 variants + className prop으로만 커스터마이제이션

7. **테스트 없이 서비스 로직 변경**
   - ❌ `src/server/services/ticketService.ts` 수정 후 테스트 스킵
   - ✅ 관련 유닛/통합 테스트 실행 후 커밋

## Comments & Documentation

### 함수 주석 (JSDoc/TSDoc)

중요한 비즈니스 로직이나 복잡한 함수에만 작성:
```typescript
/**
 * BACKLOG 칼럼에 새 티켓을 추가하고 위치를 계산한다.
 * 새 티켓은 칼럼 상단에 배치된다 (가장 작은 position - 1024)
 * 
 * FR-001: Create a new ticket in BACKLOG column
 */
async create(input: CreateTicketInput): Promise<Ticket> {
  const position = await this.calculatePosition(TICKET_STATUS.BACKLOG);
  // ...
}
```

### 인라인 주석

필요한 경우에만 (명백하지 않은 로직):
```typescript
// 예: API 라우트의 주석
/**
 * @jest-environment node
 * GET /api/tickets, POST /api/tickets Route Handler 테스트
 * next-auth ESM 이슈 방지: @/lib/auth를 mock해서 next-auth가 로드되지 않도록 함
 */
```

## Notes

- **TypeScript Strict Mode:** `tsconfig.json`에서 `"strict": true` — 모든 타입이 명시적이어야 함
- **Import 순서:** Prettier가 자동으로 정렬하므로 수동 정렬 불필요
- **한글 메시지:** 사용자 메시지, 에러 메시지, 검증 메시지는 한글
- **코드 주석/변수명:** 영어 (팀이 한국어로 소통하지만, 코드는 국제 표준)
- **세미콜론:** 반드시 사용 (Prettier 설정)

---

*Convention analysis: 2026-04-11*
