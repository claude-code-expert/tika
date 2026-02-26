import { eq, and, asc, count, sql, ne } from 'drizzle-orm';
import { db } from '@/db/index';
import { tickets, checklistItems, ticketLabels, labels, members, issues } from '@/db/schema';
import type { Ticket, TicketWithMeta, BoardData, TicketStatus } from '@/types/index';
import { isOverdue } from '@/lib/utils';
import { POSITION_GAP } from '@/lib/constants';

function toTicket(row: typeof tickets.$inferSelect): Ticket {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    description: row.description ?? null,
    type: row.type as Ticket['type'],
    status: row.status as TicketStatus,
    priority: row.priority as Ticket['priority'],
    position: row.position,
    startDate: row.startDate ?? null,
    dueDate: row.dueDate ?? null,
    issueId: row.issueId ?? null,
    assigneeId: row.assigneeId ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getTicketCount(workspaceId: number): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.workspaceId, workspaceId));
  return Number(result.count);
}

export async function getBoardData(workspaceId: number): Promise<BoardData> {
  const [allTickets, allTicketLabels, allChecklistItems, allMembers, allIssues] = await Promise.all(
    [
      db
        .select()
        .from(tickets)
        .where(eq(tickets.workspaceId, workspaceId))
        .orderBy(asc(tickets.position)),
      db
        .select({ ticketId: ticketLabels.ticketId, label: labels })
        .from(ticketLabels)
        .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
        .where(eq(labels.workspaceId, workspaceId)),
      db
        .select()
        .from(checklistItems)
        .innerJoin(tickets, eq(checklistItems.ticketId, tickets.id))
        .where(eq(tickets.workspaceId, workspaceId))
        .orderBy(asc(checklistItems.position)),
      db.select().from(members).where(eq(members.workspaceId, workspaceId)),
      db.select().from(issues).where(eq(issues.workspaceId, workspaceId)),
    ],
  );

  const labelsByTicket = new Map<number, typeof labels.$inferSelect[]>();
  for (const row of allTicketLabels) {
    const arr = labelsByTicket.get(row.ticketId) ?? [];
    arr.push(row.label);
    labelsByTicket.set(row.ticketId, arr);
  }

  const checklistByTicket = new Map<number, (typeof checklistItems.$inferSelect)[]>();
  for (const row of allChecklistItems) {
    const arr = checklistByTicket.get(row.checklist_items.ticketId) ?? [];
    arr.push(row.checklist_items);
    checklistByTicket.set(row.checklist_items.ticketId, arr);
  }

  const membersById = new Map(allMembers.map((m) => [m.id, m]));
  const issuesById = new Map(allIssues.map((i) => [i.id, i]));

  const board: Record<TicketStatus, TicketWithMeta[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };

  let total = 0;
  for (const row of allTickets) {
    const ticket = toTicket(row);
    const ticketLabelsData = (labelsByTicket.get(row.id) ?? []).map((l) => ({
      id: l.id,
      workspaceId: l.workspaceId,
      name: l.name,
      color: l.color,
      createdAt: l.createdAt.toISOString(),
    }));
    const checklist = (checklistByTicket.get(row.id) ?? []).map((c) => ({
      id: c.id,
      ticketId: c.ticketId,
      text: c.text,
      isCompleted: c.isCompleted,
      position: c.position,
      createdAt: c.createdAt.toISOString(),
    }));

    const memberRow = row.assigneeId ? membersById.get(row.assigneeId) : null;
    const issueRow = row.issueId ? issuesById.get(row.issueId) : null;

    const meta: TicketWithMeta = {
      ...ticket,
      isOverdue: isOverdue(ticket.dueDate, ticket.status),
      labels: ticketLabelsData,
      checklistItems: checklist,
      assignee: memberRow
        ? {
            id: memberRow.id,
            userId: memberRow.userId,
            workspaceId: memberRow.workspaceId,
            displayName: memberRow.displayName,
            color: memberRow.color,
            role: memberRow.role as import('@/types/index').Member['role'],
            createdAt: memberRow.createdAt.toISOString(),
          }
        : null,
      issue: issueRow
        ? {
            id: issueRow.id,
            workspaceId: issueRow.workspaceId,
            name: issueRow.name,
            type: issueRow.type as import('@/types/index').IssueType,
            parentId: issueRow.parentId ?? null,
            createdAt: issueRow.createdAt.toISOString(),
          }
        : null,
    };

    const status = ticket.status as TicketStatus;
    if (status in board) {
      board[status].push(meta);
      total++;
    }
  }

  return { board, total };
}

