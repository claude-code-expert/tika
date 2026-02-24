# Data Model: Tika Phase 1 MVP

**Feature**: 001-kanban-board | **Date**: 2026-02-23

---

## Entity Relationship Overview

```
users (1) ──── (N) workspaces
workspaces (1) ── (N) tickets
workspaces (1) ── (N) labels
workspaces (1) ── (N) issues
workspaces (1) ── (N) members

tickets (N) ──── (M) labels      [via ticket_labels]
tickets (1) ──── (N) checklist_items
tickets (N) ──── (1) issues      [issue_id FK, optional]
tickets (N) ──── (1) members     [assignee_id FK, optional]

issues (N) ──── (1) issues       [parent_id self-reference, optional]
members (N) ──── (1) users       [user_id FK]
```

---

## Current State vs Target State

### 현재 (to-be-migrated)

```sql
tickets: id, title, description, status, priority, position,
         plannedStartDate, dueDate, startedAt, completedAt,
         createdAt, updatedAt
```

### 목표 (Phase 1 완성)

8개 테이블로 확장. 아래 참조.

---

## Tables

### 1. users

Google OAuth 사용자 정보. NextAuth.js가 자동 관리.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | TEXT | PK | — | OAuth Provider ID (Google sub) |
| email | VARCHAR(255) | NOT NULL, UNIQUE | — | Google 이메일 |
| name | VARCHAR(100) | NOT NULL | — | 표시 이름 |
| avatar_url | TEXT | NULLABLE | NULL | 프로필 이미지 URL |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 가입 시각 |

**Notes**: PK는 TEXT (Google의 OAuth sub claim). NextAuth Drizzle adapter가 자동 관리.

---

### 2. workspaces

사용자당 1개의 데이터 격리 단위. 첫 로그인 시 자동 생성.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | SERIAL | PK | — | 워크스페이스 ID |
| name | VARCHAR(100) | NOT NULL | '내 워크스페이스' | 워크스페이스 이름 |
| owner_id | TEXT | NOT NULL, FK→users(id) | — | 소유자 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**Business Rules**:
- Phase 1: 사용자당 1개 워크스페이스만 허용
- 첫 로그인 시 NextAuth `signIn` 콜백에서 자동 생성

---

### 3. tickets

칸반 보드의 핵심 엔티티. 할 일의 기본 단위.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | SERIAL | PK | — | 티켓 ID |
| workspace_id | INTEGER | NOT NULL, FK→workspaces(id) | — | 소속 워크스페이스 |
| title | VARCHAR(200) | NOT NULL | — | 제목 (1~200자, 공백만 불가) |
| description | TEXT | NULLABLE | NULL | 설명 (최대 1,000자) |
| type | VARCHAR(10) | NOT NULL | 'TASK' | 타입: GOAL/STORY/FEATURE/TASK |
| status | VARCHAR(20) | NOT NULL | 'BACKLOG' | 상태: BACKLOG/TODO/IN_PROGRESS/DONE |
| priority | VARCHAR(10) | NOT NULL | 'MEDIUM' | 우선순위: LOW/MEDIUM/HIGH/CRITICAL |
| position | INTEGER | NOT NULL | 0 | 칼럼 내 정렬 순서 (gap-based) |
| due_date | DATE | NULLABLE | NULL | 마감일 (YYYY-MM-DD) |
| issue_id | INTEGER | NULLABLE, FK→issues(id) ON DELETE SET NULL | NULL | 연결된 상위 이슈 |
| assignee_id | INTEGER | NULLABLE, FK→members(id) ON DELETE SET NULL | NULL | 담당자 |
| completed_at | TIMESTAMPTZ | NULLABLE | NULL | 완료 시각 (Done 이동 시 자동 설정) |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL | now() | 수정 시각 (자동 갱신) |

**Indexes**:
- `idx_tickets_workspace_status_position` ON (workspace_id, status, position) — 보드 조회 최적화
- `idx_tickets_due_date` ON (due_date) — 오버듀 판정 최적화

