# Tika - 데이터 모델 명세 (DATA_MODEL.md)

> 버전: 2.0 (Phase 1 Full)
> ORM: Drizzle ORM + Vercel Postgres
> 최종 수정일: 2026-02-22

---

## 1. ERD (Entity Relationship Diagram)

### Phase 1: 8개 테이블

```
users ──< workspaces         (1:N, owner_id FK)
users ──< members            (1:N, user_id FK)
workspaces ──< tickets       (1:N, workspace_id FK)
workspaces ──< labels        (1:N, workspace_id FK)
workspaces ──< issues        (1:N, workspace_id FK)
workspaces ──< members       (1:N, workspace_id FK)
tickets ──< checklist_items  (1:N, ticket_id FK CASCADE)
tickets >──< labels          (M:N, ticket_labels 연결 테이블, 양쪽 CASCADE)
tickets >── issues           (N:1, issue_id FK SET NULL)
tickets >── members          (N:1, assignee_id FK SET NULL)
issues ──< issues            (self-referencing N:1, parent_id FK SET NULL)
members: UNIQUE(user_id, workspace_id)
labels: UNIQUE(workspace_id, name)
```

```
┌─────────────────┐     ┌──────────────────────┐
│     users       │     │    workspaces         │
├─────────────────┤     ├──────────────────────┤
│ id    TEXT  PK  │◄────│ owner_id  FK→users   │
│ email UNIQUE    │     │ id        SERIAL PK  │
│ name            │     │ name                 │
│ avatar_url      │     │ created_at           │
│ created_at      │     └──────────┬───────────┘
└────────┬────────┘                │ 1:N
         │ 1:N                     ▼
         │          ┌──────────────────────────────────────────────────┐
         │          │                    tickets                       │
         │          ├──────────────────────────────────────────────────┤
         │          │ id            SERIAL        PK                   │
         │          │ workspace_id  INTEGER       NOT NULL FK→ws       │
         │          │ title         VARCHAR(200)  NOT NULL             │
         │          │ type          VARCHAR(10)   NOT NULL             │
         │          │ description   TEXT          NULLABLE             │
         │          │ status        VARCHAR(20)   NOT NULL  'BACKLOG'  │
         │          │ priority      VARCHAR(10)   NOT NULL  'MEDIUM'   │
         │          │ position      INTEGER       NOT NULL  0          │
         │          │ due_date      DATE          NULLABLE             │
         │          │ completed_at  TIMESTAMPTZ   NULLABLE             │
         │          │ issue_id      INTEGER       NULLABLE  FK→issues  │
         │          │ assignee_id   INTEGER       NULLABLE  FK→members │
         │          │ created_at    TIMESTAMPTZ   NOT NULL  now()      │
         │          │ updated_at    TIMESTAMPTZ   NOT NULL  now()      │
         │          └──────────────────────────────────────────────────┘
         │                  │                   │              │
         │                  │ 1:N               │ N:1          │ N:1
         │                  ▼                   ▼              ▼
         │          ┌───────────────┐   ┌────────────────┐  ┌─────────────────────┐
         │          │checklist_items│   │    issues       │  │      members        │
         │          ├───────────────┤   ├────────────────┤  ├─────────────────────┤
         │          │ id        PK  │   │ id         PK  │  │ id            PK    │
         │          │ ticket_id FK  │   │ workspace_id FK│  │ user_id       FK→u  │◄── users
         │          │ text          │   │ name           │  │ workspace_id  FK→ws │
         │          │ is_completed  │   │ type           │  │ display_name        │
         │          │ position      │   │ parent_id FK   │  │ color               │
         │          │ created_at    │   │ created_at     │  │ created_at          │
         │          └───────────────┘   └────────────────┘  └─────────────────────┘
         │                                   │ self-ref       UNIQUE(user_id, ws_id)
         │                                   └─────────┘
         │
         │          tickets >──< labels (M:N)
         │          ┌────────────────────┐
         │          │   ticket_labels    │
         │          ├────────────────────┤
         │          │ ticket_id  FK (PK) │
         │          │ label_id   FK (PK) │
         │          └────────────────────┘
         │                  │
         │                  ▼
         │          ┌──────────────────┐
         │          │     labels       │
         │          ├──────────────────┤
         │          │ id           PK  │
         │          │ workspace_id FK  │
         │          │ name             │
         │          │ color            │
         │          │ created_at       │
         │          └──────────────────┘
         │          UNIQUE(workspace_id, name)
```

---

