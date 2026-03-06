import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getIssuesByWorkspace } from '@/db/queries/issues';
import { getBoardData } from '@/db/queries/tickets';
import { TeamShell } from '@/components/layout/TeamShell';
import { GanttChart } from '@/components/team/GanttChart';
import type { GanttItem } from '@/components/team/GanttChart';
import type { TeamRole, TicketWithMeta, Issue } from '@/types/index';

export default async function TeamWbsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId: wsIdStr } = await params;
  const workspaceId = Number(wsIdStr);

  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = (session.user as Record<string, unknown>).id as string;
  const [workspace, member] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
  ]);
  if (!workspace || !member) redirect('/');

  const role = member.role as TeamRole;
  const [issues, boardData] = await Promise.all([
    getIssuesByWorkspace(workspaceId),
    getBoardData(workspaceId),
  ]);

  const allTickets = Object.values(boardData.board).flat() as TicketWithMeta[];

  // Build issue summary stats
  const goalCount = issues.filter((i) => i.type === 'GOAL').length;
  const storyCount = issues.filter((i) => i.type === 'STORY').length;
  const featureCount = issues.filter((i) => i.type === 'FEATURE').length;
  const doneTickets = allTickets.filter((t) => t.status === 'DONE').length;
  const totalTickets = allTickets.length;
  const overallPct = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  // Build GanttItems from issues + tickets
  const ganttItems = buildGanttItems(issues, allTickets);

  // Compute date range from all tickets / issues
  const allDates = allTickets
    .flatMap((t) => [t.startDate, t.dueDate])
    .filter(Boolean) as string[];
  const today = new Date().toISOString().slice(0, 10);
  const minDate = allDates.length > 0 ? allDates.sort()[0] : today;
  const maxDate =
    allDates.length > 0 ? allDates.sort().reverse()[0] : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  // Extend range slightly
  const startDate = new Date(new Date(minDate).getTime() - 3 * 86400000).toISOString().slice(0, 10);
  const endDate = new Date(new Date(maxDate).getTime() + 7 * 86400000).toISOString().slice(0, 10);

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#2C3E50', marginBottom: 4 }}>
            WBS · 간트 차트
          </h1>
          <p style={{ fontSize: 13, color: '#8993A4', margin: 0 }}>{workspace.name}</p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Goal', value: goalCount, color: '#8B5CF6' },
            { label: 'Story', value: storyCount, color: '#3B82F6' },
            { label: 'Feature', value: featureCount, color: '#10B981' },
            { label: '전체 완료율', value: `${overallPct}%`, color: '#629584' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Gantt Chart */}
        <GanttChart items={ganttItems} dateRange={{ start: startDate, end: endDate }} />
      </div>
    </TeamShell>
  );
}

function buildGanttItems(issues: Issue[], tickets: TicketWithMeta[]): GanttItem[] {
  // Map issues to GanttItems (GOAL → STORY → FEATURE hierarchy)
  const issueMap = new Map<number, GanttItem>();

  for (const issue of issues) {
    // Find tickets linked to this issue
    const issueTickets = tickets.filter((t) => t.issueId === issue.id);
    const taskItems: GanttItem[] = issueTickets.map((t) => ({
      id: t.id,
      type: 'TASK',
      name: t.title,
      status: t.status,
      priority: t.priority,
      assignees: t.assignees ?? (t.assignee ? [t.assignee] : []),
      startDate: t.startDate,
      endDate: t.dueDate,
    }));

    issueMap.set(issue.id, {
      id: issue.id,
      type: issue.type as GanttItem['type'],
      name: issue.name,
      status: issueTickets.length > 0 && issueTickets.every((t) => t.status === 'DONE') ? 'DONE' : 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignees: [],
      startDate: null,
      endDate: null,
      children: taskItems,
    });
  }

  // Build tree
  const roots: GanttItem[] = [];
  for (const issue of issues) {
    const node = issueMap.get(issue.id)!;
    if (issue.parentId && issueMap.has(issue.parentId)) {
      issueMap.get(issue.parentId)!.children = [
        ...(issueMap.get(issue.parentId)!.children ?? []),
        node,
      ];
    } else {
      roots.push(node);
    }
  }

  // Include tickets without issues as top-level tasks
  const unlinked = tickets.filter((t) => !t.issueId);
  for (const t of unlinked) {
    roots.push({
      id: t.id,
      type: 'TASK',
      name: t.title,
      status: t.status,
      priority: t.priority,
      assignees: t.assignees ?? (t.assignee ? [t.assignee] : []),
      startDate: t.startDate,
      endDate: t.dueDate,
    });
  }

  return roots;
}
