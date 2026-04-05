/**
 * TC-INT-003: 필터링 흐름 통합 테스트
 *
 * useTickets 훅의 filteredBoard가 activeLabels 필터를 올바르게 적용하는지,
 * 필터 상태 중에 드래그앤드롭이 정상 동작하는지 검증한다.
 */
import { renderHook, act } from '@testing-library/react';
import { useTickets } from '@/hooks/useTickets';
import type { BoardData, TicketWithMeta, Label } from '@/types/index';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({ data: null, status: 'unauthenticated' }),
}));

const labelBug: Label = { id: 1, workspaceId: 1, name: 'bug', color: '#EF4444', createdAt: '' };
const labelFeat: Label = { id: 2, workspaceId: 1, name: 'feat', color: '#3B82F6', createdAt: '' };

const base: Omit<TicketWithMeta, 'id' | 'labels'> = {
  workspaceId: 1,
  title: '티켓',
  description: null,
  type: 'TASK',
  status: 'BACKLOG',
  priority: 'MEDIUM',
  position: 0,
  dueDate: null,
  parentId: null,
  assigneeId: null,
  sprintId: null,
  storyPoints: null,
  plannedStartDate: null,
  plannedEndDate: null,
  startDate: null,
  completedAt: null,
  deleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isOverdue: false,
  checklistItems: [],
  parent: null,
  assignee: null,
  assignees: [],
};

const ticketBugFeat: TicketWithMeta = { ...base, id: 1, labels: [labelBug, labelFeat] };
const ticketBugOnly: TicketWithMeta = { ...base, id: 2, labels: [labelBug] };
const ticketNoLabel: TicketWithMeta = { ...base, id: 3, labels: [] };
const ticketHigh: TicketWithMeta = { ...base, id: 4, priority: 'HIGH', labels: [] };
const ticketOverdue: TicketWithMeta = {
  ...base, id: 5, labels: [], isOverdue: true,
  dueDate: '2026-01-01',
};

const initialBoard: BoardData = {
  board: {
    BACKLOG: [ticketBugFeat, ticketBugOnly, ticketNoLabel],
    TODO: [ticketHigh],
    IN_PROGRESS: [ticketOverdue],
    DONE: [],
  },
  total: 5,
};

beforeEach(() => {
  global.fetch = jest.fn();
  jest.clearAllMocks();
});

describe('TC-INT-003: 필터링 흐름', () => {
  // I003-1: 단일 라벨 필터
  it('I003-1: bug 라벨 필터 시 bug 라벨이 있는 티켓만 표시된다', () => {
    const { result } = renderHook(() => useTickets(initialBoard));

    act(() => { result.current.toggleLabel(1); }); // bug

    const backlog = result.current.filteredBoard.board.BACKLOG;
    expect(backlog).toHaveLength(2);
    expect(backlog.every((t) => t.labels.some((l) => l.id === 1))).toBe(true);
  });

  // I003-2: 오버듀 티켓 확인
  it('I003-2: isOverdue=true 티켓이 IN_PROGRESS에 존재한다', () => {
    const { result } = renderHook(() => useTickets(initialBoard));

    const inProgress = result.current.board.board.IN_PROGRESS;
    const overdue = inProgress.filter((t) => t.isOverdue);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].id).toBe(5);
  });

  // I003-3: AND 조건 라벨 필터
  it('I003-3: bug + feat 라벨 AND 필터 시 두 라벨 모두 가진 티켓만 표시된다', () => {
    const { result } = renderHook(() => useTickets(initialBoard));

    act(() => {
      result.current.toggleLabel(1); // bug
      result.current.toggleLabel(2); // feat
    });

    const backlog = result.current.filteredBoard.board.BACKLOG;
    expect(backlog).toHaveLength(1);
    expect(backlog[0].id).toBe(1);
  });

  // I003-4: clearLabels — 전체 티켓 복원
  it('I003-4: clearLabels 호출 시 모든 필터가 해제되고 전체 티켓이 표시된다', () => {
    const { result } = renderHook(() => useTickets(initialBoard));

    act(() => { result.current.toggleLabel(1); });
    act(() => { result.current.clearLabels(); });

    expect(result.current.filteredBoard.board.BACKLOG).toHaveLength(3);
    expect(result.current.activeLabels).toHaveLength(0);
  });

  // I003-5: 필터 상태 중 드래그앤드롭
  it('I003-5: 라벨 필터 활성 중 reorder 후에도 필터가 유지된다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ticket: { ...ticketBugFeat, status: 'TODO' } }),
    });
    const { result } = renderHook(() => useTickets(initialBoard));

    // bug 라벨 필터 활성화
    act(() => { result.current.toggleLabel(1); });

    // 필터 중 드래그
    await act(async () => {
      await result.current.reorder(1, 'TODO', 0);
    });

    // 필터 상태 유지
    expect(result.current.activeLabels).toContain(1);
    // 이동 후 BACKLOG에 bug 라벨 티켓은 ticketBugOnly(id:2)만 남음
    expect(result.current.filteredBoard.board.BACKLOG).toHaveLength(1);
    expect(result.current.filteredBoard.board.BACKLOG[0].id).toBe(2);
  });
});
