# Tika — In-App 알림 시스템 설계 문서

> **작성일**: 2026-03-10
> **상태**: 설계 (구현 전)
> **범위**: Phase 1 — In-App 알림 / Phase 2 — 개인별 Slack·Telegram 연동

---

## 1. 현재 시스템 분석

### 1-1. 기존 테이블

| 테이블 | 용도 | 한계 |
|--------|------|------|
| `notification_channels` | 워크스페이스별 Slack/Telegram 채널 설정 | **워크스페이스 단위** — 개인별 설정 불가 |
| `notification_logs` | 외부 채널 발송 이력 | **userId 없음** — 읽음 상태가 워크스페이스 전체 공유 |

### 1-2. 기존 트리거

| 트리거 | 방식 | 한계 |
|--------|------|------|
| D-1 마감일 리마인더 | Vercel Cron (`/api/cron/notify-due`) | **유일한 트리거** — 이벤트 기반 알림 없음 |

### 1-3. 기존 UI

| UI | 위치 | 한계 |
|----|------|------|
| 벨 아이콘 + 드롭다운 | `Header.tsx` | 외부 채널 발송 로그만 표시, 사실상 in-app 알림이 아님 |
| 알림 내역 페이지 | `/notifications` | Slack/Telegram 발송 이력 조회 전용 |

---

## 2. 설계 목표

1. **이벤트 기반 In-App 알림** — 사용자 액션 시 실시간으로 관련 사용자에게 알림 생성
2. **개인별 알림 설정** — 사용자가 알림 유형별 on/off 제어 가능
3. **개인별 읽음 상태** — 각 사용자마다 독립적인 읽음/안읽음 관리
4. **자기 자신 필터링** — 본인이 수행한 액션에 대해서는 알림 생성 안 함
5. **확장성** — Phase 2에서 개인별 Slack/Telegram 연동을 추가할 수 있는 구조

---

## 3. 알림 유형 (Notification Types)

### 3-1. 사용자 요청 필수 알림 (8종)

| # | 유형 코드 | 설명 | 수신 대상 | 트리거 시점 |
|---|-----------|------|-----------|-------------|
| 1 | `TICKET_STATUS_CHANGED` | 내 티켓의 상태가 다른 사람에 의해 변경됨 | 티켓 담당자(assignees) | 칸반 보드 드래그 또는 상태 변경 API 호출 시 |
| 2 | `TICKET_COMMENTED` | 내 티켓에 댓글이 달림 | 티켓 담당자 + 이전 댓글 작성자 (댓글 작성자 본인 제외) | 댓글 생성 API 호출 시 |
| 3 | `DEADLINE_WARNING` | 마감 D-1일 경고 | 티켓 담당자 | Cron (매일 09:00 KST) |
| 4 | `INVITE_RECEIVED` | 워크스페이스 초대를 받음 | 초대 대상 사용자 | 초대 생성 시 |
| 5 | `ROLE_CHANGED` | 내 워크스페이스 역할이 변경됨 | 역할 변경 대상 멤버 | 역할 변경 API 호출 시 |
| 6 | `MEMBER_JOINED` | 초대한 멤버가 워크스페이스에 참여함 | 초대한 멤버 (invitedBy) + OWNER들 | 초대 수락 시 |
| 7 | `JOIN_REQUEST_RECEIVED` | 워크스페이스에 참여 신청이 들어옴 | OWNER 역할 멤버 전원 | 참여 신청 API 호출 시 |
| 8 | `JOIN_REQUEST_RESOLVED` | 내 참여 신청이 승인/거절됨 | 신청자 | 신청 승인/거절 API 호출 시 |

### 3-2. 추가 권장 알림 (6종)

