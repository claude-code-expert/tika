# Data Model: Team Collaboration

**Branch**: `001-team-collaboration` | **Date**: 2026-03-04

---

## 변경 사항 요약

| 작업 | 테이블 | 변경 내용 |
|------|--------|-----------|
| MODIFY | `workspaces` | `type` 컬럼 추가 |
| MODIFY | `members` | `role` enum 변경, `invited_by`, `joined_at` 추가 |
| MODIFY | `tickets` | `sprint_id`, `story_points` 추가 |
| NEW | `sprints` | 신규 테이블 |
| NEW | `workspace_invites` | 신규 테이블 |
| NEW | `ticket_assignees` | 신규 M:N 테이블 |

---

## 수정 테이블

### `workspaces` (기존 수정)

```
workspaces
  id              SERIAL           PK
  name            VARCHAR(100)     NOT NULL
  description     TEXT             NULLABLE
  owner_id        TEXT             NOT NULL FK→users(id)
+ type            VARCHAR(10)      NOT NULL DEFAULT 'PERSONAL'  -- 'PERSONAL' | 'TEAM'
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
```

**규칙**:
- `type = 'PERSONAL'`: 기존 개인 워크스페이스 (소급 적용)
- `type = 'TEAM'`: 팀 워크스페이스. OWNER당 최대 3개

---

### `members` (기존 수정)

```
members
  id              SERIAL           PK
  user_id         TEXT             NOT NULL FK→users(id)
  workspace_id    INTEGER          NOT NULL FK→workspaces(id)
  display_name    VARCHAR(50)      NOT NULL
  color           VARCHAR(7)       NOT NULL DEFAULT '#7EB4A2'
  role            VARCHAR(10)      NOT NULL DEFAULT 'MEMBER'    -- 변경: 'OWNER' | 'MEMBER' | 'VIEWER'
+ invited_by      INTEGER          NULLABLE FK→members(id)      -- 초대한 멤버 (NULL = 창설자)
+ joined_at       TIMESTAMPTZ      NULLABLE                      -- 초대 수락 시각 (NULL = 창설자)
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
  UNIQUE(user_id, workspace_id)
```

**마이그레이션 SQL (기존 데이터)**:
```sql
UPDATE members SET role = 'OWNER'  WHERE role = 'admin';
UPDATE members SET role = 'MEMBER' WHERE role = 'member';
```

**역할 권한 매트릭스**:

| 기능 | OWNER | MEMBER | VIEWER |
|------|:-----:|:------:|:------:|
| 보드 조회 | ✅ | ✅ | ✅ |
| 티켓 상세 조회 | ✅ | ✅ | ✅ |
| 티켓 CRUD | ✅ | ✅ | ❌ |
| 댓글 CRUD | ✅ | ✅ | ❌ |
| 스프린트 CRUD | ✅ | ❌ | ❌ |
| 멤버 초대 | ✅ | ❌ | ❌ |
| 멤버 역할 변경 | ✅ | ❌ | ❌ |
| 멤버 강제 제거 | ✅ | ❌ | ❌ |
| 워크스페이스 설정 | ✅ | ❌ | ❌ |
| 워크스페이스 삭제 | ✅ | ❌ | ❌ |

---

### `tickets` (기존 수정)

```
tickets
  id              SERIAL           PK
  workspace_id    INTEGER          NOT NULL FK→workspaces(id)
  title           VARCHAR(200)     NOT NULL
  description     TEXT             NULLABLE
  type            VARCHAR(10)      NOT NULL DEFAULT 'TASK'
  status          VARCHAR(20)      NOT NULL DEFAULT 'BACKLOG'
  priority        VARCHAR(10)      NOT NULL DEFAULT 'MEDIUM'
  position        INTEGER          NOT NULL DEFAULT 0
  start_date      DATE             NULLABLE
  due_date        DATE             NULLABLE
  issue_id        INTEGER          NULLABLE FK→issues(id) ON DELETE SET NULL
  assignee_id     INTEGER          NULLABLE FK→members(id) ON DELETE SET NULL  -- 유지 (하위 호환)
+ sprint_id       INTEGER          NULLABLE FK→sprints(id) ON DELETE SET NULL
+ story_points    INTEGER          NULLABLE  -- 1~100, 추정 전용
  completed_at    TIMESTAMPTZ      NULLABLE
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
```

---

## 신규 테이블

### `sprints`

```
sprints
  id                  SERIAL           PK
  workspace_id        INTEGER          NOT NULL FK→workspaces(id) ON DELETE CASCADE
  name                VARCHAR(100)     NOT NULL
  goal                TEXT             NULLABLE
  status              VARCHAR(20)      NOT NULL DEFAULT 'PLANNED'  -- 'PLANNED'|'ACTIVE'|'COMPLETED'|'CANCELLED'
  start_date          DATE             NULLABLE
  end_date            DATE             NULLABLE
  story_points_total  INTEGER          NULLABLE  -- 배정된 티켓의 story_points 합계
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT now()
  INDEX(workspace_id, status)
```

**상태 전이**:
```
PLANNED ──activate──▶ ACTIVE ──complete──▶ COMPLETED
PLANNED ──cancel───▶ CANCELLED
ACTIVE  ──cancel───▶ CANCELLED
```

