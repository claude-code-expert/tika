# Data Model: 워크스페이스 설정 페이지

**Feature**: 002-workspace-settings | **Date**: 2026-02-25

## 스키마 변경

### 1. workspaces 테이블 — description 컬럼 추가

```sql
ALTER TABLE workspaces ADD COLUMN description TEXT;
```

**Drizzle 스키마 변경:**
```typescript
export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().default('내 워크스페이스'),
  description: text('description'),                    // ← 신규
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### 2. members 테이블 — role 컬럼 추가

```sql
ALTER TABLE members ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'member';
-- 기존 소유자를 admin으로 업데이트
UPDATE members m
SET role = 'admin'
FROM workspaces w
WHERE m.workspace_id = w.id AND m.user_id = w.owner_id;
```

**Drizzle 스키마 변경:**
```typescript
export const members = pgTable(
  'members',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    workspaceId: integer('workspace_id').notNull().references(() => workspaces.id),
    role: varchar('role', { length: 10 }).notNull().default('member'), // ← 신규: 'admin' | 'member'
    displayName: varchar('display_name', { length: 50 }).notNull(),
    color: varchar('color', { length: 7 }).notNull().default('#7EB4A2'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('members_user_workspace_unique').on(table.userId, table.workspaceId)],
);
```

### 3. notification_channels 테이블 — 신규

```sql
CREATE TABLE notification_channels (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL,      -- 'slack' | 'telegram'
  config TEXT NOT NULL DEFAULT '{}',  -- JSON 문자열
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, type)
);
```

**Drizzle 스키마 정의:**
```typescript
export const notificationChannels = pgTable(
  'notification_channels',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 10 }).notNull(), // 'slack' | 'telegram'
    config: text('config').notNull().default('{}'),  // JSON string
    enabled: boolean('enabled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique('notification_channels_workspace_type_unique').on(table.workspaceId, table.type)],
);
```

**config JSON 구조:**
```typescript
// type === 'slack'
interface SlackConfig {
  webhookUrl: string;
}

// type === 'telegram'
interface TelegramConfig {
  botToken: string;
  chatId: string;
}
```

---

## TypeScript 타입 변경 (src/types/index.ts)

### 기존 타입 수정

```typescript
// Member: role 필드 추가
export const MEMBER_ROLE = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;
export type MemberRole = (typeof MEMBER_ROLE)[keyof typeof MEMBER_ROLE];

export interface Member {
  id: number;
  userId: string;
  workspaceId: number;
  role: MemberRole;           // ← 신규
  displayName: string;
  color: string;
  createdAt: string;
}

// Workspace: description 필드 추가
export interface Workspace {
  id: number;
  name: string;
  description: string | null; // ← 신규
  ownerId: string;
  createdAt: string;
}
```

### 신규 타입

```typescript
// 라벨 + 사용 티켓 수 (설정 페이지 전용)
export interface LabelWithCount extends Label {
  ticketCount: number;
}

// 멤버 + 이메일 (설정 페이지 전용)
export interface MemberWithEmail extends Member {
  email: string;
}

// 알림 채널
export const NOTIFICATION_CHANNEL_TYPE = {
  SLACK: 'slack',
  TELEGRAM: 'telegram',
} as const;
export type NotificationChannelType = (typeof NOTIFICATION_CHANNEL_TYPE)[keyof typeof NOTIFICATION_CHANNEL_TYPE];

export interface NotificationChannel {
  id: number;
  workspaceId: number;
  type: NotificationChannelType;
  config: SlackConfig | TelegramConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SlackConfig {
  webhookUrl: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}
```

---

## 엔티티 관계

```
workspaces (1) ──────────── (N) notification_channels
     │                              UNIQUE(workspace_id, type)
     │
     └──── (N) members ──── UNIQUE(user_id, workspace_id)
                 │
                 └── role: 'admin' | 'member'

labels ──────────── (N) ticket_labels (M:N) ──── tickets
  │                                                │
  └── getLabelsByWorkspaceWithCount               COUNT(ticket_labels)
```

---

## 쿼리 인터페이스

### src/db/queries/workspaces.ts (신규 파일)

```typescript
getWorkspaceById(id: number): Promise<Workspace | null>
updateWorkspace(id: number, data: { name?: string; description?: string }): Promise<Workspace | null>
```

### src/db/queries/labels.ts (기존 파일 — 함수 추가)

```typescript
// 기존 함수 유지
// 추가:
getLabelsByWorkspaceWithCount(workspaceId: number): Promise<LabelWithCount[]>
```

### src/db/queries/members.ts (기존 파일 — 함수 추가/수정)

```typescript
// 기존 함수: getMembersByWorkspace → MemberWithEmail[] 반환으로 변경 (users JOIN 추가)
getMembersByWorkspace(workspaceId: number): Promise<MemberWithEmail[]>

// 추가:
updateMemberRole(id: number, workspaceId: number, role: MemberRole): Promise<Member | null>
removeMember(id: number, workspaceId: number): Promise<boolean>
getAdminCount(workspaceId: number): Promise<number>
```

### src/db/queries/notificationChannels.ts (신규 파일)

```typescript
getNotificationChannels(workspaceId: number): Promise<NotificationChannel[]>
upsertNotificationChannel(
  workspaceId: number,
  type: NotificationChannelType,
  data: { config: SlackConfig | TelegramConfig; enabled: boolean }
): Promise<NotificationChannel>
```

---

## 유효성 검증 스키마 (src/lib/validations.ts 추가)

```typescript
// 워크스페이스 업데이트
export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
}).refine(data => data.name !== undefined || data.description !== undefined);

// 알림 채널 upsert
const slackConfigSchema = z.object({
  webhookUrl: z.string().url().startsWith('https://hooks.slack.com/'),
});
const telegramConfigSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().min(1),
});
export const upsertNotificationChannelSchema = z.object({
  type: z.enum(['slack', 'telegram']),
  config: z.union([slackConfigSchema, telegramConfigSchema]),
  enabled: z.boolean(),
});

// 멤버 역할 변경
export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});
```
