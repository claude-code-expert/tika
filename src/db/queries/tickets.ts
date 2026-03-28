import { eq, and, asc, desc, count, sql, ne, inArray } from 'drizzle-orm';
import { db } from '@/db/index';
import { tickets, checklistItems, ticketLabels, labels, members, ticketAssignees, workspaces } from '@/db/schema';
import type { Ticket, TicketWithMeta, BoardData, TicketStatus } from '@/types/index';
import { isOverdue } from '@/lib/utils';
import { nowKST } from '@/lib/date';
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
    plannedStartDate: row.plannedStartDate ?? null,
    plannedEndDate: row.plannedEndDate ?? null,
    parentId: row.parentId ?? null,
    assigneeId: row.assigneeId ?? null,
    sprintId: row.sprintId ?? null,
    storyPoints: row.storyPoints ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    deleted: row.deleted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMember(m: typeof members.$inferSelect): import('@/types/index').Member {
  return {
    id: m.id,
    userId: m.userId,
    workspaceId: m.workspaceId,
    displayName: m.displayName,
    color: m.color,
    role: m.role as import('@/types/index').Member['role'],
    invitedBy: m.invitedBy ?? null,
    joinedAt: m.joinedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

/** Quick lookup: returns the workspaceId that owns the given ticket, or null. */
export async function getTicketWorkspaceId(ticketId: number): Promise<number | null> {
  const [row] = await db
    .select({ workspaceId: tickets.workspaceId })
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.deleted, false)))
    .limit(1);
  return row?.workspaceId ?? null;
}

export async function getTicketCount(workspaceId: number): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)));
  return Number(result.count);
}

export async function getBoardData(workspaceId: number): Promise<BoardData> {
  const [allTickets, allTicketLabels, allChecklistItems, allMembers, allAssignees, workspaceRow] = await Promise.all(
    [
      db
        .select()
        .from(tickets)
        .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
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
        .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
        .orderBy(asc(checklistItems.position)),
      db.select().from(members).where(eq(members.workspaceId, workspaceId)),
      db
        .select({ ticketId: ticketAssignees.ticketId, member: members })
        .from(ticketAssignees)
        .innerJoin(members, eq(members.id, ticketAssignees.memberId))
        .where(eq(members.workspaceId, workspaceId)),
      db.select({ name: workspaces.name }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1),
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
  const ticketsById = new Map(allTickets.map((t) => [t.id, t]));

  const assigneesByTicket = new Map<number, typeof members.$inferSelect[]>();
  for (const row of allAssignees) {
    const arr = assigneesByTicket.get(row.ticketId) ?? [];
    arr.push(row.member);
    assigneesByTicket.set(row.ticketId, arr);
  }

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
    const parentRow = row.parentId ? ticketsById.get(row.parentId) : null;
    const assigneeRows = assigneesByTicket.get(row.id) ?? [];

    const meta: TicketWithMeta = {
      ...ticket,
      isOverdue: isOverdue(ticket.plannedEndDate, ticket.status),
      labels: ticketLabelsData,
      checklistItems: checklist,
      assignees: assigneeRows.map(toMember),
      assignee: memberRow ? toMember(memberRow) : null,
      parent: parentRow ? toTicket(parentRow) : null,
    };

    const status = ticket.status as TicketStatus;
    if (status in board) {
      board[status].push(meta);
      total++;
    }
  }

  return { board, total, workspaceName: workspaceRow[0]?.name };
}

export async function getWbsTickets(workspaceId: number): Promise<TicketWithMeta[]> {
  const [allTickets, allTicketLabels, allChecklistItems, allMembers, allAssignees] = await Promise.all([
    db
      .select()
      .from(tickets)
      .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
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
      .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
      .orderBy(asc(checklistItems.position)),
    db.select().from(members).where(eq(members.workspaceId, workspaceId)),
    db
      .select({ ticketId: ticketAssignees.ticketId, member: members })
      .from(ticketAssignees)
      .innerJoin(members, eq(members.id, ticketAssignees.memberId))
      .where(eq(members.workspaceId, workspaceId)),
  ]);

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
  const ticketsById = new Map(allTickets.map((t) => [t.id, t]));

  const assigneesByTicket = new Map<number, typeof members.$inferSelect[]>();
  for (const row of allAssignees) {
    const arr = assigneesByTicket.get(row.ticketId) ?? [];
    arr.push(row.member);
    assigneesByTicket.set(row.ticketId, arr);
  }

  return allTickets.map((row) => {
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
    const parentRow = row.parentId ? ticketsById.get(row.parentId) : null;
    const assigneeRows = assigneesByTicket.get(row.id) ?? [];

    return {
      ...ticket,
      isOverdue: isOverdue(ticket.plannedEndDate, ticket.status),
      labels: ticketLabelsData,
      checklistItems: checklist,
      assignees: assigneeRows.map(toMember),
      assignee: memberRow ? toMember(memberRow) : null,
      parent: parentRow ? toTicket(parentRow) : null,
    };
  });
}

export async function getTicketById(
  id: number,
  workspaceId: number,
): Promise<TicketWithMeta | null> {
  const [row] = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
    .limit(1);
  if (!row) return null;

  const [checklist, ticketLabelRows, memberRow, parentRow, assigneeRows] = await Promise.all([
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
    row.parentId
      ? db.select().from(tickets).where(eq(tickets.id, row.parentId)).limit(1)
      : Promise.resolve([]),
    db
      .select({ member: members })
      .from(ticketAssignees)
      .innerJoin(members, eq(members.id, ticketAssignees.memberId))
      .where(eq(ticketAssignees.ticketId, id)),
  ]);

  const ticket = toTicket(row);
  const mr = (memberRow as typeof members.$inferSelect[])[0];
  const pr = (parentRow as typeof tickets.$inferSelect[])[0];

  return {
    ...ticket,
    isOverdue: isOverdue(ticket.plannedEndDate, ticket.status),
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
    assignees: assigneeRows.map((r) => toMember(r.member)),
    assignee: mr ? toMember(mr) : null,
    parent: pr ? toTicket(pr) : null,
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
    plannedStartDate?: string | null;
    plannedEndDate?: string | null;
    parentId?: number | null;
    assigneeId?: number | null;
    sprintId?: number | null;
    storyPoints?: number | null;
    labelIds?: number[];
  },
): Promise<Ticket> {
  // Position = min position in BACKLOG - 1024 (or 0 if empty)
  const [minRow] = await db
    .select({ minPos: sql<number>`MIN(${tickets.position})` })
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.status, 'BACKLOG'), eq(tickets.deleted, false)));

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
      plannedStartDate: data.plannedStartDate ?? null,
      plannedEndDate: data.plannedEndDate ?? null,
      parentId: data.parentId ?? null,
      assigneeId: data.assigneeId ?? null,
      sprintId: data.sprintId ?? null,
      storyPoints: data.storyPoints ?? null,
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
    plannedStartDate: string | null;
    plannedEndDate: string | null;
    parentId: number | null;
    assigneeId: number | null;
    completedAt: Date | null;
    position: number;
    sprintId: number | null;
    storyPoints: number | null;
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
  if (data.plannedStartDate !== undefined) updateData.plannedStartDate = data.plannedStartDate;
  if (data.plannedEndDate !== undefined) updateData.plannedEndDate = data.plannedEndDate;
  if (data.parentId !== undefined) updateData.parentId = data.parentId;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
  if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.sprintId !== undefined) updateData.sprintId = data.sprintId;
  if (data.storyPoints !== undefined) updateData.storyPoints = data.storyPoints;

  if (Object.keys(updateData).length === 0 && data.labelIds === undefined) {
    return getTicketById(id, workspaceId).then((t) => t);
  }

  let updated: typeof tickets.$inferSelect | undefined;

  if (Object.keys(updateData).length > 0) {
    const [row] = await db
      .update(tickets)
      .set(updateData)
      .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
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
    .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
    .limit(1);
  return ticket[0] ? toTicket(ticket[0]) : null;
}