**규칙**:
- 한 워크스페이스에 ACTIVE 스프린트는 최대 1개
- PLANNED 상태만 삭제 가능
- `story_points_total`은 배정 티켓 변경 시 업데이트 (실시간 집계)

---

### `workspace_invites`

```
workspace_invites
  id              SERIAL           PK
  workspace_id    INTEGER          NOT NULL FK→workspaces(id) ON DELETE CASCADE
  invited_by      INTEGER          NOT NULL FK→members(id) ON DELETE CASCADE
  token           UUID             NOT NULL UNIQUE DEFAULT gen_random_uuid()
  email           VARCHAR(255)     NOT NULL  -- 초대 대상 이메일 (고정, 타 계정 차단)
  role            VARCHAR(10)      NOT NULL  -- 'MEMBER' | 'VIEWER'
  status          VARCHAR(10)      NOT NULL DEFAULT 'PENDING'  -- 'PENDING'|'ACCEPTED'|'REJECTED'|'EXPIRED'
  expires_at      TIMESTAMPTZ      NOT NULL  -- created_at + 7일
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
  INDEX(workspace_id, status)
  INDEX(token)  -- token 조회 성능
```

**상태 전이**:
```
PENDING ──accept──▶ ACCEPTED   (로그인 이메일 == invite.email 검증)
PENDING ──reject──▶ REJECTED
PENDING ──expired──▶ EXPIRED   (cron: created_at + 7일 후)
```

**규칙**:
- 토큰은 이메일 귀속: 수락 시 `session.user.email === invite.email` 일치 필수
- 만료 처리: `app/api/cron/route.ts`에서 매일 처리 (`WHERE status='PENDING' AND expires_at < now()`)

---

### `ticket_assignees` (다중 담당자 M:N)

```
ticket_assignees
  ticket_id       INTEGER          NOT NULL FK→tickets(id) ON DELETE CASCADE
  member_id       INTEGER          NOT NULL FK→members(id) ON DELETE CASCADE
  PRIMARY KEY(ticket_id, member_id)
  INDEX(member_id)  -- "내 티켓" 필터 성능
```

**규칙**:
- 티켓당 최대 5개 rows (애플리케이션 레이어에서 검증)
- `tickets.assignee_id`와 병행 운영 (개인 보드 하위 호환)
- 멤버가 워크스페이스에서 제거될 때 ON DELETE CASCADE로 자동 삭제

---

## TypeScript 타입 정의

### 신규 상수 및 타입

```typescript
// src/types/index.ts 추가

export const TEAM_ROLE = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;
export type TeamRole = (typeof TEAM_ROLE)[keyof typeof TEAM_ROLE];

export const WORKSPACE_TYPE = {
  PERSONAL: 'PERSONAL',
  TEAM: 'TEAM',
} as const;
export type WorkspaceType = (typeof WORKSPACE_TYPE)[keyof typeof WORKSPACE_TYPE];

export const SPRINT_STATUS = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type SprintStatus = (typeof SPRINT_STATUS)[keyof typeof SPRINT_STATUS];

export const INVITE_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type InviteStatus = (typeof INVITE_STATUS)[keyof typeof INVITE_STATUS];

export interface Sprint {
  id: number;
  workspaceId: number;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  storyPointsTotal: number | null;
  createdAt: string;
}

export interface WorkspaceInvite {
  id: number;
  workspaceId: number;
  invitedBy: number;
  token: string;
  email: string;
  role: 'MEMBER' | 'VIEWER';
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface TicketAssignee {
  ticketId: number;
  memberId: number;
}
```

### 기존 타입 확장

```typescript
// MEMBER_ROLE 교체 (기존 'admin'|'member' → 'OWNER'|'MEMBER'|'VIEWER')
export const MEMBER_ROLE = TEAM_ROLE;  // alias for backward compat
export type MemberRole = TeamRole;

// Workspace에 type 추가
export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  ownerId: string;
  type: WorkspaceType;       // NEW
  createdAt: string;
}

// Ticket에 sprint/storyPoints 추가
export interface Ticket {
  // ... 기존 필드 ...
  sprintId: number | null;     // NEW
  storyPoints: number | null;  // NEW
}

// TicketWithMeta에 assignees 추가
export interface TicketWithMeta extends Ticket {
  // ... 기존 필드 ...
  assignees: Member[];         // NEW (다중 담당자)
}
```

---

## ERD 요약 (14개 테이블)

```
users ──────────────────────────────────────────────────────────────┐
  │ owner_id                                                        │ user_id
  ▼                                                                 ▼
workspaces ─── type: PERSONAL|TEAM                              members ── role: OWNER|MEMBER|VIEWER
  │ workspace_id                                                    │  ▲ invited_by (self-ref)
  ├──▶ members ──▶ ticket_assignees ◀── tickets ──▶ sprints       │
  ├──▶ tickets ─────────────────────────────────────────────────────┘
  │    │  └──▶ checklist_items
  │    │  └──▶ ticket_labels ◀── labels
  │    └──▶ comments
  ├──▶ issues (Goal/Story/Feature, self-ref parentId)
  ├──▶ sprints
  ├──▶ workspace_invites ── token (UUID)
  ├──▶ notification_channels
  └──▶ notification_logs
```