## 2. 테이블 정의

### 2.1 tickets

| 칼럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | SERIAL | PK, auto-increment | — | 티켓 고유 식별자 |
| workspace_id | INTEGER | NOT NULL, FK→workspaces(id) | — | 소속 워크스페이스 |
| title | VARCHAR(200) | NOT NULL | — | 티켓 제목 (1~200자) |
| type | VARCHAR(10) | NOT NULL | — | 티켓 타입 (GOAL/STORY/FEATURE/TASK) |
| description | TEXT | NULLABLE | NULL | 티켓 상세 설명 (최대 1,000자) |
| status | VARCHAR(20) | NOT NULL | 'BACKLOG' | 현재 상태 (칸반 칼럼) |
| priority | VARCHAR(10) | NOT NULL | 'MEDIUM' | 우선순위 |
| position | INTEGER | NOT NULL | 0 | 칼럼 내 표시 순서 (gap-based) |
| due_date | DATE | NULLABLE | NULL | 마감일 (YYYY-MM-DD) |
| completed_at | TIMESTAMPTZ | NULLABLE | NULL | 완료 시각 (DONE 이동 시 자동 기록) |
| issue_id | INTEGER | NULLABLE, FK→issues(id) ON DELETE SET NULL | NULL | 연결된 상위 이슈 |
| assignee_id | INTEGER | NULLABLE, FK→members(id) ON DELETE SET NULL | NULL | 담당 멤버 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | 수정 시각 |

**status 허용값**: `BACKLOG`, `TODO`, `IN_PROGRESS`, `DONE`

**type 허용값**: `GOAL`, `STORY`, `FEATURE`, `TASK`

**priority 허용값**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**인덱스**:

| 인덱스명 | 칼럼 | 용도 |
|---------|------|------|
| idx_tickets_workspace_status_position | (workspace_id, status, position) | 워크스페이스+칼럼별 정렬 조회 (보드 렌더링) |
| idx_tickets_due_date | (due_date) | 마감일 기준 조회 |
| idx_tickets_issue_id | (issue_id) | 이슈별 티켓 조회 |
| idx_tickets_assignee_id | (assignee_id) | 담당자별 티켓 조회 |

---

### 2.2 checklist_items

| 칼럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | SERIAL | PK, auto-increment | — | 항목 고유 식별자 |
| ticket_id | INTEGER | NOT NULL, FK→tickets(id) ON DELETE CASCADE | — | 소속 티켓 |
| text | VARCHAR(200) | NOT NULL | — | 항목 텍스트 (1~200자) |
| is_completed | BOOLEAN | NOT NULL | false | 완료 여부 |
| position | INTEGER | NOT NULL | 0 | 항목 내 정렬 순서 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**제약**: 티켓당 최대 20개

**인덱스**:

| 인덱스명 | 칼럼 | 용도 |
|---------|------|------|
| idx_checklist_items_ticket_id | (ticket_id, position) | 티켓별 항목 정렬 조회 |

---

### 2.3 labels