export async function deleteTicket(id: number, workspaceId: number): Promise<boolean> {
  const result = await db
    .update(tickets)
    .set({ deleted: true })
    .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, false)))
    .returning({ id: tickets.id });
  return result.length > 0;
}

export async function getDeletedTickets(workspaceId: number): Promise<TicketWithMeta[]> {
  const [allTickets, allTicketLabels, allChecklistItems, allMembers, allAssignees] = await Promise.all([
    db
      .select()
      .from(tickets)
      .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, true)))
      .orderBy(desc(tickets.updatedAt)),
    db
      .select({ ticketId: ticketLabels.ticketId, label: labels })
      .from(ticketLabels)
      .innerJoin(labels, eq(ticketLabels.labelId, labels.id))
      .where(eq(labels.workspaceId, workspaceId)),
    db
      .select()
      .from(checklistItems)
      .innerJoin(tickets, eq(checklistItems.ticketId, tickets.id))
      .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, true)))
      .orderBy(asc(checklistItems.position)),
    db.select().from(members).where(eq(members.workspaceId, workspaceId)),
    db
      .select({ ticketId: ticketAssignees.ticketId, member: members })
      .from(ticketAssignees)
      .innerJoin(members, eq(members.id, ticketAssignees.memberId))
      .where(eq(members.workspaceId, workspaceId)),
  ]);

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
  const ticketsById = new Map(allTickets.map((t) => [t.id, t]));

  const assigneesByTicket = new Map<number, typeof members.$inferSelect[]>();
  for (const row of allAssignees) {
    const arr = assigneesByTicket.get(row.ticketId) ?? [];
    arr.push(row.member);
    assigneesByTicket.set(row.ticketId, arr);
  }

  return allTickets.map((row) => {
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
    const parentRow = row.parentId ? ticketsById.get(row.parentId) : null;
    const assigneeRows = assigneesByTicket.get(row.id) ?? [];

    return {
      ...ticket,
      isOverdue: isOverdue(ticket.plannedEndDate, ticket.status),
      labels: ticketLabelsData,
      checklistItems: checklist,
      assignees: assigneeRows.map(toMember),
      assignee: memberRow ? toMember(memberRow) : null,
      parent: parentRow ? toTicket(parentRow) : null,
    };
  });
}

export async function restoreTicket(id: number, workspaceId: number): Promise<boolean> {
  const result = await db
    .update(tickets)
    .set({ deleted: false })
    .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, true)))
    .returning({ id: tickets.id });
  return result.length > 0;
}

export async function permanentDeleteTicket(id: number, workspaceId: number): Promise<boolean> {
  const result = await db
    .delete(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, true)))
    .returning({ id: tickets.id });
  return result.length > 0;
}

export async function bulkPermanentDeleteTickets(ids: number[], workspaceId: number): Promise<number> {
  if (ids.length === 0) return 0;
  const result = await db
    .delete(tickets)
    .where(and(inArray(tickets.id, ids), eq(tickets.workspaceId, workspaceId), eq(tickets.deleted, true)))
    .returning({ id: tickets.id });
  return result.length;
}

export async function getTicketsDueTomorrow(workspaceId: number): Promise<Ticket[]> {
  const tomorrow = nowKST();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]; // 'YYYY-MM-DD'

  const rows = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.workspaceId, workspaceId),
        eq(tickets.plannedEndDate, tomorrowStr),
        ne(tickets.status, 'DONE'),
        eq(tickets.deleted, false),
      ),
    );
  return rows.map(toTicket);
}
