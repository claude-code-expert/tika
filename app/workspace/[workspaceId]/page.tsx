import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { getBoardData } from '@/db/queries/tickets';
import { getMemberWorkload, getCfdData } from '@/db/queries/analytics';
import { TeamShell } from '@/components/layout/TeamShell';
import { TrendChart } from '@/components/team/charts/TrendChart';
import { PriorityStatusMatrix } from '@/components/team/charts/PriorityStatusMatrix';
import { DeadlineOverview } from '@/components/team/DeadlineOverview';
import { GoalProgressRow } from '@/components/team/GoalProgressRow';
import { WorkloadHeatmap } from '@/components/team/WorkloadHeatmap';
import { CalendarOff, ClipboardClock, Loader, ListTodo } from 'lucide-react';
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

  const userId = session.user.id as string;

  const [workspace, member, boardData, workload, cfdData] = await Promise.all([
    getWorkspaceById(workspaceId),
    getMemberByUserId(userId, workspaceId),
    getBoardData(workspaceId),
    getMemberWorkload(workspaceId),
    getCfdData(workspaceId, 21), // 3주치 fetch 후 워킹데이만 추출
  ]);

  if (!workspace || !member) {
    redirect('/');
  }

  if (workspace.type === 'PERSONAL') {
    redirect('/');
  }

  const role = member.role as TeamRole;

  const allTickets = Object.values(boardData.board).flat() as TicketWithMeta[];
  const doneTickets = boardData.board.DONE;
  const goalTickets = allTickets.filter((t) => t.type === 'GOAL');
  const overdueTickets = allTickets.filter((t) => t.isOverdue);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const threeDays = new Date(today.getTime() + 3 * 86400000);
  const upcomingTickets = allTickets.filter((t) => {
    if (!t.plannedEndDate || t.isOverdue || t.status === 'DONE') return false;
    const due = new Date(t.plannedEndDate);
    return due >= today && due <= threeDays;
  });

  // Progress rate — status counts for donut
  const progressPct = allTickets.length > 0 ? Math.round((doneTickets.length / allTickets.length) * 100) : 0;
  const statusCounts = {
    done: boardData.board.DONE.length,
    inProgress: boardData.board.IN_PROGRESS.length,
    todo: boardData.board.TODO.length,
    backlog: boardData.board.BACKLOG.length,
  };

  // My tickets (current member)
  const myTickets = allTickets.filter((t) =>
    t.assignees.some((a) => a.id === member.id) || t.assignee?.id === member.id,
  );
  const myTodayDue = myTickets.filter((t) => t.dueDate === todayStr && t.status !== 'DONE');
  const myOverdue = myTickets.filter((t) => t.isOverdue);
  const myInProgress = myTickets.filter((t) => t.status === 'IN_PROGRESS');
  // This week completed
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);
  const myWeekDone = myTickets.filter((t) => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= weekStart);
  // Last week completed (for comparison)
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const myLastWeekDone = myTickets.filter((t) => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= lastWeekStart && new Date(t.completedAt) < weekStart);
  const weekDiff = myWeekDone.length - myLastWeekDone.length;

  // Build priority × status matrix
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const matrix: Record<string, Record<string, number>> = {};
  for (const p of priorities) matrix[p] = {};
  for (const t of allTickets) {
    if (!matrix[t.priority]) matrix[t.priority] = {};
    matrix[t.priority][t.status] = (matrix[t.priority][t.status] ?? 0) + 1;
  }

  // Type distribution & completion rate
  const TYPE_DIST = [
    { key: 'GOAL', label: 'Goal', abbr: 'G', trackBg: '#E0E7FF', fillBg: '#4338CA' },
    { key: 'STORY', label: 'Story', abbr: 'S', trackBg: '#DBEAFE', fillBg: '#1D4ED8' },
    { key: 'FEATURE', label: 'Feature', abbr: 'F', trackBg: '#D1FAE5', fillBg: '#059669' },
    { key: 'TASK', label: 'Task', abbr: 'T', trackBg: '#F3F4F6', fillBg: '#9CA3AF' },
  ] as const;
  const typeDist = TYPE_DIST.map((td) => {
    const items = allTickets.filter((t) => t.type === td.key);
    const done = items.filter((t) => t.status === 'DONE').length;
    return { ...td, total: items.length, done, pct: items.length > 0 ? Math.round((done / items.length) * 100) : 0 };
  });
  const wbsTotal = allTickets.length;

  // Trend data from CFD — 워킹데이(월~금) 기준 최근 7일치
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
    <TeamShell workspaceId={workspaceId} role={role} workspaceName={workspace.name} iconColor={workspace.iconColor}>
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

        {/* Stats grid: 4 stat cards + donut progress */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <StatCard label="전체 티켓" value={allTickets.length} sub={`완료 ${doneTickets.length}`} color="#629584" />
          <StatCard label="기한 초과" value={overdueTickets.length} sub="주의 필요" color={overdueTickets.length > 0 ? '#DC2626' : '#629584'} />
          <StatCard label="이번 주 마감" value={upcomingTickets.length} sub="3일 이내" color="#F59E0B" />
          <StatCard label="목표" value={goalTickets.length} sub={`완료 ${goalTickets.filter((t) => t.status === 'DONE').length}`} color="#8B5CF6" />
          <ProgressCard pct={progressPct} counts={statusCounts} />
        </div>

        {/* 내 업무 현황 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#629584" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#2C3E50', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>내 업무 현황</span>
            <span style={{ fontSize: 12, color: '#8993A4' }}>{member.displayName} · 오늘 기준</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KpiCard
              icon={<CalendarOff size={18} stroke="#629584" />}
              iconBg="#E8F5F0"
              label="오늘 마감"
              value={myTodayDue.length}
              badge={myTodayDue.length > 0 ? { text: '⚠ 주의', type: 'warn' } : { text: '없음', type: 'neutral' }}
              sub="미완료 티켓 포함"
            />
            <KpiCard
              icon={<ClipboardClock size={18} stroke="#DC2626" />}
              iconBg="#FEE2E2"
              label="오버듀"
              value={myOverdue.length}
              valueColor={myOverdue.length > 0 ? '#DC2626' : undefined}
              badge={myOverdue.length > 0 ? { text: '즉시 처리', type: 'down' } : { text: '없음', type: 'neutral' }}
              sub="마감 초과 미완료"
            />
            <KpiCard
              icon={<Loader size={18} stroke="#D97706" />}
              iconBg="#FEF3C7"
              label="진행 중"
              value={myInProgress.length}
              badge={{ text: 'In Progress', type: 'neutral' }}
              sub="WIP 권장: 3개 이하"
            />
            <KpiCard
              icon={<ListTodo size={18} stroke="#065F46" />}
              iconBg="#D1FAE5"
              label="이번 주 완료"
              value={myWeekDone.length}
              badge={weekDiff >= 0 ? { text: `↑ +${weekDiff}`, type: 'up' } : { text: `↓ ${weekDiff}`, type: 'down' }}
              sub="지난 주 대비"
            />
          </div>
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

          {/* Type Distribution & Completion Rate */}
          <Card title="타입별 분포 & 완료율" count={wbsTotal}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {typeDist.map((td) => (
                <div key={td.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 52, height: 22, borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: td.trackBg, color: td.fillBg, flexShrink: 0,
                  }}>{td.label}</span>
                  <span style={{ fontSize: 12, color: '#5A6B7F', width: 32, textAlign: 'right', flexShrink: 0 }}>{td.total}개</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: td.trackBg, overflow: 'hidden' }}>
                    <div style={{ width: `${td.pct}%`, height: '100%', borderRadius: 4, background: td.fillBg, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: td.fillBg, width: 32, textAlign: 'right', flexShrink: 0 }}>{td.pct}%</span>
                </div>
              ))}
            </div>
            {/* Stacked type bar */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#5A6B7F', marginBottom: 8 }}>전체 항목 구성 비율</div>
              <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden' }}>
                {typeDist.filter((td) => td.total > 0).map((td) => {
                  const widthPct = wbsTotal > 0 ? ((td.total / wbsTotal) * 100).toFixed(1) : '0';
                  return (
                    <div key={td.key} style={{
                      width: `${widthPct}%`, background: td.fillBg, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff',
                    }} title={`${td.label} ${td.total}`}>{td.abbr}</div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: '#8993A4' }}>
                {typeDist.map((td) => {
                  const pct = wbsTotal > 0 ? ((td.total / wbsTotal) * 100).toFixed(1) : '0';
                  return (
                    <span key={td.key}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: td.fillBg, marginRight: 3, verticalAlign: 'middle' }} />
                      {td.label} {pct}%
                    </span>
                  );
                })}
              </div>
            </div>
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

function ProgressCard({ pct, counts }: { pct: number; counts: { done: number; inProgress: number; todo: number; backlog: number } }) {
  const total = counts.done + counts.inProgress + counts.todo + counts.backlog;
  const C = 2 * Math.PI * 48; // circumference for r=48
  const doneLen = total > 0 ? (counts.done / total) * C : 0;
  const ipLen = total > 0 ? (counts.inProgress / total) * C : 0;
  const todoLen = total > 0 ? (counts.todo / total) * C : 0;

  const LEGEND = [
    { label: 'Done', color: '#D1FAE5', stroke: '#22C55E', value: counts.done },
    { label: 'In Progress', color: '#FEF3C7', stroke: '#F59E0B', value: counts.inProgress },
    { label: 'TODO', color: '#DBEAFE', stroke: '#3B82F6', value: counts.todo },
    { label: 'Backlog', color: '#F4F5F7', stroke: '#C4C9D1', value: counts.backlog },
  ];

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DFE1E6',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* Donut chart */}
      <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
        <svg viewBox="0 0 120 120" width="88" height="88">
          <circle cx="60" cy="60" r="48" fill="none" stroke="#F4F5F7" strokeWidth="12" />
          {doneLen > 0 && (
            <circle cx="60" cy="60" r="48" fill="none" stroke="#22C55E" strokeWidth="12"
              strokeDasharray={`${doneLen} ${C}`}
              transform="rotate(-90 60 60)" />
          )}
          {ipLen > 0 && (
            <circle cx="60" cy="60" r="48" fill="none" stroke="#F59E0B" strokeWidth="12"
              strokeDasharray={`${ipLen} ${C}`} strokeDashoffset={`${-doneLen}`}
              transform="rotate(-90 60 60)" />
          )}
          {todoLen > 0 && (
            <circle cx="60" cy="60" r="48" fill="none" stroke="#3B82F6" strokeWidth="12"
              strokeDasharray={`${todoLen} ${C}`} strokeDashoffset={`${-(doneLen + ipLen)}`}
              transform="rotate(-90 60 60)" />
          )}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#629584', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: 10, color: '#8993A4', marginTop: 2 }}>완료</span>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 60 }}>
        {LEGEND.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#5A6B7F', minWidth: 120 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.stroke, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ fontWeight: 700, color: '#2C3E50', textAlign: 'right', minWidth: 20 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  up: { bg: '#D1FAE5', color: '#065F46' },
  down: { bg: '#FEE2E2', color: '#DC2626' },
  warn: { bg: '#FEF3C7', color: '#92400E' },
  neutral: { bg: '#F1F3F6', color: '#8993A4' },
};

function KpiCard({
  icon, iconBg, label, value, valueColor, badge, sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  valueColor?: string;
  badge: { text: string; type: string };
  sub: string;
}) {
  const bs = BADGE_STYLES[badge.type] ?? BADGE_STYLES.neutral;
  return (
    <div style={{ background: '#fff', border: '1px solid #DFE1E6', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 6, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 18, height: 18, display: 'inline-flex' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#5A6B7F' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: valueColor ?? '#2C3E50', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>{value}</div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: bs.bg, color: bs.color }}>{badge.text}</span>
      </div>
      <div style={{ fontSize: 11, color: '#8993A4' }}>{sub}</div>
    </div>
  );
}