**Business Rules**:
- 생성 시 status = BACKLOG, position = min(같은 칼럼의 position) - 1024 (없으면 0)
- Done으로 이동 시: completed_at = NOW()
- Done에서 다른 칼럼으로 이동 시: completed_at = NULL
- 워크스페이스당 최대 300개 (생성 전 COUNT 체크)

**isOverdue** (파생 필드, DB 미저장):
```
isOverdue = (due_date IS NOT NULL) AND (due_date < TODAY) AND (status != 'DONE')
```

**Removed from current schema**:
- `planned_start_date` → Phase 1 spec에 미포함, 제거
- `started_at` → Phase 1 spec에 미포함, 제거

---

### 4. checklist_items

티켓 하위의 세부 작업 목록.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | SERIAL | PK | — | 항목 ID |
| ticket_id | INTEGER | NOT NULL, FK→tickets(id) ON DELETE CASCADE | — | 소속 티켓 |
| text | VARCHAR(200) | NOT NULL | — | 항목 텍스트 (1~200자) |
| is_completed | BOOLEAN | NOT NULL | false | 완료 여부 |
| position | INTEGER | NOT NULL | 0 | 정렬 순서 |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**Indexes**: `idx_checklist_items_ticket_id` ON (ticket_id)

**Business Rules**:
- 티켓당 최대 20개
- 추가 시 position = MAX(기존 position) + 1
- 티켓 삭제 시 CASCADE 삭제

---

### 5. labels

