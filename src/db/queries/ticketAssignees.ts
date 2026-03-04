import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/db/index';
import { ticketAssignees, members } from '@/db/schema';
import type { Member } from '@/types/index';

const MAX_ASSIGNEES = 5;

function toMember(row: typeof members.$inferSelect): Member {
  return {
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId,
    displayName: row.displayName,
    color: row.color,
    role: row.role as Member['role'],
    invitedBy: row.invitedBy ?? null,
    joinedAt: row.joinedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAssigneesByTicket(ticketId: number): Promise<Member[]> {
  const rows = await db
    .select({ member: members })
    .from(ticketAssignees)
    .innerJoin(members, eq(members.id, ticketAssignees.memberId))
    .where(eq(ticketAssignees.ticketId, ticketId));
  return rows.map((r) => toMember(r.member));
}

export async function getAssigneesByTickets(
  ticketIds: number[],
): Promise<Record<number, Member[]>> {
  if (ticketIds.length === 0) return {};

  const rows = await db
    .select({
      ticketId: ticketAssignees.ticketId,
      member: members,
    })
    .from(ticketAssignees)
    .innerJoin(members, eq(members.id, ticketAssignees.memberId))
    .where(inArray(ticketAssignees.ticketId, ticketIds));

  const result: Record<number, Member[]> = {};
  for (const row of rows) {
    if (!result[row.ticketId]) result[row.ticketId] = [];
    result[row.ticketId].push(toMember(row.member));
  }
  return result;
}

/**
 * Replace all assignees for a ticket. Validates max 5 assignees.
 * Throws if memberIds.length > MAX_ASSIGNEES.
 */
export async function setAssignees(ticketId: number, memberIds: number[]): Promise<void> {
  if (memberIds.length > MAX_ASSIGNEES) {
    throw new Error(`담당자는 최대 ${MAX_ASSIGNEES}명까지 배정할 수 있습니다`);
  }

  await db.delete(ticketAssignees).where(eq(ticketAssignees.ticketId, ticketId));

  if (memberIds.length > 0) {
    await db
      .insert(ticketAssignees)
      .values(memberIds.map((memberId) => ({ ticketId, memberId })));
  }
}

export async function addAssignee(ticketId: number, memberId: number): Promise<void> {
  await db.insert(ticketAssignees).values({ ticketId, memberId }).onConflictDoNothing();
}

export async function removeAssignee(ticketId: number, memberId: number): Promise<void> {
  await db
    .delete(ticketAssignees)
    .where(
      and(eq(ticketAssignees.ticketId, ticketId), eq(ticketAssignees.memberId, memberId)),
    );
}

export async function getTicketIdsByMember(
  memberId: number,
  workspaceId: number,
): Promise<number[]> {
  const rows = await db
    .select({ ticketId: ticketAssignees.ticketId })
    .from(ticketAssignees)
    .innerJoin(members, eq(members.id, ticketAssignees.memberId))
    .where(and(eq(ticketAssignees.memberId, memberId), eq(members.workspaceId, workspaceId)));
  return rows.map((r) => r.ticketId);
}
