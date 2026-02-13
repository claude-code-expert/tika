# 데이터 모델: Create Ticket API

**기능**: 001-create-ticket-api
**날짜**: 2026-02-13
**관련 명세**: [spec.md](./spec.md)
**프로젝트 데이터 모델**: [../../docs/DATA_MODEL.md](../../docs/DATA_MODEL.md)

---

## 개요

이 기능은 BACKLOG 칼럼에 새 티켓을 생성합니다. 데이터 모델은 `tickets` 테이블과 티켓 생성에 관련된 특정 필드에 집중합니다.

---

## 엔티티: Ticket

### 생성 시 관련 필드

| 필드 | 타입 | 출처 | 검증 | 기본값 | 설명 |
|-----|------|------|------|-------|------|
| **id** | number | 시스템 | Auto-increment | (생성됨) | 고유 식별자 |
| **title** | string | 사용자 | 1-200자, 공백만 불가 | (필수) | 티켓 제목 |
| **description** | string \| null | 사용자 | 최대 1000자 | null | 상세 설명 |
| **priority** | string | 사용자 | LOW \| MEDIUM \| HIGH | MEDIUM | 우선순위 수준 |
| **plannedStartDate** | string \| null | 사용자 | YYYY-MM-DD 형식 | null | 시작 예정일 |
| **dueDate** | string \| null | 사용자 | YYYY-MM-DD, 오늘 또는 이후 | null | 마감일 |
| **status** | string | 시스템 | BACKLOG | BACKLOG | 현재 칼럼 |
| **position** | number | 시스템 | Integer | min(column) - 1024 | 칼럼 내 정렬 순서 |
| **startedAt** | Date \| null | 시스템 | - | null | TODO로 이동 시 |
| **completedAt** | Date \| null | 시스템 | - | null | DONE으로 이동 시 |
| **createdAt** | Date | 시스템 | ISO 8601 timestamp | now() | 생성 타임스탬프 |
| **updatedAt** | Date | 시스템 | ISO 8601 timestamp | now() | 마지막 업데이트 타임스탬프 |

### 필드 범주

**사용자 제공** (요청 본문에서):
- title (필수)
- description (선택)
- priority (선택)
- plannedStartDate (선택)
- dueDate (선택)

**시스템 생성** (서버에서 설정):
- id
- status (항상 BACKLOG)
- position (계산됨)
- startedAt (새 티켓은 항상 null)
- completedAt (새 티켓은 항상 null)
- createdAt
- updatedAt

---

## 데이터베이스 스키마 (Drizzle)

```typescript
// src/server/db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  date,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const tickets = pgTable(
  'tickets',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 20 }).notNull().default('BACKLOG'),
    priority: varchar('priority', { length: 10 }).notNull().default('MEDIUM'),
    position: integer('position').notNull(),
    plannedStartDate: date('planned_start_date', { mode: 'string' }),
    dueDate: date('due_date', { mode: 'string' }),
    startedAt: timestamp('started_at', { mode: 'date' }),
    completedAt: timestamp('completed_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_tickets_status_position').on(table.status, table.position),
  ]
);
```

---

## TypeScript 타입

### 입력 타입 (요청 본문)

```typescript
// src/shared/types/index.ts
export interface CreateTicketInput {
  title: string;
  description?: string;
  priority?: TicketPriority;
  plannedStartDate?: string;  // YYYY-MM-DD
  dueDate?: string;            // YYYY-MM-DD
}
```

### 출력 타입 (응답)

```typescript
// src/shared/types/index.ts
export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  position: number;
  plannedStartDate: string | null;
  dueDate: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Enum 타입

```typescript
export const TICKET_STATUS = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];
```

---

## 검증 스키마 (Zod)

```typescript
// src/shared/validations/ticket.ts
import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요')
    .refine(val => val.trim().length > 0, '제목을 입력해주세요'),

  description: z.string()
    .max(1000, '설명은 1000자 이내로 입력해주세요')
    .optional(),

  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: '우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요' }),
  }).optional(),

  plannedStartDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD 이어야 합니다')
    .optional(),

  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD 이어야 합니다')
    .refine(
      val => val >= new Date().toISOString().split('T')[0],
      '종료예정일은 오늘 이후 날짜를 선택해주세요'
    )
    .optional(),
});

