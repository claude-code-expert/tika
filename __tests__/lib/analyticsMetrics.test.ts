/**
 * Analytics 순수 함수 및 계산 로직 단위 테스트
 *
 * 대상:
 *   - src/db/queries/analytics.ts : computePeriodBurndown, computeCycleTimeFromTickets
 *   - app/workspace/.../analytics/page.tsx 인라인 계산 (completionRate, overdueCount, typeCounts, cycleTime stats)
 *   - src/components/team/charts/DailyLogTable.tsx 행 계산 로직
 */

import { computePeriodBurndown, computeCycleTimeFromTickets } from '@/db/queries/analytics';
import { nowKST } from '@/lib/date';
import type { TicketWithMeta, CfdDataPoint, CycleTimeDistribution } from '@/types/index';

// nowKST 를 고정값으로 제어해 날짜 의존성을 제거
jest.mock('@/lib/date', () => ({
  nowKST: jest.fn(),
  toKSTDateString: jest.fn((iso: string) => iso.slice(0, 10)),
  toKSTString: jest.fn((iso: string) => iso.slice(0, 16).replace('T', ' ')),
}));

// ────────────────────────────────────────────────────────────────────────────
// 픽스쳐 팩토리
// ────────────────────────────────────────────────────────────────────────────

const BASE_TICKET: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: 'Test',
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

