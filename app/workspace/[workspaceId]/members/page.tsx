import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId, getMembersByWorkspace } from '@/db/queries/members';
import { getMemberWorkload } from '@/db/queries/analytics';
import { getBoardData } from '@/db/queries/tickets';
import { getJoinRequests } from '@/db/queries/joinRequests';
import { TeamShell } from '@/components/layout/TeamShell';
import { WorkloadHeatmap } from '@/components/team/WorkloadHeatmap';
import { MemberDetailCard } from '@/components/team/MemberDetailCard';
import { JoinRequestList } from '@/components/workspace/JoinRequestList';
import { MemberList } from '@/components/team/MemberList';
import { InviteModalTrigger } from '@/components/team/InviteModalTrigger';
import type { TeamRole, TicketWithMeta } from '@/types/index';

export const metadata: Metadata = {
  title: '멤버 관리',
  description: '워크스페이스 멤버를 초대·관리하고 역할 및 권한을 설정하세요.',
};

export default async function TeamMembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId: wsIdStr } = await params;
  const workspaceId = Number(wsIdStr);

  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id as string;

  const [workspace, currentMember, workload, boardData, allMembers] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
    getMemberWorkload(workspaceId),
    getBoardData(workspaceId),
    getMembersByWorkspace(workspaceId),
  ]);

  if (!workspace || !currentMember) redirect('/');
  if (workspace.type === 'PERSONAL') redirect('/');

  const role = currentMember.role as TeamRole;
  if (role === 'VIEWER') redirect(`/workspace/${workspaceId}`);
  const isOwner = role === 'OWNER';

  const joinRequests = isOwner ? await getJoinRequests(workspaceId) : [];

  const allTickets = Object.values(boardData.board).flat() as TicketWithMeta[];

  const totalAssigned = workload.reduce((s, m) => s + m.assigned, 0);
  const totalDone     = workload.reduce((s, m) => s + m.completed, 0);
  const completionPct = totalAssigned > 0 ? Math.round(totalDone / totalAssigned * 100) : 0;
  const totalWorkday  = totalAssigned * 2;

  const summaryStats = [
    { value: String(workload.length),    label: '워크스페이스 멤버', color: '#2C3E50', bg: 'var(--color-dash-red)'   },
    { value: String(totalAssigned),      label: '총 할당 티켓',      color: '#2C3E50', bg: 'var(--color-dash-blue)'  },
    { value: String(totalDone),          label: '완료 티켓',         color: '#629584', bg: 'var(--color-dash-mint)'  },
    { value: `${totalWorkday}d`,         label: '총 Workday',        color: '#F59E0B', bg: 'var(--color-dash-green)' },
    { value: `${completionPct}%`,        label: '팀 완료율',         color: '#629584', bg: 'var(--color-dash-pink)'  },
  ];

  return (
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name} iconColor={workspace.iconColor}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#2C3E50', marginBottom: 4 }}>
              워크스페이스 멤버
            </h1>
            <p style={{ fontSize: 13, color: '#8993A4', margin: 0 }}>
              {allMembers.length}명의 멤버
            </p>
          </div>
          {isOwner && <InviteModalTrigger workspaceId={workspaceId} />}
        </div>

        {/* Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
          {summaryStats.map((s) => (
            <div
              key={s.label}
              style={{ background: s.bg, border: '1px solid #DFE1E6', borderRadius: 10, padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}
            >
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#8993A4', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Workload heatmap */}
        <section
          style={{
            background: '#fff',
            border: '1px solid #DFE1E6',
            borderRadius: 10,
            padding: '16px 18px',
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            워크로드 현황
          </div>
          <WorkloadHeatmap members={workload} />
        </section>

        {/* Member cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}
        >
          {workload.map((m) => (
            <MemberDetailCard key={m.memberId} member={m} tickets={allTickets} />
          ))}
        </div>

        {/* Member list with role badges */}
        <section
          style={{
            background: '#fff',
            border: '1px solid #DFE1E6',
            borderRadius: 10,
            padding: '16px 18px',
            marginTop: 24,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            멤버 목록
          </div>
          <MemberList
            members={allMembers}
            currentMemberId={currentMember.id}
            isOwner={isOwner}
            workspaceName={workspace.name}
            workspaceId={workspaceId}
          />
        </section>

        {/* Join requests — OWNER only */}
        {isOwner && (
          <JoinRequestList workspaceId={workspaceId} initialRequests={joinRequests} />
        )}
      </div>
    </TeamShell>
  );
}
