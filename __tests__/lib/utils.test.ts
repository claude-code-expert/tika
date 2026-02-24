import {
  isOverdue,
  groupTicketsByStatus,
  calculatePosition,
  applyOptimisticMove,
  rebalancePositions,
} from '@/lib/utils';
import type { BoardData, Ticket, TicketWithMeta } from '@/types/index';
import { POSITION_GAP } from '@/lib/constants';

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

// isOverdue는 현재 날짜 기준으로 동작하므로 fake timer 사용
describe('isOverdue', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-02-24T12:00:00.000Z') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('dueDate가 null이면 false를 반환한다', () => {
    expect(isOverdue(null, 'BACKLOG')).toBe(false);
  });

  it('status가 DONE이면 false를 반환한다', () => {
    expect(isOverdue('2026-01-01', 'DONE')).toBe(false);
  });

  it('dueDate가 오늘보다 과거면 true를 반환한다', () => {
    expect(isOverdue('2026-02-23', 'TODO')).toBe(true);
  });

  it('dueDate가 오늘이면 false를 반환한다', () => {
    expect(isOverdue('2026-02-24', 'IN_PROGRESS')).toBe(false);
  });

  it('dueDate가 미래면 false를 반환한다', () => {
    expect(isOverdue('2026-03-01', 'BACKLOG')).toBe(false);
  });
});

describe('groupTicketsByStatus', () => {
  it('티켓을 status별로 분류한다', () => {
    const tickets: TicketWithMeta[] = [
      { ...baseTicket, id: 1, status: 'BACKLOG', position: 1024 },
      { ...baseTicket, id: 2, status: 'TODO', position: 1024 },
      { ...baseTicket, id: 3, status: 'BACKLOG', position: 2048 },
    ];

    const result = groupTicketsByStatus(tickets);

    expect(result.BACKLOG).toHaveLength(2);
    expect(result.TODO).toHaveLength(1);
    expect(result.IN_PROGRESS).toHaveLength(0);
    expect(result.DONE).toHaveLength(0);
  });

  it('같은 status 내에서 position 오름차순으로 정렬된다', () => {
    const tickets: TicketWithMeta[] = [
      { ...baseTicket, id: 1, status: 'BACKLOG', position: 2048 },
      { ...baseTicket, id: 2, status: 'BACKLOG', position: 1024 },
    ];

    const result = groupTicketsByStatus(tickets);

    expect(result.BACKLOG[0].id).toBe(2);
    expect(result.BACKLOG[1].id).toBe(1);
  });

  it('빈 배열이면 모든 status가 빈 배열이다', () => {
    const result = groupTicketsByStatus([]);

    expect(result.BACKLOG).toHaveLength(0);
    expect(result.TODO).toHaveLength(0);
    expect(result.IN_PROGRESS).toHaveLength(0);
    expect(result.DONE).toHaveLength(0);
  });
});

describe('calculatePosition', () => {
  it('위아래 모두 null이면 0을 반환한다', () => {
    expect(calculatePosition(null, null)).toBe(0);
  });

  it('above=null이면 below - POSITION_GAP을 반환한다', () => {
    expect(calculatePosition(null, 1024)).toBe(1024 - POSITION_GAP);
  });

  it('below=null이면 above + POSITION_GAP을 반환한다', () => {
    expect(calculatePosition(1024, null)).toBe(1024 + POSITION_GAP);
  });

  it('위아래 모두 있으면 중간값(floor)을 반환한다', () => {
    expect(calculatePosition(1024, 2048)).toBe(Math.floor((1024 + 2048) / 2));
  });

  it('홀수 합산의 경우 내림한 중간값을 반환한다', () => {
    expect(calculatePosition(1024, 1025)).toBe(Math.floor((1024 + 1025) / 2));
  });
});

describe('applyOptimisticMove', () => {
  const boardWithTicket: BoardData = {
    board: {
      BACKLOG: [{ ...baseTicket, id: 1 }],
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    },
    total: 1,
  };

  it('티켓을 targetStatus의 targetIndex 위치로 이동시킨다', () => {
    const result = applyOptimisticMove(boardWithTicket, 1, 'TODO', 0);

    expect(result.board.BACKLOG).toHaveLength(0);
    expect(result.board.TODO).toHaveLength(1);
    expect(result.board.TODO[0].id).toBe(1);
    expect(result.board.TODO[0].status).toBe('TODO');
  });

  it('targetIndex가 배열 길이를 초과하면 끝에 삽입된다', () => {
    const board: BoardData = {
      board: {
        BACKLOG: [{ ...baseTicket, id: 1 }],
        TODO: [
          { ...baseTicket, id: 2 },
          { ...baseTicket, id: 3 },
        ],
        IN_PROGRESS: [],
        DONE: [],
      },
      total: 3,
    };

    const result = applyOptimisticMove(board, 1, 'TODO', 99);

    expect(result.board.TODO).toHaveLength(3);
    expect(result.board.TODO[2].id).toBe(1);
  });

  it('같은 칼럼 내에서도 순서를 변경한다', () => {
    const board: BoardData = {
      board: {
        BACKLOG: [
          { ...baseTicket, id: 1, position: 1024 },
          { ...baseTicket, id: 2, position: 2048 },
        ],
        TODO: [],
        IN_PROGRESS: [],
        DONE: [],
      },
      total: 2,
    };

    const result = applyOptimisticMove(board, 2, 'BACKLOG', 0);

    expect(result.board.BACKLOG[0].id).toBe(2);
    expect(result.board.BACKLOG[1].id).toBe(1);
  });

  it('존재하지 않는 ticketId면 원본 board를 그대로 반환한다', () => {
    const result = applyOptimisticMove(boardWithTicket, 999, 'TODO', 0);

    expect(result).toBe(boardWithTicket);
  });
});

describe('rebalancePositions', () => {
  it('position을 POSITION_GAP 간격으로 재정렬한다', () => {
    const tickets: Ticket[] = [
      { ...baseTicket, id: 1, position: 3 },
      { ...baseTicket, id: 2, position: 1 },
      { ...baseTicket, id: 3, position: 2 },
    ];

    const result = rebalancePositions(tickets);

    // position 오름차순 정렬 후 순서: id=2(1), id=3(2), id=1(3)
    expect(result).toEqual([
      { id: 2, position: POSITION_GAP },
      { id: 3, position: POSITION_GAP * 2 },
      { id: 1, position: POSITION_GAP * 3 },
    ]);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(rebalancePositions([])).toEqual([]);
  });

  it('단일 티켓이면 POSITION_GAP 위치를 할당한다', () => {
    const result = rebalancePositions([{ ...baseTicket, id: 5, position: 999 }]);

    expect(result).toEqual([{ id: 5, position: POSITION_GAP }]);
  });
});