// 타입 추론
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
```

---

## 비즈니스 규칙

### 규칙 1: 자동 Status 할당
- **규칙**: 새로 생성된 모든 티켓은 반드시 status = BACKLOG
- **근거**: 새 티켓은 항상 Backlog 칼럼에서 시작
- **구현**: 시스템이 status 설정, 사용자는 재정의 불가

### 규칙 2: Position 계산
- **규칙**: 새 티켓 position = min(기존 BACKLOG positions) - 1024
- **근거**: 새 티켓을 BACKLOG 칼럼 최상단에 배치
- **구현**:
  ```typescript
  const minPosition = await db
    .select({ min: min(tickets.position) })
    .from(tickets)
    .where(eq(tickets.status, 'BACKLOG'));

  const position = (minPosition[0]?.min ?? 0) - 1024;
  ```

### 규칙 3: 워크플로 타임스탬프
- **규칙**: 새 티켓은 반드시 startedAt = null 및 completedAt = null
- **근거**: 티켓은 TODO로 이동할 때만 시작, DONE으로 이동할 때만 완료
- **구현**: 시스템이 생성 시 null 값 강제

### 규칙 4: 기본 Priority
- **규칙**: priority가 제공되지 않으면 MEDIUM으로 기본 설정
- **근거**: 대부분의 티켓이 중간 우선순위
- **구현**: 데이터베이스 기본값 + 기본값이 있는 Zod optional

### 규칙 5: 날짜 검증
- **규칙**: dueDate는 오늘 또는 이후여야 함
- **근거**: 과거 마감일 설정 불가
- **구현**: 날짜 비교가 있는 Zod refine
- **참고**: plannedStartDate는 과거 제한 없음 (소급 계획 가능)

---

## 데이터 흐름

```
사용자 입력                    검증                    시스템 처리                    데이터베이스
─────────                     ──────                  ──────────                    ────────
{                             Zod 스키마              ticketService.create()        INSERT
  title,           ──────▶    - title: 1-200자  ──▶  - position 계산          ──▶  tickets
  description?,               - desc: 최대 1000       - status = BACKLOG 설정        테이블
  priority?,                  - priority: enum        - startedAt = null 설정
  plannedStartDate?,          - dates: YYYY-MM-DD     - completedAt = null 설정
  dueDate?                    - dueDate: >= 오늘      - createdAt = now() 설정
}                                                      - updatedAt = now() 설정

                                     │
                                     │ 검증 실패 시
                                     ▼
                              HTTP 400 Bad Request
                              { error: { code, message } }
```

---

## 데이터 변환 예제

### 입력 → 데이터베이스 레코드

**HTTP 요청 본문:**
```json
{
  "title": "API 설계 문서 작성",
  "description": "REST API 엔드포인트와 요청/응답 형식을 정의한다",
  "priority": "HIGH",
  "plannedStartDate": "2026-02-10",
  "dueDate": "2026-02-15"
}
```

**데이터베이스 INSERT:**
```sql
INSERT INTO tickets (
  title,
  description,
  priority,
  planned_start_date,
  due_date,
  status,
  position,
  started_at,
  completed_at,
  created_at,
  updated_at
) VALUES (
  'API 설계 문서 작성',
  'REST API 엔드포인트와 요청/응답 형식을 정의한다',
  'HIGH',
  '2026-02-10',
  '2026-02-15',
  'BACKLOG',           -- 시스템 설정
  -1024,               -- 계산됨
  NULL,                -- 시스템 설정
  NULL,                -- 시스템 설정
  '2026-02-13T09:00:00.000Z',  -- 시스템 설정
  '2026-02-13T09:00:00.000Z'   -- 시스템 설정
) RETURNING *;
```

**HTTP 응답 (201):**
```json
{
  "id": 1,
  "title": "API 설계 문서 작성",
  "description": "REST API 엔드포인트와 요청/응답 형식을 정의한다",
  "status": "BACKLOG",
  "priority": "HIGH",
  "position": -1024,
  "plannedStartDate": "2026-02-10",
  "dueDate": "2026-02-15",
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2026-02-13T09:00:00.000Z",
  "updatedAt": "2026-02-13T09:00:00.000Z"
}
```

---

## 엣지 케이스

### 빈 BACKLOG 칼럼
- **시나리오**: BACKLOG에 티켓 없음
- **Position 계산**: `(0) - 1024 = -1024`
- **결과**: 첫 번째 티켓이 position -1024를 가짐

### 여러 빠른 생성
- **시나리오**: 3개 티켓을 빠르게 연속 생성
- **Positions**: -1024, -2048, -3072 (각 새 티켓이 이전 위에 위치)
- **순서**: 가장 최근 티켓이 최상단에 나타남

### 최대 Position 도달
- **시나리오**: Position이 정수 한계(2,147,483,647)에 도달
- **완화방안**: BACKLOG에서는 가능성 낮음 (음수로 증가), 프로덕션에서 모니터링
- **향후**: 필요시 position 재정렬 구현

---

## 참조

- [프로젝트 전체 데이터 모델](../../docs/DATA_MODEL.md)
- [API 명세](../../docs/API_SPEC.md#1-post-apitickets)
- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [Zod 문서](https://zod.dev/)
