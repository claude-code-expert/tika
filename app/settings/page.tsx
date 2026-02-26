import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SettingsShell } from '@/components/settings/SettingsShell';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <SettingsShell />;
}
