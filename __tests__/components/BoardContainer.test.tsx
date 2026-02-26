import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardContainer } from '@/components/board/BoardContainer';
import type { BoardData, TicketWithMeta } from '@/types/index';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';

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

const defaultProps = {
  board: mockBoard,
  isLoading: false,
  createTicket: jest.fn().mockResolvedValue({}) as (data: CreateTicketInput) => Promise<unknown>,
  updateTicket: jest.fn().mockResolvedValue({}) as (id: number, data: UpdateTicketInput) => Promise<unknown>,
  deleteTicket: jest.fn().mockResolvedValue(undefined) as (id: number) => Promise<void>,
  isCreating: false,
  onCreateClose: jest.fn(),
  selectedTicket: null as TicketWithMeta | null,
  onSelectTicket: jest.fn() as (ticket: TicketWithMeta | null) => void,
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ labels: [], issues: [], members: [] }),
  });
  jest.clearAllMocks();
});

describe('BoardContainer', () => {
  it('"새 업무 생성" 모달이 표시된다 (isCreating=true)', () => {
    render(<BoardContainer {...defaultProps} isCreating={true} />);
    expect(screen.getByText('새 업무 생성')).toBeInTheDocument();
  });

  it('isCreating=false이면 생성 모달이 표시되지 않는다', () => {
    render(<BoardContainer {...defaultProps} />);
    expect(screen.queryByText('새 업무 생성')).not.toBeInTheDocument();
  });

  it('3개 칼럼 헤더(TODO/In Progress/Done)가 표시된다', () => {
    render(<BoardContainer {...defaultProps} />);
    expect(screen.getByText('TODO')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('보드에 티켓 카드가 렌더링된다', () => {
    render(<BoardContainer {...defaultProps} />);
    expect(screen.getByText('테스트 티켓')).toBeInTheDocument();
  });

  it('selectedTicket이 있으면 상세 모달이 열린다', () => {
    render(<BoardContainer {...defaultProps} selectedTicket={mockTicket} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('티켓 카드 클릭 시 onSelectTicket이 호출된다', async () => {
    const user = userEvent.setup();
    const onSelectTicket = jest.fn();
    render(<BoardContainer {...defaultProps} onSelectTicket={onSelectTicket} />);

    await user.click(screen.getByRole('button', { name: /테스트 티켓/ }));
    expect(onSelectTicket).toHaveBeenCalledWith(mockTicket);
  });

  it('isLoading=true이면 로딩 메시지가 표시된다', () => {
    render(<BoardContainer {...defaultProps} isLoading={true} />);
    expect(screen.getByText('보드를 불러오는 중...')).toBeInTheDocument();
  });
});
