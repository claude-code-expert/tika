import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SettingsShell } from '@/components/settings/SettingsShell';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const workspaceId = (session.user as unknown as Record<string, unknown>).workspaceId as number | null;
  if (!workspaceId) redirect('/onboarding');

  return (
    <Suspense>
      <SettingsShell workspaceId={workspaceId} />
    </Suspense>
  );
}