| # | 유형 코드 | 설명 | 수신 대상 | 트리거 시점 |
|---|-----------|------|-----------|-------------|
| 9 | `TICKET_ASSIGNED` | 나에게 티켓이 배정됨 | 새로 배정된 담당자 | 담당자 변경 API 호출 시 |
| 10 | `TICKET_UNASSIGNED` | 내 티켓 배정이 해제됨 | 해제된 담당자 | 담당자 변경 API 호출 시 |
| 11 | `TICKET_DELETED` | 내 티켓이 삭제(논리 삭제)됨 | 티켓 담당자 | 티켓 삭제 API 호출 시 |
| 12 | `SPRINT_STARTED` | 스프린트가 활성화됨 | 스프린트 내 티켓 담당자 전원 | 스프린트 활성화 API 호출 시 |
| 13 | `SPRINT_COMPLETED` | 스프린트가 완료됨 | 스프린트 내 티켓 담당자 전원 | 스프린트 완료 API 호출 시 |
| 14 | `MEMBER_REMOVED` | 워크스페이스에서 제거됨 | 제거된 멤버 | 멤버 제거 API 호출 시 |

### 3-3. 알림 유형 카테고리

```
TICKET     — TICKET_STATUS_CHANGED, TICKET_COMMENTED, TICKET_ASSIGNED,
             TICKET_UNASSIGNED, TICKET_DELETED
DEADLINE   — DEADLINE_WARNING
WORKSPACE  — INVITE_RECEIVED, ROLE_CHANGED, MEMBER_JOINED,
             JOIN_REQUEST_RECEIVED, JOIN_REQUEST_RESOLVED, MEMBER_REMOVED
SPRINT     — SPRINT_STARTED, SPRINT_COMPLETED
```

---

## 4. 데이터베이스 설계

### 4-1. 신규 테이블: `in_app_notifications`

> 개별 사용자에게 전달되는 In-App 알림 레코드

```sql
CREATE TABLE in_app_notifications (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id  INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  type          VARCHAR(30) NOT NULL,         -- 알림 유형 코드 (e.g. 'TICKET_STATUS_CHANGED')
  title         VARCHAR(200) NOT NULL,        -- 알림 제목 (e.g. "티켓 상태 변경")
  message       TEXT NOT NULL,                -- 알림 본문 (e.g. "'로그인 버그 수정'이 TODO → In Progress로 변경되었습니다")
  link          TEXT,                         -- 클릭 시 이동 경로 (e.g. "/workspace/3/42")
  actor_id      TEXT REFERENCES users(id) ON DELETE SET NULL,  -- 액션 수행자 (자기 자신 필터링용)
  ref_type      VARCHAR(20),                  -- 참조 엔티티 타입 ('ticket', 'sprint', 'member', 'invite')
  ref_id        INTEGER,                      -- 참조 엔티티 ID
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_in_app_notifications_user_read ON in_app_notifications(user_id, is_read);
CREATE INDEX idx_in_app_notifications_user_created ON in_app_notifications(user_id, created_at DESC);
CREATE INDEX idx_in_app_notifications_workspace ON in_app_notifications(workspace_id);
```

#### Drizzle 스키마

```typescript
export const inAppNotifications = pgTable(
  'in_app_notifications',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: integer('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 30 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    link: text('link'),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    refType: varchar('ref_type', { length: 20 }),
    refId: integer('ref_id'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_in_app_notifications_user_read').on(table.userId, table.isRead),
    index('idx_in_app_notifications_user_created').on(table.userId, table.createdAt),
    index('idx_in_app_notifications_workspace').on(table.workspaceId),
  ],
);
```

### 4-2. 신규 테이블: `notification_preferences`

> 사용자별 알림 유형 on/off 설정 (워크스페이스 단위)

```sql
CREATE TABLE notification_preferences (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id    INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL,       -- 알림 유형 코드
  in_app_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  slack_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  telegram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, workspace_id, type)
);

CREATE INDEX idx_notification_preferences_user_workspace
  ON notification_preferences(user_id, workspace_id);
```

#### Drizzle 스키마

```typescript
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 30 }).notNull(),
    inAppEnabled: boolean('in_app_enabled').notNull().default(true),
    slackEnabled: boolean('slack_enabled').notNull().default(false),
    telegramEnabled: boolean('telegram_enabled').notNull().default(false),
  },
  (table) => [
    unique('notification_preferences_user_ws_type').on(table.userId, table.workspaceId, table.type),
    index('idx_notification_preferences_user_workspace').on(table.userId, table.workspaceId),
  ],
);
```

#### 기본값 전략

