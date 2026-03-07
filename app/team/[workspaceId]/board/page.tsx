import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getBoardData } from '@/db/queries/tickets';
import { TeamShell } from '@/components/layout/TeamShell';
import { TeamBoardClient } from '@/components/team/TeamBoardClient';
import type { TeamRole } from '@/types/index';

export default async function TeamBoardPage({
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

  const role = member.role as TeamRole;
  const boardData = await getBoardData(workspaceId);

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name}>
      <TeamBoardClient
        initialData={boardData}
        workspaceId={workspaceId}
        currentMemberId={member.id}
      />
    </TeamShell>
  );
}
