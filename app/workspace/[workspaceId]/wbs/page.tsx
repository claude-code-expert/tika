import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getWbsTickets } from '@/db/queries/tickets';
import { TeamShell } from '@/components/layout/TeamShell';
import { WbsClient } from '@/components/team/WbsClient';
import type { GanttItem } from '@/components/team/GanttChart';
import type { TeamRole, TicketWithMeta } from '@/types/index';

export default async function TeamWbsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId: wsIdStr } = await params;
  const workspaceId = Number(wsIdStr);

  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id as string;
  const [workspace, member, wbsTickets] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
    getWbsTickets(workspaceId),
  ]);
  if (!workspace || !member) redirect('/');
  if (workspace.type === 'PERSONAL') redirect('/');

  const role = member.role as TeamRole;

  const goalCount    = wbsTickets.filter((t) => t.type === 'GOAL').length;
  const storyCount   = wbsTickets.filter((t) => t.type === 'STORY').length;
  const featureCount = wbsTickets.filter((t) => t.type === 'FEATURE').length;
  const taskCount    = wbsTickets.filter((t) => t.type === 'TASK').length;
  const totalTickets = wbsTickets.length;
  const doneTickets  = wbsTickets.filter((t) => t.status === 'DONE').length;
  const overallPct   = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  const ganttItems = buildGanttItems(wbsTickets);

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name} iconColor={workspace.iconColor}>
      <WbsClient
        allItems={ganttItems}
        allTickets={wbsTickets}
        stats={{ goal: goalCount, story: storyCount, feature: featureCount, task: taskCount, overallPct }}
        currentMemberId={member.id}
        workspaceName={workspace.name}
        readOnly={role === 'VIEWER'}
      />
    </TeamShell>
  );
}

function buildGanttItems(wbsTickets: TicketWithMeta[]): GanttItem[] {
  const map = new Map<number, GanttItem>();

  for (const t of wbsTickets) {
    map.set(t.id, {
      id: t.id,
      type: t.type,
      name: t.title,
      status: t.status,
      priority: t.priority,
      assignees: t.assignees,
      startDate: t.plannedStartDate ?? null,
      endDate: t.plannedEndDate ?? null,
      children: [],
    });
  }

  const roots: GanttItem[] = [];
  for (const t of wbsTickets) {
    const node = map.get(t.id)!;
    if (t.parentId && map.has(t.parentId)) {
      map.get(t.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
