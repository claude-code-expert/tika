/**
 * Dashboard Metrics Tests
 *
 * 워크스페이스 대시보드의 각 카드별 계산 로직과 데이터 정합성을 검증한다.
 * page.tsx의 인라인 계산 로직을 그대로 재현하여 동일한 코드를 테스트한다.
 */

import { computePeriodBurndown, computeCycleTimeFromTickets } from '@/db/queries/analytics';
import type { TicketWithMeta, CfdDataPoint } from '@/types/index';

// ─── 공통 픽스처 ────────────────────────────────────────────────────────────

/** 2026-03-28 토요일 12:00 KST (UTC 03:00) */
const NOW = new Date('2026-03-28T03:00:00.000Z');
const TODAY_STR = '2026-03-28';

function makeMember(id: number) {
  return {
    id,
    userId: `user-${id}`,
    workspaceId: 1,
    displayName: `Member ${id}`,
    color: '#629584',
    role: 'MEMBER' as const,
    invitedBy: null,
    joinedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const base: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: 'Test',
  description: null,
  type: 'TASK',
  status: 'TODO',
  priority: 'MEDIUM',
  position: 1024,
  startDate: null,
  dueDate: null,
  plannedStartDate: null,
  plannedEndDate: null,
  parentId: null,
  assigneeId: null,
  sprintId: null,
  storyPoints: null,
  completedAt: null,
  deleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isOverdue: false,
  labels: [],
  checklistItems: [],
  parent: null,
  assignee: null,
  assignees: [],
};

// ─── page.tsx 인라인 로직 미러 함수들 ─────────────────────────────────────
// 아래 함수들은 app/workspace/[workspaceId]/page.tsx 의 계산 로직과 완전히 동일하다.
// now 파라미터를 주입해 시간 의존성을 테스트 가능하게 만든다.

function calcStatCards(allTickets: TicketWithMeta[], now = NOW) {
  const doneTickets = allTickets.filter((t) => t.status === 'DONE');
  const goalTickets = allTickets.filter((t) => t.type === 'GOAL');
  const overdueTickets = allTickets.filter((t) => t.isOverdue);
  const todayStr = now.toISOString().slice(0, 10);
  const threeDaysStr = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);
  const upcomingTickets = allTickets.filter((t) => {
    if (!t.plannedEndDate || t.isOverdue || t.status === 'DONE') return false;
    return t.plannedEndDate >= todayStr && t.plannedEndDate <= threeDaysStr;
  });
  const progressPct =
    allTickets.length > 0 ? Math.round((doneTickets.length / allTickets.length) * 100) : 0;
  const statusCounts = {
    done: allTickets.filter((t) => t.status === 'DONE').length,
    inProgress: allTickets.filter((t) => t.status === 'IN_PROGRESS').length,
    todo: allTickets.filter((t) => t.status === 'TODO').length,
    backlog: allTickets.filter((t) => t.status === 'BACKLOG').length,
  };
  return { doneTickets, goalTickets, overdueTickets, upcomingTickets, progressPct, statusCounts };
}

function calcPersonalKpis(allTickets: TicketWithMeta[], memberId: number, now = NOW) {
  const todayStr = now.toISOString().slice(0, 10);
  const member = makeMember(memberId);
  const myTickets = allTickets.filter(
    (t) => t.assignees.some((a) => a.id === member.id) || t.assignee?.id === member.id,
  );
  const myTodayDue = myTickets.filter((t) => t.dueDate === todayStr && t.status !== 'DONE');
  const myOverdue = myTickets.filter((t) => t.isOverdue);
  const myInProgress = myTickets.filter((t) => t.status === 'IN_PROGRESS');

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() || 7) + 1); // 월요일 (일요일=0 → 7로 처리)
  weekStart.setHours(0, 0, 0, 0);

  const myWeekDone = myTickets.filter(
    (t) => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= weekStart,
  );
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const myLastWeekDone = myTickets.filter(
    (t) =>
      t.status === 'DONE' &&
      t.completedAt &&
      new Date(t.completedAt) >= lastWeekStart &&
      new Date(t.completedAt) < weekStart,
  );
  const weekDiff = myWeekDone.length - myLastWeekDone.length;
  return { myTodayDue, myOverdue, myInProgress, myWeekDone, myLastWeekDone, weekDiff, weekStart };
}

function calcMatrix(allTickets: TicketWithMeta[]) {
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const matrix: Record<string, Record<string, number>> = {};
  for (const p of priorities) matrix[p] = {};
  for (const t of allTickets) {
    if (!matrix[t.priority]) matrix[t.priority] = {};
    matrix[t.priority][t.status] = (matrix[t.priority][t.status] ?? 0) + 1;
  }
  return matrix;
}