| 칼럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | SERIAL | PK, auto-increment | — | 라벨 고유 식별자 |
| workspace_id | INTEGER | NOT NULL, FK→workspaces(id) | — | 소속 워크스페이스 |
| name | VARCHAR(20) | NOT NULL | — | 라벨 이름 (1~20자) |
| color | VARCHAR(7) | NOT NULL | '#3B82F6' | HEX 색상 코드 (#RRGGBB) |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**제약**: 워크스페이스당 최대 20개. `UNIQUE(workspace_id, name)`

---

### 2.4 ticket_labels (연결 테이블)

| 칼럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| ticket_id | INTEGER | PK(복합), FK→tickets(id) ON DELETE CASCADE | 티켓 참조 |
| label_id | INTEGER | PK(복합), FK→labels(id) ON DELETE CASCADE | 라벨 참조 |

**제약**: 티켓당 최대 5개 라벨 (애플리케이션 레이어에서 강제)

**인덱스**:

| 인덱스명 | 칼럼 | 용도 |
|---------|------|------|
| PK | (ticket_id, label_id) | 중복 방지 |
| idx_ticket_labels_label_id | (label_id) | 라벨별 티켓 조회 |

---

### 2.5 issues

| 칼럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | SERIAL | PK, auto-increment | — | 이슈 고유 식별자 |
| workspace_id | INTEGER | NOT NULL, FK→workspaces(id) | — | 소속 워크스페이스 |
| name | VARCHAR(100) | NOT NULL | — | 이슈 이름 (1~100자) |
| type | VARCHAR(10) | NOT NULL | — | 이슈 타입 (GOAL/STORY/FEATURE/TASK) |
| parent_id | INTEGER | NULLABLE, FK→issues(id) ON DELETE SET NULL | NULL | 상위 이슈 (self-referencing) |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**type 계층 규칙**:
- GOAL: parent_id = null (최상위)
- STORY: parent_id = GOAL 타입 이슈
- FEATURE: parent_id = STORY 타입 이슈
- TASK: parent_id = FEATURE 타입 이슈

**인덱스**:

| 인덱스명 | 칼럼 | 용도 |
|---------|------|------|
| idx_issues_parent_id | (parent_id) | 하위 이슈 조회 |
| idx_issues_type | (type) | 타입별 이슈 조회 |

---

### 2.6 members

| 칼럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | SERIAL | PK, auto-increment | — | 멤버 고유 식별자 |
| user_id | TEXT | NOT NULL, FK→users(id) | — | 연결된 사용자 |
| workspace_id | INTEGER | NOT NULL, FK→workspaces(id) | — | 소속 워크스페이스 |
| display_name | VARCHAR(50) | NOT NULL | — | 표시 이름 (1~50자) |
| color | VARCHAR(7) | NOT NULL | '#7EB4A2' | 아바타 배경 HEX 색상 (#RRGGBB) |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**제약**: `UNIQUE(user_id, workspace_id)` — 워크스페이스당 사용자 1명의 멤버 레코드

---

### 2.7 users

| 칼럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | TEXT | PK | — | OAuth provider ID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | — | 이메일 |
| name | VARCHAR(100) | NOT NULL | — | 표시 이름 |
| avatar_url | TEXT | NULLABLE | NULL | 프로필 이미지 URL |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 가입 시각 |

---

### 2.8 workspaces

| 칼럼 | 타입 | 제약조건 | 기본값 | 설명 |
|------|------|----------|--------|------|
| id | SERIAL | PK, auto-increment | — | 워크스페이스 고유 식별자 |
| name | VARCHAR(100) | NOT NULL | '내 워크스페이스' | 워크스페이스 이름 |
| owner_id | TEXT | NOT NULL, FK→users(id) | — | 소유자 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

---

## 3. Drizzle 스키마 정의

```typescript
// src/server/db/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  date,
  timestamp,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';

// --- users ---
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

// --- workspaces ---
export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().default('내 워크스페이스'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

// --- members ---
export const members = pgTable(
  'members',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    displayName: varchar('display_name', { length: 50 }).notNull(),
    color: varchar('color', { length: 7 }).notNull().default('#7EB4A2'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueUserWorkspace: unique().on(table.userId, table.workspaceId),
  }),
);

// --- issues ---
export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(),
  parentId: integer('parent_id').references(() => issues.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

// --- tickets ---
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  workspaceId: integer('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  title: varchar('title', { length: 200 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('BACKLOG'),
  priority: varchar('priority', { length: 10 }).notNull().default('MEDIUM'),
  position: integer('position').notNull().default(0),
  dueDate: date('due_date', { mode: 'string' }),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  issueId: integer('issue_id').references(() => issues.id, { onDelete: 'set null' }),
  assigneeId: integer('assignee_id').references(() => members.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- checklist_items ---
export const checklistItems = pgTable('checklist_items', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  text: varchar('text', { length: 200 }).notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

// --- labels ---
export const labels = pgTable(
  'labels',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    name: varchar('name', { length: 20 }).notNull(),
    color: varchar('color', { length: 7 }).notNull().default('#3B82F6'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueWorkspaceName: unique().on(table.workspaceId, table.name),
  }),
);

// --- ticket_labels (M:N 연결 테이블) ---
export const ticketLabels = pgTable(
  'ticket_labels',
  {
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    labelId: integer('label_id')
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ticketId, table.labelId] }),
  }),
);
```

---

## 4. TypeScript 타입 정의

```typescript
// src/shared/types/index.ts

// --- 티켓 상태 ---
export const TICKET_STATUS = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

// --- 티켓 타입 ---
export const TICKET_TYPE = {
  GOAL: 'GOAL',
  STORY: 'STORY',
  FEATURE: 'FEATURE',
  TASK: 'TASK',
} as const;

export type TicketType = (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE];

// --- 우선순위 (CRITICAL 추가) ---
export const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

// --- 이슈 타입 ---
export const ISSUE_TYPE = {
  GOAL: 'GOAL',
  STORY: 'STORY',
  FEATURE: 'FEATURE',
  TASK: 'TASK',
} as const;

export type IssueType = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE];

// --- 칼럼 순서 ---
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

// --- 체크리스트 항목 ---
export interface ChecklistItem {
  id: number;
  ticketId: number;
  text: string;
  isCompleted: boolean;
  position: number;
  createdAt: Date;
}

// --- 라벨 ---
export interface Label {
  id: number;
  workspaceId: number;
  name: string;
  color: string;  // #RRGGBB
  createdAt: Date;
}

// --- 이슈 ---
export interface Issue {
  id: number;
  workspaceId: number;
  name: string;
  type: IssueType;
  parentId: number | null;
  createdAt: Date;
}

export interface IssueBreadcrumbItem {
  id: number;
  name: string;
  type: IssueType;
}

export interface IssueWithBreadcrumb extends Issue {
  breadcrumb: IssueBreadcrumbItem[];
}

// --- 사용자 ---
export interface User {
  id: string;                // OAuth provider ID
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}

// --- 워크스페이스 ---
export interface Workspace {
  id: number;
  name: string;
  ownerId: string;           // FK → User.id
  createdAt: Date;
}

// --- 멤버 ---
export interface Member {
  id: number;
  userId: string;            // FK → User.id
  workspaceId: number;       // FK → Workspace.id
  displayName: string;
  color: string;             // #RRGGBB (아바타 배경색)
  createdAt: Date;
}

// --- 티켓 기본 ---
export interface Ticket {
  id: number;
  workspaceId: number;
  title: string;
  type: TicketType;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  position: number;
  dueDate: string | null;       // ISO 8601 date (YYYY-MM-DD)
  completedAt: Date | null;
  issueId: number | null;
  assigneeId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- 티켓 + 메타 (파생 필드 + 관계 데이터 포함) ---
export interface TicketWithMeta extends Ticket {
  isOverdue: boolean;                     // dueDate < today && status !== DONE
  checklist: ChecklistItem[];             // 체크리스트 항목 목록
  labels: Label[];                        // 부착된 라벨 목록 (최대 5개)
  issue: IssueWithBreadcrumb | null;      // 연결된 상위 이슈 (브레드크럼 포함)
  assignee: Member | null;               // 담당 멤버
}

// --- API 요청 타입 ---
export interface CreateTicketInput {
  title: string;
  type?: TicketType;            // 기본값: TASK
  status?: TicketStatus;        // 기본값: BACKLOG
  description?: string;
  priority?: TicketPriority;
  dueDate?: string;             // YYYY-MM-DD
  checklist?: { text: string }[];
  labelIds?: number[];          // 최대 5개
  issueId?: number;
  assigneeId?: number;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string | null;
  priority?: TicketPriority;
  dueDate?: string | null;
  labelIds?: number[] | null;   // null 또는 [] = 전체 해제
  issueId?: number | null;
  assigneeId?: number | null;
}

export interface ReorderTicketInput {
  ticketId: number;
  status: TicketStatus;
  position: number;             // 0-based 인덱스
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
- 드래그앤드롭 시: 클라이언트는 0-based 인덱스 전송, 서버는 gap-based position으로 변환
- position 간격이 1 이하로 좁아지면 해당 칼럼 전체 재정렬 (1024 간격으로 재설정)

### 5.4 라벨 제약

- 티켓당 최대 5개 라벨 (애플리케이션 레이어 강제)
- 전체 라벨 최대 20개
- 라벨 삭제 시 ticket_labels CASCADE로 자동 해제

### 5.5 체크리스트 제약

- 티켓당 최대 20개 항목 (애플리케이션 레이어 강제)
- 티켓 삭제 시 checklist_items CASCADE 삭제

### 5.6 이슈 계층 규칙

- GOAL: parent_id = null 필수 (최상위)
- STORY: parent_id는 반드시 GOAL 타입 이슈
- FEATURE: parent_id는 반드시 STORY 타입 이슈
- TASK: parent_id는 반드시 FEATURE 타입 이슈
- 이슈 삭제 시: 하위 이슈 parent_id = null, 연결 티켓 issue_id = null (SET NULL)

### 5.7 멤버 삭제 규칙

- 멤버 삭제 시 해당 멤버가 배정된 모든 티켓의 assignee_id = null (SET NULL)

### 5.8 워크스페이스 데이터 격리

- 모든 데이터 조회/생성은 현재 사용자의 워크스페이스로 스코핑
- tickets, labels, issues, members 쿼리 시 `WHERE workspace_id = ?` 필수
- 다른 사용자의 워크스페이스 데이터 접근 불가

### 5.9 자동 멤버 생성 (Phase 1)

- 최초 로그인 시: users 생성 → workspaces 생성 → members 자동 생성
- members.display_name = users.name (초기값)
- Phase 1에서는 수동 멤버 생성 불가 (로그인 시 자동 생성만)
- Phase 4에서 팀 멤버 초대로 확장

### 5.10 담당자 배정 규칙 (Phase 1)

- Phase 1: 담당자는 본인(로그인 사용자의 member)만 배정 가능
- 미배정(null) 허용
- 다른 멤버 선택 불가 (Phase 4에서 확장)

---

## 6. 시드 데이터

개발 및 데모용 초기 데이터 예시:

```typescript
// src/server/db/seed.ts

// --- 사용자 시드 ---
const seedUsers = [
  { id: 'google-uid-001', email: 'hong@example.com', name: '홍길동', avatarUrl: null },
];

// --- 워크스페이스 시드 ---
const seedWorkspaces = [
  { name: '내 워크스페이스', ownerId: 'google-uid-001' },
];

// --- 멤버 시드 (로그인 시 자동 생성) ---
const seedMembers = [
  { userId: 'google-uid-001', workspaceId: 1, displayName: '홍길동', color: '#7EB4A2' },
];

// --- 라벨 시드 ---
const seedLabels = [
  { workspaceId: 1, name: 'Frontend', color: '#2b7fff' },
  { workspaceId: 1, name: 'Backend', color: '#00c950' },
  { workspaceId: 1, name: 'Design', color: '#ad46ff' },
  { workspaceId: 1, name: 'Bug', color: '#fb2c36' },
  { workspaceId: 1, name: 'Docs', color: '#ffac6d' },
  { workspaceId: 1, name: 'Infra', color: '#615fff' },
];

// --- 이슈 시드 ---
const seedIssues = [
  { workspaceId: 1, name: 'MVP 출시', type: 'GOAL', parentId: null },
  { workspaceId: 1, name: '사용자 인증 시스템', type: 'STORY', parentId: 1 },
  { workspaceId: 1, name: '칸반 보드', type: 'STORY', parentId: 1 },
  { workspaceId: 1, name: '인증 API', type: 'FEATURE', parentId: 2 },
  { workspaceId: 1, name: '드래그앤드롭', type: 'FEATURE', parentId: 3 },
  { workspaceId: 1, name: 'JWT 토큰 구현', type: 'TASK', parentId: 4 },
];

// --- 티켓 시드 ---
const seedTickets = [
  {
    workspaceId: 1,
    title: '프로젝트 요구사항 정리',
    type: 'TASK',
    status: 'DONE',
    priority: 'HIGH',
    position: 0,
    assigneeId: 1,
  },
  {
    workspaceId: 1,
    title: 'UI 와이어프레임 작성',
    type: 'TASK',
    status: 'DONE',
    priority: 'MEDIUM',
    position: 1024,
    assigneeId: 1,
  },
  {
    workspaceId: 1,
    title: 'API 설계 문서 작성',
    type: 'FEATURE',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    position: 0,
    issueId: 4,
    assigneeId: 1,
  },
  {
    workspaceId: 1,
    title: 'DB 스키마 설계',
    type: 'TASK',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    position: 1024,
    assigneeId: 1,
  },
  {
    workspaceId: 1,
    title: '칸반 보드 UI 구현',
    type: 'FEATURE',
    status: 'TODO',
    priority: 'HIGH',
    position: 0,
    issueId: 5,
    assigneeId: 1,
  },
  {
    workspaceId: 1,
    title: '드래그앤드롭 기능 구현',
    type: 'TASK',
    status: 'TODO',
    priority: 'MEDIUM',
    position: 1024,
    issueId: 5,
    assigneeId: 1,
  },
  {
    workspaceId: 1,
    title: '알림 기능 조사',
    type: 'STORY',
    status: 'BACKLOG',
    priority: 'LOW',
    position: 0,
  },
  {
    workspaceId: 1,
    title: '성능 테스트 계획',
    type: 'TASK',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    position: 1024,
    assigneeId: 1,
  },
  {
    workspaceId: 1,
    title: 'CI/CD 파이프라인 구축',
    type: 'FEATURE',
    status: 'BACKLOG',
    priority: 'LOW',
    position: 2048,
  },
];
```
