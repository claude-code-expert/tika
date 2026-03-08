import { eq, and, count } from 'drizzle-orm';
import { db } from '@/db/index';
import { members, users, workspaces } from '@/db/schema';
import type { Member, MemberRole, MemberWithEmail, WorkspaceWithRole, TeamRole, WorkspaceType } from '@/types/index';

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
      invitedBy: members.invitedBy,
      joinedAt: members.joinedAt,
      createdAt: members.createdAt,
      email: users.email,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.workspaceId, workspaceId));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId,
    displayName: row.displayName,
    color: row.color,
    role: row.role as Member['role'],
    invitedBy: row.invitedBy ?? null,
    joinedAt: row.joinedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    email: row.email,
  }));
}

export async function getMemberById(id: number, workspaceId: number): Promise<Member | null> {
  const [row] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, id), eq(members.workspaceId, workspaceId)))
    .limit(1);
  return row ? toMember(row) : null;
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

export async function getOwnerCount(workspaceId: number): Promise<number> {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(members)
    .where(and(eq(members.workspaceId, workspaceId), eq(members.role, 'OWNER')));
  return Number(cnt);
}

/** @deprecated Use getOwnerCount instead */
export const getAdminCount = getOwnerCount;

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

export async function createMember(data: {
  userId: string;
  workspaceId: number;
  displayName: string;
  color: string;
  role: string;
  invitedBy?: number | null;
  joinedAt?: Date | null;
}): Promise<Member> {
  const [row] = await db
    .insert(members)
    .values({
      userId: data.userId,
      workspaceId: data.workspaceId,
      displayName: data.displayName,
      color: data.color,
      role: data.role,
      invitedBy: data.invitedBy ?? null,
      joinedAt: data.joinedAt ?? null,
    })
    .returning();
  return toMember(row);
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceWithRole[]> {
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
