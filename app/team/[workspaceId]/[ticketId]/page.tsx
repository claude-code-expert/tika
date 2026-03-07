import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getTicketById } from '@/db/queries/tickets';
import { TeamShell } from '@/components/layout/TeamShell';
import { TicketDetailPage } from '@/components/ticket/TicketDetailPage';
import type { TeamRole } from '@/types/index';

export default async function TicketPage({
  params,
}: {
  params: Promise<{ workspaceId: string; ticketId: string }>;
}) {
  const { workspaceId: wsIdStr, ticketId: ticketIdStr } = await params;
  const workspaceId = Number(wsIdStr);

  // Extract numeric ID from "tika-162" or plain "162"
  const match = ticketIdStr.match(/(\d+)$/);
  if (!match) notFound();
  const ticketId = Number(match[1]);

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
  const ticket = await getTicketById(ticketId, workspaceId);

  if (!ticket) {
    notFound();
  }

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name}>
      <TicketDetailPage
        ticket={ticket}
        workspaceId={workspaceId}
        workspaceName={workspace.name}
        currentMemberId={member.id}
      />
    </TeamShell>
  );
}
