import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { db } from '@/db/index';
import { users, members, workspaces } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

  let userType = sessionUser.userType ?? null;
  const userId = sessionUser.id;

  // JWT may be stale immediately after onboarding type selection (update() timing).
  // Fall back to a direct DB lookup when userType is null to avoid spurious /onboarding redirect.
  if (userType === null && userId) {
    const [dbUser] = await db
      .select({ userType: users.userType })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    userType = dbUser?.userType ?? null;
  }

  // Onboarding not completed: route to wizard
  if (userType === null) {
    redirect('/onboarding');
  }

  // Workspace user: route to first team workspace or workspace onboarding
  if (userType === 'WORKSPACE' && userId) {
    const [membership] = await db
      .select({ workspaceId: members.workspaceId })
      .from(members)
      .innerJoin(workspaces, eq(members.workspaceId, workspaces.id))
      .where(and(eq(members.userId, userId), eq(workspaces.type, 'TEAM')))
      .limit(1);

    if (membership) {
      redirect(`/team/${membership.workspaceId}`);
    } else {
      redirect('/onboarding/workspace');
    }
  }

  // USER type: render personal board
  return <AppShell />;
}
