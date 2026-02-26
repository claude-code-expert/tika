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
} from 'drizzle-orm/pg-core';

// 1. users — Google OAuth (NextAuth manages)
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Google OAuth sub
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 3. issues (defined before tickets for FK reference)
export const issues = pgTable(
  'issues',
  {
    id: serial('id').primaryKey(),
    workspaceId: integer('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 10 }).notNull(), // GOAL | STORY | FEATURE
    parentId: integer('parent_id'), // self-reference — set via alter later or handled at app level
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_issues_workspace_type').on(table.workspaceId, table.type),
    index('idx_issues_parent_id').on(table.parentId),
  ],
);

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
    role: varchar('role', { length: 10 }).notNull().default('member'), // 'admin' | 'member'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('members_user_workspace_unique').on(table.userId, table.workspaceId)],
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
    issueId: integer('issue_id').references(() => issues.id, { onDelete: 'set null' }),
    assigneeId: integer('assignee_id').references(() => members.id, { onDelete: 'set null' }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
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

// 10. notification_logs
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
