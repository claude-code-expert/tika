import { eq, and, count, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { labels, ticketLabels } from '@/db/schema';
import type { Label, LabelWithCount } from '@/types/index';
import { LABEL_MAX_PER_WORKSPACE, LABEL_MAX_PER_TICKET } from '@/lib/constants';

function toLabel(row: typeof labels.$inferSelect): Label {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getLabelsByWorkspace(workspaceId: number): Promise<Label[]> {
  const rows = await db.select().from(labels).where(eq(labels.workspaceId, workspaceId));
  return rows.map(toLabel);
}

export async function getLabelsByWorkspaceWithCount(
  workspaceId: number,
): Promise<LabelWithCount[]> {
  const rows = await db
    .select({
      id: labels.id,
      workspaceId: labels.workspaceId,
      name: labels.name,
      color: labels.color,
      createdAt: labels.createdAt,
      ticketCount: sql<number>`cast(count(${ticketLabels.ticketId}) as integer)`,
    })
    .from(labels)
    .leftJoin(ticketLabels, eq(ticketLabels.labelId, labels.id))
    .where(eq(labels.workspaceId, workspaceId))
    .groupBy(labels.id);

  return rows.map((row) => ({
    ...toLabel(row),
    ticketCount: row.ticketCount,
  }));
}

export async function createLabel(
  workspaceId: number,
  data: { name: string; color: string },
): Promise<Label | { error: 'LIMIT_EXCEEDED' | 'DUPLICATE_NAME' }> {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(labels)
    .where(eq(labels.workspaceId, workspaceId));

  if (Number(cnt) >= LABEL_MAX_PER_WORKSPACE) return { error: 'LIMIT_EXCEEDED' };

  // Check duplicate name
  const [existing] = await db
    .select({ id: labels.id })
    .from(labels)
    .where(and(eq(labels.workspaceId, workspaceId), eq(labels.name, data.name)))
    .limit(1);
  if (existing) return { error: 'DUPLICATE_NAME' };

  const [inserted] = await db
    .insert(labels)
    .values({ workspaceId, name: data.name, color: data.color })
    .returning();
  return toLabel(inserted);
}

export async function updateLabel(
  id: number,
  workspaceId: number,
  data: { name?: string; color?: string },
): Promise<Label | null> {
  const [updated] = await db
    .update(labels)
    .set(data)
    .where(and(eq(labels.id, id), eq(labels.workspaceId, workspaceId)))
    .returning();
  return updated ? toLabel(updated) : null;
}

export async function deleteLabel(id: number, workspaceId: number): Promise<boolean> {
  const result = await db
    .delete(labels)
    .where(and(eq(labels.id, id), eq(labels.workspaceId, workspaceId)))
    .returning({ id: labels.id });
  return result.length > 0;
}

export async function addLabelToTicket(
  ticketId: number,
  labelId: number,
): Promise<void | { error: 'LIMIT_EXCEEDED' }> {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(ticketLabels)
    .where(eq(ticketLabels.ticketId, ticketId));

  if (Number(cnt) >= LABEL_MAX_PER_TICKET) return { error: 'LIMIT_EXCEEDED' };

  await db
    .insert(ticketLabels)
    .values({ ticketId, labelId })
    .onConflictDoNothing();
}

export async function removeLabelFromTicket(ticketId: number, labelId: number): Promise<void> {
  await db
    .delete(ticketLabels)
    .where(and(eq(ticketLabels.ticketId, ticketId), eq(ticketLabels.labelId, labelId)));
}

export async function setTicketLabels(ticketId: number, labelIds: number[]): Promise<void> {
  await db.delete(ticketLabels).where(eq(ticketLabels.ticketId, ticketId));
  if (labelIds.length > 0) {
    await db.insert(ticketLabels).values(labelIds.map((labelId) => ({ ticketId, labelId })));
  }
}
