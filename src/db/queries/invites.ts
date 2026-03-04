import { eq, and, lt } from 'drizzle-orm';
import { db } from '@/db/index';
import { workspaceInvites, members } from '@/db/schema';
import type { WorkspaceInvite, InviteStatus, Member } from '@/types/index';

// Preset colors for auto-assigned member avatars
const MEMBER_COLORS = [
  '#7EB4A2', '#629584', '#4A90D9', '#E67E22', '#9B59B6',
  '#E74C3C', '#27AE60', '#2980B9', '#F39C12', '#1ABC9C',
];

function toInvite(row: typeof workspaceInvites.$inferSelect): WorkspaceInvite {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    invitedBy: row.invitedBy,
    token: row.token,
    email: row.email,
    role: row.role as 'MEMBER' | 'VIEWER',
    status: row.status as InviteStatus,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getInvitesByWorkspace(workspaceId: number): Promise<WorkspaceInvite[]> {
  const rows = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.workspaceId, workspaceId))
    .orderBy(workspaceInvites.createdAt);
  return rows.map(toInvite);
}

export async function getInviteById(
  id: number,
  workspaceId: number,
): Promise<WorkspaceInvite | null> {
  const [row] = await db
    .select()
    .from(workspaceInvites)
    .where(and(eq(workspaceInvites.id, id), eq(workspaceInvites.workspaceId, workspaceId)))
    .limit(1);
  return row ? toInvite(row) : null;
}

export async function getInviteByToken(token: string): Promise<WorkspaceInvite | null> {
  const [row] = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.token, token))
    .limit(1);
  return row ? toInvite(row) : null;
}

export async function getPendingInviteByEmail(
  workspaceId: number,
  email: string,
): Promise<WorkspaceInvite | null> {
  const [row] = await db
    .select()
    .from(workspaceInvites)
    .where(
      and(
        eq(workspaceInvites.workspaceId, workspaceId),
        eq(workspaceInvites.email, email),
        eq(workspaceInvites.status, 'PENDING'),
      ),
    )
    .limit(1);
  return row ? toInvite(row) : null;
}

export async function createInvite(data: {
  workspaceId: number;
  invitedBy: number;
  email: string;
  role: 'MEMBER' | 'VIEWER';
  expiresAt: Date;
}): Promise<WorkspaceInvite> {
  const [row] = await db
    .insert(workspaceInvites)
    .values({
      workspaceId: data.workspaceId,
      invitedBy: data.invitedBy,
      email: data.email,
      role: data.role,
      status: 'PENDING',
      expiresAt: data.expiresAt,
    })
    .returning();
  return toInvite(row);
}

export async function updateInviteStatus(
  id: number,
  status: InviteStatus,
): Promise<WorkspaceInvite | null> {
  const [row] = await db
    .update(workspaceInvites)
    .set({ status })
    .where(eq(workspaceInvites.id, id))
    .returning();
  return row ? toInvite(row) : null;
}

export async function revokeInvite(
  id: number,
  workspaceId: number,
): Promise<WorkspaceInvite | null> {
  const [row] = await db
    .update(workspaceInvites)
    .set({ status: 'REJECTED' })
    .where(
      and(
        eq(workspaceInvites.id, id),
        eq(workspaceInvites.workspaceId, workspaceId),
        eq(workspaceInvites.status, 'PENDING'),
      ),
    )
    .returning();
  return row ? toInvite(row) : null;
}

export async function rejectInvite(token: string): Promise<WorkspaceInvite | null> {
  const [row] = await db
    .update(workspaceInvites)
    .set({ status: 'REJECTED' })
    .where(and(eq(workspaceInvites.token, token), eq(workspaceInvites.status, 'PENDING')))
    .returning();
  return row ? toInvite(row) : null;
}

/** Accept invite: creates member record + updates status to ACCEPTED in a transaction. */
export async function acceptInvite(data: {
  token: string;
  userId: string;
  displayName: string;
}): Promise<{ member: Member; invite: WorkspaceInvite } | null> {
  const invite = await getInviteByToken(data.token);
  if (!invite || invite.status !== 'PENDING') return null;

  const color = MEMBER_COLORS[Math.abs(data.userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % MEMBER_COLORS.length];

  const result = await db.transaction(async (tx) => {
    const [memberRow] = await tx
      .insert(members)
      .values({
        userId: data.userId,
        workspaceId: invite.workspaceId,
        displayName: data.displayName,
        color,
        role: invite.role,
        invitedBy: invite.invitedBy,
        joinedAt: new Date(),
      })
      .returning();

    const [inviteRow] = await tx
      .update(workspaceInvites)
      .set({ status: 'ACCEPTED' })
      .where(eq(workspaceInvites.token, data.token))
      .returning();

    return { memberRow, inviteRow };
  });

  const member: Member = {
    id: result.memberRow.id,
    userId: result.memberRow.userId,
    workspaceId: result.memberRow.workspaceId,
    displayName: result.memberRow.displayName,
    color: result.memberRow.color,
    role: result.memberRow.role as Member['role'],
    invitedBy: result.memberRow.invitedBy ?? null,
    joinedAt: result.memberRow.joinedAt?.toISOString() ?? null,
    createdAt: result.memberRow.createdAt.toISOString(),
  };

  return { member, invite: toInvite(result.inviteRow) };
}

/** Expire all PENDING invites that are past their expiry date. Returns expired count. */
export async function expireStaleInvites(): Promise<number> {
  const now = new Date();
  const result = await db
    .update(workspaceInvites)
    .set({ status: 'EXPIRED' })
    .where(and(eq(workspaceInvites.status, 'PENDING'), lt(workspaceInvites.expiresAt, now)))
    .returning({ id: workspaceInvites.id });
  return result.length;
}
