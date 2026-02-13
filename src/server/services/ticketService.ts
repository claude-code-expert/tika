import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import { eq, min } from 'drizzle-orm';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  type CreateTicketInput,
  type Ticket,
  type TicketStatus,
} from '@/shared/types';

// Type conversion from database to domain
type DbTicket = typeof tickets.$inferSelect;

function toTicket(row: DbTicket): Ticket {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TicketStatus,
    priority: row.priority as Ticket['priority'],
    position: row.position,
    plannedStartDate: row.plannedStartDate,
    dueDate: row.dueDate,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const ticketService = {
  /**
   * FR-001: Create a new ticket in BACKLOG column
   */
  async create(input: CreateTicketInput): Promise<Ticket> {
    // Calculate position for BACKLOG column (new tickets at top)
    const position = await this.calculatePosition(TICKET_STATUS.BACKLOG);

    // Insert ticket with defaults
    const [row] = await db
      .insert(tickets)
      .values({
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? TICKET_PRIORITY.MEDIUM,
        plannedStartDate: input.plannedStartDate ?? null,
        dueDate: input.dueDate ?? null,
        status: TICKET_STATUS.BACKLOG,
        position,
        startedAt: null,
        completedAt: null,
      })
      .returning();

    return toTicket(row);
  },

  /**
   * Calculate position for new ticket in a column
   * Places new ticket at the top: min(position) - 1024
   */
  async calculatePosition(status: TicketStatus): Promise<number> {
    const result = await db
      .select({ minPosition: min(tickets.position) })
      .from(tickets)
      .where(eq(tickets.status, status));

    const minPosition = result[0]?.minPosition;

    // Empty column: start at 0
    // Non-empty: place above topmost ticket
    return minPosition !== null ? minPosition - 1024 : 0;
  },
};
