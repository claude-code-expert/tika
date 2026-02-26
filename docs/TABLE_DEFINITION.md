# Tika - 테이블 정의서

> 소스: `src/db/schema.ts` (Drizzle ORM)
> DB: PostgreSQL (Vercel Postgres / Neon)
> 최종 수정일: 2026-02-25

---

## 테이블 요약

| # | 테이블명 | 설명 | 행 수 기준 |
|---|----------|------|-----------|
| 1 | `users` | Google OAuth 사용자 | 1:1 per Google 계정 |
| 2 | `workspaces` | 워크스페이스 | users 1:N |
| 3 | `issues` | 이슈 계층 (Goal/Story/Feature) | workspaces 1:N, self-ref |
| 4 | `members` | 워크스페이스 멤버 | users × workspaces |
| 5 | `tickets` | 칸반 티켓 | workspaces 1:N |
| 6 | `checklist_items` | 체크리스트 항목 | tickets 1:N |
| 7 | `labels` | 라벨 정의 | workspaces 1:N |
| 8 | `ticket_labels` | 티켓-라벨 매핑 (M:N) | tickets × labels |
| 9 | `notification_channels` | 알림 채널 설정 (Slack/Telegram) | workspaces 1:N |

---

## 1. users

Google OAuth로 인증된 사용자 정보를 저장한다.

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| id | `id` | TEXT | **PK** | — | Google OAuth sub (문자열) |
| email | `email` | VARCHAR(255) | NOT NULL, UNIQUE | — | 이메일 |
| name | `name` | VARCHAR(100) | NOT NULL | — | 사용자 이름 |
| avatarUrl | `avatar_url` | TEXT | NULLABLE | NULL | 프로필 이미지 URL |
| createdAt | `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | 생성 시각 |

**인덱스**: `users_email_unique` → (email)

---

## 2. workspaces

사용자의 작업 공간. 최초 로그인 시 기본 워크스페이스가 자동 생성된다.

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| id | `id` | SERIAL | **PK** | auto-increment | 고유 ID |
| name | `name` | VARCHAR(100) | NOT NULL | `'내 워크스페이스'` | 워크스페이스 이름 (최대 50자) |
| description | `description` | TEXT | NULLABLE | NULL | 워크스페이스 설명 (최대 200자) |
| ownerId | `owner_id` | TEXT | NOT NULL, **FK** → users(id) | — | 소유자 |
| createdAt | `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | 생성 시각 |

---

## 3. issues

이슈 계층 구조 (Goal > Story > Feature). 티켓의 상위 개념으로, 자기참조 FK를 통해 계층 관계를 표현한다.

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| id | `id` | SERIAL | **PK** | auto-increment | 고유 ID |
| workspaceId | `workspace_id` | INT | NOT NULL, **FK** → workspaces(id) | — | 소속 워크스페이스 |
| name | `name` | VARCHAR(100) | NOT NULL | — | 이슈 이름 |
| type | `type` | VARCHAR(10) | NOT NULL | — | `GOAL` \| `STORY` \| `FEATURE` |
| parentId | `parent_id` | INT | NULLABLE | NULL | 상위 이슈 (self-ref) |
| createdAt | `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | 생성 시각 |

**인덱스**:
- `idx_issues_workspace_type` → (workspace_id, type)
- `idx_issues_parent_id` → (parent_id)

---

## 4. members

워크스페이스 내 멤버 (담당자). 사용자가 워크스페이스에 참여하면 자동 생성된다.

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| id | `id` | SERIAL | **PK** | auto-increment | 고유 ID |
| userId | `user_id` | TEXT | NOT NULL, **FK** → users(id) | — | 사용자 |
| workspaceId | `workspace_id` | INT | NOT NULL, **FK** → workspaces(id) | — | 소속 워크스페이스 |
| displayName | `display_name` | VARCHAR(50) | NOT NULL | — | 표시 이름 (이니셜) |
| color | `color` | VARCHAR(7) | NOT NULL | `'#7EB4A2'` | 아바타 색상 (HEX) |
| role | `role` | VARCHAR(10) | NOT NULL | `'member'` | 역할: `admin` \| `member` |
| createdAt | `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | 생성 시각 |

**유니크 제약**: `members_user_workspace_unique` → (user_id, workspace_id)

---

## 5. tickets

칸반 보드의 핵심 엔티티. 4단계 워크플로우(BACKLOG → TODO → IN_PROGRESS → DONE)를 가진다.

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| id | `id` | SERIAL | **PK** | auto-increment | 고유 ID |
| workspaceId | `workspace_id` | INT | NOT NULL, **FK** → workspaces(id) | — | 소속 워크스페이스 |
| title | `title` | VARCHAR(200) | NOT NULL | — | 제목 (1~200자) |
| description | `description` | TEXT | NULLABLE | NULL | 설명 (최대 1,000자) |
| type | `type` | VARCHAR(10) | NOT NULL | `'TASK'` | `GOAL` \| `STORY` \| `FEATURE` \| `TASK` |
| status | `status` | VARCHAR(20) | NOT NULL | `'BACKLOG'` | `BACKLOG` \| `TODO` \| `IN_PROGRESS` \| `DONE` |
| priority | `priority` | VARCHAR(10) | NOT NULL | `'MEDIUM'` | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| position | `position` | INT | NOT NULL | `0` | 칼럼 내 정렬 순서 (gap-based) |
| startDate | `start_date` | DATE | NULLABLE | NULL | 시작일 (YYYY-MM-DD) |
| dueDate | `due_date` | DATE | NULLABLE | NULL | 마감일 (YYYY-MM-DD) |
| issueId | `issue_id` | INT | NULLABLE, **FK** → issues(id) ON DELETE SET NULL | NULL | 상위 이슈 |
| assigneeId | `assignee_id` | INT | NULLABLE, **FK** → members(id) ON DELETE SET NULL | NULL | 담당자 |
| completedAt | `completed_at` | TIMESTAMPTZ | NULLABLE | NULL | 완료 시각 (DONE 전환 시 자동 설정) |
| createdAt | `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | 생성 시각 |
| updatedAt | `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | 수정 시각 ($onUpdate) |

