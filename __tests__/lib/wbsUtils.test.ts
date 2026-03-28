/**
 * WBS 순수 함수 단위 테스트
 *
 * 대상:
 *   - src/lib/wbsUtils.ts       : buildGanttItems, countItems, getDateRange, getActualDateRange, getAllDates
 *   - src/components/team/GanttChart.tsx : parseDateStr, dateKey, getWeekdays, flattenItems, buildMonthGroups, getBarColor
 *   - app/workspace/.../wbs/page.tsx stats 계산 로직 (인라인)
 */

import {
  buildGanttItems,
  getAllDates,
  getDateRange,
  getActualDateRange,
  countItems,
} from '@/lib/wbsUtils';

import {
  parseDateStr,
  dateKey,
  getWeekdays,
  flattenItems,
  buildMonthGroups,
  getBarColor,
} from '@/components/team/GanttChart';

import type { GanttItem } from '@/components/team/GanttChart';
import type { TicketWithMeta } from '@/types/index';

// ────────────────────────────────────────────────────────────────────────────
// 픽스쳐 팩토리
// ────────────────────────────────────────────────────────────────────────────

function makeTicket(overrides: Partial<TicketWithMeta> = {}): TicketWithMeta {
  return {
    id: 1,
    workspaceId: 1,
    title: '테스트 티켓',
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
    deleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isOverdue: false,
    labels: [],
    checklistItems: [],
    assignees: [],
    assignee: null,
    parent: null,
    ...overrides,
  };
}

