/**
 * 멤버 통계 순수 계산 로직 단위 테스트
 *
 * 대상:
 *   - app/workspace/.../members/page.tsx 인라인 계산 (summary stats)
 *   - src/components/team/WorkloadHeatmap.tsx: loadLabel, pct 계산
 *   - src/components/team/MemberDetailCard.tsx: workday, ticket filtering, overdue
 */

import type { MemberWorkload, TicketWithMeta } from '@/types/index';

// ── 픽스쳐 팩토리 ────────────────────────────────────────────────────────

function makeWorkload(overrides: Partial<MemberWorkload> = {}): MemberWorkload {
  return {
    memberId: 1,
    displayName: '홍길동',
    email: 'test@example.com',
    color: '#629584',
    role: 'MEMBER',
    assigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    byStatus: { BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 },
    ...overrides,
  };
}

const BASE_TICKET: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: '티켓',
  description: null,
  type: 'TASK',
  status: 'TODO',
  priority: 'MEDIUM',
  position: 0,
  startDate: null,
  dueDate: null,
  plannedStartDate: null,
  plannedEndDate: null,
  parentId: null,
  assigneeId: null,
  sprintId: null,
  storyPoints: null,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isOverdue: false,
  labels: [],
  checklistItems: [],
  parent: null,
  assignee: null,
  assignees: [],
};

function makeTix(overrides: Partial<TicketWithMeta> = {}): TicketWithMeta {
  return { ...BASE_TICKET, ...overrides };
}

// ── members/page.tsx 인라인 계산 미러 ─────────────────────────────────────

function calcMemberSummary(workload: MemberWorkload[]) {
  const totalAssigned = workload.reduce((s, m) => s + m.assigned, 0);
  const totalDone     = workload.reduce((s, m) => s + m.completed, 0);
  const completionPct = totalAssigned > 0 ? Math.round(totalDone / totalAssigned * 100) : 0;
  const totalWorkday  = totalAssigned * 2;
  return { memberCount: workload.length, totalAssigned, totalDone, completionPct, totalWorkday };
}

// ── WorkloadHeatmap loadLabel 미러 ────────────────────────────────────────

function loadLabel(pct: number, assigned: number): { text: string; color: string } {
  if (assigned === 0) return { text: '여유', color: '#9CA3AF' };
  if (pct >= 80)      return { text: '과중', color: '#DC2626' };
  if (pct >= 60)      return { text: '보통', color: '#F59E0B' };
  return              { text: '적정', color: '#629584' };
}

function calcPct(completed: number, assigned: number): number {
  return assigned > 0 ? Math.round(completed / assigned * 100) : 0;
}

// ── MemberDetailCard 티켓 필터링 미러 ────────────────────────────────────

function filterMemberTickets(memberId: number, tickets: TicketWithMeta[]): TicketWithMeta[] {
  return tickets.filter(
    (t) =>
      t.assignees?.some((a) => a.id === memberId) ||
      t.assignee?.id === memberId,
  );
}

function isTicketOverdue(t: TicketWithMeta, today: string): boolean {
  return !!(t.plannedEndDate && t.status !== 'DONE' && t.plannedEndDate < today);
}

// ════════════════════════════════════════════════════════════════════════════
// 1. members/page.tsx — 요약 통계
// ════════════════════════════════════════════════════════════════════════════

