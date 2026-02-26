import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { GeneralSection } from '@/components/settings/GeneralSection';
import { NotificationSection } from '@/components/settings/NotificationSection';
import { LabelSection } from '@/components/settings/LabelSection';
import { MemberSection } from '@/components/settings/MemberSection';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <SettingsShell
      generalSection={(props) => <GeneralSection {...props} />}
      notificationSection={(props) => <NotificationSection {...props} />}
      labelSection={(props) => <LabelSection {...props} />}
      memberSection={(props) => <MemberSection {...props} />}
    />
  );
}
