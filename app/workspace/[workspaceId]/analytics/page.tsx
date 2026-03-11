import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getSprintsByWorkspace } from '@/db/queries/sprints';
import { getBoardData } from '@/db/queries/tickets';
import {
  getVelocityData,
  getCfdData,
  getCycleTimeData,
  getLabelAnalytics,
  getBurndownData,
} from '@/db/queries/analytics';
import { TeamShell } from '@/components/layout/TeamShell';
import { BurndownChart } from '@/components/team/charts/BurndownChart';
import { CumulativeFlowDiagram } from '@/components/team/charts/CumulativeFlowDiagram';
import { VelocityChart } from '@/components/team/charts/VelocityChart';
import { CycleTimeAnalysis } from '@/components/team/charts/CycleTimeAnalysis';
import { TypeDistributionChart } from '@/components/team/charts/TypeDistributionChart';
import { LabelAnalyticsCard } from '@/components/team/charts/LabelAnalyticsCard';
import { DailyLogTable } from '@/components/team/charts/DailyLogTable';
import { StoryScheduleTable } from '@/components/team/charts/StoryScheduleTable';
import type { TeamRole, TicketWithMeta } from '@/types/index';

export default async function TeamAnalyticsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId: wsIdStr } = await params;
  const workspaceId = Number(wsIdStr);

  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id as string;
  const [workspace, member, sprints, boardData, velocity, cfd, cycleTime, labelAnalytics] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
    getSprintsByWorkspace(workspaceId),
    getBoardData(workspaceId),
    getVelocityData(workspaceId),
    getCfdData(workspaceId, 30),
    getCycleTimeData(workspaceId),
    getLabelAnalytics(workspaceId),
  ]);
  if (!workspace || !member) redirect('/');
  if (workspace.type === 'PERSONAL') redirect('/');

  const role = member.role as TeamRole;

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const burndownData = activeSprint ? await getBurndownData(workspaceId, activeSprint.id) : [];

  const allTickets = Object.values(boardData.board).flat() as TicketWithMeta[];
  const total = allTickets.length;

  // Sprint summary stats
  const completedSprints = sprints.filter((s) => s.status === 'COMPLETED').length;
  const doneTickets = allTickets.filter((t) => t.status === 'DONE').length;
  const completionRate = total > 0 ? Math.round((doneTickets / total) * 100) : 0;

  // Type distribution
  const typeCounts: Record<string, number> = {};
  for (const t of allTickets) {
    typeCounts[t.type] = (typeCounts[t.type] ?? 0) + 1;
  }
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

  // Cycle time stats
  const totalSamples = cycleTime.reduce((s, d) => s + d.count, 0);
  const avgCycleTime =
    totalSamples > 0
      ? Math.round(
          (cycleTime.reduce((s, d) => s + d.days * d.count, 0) / totalSamples) * 10,
        ) / 10
      : 0;
  const sorted = [...cycleTime].sort((a, b) => a.days - b.days);
  let cumulative = 0;
  let medianCycleTime = 0;
  const mid = Math.ceil(totalSamples / 2);
  for (const d of sorted) {
    cumulative += d.count;
    if (cumulative >= mid) {
      medianCycleTime = d.days;
      break;
    }
  }

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name} iconColor={workspace.iconColor}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#2C3E50', marginBottom: 4 }}>
            분석
          </h1>
          <p style={{ fontSize: 13, color: '#8993A4', margin: 0 }}>{workspace.name}</p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <MiniStat label="완료 티켓" value={doneTickets} total={total} color="#629584" />
          <MiniStat label="완료율" value={`${completionRate}%`} color="#3B82F6" />
          <MiniStat label="완료 스프린트" value={completedSprints} color="#8B5CF6" />
          <MiniStat label="평균 사이클" value={`${avgCycleTime}일`} color="#F59E0B" />
        </div>

        {/* Charts 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <Card title="번다운 차트 (현재 스프린트)">
            <BurndownChart data={burndownData} storyPointsTotal={burndownData[0]?.remainingPoints ?? 0} />
          </Card>
          <Card title="누적 흐름도 (30일)">
            <CumulativeFlowDiagram data={cfd} />
          </Card>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Card title="스프린트 벨로시티">
            <VelocityChart sprints={velocity} />
          </Card>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Card title="일별 로그">
            <DailyLogTable data={cfd} />
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <Card title="사이클 타임 분포">
            <CycleTimeAnalysis distribution={cycleTime} average={avgCycleTime} median={medianCycleTime} />
          </Card>
          <Card title="티켓 유형 분포">
            <TypeDistributionChart data={typeData} />
          </Card>
        </div>

        <Card title="라벨 분석">
          <LabelAnalyticsCard labels={labelAnalytics} />
        </Card>

        <div style={{ marginTop: 20 }}>
          <Card title="Story 진행 현황">
            <StoryScheduleTable
              stories={allTickets.filter((t) => t.type === 'STORY')}
              allTickets={allTickets}
            />
          </Card>
        </div>
      </div>
    </TeamShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #DFE1E6', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, total, color }: { label: string; value: number | string; total?: number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #DFE1E6', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 2 }}>{label}</div>
      {total !== undefined && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>전체 {total}</div>}
    </div>
  );
}
