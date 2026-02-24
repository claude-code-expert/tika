import { eq, and } from 'drizzle-orm';
import { db } from '@/db/index';
import { members } from '@/db/schema';
import type { Member } from '@/types/index';

function toMember(row: typeof members.$inferSelect): Member {
  return {
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId,
    displayName: row.displayName,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getMemberByUserId(
  userId: string,
  workspaceId: number,
): Promise<Member | null> {
  const [row] = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.workspaceId, workspaceId)))
    .limit(1);
  return row ? toMember(row) : null;
}

export async function getMembersByWorkspace(workspaceId: number): Promise<Member[]> {
  const rows = await db
    .select()
    .from(members)
    .where(eq(members.workspaceId, workspaceId));
  return rows.map(toMember);
}
