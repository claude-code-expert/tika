# Tika - 데이터 모델 명세 (DATA_MODEL.md)

> 버전: 1.0 (MVP)
> ORM: Drizzle ORM + Vercel Postgres

---

## 1. ERD (Entity Relationship Diagram)

### MVP: 단일 엔티티

```
┌─────────────────────────────────────┐
│              tickets                │
├─────────────────────────────────────┤
│ id          SERIAL       PK        │
│ title       VARCHAR(200) NOT NULL   │
│ description TEXT         NULLABLE   │
│ status      VARCHAR(20)  NOT NULL   │
│ priority    VARCHAR(10)  NOT NULL   │
│ position    INTEGER      NOT NULL   │
│ due_date    DATE         NULLABLE   │
│ completed_at TIMESTAMPTZ NULLABLE   │
│ created_at  TIMESTAMPTZ  NOT NULL   │
│ updated_at  TIMESTAMPTZ  NOT NULL   │
└─────────────────────────────────────┘
```

> MVP는 단일 사용자이므로 User 테이블 없이 tickets 테이블만 사용한다.
> 2차에서 Google OAuth 도입 시 users 테이블을 추가하고 tickets에 user_id FK를 연결한다.

### 2차 확장 예상 ERD

```
┌──────────────┐       ┌─────────────────┐
│    users     │       │    tickets      │
├──────────────┤       ├─────────────────┤
│ id       PK  │──1:N─▶│ user_id    FK   │
│ email        │       │ id         PK   │
│ name         │       │ title           │
│ avatar_url   │       │ ...             │
│ created_at   │       └─────────────────┘
└──────────────┘
                        ┌─────────────────┐
                        │    columns      │
                        ├─────────────────┤
                        │ id         PK   │
                        │ name            │
                        │ position        │
                        │ board_id   FK   │
                        └─────────────────┘
```

---

## 2. 테이블 정의: tickets

### 칼럼 상세

| 칼럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | SERIAL | PK, auto-increment | - | 티켓 고유 식별자 |
| title | VARCHAR(200) | NOT NULL | - | 티켓 제목 |
| description | TEXT | NULLABLE | NULL | 티켓 상세 설명 |
| status | VARCHAR(20) | NOT NULL | 'BACKLOG' | 현재 상태 (칼럼) |
| priority | VARCHAR(10) | NOT NULL | 'MEDIUM' | 우선순위 |
| position | INTEGER | NOT NULL | 0 | 칼럼 내 표시 순서 |
| due_date | DATE | NULLABLE | NULL | 마감일 |
| completed_at | TIMESTAMPTZ | NULLABLE | NULL | 완료 시각 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | 수정 시각 |

### 칼럼 제약사항

**status 허용값**: `BACKLOG`, `TODO`, `IN_PROGRESS`, `DONE`
**priority 허용값**: `LOW`, `MEDIUM`, `HIGH`

### 인덱스

| 인덱스 | 칼럼 | 용도 |
|--------|------|------|
| idx_tickets_status_position | (status, position) | 칼럼별 정렬 조회 (보드 렌더링) |
| idx_tickets_due_date | (due_date) | 마감일 기준 조회 |

---

## 3. Drizzle 스키마 정의

```typescript
// src/db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('BACKLOG'),
  priority: varchar('priority', { length: 10 }).notNull().default('MEDIUM'),
  position: integer('position').notNull().default(0),
  dueDate: date('due_date', { mode: 'string' }),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

---

## 4. TypeScript 타입 정의

```typescript
// src/types/index.ts

// --- 상태 및 우선순위 enum ---
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

// --- 칼럼 순서 정의 ---
export const COLUMN_ORDER: TicketStatus[] = [
  TICKET_STATUS.BACKLOG,
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.DONE,
];

export const COLUMN_LABELS: Record<TicketStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'TODO',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

// --- 티켓 타입 ---
export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  position: number;
  dueDate: string | null;       // ISO 8601 date (YYYY-MM-DD)
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 파생 필드 포함
export interface TicketWithMeta extends Ticket {
  isOverdue: boolean;           // dueDate < today && status !== DONE
}

// --- API 요청 타입 ---
export interface CreateTicketInput {
  title: string;
  description?: string;
  priority?: TicketPriority;
  dueDate?: string;             // YYYY-MM-DD
}

export interface UpdateTicketInput {
  title?: string;
  description?: string | null;
  priority?: TicketPriority;
  dueDate?: string | null;
}

export interface ReorderTicketInput {
  ticketId: number;
  status: TicketStatus;
  position: number;
}

// --- 보드 데이터 구조 ---
export type BoardData = Record<TicketStatus, TicketWithMeta[]>;
```

---

## 5. 비즈니스 규칙

### 5.1 완료 처리 자동화

| 이벤트 | 동작 |
|--------|------|
| status가 DONE으로 변경 | completedAt = 현재 시각 |
| status가 DONE에서 다른 값으로 변경 | completedAt = null |
| status가 DONE이 아닌 상태 간 이동 | completedAt 변경 없음 |

### 5.2 오버듀 판정

```typescript
function isOverdue(ticket: Ticket): boolean {
  if (!ticket.dueDate) return false;
  if (ticket.status === 'DONE') return false;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return ticket.dueDate < today;
}
```

### 5.3 Position 관리

- 각 칼럼(status) 내에서 position으로 순서 결정
- 새 티켓 생성 시: 해당 칼럼의 min(position) - 1024 (간격 확보)
- 드래그앤드롭 시: 인접 카드의 position 중간값 계산
- position 간격이 1 이하로 좁아지면 해당 칼럼 전체 재정렬 (1024 간격)

---

## 6. 시드 데이터

개발 및 데모용 초기 데이터:

```typescript
const seedTickets = [
  { title: '프로젝트 요구사항 정리', status: 'DONE', priority: 'HIGH', position: 0 },
  { title: 'UI 와이어프레임 작성', status: 'DONE', priority: 'MEDIUM', position: 1024 },
  { title: 'API 설계 문서 작성', status: 'IN_PROGRESS', priority: 'HIGH', position: 0 },
  { title: 'DB 스키마 설계', status: 'IN_PROGRESS', priority: 'MEDIUM', position: 1024 },
  { title: '로그인 페이지 구현', status: 'TODO', priority: 'HIGH', position: 0 },
  { title: '대시보드 레이아웃', status: 'TODO', priority: 'MEDIUM', position: 1024 },
  { title: '알림 기능 조사', status: 'BACKLOG', priority: 'LOW', position: 0 },
  { title: '성능 테스트 계획', status: 'BACKLOG', priority: 'MEDIUM', position: 1024 },
  { title: 'CI/CD 파이프라인 구축', status: 'BACKLOG', priority: 'LOW', position: 2048 },
];
```
