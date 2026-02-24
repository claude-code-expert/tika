import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardContainer } from '@/components/board/BoardContainer';
import { useTickets } from '@/hooks/useTickets';
import type { BoardData, TicketWithMeta } from '@/types/index';

jest.mock('@/hooks/useTickets');
const mockedUseTickets = useTickets as jest.MockedFunction<typeof useTickets>;

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: () => null,
  MouseSensor: jest.fn(),
  TouchSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  useDroppable: jest.fn(() => ({ setNodeRef: jest.fn(), isOver: false })),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

const mockTicket: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: '테스트 티켓',
  description: null,
  type: 'TASK',
  status: 'TODO',
  priority: 'HIGH',
  position: 0,
  dueDate: '2026-03-15',
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

const mockBoard: BoardData = {
  board: { BACKLOG: [], TODO: [mockTicket], IN_PROGRESS: [], DONE: [] },
  total: 1,
};

const mockHookReturn = {
  board: mockBoard,
  filteredBoard: mockBoard,
  isLoading: false,
  error: null,
  activeLabels: [],
  toggleLabel: jest.fn(),
  clearLabels: jest.fn(),
  fetchBoard: jest.fn(),
  createTicket: jest.fn().mockResolvedValue({}),
  updateTicket: jest.fn().mockResolvedValue({}),
  deleteTicket: jest.fn().mockResolvedValue(undefined),
  reorder: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseTickets.mockReturnValue(mockHookReturn);
});

describe('BoardContainer', () => {
  it('"내 워크스페이스" 헤딩이 렌더링된다', () => {
    render(<BoardContainer />);
    expect(screen.getByRole('heading', { name: '내 워크스페이스' })).toBeInTheDocument();
  });

  it('"+ 새 업무" 버튼이 렌더링된다', () => {
    render(<BoardContainer />);
    expect(screen.getByRole('button', { name: '+ 새 업무' })).toBeInTheDocument();
  });

  it('"+ 새 업무" 클릭 시 생성 모달이 열린다', async () => {
    const user = userEvent.setup();
    render(<BoardContainer />);

    await user.click(screen.getByRole('button', { name: '+ 새 업무' }));

    expect(screen.getByText('새 업무 생성')).toBeInTheDocument();
  });

  it('4개 칼럼 헤더(Backlog/TODO/In Progress/Done)가 표시된다', () => {
    render(<BoardContainer />);

    // Board.tsx COLUMN_LABELS에 정의된 실제 레이블
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('TODO')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('보드에 티켓 카드가 렌더링된다', () => {
    render(<BoardContainer />);
    expect(screen.getByText('테스트 티켓')).toBeInTheDocument();
  });

  it('티켓 카드 클릭 시 상세 모달이 열린다', async () => {
    const user = userEvent.setup();
    render(<BoardContainer />);

    await user.click(screen.getByRole('button', { name: /테스트 티켓/ }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('isLoading=true이면 로딩 메시지가 표시된다', () => {
    mockedUseTickets.mockReturnValue({ ...mockHookReturn, isLoading: true });
    render(<BoardContainer />);

    expect(screen.getByText('보드를 불러오는 중...')).toBeInTheDocument();
  });
});