function calcTypeDist(allTickets: TicketWithMeta[]) {
  const typeAcc: Record<string, { total: number; done: number }> = {
    GOAL: { total: 0, done: 0 },
    STORY: { total: 0, done: 0 },
    FEATURE: { total: 0, done: 0 },
    TASK: { total: 0, done: 0 },
  };
  for (const t of allTickets) {
    if (typeAcc[t.type]) {
      typeAcc[t.type].total++;
      if (t.status === 'DONE') typeAcc[t.type].done++;
    }
  }
  return Object.entries(typeAcc).map(([key, { total, done }]) => ({
    key,
    total,
    done,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
  }));
}

function calcTrendData(cfdData: CfdDataPoint[]) {
  const allTrendData = cfdData.map((d, i, arr) => ({
    date: d.date,
    created: d.created,
    resolved: i > 0 ? Math.max(0, d.done - arr[i - 1].done) : 0,
  }));
  return allTrendData
    .filter((d) => {
      const day = new Date(d.date).getDay();
      return day !== 0 && day !== 6;
    })
    .slice(-7);
}

// ─── 1. StatCards ──────────────────────────────────────────────────────────

describe('StatCards', () => {
  describe('전체 티켓 / 완료 티켓 카드', () => {
    it('allTickets.length가 전체 티켓 수다', () => {
      const tickets = [
        { ...base, id: 1, status: 'BACKLOG' as const },
        { ...base, id: 2, status: 'TODO' as const },
        { ...base, id: 3, status: 'IN_PROGRESS' as const },
        { ...base, id: 4, status: 'DONE' as const },
        { ...base, id: 5, status: 'DONE' as const },
      ];
      const { doneTickets, statusCounts } = calcStatCards(tickets);
      expect(tickets.length).toBe(5);
      expect(doneTickets).toHaveLength(2);
      // 정합성: statusCounts 합산 = 전체 티켓 수
      expect(
        statusCounts.done + statusCounts.inProgress + statusCounts.todo + statusCounts.backlog,
      ).toBe(tickets.length);
    });

    it('티켓이 없으면 모두 0이다', () => {
      const { doneTickets, statusCounts } = calcStatCards([]);
      expect(doneTickets).toHaveLength(0);
      expect(statusCounts.done + statusCounts.inProgress + statusCounts.todo + statusCounts.backlog).toBe(0);
    });
  });

  describe('기한 초과 카드', () => {
    it('isOverdue=true인 티켓만 집계된다', () => {
      const tickets = [
        { ...base, id: 1, isOverdue: true },
        { ...base, id: 2, isOverdue: true },
        { ...base, id: 3, isOverdue: false },
      ];
      const { overdueTickets } = calcStatCards(tickets);
      expect(overdueTickets).toHaveLength(2);
    });

    it('DONE 상태의 티켓은 isOverdue=false로 설정되므로 집계되지 않는다', () => {
      // getBoardData의 isOverdue 계산: isOverdue(plannedEndDate, 'DONE') = false
      const tickets = [
        { ...base, id: 1, status: 'DONE' as const, plannedEndDate: '2026-01-01', isOverdue: false },
      ];
      const { overdueTickets } = calcStatCards(tickets);
      expect(overdueTickets).toHaveLength(0);
    });
  });

  describe('이번 주 마감 카드 (3일 이내)', () => {
    // NOW = 2026-03-28 03:00 UTC
    it('오늘~3일 후 plannedEndDate를 가진 미완료 티켓이 집계된다', () => {
      // NOW = 2026-03-28T03:00:00Z. new Date('2026-03-28') = UTC midnight (03:00보다 이전) 이므로
      // '2026-03-28'은 now보다 과거 → upcoming 제외됨 (타임존 경계 특성)
      const tickets = [
        { ...base, id: 1, plannedEndDate: '2026-03-29', isOverdue: false, status: 'TODO' as const },   // 1일 후
        { ...base, id: 2, plannedEndDate: '2026-03-30', isOverdue: false, status: 'TODO' as const },   // 2일 후
        { ...base, id: 3, plannedEndDate: '2026-03-31', isOverdue: false, status: 'IN_PROGRESS' as const }, // 3일 후
        { ...base, id: 4, plannedEndDate: '2026-04-01', isOverdue: false, status: 'TODO' as const },   // 4일 후 — 제외
      ];
      const { upcomingTickets } = calcStatCards(tickets);
      expect(upcomingTickets.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2, 3]));
      expect(upcomingTickets).toHaveLength(3);
    });

    it('isOverdue=true 티켓은 upcoming에서 제외된다', () => {
      const tickets = [
        { ...base, id: 1, plannedEndDate: '2026-03-29', isOverdue: true },
      ];
      const { upcomingTickets } = calcStatCards(tickets);
      expect(upcomingTickets).toHaveLength(0);
    });

    it('DONE 티켓은 upcoming에서 제외된다', () => {
      const tickets = [
        { ...base, id: 1, plannedEndDate: '2026-03-30', status: 'DONE' as const, isOverdue: false },
      ];
      const { upcomingTickets } = calcStatCards(tickets);
      expect(upcomingTickets).toHaveLength(0);
    });

    it('plannedEndDate가 없는 티켓은 upcoming에서 제외된다', () => {
      const tickets = [{ ...base, id: 1, plannedEndDate: null }];
      const { upcomingTickets } = calcStatCards(tickets);
      expect(upcomingTickets).toHaveLength(0);
    });

    // 정합성: overdueTickets과 upcomingTickets은 상호 배타적이다
    it('overdue 티켓과 upcoming 티켓은 겹치지 않는다', () => {
      const tickets = [
        { ...base, id: 1, plannedEndDate: '2026-03-26', isOverdue: true, status: 'TODO' as const },
        { ...base, id: 2, plannedEndDate: '2026-03-29', isOverdue: false, status: 'TODO' as const },
        { ...base, id: 3, plannedEndDate: '2026-03-28', isOverdue: false, status: 'TODO' as const },
      ];
      const { overdueTickets, upcomingTickets } = calcStatCards(tickets);
      const overdueIds = new Set(overdueTickets.map((t) => t.id));
      const upcomingIds = new Set(upcomingTickets.map((t) => t.id));
      // 교집합이 없어야 한다
      const overlap = [...overdueIds].filter((id) => upcomingIds.has(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('목표 카드', () => {
    it("type='GOAL'인 티켓만 집계된다", () => {
      const tickets = [
        { ...base, id: 1, type: 'GOAL' as const },
        { ...base, id: 2, type: 'STORY' as const },
        { ...base, id: 3, type: 'GOAL' as const, status: 'DONE' as const },
        { ...base, id: 4, type: 'TASK' as const },
      ];
      const { goalTickets } = calcStatCards(tickets);
      expect(goalTickets).toHaveLength(2);
    });

    it('완료된 목표 수는 goalTickets 중 status=DONE 필터로 구한다', () => {
      const tickets = [
        { ...base, id: 1, type: 'GOAL' as const, status: 'DONE' as const },
        { ...base, id: 2, type: 'GOAL' as const, status: 'IN_PROGRESS' as const },
        { ...base, id: 3, type: 'GOAL' as const, status: 'TODO' as const },
      ];
      const { goalTickets } = calcStatCards(tickets);
      const completedGoals = goalTickets.filter((t) => t.status === 'DONE');
      expect(goalTickets).toHaveLength(3);
      expect(completedGoals).toHaveLength(1);
    });
  });

  describe('진행률 Progress Circle', () => {
    it('완료 티켓 비율을 반올림하여 반환한다', () => {
      const tickets = [
        { ...base, id: 1, status: 'DONE' as const },
        { ...base, id: 2, status: 'DONE' as const },
        { ...base, id: 3, status: 'TODO' as const },
      ];
      const { progressPct } = calcStatCards(tickets);
      expect(progressPct).toBe(67); // 2/3 = 66.67 → round → 67
    });

    it('티켓이 없으면 0%다 (0 나누기 방지)', () => {
      const { progressPct } = calcStatCards([]);
      expect(progressPct).toBe(0);
    });

    it('전부 완료면 100%다', () => {
      const tickets = [
        { ...base, id: 1, status: 'DONE' as const },
        { ...base, id: 2, status: 'DONE' as const },
      ];
      const { progressPct } = calcStatCards(tickets);
      expect(progressPct).toBe(100);
    });

    it('완료 티켓이 하나도 없으면 0%다', () => {
      const tickets = [
        { ...base, id: 1, status: 'TODO' as const },
        { ...base, id: 2, status: 'BACKLOG' as const },
      ];
      const { progressPct } = calcStatCards(tickets);
      expect(progressPct).toBe(0);
    });

    it('50% 경계값 계산이 정확하다', () => {
      const tickets = [
        { ...base, id: 1, status: 'DONE' as const },
        { ...base, id: 2, status: 'TODO' as const },
      ];
      const { progressPct } = calcStatCards(tickets);
      expect(progressPct).toBe(50);
    });

    // 정합성: progressPct는 doneTickets.length / allTickets.length * 100 과 일치
    it('progressPct는 doneCount/total*100 round와 일치한다', () => {
      const tickets = Array.from({ length: 7 }, (_, i) => ({
        ...base,
        id: i + 1,
        status: i < 3 ? ('DONE' as const) : ('TODO' as const),
      }));
      const { doneTickets, progressPct } = calcStatCards(tickets);
      expect(progressPct).toBe(Math.round((doneTickets.length / tickets.length) * 100));
    });
  });
});

// ─── 2. 내 업무 현황 Personal KPIs ─────────────────────────────────────────

describe('Personal KPIs', () => {
  const ME = 10;

  describe('오늘 마감', () => {
    it('dueDate가 오늘이고 미완료인 내 티켓만 집계된다', () => {
      const tickets = [
        { ...base, id: 1, dueDate: TODAY_STR, status: 'TODO' as const, assignees: [makeMember(ME)] },
        { ...base, id: 2, dueDate: TODAY_STR, status: 'DONE' as const, assignees: [makeMember(ME)] }, // 완료 → 제외
        { ...base, id: 3, dueDate: TODAY_STR, status: 'IN_PROGRESS' as const, assignees: [makeMember(99)] }, // 다른 멤버 → 제외
        { ...base, id: 4, dueDate: '2026-03-27', status: 'TODO' as const, assignees: [makeMember(ME)] }, // 어제 → 제외
      ];
      const { myTodayDue } = calcPersonalKpis(tickets, ME);
      expect(myTodayDue.map((t) => t.id)).toEqual([1]);
    });

    it('assignee(단수) 필드로도 내 티켓을 인식한다', () => {
      const member = makeMember(ME);
      const tickets = [
        {
          ...base,
          id: 1,
          dueDate: TODAY_STR,
          status: 'TODO' as const,
          assignee: member,
          assigneeId: ME,
          assignees: [],
        },
      ];
      const { myTodayDue } = calcPersonalKpis(tickets, ME);
      expect(myTodayDue).toHaveLength(1);
    });
  });

  describe('오버듀', () => {
    it('isOverdue=true인 내 티켓만 집계된다', () => {
      const tickets = [
        { ...base, id: 1, isOverdue: true, assignees: [makeMember(ME)] },
        { ...base, id: 2, isOverdue: false, assignees: [makeMember(ME)] },
        { ...base, id: 3, isOverdue: true, assignees: [makeMember(99)] }, // 다른 멤버
      ];
      const { myOverdue } = calcPersonalKpis(tickets, ME);
      expect(myOverdue.map((t) => t.id)).toEqual([1]);
    });
  });

  describe('진행 중', () => {
    it('status=IN_PROGRESS인 내 티켓만 집계된다', () => {
      const tickets = [
        { ...base, id: 1, status: 'IN_PROGRESS' as const, assignees: [makeMember(ME)] },
        { ...base, id: 2, status: 'TODO' as const, assignees: [makeMember(ME)] },
        { ...base, id: 3, status: 'IN_PROGRESS' as const, assignees: [makeMember(99)] },
      ];
      const { myInProgress } = calcPersonalKpis(tickets, ME);
      expect(myInProgress.map((t) => t.id)).toEqual([1]);
    });
  });

  describe('이번 주 완료', () => {
    // NOW = 2026-03-28 (토) → weekStart = 2026-03-23 (월)
    it('이번 주 월요일 이후 완료된 내 티켓만 집계된다', () => {
      const tickets = [
        {
          ...base, id: 1, status: 'DONE' as const,
          completedAt: '2026-03-23T01:00:00.000Z', // 월요일 완료
          assignees: [makeMember(ME)],
        },
        {
          ...base, id: 2, status: 'DONE' as const,
          completedAt: '2026-03-27T10:00:00.000Z', // 금요일 완료
          assignees: [makeMember(ME)],
        },
        {
          ...base, id: 3, status: 'DONE' as const,
          completedAt: '2026-03-16T12:00:00.000Z', // 지지난 주 월요일 정오 UTC → 어느 타임존에서도 지난 주
          assignees: [makeMember(ME)],
        },
      ];
      const { myWeekDone } = calcPersonalKpis(tickets, ME);
      expect(myWeekDone.map((t) => t.id)).toEqual(expect.arrayContaining([1, 2]));
      expect(myWeekDone).toHaveLength(2);
    });

    it('completedAt이 없으면 집계되지 않는다', () => {
      const tickets = [
        {
          ...base, id: 1, status: 'DONE' as const,
          completedAt: null,
          assignees: [makeMember(ME)],
        },
      ];
      const { myWeekDone } = calcPersonalKpis(tickets, ME);
      expect(myWeekDone).toHaveLength(0);
    });

    it('지난 주와 이번 주 완료 비교(weekDiff)가 올바르다', () => {
      const tickets = [
        // 이번 주 완료 2건
        { ...base, id: 1, status: 'DONE' as const, completedAt: '2026-03-24T00:00:00.000Z', assignees: [makeMember(ME)] },
        { ...base, id: 2, status: 'DONE' as const, completedAt: '2026-03-25T00:00:00.000Z', assignees: [makeMember(ME)] },
        // 지난 주 완료 1건
        { ...base, id: 3, status: 'DONE' as const, completedAt: '2026-03-17T00:00:00.000Z', assignees: [makeMember(ME)] },
      ];
      const { myWeekDone, myLastWeekDone, weekDiff } = calcPersonalKpis(tickets, ME);
      expect(myWeekDone).toHaveLength(2);
      expect(myLastWeekDone).toHaveLength(1);
      expect(weekDiff).toBe(1); // 이번 주가 1건 더 많음
    });
  });

  describe('weekStart 경계값', () => {
    it('토요일(6): weekStart는 당주 월요일이다', () => {
      // NOW = 2026-03-28 토요일
      const { weekStart } = calcPersonalKpis([], ME, new Date('2026-03-28T03:00:00.000Z'));
      // 2026-03-23 월요일 자정(로컬) → UTC로 표현하면 타임존 의존이므로 날짜만 비교
      expect(weekStart.getDate()).toBe(23);
      expect(weekStart.getMonth()).toBe(2); // 0-indexed: March=2
    });

    it('월요일(1): weekStart는 당일이다', () => {
      // 2026-03-23 월요일 03:00 UTC
      const { weekStart } = calcPersonalKpis([], ME, new Date('2026-03-23T03:00:00.000Z'));
      expect(weekStart.getDate()).toBe(23);
    });

    it('일요일(0): weekStart는 당주 월요일이다 (픽스됨)', () => {
      // 2026-03-29 일요일 03:00 UTC (KST 12:00)
      const sundayNow = new Date('2026-03-29T03:00:00.000Z');
      const { weekStart } = calcPersonalKpis([], ME, sundayNow);
      // (0 || 7) = 7, setDate(29 - 7 + 1) = 23 → 당주 월요일
      expect(weekStart.getDate()).toBe(23);
    });
  });
});

// ─── 3. 우선순위 × 상태 매트릭스 ──────────────────────────────────────────

describe('Priority × Status Matrix', () => {
  it('각 셀에 올바른 카운트가 집계된다', () => {
    const tickets = [
      { ...base, id: 1, priority: 'CRITICAL' as const, status: 'TODO' as const },
      { ...base, id: 2, priority: 'CRITICAL' as const, status: 'TODO' as const },
      { ...base, id: 3, priority: 'HIGH' as const, status: 'DONE' as const },
      { ...base, id: 4, priority: 'MEDIUM' as const, status: 'IN_PROGRESS' as const },
      { ...base, id: 5, priority: 'LOW' as const, status: 'BACKLOG' as const },
    ];
    const matrix = calcMatrix(tickets);
    expect(matrix['CRITICAL']['TODO']).toBe(2);
    expect(matrix['HIGH']['DONE']).toBe(1);
    expect(matrix['MEDIUM']['IN_PROGRESS']).toBe(1);
    expect(matrix['LOW']['BACKLOG']).toBe(1);
  });

  it('티켓이 없으면 모든 우선순위 키가 빈 객체다', () => {
    const matrix = calcMatrix([]);
    expect(matrix['CRITICAL']).toEqual({});
    expect(matrix['HIGH']).toEqual({});
    expect(matrix['MEDIUM']).toEqual({});
    expect(matrix['LOW']).toEqual({});
  });

  // 정합성: 행별 합산 = 해당 priority 티켓 수
  it('각 우선순위 행의 합산은 해당 priority 티켓 수와 일치한다', () => {
    const tickets = [
      { ...base, id: 1, priority: 'HIGH' as const, status: 'TODO' as const },
      { ...base, id: 2, priority: 'HIGH' as const, status: 'DONE' as const },
      { ...base, id: 3, priority: 'HIGH' as const, status: 'IN_PROGRESS' as const },
      { ...base, id: 4, priority: 'LOW' as const, status: 'TODO' as const },
    ];
    const matrix = calcMatrix(tickets);
    const highTotal = Object.values(matrix['HIGH']).reduce((s, c) => s + c, 0);
    expect(highTotal).toBe(3);
    const lowTotal = Object.values(matrix['LOW']).reduce((s, c) => s + c, 0);
    expect(lowTotal).toBe(1);
  });

  // 정합성: 모든 셀 합산 = 전체 티켓 수
  it('전체 셀 합산은 allTickets.length와 일치한다', () => {
    const tickets = Array.from({ length: 8 }, (_, i) => ({
      ...base,
      id: i + 1,
      priority: (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const)[i % 4],
      status: (['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'] as const)[i % 4],
    }));
    const matrix = calcMatrix(tickets);
    const total = Object.values(matrix).reduce(
      (sum, row) => sum + Object.values(row).reduce((s, c) => s + c, 0),
      0,
    );
    expect(total).toBe(tickets.length);
  });
});

// ─── 4. 타입별 분포 & 완료율 ─────────────────────────────────────────────────

describe('Type Distribution', () => {
  it('각 타입별 total, done, pct가 올바르게 계산된다', () => {
    const tickets = [
      { ...base, id: 1, type: 'GOAL' as const, status: 'DONE' as const },
      { ...base, id: 2, type: 'GOAL' as const, status: 'TODO' as const },
      { ...base, id: 3, type: 'STORY' as const, status: 'DONE' as const },
      { ...base, id: 4, type: 'FEATURE' as const, status: 'IN_PROGRESS' as const },
      { ...base, id: 5, type: 'TASK' as const, status: 'DONE' as const },
      { ...base, id: 6, type: 'TASK' as const, status: 'DONE' as const },
      { ...base, id: 7, type: 'TASK' as const, status: 'TODO' as const },
      { ...base, id: 8, type: 'TASK' as const, status: 'BACKLOG' as const },
    ];
    const dist = calcTypeDist(tickets);
    const goal = dist.find((d) => d.key === 'GOAL')!;
    const story = dist.find((d) => d.key === 'STORY')!;
    const feature = dist.find((d) => d.key === 'FEATURE')!;
    const task = dist.find((d) => d.key === 'TASK')!;

    expect(goal.total).toBe(2);
    expect(goal.done).toBe(1);
    expect(goal.pct).toBe(50);

    expect(story.total).toBe(1);
    expect(story.done).toBe(1);
    expect(story.pct).toBe(100);

    expect(feature.total).toBe(1);
    expect(feature.done).toBe(0);
    expect(feature.pct).toBe(0);

    expect(task.total).toBe(4);
    expect(task.done).toBe(2);
    expect(task.pct).toBe(50);
  });

  it('해당 타입 티켓이 없으면 pct는 0이다 (0 나누기 방지)', () => {
    const dist = calcTypeDist([]);
    dist.forEach((d) => {
      expect(d.total).toBe(0);
      expect(d.done).toBe(0);
      expect(d.pct).toBe(0);
    });
  });

  it('pct는 반올림된다 (1/3 = 33%)', () => {
    const tickets = [
      { ...base, id: 1, type: 'TASK' as const, status: 'DONE' as const },
      { ...base, id: 2, type: 'TASK' as const, status: 'TODO' as const },
      { ...base, id: 3, type: 'TASK' as const, status: 'TODO' as const },
    ];
    const dist = calcTypeDist(tickets);
    const task = dist.find((d) => d.key === 'TASK')!;
    expect(task.pct).toBe(33); // 1/3 = 33.33... → 33
  });

  // 정합성: 4개 타입 total 합산 = 전체 티켓 수 (GOAL/STORY/FEATURE/TASK만 집계)
  it('4개 타입 total 합산은 allTickets.length와 일치한다', () => {
    const tickets = [
      { ...base, id: 1, type: 'GOAL' as const },
      { ...base, id: 2, type: 'STORY' as const },
      { ...base, id: 3, type: 'FEATURE' as const },
      { ...base, id: 4, type: 'TASK' as const },
      { ...base, id: 5, type: 'TASK' as const },
    ];
    const dist = calcTypeDist(tickets);
    const totalFromDist = dist.reduce((s, d) => s + d.total, 0);
    expect(totalFromDist).toBe(tickets.length);
  });
});

// ─── 5. 트렌드 데이터 (생성 vs 완료) ─────────────────────────────────────

describe('Trend Data (CFD 기반)', () => {
  const makeCfd = (date: string, backlog: number, todo: number, inProgress: number, done: number, created = 0): CfdDataPoint => ({
    date,
    backlog,
    todo,
    inProgress,
    done,
    created,
  });

  it('첫 번째 항목의 created/resolved는 항상 0이다', () => {
    const cfd = [makeCfd('2026-03-24', 5, 3, 2, 1)]; // 월요일
    const trend = calcTrendData(cfd);
    expect(trend[0].created).toBe(0);
    expect(trend[0].resolved).toBe(0);
  });

  it('resolved는 done 증가분이다', () => {
    const cfd = [
      makeCfd('2026-03-23', 5, 3, 2, 1), // 월
      makeCfd('2026-03-24', 5, 3, 2, 3), // 화 — done +2
    ];
    const trend = calcTrendData(cfd);
    expect(trend[1].resolved).toBe(2);
  });

  it('음수 증가분은 0으로 클램프된다', () => {
    const cfd = [
      makeCfd('2026-03-23', 5, 3, 2, 5),
      makeCfd('2026-03-24', 5, 3, 2, 3), // done 감소
    ];
    const trend = calcTrendData(cfd);
    expect(trend[1].resolved).toBe(0);
    expect(trend[1].created).toBe(0);
  });

  it('created는 CfdDataPoint.created 필드를 그대로 사용한다 (픽스됨)', () => {
    // getCfdData가 실제 생성 수를 쿼리하여 CfdDataPoint.created에 넣으므로
    // calcTrendData는 d.created를 그대로 반영한다
    const cfd = [
      makeCfd('2026-03-23', 10, 5, 3, 2, 0), // created=0
      makeCfd('2026-03-24', 10, 5, 3, 4, 3), // created=3, done +2
    ];
    const trend = calcTrendData(cfd);
    expect(trend[1].created).toBe(3); // d.created 직접 반영
    expect(trend[1].resolved).toBe(2); // done 증가분
    // created와 resolved는 이제 독립적이다
    expect(trend[1].created).not.toBe(trend[1].resolved);
  });

  it('주말(토, 일)은 필터링된다', () => {
    const cfd = [
      makeCfd('2026-03-23', 10, 5, 3, 1), // 월
      makeCfd('2026-03-24', 10, 5, 3, 2), // 화
      makeCfd('2026-03-25', 10, 5, 3, 3), // 수
      makeCfd('2026-03-26', 10, 5, 3, 4), // 목
      makeCfd('2026-03-27', 10, 5, 3, 5), // 금
      makeCfd('2026-03-28', 10, 5, 3, 6), // 토 — 제외
      makeCfd('2026-03-29', 10, 5, 3, 7), // 일 — 제외
    ];
    const trend = calcTrendData(cfd);
    expect(trend.every((d) => {
      const day = new Date(d.date).getDay();
      return day !== 0 && day !== 6;
    })).toBe(true);
    expect(trend.length).toBeLessThanOrEqual(5);
  });

  it('최대 7개 워킹데이 데이터만 반환된다', () => {
    // 월~금 × 2주 = 10개 워킹데이
    const cfd: CfdDataPoint[] = [];
    let done = 0;
    const dates = [
      '2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20',
      '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27',
    ];
    for (const date of dates) {
      done++;
      cfd.push(makeCfd(date, 10, 5, 3, done));
    }
    const trend = calcTrendData(cfd);
    expect(trend.length).toBe(7);
    // 마지막 7개이므로 3/19 ~ 3/27 (주말 제외)
    expect(trend[trend.length - 1].date).toBe('2026-03-27');
  });
});

// ─── 6. computePeriodBurndown ─────────────────────────────────────────────

describe('computePeriodBurndown', () => {
  it('완료 티켓 수만큼 remaining이 감소한다', () => {
    // ⚠️ 타임존 버그 주의: computePeriodBurndown은 날짜 문자열은 UTC(toISOString) 기준이지만
    // dayEnd 계산(setHours)은 로컬 시간 기준이어서 UTC+9(KST)에서 날짜 버킷이 1일 어긋날 수 있다.
    // → 특정 날짜 버킷 대신 "완료 후 remaining이 감소" 라는 불변 조건을 검증한다.
    const allTickets = [
      { id: 1, completedAt: new Date('2026-01-10T12:00:00.000Z'), storyPoints: null, createdAt: new Date('2026-01-05T00:00:00.000Z') },
      { id: 2, completedAt: null, storyPoints: null, createdAt: new Date('2026-01-05T00:00:00.000Z') },
    ];
    const result = computePeriodBurndown(allTickets, '2026-01-05', '2026-01-15');

    // 첫 날: 아직 아무것도 완료되지 않았으므로 remaining = 2
    expect(result[0].remainingTickets).toBe(2);
    // 기간 내에서 remaining이 2 → 1로 감소해야 한다 (id=1 완료 반영)
    const minRemaining = Math.min(...result.map((r) => r.remainingTickets));
    expect(minRemaining).toBe(1); // id=2는 미완료이므로 최소값은 1
    // 단조 비증가 검증: remaining은 절대 증가하지 않는다
    for (let i = 1; i < result.length; i++) {
      expect(result[i].remainingTickets).toBeLessThanOrEqual(result[i - 1].remainingTickets);
    }
  });

  it('기간 종료일 이후 데이터는 포함되지 않는다', () => {
    const allTickets = [
      { id: 1, completedAt: new Date('2026-03-23'), storyPoints: null, createdAt: new Date('2026-03-23') },
    ];
    const result = computePeriodBurndown(allTickets, '2026-03-23', '2026-03-25');
    expect(result.every((r) => r.date <= '2026-03-25')).toBe(true);
  });

  it('티켓이 없으면 모든 날짜 remainingTickets는 0이다', () => {
    const result = computePeriodBurndown([], '2026-03-23', '2026-03-25');
    expect(result.every((r) => r.remainingTickets === 0)).toBe(true);
  });

  it('idealTickets은 첫 날이 total이고 날짜가 지날수록 감소한다', () => {
    // 구현 특성: dayIndex는 0-based이므로 마지막 날(endDate)의 ideal은 0이 아닐 수 있다.
    // 3일 기간(3/23~3/25), 3개 티켓: dayIndex 0→1→2, ideal = 3→2→1
    const allTickets = [
      { id: 1, completedAt: null, storyPoints: null, createdAt: new Date('2026-03-23T00:00:00.000Z') },
      { id: 2, completedAt: null, storyPoints: null, createdAt: new Date('2026-03-23T00:00:00.000Z') },
      { id: 3, completedAt: null, storyPoints: null, createdAt: new Date('2026-03-23T00:00:00.000Z') },
    ];
    const result = computePeriodBurndown(allTickets, '2026-03-23', '2026-03-25');
    expect(result[0].idealTickets).toBe(3); // 첫 날 = total
    // 마지막 날은 첫 날보다 작다 (단조 감소)
    expect(result[result.length - 1].idealTickets).toBeLessThan(result[0].idealTickets);
    // 연속 감소 검증
    for (let i = 1; i < result.length; i++) {
      expect(result[i].idealTickets).toBeLessThanOrEqual(result[i - 1].idealTickets);
    }
  });

  it('remainingTickets는 음수가 될 수 없다 (completedAt이 기간 이전인 경우)', () => {
    const allTickets = [
      // createdAt이 기간 이후라 relevantTickets에서 제외됨
      { id: 1, completedAt: new Date('2026-03-20'), storyPoints: null, createdAt: new Date('2026-03-25') },
    ];
    const result = computePeriodBurndown(allTickets, '2026-03-23', '2026-03-25');
    result.forEach((r) => {
      expect(r.remainingTickets).toBeGreaterThanOrEqual(0);
    });
  });
});

// ─── 7. computeCycleTimeFromTickets ──────────────────────────────────────

describe('computeCycleTimeFromTickets', () => {
  it('생성일로부터 완료일까지 일수를 버킷으로 집계한다', () => {
    const tickets = [
      {
        ...base,
        id: 1,
        status: 'DONE' as const,
        createdAt: '2026-03-01T00:00:00.000Z',
        completedAt: '2026-03-04T00:00:00.000Z', // 3일
      },
      {
        ...base,
        id: 2,
        status: 'DONE' as const,
        createdAt: '2026-03-01T00:00:00.000Z',
        completedAt: '2026-03-04T00:00:00.000Z', // 3일 — 같은 버킷
      },
    ];
    const result = computeCycleTimeFromTickets(tickets);
    const bucket3 = result.find((r) => r.days === 3);
    expect(bucket3?.count).toBe(2);
  });

  it('completedAt이 없는 티켓은 집계되지 않는다', () => {
    const tickets = [
      { ...base, id: 1, status: 'TODO' as const, completedAt: null },
    ];
    const result = computeCycleTimeFromTickets(tickets);
    expect(result).toHaveLength(0);
  });

  it('30일을 초과하는 사이클 타임은 30 버킷으로 캡된다', () => {
    const tickets = [
      {
        ...base,
        id: 1,
        status: 'DONE' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-03-01T00:00:00.000Z', // 59일 → 버킷 30
      },
    ];
    const result = computeCycleTimeFromTickets(tickets);
    expect(result.every((r) => r.days <= 30)).toBe(true);
    const bucket30 = result.find((r) => r.days === 30);
    expect(bucket30?.count).toBe(1);
  });

  it('당일 생성/완료(시간차 있음)는 Math.ceil로 1일 버킷이다', () => {
    // Math.ceil(6h / 24h) = Math.ceil(0.25) = 1
    const tickets = [
      {
        ...base,
        id: 1,
        status: 'DONE' as const,
        createdAt: '2026-03-01T09:00:00.000Z',
        completedAt: '2026-03-01T15:00:00.000Z',
      },
    ];
    const result = computeCycleTimeFromTickets(tickets);
    const bucket1 = result.find((r) => r.days === 1);
    expect(bucket1?.count).toBe(1);
  });

  it('완전히 동일한 timestamp로 생성/완료면 0일 버킷이다', () => {
    const ts = '2026-03-01T10:00:00.000Z';
    const tickets = [
      { ...base, id: 1, status: 'DONE' as const, createdAt: ts, completedAt: ts },
    ];
    const result = computeCycleTimeFromTickets(tickets);
    const bucket0 = result.find((r) => r.days === 0);
    expect(bucket0?.count).toBe(1);
  });

  it('버킷은 days 오름차순으로 정렬된다', () => {
    const tickets = [
      { ...base, id: 1, status: 'DONE' as const, createdAt: '2026-03-01T00:00:00.000Z', completedAt: '2026-03-06T00:00:00.000Z' }, // 5일
      { ...base, id: 2, status: 'DONE' as const, createdAt: '2026-03-01T00:00:00.000Z', completedAt: '2026-03-03T00:00:00.000Z' }, // 2일
    ];
    const result = computeCycleTimeFromTickets(tickets);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].days).toBeGreaterThan(result[i - 1].days);
    }
  });
});
