import { eq, and } from 'drizzle-orm';
import { db } from '@/db/index';
import { workspaceJoinRequests, members, users } from '@/db/schema';
import type { JoinRequest, JoinRequestWithUser, JoinRequestStatus } from '@/types/index';

// Preset colors for new members (matches invites.ts pattern)
const MEMBER_COLORS = [
  '#7EB4A2', '#629584', '#4A90D9', '#E67E22', '#9B59B6',
  '#E74C3C', '#27AE60', '#2980B9', '#F39C12', '#1ABC9C',
];

function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

function toJoinRequest(row: typeof workspaceJoinRequests.$inferSelect): JoinRequest {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    message: row.message,
    status: row.status as JoinRequestStatus,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getJoinRequests(
  workspaceId: number,
  status: JoinRequestStatus = 'PENDING',
): Promise<JoinRequestWithUser[]> {
  const rows = await db
    .select({
      id: workspaceJoinRequests.id,
      workspaceId: workspaceJoinRequests.workspaceId,
      userId: workspaceJoinRequests.userId,
      message: workspaceJoinRequests.message,
      status: workspaceJoinRequests.status,
      reviewedBy: workspaceJoinRequests.reviewedBy,
      reviewedAt: workspaceJoinRequests.reviewedAt,
      createdAt: workspaceJoinRequests.createdAt,
      userName: users.name,
      userEmail: users.email,
      userAvatarUrl: users.avatarUrl,
    })
    .from(workspaceJoinRequests)
    .innerJoin(users, eq(workspaceJoinRequests.userId, users.id))
    .where(
      and(
        eq(workspaceJoinRequests.workspaceId, workspaceId),
        eq(workspaceJoinRequests.status, status),
      ),
    )
    .orderBy(workspaceJoinRequests.createdAt);

  return rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    message: row.message,
    status: row.status as JoinRequestStatus,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    userName: row.userName,
    userEmail: row.userEmail,
    userAvatarUrl: row.userAvatarUrl,
  }));
}

export async function getJoinRequestById(
  id: number,
  workspaceId: number,
): Promise<JoinRequest | null> {
  const [row] = await db
    .select()
    .from(workspaceJoinRequests)
    .where(and(eq(workspaceJoinRequests.id, id), eq(workspaceJoinRequests.workspaceId, workspaceId)))
    .limit(1);
  return row ? toJoinRequest(row) : null;
}

export async function getPendingRequestByUser(
  workspaceId: number,
  userId: string,
): Promise<JoinRequest | null> {
  const [row] = await db
    .select()
    .from(workspaceJoinRequests)
    .where(
      and(
        eq(workspaceJoinRequests.workspaceId, workspaceId),
        eq(workspaceJoinRequests.userId, userId),
        eq(workspaceJoinRequests.status, 'PENDING'),
      ),
    )
    .limit(1);
  return row ? toJoinRequest(row) : null;
}

export async function createJoinRequest(
  workspaceId: number,
  userId: string,
  message?: string,
): Promise<JoinRequest> {
  const [row] = await db
    .insert(workspaceJoinRequests)
    .values({ workspaceId, userId, message: message ?? null })
    .returning();
  return toJoinRequest(row);
}

export async function approveJoinRequest(
  reqId: number,
  workspaceId: number,
  reviewerMemberId: number,
  newMemberData: { userId: string; displayName: string },
): Promise<{ joinRequest: JoinRequest; member: typeof members.$inferSelect }> {
  return await db.transaction(async (tx) => {
    const now = new Date();

    const [updatedReq] = await tx
      .update(workspaceJoinRequests)
      .set({ status: 'APPROVED', reviewedBy: reviewerMemberId, reviewedAt: now })
      .where(
        and(eq(workspaceJoinRequests.id, reqId), eq(workspaceJoinRequests.workspaceId, workspaceId)),
      )
      .returning();

    const [newMember] = await tx
      .insert(members)
      .values({
        userId: newMemberData.userId,
        workspaceId,
        displayName: newMemberData.displayName,
        color: pickColor(newMemberData.userId),
        role: 'MEMBER',
        invitedBy: reviewerMemberId,
        joinedAt: now,
      })
      .returning();

    return { joinRequest: toJoinRequest(updatedReq), member: newMember };
  });
}

export async function rejectJoinRequest(
  reqId: number,
  workspaceId: number,
  reviewerMemberId: number,
): Promise<JoinRequest> {
  const [row] = await db
    .update(workspaceJoinRequests)
    .set({ status: 'REJECTED', reviewedBy: reviewerMemberId, reviewedAt: new Date() })
    .where(
      and(eq(workspaceJoinRequests.id, reqId), eq(workspaceJoinRequests.workspaceId, workspaceId)),
    )
    .returning();
  return toJoinRequest(row);
}
