import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error('[onboarding] auth() 에러:', err);
  }
  if (!session?.user) redirect('/login');

  const userId = (session.user as { id?: string }).id;
  let userType = (session.user as { userType?: string | null }).userType ?? null;

  // JWT may be stale after update() — check DB directly to avoid sending back to onboarding
  if (userType === null && userId) {
    const [dbUser] = await db
      .select({ userType: users.userType })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    userType = dbUser?.userType ?? null;
  }

  // Already completed onboarding — route to appropriate destination
  if (userType === 'USER') redirect('/');
  if (userType === 'WORKSPACE') redirect('/onboarding/workspace');

  return (
    <OnboardingWizard
      userId={session.user.id ?? ''}
      userName={session.user.name ?? '사용자'}
    />
  );
}
