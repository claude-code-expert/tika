import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { WorkspaceOnboarding } from '@/components/onboarding/WorkspaceOnboarding';
import { db } from '@/db/index';
import { members, workspaces } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function WorkspaceOnboardingPage() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error('[onboarding/workspace] auth() 에러:', err);
  }
  if (!session?.user) redirect('/login');

  const sessionUser = session.user as {
    id?: string;
    userType?: string | null;
  };

  const userType = sessionUser.userType ?? null;
  const userId = sessionUser.id;

  // Personal users don't belong here
  if (userType === 'USER') redirect('/');

  // If already has a team workspace, go there directly
  if (userType === 'WORKSPACE' && userId) {
    const [membership] = await db
      .select({ workspaceId: members.workspaceId })
      .from(members)
      .innerJoin(workspaces, eq(members.workspaceId, workspaces.id))
      .where(and(eq(members.userId, userId), eq(workspaces.type, 'TEAM')))
      .limit(1);

    if (membership) {
      redirect(`/team/${membership.workspaceId}`);
    }
  }

  return (
    <WorkspaceOnboarding
      userId={userId ?? ''}
      userName={(session.user as { name?: string | null }).name ?? '사용자'}
    />
  );
}