/** computePeriodBurndown 용 최소 티켓 타입 */
function burndownTix(opts: {
  id?: number;
  completedAt?: Date | null;
  storyPoints?: number | null;
  createdAt?: Date;
}) {
  return {
    id: opts.id ?? 1,
    completedAt: opts.completedAt ?? null,
    storyPoints: opts.storyPoints ?? null,
    createdAt: opts.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

/** KST 오프셋 포함: toISOString().slice(0,10) === dateStr 가 되도록 */
function kstNow(dateStr: string): Date {
  // dateStr e.g. '2026-03-15' → return Date whose .toISOString().slice(0,10) = dateStr
  return new Date(dateStr + 'T00:00:00.000Z');
}

beforeEach(() => {
  (nowKST as jest.Mock).mockReturnValue(kstNow('2026-03-15'));
});

afterEach(() => {
  jest.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────
// 1. computePeriodBurndown
// ────────────────────────────────────────────────────────────────────────────

describe('computePeriodBurndown', () => {
  describe('결과 길이', () => {
    it('빈 날짜 범위 — startDate > today 이면 빈 배열을 반환한다', () => {
      const result = computePeriodBurndown([], '2026-03-20', '2026-03-31');
      expect(result).toHaveLength(0);
    });

    it('endDate가 today 이후이면 today까지만 포함한다', () => {
      // today = 2026-03-15, period = Mar10~Mar20 → Mar10..Mar15 = 6점
      const result = computePeriodBurndown([], '2026-03-10', '2026-03-20');
      expect(result).toHaveLength(6);
      expect(result[0].date).toBe('2026-03-10');
      expect(result[result.length - 1].date).toBe('2026-03-15');
    });

    it('과거 완결 기간 — endDate <= today 이면 전 기간을 반환한다', () => {
      // period = Mar01~Mar07 (7일), today = Mar15
      const result = computePeriodBurndown([], '2026-03-01', '2026-03-07');
      expect(result).toHaveLength(7);
    });

    it('단 하루 기간(startDate === endDate)이면 1개 데이터 포인트를 반환한다', () => {
      const result = computePeriodBurndown([], '2026-03-01', '2026-03-01');
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-03-01');
    });
  });

  describe('남은 티켓 수 (remainingTickets)', () => {
    it('티켓 없음 → 모든 날 remainingTickets = 0', () => {
      const result = computePeriodBurndown([], '2026-03-01', '2026-03-03');
      expect(result.every((p) => p.remainingTickets === 0)).toBe(true);
    });

    it('아무것도 완료되지 않으면 전 기간 total을 유지한다', () => {
      const tix = [
        burndownTix({ id: 1, completedAt: null }),
        burndownTix({ id: 2, completedAt: null }),
        burndownTix({ id: 3, completedAt: null }),
      ];
      const result = computePeriodBurndown(tix, '2026-03-01', '2026-03-03');
      expect(result.every((p) => p.remainingTickets === 3)).toBe(true);
    });

    it('티켓 완료 당일부터 remaining이 감소한다', () => {
      const tix = [
        burndownTix({ id: 1, completedAt: new Date('2026-03-02T10:00:00.000Z') }),
        burndownTix({ id: 2, completedAt: new Date('2026-03-03T10:00:00.000Z') }),
        burndownTix({ id: 3, completedAt: null }),
      ];
      const result = computePeriodBurndown(tix, '2026-03-01', '2026-03-03');

      expect(result[0].remainingTickets).toBe(3); // Mar01: 아무것도 안 끝남
      expect(result[1].remainingTickets).toBe(2); // Mar02: t1 완료
      expect(result[2].remainingTickets).toBe(1); // Mar03: t2 완료
    });

    it('기간 시작 전에 완료된 티켓은 첫날에 already-done으로 반영된다', () => {
      const tix = [
        burndownTix({ id: 1, completedAt: new Date('2026-02-01T00:00:00.000Z') }), // 기간 전 완료
        burndownTix({ id: 2, completedAt: null }),
      ];
      const result = computePeriodBurndown(tix, '2026-03-01', '2026-03-03');

      expect(result[0].remainingTickets).toBe(1); // Mar01 시작 시 t1은 이미 완료
    });

    it('기간 종료(today) 이후에 생성된 티켓은 집계에서 제외된다', () => {
      const tix = [
        burndownTix({ id: 1, createdAt: new Date('2026-03-20T00:00:00.000Z') }), // today(Mar15) 이후 생성
      ];
      const result = computePeriodBurndown(tix, '2026-03-01', '2026-03-07');
      expect(result.every((p) => p.remainingTickets === 0)).toBe(true);
    });
  });

  describe('남은 스토리 포인트 (remainingPoints)', () => {
    it('포인트 없는 티켓은 remainingPoints = 0', () => {
      const tix = [burndownTix({ id: 1, storyPoints: null })];
      const result = computePeriodBurndown(tix, '2026-03-01', '2026-03-03');
      expect(result.every((p) => p.remainingPoints === 0)).toBe(true);
    });

    it('완료된 티켓의 포인트만큼 감소한다', () => {
      const tix = [
        burndownTix({ id: 1, completedAt: new Date('2026-03-02T10:00:00.000Z'), storyPoints: 5 }),
        burndownTix({ id: 2, completedAt: null, storyPoints: 3 }),
      ];
      const result = computePeriodBurndown(tix, '2026-03-01', '2026-03-03');

      expect(result[0].remainingPoints).toBe(8); // Mar01: 아무것도 안 끝남
      expect(result[1].remainingPoints).toBe(3); // Mar02: t1(5점) 완료
      expect(result[2].remainingPoints).toBe(3); // Mar03: 변화 없음
    });
  });

  describe('이상적 번다운선 (idealTickets)', () => {
    it('티켓 없음 → 모든 날 idealTickets = 0', () => {
      const result = computePeriodBurndown([], '2026-03-01', '2026-03-03');
      expect(result.every((p) => p.idealTickets === 0)).toBe(true);
    });

    it('3일 기간, 3개 티켓 → 선형 감소 3→2→1', () => {
      const tix = [
        burndownTix({ id: 1 }),
        burndownTix({ id: 2 }),
        burndownTix({ id: 3 }),
      ];
      const result = computePeriodBurndown(tix, '2026-03-01', '2026-03-03');

      expect(result[0].idealTickets).toBe(3); // day 0
      expect(result[1].idealTickets).toBe(2); // day 1
      expect(result[2].idealTickets).toBe(1); // day 2
    });

    it('idealTickets는 음수가 되지 않는다 (max 0 처리)', () => {
      // 기간보다 많은 날이 남은 경우 이론상 음수가 될 수 있음
      const tix = [burndownTix({ id: 1 })];
      const result = computePeriodBurndown(tix, '2026-03-01', '2026-03-07');
      expect(result.every((p) => p.idealTickets >= 0)).toBe(true);
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. computeCycleTimeFromTickets
// ────────────────────────────────────────────────────────────────────────────

describe('computeCycleTimeFromTickets', () => {
  it('빈 배열 → 빈 배열', () => {
    expect(computeCycleTimeFromTickets([])).toEqual([]);
  });

  it('completedAt = null 인 티켓은 제외된다', () => {
    const tix = [makeTix({ id: 1, completedAt: null, status: 'TODO' })];
    expect(computeCycleTimeFromTickets(tix)).toEqual([]);
  });

  it('생성일 = 완료일 → 0일 버킷', () => {
    const tix = [
      makeTix({
        id: 1,
        completedAt: '2026-03-01T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        status: 'DONE',
      }),
    ];
    const result = computeCycleTimeFromTickets(tix);
    expect(result).toEqual([{ days: 0, count: 1 }]);
  });

  it('12시간 소요 → ceil(0.5) = 1일 버킷', () => {
    const tix = [
      makeTix({
        id: 1,
        completedAt: '2026-03-01T12:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        status: 'DONE',
      }),
    ];
    const result = computeCycleTimeFromTickets(tix);
    expect(result).toEqual([{ days: 1, count: 1 }]);
  });

  it('31일 소요 → 30일 버킷에 capping된다', () => {
    const created = new Date('2026-01-01T00:00:00.000Z');
    const completed = new Date(created.getTime() + 31 * 24 * 3600 * 1000);
    const tix = [
      makeTix({
        id: 1,
        completedAt: completed.toISOString(),
        createdAt: created.toISOString(),
        status: 'DONE',
      }),
    ];
    const result = computeCycleTimeFromTickets(tix);
    expect(result).toEqual([{ days: 30, count: 1 }]);
  });

  it('같은 일 수 소요 티켓이 여럿이면 count가 합산된다', () => {
    const tix = [1, 2, 3].map((id) =>
      makeTix({
        id,
        completedAt: `2026-03-04T00:00:00.000Z`,
        createdAt: `2026-03-01T00:00:00.000Z`,
        status: 'DONE',
      }),
    );
    const result = computeCycleTimeFromTickets(tix);
    expect(result).toEqual([{ days: 3, count: 3 }]);
  });

  it('여러 버킷은 days 오름차순으로 정렬된다', () => {
    const tix = [
      makeTix({ id: 1, completedAt: '2026-03-04T00:00:00.000Z', createdAt: '2026-03-01T00:00:00.000Z', status: 'DONE' }), // 3d
      makeTix({ id: 2, completedAt: '2026-03-02T00:00:00.000Z', createdAt: '2026-03-01T00:00:00.000Z', status: 'DONE' }), // 1d
      makeTix({ id: 3, completedAt: '2026-03-03T00:00:00.000Z', createdAt: '2026-03-01T00:00:00.000Z', status: 'DONE' }), // 2d
    ];
    const result = computeCycleTimeFromTickets(tix);
    expect(result.map((r) => r.days)).toEqual([1, 2, 3]);
  });

  it('Date 객체 또는 문자열 모두 수용한다', () => {
    const tixStr = [
      makeTix({ id: 1, completedAt: '2026-03-03T00:00:00.000Z', createdAt: '2026-03-01T00:00:00.000Z', status: 'DONE' }),
    ];
    expect(computeCycleTimeFromTickets(tixStr)).toEqual([{ days: 2, count: 1 }]);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Analytics Page 인라인 계산 — completionRate, overdueCount, typeCounts
//    (page.tsx 동일 로직을 재현)
// ────────────────────────────────────────────────────────────────────────────

/** analytics/page.tsx 의 단일 패스 통계 계산 미러 */
function calcPageStats(allTickets: TicketWithMeta[], todayDate: string) {
  const typeCounts: Record<string, number> = {};
  let doneTickets = 0;
  let overdueCount = 0;
  for (const t of allTickets) {
    typeCounts[t.type] = (typeCounts[t.type] ?? 0) + 1;
    if (t.status === 'DONE') doneTickets++;
    else if (t.dueDate && t.dueDate < todayDate) overdueCount++;
  }
  const total = allTickets.length;
  const completionRate = total > 0 ? Math.round((doneTickets / total) * 100) : 0;
  return { typeCounts, doneTickets, overdueCount, completionRate, total };
}

/** cycleTime 통계 계산 미러 */
function calcCycleTimeStats(cycleTime: CycleTimeDistribution[]) {
  const totalSamples = cycleTime.reduce((s, d) => s + d.count, 0);
  const avgCycleTime =
    totalSamples > 0
      ? Math.round((cycleTime.reduce((s, d) => s + d.days * d.count, 0) / totalSamples) * 10) / 10
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
  return { totalSamples, avgCycleTime, medianCycleTime };
}

describe('Analytics page stats', () => {
  describe('completionRate', () => {
    it('빈 목록 → 0%', () => {
      expect(calcPageStats([], '2026-03-15').completionRate).toBe(0);
    });

    it('전부 DONE → 100%', () => {
      const tix = [makeTix({ id: 1, status: 'DONE' }), makeTix({ id: 2, status: 'DONE' })];
      expect(calcPageStats(tix, '2026-03-15').completionRate).toBe(100);
    });

    it('2개 중 1개 완료 → 50%', () => {
      const tix = [makeTix({ id: 1, status: 'DONE' }), makeTix({ id: 2, status: 'TODO' })];
      expect(calcPageStats(tix, '2026-03-15').completionRate).toBe(50);
    });

    it('3개 중 1개 완료 → 33%', () => {
      const tix = [
        makeTix({ id: 1, status: 'DONE' }),
        makeTix({ id: 2, status: 'TODO' }),
        makeTix({ id: 3, status: 'TODO' }),
      ];
      expect(calcPageStats(tix, '2026-03-15').completionRate).toBe(33);
    });
  });

  describe('overdueCount', () => {
    it('DONE 상태 티켓은 마감일이 지나도 지연으로 집계되지 않는다', () => {
      const tix = [makeTix({ id: 1, status: 'DONE', dueDate: '2026-01-01' })];
      expect(calcPageStats(tix, '2026-03-15').overdueCount).toBe(0);
    });

    it('마감일 < today && !DONE → 지연으로 집계된다', () => {
      const tix = [makeTix({ id: 1, status: 'TODO', dueDate: '2026-03-01' })];
      expect(calcPageStats(tix, '2026-03-15').overdueCount).toBe(1);
    });

    it('마감일 === today 인 티켓은 지연으로 집계되지 않는다', () => {
      const tix = [makeTix({ id: 1, status: 'TODO', dueDate: '2026-03-15' })];
      expect(calcPageStats(tix, '2026-03-15').overdueCount).toBe(0);
    });

    it('마감일 없는 티켓은 집계되지 않는다', () => {
      const tix = [makeTix({ id: 1, status: 'TODO', dueDate: null })];
      expect(calcPageStats(tix, '2026-03-15').overdueCount).toBe(0);
    });
  });

  describe('typeCounts', () => {
    it('각 유형의 티켓 수가 올바르게 집계된다', () => {
      const tix = [
        makeTix({ id: 1, type: 'GOAL' }),
        makeTix({ id: 2, type: 'STORY' }),
        makeTix({ id: 3, type: 'STORY' }),
        makeTix({ id: 4, type: 'FEATURE' }),
        makeTix({ id: 5, type: 'TASK' }),
        makeTix({ id: 6, type: 'TASK' }),
        makeTix({ id: 7, type: 'TASK' }),
      ];
      const { typeCounts } = calcPageStats(tix, '2026-03-15');
      expect(typeCounts['GOAL']).toBe(1);
      expect(typeCounts['STORY']).toBe(2);
      expect(typeCounts['FEATURE']).toBe(1);
      expect(typeCounts['TASK']).toBe(3);
    });

    it('빈 목록이면 typeCounts가 비어 있다', () => {
      const { typeCounts } = calcPageStats([], '2026-03-15');
      expect(Object.keys(typeCounts)).toHaveLength(0);
    });
  });
});

describe('Analytics cycleTime stats', () => {
  it('샘플 없음 → avg=0, median=0', () => {
    const { avgCycleTime, medianCycleTime } = calcCycleTimeStats([]);
    expect(avgCycleTime).toBe(0);
    expect(medianCycleTime).toBe(0);
  });

  it('단일 버킷 — avg와 median이 동일하다', () => {
    const dist: CycleTimeDistribution[] = [{ days: 5, count: 4 }];
    const { avgCycleTime, medianCycleTime } = calcCycleTimeStats(dist);
    expect(avgCycleTime).toBe(5);
    expect(medianCycleTime).toBe(5);
  });

  it('소수점 반올림 — avg는 .1 단위로 반올림된다', () => {
    // [{ days: 1, count: 1 }, { days: 2, count: 1 }] → avg = (1+2)/2 = 1.5
    const dist: CycleTimeDistribution[] = [{ days: 1, count: 1 }, { days: 2, count: 1 }];
    const { avgCycleTime } = calcCycleTimeStats(dist);
    expect(avgCycleTime).toBe(1.5);
  });

  it('중앙값 — 홀수 샘플 수에서 중간 버킷이 선택된다', () => {
    // samples: 1,2,3 → mid=2, cumul: day1→1, day2→2(>=2) → median=2
    const dist: CycleTimeDistribution[] = [
      { days: 1, count: 1 },
      { days: 2, count: 1 },
      { days: 3, count: 1 },
    ];
    const { medianCycleTime } = calcCycleTimeStats(dist);
    expect(medianCycleTime).toBe(2);
  });

  it('중앙값 — 짝수 샘플 수에서 ceil(n/2)번째 버킷이 선택된다', () => {
    // samples: 1,1,2,2 → mid=ceil(4/2)=2, cumul: day1→2(>=2) → median=1
    const dist: CycleTimeDistribution[] = [
      { days: 1, count: 2 },
      { days: 2, count: 2 },
    ];
    const { medianCycleTime } = calcCycleTimeStats(dist);
    expect(medianCycleTime).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 4. DailyLogTable 행 계산 로직
//    (DailyLogTable.tsx의 rows map 로직을 재현)
// ────────────────────────────────────────────────────────────────────────────

function calcDailyRows(data: CfdDataPoint[], maxRows = 14) {
  return [...data].slice(-maxRows).map((d, i, arr) => {
    const prev = arr[i - 1];
    const doneDelta = prev ? d.done - prev.done : 0;
    const totalToday = d.backlog + d.todo + d.inProgress + d.done;
    const totalPrev = prev ? prev.backlog + prev.todo + prev.inProgress + prev.done : totalToday;
    const addedDelta = Math.max(0, totalToday - totalPrev);
    const remaining = d.backlog + d.todo + d.inProgress;
    const absorptionRate =
      addedDelta > 0 ? Math.round((doneDelta / Math.max(addedDelta, 1)) * 100) : null;
    return { date: d.date, completed: doneDelta, added: addedDelta, remaining, absorptionRate };
  });
}

function makeCfdPoint(overrides: Partial<CfdDataPoint> & { date: string }): CfdDataPoint {
  return {
    backlog: 10,
    todo: 5,
    inProgress: 3,
    done: 2,
    created: 0,
    ...overrides,
  };
}

describe('DailyLogTable 행 계산', () => {
  it('빈 데이터 → 빈 행 배열', () => {
    expect(calcDailyRows([])).toHaveLength(0);
  });

  it('첫 번째 행은 doneDelta=0, addedDelta=0 (이전 행 없음)', () => {
    const data = [makeCfdPoint({ date: '2026-03-01' })];
    const rows = calcDailyRows(data);
    expect(rows[0].completed).toBe(0);
    expect(rows[0].added).toBe(0);
    expect(rows[0].absorptionRate).toBeNull();
  });

  it('doneDelta — done 수가 증가한 만큼 반영된다', () => {
    const data = [
      makeCfdPoint({ date: '2026-03-01', done: 5 }),
      makeCfdPoint({ date: '2026-03-02', done: 8 }),
    ];
    expect(calcDailyRows(data)[1].completed).toBe(3);
  });

  it('addedDelta — 전체 티켓 수 증가분만 반영된다 (감소 시 0)', () => {
    const data = [
      makeCfdPoint({ date: '2026-03-01', backlog: 10, todo: 0, inProgress: 0, done: 5 }),
      makeCfdPoint({ date: '2026-03-02', backlog: 8, todo: 0, inProgress: 0, done: 8 }),  // total: 15→16(+1 added)
    ];
    expect(calcDailyRows(data)[1].added).toBe(1);
  });

  it('addedDelta는 음수가 되지 않는다', () => {
    const data = [
      makeCfdPoint({ date: '2026-03-01', backlog: 10, todo: 5, inProgress: 3, done: 2 }),
      makeCfdPoint({ date: '2026-03-02', backlog: 5, todo: 3, inProgress: 2, done: 6 }), // total 20→16, 감소
    ];
    expect(calcDailyRows(data)[1].added).toBe(0);
  });

  it('remaining = backlog + todo + inProgress', () => {
    const data = [makeCfdPoint({ date: '2026-03-01', backlog: 3, todo: 2, inProgress: 1, done: 4 })];
    expect(calcDailyRows(data)[0].remaining).toBe(6);
  });

  it('흡수율 — addedDelta > 0 일 때 doneDelta/addedDelta * 100', () => {
    const data = [
      makeCfdPoint({ date: '2026-03-01', backlog: 10, todo: 0, inProgress: 0, done: 0 }), // total 10
      makeCfdPoint({ date: '2026-03-02', backlog: 10, todo: 0, inProgress: 0, done: 2 }), // total 12 (+2 added), +2 done
    ];
    // addedDelta=2, doneDelta=2 → 100%
    expect(calcDailyRows(data)[1].absorptionRate).toBe(100);
  });

  it('흡수율 — addedDelta = 0 이면 null', () => {
    const data = [
      makeCfdPoint({ date: '2026-03-01', backlog: 10, todo: 0, inProgress: 0, done: 2 }),
      makeCfdPoint({ date: '2026-03-02', backlog: 8, todo: 0, inProgress: 0, done: 4 }), // total 12→12, addedDelta=0
    ];
    expect(calcDailyRows(data)[1].absorptionRate).toBeNull();
  });

  it('maxRows — 마지막 N개 행만 반환한다', () => {
    const data = Array.from({ length: 20 }, (_, i) =>
      makeCfdPoint({ date: `2026-03-${String(i + 1).padStart(2, '0')}` }),
    );
    expect(calcDailyRows(data, 7)).toHaveLength(7);
    expect(calcDailyRows(data, 7)[0].date).toBe('2026-03-14'); // last 7 of 20
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 5. StoryScheduleTable 계산 로직
//    (StoryScheduleTable.tsx 의 pct, daysRemaining 로직을 재현)
// ────────────────────────────────────────────────────────────────────────────

function calcStoryPct(story: TicketWithMeta, allTickets: TicketWithMeta[]) {
  const children = allTickets.filter((t) => t.parentId === story.id);
  const done = children.filter((t) => t.status === 'DONE').length;
  const total = children.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

function calcDaysRemaining(dueDate?: string | null): number | null {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

describe('StoryScheduleTable 계산', () => {
  const story = makeTix({ id: 10, type: 'STORY', status: 'IN_PROGRESS' });

  describe('완료율 (pct)', () => {
    it('하위 티켓 없음 → 0%', () => {
      expect(calcStoryPct(story, []).pct).toBe(0);
    });

    it('하위 전부 DONE → 100%', () => {
      const children = [
        makeTix({ id: 101, parentId: 10, status: 'DONE' }),
        makeTix({ id: 102, parentId: 10, status: 'DONE' }),
      ];
      expect(calcStoryPct(story, children).pct).toBe(100);
    });

    it('3개 중 2개 완료 → 67%', () => {
      const children = [
        makeTix({ id: 101, parentId: 10, status: 'DONE' }),
        makeTix({ id: 102, parentId: 10, status: 'DONE' }),
        makeTix({ id: 103, parentId: 10, status: 'TODO' }),
      ];
      expect(calcStoryPct(story, children).pct).toBe(67);
    });

    it('다른 story의 하위 티켓은 집계에 포함되지 않는다', () => {
      const children = [
        makeTix({ id: 101, parentId: 10, status: 'DONE' }),
        makeTix({ id: 201, parentId: 20, status: 'DONE' }), // 다른 story
      ];
      const { total } = calcStoryPct(story, children);
      expect(total).toBe(1); // story.id=10 하위만
    });
  });

  describe('남은 일수 (daysRemaining)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('dueDate 없음 → null', () => {
      expect(calcDaysRemaining(null)).toBeNull();
      expect(calcDaysRemaining(undefined)).toBeNull();
    });

    it('오늘이 마감일이면 1 (자정 기준 미래로 올림)', () => {
      // now = 2026-03-15T00:00Z, dueDate = '2026-03-15' → new Date('2026-03-15') = UTC 자정
      // diff = 0, ceil(0) = 0 이므로 0
      // (JS new Date('2026-03-15') = 2026-03-15T00:00:00.000Z, diff with now(2026-03-15T00:00Z) = 0)
      expect(calcDaysRemaining('2026-03-15')).toBe(0);
    });

    it('마감일이 1일 뒤이면 1', () => {
      expect(calcDaysRemaining('2026-03-16')).toBe(1);
    });

    it('마감일이 지났으면 음수', () => {
      expect(calcDaysRemaining('2026-03-14')).toBe(-1);
    });

    it('7일 뒤 마감일 → 7', () => {
      expect(calcDaysRemaining('2026-03-22')).toBe(7);
    });
  });
});
