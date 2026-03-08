import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getSprintsByWorkspace } from '@/db/queries/sprints';
import { getBurndownData, getVelocityData, getCfdData } from '@/db/queries/analytics';
import { TeamShell } from '@/components/layout/TeamShell';
import { BurndownChartFull } from '@/components/team/charts/BurndownChartFull';
import { VelocityChart } from '@/components/team/charts/VelocityChart';
import { CumulativeFlowDiagram } from '@/components/team/charts/CumulativeFlowDiagram';
import { DailyLogTable } from '@/components/team/charts/DailyLogTable';
import { SprintSelector } from '@/components/team/SprintSelector';
import type { TeamRole } from '@/types/index';

export default async function TeamBurndownPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ sprintId?: string }>;
}) {
  const { workspaceId: wsIdStr } = await params;
  const { sprintId: sprintIdStr } = await searchParams;
  const workspaceId = Number(wsIdStr);

  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id as string;
  const [workspace, member, sprints, velocity, cfd] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
    getSprintsByWorkspace(workspaceId),
    getVelocityData(workspaceId),
    getCfdData(workspaceId, 30),
  ]);
  if (!workspace || !member) redirect('/');

  const role = member.role as TeamRole;
  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const selectedSprintId = sprintIdStr ? Number(sprintIdStr) : activeSprint?.id;
  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);

  const burndownData = selectedSprintId
    ? await getBurndownData(workspaceId, selectedSprintId)
    : [];

  const storyPointsTotal = burndownData.length > 0 ? burndownData[0].remainingPoints : 0;

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name} iconColor={workspace.iconColor}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#2C3E50', marginBottom: 4 }}>
              번다운 차트
            </h1>
            {selectedSprint && (
              <p style={{ fontSize: 13, color: '#8993A4', margin: 0 }}>{selectedSprint.name}</p>
            )}
          </div>
          <SprintSelector sprints={sprints} selectedSprintId={selectedSprintId} workspaceId={workspaceId} basePath="burndown" />
        </div>

        {/* Full burndown chart */}
        <div style={{ background: '#fff', border: '1px solid #DFE1E6', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
          <BurndownChartFull data={burndownData} storyPointsTotal={storyPointsTotal} />
        </div>

        {/* Velocity + CFD side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <Card title="스프린트 벨로시티">
            <VelocityChart sprints={velocity} />
          </Card>
          <Card title="누적 흐름도">
            <CumulativeFlowDiagram data={cfd} />
          </Card>
        </div>

        {/* Daily log */}
        <Card title="일별 로그">
          <DailyLogTable data={cfd} />
        </Card>
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