- 레코드가 없으면 **기본 활성화(in_app_enabled = true)** 로 처리
- 사용자가 명시적으로 끈 경우에만 레코드 생성 (lazy creation)
- 이렇게 하면 대부분의 사용자에게 별도 레코드가 불필요

### 4-3. 신규 테이블: `user_notification_channels`

> 개인별 Slack/Telegram 연동 설정 (Phase 2)

```sql
CREATE TABLE user_notification_channels (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL,           -- 'slack' | 'telegram'
  config      TEXT NOT NULL DEFAULT '{}',     -- JSON: { webhookUrl } 또는 { botToken, chatId }
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type)
);
```

#### Drizzle 스키마

```typescript
export const userNotificationChannels = pgTable(
  'user_notification_channels',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 20 }).notNull(),
    config: text('config').notNull().default('{}'),
    enabled: boolean('enabled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    unique('user_notification_channels_user_type').on(table.userId, table.type),
  ],
);
```

### 4-4. 기존 테이블 변경

| 테이블 | 변경 | 설명 |
|--------|------|------|
| `notification_channels` | **변경 없음** | 워크스페이스 전체 Slack/Telegram은 유지 (공지 등) |
| `notification_logs` | **변경 없음** | 외부 채널 발송 이력 용도 유지 |

---

## 5. API 설계

### 5-1. In-App 알림 조회/관리

| Method | Endpoint | 설명 | 응답 |
|--------|----------|------|------|
| `GET` | `/api/notifications/in-app` | 내 In-App 알림 목록 (페이지네이션) | `{ notifications, total, hasMore }` |
| `GET` | `/api/notifications/in-app/unread-count` | 미읽음 알림 수 | `{ count }` |
| `PATCH` | `/api/notifications/in-app/:id/read` | 단일 알림 읽음 처리 | `{ notification }` |
| `PATCH` | `/api/notifications/in-app/read-all` | 전체 읽음 처리 | `{ updatedCount }` |

#### 쿼리 파라미터 (`GET /in-app`)

```
?page=1&limit=20&workspaceId=3&unreadOnly=true
```

### 5-2. 알림 설정

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/notifications/preferences?workspaceId=3` | 워크스페이스별 내 알림 설정 조회 |
| `PUT` | `/api/notifications/preferences` | 알림 설정 변경 (upsert) |

#### PUT 요청 바디

```json
{
  "workspaceId": 3,
  "type": "TICKET_COMMENTED",
  "inAppEnabled": true,
  "slackEnabled": false,
  "telegramEnabled": false
}
```

### 5-3. 개인 채널 설정 (Phase 2)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/notifications/channels/me` | 내 Slack/Telegram 설정 조회 |
| `PUT` | `/api/notifications/channels/me/slack` | 내 Slack Webhook 설정 |
| `PUT` | `/api/notifications/channels/me/telegram` | 내 Telegram 설정 |
| `POST` | `/api/notifications/channels/me/slack/test` | 내 Slack 테스트 발송 |
| `POST` | `/api/notifications/channels/me/telegram/test` | 내 Telegram 테스트 발송 |

---

## 6. 알림 생성 플로우

### 6-1. 아키텍처

```
[API Route Handler]
  ↓ 비즈니스 로직 처리 완료 후
  ↓
[createNotification()] ← 헬퍼 함수
  ↓
  ├─ 1. 수신 대상 결정 (assignees, owners 등)
  ├─ 2. 액터(자기 자신) 필터링
  ├─ 3. notification_preferences 확인 (활성화된 사용자만)
  ├─ 4. in_app_notifications INSERT (활성화된 사용자별 1건씩)
  └─ 5. (Phase 2) Slack/Telegram 개인 채널 발송
```

### 6-2. 핵심 헬퍼 함수

```typescript
// src/db/queries/notifications.ts

interface CreateNotificationParams {
  workspaceId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actorId: string;            // 액션 수행자 (자기 자신 제외용)
  recipientUserIds: string[]; // 수신 대상 user_id 배열
  refType?: 'ticket' | 'sprint' | 'member' | 'invite';
  refId?: number;
}

async function createInAppNotifications(params: CreateNotificationParams): Promise<void> {
  // 1. actorId를 recipients에서 제외
  // 2. notification_preferences 조회 → in_app_enabled = false인 사용자 제외
  // 3. 필터링된 recipients에 대해 in_app_notifications bulk insert
}
```

