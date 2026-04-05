/**
 * TC-INT-002: 티켓 CRUD 전체 흐름 통합 테스트
 *
 * useTickets 훅의 createTicket / deleteTicket이 API 호출 후
 * board 상태에 올바르게 반영되는지 검증한다.
 */
import { renderHook, act } from '@testing-library/react';
import { useTickets } from '@/hooks/useTickets';
import type { BoardData, TicketWithMeta, Label, ChecklistItem } from '@/types/index';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn().mockReturnValue({ data: null, status: 'unauthenticated' }),
}));

const baseTicket: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: '기존 티켓',
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

describe('TC-INT-002: 티켓 CRUD 전체 흐름', () => {
  // I002-1: 생성 → 보드 반영
  it('I002-1: 티켓 생성 후 BACKLOG에 카드가 추가된다', async () => {
    const newTicket = { ...baseTicket, id: 2, title: '신규 티켓' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ ticket: newTicket }),
    });
    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.createTicket({ title: '신규 티켓' });
    });

    expect(result.current.board.board.BACKLOG).toHaveLength(1);
    expect(result.current.board.board.BACKLOG[0].title).toBe('신규 티켓');
    expect(result.current.board.total).toBe(1);
  });

  // I002-2: 수정 → 보드 반영 (reorder로 상태 변경)
  it('I002-2: 상태 변경 후 해당 칼럼에 카드가 이동한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ticket: { ...baseTicket, status: 'TODO' } }),
    });
    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => {
      await result.current.reorder(1, 'TODO', 0);
    });

    expect(result.current.board.board.TODO).toHaveLength(1);
    expect(result.current.board.board.TODO[0].id).toBe(1);
    expect(result.current.board.board.BACKLOG).toHaveLength(0);
  });

  // I002-3: 삭제 → 보드 반영
  it('I002-3: 티켓 삭제 후 보드에서 카드가 제거된다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    const { result } = renderHook(() => useTickets(boardWithTicket));

    await act(async () => {
      await result.current.deleteTicket(1);
    });

    expect(result.current.board.board.BACKLOG).toHaveLength(0);
    expect(result.current.board.total).toBe(0);
  });

  // I002-4: 생성 + 체크리스트
  it('I002-4: 체크리스트가 포함된 티켓을 생성하면 checklistItems가 반영된다', async () => {
    const item: ChecklistItem = {
      id: 10,
      ticketId: 2,
      text: '하위 작업',
      isCompleted: false,
      position: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const newTicket = { ...baseTicket, id: 2, title: '체크리스트 티켓', checklistItems: [item] };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ ticket: newTicket }),
    });
    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.createTicket({ title: '체크리스트 티켓' });
    });

    expect(result.current.board.board.BACKLOG[0].checklistItems).toHaveLength(1);
    expect(result.current.board.board.BACKLOG[0].checklistItems[0].text).toBe('하위 작업');
  });

  // I002-5: 생성 + 라벨
  it('I002-5: 라벨이 포함된 티켓을 생성하면 labels가 반영된다', async () => {
    const label: Label = { id: 5, workspaceId: 1, name: 'bug', color: '#EF4444', createdAt: '' };
    const newTicket = { ...baseTicket, id: 2, title: '라벨 티켓', labels: [label] };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ ticket: newTicket }),
    });
    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.createTicket({ title: '라벨 티켓' });
    });

    expect(result.current.board.board.BACKLOG[0].labels).toHaveLength(1);
    expect(result.current.board.board.BACKLOG[0].labels[0].name).toBe('bug');
  });

  // I002-6: 생성 + 담당자
  it('I002-6: 담당자가 포함된 티켓을 생성하면 assignees가 반영된다', async () => {
    const assignee = {
      id: 3,
      userId: 'user-1',
      workspaceId: 1,
      displayName: 'Alice',
      color: '#7EB4A2',
      role: 'MEMBER' as const,
      isPrimary: false,
      invitedBy: null,
      joinedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const newTicket = { ...baseTicket, id: 2, assignees: [assignee] };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ ticket: newTicket }),
    });
    const { result } = renderHook(() => useTickets(emptyBoard));

    await act(async () => {
      await result.current.createTicket({ title: '담당자 티켓' });
    });

    expect(result.current.board.board.BACKLOG[0].assignees).toHaveLength(1);
    expect(result.current.board.board.BACKLOG[0].assignees[0].displayName).toBe('Alice');
  });
});
