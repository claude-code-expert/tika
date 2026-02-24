import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error('[home] auth() 에러:', err);
  }
  if (!session?.user) redirect('/login');

  return <AppShell />;
}