describe('Members page 요약 통계', () => {
  it('workload가 비어있으면 모든 값이 0이다', () => {
    const s = calcMemberSummary([]);
    expect(s.memberCount).toBe(0);
    expect(s.totalAssigned).toBe(0);
    expect(s.totalDone).toBe(0);
    expect(s.completionPct).toBe(0);
    expect(s.totalWorkday).toBe(0);
  });

  it('단일 멤버 — 할당·완료·workday가 올바르게 계산된다', () => {
    const s = calcMemberSummary([makeWorkload({ assigned: 10, completed: 6 })]);
    expect(s.memberCount).toBe(1);
    expect(s.totalAssigned).toBe(10);
    expect(s.totalDone).toBe(6);
    expect(s.completionPct).toBe(60);
    expect(s.totalWorkday).toBe(20);
  });

  it('다수 멤버 — 할당과 완료가 합산된다', () => {
    const s = calcMemberSummary([
      makeWorkload({ assigned: 5, completed: 3 }),
      makeWorkload({ memberId: 2, assigned: 8, completed: 5 }),
      makeWorkload({ memberId: 3, assigned: 2, completed: 2 }),
    ]);
    expect(s.totalAssigned).toBe(15);
    expect(s.totalDone).toBe(10);
  });

  it('완료율 반올림 — 2/3 = 67%', () => {
    const s = calcMemberSummary([makeWorkload({ assigned: 3, completed: 2 })]);
    expect(s.completionPct).toBe(67);
  });

  it('완료율 — 전부 완료이면 100%', () => {
    const s = calcMemberSummary([makeWorkload({ assigned: 5, completed: 5 })]);
    expect(s.completionPct).toBe(100);
  });

  it('Workday = totalAssigned * 2', () => {
    const s = calcMemberSummary([
      makeWorkload({ assigned: 4 }),
      makeWorkload({ memberId: 2, assigned: 6 }),
    ]);
    expect(s.totalWorkday).toBe(20); // (4+6)*2
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. WorkloadHeatmap — loadLabel & pct
// ════════════════════════════════════════════════════════════════════════════

describe('WorkloadHeatmap loadLabel', () => {
  it('assigned=0 → 여유', () => {
    expect(loadLabel(0, 0).text).toBe('여유');
  });

  it('pct >= 80 → 과중', () => {
    expect(loadLabel(80, 10).text).toBe('과중');
    expect(loadLabel(100, 10).text).toBe('과중');
  });

  it('pct >= 60 && < 80 → 보통', () => {
    expect(loadLabel(60, 10).text).toBe('보통');
    expect(loadLabel(79, 10).text).toBe('보통');
  });

  it('pct < 60 → 적정', () => {
    expect(loadLabel(59, 10).text).toBe('적정');
    expect(loadLabel(0, 10).text).toBe('적정');
  });

  it('각 라벨의 색상이 올바르다', () => {
    expect(loadLabel(0, 0).color).toBe('#9CA3AF');   // 여유
    expect(loadLabel(80, 5).color).toBe('#DC2626');  // 과중
    expect(loadLabel(70, 5).color).toBe('#F59E0B');  // 보통
    expect(loadLabel(50, 5).color).toBe('#629584');  // 적정
  });
});

describe('WorkloadHeatmap pct 계산', () => {
  it('assigned=0 → 0%', () => {
    expect(calcPct(0, 0)).toBe(0);
  });

  it('2/4 → 50%', () => {
    expect(calcPct(2, 4)).toBe(50);
  });

  it('3/3 → 100%', () => {
    expect(calcPct(3, 3)).toBe(100);
  });

  it('1/3 → 33%', () => {
    expect(calcPct(1, 3)).toBe(33);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. MemberDetailCard — 티켓 필터링
// ════════════════════════════════════════════════════════════════════════════

describe('MemberDetailCard 티켓 필터링', () => {
  const MEMBER_ID = 10;

  it('빈 티켓 목록 → 빈 배열', () => {
    expect(filterMemberTickets(MEMBER_ID, [])).toHaveLength(0);
  });

  it('assignees 배열에 memberId가 있으면 포함된다', () => {
    const tix = [
      makeTix({ id: 1, assignees: [{ id: MEMBER_ID } as never] }),
      makeTix({ id: 2, assignees: [{ id: 99 } as never] }),
    ];
    const result = filterMemberTickets(MEMBER_ID, tix);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('assignee 단일 필드로도 필터링된다', () => {
    const tix = [
      makeTix({ id: 1, assignee: { id: MEMBER_ID } as never }),
      makeTix({ id: 2, assignee: { id: 99 } as never }),
    ];
    const result = filterMemberTickets(MEMBER_ID, tix);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('assignees와 assignee 둘 다 없으면 제외된다', () => {
    const tix = [makeTix({ id: 1, assignees: [], assignee: null })];
    expect(filterMemberTickets(MEMBER_ID, tix)).toHaveLength(0);
  });

  it('assignees와 assignee 둘 다 매칭되어도 중복 없이 1개 반환된다', () => {
    const tix = [
      makeTix({
        id: 1,
        assignees: [{ id: MEMBER_ID } as never],
        assignee: { id: MEMBER_ID } as never,
      }),
    ];
    expect(filterMemberTickets(MEMBER_ID, tix)).toHaveLength(1);
  });

  it('여러 멤버가 있는 assignees 배열에서 올바르게 필터링된다', () => {
    const tix = [
      makeTix({ id: 1, assignees: [{ id: 5 } as never, { id: MEMBER_ID } as never, { id: 7 } as never] }),
    ];
    expect(filterMemberTickets(MEMBER_ID, tix)).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. MemberDetailCard — 지연(overdue) 감지
// ════════════════════════════════════════════════════════════════════════════

describe('MemberDetailCard 지연 감지', () => {
  const TODAY = '2026-03-15';

  it('plannedEndDate < today && !DONE → overdue', () => {
    const t = makeTix({ plannedEndDate: '2026-03-14', status: 'IN_PROGRESS' });
    expect(isTicketOverdue(t, TODAY)).toBe(true);
  });

  it('plannedEndDate === today → overdue 아님', () => {
    const t = makeTix({ plannedEndDate: '2026-03-15', status: 'TODO' });
    expect(isTicketOverdue(t, TODAY)).toBe(false);
  });

  it('plannedEndDate > today → overdue 아님', () => {
    const t = makeTix({ plannedEndDate: '2026-03-20', status: 'TODO' });
    expect(isTicketOverdue(t, TODAY)).toBe(false);
  });

  it('DONE 상태이면 마감일이 지났어도 overdue 아님', () => {
    const t = makeTix({ plannedEndDate: '2026-03-01', status: 'DONE' });
    expect(isTicketOverdue(t, TODAY)).toBe(false);
  });

  it('plannedEndDate 없으면 overdue 아님', () => {
    const t = makeTix({ plannedEndDate: null, status: 'TODO' });
    expect(isTicketOverdue(t, TODAY)).toBe(false);
  });

  it('BACKLOG이면서 마감일 초과 → overdue', () => {
    const t = makeTix({ plannedEndDate: '2026-03-01', status: 'BACKLOG' });
    expect(isTicketOverdue(t, TODAY)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. MemberDetailCard — workday 계산
// ════════════════════════════════════════════════════════════════════════════

describe('MemberDetailCard workday 계산', () => {
  it('assigned=0 → 0d', () => {
    expect(makeWorkload({ assigned: 0 }).assigned * 2).toBe(0);
  });

  it('assigned=5 → 10d', () => {
    expect(makeWorkload({ assigned: 5 }).assigned * 2).toBe(10);
  });

  it('assigned=12 → 24d', () => {
    expect(makeWorkload({ assigned: 12 }).assigned * 2).toBe(24);
  });
});
