import { renderHook, act } from '@testing-library/react';
import { useTickets } from '@/hooks/useTickets';
import type { BoardData, TicketWithMeta } from '@/types/index';

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
  issueId: null,
  assigneeId: null,
  completedAt: null,
  createdAt: '2026-02-17T00:00:00.000Z',
  updatedAt: '2026-02-17T00:00:00.000Z',
  isOverdue: false,
  labels: [],
  checklistItems: [],
  issue: null,
  assignee: null,
};

const emptyBoard: BoardData = {
  board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] },
  total: 0,
};

const boardWithTicket: BoardData = {
  board: { BACKLOG: [baseTicket], TODO: [], IN_PROGRESS: [], DONE: [] },
  total: 1,
};

beforeEach(() => {
  global.fetch = jest.fn();
  jest.clearAllMocks();
});

describe('useTickets 초기화', () => {
  it('initialData로 board 상태를 초기화한다', () => {
    const { result } = renderHook(() => useTickets(boardWithTicket));

    expect(result.current.board).toEqual(boardWithTicket);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('initialData 없으면 빈 board로 시작한다', () => {
    const { result } = renderHook(() => useTickets());

    expect(result.current.board.total).toBe(0);
    expect(result.current.board.board.BACKLOG).toHaveLength(0);
  });
});

describe('라벨 필터 (T057)', () => {
  it('toggleLabel로 라벨을 activeLabels에 추가한다', () => {
    const { result } = renderHook(() => useTickets());

    act(() => { result.current.toggleLabel(1); });

    expect(result.current.activeLabels).toContain(1);
  });

  it('같은 라벨 다시 toggleLabel 하면 제거된다', () => {
    const { result } = renderHook(() => useTickets());

    act(() => { result.current.toggleLabel(1); });
    act(() => { result.current.toggleLabel(1); });

    expect(result.current.activeLabels).not.toContain(1);
  });

  it('clearLabels로 activeLabels가 초기화된다', () => {
    const { result } = renderHook(() => useTickets());

    act(() => {
      result.current.toggleLabel(1);
      result.current.toggleLabel(2);
    });
    act(() => { result.current.clearLabels(); });

    expect(result.current.activeLabels).toHaveLength(0);
  });

  it('activeLabels 없으면 filteredBoard === board', () => {
    const { result } = renderHook(() => useTickets(boardWithTicket));
    expect(result.current.filteredBoard).toEqual(result.current.board);
  });

  it('filteredBoard는 AND 조건으로 필터링된다', () => {
    const label1 = { id: 1, workspaceId: 1, name: 'bug', color: '#f00', createdAt: '' };
    const label2 = { id: 2, workspaceId: 1, name: 'feat', color: '#0f0', createdAt: '' };

    const initialBoard: BoardData = {
      board: {
        BACKLOG: [
          { ...baseTicket, id: 1, labels: [label1, label2] },
          { ...baseTicket, id: 2, labels: [label1] },
        ],
        TODO: [],
        IN_PROGRESS: [],
        DONE: [],
      },
      total: 2,
    };

    const { result } = renderHook(() => useTickets(initialBoard));

    // label1 + label2 모두 있는 티켓만
    act(() => {
      result.current.toggleLabel(1);
      result.current.toggleLabel(2);
    });

    expect(result.current.filteredBoard.board.BACKLOG).toHaveLength(1);
    expect(result.current.filteredBoard.board.BACKLOG[0].id).toBe(1);
  });
});

describe('createTicket', () => {
  it('POST /api/tickets를 호출하고 board를 갱신한다', async () => {
    const newTicket = { ...baseTicket, id: 2, title: '새 티켓' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ticket: newTicket }),
    });

    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.createTicket({ title: '새 티켓' });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/tickets',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.current.board.board.BACKLOG).toHaveLength(1);
  });

  it('API 실패 시 에러를 throw한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: '제목을 입력해주세요' } }),
    });

    const { result } = renderHook(() => useTickets(emptyBoard));

    await expect(
      act(async () => { await result.current.createTicket({ title: '' }); }),
    ).rejects.toThrow('제목을 입력해주세요');
  });
});

describe('deleteTicket', () => {
  it('DELETE /api/tickets/:id를 호출하고 board에서 티켓을 제거한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => { await result.current.deleteTicket(1); });

    expect(global.fetch).toHaveBeenCalledWith('/api/tickets/1', { method: 'DELETE' });
    expect(result.current.board.board.BACKLOG).toHaveLength(0);
    expect(result.current.board.total).toBe(0);
  });
});

describe('reorder (Optimistic UI)', () => {
  it('즉시 Optimistic 이동을 적용한다', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ticket: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(boardWithTicket),
      });

    const { result } = renderHook(() => useTickets(boardWithTicket));

    act(() => {
      result.current.reorder(1, 'TODO', 0);
    });

    // Optimistic: 즉시 반영
    expect(result.current.board.board.BACKLOG).toHaveLength(0);
    expect(result.current.board.board.TODO).toHaveLength(1);
  });

  it('reorder 실패 시 snapshot으로 롤백된다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: '순서 변경에 실패했습니다' } }),
    });

    const { result } = renderHook(() => useTickets(boardWithTicket));

    await expect(
      act(async () => { await result.current.reorder(1, 'TODO', 0); }),
    ).rejects.toThrow();

    // 롤백 확인
    expect(result.current.board).toEqual(boardWithTicket);
  });
});

describe('fetchBoard', () => {
  it('GET /api/tickets를 호출하고 board를 설정한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(boardWithTicket),
    });

    const { result } = renderHook(() => useTickets());

    await act(async () => { await result.current.fetchBoard(); });

    expect(result.current.board).toEqual(boardWithTicket);
    expect(result.current.isLoading).toBe(false);
  });

  it('API 실패 시 error 상태를 설정한다', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(emptyBoard) }) // useEffect
      .mockResolvedValueOnce({ ok: false }); // explicit fetchBoard call

    const { result } = renderHook(() => useTickets());

    await act(async () => { await result.current.fetchBoard(); });

    expect(result.current.error).toBe('보드 데이터를 불러오지 못했습니다');
  });
});
