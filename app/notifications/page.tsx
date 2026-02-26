import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { NotificationsPage } from '@/components/notifications/NotificationsPage';

export const metadata = {
  title: '알림 내역 | Tika',
};

export default async function NotificationsRoute() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <NotificationsPage />;
}
