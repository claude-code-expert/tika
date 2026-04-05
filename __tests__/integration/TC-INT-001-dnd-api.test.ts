/**
 * TC-INT-001: 드래그앤드롭 + API 연동 통합 테스트
 *
 * useTickets 훅의 reorder 함수가 낙관적 업데이트 → API 호출 → 실패 시 롤백
 * 사이클을 올바르게 처리하는지 검증한다.
 */
import { renderHook, act } from '@testing-library/react';
import { useTickets } from '@/hooks/useTickets';
import type { BoardData, TicketWithMeta } from '@/types/index';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({ data: null, status: 'unauthenticated' }),
}));

const baseTicket: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: '테스트 티켓',
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
  labels: [],
  checklistItems: [],
  parent: null,
  assignee: null,
  assignees: [],
};

const boardWithTicket: BoardData = {
  board: { BACKLOG: [baseTicket], TODO: [], IN_PROGRESS: [], DONE: [] },
  total: 1,
};

beforeEach(() => {
  global.fetch = jest.fn();
  jest.clearAllMocks();
});

describe('TC-INT-001: 드래그앤드롭 + API 연동', () => {
  // I001-1: BACKLOG → TODO 드래그
  it('I001-1: BACKLOG → TODO 이동 시 UI 즉시 반영 후 API 호출된다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ticket: { ...baseTicket, status: 'TODO' } }),
    });
    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => {
      await result.current.reorder(1, 'TODO', 0);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tickets/reorder',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result.current.board.board.TODO).toHaveLength(1);
    expect(result.current.board.board.BACKLOG).toHaveLength(0);
  });

  // I001-2: API 실패 시 롤백
  it('I001-2: API 실패 시 원래 칼럼으로 롤백된다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { code: 'INTERNAL_ERROR', message: '서버 오류' } }),
    });
    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => {
      try {
        await result.current.reorder(1, 'TODO', 0);
      } catch {
        // expected error
      }
    });

    expect(result.current.board.board.BACKLOG).toHaveLength(1);
    expect(result.current.board.board.TODO).toHaveLength(0);
  });

  // I001-3: → DONE 드래그 시 완료 처리
  it('I001-3: → DONE 이동 후 보드에 DONE 칼럼에 카드가 존재한다', async () => {
    const completedTicket = {
      ...baseTicket,
      status: 'DONE',
      completedAt: '2026-04-05T00:00:00.000Z',
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ticket: completedTicket }),
    });
    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => {
      await result.current.reorder(1, 'DONE', 0);
    });

    expect(result.current.board.board.DONE).toHaveLength(1);
    expect(result.current.board.board.BACKLOG).toHaveLength(0);
  });

  // I001-4: DONE → TODO 이동
  it('I001-4: DONE → TODO 이동 시 TODO 칼럼에 카드가 이동한다', async () => {
    const doneTicket = { ...baseTicket, status: 'DONE' as const, completedAt: '2026-04-05T00:00:00.000Z' };
    const initialBoard: BoardData = {
      board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [doneTicket] },
      total: 1,
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ticket: { ...doneTicket, status: 'TODO', completedAt: null } }),
    });
    const { result } = renderHook(() => useTickets(initialBoard));

    await act(async () => {
      await result.current.reorder(1, 'TODO', 0);
    });

    expect(result.current.board.board.TODO).toHaveLength(1);
    expect(result.current.board.board.DONE).toHaveLength(0);
  });

  // I001-5: 같은 칼럼 내 리오더
  it('I001-5: 같은 칼럼 내 리오더 시 status가 유지된다', async () => {
    const ticket2 = { ...baseTicket, id: 2, position: 1 };
    const initialBoard: BoardData = {
      board: { BACKLOG: [baseTicket, ticket2], TODO: [], IN_PROGRESS: [], DONE: [] },
      total: 2,
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ticket: ticket2 }),
    });
    const { result } = renderHook(() => useTickets(initialBoard));

    await act(async () => {
      await result.current.reorder(2, 'BACKLOG', 0);
    });

    // 칼럼 내 카드 수 유지
    expect(result.current.board.board.BACKLOG).toHaveLength(2);
    // status 변화 없음
    expect(result.current.board.board.BACKLOG[0].status).toBe('BACKLOG');
  });

  // I001-6: 낙관적 업데이트 순서 (UI 먼저 반영, API는 비동기)
  it('I001-6: reorder 호출 즉시 board 상태가 변경된다 (낙관적 업데이트)', async () => {
    let resolveFetch!: (v: unknown) => void;
    (global.fetch as jest.Mock).mockReturnValueOnce(
      new Promise((resolve) => { resolveFetch = resolve; }),
    );
    const { result } = renderHook(() => useTickets(boardWithTicket));

    // reorder를 시작하되 완료 전 board 확인
    act(() => {
      result.current.reorder(1, 'TODO', 0).catch(() => {});
    });

    // fetch가 resolve되기 전이지만 UI는 이미 반영
    expect(result.current.board.board.TODO).toHaveLength(1);
    expect(result.current.board.board.BACKLOG).toHaveLength(0);

    // fetch 완료
    await act(async () => {
      resolveFetch({ ok: true, json: () => Promise.resolve({ ticket: baseTicket }) });
      await Promise.resolve();
    });
  });
});
