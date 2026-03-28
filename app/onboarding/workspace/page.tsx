import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function WorkspaceOnboardingPage() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error('[onboarding/workspace] auth() 에러:', err);
  }
  if (!session?.user) redirect('/login');

  const userId = (session.user as { id?: string }).id;
  let userType = (session.user as { userType?: string | null }).userType ?? null;

  // JWT may be stale — check DB directly
  if (userType === null && userId) {
    const [dbUser] = await db
      .select({ userType: users.userType })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    userType = dbUser?.userType ?? null;
  }

  // Onboarding complete — go home (app/page.tsx handles routing to personal/team board)
  if (userType !== null) redirect('/');

  // Onboarding not started — go to unified onboarding page
  redirect('/onboarding');
}
