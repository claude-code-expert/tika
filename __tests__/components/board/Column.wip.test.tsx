/**
 * Column WIP warning tests
 */

// dnd-kit mock
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

jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
  useDndContext: () => ({ active: null, over: null }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

import { render, screen } from '@testing-library/react';
import { Column } from '@/components/board/Column';
import type { TicketWithMeta } from '@/types/index';

const MEMBER_ID = 1;

function makeTicket(id: number): TicketWithMeta {
  return {
    id,
    workspaceId: 1,
    title: `티켓 ${id}`,
    description: null,
    type: 'TASK',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    position: id * 1024,
    startDate: null,
    dueDate: null,
    plannedStartDate: null,
    plannedEndDate: null,
    parentId: null,
    assigneeId: MEMBER_ID,
    sprintId: null,
    storyPoints: null,
    completedAt: null,
    deleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isOverdue: false,
    labels: [],
    assignees: [{ id: MEMBER_ID, displayName: 'Test', color: '#629584' } as unknown as ReturnType<typeof makeTicket>['assignees'][0]],
    assignee: null,
    checklistTotal: 0,
    checklistDone: 0,
    checklistItems: [],
  } as unknown as TicketWithMeta;
}

describe('Column WIP warning', () => {
  it('WIP warning shows when IN_PROGRESS column has > 3 tickets assigned to current member', () => {
    const tickets = [1, 2, 3, 4].map(makeTicket);
    render(
      <Column
        status="IN_PROGRESS"
        label="진행 중"
        tickets={tickets}
        onTicketClick={jest.fn()}
        currentMemberId={MEMBER_ID}
      />,
    );

    // The warning badge should be present
    expect(screen.getByTitle('WIP 한도 초과: 내 진행 중 업무가 3개를 초과했습니다')).toBeInTheDocument();
    expect(screen.getByText('⚠ 4/3')).toBeInTheDocument();
  });

  it('WIP warning is absent when IN_PROGRESS column has <= 3 tickets assigned to current member', () => {
    const tickets = [1, 2, 3].map(makeTicket);
    render(
      <Column
        status="IN_PROGRESS"
        label="진행 중"
        tickets={tickets}
        onTicketClick={jest.fn()}
        currentMemberId={MEMBER_ID}
      />,
    );

    expect(screen.queryByTitle('WIP 한도 초과: 내 진행 중 업무가 3개를 초과했습니다')).not.toBeInTheDocument();
  });

  it('WIP warning does not appear for TODO column even with > 3 tickets', () => {
    const tickets = [1, 2, 3, 4].map((id) => ({ ...makeTicket(id), status: 'TODO' as const }));
    render(
      <Column
        status="TODO"
        label="할 일"
        tickets={tickets}
        onTicketClick={jest.fn()}
        currentMemberId={MEMBER_ID}
      />,
    );

    expect(screen.queryByTitle('WIP 한도 초과: 내 진행 중 업무가 3개를 초과했습니다')).not.toBeInTheDocument();
  });
});
