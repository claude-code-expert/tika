import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
  primaryKey,
  index,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// 1. users — Google OAuth (NextAuth manages)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Google OAuth sub
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  userType: varchar('user_type', { length: 20 }), // NULL = onboarding incomplete | 'USER' = personal | 'WORKSPACE' = team
  bgcolor: varchar('bg_color', { length: 7 }), // user-chosen avatar background color (HEX)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 2. workspaces
export const workspaces = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().default('내 워크스페이스'),
  description: text('description'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  type: varchar('type', { length: 10 }).notNull().default('PERSONAL'), // 'PERSONAL' | 'TEAM'
  isSearchable: boolean('is_searchable').notNull().default(false), // false = private, true = visible in search
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});


// 4. members (defined before tickets for FK reference)
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
    role: varchar('role', { length: 10 }).notNull().default('MEMBER'), // 'OWNER' | 'MEMBER' | 'VIEWER'
    invitedBy: integer('invited_by'), // FK→members(id) — self-ref, set at app level
    joinedAt: timestamp('joined_at', { withTimezone: true }), // null = workspace founder
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('members_user_workspace_unique').on(table.userId, table.workspaceId)],
);

// 12. sprints (defined before tickets for FK reference)
export const sprints = pgTable(
  'sprints',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    goal: text('goal'),
    status: varchar('status', { length: 20 }).notNull().default('PLANNED'), // PLANNED|ACTIVE|COMPLETED|CANCELLED
    startDate: date('start_date', { mode: 'string' }),
    endDate: date('end_date', { mode: 'string' }),
    storyPointsTotal: integer('story_points_total'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_sprints_workspace_status').on(table.workspaceId, table.status)],
);

// 5. tickets
export const tickets = pgTable(
  'tickets',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 10 }).notNull().default('TASK'), // GOAL|STORY|FEATURE|TASK
    status: varchar('status', { length: 20 }).notNull().default('BACKLOG'),
    priority: varchar('priority', { length: 10 }).notNull().default('MEDIUM'),
    position: integer('position').notNull().default(0),
    startDate: date('start_date', { mode: 'string' }),
    dueDate: date('due_date', { mode: 'string' }),
    plannedStartDate: date('planned_start_date', { mode: 'string' }),
    plannedEndDate: date('planned_end_date', { mode: 'string' }),
    parentId: integer('parent_id'), // self-reference — handled at app level
    assigneeId: integer('assignee_id').references(() => members.id, { onDelete: 'set null' }),
    sprintId: integer('sprint_id').references(() => sprints.id, { onDelete: 'set null' }),
    storyPoints: integer('story_points'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    deleted: boolean('deleted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_tickets_workspace_status_position').on(
      table.workspaceId,
      table.status,
      table.position,
    ),
    index('idx_tickets_due_date').on(table.dueDate),
    index('idx_tickets_sprint_id').on(table.sprintId),
    index('idx_tickets_assignee_id').on(table.assigneeId),
    index('idx_tickets_parent_id').on(table.parentId),
    index('idx_tickets_workspace_deleted').on(table.workspaceId, table.deleted),
  ],
);

// 6. checklist_items
export const checklistItems = pgTable(
  'checklist_items',
  {
    id: serial('id').primaryKey(),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    text: varchar('text', { length: 200 }).notNull(),
    isCompleted: boolean('is_completed').notNull().default(false),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_checklist_items_ticket_id').on(table.ticketId)],
);

// 7. labels
export const labels = pgTable(
  'labels',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    name: varchar('name', { length: 20 }).notNull(),
    color: varchar('color', { length: 7 }).notNull().default('#3B82F6'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('labels_workspace_name_unique').on(table.workspaceId, table.name)],
);

// 9. notification_channels
export const notificationChannels = pgTable(
  'notification_channels',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    type: varchar('type', { length: 20 }).notNull(), // 'slack' | 'telegram'
    config: text('config').notNull().default('{}'), // JSON string
    enabled: boolean('enabled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('notification_channels_workspace_type_unique').on(table.workspaceId, table.type),
  ],
);

// 10. comments
export const comments = pgTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    memberId: integer('member_id').references(() => members.id, { onDelete: 'set null' }),
    text: varchar('text', { length: 500 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_comments_ticket_id').on(table.ticketId),
    index('idx_comments_member_id').on(table.memberId),
  ],
);

// 11. notification_logs
export const notificationLogs = pgTable(
  'notification_logs',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    ticketId: integer('ticket_id').references(() => tickets.id, { onDelete: 'set null' }),
    channel: varchar('channel', { length: 20 }).notNull(), // 'slack' | 'telegram'
    message: text('message').notNull(),
    status: varchar('status', { length: 10 }).notNull(), // 'SENT' | 'FAILED'
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    errorMessage: text('error_message'),
    isRead: boolean('is_read').notNull().default(false),
  },
  (table) => [
    index('idx_notification_logs_workspace_id').on(table.workspaceId),
    index('idx_notification_logs_sent_at').on(table.sentAt),
  ],
);

// 8. ticket_labels (M:N)
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
  (table) => [primaryKey({ columns: [table.ticketId, table.labelId] })],
);

// 13. workspace_invites
export const workspaceInvites = pgTable(
  'workspace_invites',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    invitedBy: integer('invited_by')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    token: uuid('token').notNull().unique().defaultRandom(),
    email: varchar('email', { length: 255 }),
    role: varchar('role', { length: 10 }).notNull(), // 'MEMBER' | 'VIEWER'
    status: varchar('status', { length: 10 }).notNull().default('PENDING'), // PENDING|ACCEPTED|REJECTED|EXPIRED
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_workspace_invites_workspace_status').on(table.workspaceId, table.status),
    index('idx_workspace_invites_token').on(table.token),
  ],
);

// 14. ticket_assignees (M:N — multi-assignee)
export const ticketAssignees = pgTable(
  'ticket_assignees',
  {
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    memberId: integer('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.ticketId, table.memberId] }),
    index('idx_ticket_assignees_member_id').on(table.memberId),
  ],
);

// 15. workspace_join_requests — join request from user to workspace (onboarding flow)
export const workspaceJoinRequests = pgTable(
  'workspace_join_requests',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    message: text('message'),
    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // 'PENDING' | 'APPROVED' | 'REJECTED'
    reviewedBy: integer('reviewed_by').references(() => members.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('join_requests_workspace_user_unique').on(table.workspaceId, table.userId),
    index('idx_join_requests_workspace_status').on(table.workspaceId, table.status),
  ],
);
