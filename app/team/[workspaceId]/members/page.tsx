import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId, getMembersByWorkspace } from '@/db/queries/members';
import { getMemberWorkload } from '@/db/queries/analytics';
import { getBoardData } from '@/db/queries/tickets';
import { TeamShell } from '@/components/layout/TeamShell';
import { WorkloadHeatmap } from '@/components/team/WorkloadHeatmap';
import { MemberDetailCard } from '@/components/team/MemberDetailCard';
import { InviteModalTrigger } from '@/components/team/InviteModalTrigger';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { TeamRole, TicketWithMeta } from '@/types/index';

export default async function TeamMembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId: wsIdStr } = await params;
  const workspaceId = Number(wsIdStr);

  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = (session.user as Record<string, unknown>).id as string;

  const [workspace, currentMember] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
  ]);

  if (!workspace || !currentMember) redirect('/');

  const role = currentMember.role as TeamRole;
  const isOwner = role === 'OWNER';

  const [workload, boardData, allMembers] = await Promise.all([
    getMemberWorkload(workspaceId),
    getBoardData(workspaceId),
    getMembersByWorkspace(workspaceId),
  ]);

  const allTickets = Object.values(boardData.board).flat() as TicketWithMeta[];

  return (
    <TeamShell workspaceId={workspaceId} role={role}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#2C3E50', marginBottom: 4 }}>
              팀 멤버
            </h1>
            <p style={{ fontSize: 13, color: '#8993A4', margin: 0 }}>
              {allMembers.length}명의 멤버
            </p>
          </div>
          {isOwner && <InviteModalTrigger workspaceId={workspaceId} />}
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allMembers.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: '#F9FAFB',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: m.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {m.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{m.displayName}</div>
                  {m.joinedAt && (
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                      {new Date(m.joinedAt).toLocaleDateString('ko-KR')} 가입
                    </div>
                  )}
                </div>
                <RoleBadge role={m.role as TeamRole} size="sm" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </TeamShell>
  );
}