색상 라벨. 워크스페이스 단위로 격리.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | SERIAL | PK | — | 라벨 ID |
| workspace_id | INTEGER | NOT NULL, FK→workspaces(id) | — | 소속 워크스페이스 |
| name | VARCHAR(20) | NOT NULL | — | 라벨명 (1~20자) |
| color | VARCHAR(7) | NOT NULL | '#3B82F6' | HEX 색상 코드 (#RRGGBB) |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**Constraints**: `UNIQUE(workspace_id, name)` — 워크스페이스 내 라벨명 중복 불가

**Business Rules**:
- 워크스페이스당 최대 20개
- 기본 6개 라벨은 워크스페이스 생성 시 자동 삽입 (seed)
- 삭제 시 ticket_labels CASCADE → 티켓에서 자동 제거

**Default labels**:

| name | color |
|------|-------|
| Frontend | #2b7fff |
| Backend | #00c950 |
| Design | #ad46ff |
| Bug | #fb2c36 |
| Docs | #ffac6d |
| Infra | #615fff |

---

### 6. ticket_labels

티켓-라벨 M:N 관계 매핑 테이블.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| ticket_id | INTEGER | FK→tickets(id) ON DELETE CASCADE | 티켓 ID |
| label_id | INTEGER | FK→labels(id) ON DELETE CASCADE | 라벨 ID |

**Constraints**: PK(ticket_id, label_id)

**Business Rules**:
- 티켓당 최대 5개 라벨

---

### 7. issues

Goal/Story/Feature 3단계 이슈 계층. 자기참조 트리 구조.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | SERIAL | PK | — | 이슈 ID |
| workspace_id | INTEGER | NOT NULL, FK→workspaces(id) | — | 소속 워크스페이스 |
| name | VARCHAR(100) | NOT NULL | — | 이슈명 |
| type | VARCHAR(10) | NOT NULL | — | 타입: GOAL/STORY/FEATURE |
| parent_id | INTEGER | NULLABLE, FK→issues(id) ON DELETE SET NULL | NULL | 상위 이슈 ID |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**Indexes**:
- `idx_issues_workspace_type` ON (workspace_id, type)
- `idx_issues_parent_id` ON (parent_id)

**Business Rules**:
- GOAL: parent_id = NULL (최상위)
- STORY: parent_id = GOAL.id
- FEATURE: parent_id = STORY.id
- 삭제 시 하위 이슈의 parent_id → NULL (SET NULL)
- 티켓 연결: ticket.issue_id → issues.id (어떤 레벨에도 자유 연결, clarification Q1)

---

### 8. members

워크스페이스 내 사용자 담당자 정보.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | SERIAL | PK | — | 멤버 ID |
| user_id | TEXT | NOT NULL, FK→users(id) | — | 연결된 사용자 |
| workspace_id | INTEGER | NOT NULL, FK→workspaces(id) | — | 소속 워크스페이스 |
| display_name | VARCHAR(50) | NOT NULL | — | 표시 이름 |
| color | VARCHAR(7) | NOT NULL | '#7EB4A2' | 아바타 배경색 (HEX) |
| created_at | TIMESTAMPTZ | NOT NULL | now() | 생성 시각 |

**Constraints**: `UNIQUE(user_id, workspace_id)` — 워크스페이스당 1명의 멤버 레코드

**Business Rules**:
- 첫 로그인 시 자동 생성 (수동 등록 불가, Phase 1)
- Phase 1: 담당자는 본인만 배정 가능

---

## State Transitions

### Ticket Status

```
BACKLOG ←→ TODO ←→ IN_PROGRESS ←→ DONE
(모든 방향 자유 이동 가능)

DONE으로 이동: completed_at = NOW()
DONE에서 다른 상태로: completed_at = NULL
```

### Position (Gap-based Ordering)

```
초기 간격: POSITION_GAP = 1024
새 카드 추가 (칼럼 맨 위): position = min(column.positions) - 1024
                            (빈 칼럼이면 position = 0)
카드 삽입 (A와 B 사이): position = (A.position + B.position) / 2
간격 소진 (gap < 1): 해당 칼럼 전체 position을 1024 간격으로 재계산
```

---

## TypeScript Types (target)

```typescript
// src/types/index.ts

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
  CRITICAL: 'CRITICAL',
} as const;
export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

export const TICKET_TYPE = {
  GOAL: 'GOAL',
  STORY: 'STORY',
  FEATURE: 'FEATURE',
  TASK: 'TASK',
} as const;
export type TicketType = (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE];

export const ISSUE_TYPE = {
  GOAL: 'GOAL',
  STORY: 'STORY',
  FEATURE: 'FEATURE',
} as const;
export type IssueType = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE];

export interface Ticket {
  id: number;
  workspaceId: number;
  title: string;
  description: string | null;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  position: number;
  dueDate: string | null;         // YYYY-MM-DD
  issueId: number | null;
  assigneeId: number | null;
  completedAt: string | null;     // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export interface TicketWithMeta extends Ticket {
  isOverdue: boolean;
  labels: Label[];
  checklistItems: ChecklistItem[];
  issue: Issue | null;
  assignee: Member | null;
}

export interface ChecklistItem {
  id: number;
  ticketId: number;
  text: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
}

export interface Label {
  id: number;
  workspaceId: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface Issue {
  id: number;
  workspaceId: number;
  name: string;
  type: IssueType;
  parentId: number | null;
  createdAt: string;
}

export interface Member {
  id: number;
  userId: string;
  workspaceId: number;
  displayName: string;
  color: string;
  createdAt: string;
}

export interface Workspace {
  id: number;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface BoardData {
  board: Record<TicketStatus, TicketWithMeta[]>;
  total: number;
}
```

---

## Migration Strategy

**Step 1** (Milestone A): schema.ts에 7개 테이블 추가 + tickets 확장
```bash
npm run db:generate   # 마이그레이션 파일 자동 생성
npm run db:migrate    # 적용
```

**Step 2** (Milestone A): seed.ts에 기본 라벨 6개 시드 추가

**Breaking changes**:
- `planned_start_date`, `started_at` 칼럼 제거 (현재 코드에서 사용 중인지 확인 필요)
- `tickets.priority`에 CRITICAL 값 추가 (기존 데이터 영향 없음)
- `tickets.type` 추가 (기본값 'TASK'으로 마이그레이션)
