import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { NotificationsPage } from '@/components/notifications/NotificationsPage';

export const metadata: Metadata = {
  title: '알림',
  description: '받은 알림을 확인하고 워크스페이스 활동을 파악하세요.',
};

export default async function NotificationsRoute() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <NotificationsPage />;
}
