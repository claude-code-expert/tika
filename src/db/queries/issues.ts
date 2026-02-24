import { eq, and } from 'drizzle-orm';
import { db } from '@/db/index';
import { issues } from '@/db/schema';
import type { Issue, IssueType } from '@/types/index';

function toIssue(row: typeof issues.$inferSelect): Issue {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    type: row.type as IssueType,
    parentId: row.parentId ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getIssuesByWorkspace(workspaceId: number): Promise<Issue[]> {
  const rows = await db.select().from(issues).where(eq(issues.workspaceId, workspaceId));
  return rows.map(toIssue);
}

export async function createIssue(
  workspaceId: number,
  data: { name: string; type: string; parentId?: number | null },
): Promise<Issue> {
  const [inserted] = await db
    .insert(issues)
    .values({
      workspaceId,
      name: data.name,
      type: data.type,
      parentId: data.parentId ?? null,
    })
    .returning();
  return toIssue(inserted);
}

export async function updateIssue(
  id: number,
  workspaceId: number,
  data: { name?: string; parentId?: number | null },
): Promise<Issue | null> {
  const [updated] = await db
    .update(issues)
    .set(data)
    .where(and(eq(issues.id, id), eq(issues.workspaceId, workspaceId)))
    .returning();
  return updated ? toIssue(updated) : null;
}

export async function deleteIssue(id: number, workspaceId: number): Promise<boolean> {
  // Children's parent_id → NULL is handled by DB ON DELETE SET NULL
  const result = await db
    .delete(issues)
    .where(and(eq(issues.id, id), eq(issues.workspaceId, workspaceId)))
    .returning({ id: issues.id });
  return result.length > 0;
}
