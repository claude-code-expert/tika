import { eq, and, count, ne } from 'drizzle-orm';
import { db } from '@/db/index';
import { sprints, tickets } from '@/db/schema';
import type { Sprint, SprintWithTicketCount, SprintStatus } from '@/types/index';

function toSprint(row: typeof sprints.$inferSelect): Sprint {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    goal: row.goal,
    status: row.status as SprintStatus,
    startDate: row.startDate,
    endDate: row.endDate,
    storyPointsTotal: row.storyPointsTotal,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getSprintsByWorkspace(workspaceId: number): Promise<Sprint[]> {
  const rows = await db
    .select()
    .from(sprints)
    .where(eq(sprints.workspaceId, workspaceId))
    .orderBy(sprints.createdAt);
  return rows.map(toSprint);
}

export async function getSprintsWithTicketCount(
  workspaceId: number,
): Promise<SprintWithTicketCount[]> {
  const rows = await db
    .select({
      sprint: sprints,
      ticketCount: count(tickets.id),
    })
    .from(sprints)
    .leftJoin(tickets, eq(tickets.sprintId, sprints.id))
    .where(eq(sprints.workspaceId, workspaceId))
    .groupBy(sprints.id)
    .orderBy(sprints.createdAt);

  return rows.map((row) => ({
    ...toSprint(row.sprint),
    ticketCount: Number(row.ticketCount),
  }));
}

export async function getSprintById(id: number, workspaceId: number): Promise<Sprint | null> {
  const [row] = await db
    .select()
    .from(sprints)
    .where(and(eq(sprints.id, id), eq(sprints.workspaceId, workspaceId)))
    .limit(1);
  return row ? toSprint(row) : null;
}

export async function getActiveSprintByWorkspace(workspaceId: number): Promise<Sprint | null> {
  const [row] = await db
    .select()
    .from(sprints)
    .where(and(eq(sprints.workspaceId, workspaceId), eq(sprints.status, 'ACTIVE')))
    .limit(1);
  return row ? toSprint(row) : null;
}

export async function hasActiveSprint(workspaceId: number, excludeId?: number): Promise<boolean> {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(sprints)
    .where(
      and(
        eq(sprints.workspaceId, workspaceId),
        eq(sprints.status, 'ACTIVE'),
        excludeId !== undefined ? ne(sprints.id, excludeId) : undefined,
      ),
    );
  return Number(cnt) > 0;
}

export async function createSprint(
  workspaceId: number,
  data: {
    name: string;
    goal?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    storyPointsTotal?: number | null;
  },
): Promise<Sprint> {
  const [row] = await db
    .insert(sprints)
    .values({
      workspaceId,
      name: data.name,
      goal: data.goal ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      storyPointsTotal: data.storyPointsTotal ?? null,
      status: 'PLANNED',
    })
    .returning();
  return toSprint(row);
}

export async function updateSprint(
  id: number,
  workspaceId: number,
  data: Partial<{
    name: string;
    goal: string | null;
    startDate: string | null;
    endDate: string | null;
    storyPointsTotal: number | null;
  }>,
): Promise<Sprint | null> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if ('goal' in data) updateData.goal = data.goal;
  if ('startDate' in data) updateData.startDate = data.startDate;
  if ('endDate' in data) updateData.endDate = data.endDate;
  if ('storyPointsTotal' in data) updateData.storyPointsTotal = data.storyPointsTotal;

  if (Object.keys(updateData).length === 0) return null;

  const [row] = await db
    .update(sprints)
    .set(updateData)
    .where(and(eq(sprints.id, id), eq(sprints.workspaceId, workspaceId)))
    .returning();
  return row ? toSprint(row) : null;
}

export async function activateSprint(id: number, workspaceId: number): Promise<Sprint | null> {
  const [row] = await db
    .update(sprints)
    .set({ status: 'ACTIVE' })
    .where(
      and(eq(sprints.id, id), eq(sprints.workspaceId, workspaceId), eq(sprints.status, 'PLANNED')),
    )
    .returning();
  return row ? toSprint(row) : null;
}

export async function completeSprint(id: number, workspaceId: number): Promise<Sprint | null> {
  const [row] = await db
    .update(sprints)
    .set({ status: 'COMPLETED' })
    .where(
      and(eq(sprints.id, id), eq(sprints.workspaceId, workspaceId), eq(sprints.status, 'ACTIVE')),
    )
    .returning();
  return row ? toSprint(row) : null;
}

export async function cancelSprint(id: number, workspaceId: number): Promise<Sprint | null> {
  const [row] = await db
    .update(sprints)
    .set({ status: 'CANCELLED' })
    .where(and(eq(sprints.id, id), eq(sprints.workspaceId, workspaceId)))
    .returning();
  return row ? toSprint(row) : null;
}

export async function deleteSprint(id: number, workspaceId: number): Promise<boolean> {
  const result = await db
    .delete(sprints)
    .where(
      and(eq(sprints.id, id), eq(sprints.workspaceId, workspaceId), eq(sprints.status, 'PLANNED')),
    )
    .returning({ id: sprints.id });
  return result.length > 0;
}
