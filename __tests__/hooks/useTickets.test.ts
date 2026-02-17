import { renderHook, act } from '@testing-library/react';
import { useTickets } from '@/client/hooks/useTickets';
import { ticketApi } from '@/client/api/ticketApi';
import type { BoardData, Ticket, TicketWithMeta } from '@/shared/types';

jest.mock('@/client/api/ticketApi');
const mockedApi = ticketApi as jest.Mocked<typeof ticketApi>;

const mockTicket: TicketWithMeta = {
  id: 1,
  title: '테스트 티켓',
  description: '설명',
  status: 'BACKLOG',
  priority: 'MEDIUM',
  position: -1024,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-02-17'),
  updatedAt: new Date('2026-02-17'),
  isOverdue: false,
};

const emptyBoard: BoardData = {
  board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] },
  total: 0,
};

const boardWithTicket: BoardData = {
  board: { BACKLOG: [mockTicket], TODO: [], IN_PROGRESS: [], DONE: [] },
  total: 1,
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('useTickets', () => {
  // 4-2-1: initialData로 board 상태 초기화
  it('initialData로 board 상태를 초기화한다', () => {
    const { result } = renderHook(() => useTickets(emptyBoard));

    expect(result.current.board).toEqual(emptyBoard);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // 4-2-2: create 호출 → ticketApi.create + getBoard
  it('create 호출 시 ticketApi.create 후 getBoard로 갱신한다', async () => {
    const input = { title: '새 티켓', priority: 'HIGH' as const };
    mockedApi.create.mockResolvedValueOnce(mockTicket as Ticket);
    mockedApi.getBoard.mockResolvedValueOnce(boardWithTicket);

    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.create(input);
    });

    expect(mockedApi.create).toHaveBeenCalledWith(input);
    expect(mockedApi.getBoard).toHaveBeenCalled();
    expect(result.current.board).toEqual(boardWithTicket);
  });

  // 4-2-3: update 호출 → ticketApi.update + getBoard
  it('update 호출 시 ticketApi.update 후 getBoard로 갱신한다', async () => {
    const updateData = { title: '수정된 제목' };
    mockedApi.update.mockResolvedValueOnce({ ...mockTicket, ...updateData } as Ticket);
    mockedApi.getBoard.mockResolvedValueOnce(boardWithTicket);

    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.update(1, updateData);
    });

    expect(mockedApi.update).toHaveBeenCalledWith(1, updateData);
    expect(mockedApi.getBoard).toHaveBeenCalled();
    expect(result.current.board).toEqual(boardWithTicket);
  });

  // 4-2-4: remove 호출 → ticketApi.remove + getBoard
  it('remove 호출 시 ticketApi.remove 후 getBoard로 갱신한다', async () => {
    mockedApi.remove.mockResolvedValueOnce(undefined);
    mockedApi.getBoard.mockResolvedValueOnce(emptyBoard);

    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(mockedApi.remove).toHaveBeenCalledWith(1);
    expect(mockedApi.getBoard).toHaveBeenCalled();
    expect(result.current.board).toEqual(emptyBoard);
  });

  // 4-2-5: reorder 호출 → ticketApi.reorder + getBoard
  it('reorder 호출 시 ticketApi.reorder 후 getBoard로 갱신한다', async () => {
    const reorderedBoard: BoardData = {
      board: { BACKLOG: [], TODO: [{ ...mockTicket, status: 'TODO' }], IN_PROGRESS: [], DONE: [] },
      total: 1,
    };
    mockedApi.reorder.mockResolvedValueOnce({
      ticket: { ...mockTicket, status: 'TODO', position: 0 },
      affected: [],
    });
    mockedApi.getBoard.mockResolvedValueOnce(reorderedBoard);

    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => {
      await result.current.reorder(1, 'TODO', 0);
    });

    expect(mockedApi.reorder).toHaveBeenCalledWith({
      ticketId: 1,
      status: 'TODO',
      position: 0,
    });
    expect(mockedApi.getBoard).toHaveBeenCalled();
    expect(result.current.board).toEqual(reorderedBoard);
  });

  // 4-2-6: complete 호출 → ticketApi.complete + getBoard
  it('complete 호출 시 ticketApi.complete 후 getBoard로 갱신한다', async () => {
    const completedBoard: BoardData = {
      board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [{ ...mockTicket, status: 'DONE' }] },
      total: 1,
    };
    mockedApi.complete.mockResolvedValueOnce({ ...mockTicket, status: 'DONE' } as Ticket);
    mockedApi.getBoard.mockResolvedValueOnce(completedBoard);

    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => {
      await result.current.complete(1);
    });

    expect(mockedApi.complete).toHaveBeenCalledWith(1);
    expect(mockedApi.getBoard).toHaveBeenCalled();
    expect(result.current.board).toEqual(completedBoard);
  });

  // 4-2-7: 실패 시 error 상태 설정 (create)
  it('create 실패 시 error 상태를 설정한다', async () => {
    mockedApi.create.mockRejectedValueOnce(new Error('제목을 입력해주세요'));

    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.create({ title: '' });
    });

    expect(result.current.error).toBe('제목을 입력해주세요');
  });

  // 4-2-8: 실패 시 error 상태 설정 (remove)
  it('remove 실패 시 error 상태를 설정한다', async () => {
    mockedApi.remove.mockRejectedValueOnce(new Error('티켓을 찾을 수 없습니다'));

    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.remove(999);
    });

    expect(result.current.error).toBe('티켓을 찾을 수 없습니다');
  });

  // 4-2-9: API 호출 중 isLoading=true
  it('API 호출 중 isLoading이 true가 된다', async () => {
    let resolveCreate: (value: Ticket) => void;
    mockedApi.create.mockReturnValueOnce(
      new Promise((resolve) => { resolveCreate = resolve; })
    );
    mockedApi.getBoard.mockResolvedValueOnce(boardWithTicket);

    const { result } = renderHook(() => useTickets(emptyBoard));

    // create 호출 시작 (await 하지 않음)
    let createPromise: Promise<void>;
    act(() => {
      createPromise = result.current.create({ title: '새 티켓' });
    });

    // isLoading이 true로 변경됨
    expect(result.current.isLoading).toBe(true);

    // create 완료
    await act(async () => {
      resolveCreate!(mockTicket as Ticket);
      await createPromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  // 4-2-10: 에러 후 성공 시 error가 null로 초기화
  it('에러 후 성공하면 error가 null로 초기화된다', async () => {
    mockedApi.create.mockRejectedValueOnce(new Error('실패'));

    const { result } = renderHook(() => useTickets(emptyBoard));

    // 먼저 실패
    await act(async () => {
      await result.current.create({ title: '' });
    });
    expect(result.current.error).toBe('실패');

    // 다시 성공
    mockedApi.create.mockResolvedValueOnce(mockTicket as Ticket);
    mockedApi.getBoard.mockResolvedValueOnce(boardWithTicket);

    await act(async () => {
      await result.current.create({ title: '새 티켓' });
    });
    expect(result.current.error).toBeNull();
  });
});
