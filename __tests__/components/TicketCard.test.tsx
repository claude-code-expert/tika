import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCard } from '@/components/board/TicketCard';
import type { TicketWithMeta } from '@/types/index';

jest.mock('@dnd-kit/sortable', () => ({
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

const baseTicket: TicketWithMeta = {
  id: 1,
  workspaceId: 1,
  title: 'API 설계 문서 작성',
  description: 'REST API 엔드포인트를 정의한다',
  type: 'TASK',
  status: 'TODO',
  priority: 'MEDIUM',
  position: 0,
  dueDate: '2026-03-01',
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

describe('TicketCard', () => {
  it('제목과 우선순위 뱃지가 표시된다', () => {
    render(<TicketCard ticket={baseTicket} />);

    expect(screen.getByText('API 설계 문서 작성')).toBeInTheDocument();
    expect(screen.getByText('Med')).toBeInTheDocument();
  });

  it('타입 인디케이터가 표시된다', () => {
    render(<TicketCard ticket={baseTicket} />);
    expect(screen.getByText('T')).toBeInTheDocument(); // TASK → T
  });

  it('마감일이 표시된다', () => {
    render(<TicketCard ticket={baseTicket} />);
    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
  });

  it('dueDate=null이면 날짜가 표시되지 않는다', () => {
    render(<TicketCard ticket={{ ...baseTicket, dueDate: null }} />);
    expect(screen.queryByText('2026-03-01')).not.toBeInTheDocument();
  });

  it('isOverdue=true이면 마감 초과 경고가 표시된다', () => {
    render(<TicketCard ticket={{ ...baseTicket, isOverdue: true }} />);
    expect(screen.getByLabelText('마감 초과')).toBeInTheDocument();
  });

  it('isOverdue=false이면 마감 초과 경고가 없다', () => {
    render(<TicketCard ticket={baseTicket} />);
    expect(screen.queryByLabelText('마감 초과')).not.toBeInTheDocument();
  });

  it('카드 클릭 시 onClick이 호출된다', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<TicketCard ticket={baseTicket} onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: /API 설계 문서 작성/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('라벨이 있으면 라벨 이름이 표시된다', () => {
    const withLabels: TicketWithMeta = {
      ...baseTicket,
      labels: [
        { id: 1, workspaceId: 1, name: 'Frontend', color: '#2b7fff', createdAt: '2026-02-17T00:00:00.000Z' },
        { id: 2, workspaceId: 1, name: 'Bug', color: '#fb2c36', createdAt: '2026-02-17T00:00:00.000Z' },
      ],
    };
    render(<TicketCard ticket={withLabels} />);

    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
  });

  it('라벨이 4개 이상이면 +N 오버플로우가 표시된다', () => {
    const withManyLabels: TicketWithMeta = {
      ...baseTicket,
      labels: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        workspaceId: 1,
        name: `라벨${i + 1}`,
        color: '#000000',
        createdAt: '2026-02-17T00:00:00.000Z',
      })),
    };
    render(<TicketCard ticket={withManyLabels} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('체크리스트가 있으면 완료/전체 카운트가 표시된다', () => {
    const withChecklist: TicketWithMeta = {
      ...baseTicket,
      checklistItems: [
        { id: 1, ticketId: 1, text: '항목 1', isCompleted: true, createdAt: '2026-02-17T00:00:00.000Z' },
        { id: 2, ticketId: 1, text: '항목 2', isCompleted: false, createdAt: '2026-02-17T00:00:00.000Z' },
        { id: 3, ticketId: 1, text: '항목 3', isCompleted: false, createdAt: '2026-02-17T00:00:00.000Z' },
      ],
    };
    render(<TicketCard ticket={withChecklist} />);
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('담당자가 있으면 이니셜이 표시된다', () => {
    const withAssignee: TicketWithMeta = {
      ...baseTicket,
      assignee: {
        id: 1,
        userId: 'user-1',
        workspaceId: 1,
        displayName: '홍길동',
        color: '#7EB4A2',
        createdAt: '2026-02-17T00:00:00.000Z',
      },
    };
    render(<TicketCard ticket={withAssignee} />);
    expect(screen.getByTitle('홍길동')).toBeInTheDocument();
  });

  it.each([
    ['LOW', 'Low'],
    ['MEDIUM', 'Med'],
    ['HIGH', 'High'],
    ['CRITICAL', 'Crit'],
  ] as const)('priority=%s → "%s" 뱃지가 표시된다', (priority, label) => {
    render(<TicketCard ticket={{ ...baseTicket, priority }} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each([
    ['GOAL', 'G'],
    ['STORY', 'S'],
    ['FEATURE', 'F'],
    ['TASK', 'T'],
  ] as const)('type=%s → "%s" 인디케이터가 표시된다', (type, letter) => {
    render(<TicketCard ticket={{ ...baseTicket, type }} />);
    expect(screen.getByText(letter)).toBeInTheDocument();
  });
});