function makeGanttItem(overrides: Partial<GanttItem> = {}): GanttItem {
  return {
    id: 1,
    type: 'TASK',
    name: '테스트',
    status: 'TODO',
    priority: 'MEDIUM',
    assignees: [],
    startDate: null,
    endDate: null,
    children: [],
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// buildGanttItems
// ────────────────────────────────────────────────────────────────────────────

describe('buildGanttItems', () => {
  it('빈 티켓 목록 → 빈 루트 배열', () => {
    expect(buildGanttItems([])).toEqual([]);
  });

  it('parentId 없는 티켓들은 모두 루트 레벨에 위치', () => {
    const tickets = [
      makeTicket({ id: 1, title: 'Goal A', type: 'GOAL' }),
      makeTicket({ id: 2, title: 'Task B', type: 'TASK' }),
    ];
    const result = buildGanttItems(tickets);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('자식 티켓이 올바른 부모 아래에 배치됨', () => {
    const tickets = [
      makeTicket({ id: 1, title: 'Goal', type: 'GOAL', parentId: null }),
      makeTicket({ id: 2, title: 'Story', type: 'STORY', parentId: 1 }),
      makeTicket({ id: 3, title: 'Task', type: 'TASK', parentId: 2 }),
    ];
    const roots = buildGanttItems(tickets);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe(1);
    expect(roots[0].children).toHaveLength(1);
    expect(roots[0].children![0].id).toBe(2);
    expect(roots[0].children![0].children).toHaveLength(1);
    expect(roots[0].children![0].children![0].id).toBe(3);
  });

  it('parentId가 존재하지 않는 티켓(고아)은 루트로 처리', () => {
    const tickets = [
      makeTicket({ id: 1, title: 'Task', type: 'TASK', parentId: 9999 }), // 9999 없음
    ];
    const roots = buildGanttItems(tickets);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe(1);
  });

  it('plannedStartDate / plannedEndDate가 startDate / endDate로 매핑됨', () => {
    const tickets = [
      makeTicket({
        id: 1,
        plannedStartDate: '2026-03-01',
        plannedEndDate: '2026-03-31',
      }),
    ];
    const [item] = buildGanttItems(tickets);
    expect(item.startDate).toBe('2026-03-01');
    expect(item.endDate).toBe('2026-03-31');
  });

  it('plannedStartDate / plannedEndDate 가 null이면 null로 전달', () => {
    const tickets = [makeTicket({ id: 1, plannedStartDate: null, plannedEndDate: null })];
    const [item] = buildGanttItems(tickets);
    expect(item.startDate).toBeNull();
    expect(item.endDate).toBeNull();
  });

  it('name은 title로 설정됨', () => {
    const tickets = [makeTicket({ id: 1, title: 'My Ticket' })];
    const [item] = buildGanttItems(tickets);
    expect(item.name).toBe('My Ticket');
  });

  it('다수 Goal + 각각의 하위 계층이 올바르게 분리됨', () => {
    const tickets = [
      makeTicket({ id: 1, type: 'GOAL', title: 'Goal 1', parentId: null }),
      makeTicket({ id: 2, type: 'STORY', title: 'Story 1-1', parentId: 1 }),
      makeTicket({ id: 3, type: 'GOAL', title: 'Goal 2', parentId: null }),
      makeTicket({ id: 4, type: 'TASK', title: 'Task 3-1', parentId: 3 }),
    ];
    const roots = buildGanttItems(tickets);
    expect(roots).toHaveLength(2);
    expect(roots[0].children).toHaveLength(1);
    expect(roots[1].children).toHaveLength(1);
    expect(roots[0].children![0].id).toBe(2);
    expect(roots[1].children![0].id).toBe(4);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// WBS 페이지 통계 계산 (인라인 검증)
// ────────────────────────────────────────────────────────────────────────────

describe('WBS 통계 계산 로직', () => {
  function calcStats(tickets: TicketWithMeta[]) {
    const goalCount    = tickets.filter((t) => t.type === 'GOAL').length;
    const storyCount   = tickets.filter((t) => t.type === 'STORY').length;
    const featureCount = tickets.filter((t) => t.type === 'FEATURE').length;
    const taskCount    = tickets.filter((t) => t.type === 'TASK').length;
    const totalTickets = tickets.length;
    const doneTickets  = tickets.filter((t) => t.status === 'DONE').length;
    const overallPct   = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;
    return { goalCount, storyCount, featureCount, taskCount, overallPct };
  }

  it('빈 목록 → 모두 0', () => {
    const s = calcStats([]);
    expect(s).toEqual({ goalCount: 0, storyCount: 0, featureCount: 0, taskCount: 0, overallPct: 0 });
  });

  it('각 타입 개수가 올바르게 집계됨', () => {
    const tickets = [
      makeTicket({ type: 'GOAL' }),
      makeTicket({ type: 'GOAL' }),
      makeTicket({ type: 'STORY' }),
      makeTicket({ type: 'FEATURE' }),
      makeTicket({ type: 'FEATURE' }),
      makeTicket({ type: 'TASK' }),
      makeTicket({ type: 'TASK' }),
      makeTicket({ type: 'TASK' }),
    ];
    const s = calcStats(tickets);
    expect(s.goalCount).toBe(2);
    expect(s.storyCount).toBe(1);
    expect(s.featureCount).toBe(2);
    expect(s.taskCount).toBe(3);
  });

  it('모두 DONE이면 overallPct = 100', () => {
    const tickets = [
      makeTicket({ status: 'DONE' }),
      makeTicket({ status: 'DONE' }),
    ];
    expect(calcStats(tickets).overallPct).toBe(100);
  });

  it('DONE 없으면 overallPct = 0', () => {
    const tickets = [makeTicket({ status: 'TODO' }), makeTicket({ status: 'IN_PROGRESS' })];
    expect(calcStats(tickets).overallPct).toBe(0);
  });

  it('overallPct는 반올림됨 (1/3 → 33)', () => {
    const tickets = [
      makeTicket({ status: 'DONE' }),
      makeTicket({ status: 'TODO' }),
      makeTicket({ status: 'TODO' }),
    ];
    expect(calcStats(tickets).overallPct).toBe(33);
  });

  it('overallPct 반올림 확인 (2/3 → 67)', () => {
    const tickets = [
      makeTicket({ status: 'DONE' }),
      makeTicket({ status: 'DONE' }),
      makeTicket({ status: 'TODO' }),
    ];
    expect(calcStats(tickets).overallPct).toBe(67);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// countItems
// ────────────────────────────────────────────────────────────────────────────

describe('countItems', () => {
  it('빈 배열 → { total: 0, done: 0 }', () => {
    expect(countItems([])).toEqual({ total: 0, done: 0 });
  });

  it('단일 DONE 아이템', () => {
    const items = [makeGanttItem({ status: 'DONE' })];
    expect(countItems(items)).toEqual({ total: 1, done: 1 });
  });

  it('단일 TODO 아이템', () => {
    const items = [makeGanttItem({ status: 'TODO' })];
    expect(countItems(items)).toEqual({ total: 1, done: 0 });
  });

  it('자식 아이템도 재귀적으로 집계됨', () => {
    const items = [
      makeGanttItem({
        id: 1,
        status: 'DONE',
        children: [
          makeGanttItem({ id: 2, status: 'DONE' }),
          makeGanttItem({ id: 3, status: 'TODO' }),
        ],
      }),
    ];
    expect(countItems(items)).toEqual({ total: 3, done: 2 });
  });

  it('3단계 깊이 계층 집계', () => {
    const items = [
      makeGanttItem({
        id: 1,
        status: 'DONE',
        children: [
          makeGanttItem({
            id: 2,
            status: 'IN_PROGRESS',
            children: [
              makeGanttItem({ id: 3, status: 'DONE' }),
              makeGanttItem({ id: 4, status: 'TODO' }),
            ],
          }),
        ],
      }),
    ];
    // total: 4 (1 + 2 + 3 + 4), done: 2 (1 and 3)
    expect(countItems(items)).toEqual({ total: 4, done: 2 });
  });

  it('여러 루트 아이템 합산', () => {
    const items = [
      makeGanttItem({ id: 1, status: 'DONE' }),
      makeGanttItem({ id: 2, status: 'DONE' }),
      makeGanttItem({ id: 3, status: 'TODO' }),
    ];
    expect(countItems(items)).toEqual({ total: 3, done: 2 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getAllDates
// ────────────────────────────────────────────────────────────────────────────

describe('getAllDates', () => {
  it('빈 배열 → []', () => {
    expect(getAllDates([])).toEqual([]);
  });

  it('startDate / endDate 수집', () => {
    const items = [makeGanttItem({ startDate: '2026-01-01', endDate: '2026-03-31' })];
    expect(getAllDates(items)).toEqual(['2026-01-01', '2026-03-31']);
  });

  it('null 날짜는 포함하지 않음', () => {
    const items = [makeGanttItem({ startDate: '2026-02-01', endDate: null })];
    expect(getAllDates(items)).toEqual(['2026-02-01']);
  });

  it('자식 아이템 날짜도 재귀적으로 수집', () => {
    const items = [
      makeGanttItem({
        startDate: '2026-01-01',
        endDate: null,
        children: [makeGanttItem({ id: 2, startDate: '2026-02-01', endDate: '2026-02-28' })],
      }),
    ];
    expect(getAllDates(items)).toEqual(['2026-01-01', '2026-02-01', '2026-02-28']);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getDateRange
// ────────────────────────────────────────────────────────────────────────────

describe('getDateRange', () => {
  it('빈 배열 → 오늘부터 30일 후 범위 반환', () => {
    const { start, end } = getDateRange([]);
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end > start).toBe(true);
  });

  it('start는 최소 날짜 기준 -3일, end는 최대 날짜 기준 +7일', () => {
    const items = [
      makeGanttItem({ startDate: '2026-03-10', endDate: '2026-03-20' }),
    ];
    const { start, end } = getDateRange(items);
    expect(start).toBe('2026-03-07'); // 10일 - 3일
    expect(end).toBe('2026-03-27');   // 20일 + 7일
  });

  it('여러 날짜 중 실제 최솟값/최댓값 기준으로 계산', () => {
    const items = [
      makeGanttItem({ startDate: '2026-01-05', endDate: '2026-01-20' }),
      makeGanttItem({ id: 2, startDate: '2026-01-15', endDate: '2026-02-10' }),
    ];
    const { start, end } = getDateRange(items);
    expect(start).toBe('2026-01-02'); // 1월5일 - 3일
    expect(end).toBe('2026-02-17');   // 2월10일 + 7일
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getActualDateRange
// ────────────────────────────────────────────────────────────────────────────

describe('getActualDateRange', () => {
  it('빈 배열 → { start: null, end: null }', () => {
    expect(getActualDateRange([])).toEqual({ start: null, end: null });
  });

  it('날짜 없는 아이템만 → { start: null, end: null }', () => {
    const items = [makeGanttItem({ startDate: null, endDate: null })];
    expect(getActualDateRange(items)).toEqual({ start: null, end: null });
  });

  it('실제 최솟값/최댓값 날짜 반환', () => {
    const items = [
      makeGanttItem({ startDate: '2026-02-01', endDate: '2026-02-28' }),
      makeGanttItem({ id: 2, startDate: '2026-01-01', endDate: '2026-03-31' }),
    ];
    const { start, end } = getActualDateRange(items);
    expect(start).toBe('2026-01-01');
    expect(end).toBe('2026-03-31');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// GanttChart 유틸: parseDateStr
// ────────────────────────────────────────────────────────────────────────────

describe('parseDateStr', () => {
  it('null → null', () => expect(parseDateStr(null)).toBeNull());
  it('빈 문자열 → null', () => expect(parseDateStr('')).toBeNull());
  it('잘못된 형식 → null', () => expect(parseDateStr('2026/03/01')).toBeNull());
  it('NaN 포함 문자열 → null', () => expect(parseDateStr('2026-ab-01')).toBeNull());

  it('유효한 날짜 문자열 → Date 객체', () => {
    const d = parseDateStr('2026-03-15');
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(2); // 0-indexed
    expect(d!.getDate()).toBe(15);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// GanttChart 유틸: dateKey
// ────────────────────────────────────────────────────────────────────────────

describe('dateKey', () => {
  it('날짜를 YYYY-MM-DD 형식으로 반환', () => {
    const d = new Date(2026, 2, 5); // 2026-03-05
    expect(dateKey(d)).toBe('2026-03-05');
  });

  it('월/일이 한 자리인 경우 0-패딩', () => {
    const d = new Date(2026, 0, 1); // 2026-01-01
    expect(dateKey(d)).toBe('2026-01-01');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// GanttChart 유틸: getWeekdays
// ────────────────────────────────────────────────────────────────────────────

describe('getWeekdays', () => {
  it('주말(토/일)을 제외하고 평일만 반환', () => {
    // 2026-03-02(월) ~ 2026-03-08(일): 평일 5개 (월~금)
    const start = new Date(2026, 2, 2);
    const end   = new Date(2026, 2, 8);
    const days  = getWeekdays(start, end);
    expect(days).toHaveLength(5);
    for (const d of days) {
      expect([1, 2, 3, 4, 5]).toContain(d.getDay()); // 월~금
    }
  });

  it('시작일과 종료일이 같은 평일 → 1개 반환', () => {
    const monday = new Date(2026, 2, 2); // 월요일
    expect(getWeekdays(monday, monday)).toHaveLength(1);
  });

  it('시작일과 종료일이 같은 주말 → 빈 배열', () => {
    const saturday = new Date(2026, 2, 7); // 토요일
    expect(getWeekdays(saturday, saturday)).toHaveLength(0);
  });

  it('2주 범위: 평일 10개', () => {
    const start = new Date(2026, 2, 2);  // 월
    const end   = new Date(2026, 2, 13); // 금 (2주)
    expect(getWeekdays(start, end)).toHaveLength(10);
  });

  it('반환된 날짜 순서는 오름차순', () => {
    const start = new Date(2026, 2, 2);
    const end   = new Date(2026, 2, 6);
    const days  = getWeekdays(start, end);
    for (let i = 1; i < days.length; i++) {
      expect(days[i].getTime()).toBeGreaterThan(days[i - 1].getTime());
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// GanttChart 유틸: flattenItems
// ────────────────────────────────────────────────────────────────────────────

describe('flattenItems', () => {
  it('빈 배열 → []', () => {
    expect(flattenItems([])).toEqual([]);
  });

  it('자식 없는 단일 아이템 → depth 0', () => {
    const item = makeGanttItem({ id: 1 });
    const [flat] = flattenItems([item]);
    expect(flat.depth).toBe(0);
    expect(flat.id).toBe(1);
  });

  it('계층 구조에서 올바른 depth 할당', () => {
    const root = makeGanttItem({
      id: 1,
      depth: undefined,
      children: [
        makeGanttItem({
          id: 2,
          depth: undefined,
          children: [makeGanttItem({ id: 3, depth: undefined })],
        }),
      ],
    });
    const flat = flattenItems([root]);
    expect(flat).toHaveLength(3);
    expect(flat[0]).toMatchObject({ id: 1, depth: 0 });
    expect(flat[1]).toMatchObject({ id: 2, depth: 1 });
    expect(flat[2]).toMatchObject({ id: 3, depth: 2 });
  });

  it('DFS(전위 순회) 순서로 평탄화됨', () => {
    const tree = [
      makeGanttItem({
        id: 1,
        children: [
          makeGanttItem({ id: 2, children: [makeGanttItem({ id: 4 })] }),
          makeGanttItem({ id: 3 }),
        ],
      }),
    ];
    const flat = flattenItems(tree);
    expect(flat.map((i) => i.id)).toEqual([1, 2, 4, 3]);
  });

  it('형제 노드가 여럿인 경우 순서 유지', () => {
    const items = [
      makeGanttItem({ id: 1 }),
      makeGanttItem({ id: 2 }),
      makeGanttItem({ id: 3 }),
    ];
    const flat = flattenItems(items);
    expect(flat.map((i) => i.id)).toEqual([1, 2, 3]);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// GanttChart 유틸: buildMonthGroups
// ────────────────────────────────────────────────────────────────────────────

describe('buildMonthGroups', () => {
  it('빈 배열 → []', () => {
    expect(buildMonthGroups([])).toEqual([]);
  });

  it('단일 월의 평일들 → 그룹 1개, count는 날짜 수', () => {
    // 3월 2일(월) ~ 3월 6일(금): 5 평일, 모두 3월
    const days = getWeekdays(new Date(2026, 2, 2), new Date(2026, 2, 6));
    const groups = buildMonthGroups(days);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('2026년 3월');
    expect(groups[0].count).toBe(5);
  });

  it('두 달에 걸쳐 있는 평일들 → 그룹 2개', () => {
    // 3월 30일(월) ~ 4월 3일(금): 5평일, 3월 2개 + 4월 3개
    const days = getWeekdays(new Date(2026, 2, 30), new Date(2026, 3, 3));
    const groups = buildMonthGroups(days);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe('2026년 3월');
    expect(groups[0].count).toBe(2); // 30, 31
    expect(groups[1].label).toBe('2026년 4월');
    expect(groups[1].count).toBe(3); // 1, 2, 3
  });

  it('연도가 바뀌는 경우 → 연도가 다른 그룹', () => {
    // 12월 30일(화) ~ 1월 2일(금): 4평일
    const days = getWeekdays(new Date(2025, 11, 30), new Date(2026, 0, 2));
    const groups = buildMonthGroups(days);
    expect(groups.length).toBeGreaterThanOrEqual(2);
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('2025년 12월');
    expect(labels).toContain('2026년 1월');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// GanttChart 유틸: getBarColor
// ────────────────────────────────────────────────────────────────────────────

describe('getBarColor', () => {
  const today = '2026-03-15';

  it('DONE → 초록색', () => {
    const item = makeGanttItem({ status: 'DONE', endDate: '2026-03-10' });
    const { bg, border } = getBarColor(item, today);
    expect(bg).toBe('#86EFAC');
    expect(border).toBe('#22C55E');
  });

  it('마감일 < 오늘이고 DONE 아님 → 빨간색(지연)', () => {
    const item = makeGanttItem({ status: 'TODO', endDate: '2026-03-10' });
    const { bg, border } = getBarColor(item, today);
    expect(bg).toBe('#FCA5A5');
    expect(border).toBe('#EF4444');
  });

  it('IN_PROGRESS, 마감일 미초과 → 노란색', () => {
    const item = makeGanttItem({ status: 'IN_PROGRESS', endDate: '2026-03-20' });
    const { bg, border } = getBarColor(item, today);
    expect(bg).toBe('#FCD34D');
    expect(border).toBe('#F59E0B');
  });

  it('TODO, 마감일 미초과 → 파란색', () => {
    const item = makeGanttItem({ status: 'TODO', endDate: '2026-03-20' });
    const { bg, border } = getBarColor(item, today);
    expect(bg).toBe('#93C5FD');
    expect(border).toBe('#3B82F6');
  });

  it('BACKLOG (기타 상태), 마감일 미초과 → 회색', () => {
    const item = makeGanttItem({ status: 'BACKLOG', endDate: '2026-03-20' });
    const { bg, border } = getBarColor(item, today);
    expect(bg).toBe('#E5E7EB');
    expect(border).toBe('#D1D5DB');
  });

  it('DONE 상태 우선: DONE이면 마감일 초과여도 초록색', () => {
    const item = makeGanttItem({ status: 'DONE', endDate: '2026-03-01' }); // 마감 초과지만 DONE
    const { bg } = getBarColor(item, today);
    expect(bg).toBe('#86EFAC');
  });

  it('endDate 없으면 지연 판정 안 함 (미시작 회색)', () => {
    const item = makeGanttItem({ status: 'BACKLOG', endDate: null });
    const { bg } = getBarColor(item, today);
    expect(bg).toBe('#E5E7EB');
  });

  it('endDate === today이면 지연 아님 (오늘이 마감이면 TODO 상태)', () => {
    const item = makeGanttItem({ status: 'TODO', endDate: today });
    const { bg } = getBarColor(item, today);
    // endDate === today → endDate < today 는 false → TODO 파란색
    expect(bg).toBe('#93C5FD');
  });
});
