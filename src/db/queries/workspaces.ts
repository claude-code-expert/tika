import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db/index';
import { workspaces, members, tickets, labels, sprints } from '@/db/schema';
import type { Workspace, WorkspaceWithRole, WorkspaceType, TeamRole } from '@/types/index';

function toWorkspace(row: typeof workspaces.$inferSelect): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    type: row.type as WorkspaceType,
    iconColor: row.iconColor ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getWorkspaceById(id: number): Promise<Workspace | null> {
  const [row] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return row ? toWorkspace(row) : null;
}

export async function getAllWorkspaces(): Promise<Workspace[]> {
  const rows = await db.select().from(workspaces);
  return rows.map(toWorkspace);
}

export async function getWorkspacesByMemberId(userId: string): Promise<WorkspaceWithRole[]> {
  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      ownerId: workspaces.ownerId,
      type: workspaces.type,
      iconColor: workspaces.iconColor,
      createdAt: workspaces.createdAt,
      role: members.role,
    })
    .from(members)
    .innerJoin(workspaces, eq(workspaces.id, members.workspaceId))
    .where(eq(members.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    type: row.type as WorkspaceType,
    iconColor: row.iconColor ?? null,
    createdAt: row.createdAt.toISOString(),
    role: row.role as TeamRole,
  }));
}

export async function getTeamWorkspaceCountByOwner(userId: string): Promise<number> {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(workspaces)
    .where(and(eq(workspaces.ownerId, userId), eq(workspaces.type, 'TEAM')));
  return Number(cnt);
}

export async function createWorkspace(data: {
  name: string;
  description?: string | null;
  ownerId: string;
  type?: string;
}): Promise<Workspace> {
  const [row] = await db
    .insert(workspaces)
    .values({
      name: data.name,
      description: data.description ?? null,
      ownerId: data.ownerId,
      type: data.type ?? 'TEAM',
    })
    .returning();
  return toWorkspace(row);
}

export async function updateWorkspace(
  id: number,
  data: { name?: string; description?: string | null; iconColor?: string | null },
): Promise<Workspace | null> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.iconColor !== undefined) updateData.iconColor = data.iconColor;

  if (Object.keys(updateData).length === 0) return null;

  const [updated] = await db
    .update(workspaces)
    .set(updateData)
    .where(eq(workspaces.id, id))
    .returning();
  return updated ? toWorkspace(updated) : null;
}

export async function deleteWorkspace(id: number): Promise<boolean> {
  const result = await db
    .delete(workspaces)
    .where(eq(workspaces.id, id))
    .returning({ id: workspaces.id });
  return result.length > 0;
}

// Reset all workspace data (tickets, labels, sprints)
export async function resetWorkspaceData(workspaceId: number): Promise<void> {
  // Delete all tickets for workspace (cascade deletes checklist_items, ticket_labels, ticket_assignees)
  await db.delete(tickets).where(eq(tickets.workspaceId, workspaceId));
  await db.delete(labels).where(eq(labels.workspaceId, workspaceId));
  await db.delete(sprints).where(eq(sprints.workspaceId, workspaceId));
}
