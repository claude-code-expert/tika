import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getSprintsByWorkspace } from '@/db/queries/sprints';
import { getBoardData } from '@/db/queries/tickets';
import { getMemberWorkload, getBurndownData, getCfdData } from '@/db/queries/analytics';
import { getIssuesByWorkspace } from '@/db/queries/issues';
import { TeamShell } from '@/components/layout/TeamShell';
import { SprintBanner } from '@/components/team/SprintBanner';
import { BurndownChart } from '@/components/team/charts/BurndownChart';
import { ProgressDonut } from '@/components/team/charts/ProgressDonut';
import { TrendChart } from '@/components/team/charts/TrendChart';
import { PriorityStatusMatrix } from '@/components/team/charts/PriorityStatusMatrix';
import { DeadlineOverview } from '@/components/team/DeadlineOverview';
import { GoalProgressRow } from '@/components/team/GoalProgressRow';
import { WbsMiniCard } from '@/components/team/WbsMiniCard';
import { WorkloadHeatmap } from '@/components/team/WorkloadHeatmap';
import type { TeamRole, TicketWithMeta } from '@/types/index';

export default async function TeamDashboardPage({
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

  const userId = (session.user as Record<string, unknown>).id as string;

  const [workspace, member] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
  ]);

  if (!workspace || !member) {
    redirect('/');
  }

  const [sprints, boardData, workload, issues] = await Promise.all([
    getSprintsByWorkspace(workspaceId),
    getBoardData(workspaceId),
    getMemberWorkload(workspaceId),
    getIssuesByWorkspace(workspaceId),
  ]);

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const role = member.role as TeamRole;

  const allTickets = Object.values(boardData.board).flat() as TicketWithMeta[];
  const doneTickets = allTickets.filter((t) => t.status === 'DONE');
  const goalTickets = allTickets.filter((t) => t.type === 'GOAL');
  const overdueTickets = allTickets.filter((t) => t.isOverdue);
  const today = new Date();
  const threeDays = new Date(today.getTime() + 3 * 86400000);
  const upcomingTickets = allTickets.filter((t) => {
    if (!t.dueDate || t.isOverdue || t.status === 'DONE') return false;
    const due = new Date(t.dueDate);
    return due >= today && due <= threeDays;
  });

  // Build priority × status matrix
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const matrix: Record<string, Record<string, number>> = {};
  for (const p of priorities) matrix[p] = {};
  for (const t of allTickets) {
    if (!matrix[t.priority]) matrix[t.priority] = {};
    matrix[t.priority][t.status] = (matrix[t.priority][t.status] ?? 0) + 1;
  }

  // Trend data from CFD (last 7 days)
  const cfdData = await getCfdData(workspaceId, 14);
  const trendData = cfdData.map((d, i, arr) => ({
    date: d.date,
    created: i > 0
      ? Math.max(0, (d.backlog + d.todo + d.inProgress + d.done) - (arr[i - 1].backlog + arr[i - 1].todo + arr[i - 1].inProgress + arr[i - 1].done))
      : 0,
    resolved: i > 0 ? Math.max(0, d.done - arr[i - 1].done) : 0,
  }));

  // Burndown data
  const burndownData = activeSprint ? await getBurndownData(workspaceId, activeSprint.id) : [];
  const sprintTotal = burndownData.length > 0 ? burndownData[0].remainingTickets : 0;
  const sprintDone = activeSprint
    ? allTickets.filter((t) => t.sprintId === activeSprint.id && t.status === 'DONE').length
    : 0;
  const sprintTotal2 = activeSprint
    ? allTickets.filter((t) => t.sprintId === activeSprint.id).length
    : 0;
  const completionPct =
    sprintTotal2 > 0 ? Math.round((sprintDone / sprintTotal2) * 100) : 0;

  const completedPoints = activeSprint
    ? allTickets
        .filter((t) => t.sprintId === activeSprint.id && t.status === 'DONE')
        .reduce((s, t) => s + (t.storyPoints ?? 0), 0)
    : 0;
  const totalPoints = activeSprint
    ? allTickets
        .filter((t) => t.sprintId === activeSprint.id)
        .reduce((s, t) => s + (t.storyPoints ?? 0), 0)
    : 0;

  return (
    <TeamShell workspaceId={workspaceId} role={role}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Page title */}
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#2C3E50',
              marginBottom: 4,
            }}
          >
            {workspace.name}
          </h1>
          {workspace.description && (
            <p style={{ fontSize: 13, color: '#8993A4', margin: 0 }}>{workspace.description}</p>
          )}
        </div>

        {/* Sprint Banner */}
        {activeSprint && (
          <div style={{ marginBottom: 20 }}>
            <SprintBanner
              sprint={activeSprint}
              workspaceId={workspaceId}
              completedTickets={sprintDone}
              totalTickets={sprintTotal2}
              completedPoints={completedPoints}
              totalPoints={totalPoints}
            />
          </div>
        )}

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <StatCard label="전체 티켓" value={allTickets.length} sub={`완료 ${doneTickets.length}`} color="#629584" />
          <StatCard label="스프린트" value={sprints.length} sub={`활성 ${activeSprint ? 1 : 0}`} color="#3B82F6" />
          <StatCard label="기한 초과" value={overdueTickets.length} sub="주의 필요" color={overdueTickets.length > 0 ? '#DC2626' : '#629584'} />
          <StatCard label="스프린트 완료율" value={`${completionPct}%`} sub={activeSprint ? activeSprint.name : '스프린트 없음'} color="#8B5CF6" />
        </div>

        {/* Main grid: left + right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Burndown (mini) */}
          <Card title="번다운 차트">
            <BurndownChart data={burndownData} storyPointsTotal={sprintTotal} />
          </Card>

          {/* Progress Donut + completion % */}
          <Card title="스프린트 진행률">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0' }}>
              <ProgressDonut value={completionPct} label="완료율" size={90} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <StatRow label="완료" value={sprintDone} color="#629584" />
                <StatRow label="진행" value={allTickets.filter((t) => activeSprint && t.sprintId === activeSprint.id && t.status === 'IN_PROGRESS').length} color="#F59E0B" />
                <StatRow label="남은" value={sprintTotal2 - sprintDone} color="#9CA3AF" />
              </div>
            </div>
          </Card>

          {/* Trend Chart */}
          <Card title="생성 vs 완료 트렌드">
            <TrendChart data={trendData} />
          </Card>

          {/* Priority × Status Matrix */}
          <Card title="우선순위 × 상태 매트릭스">
            <PriorityStatusMatrix data={matrix} />
          </Card>

          {/* Deadline Overview */}
          <Card title="마감일 현황">
            <DeadlineOverview overdueTickets={overdueTickets} upcomingTickets={upcomingTickets} />
          </Card>

          {/* Workload Heatmap (compact) */}
          <Card title="멤버 워크로드">
            <WorkloadHeatmap members={workload} compact />
          </Card>

          {/* Goal Progress */}
          <Card title="목표 진행률">
            <GoalProgressRow goals={goalTickets} allTickets={allTickets} />
          </Card>

          {/* WBS Mini Card */}
          <Card title="이슈 계층 (WBS)">
            <WbsMiniCard issues={issues} />
          </Card>
        </div>
      </div>
    </TeamShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DFE1E6',
        borderRadius: 10,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#6B7280',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub: string; color: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DFE1E6',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color, marginLeft: 'auto' }}>{value}</span>
    </div>
  );
}
