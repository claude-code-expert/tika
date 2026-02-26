import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { workspaces } from '@/db/schema';
import type { Workspace } from '@/types/index';

function toWorkspace(row: typeof workspaces.$inferSelect): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getWorkspaceById(id: number): Promise<Workspace | null> {
  const [row] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
  return row ? toWorkspace(row) : null;
}

export async function updateWorkspace(
  id: number,
  data: { name?: string; description?: string | null },
): Promise<Workspace | null> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;

  if (Object.keys(updateData).length === 0) return null;

  const [updated] = await db
    .update(workspaces)
    .set(updateData)
    .where(eq(workspaces.id, id))
    .returning();
  return updated ? toWorkspace(updated) : null;
}