**인덱스**:
- `idx_tickets_workspace_status_position` → (workspace_id, status, position)
- `idx_tickets_due_date` → (due_date)

---

## 6. checklist_items

티켓에 소속된 체크리스트 항목. 티켓 삭제 시 CASCADE로 함께 삭제된다.

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| id | `id` | SERIAL | **PK** | auto-increment | 고유 ID |
| ticketId | `ticket_id` | INT | NOT NULL, **FK** → tickets(id) ON DELETE CASCADE | — | 소속 티켓 |
| text | `text` | VARCHAR(200) | NOT NULL | — | 항목 내용 (1~200자) |
| isCompleted | `is_completed` | BOOLEAN | NOT NULL | `false` | 완료 여부 |
| position | `position` | INT | NOT NULL | `0` | 정렬 순서 |
| createdAt | `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | 생성 시각 |

**인덱스**: `idx_checklist_items_ticket_id` → (ticket_id)

**제한**: 티켓당 최대 20개 (앱 레벨 제어)

---

## 7. labels

워크스페이스 단위의 라벨 정의.

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| id | `id` | SERIAL | **PK** | auto-increment | 고유 ID |
| workspaceId | `workspace_id` | INT | NOT NULL, **FK** → workspaces(id) | — | 소속 워크스페이스 |
| name | `name` | VARCHAR(20) | NOT NULL | — | 라벨 이름 |
| color | `color` | VARCHAR(7) | NOT NULL | `'#3B82F6'` | 라벨 색상 (HEX) |
| createdAt | `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | 생성 시각 |

**유니크 제약**: `labels_workspace_name_unique` → (workspace_id, name)

**제한**: 워크스페이스당 최대 20개 (앱 레벨 제어)

---

## 8. ticket_labels

티켓과 라벨의 다대다(M:N) 매핑 테이블.

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| ticketId | `ticket_id` | INT | NOT NULL, **FK** → tickets(id) ON DELETE CASCADE | — | 티켓 |
| labelId | `label_id` | INT | NOT NULL, **FK** → labels(id) ON DELETE CASCADE | — | 라벨 |

**PK**: (ticket_id, label_id) — 복합 기본키

**제한**: 티켓당 최대 5개 라벨 (앱 레벨 제어)

---

---

## 9. notification_channels

워크스페이스별 알림 채널 설정 (Slack/Telegram). 채널 타입당 1개 (upsert).

| 칼럼 | DB 칼럼명 | 타입 | 제약 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| id | `id` | SERIAL | **PK** | auto-increment | 고유 ID |
| workspaceId | `workspace_id` | INT | NOT NULL, **FK** → workspaces(id) | — | 소속 워크스페이스 |
| type | `type` | VARCHAR(20) | NOT NULL | — | 채널 타입: `slack` \| `telegram` |
| config | `config` | JSONB | NOT NULL | — | 채널 설정 JSON (`webhookUrl` 또는 `botToken`+`chatId`) |
| enabled | `enabled` | BOOLEAN | NOT NULL | `false` | 활성화 여부 |
| createdAt | `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | 생성 시각 |
| updatedAt | `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | 수정 시각 |

**유니크 제약**: `notification_channels_workspace_type_unique` → (workspace_id, type)

---

## ER 다이어그램 (텍스트)

```
users ──1:N──> workspaces
  │                │
  │                ├──1:N──> issues (self-ref: parent_id)
  │                │           │
  │                ├──1:N──> members
  │                │           │
  │                ├──1:N──> tickets ──1:N──> checklist_items
  │                │           │
  │                │           ├── FK ──> issues (issue_id, ON DELETE SET NULL)
  │                │           ├── FK ──> members (assignee_id, ON DELETE SET NULL)
  │                │           └── M:N ──> labels (via ticket_labels)
  │                │
  │                ├──1:N──> labels
  │                │
  │                └──1:N──> notification_channels
  │
  └── FK ──> members (user_id)
```

---

## 마이그레이션 이력

| 파일 | 설명 |
|------|------|
| `0000_curvy_nocturne.sql` | 초기 스키마 (8개 테이블 전체 생성) |
| `0001_productive_iron_man.sql` | `start_date` 칼럼 추가 (tickets) |
| `0002_dry_raider.sql` | `description` 추가 (workspaces), `role` 추가 (members), `notification_channels` 테이블 신규 생성 |
