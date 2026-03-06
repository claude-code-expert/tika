import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getBoardData } from '@/db/queries/tickets';
import { getMemberWorkload, getCfdData } from '@/db/queries/analytics';
import { getIssuesByWorkspace } from '@/db/queries/issues';
import { TeamShell } from '@/components/layout/TeamShell';
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

  const [boardData, workload, issues] = await Promise.all([
    getBoardData(workspaceId),
    getMemberWorkload(workspaceId),
    getIssuesByWorkspace(workspaceId),
  ]);

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

  // Trend data from CFD — 워킹데이(월~금) 기준 최근 7일치
  const cfdData = await getCfdData(workspaceId, 21); // 3주치 fetch 후 워킹데이만 추출
  const allTrendData = cfdData.map((d, i, arr) => ({
    date: d.date,
    created: i > 0
      ? Math.max(0, (d.backlog + d.todo + d.inProgress + d.done) - (arr[i - 1].backlog + arr[i - 1].todo + arr[i - 1].inProgress + arr[i - 1].done))
      : 0,
    resolved: i > 0 ? Math.max(0, d.done - arr[i - 1].done) : 0,
  }));
  // 워킹데이(월~금)만 필터 후 마지막 7개
  const trendData = allTrendData
    .filter((d) => { const day = new Date(d.date).getDay(); return day !== 0 && day !== 6; })
    .slice(-7);

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name}>
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
          <StatCard label="기한 초과" value={overdueTickets.length} sub="주의 필요" color={overdueTickets.length > 0 ? '#DC2626' : '#629584'} />
          <StatCard label="이번 주 마감" value={upcomingTickets.length} sub="3일 이내" color="#F59E0B" />
          <StatCard label="목표" value={goalTickets.length} sub={`완료 ${goalTickets.filter((t) => t.status === 'DONE').length}`} color="#8B5CF6" />
        </div>

        {/* Main grid: left + right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Trend Chart */}
          <Card title="생성 vs 완료 트렌드">
            <TrendChart data={trendData} />
          </Card>

          {/* Priority × Status Matrix */}
          <Card title="우선순위 × 상태 매트릭스" count={allTickets.length}>
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

function Card({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </div>
        {count !== undefined && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#629584',
              background: '#E8F5F0',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            총 {count}건
          </span>
        )}
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
