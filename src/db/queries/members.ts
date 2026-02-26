import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db/index';
import { members, users } from '@/db/schema';
import type { Member, MemberRole, MemberWithEmail } from '@/types/index';

function toMember(row: typeof members.$inferSelect): Member {
  return {
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId,
    displayName: row.displayName,
    color: row.color,
    role: row.role as Member['role'],
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
  const rows = await db.select().from(members).where(eq(members.workspaceId, workspaceId));
  return rows.map(toMember);
}

export async function getMembersWithEmailByWorkspace(
  workspaceId: number,
): Promise<MemberWithEmail[]> {
  const rows = await db
    .select({
      id: members.id,
      userId: members.userId,
      workspaceId: members.workspaceId,
      displayName: members.displayName,
      color: members.color,
      role: members.role,
      createdAt: members.createdAt,
      email: users.email,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.workspaceId, workspaceId));

  return rows.map((row) => ({
    ...toMember(row),
    email: row.email,
  }));
}

export async function updateMemberRole(
  id: number,
  workspaceId: number,
  role: MemberRole,
): Promise<Member | null> {
  const [updated] = await db
    .update(members)
    .set({ role })
    .where(and(eq(members.id, id), eq(members.workspaceId, workspaceId)))
    .returning();
  return updated ? toMember(updated) : null;
}

export async function removeMember(id: number, workspaceId: number): Promise<boolean> {
  const result = await db
    .delete(members)
    .where(and(eq(members.id, id), eq(members.workspaceId, workspaceId)))
    .returning({ id: members.id });
  return result.length > 0;
}

export async function getAdminCount(workspaceId: number): Promise<number> {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(members)
    .where(and(eq(members.workspaceId, workspaceId), eq(members.role, 'admin')));
  return Number(cnt);
}

export async function updateMember(
  id: number,
  workspaceId: number,
  data: { displayName?: string; color?: string },
): Promise<Member | null> {
  const updateData: Record<string, unknown> = {};
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.color !== undefined) updateData.color = data.color;

  if (Object.keys(updateData).length === 0) return null;

  const [row] = await db
    .update(members)
    .set(updateData)
    .where(and(eq(members.id, id), eq(members.workspaceId, workspaceId)))
    .returning();
  return row ? toMember(row) : null;
}
