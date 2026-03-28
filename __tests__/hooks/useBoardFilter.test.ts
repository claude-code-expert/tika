/**
 * useBoardFilter 훅 테스트
 *
 * 칸반 보드의 필터 로직을 검증한다:
 * - 카운터 (todayDue, overdue, weekDone)
 * - 빠른 필터 (all, today_due, overdue, week_done)
 * - 고급 필터 (priority, type, dateRange)
 * - 검색 필터
 * - clearAllFilters
 * - hasActiveFilters
 */

import { renderHook, act } from '@testing-library/react';
import { useBoardFilter } from '@/hooks/useBoardFilter';
import type { BoardData, TicketWithMeta } from '@/types/index';

// ─── Fixture helpers ─────────────────────────────────────────────────────────

const TODAY = new Date();
const todayStr = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;

const pastStr = '2020-01-01';
const futureStr = '2099-12-31';

const base: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: 'Test ticket',
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

function makeBoard(tickets: Partial<TicketWithMeta>[]): BoardData {
  const board: BoardData['board'] = { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] };
  let id = 1;
  for (const t of tickets) {
    const ticket = { ...base, id: id++, ...t } as TicketWithMeta;
    board[ticket.status as keyof typeof board].push(ticket);
  }
  return { board, total: tickets.length };
}

const emptyBoard: BoardData = { board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] }, total: 0 };

// ─── 1. 카운터 계산 ────────────────────────────────────────────────────────────

