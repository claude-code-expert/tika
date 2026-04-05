import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getDeletedTickets } from '@/db/queries/tickets';
import { TeamShell } from '@/components/layout/TeamShell';
import { TrashClient } from '@/components/team/TrashClient';
import type { TeamRole } from '@/types/index';

export const metadata: Metadata = {
  title: '휴지통',
  description: '삭제된 티켓을 30일 이내 복원하거나 영구 삭제하세요.',
};

export default async function TrashPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId: wsIdStr } = await params;
  const workspaceId = Number(wsIdStr);

  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as unknown as Record<string, unknown>).id as string;

  const [workspace, member] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
  ]);

  if (!workspace || !member) {
    redirect('/');
  }

  if (workspace.type === 'PERSONAL') {
    redirect('/');
  }

  const role = member.role as TeamRole;
  const deletedTickets = await getDeletedTickets(workspaceId);

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name} iconColor={workspace.iconColor}>
      <TrashClient initialTickets={deletedTickets} />
    </TeamShell>
  );
}
