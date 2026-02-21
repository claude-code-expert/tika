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
  },
  (table) => [
    index('idx_tickets_status_position').on(table.status, table.position),
    index('idx_tickets_due_date').on(table.dueDate),
  ],
);