### 6-3. 트리거 포인트 (기존 API Route에 추가)

| 트리거 위치 | 알림 유형 | 수신 대상 결정 로직 |
|-------------|-----------|---------------------|
| `PATCH /api/tickets/:id` (status 변경) | `TICKET_STATUS_CHANGED` | `ticket_assignees`에서 memberId → userId 조회 |
| `POST /api/tickets/:id/comments` | `TICKET_COMMENTED` | assignees + 기존 댓글 작성자 (중복 제거) |
| `PATCH /api/tickets/:id` (assignee 변경) | `TICKET_ASSIGNED` / `TICKET_UNASSIGNED` | 추가/제거된 담당자 |
| `DELETE /api/tickets/:id` (논리 삭제) | `TICKET_DELETED` | assignees |
| `POST /api/workspaces/:id/invites` | `INVITE_RECEIVED` | 초대 대상 email → users.id 매칭 |
| `POST /api/invite/:token/accept` | `MEMBER_JOINED` | invitedBy member → userId + OWNER들 |
| `PATCH /api/members/:id` (role 변경) | `ROLE_CHANGED` | 대상 멤버 |
| `DELETE /api/members/:id` | `MEMBER_REMOVED` | 제거된 멤버 |
| `POST /api/workspaces/:id/join-requests` | `JOIN_REQUEST_RECEIVED` | OWNER 역할 멤버 전원 |
| `PATCH /api/join-requests/:id` (approve/reject) | `JOIN_REQUEST_RESOLVED` | 신청자 |
| `POST /api/workspaces/:id/sprints/:sid/activate` | `SPRINT_STARTED` | 스프린트 내 티켓 담당자 전원 |
| `POST /api/workspaces/:id/sprints/:sid/complete` | `SPRINT_COMPLETED` | 스프린트 내 티켓 담당자 전원 |
| Cron `/api/cron/notify-due` | `DEADLINE_WARNING` | 해당 티켓 담당자 |

---

## 7. UI 설계

### 7-1. 헤더 알림 벨 (기존 수정)

```
현재: notification_logs 기반 → 변경: in_app_notifications 기반

[벨 아이콘] + [미읽음 수 뱃지]
  클릭 → 드롭다운
    ├─ 알림 항목 (최근 10건)
    │   ├─ 아이콘 (유형별)
    │   ├─ 메시지 본문
    │   ├─ 시간 (상대 시간: "3분 전")
    │   └─ 클릭 → link로 이동 + 읽음 처리
    ├─ "모두 읽음 처리" 버튼
    └─ "전체 보기" → /notifications 페이지 이동
```

### 7-2. 알림 내역 페이지 (기존 수정)

```
/notifications 페이지

탭: [In-App 알림] | [외부 채널 이력]

In-App 알림 탭:
  ├─ 필터: 전체 | 미읽음 | 워크스페이스 선택
  ├─ 알림 목록 (무한 스크롤 또는 페이지네이션)
  │   └─ 각 항목: 아이콘 + 제목 + 메시지 + 시간 + 읽음 상태
  └─ "전체 읽음 처리" 버튼

외부 채널 이력 탭:
  └─ (기존 NotificationsPage.tsx 유지)
```

### 7-3. 알림 설정 UI (신규)

```
/settings → "알림" 탭 내 추가 섹션

┌─────────────────────────────────────────────┐
│ In-App 알림 설정                              │
│                                               │
│ 티켓 알림                                      │
│   ☑ 티켓 상태 변경 알림                         │
│   ☑ 댓글 알림                                  │
│   ☑ 담당자 배정 알림                            │
│   ☑ 티켓 삭제 알림                              │
│                                               │
│ 마감일 알림                                     │
│   ☑ D-1 마감일 경고                             │
│                                               │
│ 워크스페이스 알림                                │
│   ☑ 초대 알림                                  │
│   ☑ 역할 변경 알림                              │
│   ☑ 멤버 참여 알림                              │
│   ☑ 참여 신청 알림                              │
│                                               │
│ 스프린트 알림                                   │
│   ☑ 스프린트 시작/완료 알림                      │
└─────────────────────────────────────────────┘
```

