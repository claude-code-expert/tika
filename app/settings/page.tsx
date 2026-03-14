import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { getMemberByUserId } from '@/db/queries/members';
import type { TeamRole } from '@/types/index';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const workspaceId = (session.user as unknown as Record<string, unknown>).workspaceId as number | null;
  if (!workspaceId) redirect('/onboarding');

  const member = await getMemberByUserId(session.user.id!, workspaceId);
  const role: TeamRole = (member?.role as TeamRole) ?? 'VIEWER';

  return (
    <Suspense>
      <SettingsShell workspaceId={workspaceId} role={role} />
    </Suspense>
  );
}