describe('카운터 계산', () => {
  describe('todayDueCount', () => {
    it('plannedEndDate === 오늘이고 미완료인 티켓 수를 센다', () => {
      const board = makeBoard([
        { plannedEndDate: todayStr, status: 'TODO' },
        { plannedEndDate: todayStr, status: 'IN_PROGRESS' },
        { plannedEndDate: todayStr, status: 'DONE' },    // DONE 제외
        { plannedEndDate: futureStr, status: 'TODO' },   // 날짜 다름 — 제외
      ]);
      const { result } = renderHook(() => useBoardFilter(board));
      expect(result.current.filter.todayDueCount).toBe(2);
    });

    it('빈 보드면 0이다', () => {
      const { result } = renderHook(() => useBoardFilter(emptyBoard));
      expect(result.current.filter.todayDueCount).toBe(0);
    });
  });

  describe('overdueCount', () => {
    it('isOverdue=true인 티켓 수를 센다', () => {
      const board = makeBoard([
        { isOverdue: true, status: 'TODO' },
        { isOverdue: true, status: 'IN_PROGRESS' },
        { isOverdue: false, status: 'TODO' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));
      expect(result.current.filter.overdueCount).toBe(2);
    });
  });

  describe('weekDoneCount', () => {
    it('이번 주 완료된 티켓을 센다', () => {
      const board = makeBoard([
        { status: 'DONE', completedAt: `${todayStr}T10:00:00.000Z` },  // 이번 주
        { status: 'DONE', completedAt: '2020-01-01T10:00:00.000Z' },   // 오래된 것 — 제외
      ]);
      const { result } = renderHook(() => useBoardFilter(board));
      expect(result.current.filter.weekDoneCount).toBeGreaterThanOrEqual(1);
    });

    it('이번 주 금요일까지 마감인 미완료 티켓도 포함된다', () => {
      // 이번 주 월요일 날짜를 계산 (월~금은 반드시 weekFriday 이내)
      const now = new Date();
      const day = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const mondayStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

      const board = makeBoard([
        { status: 'TODO', plannedEndDate: mondayStr },  // 이번 주 월요일 마감 → 반드시 weekFriday 이내
      ]);
      const { result } = renderHook(() => useBoardFilter(board));
      expect(result.current.filter.weekDoneCount).toBeGreaterThanOrEqual(1);
    });

    it('오래된 완료 티켓은 포함되지 않는다', () => {
      const board = makeBoard([
        { status: 'DONE', completedAt: '2020-01-01T10:00:00.000Z' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));
      // 오래된 완료 + 마감이 먼 미완료 없음 → 0
      expect(result.current.filter.weekDoneCount).toBe(0);
    });

    // 정합성: weekDoneCount는 allTickets.length 이하다
    it('weekDoneCount는 전체 티켓 수를 초과하지 않는다', () => {
      const board = makeBoard([
        { status: 'DONE', completedAt: `${todayStr}T10:00:00.000Z` },
        { status: 'TODO', plannedEndDate: todayStr },
        { status: 'BACKLOG' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));
      expect(result.current.filter.weekDoneCount).toBeLessThanOrEqual(board.total);
    });
  });
});

// ─── 2. 빠른 필터 (activeFilter) ─────────────────────────────────────────────

describe('빠른 필터 (activeFilter)', () => {
  it('초기값은 "all"이다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));
    expect(result.current.filter.activeFilter).toBe('all');
  });

  it('"all" 필터는 모든 티켓을 표시한다', () => {
    const board = makeBoard([
      { status: 'BACKLOG' },
      { status: 'TODO' },
      { status: 'IN_PROGRESS' },
      { status: 'DONE' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board));
    const total = Object.values(result.current.displayBoard.board).reduce((s, a) => s + a.length, 0);
    expect(total).toBe(4);
  });

  it('"today_due" 필터는 오늘 마감 미완료 티켓만 표시한다', () => {
    const board = makeBoard([
      { plannedEndDate: todayStr, status: 'TODO' },
      { plannedEndDate: todayStr, status: 'DONE' },
      { plannedEndDate: futureStr, status: 'TODO' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board));

    act(() => { result.current.filter.setActiveFilter('today_due'); });

    const shown = Object.values(result.current.displayBoard.board).flat();
    expect(shown).toHaveLength(1);
    expect(shown[0].plannedEndDate).toBe(todayStr);
    expect(shown[0].status).not.toBe('DONE');
  });

  it('"overdue" 필터는 isOverdue=true 티켓만 표시한다', () => {
    const board = makeBoard([
      { isOverdue: true, status: 'TODO' },
      { isOverdue: true, status: 'IN_PROGRESS' },
      { isOverdue: false, status: 'BACKLOG' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board));

    act(() => { result.current.filter.setActiveFilter('overdue'); });

    const shown = Object.values(result.current.displayBoard.board).flat();
    expect(shown).toHaveLength(2);
    expect(shown.every((t) => t.isOverdue)).toBe(true);
  });

  it('"week_done" 필터는 이번 주 완료 + 이번 주 마감 미완료를 표시한다', () => {
    const board = makeBoard([
      { status: 'DONE', completedAt: `${todayStr}T10:00:00.000Z` },   // 이번 주 완료
      { status: 'TODO', plannedEndDate: todayStr },                    // 이번 주 마감 미완료
      { status: 'BACKLOG', plannedEndDate: futureStr },                // 먼 미래 — 제외
      { status: 'DONE', completedAt: '2020-01-01T10:00:00.000Z' },    // 오래된 완료 — 제외
    ]);
    const { result } = renderHook(() => useBoardFilter(board));

    act(() => { result.current.filter.setActiveFilter('week_done'); });

    const shown = Object.values(result.current.displayBoard.board).flat();
    expect(shown.length).toBeGreaterThanOrEqual(1);
  });

  it('필터 변경 시 displayBoard.total이 업데이트된다', () => {
    const board = makeBoard([
      { isOverdue: true, status: 'TODO' },
      { isOverdue: false, status: 'BACKLOG' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board));

    act(() => { result.current.filter.setActiveFilter('overdue'); });

    expect(result.current.displayBoard.total).toBe(1);
  });
});

// ─── 3. 고급 필터 ─────────────────────────────────────────────────────────────

describe('고급 필터', () => {
  describe('우선순위 필터', () => {
    it('선택한 우선순위 티켓만 표시된다', () => {
      const board = makeBoard([
        { priority: 'HIGH', status: 'TODO' },
        { priority: 'CRITICAL', status: 'TODO' },
        { priority: 'LOW', status: 'BACKLOG' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => { result.current.filter.togglePriority('HIGH'); });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(1);
      expect(shown[0].priority).toBe('HIGH');
    });

    it('여러 우선순위 선택 시 OR 조건으로 필터링된다', () => {
      const board = makeBoard([
        { priority: 'HIGH', status: 'TODO' },
        { priority: 'CRITICAL', status: 'TODO' },
        { priority: 'LOW', status: 'BACKLOG' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => {
        result.current.filter.togglePriority('HIGH');
        result.current.filter.togglePriority('CRITICAL');
      });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(2);
    });

    it('같은 우선순위를 두 번 토글하면 해제된다', () => {
      const board = makeBoard([
        { priority: 'HIGH', status: 'TODO' },
        { priority: 'LOW', status: 'BACKLOG' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => { result.current.filter.togglePriority('HIGH'); });
      act(() => { result.current.filter.togglePriority('HIGH'); }); // 토글 해제

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(2); // 다시 전체 표시
    });
  });

  describe('타입 필터', () => {
    it('선택한 타입 티켓만 표시된다', () => {
      const board = makeBoard([
        { type: 'GOAL', status: 'TODO' },
        { type: 'TASK', status: 'TODO' },
        { type: 'STORY', status: 'BACKLOG' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => { result.current.filter.toggleType('GOAL'); });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(1);
      expect(shown[0].type).toBe('GOAL');
    });

    it('여러 타입 선택 시 OR 조건으로 필터링된다', () => {
      const board = makeBoard([
        { type: 'GOAL', status: 'TODO' },
        { type: 'STORY', status: 'TODO' },
        { type: 'TASK', status: 'BACKLOG' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => {
        result.current.filter.toggleType('GOAL');
        result.current.filter.toggleType('STORY');
      });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(2);
    });
  });

  describe('마감일 범위 필터', () => {
    it('dueDateFrom만 설정하면 이후 날짜의 티켓만 표시된다', () => {
      const board = makeBoard([
        { plannedEndDate: '2026-03-01', status: 'TODO' },
        { plannedEndDate: '2026-06-01', status: 'TODO' },
        { plannedEndDate: '2026-09-01', status: 'TODO' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => { result.current.filter.setDueDateFrom('2026-06-01'); });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(2);
      expect(shown.every((t) => t.plannedEndDate! >= '2026-06-01')).toBe(true);
    });

    it('dueDateTo만 설정하면 이전 날짜의 티켓만 표시된다', () => {
      const board = makeBoard([
        { plannedEndDate: '2026-03-01', status: 'TODO' },
        { plannedEndDate: '2026-06-01', status: 'TODO' },
        { plannedEndDate: '2026-09-01', status: 'TODO' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => { result.current.filter.setDueDateTo('2026-06-01'); });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(2);
    });

    it('from과 to를 모두 설정하면 범위 내 티켓만 표시된다', () => {
      const board = makeBoard([
        { plannedEndDate: '2026-03-01', status: 'TODO' },
        { plannedEndDate: '2026-06-01', status: 'TODO' },
        { plannedEndDate: '2026-09-01', status: 'TODO' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => {
        result.current.filter.setDueDateFrom('2026-05-01');
        result.current.filter.setDueDateTo('2026-07-01');
      });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(1);
      expect(shown[0].plannedEndDate).toBe('2026-06-01');
    });

    it('plannedEndDate가 없는 티켓은 날짜 범위 필터에서 제외된다', () => {
      const board = makeBoard([
        { plannedEndDate: null, status: 'TODO' },
        { plannedEndDate: '2026-06-01', status: 'TODO' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => { result.current.filter.setDueDateFrom('2026-01-01'); });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(1);
      expect(shown[0].plannedEndDate).toBe('2026-06-01');
    });
  });

  describe('필터 조합 (AND 조건)', () => {
    it('우선순위 + 타입 필터는 AND 조건이다', () => {
      const board = makeBoard([
        { priority: 'HIGH', type: 'GOAL', status: 'TODO' },
        { priority: 'HIGH', type: 'TASK', status: 'TODO' },
        { priority: 'LOW', type: 'GOAL', status: 'BACKLOG' },
      ]);
      const { result } = renderHook(() => useBoardFilter(board));

      act(() => {
        result.current.filter.togglePriority('HIGH');
        result.current.filter.toggleType('GOAL');
      });

      const shown = Object.values(result.current.displayBoard.board).flat();
      expect(shown).toHaveLength(1);
      expect(shown[0].priority).toBe('HIGH');
      expect(shown[0].type).toBe('GOAL');
    });
  });
});

// ─── 4. 검색 필터 ─────────────────────────────────────────────────────────────

describe('검색 필터 (searchQuery)', () => {
  it('제목에 검색어가 포함된 티켓만 표시된다', () => {
    const board = makeBoard([
      { title: 'API 개발', status: 'TODO' },
      { title: 'UI 개선', status: 'TODO' },
      { title: 'api 테스트', status: 'BACKLOG' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board, 'api'));
    const shown = Object.values(result.current.displayBoard.board).flat();
    expect(shown).toHaveLength(2);
  });

  it('검색은 대소문자를 구분하지 않는다', () => {
    const board = makeBoard([
      { title: 'Login Page', status: 'TODO' },
      { title: 'logout button', status: 'BACKLOG' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board, 'LOGIN'));
    const shown = Object.values(result.current.displayBoard.board).flat();
    expect(shown).toHaveLength(1);
    expect(shown[0].title).toBe('Login Page');
  });

  it('설명(description)에도 검색어를 적용한다', () => {
    const board = makeBoard([
      { title: '기능 A', description: 'OAuth 로그인 구현', status: 'TODO' },
      { title: '기능 B', description: null, status: 'TODO' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board, 'oauth'));
    const shown = Object.values(result.current.displayBoard.board).flat();
    expect(shown).toHaveLength(1);
  });

  it('공백만 있는 검색어는 필터 적용 안 됨 (전체 표시)', () => {
    const board = makeBoard([
      { title: '티켓 1', status: 'TODO' },
      { title: '티켓 2', status: 'BACKLOG' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board, '   '));
    const shown = Object.values(result.current.displayBoard.board).flat();
    expect(shown).toHaveLength(2);
  });

  it('검색 + 빠른 필터를 동시에 적용할 수 있다', () => {
    const board = makeBoard([
      { title: 'API 개발', isOverdue: true, status: 'TODO' },
      { title: 'API 문서', isOverdue: false, status: 'BACKLOG' },
      { title: 'UI 개선', isOverdue: true, status: 'TODO' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board, 'api'));

    act(() => { result.current.filter.setActiveFilter('overdue'); });

    const shown = Object.values(result.current.displayBoard.board).flat();
    expect(shown).toHaveLength(1);
    expect(shown[0].title).toBe('API 개발');
  });
});

// ─── 5. hasActiveFilters & clearAllFilters ────────────────────────────────────

describe('hasActiveFilters & clearAllFilters', () => {
  it('초기에는 hasActiveFilters가 false다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));
    expect(result.current.filter.hasActiveFilters).toBe(false);
  });

  it('activeFilter 변경 시 hasActiveFilters가 true가 된다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));
    act(() => { result.current.filter.setActiveFilter('overdue'); });
    expect(result.current.filter.hasActiveFilters).toBe(true);
  });

  it('priority 필터 적용 시 hasActiveFilters가 true가 된다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));
    act(() => { result.current.filter.togglePriority('HIGH'); });
    expect(result.current.filter.hasActiveFilters).toBe(true);
  });

  it('dueDateFrom 설정 시 hasActiveFilters가 true가 된다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));
    act(() => { result.current.filter.setDueDateFrom('2026-01-01'); });
    expect(result.current.filter.hasActiveFilters).toBe(true);
  });

  it('clearAllFilters 호출 시 모든 필터가 초기화된다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));

    act(() => {
      result.current.filter.setActiveFilter('overdue');
      result.current.filter.togglePriority('HIGH');
      result.current.filter.toggleType('GOAL');
      result.current.filter.setDueDateFrom('2026-01-01');
      result.current.filter.setDueDateTo('2026-12-31');
    });

    act(() => { result.current.filter.clearAllFilters(); });

    expect(result.current.filter.activeFilter).toBe('all');
    expect(result.current.filter.activePriorities).toHaveLength(0);
    expect(result.current.filter.activeTypes).toHaveLength(0);
    expect(result.current.filter.dueDateFrom).toBe('');
    expect(result.current.filter.dueDateTo).toBe('');
    expect(result.current.filter.hasActiveFilters).toBe(false);
    expect(result.current.filter.showAdvancedFilter).toBe(false);
  });
});

// ─── 6. showAdvancedFilter 토글 ───────────────────────────────────────────────

describe('showAdvancedFilter 토글', () => {
  it('초기에는 false다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));
    expect(result.current.filter.showAdvancedFilter).toBe(false);
  });

  it('toggleAdvancedFilter 호출마다 반전된다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));
    act(() => { result.current.filter.toggleAdvancedFilter(); });
    expect(result.current.filter.showAdvancedFilter).toBe(true);
    act(() => { result.current.filter.toggleAdvancedFilter(); });
    expect(result.current.filter.showAdvancedFilter).toBe(false);
  });
});

// ─── 7. 정합성 검증 ───────────────────────────────────────────────────────────

describe('데이터 정합성', () => {
  it('displayBoard.total은 표시된 티켓 수와 일치한다', () => {
    const board = makeBoard([
      { priority: 'HIGH', status: 'TODO' },
      { priority: 'LOW', status: 'BACKLOG' },
      { priority: 'MEDIUM', status: 'IN_PROGRESS' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board));

    act(() => { result.current.filter.togglePriority('HIGH'); });

    const visibleCount = Object.values(result.current.displayBoard.board).reduce((s, a) => s + a.length, 0);
    expect(result.current.displayBoard.total).toBe(visibleCount);
  });

  it('전체 필터 해제 시 displayBoard는 원본 보드와 일치한다', () => {
    const board = makeBoard([
      { status: 'BACKLOG' },
      { status: 'TODO' },
      { status: 'IN_PROGRESS' },
      { status: 'DONE' },
    ]);
    const { result } = renderHook(() => useBoardFilter(board));

    act(() => { result.current.filter.togglePriority('HIGH'); });
    act(() => { result.current.filter.clearAllFilters(); });

    const visible = Object.values(result.current.displayBoard.board).reduce((s, a) => s + a.length, 0);
    expect(visible).toBe(4);
  });

  it('보드가 빈 경우 어떤 필터를 적용해도 오류 없이 빈 결과를 반환한다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));

    act(() => {
      result.current.filter.setActiveFilter('overdue');
      result.current.filter.togglePriority('HIGH');
      result.current.filter.toggleType('GOAL');
      result.current.filter.setDueDateFrom('2026-01-01');
    });

    const visible = Object.values(result.current.displayBoard.board).reduce((s, a) => s + a.length, 0);
    expect(visible).toBe(0);
    expect(result.current.displayBoard.total).toBe(0);
  });

  it('칼럼 구조(BACKLOG/TODO/IN_PROGRESS/DONE)는 필터 후에도 유지된다', () => {
    const { result } = renderHook(() => useBoardFilter(emptyBoard));
    const keys = Object.keys(result.current.displayBoard.board);
    expect(keys).toContain('BACKLOG');
    expect(keys).toContain('TODO');
    expect(keys).toContain('IN_PROGRESS');
    expect(keys).toContain('DONE');
  });
});