export async function getTicketById(
  id: number,
  workspaceId: number,
): Promise<TicketWithMeta | null> {
  const [row] = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId)))
    .limit(1);
  if (!row) return null;

  const [checklist, ticketLabelRows, memberRow, issueRow] = await Promise.all([
    db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.ticketId, id))
      .orderBy(asc(checklistItems.position)),
    db
      .select({ label: labels })
      .from(ticketLabels)
      .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
      .where(eq(ticketLabels.ticketId, id)),
    row.assigneeId
      ? db.select().from(members).where(eq(members.id, row.assigneeId)).limit(1)
      : Promise.resolve([]),
    row.issueId
      ? db.select().from(issues).where(eq(issues.id, row.issueId)).limit(1)
      : Promise.resolve([]),
  ]);

  const ticket = toTicket(row);
  const mr = (memberRow as typeof members.$inferSelect[])[0];
  const ir = (issueRow as typeof issues.$inferSelect[])[0];

  return {
    ...ticket,
    isOverdue: isOverdue(ticket.dueDate, ticket.status),
    labels: ticketLabelRows.map((r) => ({
      id: r.label.id,
      workspaceId: r.label.workspaceId,
      name: r.label.name,
      color: r.label.color,
      createdAt: r.label.createdAt.toISOString(),
    })),
    checklistItems: checklist.map((c) => ({
      id: c.id,
      ticketId: c.ticketId,
      text: c.text,
      isCompleted: c.isCompleted,
      position: c.position,
      createdAt: c.createdAt.toISOString(),
    })),
    assignee: mr
      ? {
          id: mr.id,
          userId: mr.userId,
          workspaceId: mr.workspaceId,
          displayName: mr.displayName,
          color: mr.color,
          role: mr.role as import('@/types/index').Member['role'],
          createdAt: mr.createdAt.toISOString(),
        }
      : null,
    issue: ir
      ? {
          id: ir.id,
          workspaceId: ir.workspaceId,
          name: ir.name,
          type: ir.type as import('@/types/index').IssueType,
          parentId: ir.parentId ?? null,
          createdAt: ir.createdAt.toISOString(),
        }
      : null,
  };
}

export async function createTicket(
  workspaceId: number,
  data: {
    title: string;
    description?: string | null;
    type?: string;
    priority?: string;
    startDate?: string | null;
    dueDate?: string | null;
    issueId?: number | null;
    assigneeId?: number | null;
    labelIds?: number[];
  },
): Promise<Ticket> {
  // Position = min position in BACKLOG - 1024 (or 0 if empty)
  const [minRow] = await db
    .select({ minPos: sql<number>`MIN(${tickets.position})` })
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.status, 'BACKLOG')));

  const minPos = minRow?.minPos ?? null;
  const position = minPos !== null ? minPos - POSITION_GAP : 0;

  const [inserted] = await db
    .insert(tickets)
    .values({
      workspaceId,
      title: data.title,
      description: data.description ?? null,
      type: data.type ?? 'TASK',
      status: 'BACKLOG',
      priority: data.priority ?? 'MEDIUM',
      position,
      startDate: data.startDate ?? null,
      dueDate: data.dueDate ?? null,
      issueId: data.issueId ?? null,
      assigneeId: data.assigneeId ?? null,
    })
    .returning();

  if (data.labelIds && data.labelIds.length > 0) {
    await db.insert(ticketLabels).values(
      data.labelIds.map((labelId) => ({ ticketId: inserted.id, labelId })),
    );
  }

  return toTicket(inserted);
}

export async function updateTicket(
  id: number,
  workspaceId: number,
  data: Partial<{
    title: string;
    description: string | null;
    type: string;
    status: string;
    priority: string;
    startDate: string | null;
    dueDate: string | null;
    issueId: number | null;
    assigneeId: number | null;
    completedAt: Date | null;
    position: number;
    labelIds: number[];
  }>,
): Promise<Ticket | null> {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
  if (data.issueId !== undefined) updateData.issueId = data.issueId;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
  if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
  if (data.position !== undefined) updateData.position = data.position;

  if (Object.keys(updateData).length === 0 && data.labelIds === undefined) {
    return getTicketById(id, workspaceId).then((t) => t);
  }

  let updated: typeof tickets.$inferSelect | undefined;

  if (Object.keys(updateData).length > 0) {
    const [row] = await db
      .update(tickets)
      .set(updateData)
      .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId)))
      .returning();
    updated = row;
  }

  if (data.labelIds !== undefined) {
    await db.delete(ticketLabels).where(eq(ticketLabels.ticketId, id));
    if (data.labelIds.length > 0) {
      await db.insert(ticketLabels).values(
        data.labelIds.map((labelId) => ({ ticketId: id, labelId })),
      );
    }
  }

  if (updated) return toTicket(updated);
  const ticket = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId)))
    .limit(1);
  return ticket[0] ? toTicket(ticket[0]) : null;
}

export async function deleteTicket(id: number, workspaceId: number): Promise<boolean> {
  const result = await db
    .delete(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId)))
    .returning({ id: tickets.id });
  return result.length > 0;
}

export async function getTicketsDueTomorrow(workspaceId: number): Promise<Ticket[]> {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  const rows = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.workspaceId, workspaceId),
        eq(tickets.dueDate, tomorrowStr),
        ne(tickets.status, 'DONE'),
      ),
    );
  return rows.map(toTicket);
}