### 7-4. 개인 채널 설정 UI (Phase 2)

```
프로필 모달 → "알림 채널" 섹션 또는 별도 페이지

┌─────────────────────────────────────────────┐
│ 개인 알림 채널                                 │
│                                               │
│ Slack                                         │
│   Webhook URL: [________________] [테스트]     │
│   [☐ 활성화]                                   │
│                                               │
│ Telegram                                      │
│   Bot Token: [________________]               │
│   Chat ID:   [________________] [테스트]       │
│   [☐ 활성화]                                   │
└─────────────────────────────────────────────┘
```

---

## 8. 알림 메시지 템플릿

| 유형 | title | message (예시) |
|------|-------|----------------|
| `TICKET_STATUS_CHANGED` | 티켓 상태 변경 | `홍길동님이 '로그인 버그 수정'을 TODO → In Progress로 변경했습니다` |
| `TICKET_COMMENTED` | 새 댓글 | `홍길동님이 '로그인 버그 수정'에 댓글을 남겼습니다: "확인했습니다"` |
| `TICKET_ASSIGNED` | 티켓 배정 | `홍길동님이 '로그인 버그 수정' 티켓을 배정했습니다` |
| `TICKET_UNASSIGNED` | 티켓 배정 해제 | `홍길동님이 '로그인 버그 수정' 티켓 배정을 해제했습니다` |
| `TICKET_DELETED` | 티켓 삭제 | `홍길동님이 '로그인 버그 수정' 티켓을 삭제했습니다` |
| `DEADLINE_WARNING` | 마감일 임박 | `'로그인 버그 수정' 티켓의 마감일이 내일(2026-03-11)입니다` |
| `INVITE_RECEIVED` | 워크스페이스 초대 | `홍길동님이 'Tika 팀' 워크스페이스에 초대했습니다` |
| `ROLE_CHANGED` | 역할 변경 | `'Tika 팀' 워크스페이스에서 역할이 MEMBER → OWNER로 변경되었습니다` |
| `MEMBER_JOINED` | 멤버 참여 | `김철수님이 'Tika 팀' 워크스페이스에 참여했습니다` |
| `JOIN_REQUEST_RECEIVED` | 참여 신청 | `김철수님이 'Tika 팀' 워크스페이스에 참여를 신청했습니다` |
| `JOIN_REQUEST_RESOLVED` | 참여 신청 결과 | `'Tika 팀' 워크스페이스 참여 신청이 승인되었습니다` |
| `SPRINT_STARTED` | 스프린트 시작 | `'Sprint 5' 스프린트가 시작되었습니다` |
| `SPRINT_COMPLETED` | 스프린트 완료 | `'Sprint 5' 스프린트가 완료되었습니다` |
| `MEMBER_REMOVED` | 워크스페이스 제거 | `'Tika 팀' 워크스페이스에서 제거되었습니다` |

---

## 9. 데이터 보관 및 정리

### 9-1. 알림 보관 정책

| 항목 | 정책 |
|------|------|
| 보관 기간 | **7일** (이후 자동 삭제) |
| 최대 미읽음 수 | 표시 제한 99+ (100개 이상이면 "99+"로 표시) |
| 정리 방식 | GitHub Actions Cron (매일 KST 09:00) — `GET /api/cron/cleanup-notifications` |
| 정리 로직 | `deleteOldInAppNotifications(7)` → `DELETE FROM in_app_notifications WHERE created_at < NOW() - INTERVAL '7 days'` |
| Cron 설정 | `.github/workflows/daily-notify.yml` — D-1 마감 알림 발송 후 cleanup 순서로 실행 |
| 인증 | `Authorization: Bearer $CRON_SECRET` (GitHub Secrets에 `APP_URL`, `CRON_SECRET` 필요) |

### 9-2. 성능 고려사항

- **인덱스**: `(user_id, is_read)`, `(user_id, created_at DESC)` — 미읽음 수 집계와 최신순 조회 최적화
- **Bulk Insert**: 한 이벤트에 다수 수신자가 있을 때 `VALUES (...), (...), ...` 로 한 번에 삽입
- **자기 자신 제외**: INSERT 전에 필터링하여 불필요한 레코드 생성 방지
- **Preference 캐싱**: lazy creation이므로 레코드 없으면 기본 활성화 — 추가 쿼리 불필요

