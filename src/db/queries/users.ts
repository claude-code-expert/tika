import { eq, sql, desc } from 'drizzle-orm';
import { nowKST } from '@/lib/date';
import { db } from '@/db/index';
import { users, members, workspaces } from '@/db/schema';

export async function updateUserBgcolor(userId: string, bgcolor: string): Promise<void> {
  await db.update(users).set({ bgcolor }).where(eq(users.id, userId));
}

/**
 * Check if user is the sole OWNER of any team workspace.
 * Returns workspace names where they are the only OWNER.
 */
export async function getSoleOwnerWorkspaces(userId: string): Promise<string[]> {
  const result = await db.execute<{ name: string }>(sql`
    SELECT w.name
    FROM workspaces w
    JOIN members m ON m.workspace_id = w.id AND m.user_id = ${userId} AND m.role = 'OWNER'
    WHERE w.type = 'TEAM'
      AND (
        SELECT COUNT(*) FROM members m2
        WHERE m2.workspace_id = w.id AND m2.role = 'OWNER'
      ) = 1
  `);
  return result.rows.map((r) => r.name);
}

/**
 * Anonymize user data for account withdrawal.
 * - users: email, name, avatarUrl, bgcolor → anonymized, withdrawnAt set
 * - members: displayName → '탈퇴한 사용자' for all memberships
 */
export async function withdrawUser(userId: string): Promise<void> {
  const now = nowKST();
  const anonymizedEmail = `withdrawn_${now.getTime()}@withdrawn.local`;

  await db.transaction(async (tx) => {
    // 1. Anonymize all member records
    await tx
      .update(members)
      .set({ displayName: '탈퇴한 사용자' })
      .where(eq(members.userId, userId));

    // 2. Anonymize user record
    await tx
      .update(users)
      .set({
        email: anonymizedEmail,
        name: '탈퇴한 사용자',
        avatarUrl: null,
        bgcolor: null,
        withdrawnAt: now,
      })
      .where(eq(users.id, userId));
  });
}

export async function getLandingStats(): Promise<{
  totalUsers: number;
  totalWorkspaces: number;
  recentUsers: { name: string; bgcolor: string | null }[];
}> {
  const [countResult, wsCountResult, recentUsers] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(workspaces),
    db
      .select({ name: users.name, bgcolor: users.bgcolor })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(4),
  ]);
  return {
    totalUsers: countResult[0]?.count ?? 0,
    totalWorkspaces: wsCountResult[0]?.count ?? 0,
    recentUsers,
  };
}
