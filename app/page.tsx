import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { db } from '@/db/index';
import { users, members, workspaces } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const metadata: Metadata = {
  title: '로그인',
  description: '티카에 로그인하여 칸반 보드로 업무를 관리하세요.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error('[home] auth() 에러:', err);
  }
  if (!session?.user) redirect('/login');

  const sessionUser = session.user as {
    id?: string;
    userType?: string | null;
    workspaceId?: number | null;
  };

  const userId = sessionUser.id;
  let userType = sessionUser.userType ?? null;

  // JWT may be stale after onboarding — check DB directly to avoid spurious redirect
  if (!userType && userId) {
    const [dbUser] = await db
      .select({ userType: users.userType })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    userType = dbUser?.userType ?? null;
  }

  // Onboarding not completed
  if (!userType) redirect('/onboarding');

  // Route based on primary workspace type
  if (userId) {
    const [primary] = await db
      .select({ workspaceId: members.workspaceId, type: workspaces.type })
      .from(members)
      .innerJoin(workspaces, eq(members.workspaceId, workspaces.id))
      .where(and(eq(members.userId, userId), eq(members.isPrimary, true)))
      .limit(1);

    if (primary?.type === 'TEAM') {
      redirect(`/workspace/${primary.workspaceId}`);
    }
  }

  // Primary is PERSONAL (or no primary set) → render personal board
  return <AppShell />;
}