---

## 10. 기존 시스템과의 관계

```
┌──────────────────────────────────────────────────┐
│                   알림 시스템 전체 구조               │
│                                                    │
│  [In-App 알림 (Phase 1)]                            │
│    ├─ in_app_notifications      — 개인별 알림 레코드  │
│    ├─ notification_preferences  — 개인별 on/off      │
│    └─ UI: Header 벨 + /notifications 페이지          │
│                                                    │
│  [워크스페이스 외부 채널 (기존)]                       │
│    ├─ notification_channels     — 워크스페이스별 설정  │
│    ├─ notification_logs         — 발송 이력           │
│    └─ D-1 Cron                                      │
│                                                    │
│  [개인 외부 채널 (Phase 2)]                           │
│    ├─ user_notification_channels — 개인별 설정        │
│    └─ notification_preferences   — 채널별 on/off     │
└──────────────────────────────────────────────────┘
```

- **기존 워크스페이스 채널**: 유지. 공지/전체 알림 용도로 계속 사용
- **기존 notification_logs**: 유지. 외부 채널 발송 이력용
- **기존 D-1 Cron**: 확장 — in_app_notifications에도 레코드 생성하도록 추가
- **Header 벨 아이콘**: `notification_logs` 기반 → `in_app_notifications` 기반으로 전환

---

## 11. 구현 순서 (권장)

### Phase 1: In-App 알림 (우선)

```
1. DB 테이블 생성
   - in_app_notifications
   - notification_preferences

2. 쿼리 레이어 (src/db/queries/in-app-notifications.ts)
   - createInAppNotifications()
   - getInAppNotifications()
   - getUnreadCount()
   - markAsRead()
   - markAllAsRead()

3. 알림 헬퍼 (src/lib/notifications.ts)
   - createNotification() — 수신 대상 결정 + preference 체크 + bulk insert
   - 알림 메시지 생성 유틸리티

4. API Routes
   - GET /api/notifications/in-app
   - GET /api/notifications/in-app/unread-count
   - PATCH /api/notifications/in-app/:id/read
   - PATCH /api/notifications/in-app/read-all
   - GET/PUT /api/notifications/preferences

5. 기존 API Route 수정 (트리거 추가)
   - 우선순위: 티켓 상태 변경 → 댓글 → 담당자 변경 → 나머지

6. UI 수정
   - Header 벨: in_app_notifications 기반으로 전환
   - /notifications 페이지: In-App 탭 추가
   - /settings: 알림 설정 섹션 추가

7. D-1 Cron 확장
   - 기존 외부 채널 + in_app_notifications 동시 생성
```

### Phase 2: 개인 Slack/Telegram

```
1. DB 테이블 생성
   - user_notification_channels

2. API Routes
   - GET/PUT /api/notifications/channels/me/slack
   - GET/PUT /api/notifications/channels/me/telegram
   - POST /api/notifications/channels/me/slack/test
   - POST /api/notifications/channels/me/telegram/test

3. 알림 헬퍼 확장
   - createNotification() 내에서 개인 채널 발송 로직 추가

4. UI
   - 프로필 또는 설정 페이지에 개인 채널 설정 섹션 추가
```

---

## 12. 마이그레이션 영향

| 항목 | 영향 |
|------|------|
| `src/db/schema.ts` | 3개 테이블 추가 (`inAppNotifications`, `notificationPreferences`, `userNotificationChannels`) |
| `migrations/` | `npm run db:generate` → 마이그레이션 파일 자동 생성 |
| 기존 API | 각 API Route에 알림 생성 로직 추가 (기존 로직 변경 없이 후처리 추가) |
| Header.tsx | 알림 데이터 소스 변경 (`notification_logs` → `in_app_notifications`) |
| NotificationsPage.tsx | In-App 탭 추가, 기존 외부 채널 이력 탭 유지 |
| SettingsShell.tsx | 알림 설정에 개인 알림 preference UI 추가 |
