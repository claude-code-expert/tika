/**
 * WbsClient 컴포넌트 통합 테스트
 *
 * 테스트 대상:
 *   - src/components/team/WbsClient.tsx
 *
 * 커버리지:
 *   1. Stats 카드 5개 렌더링 (Goal / Story / Feature / Task / 전체 완료율)
 *   2. Goal 필터 드롭다운 — 전체 + 개별 Goal 목록
 *   3. Goal 선택 시 info 배너 표시 / 미선택 시 숨김
 *   4. 항목 클릭 → TicketModal open (allTickets에 해당 티켓 있을 때)
 *   5. 항목 클릭 → allTickets에 해당 티켓 없을 때 TicketModal 미open
 *   6. TicketModal onClose → 모달 닫힘
 *   7. readOnly=true 시 TicketModal에 readOnly prop 전달
 *   8. Goal 필터링 시 선택 Goal만 GanttChart에 전달
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WbsClient } from '@/components/team/WbsClient';
import type { WbsStats } from '@/components/team/WbsClient';
import type { GanttItem } from '@/components/team/GanttChart';
import type { TicketWithMeta } from '@/types/index';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

// GanttChart — 복잡한 SVG/ref 렌더링을 피하고 item id list만 노출
jest.mock('@/components/team/GanttChart', () => ({
  GanttChart: ({ items, onItemClick }: { items: GanttItem[]; onItemClick: (item: GanttItem) => void }) => (
    <div data-testid="gantt-chart">
      {items.map((item) => (
        <button
          key={item.id}
          data-testid={`gantt-item-${item.id}`}
          onClick={() => onItemClick(item)}
        >
          {item.name}
        </button>
      ))}
    </div>
  ),
}));

// TicketModal — open 여부와 readOnly만 검증
jest.mock('@/components/ticket/TicketModal', () => ({
  TicketModal: ({
    isOpen,
    onClose,
    ticket,
    readOnly,
  }: {
    isOpen: boolean;
    onClose: () => void;
    ticket: TicketWithMeta;
    readOnly?: boolean;
  }) =>
    isOpen ? (
      <div data-testid="ticket-modal" data-readonly={String(readOnly ?? false)}>
        <span data-testid="modal-ticket-title">{ticket.title}</span>
        <button data-testid="modal-close" onClick={onClose}>
          닫기
        </button>
      </div>
    ) : null,
}));

// ── 픽스쳐 팩토리 ──────────────────────────────────────────────────────────

function makeTicket(overrides: Partial<TicketWithMeta> = {}): TicketWithMeta {
  return {
    id: 1,
    workspaceId: 1,
    title: '기본 티켓',
    description: null,
    type: 'TASK',
    status: 'TODO',
    priority: 'MEDIUM',
    position: 0,
    startDate: null,
    dueDate: null,
    plannedStartDate: null,
    plannedEndDate: null,
    parentId: null,
    assigneeId: null,
    sprintId: null,
    storyPoints: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isOverdue: false,
    labels: [],
    checklistItems: [],
    parent: null,
    assignee: null,
    assignees: [],
    ...overrides,
  };
}

function makeGanttItem(overrides: Partial<GanttItem> = {}): GanttItem {
  return {
    id: 1,
    type: 'TASK',
    name: '기본 항목',
    status: 'TODO',
    priority: 'MEDIUM',
    assignees: [],
    startDate: null,
    endDate: null,
    children: [],
    ...overrides,
  };
}

const defaultStats: WbsStats = {
  goal: 2,
  story: 4,
  feature: 6,
  task: 10,
  overallPct: 35,
};

// ── 테스트 ──────────────────────────────────────────────────────────────────

describe('WbsClient', () => {
  const goal1 = makeGanttItem({ id: 10, type: 'GOAL', name: 'Goal Alpha' });
  const goal2 = makeGanttItem({ id: 20, type: 'GOAL', name: 'Goal Beta' });
  const task1 = makeGanttItem({ id: 100, type: 'TASK', name: 'Task One', startDate: '2026-03-01', endDate: '2026-03-10' });

  const allItems: GanttItem[] = [goal1, goal2, task1];

  const ticket10 = makeTicket({ id: 10, type: 'GOAL', title: 'Goal Alpha 티켓' });
  const ticket20 = makeTicket({ id: 20, type: 'GOAL', title: 'Goal Beta 티켓' });
  const ticket100 = makeTicket({ id: 100, type: 'TASK', title: 'Task One 티켓' });

  const allTickets: TicketWithMeta[] = [ticket10, ticket20, ticket100];

  // ── 1. Stats 카드 ─────────────────────────────────────────────────────────

  describe('Stats 카드', () => {
    it('5개 카드(Goal, Story, Feature, Task, 전체 완료율)가 렌더링된다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="테스트 워크스페이스"
        />,
      );

      expect(screen.getByText('Goal')).toBeInTheDocument();
      expect(screen.getByText('Story')).toBeInTheDocument();
      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('Task')).toBeInTheDocument();
      expect(screen.getByText('전체 완료율')).toBeInTheDocument();
    });

    it('stats props 값이 카드에 올바르게 표시된다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="테스트 워크스페이스"
        />,
      );

      expect(screen.getByText('2')).toBeInTheDocument();   // goal
      expect(screen.getByText('4')).toBeInTheDocument();   // story
      expect(screen.getByText('6')).toBeInTheDocument();   // feature
      expect(screen.getByText('10')).toBeInTheDocument();  // task
      expect(screen.getByText('35%')).toBeInTheDocument(); // overallPct
    });

    it('stats가 모두 0일 때도 정상 렌더링된다', () => {
      const zeroStats: WbsStats = { goal: 0, story: 0, feature: 0, task: 0, overallPct: 0 };
      render(
        <WbsClient
          allItems={[]}
          allTickets={[]}
          stats={zeroStats}
          currentMemberId={null}
          workspaceName="빈 워크스페이스"
        />,
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  // ── 2. Goal 필터 드롭다운 ────────────────────────────────────────────────

  describe('Goal 필터 드롭다운', () => {
    it('"전체 Goal" 옵션과 각 Goal 이름이 select에 포함된다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);

      expect(options).toContain('전체 Goal');
      expect(options).toContain('Goal Alpha');
      expect(options).toContain('Goal Beta');
    });

    it('GOAL 타입이 아닌 항목은 드롭다운에 표시되지 않는다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);

      expect(options).not.toContain('Task One');
    });

    it('초기값은 "전체 Goal" (value="all")이다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('all');
    });
  });

  // ── 3. Goal info 배너 ────────────────────────────────────────────────────

  describe('Goal info 배너', () => {
    it('전체 Goal 선택 시 배너가 표시되지 않는다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      // goal1 이름이 배너에 나타나지 않아야 한다 (드롭다운 option 내 텍스트는 존재함)
      // 배너에는 폰트 크기 구별 없이 이름이 span으로 나타남
      const bannerName = screen.queryByText('Goal Alpha', { selector: 'span' });
      expect(bannerName).not.toBeInTheDocument();
    });

    it('특정 Goal 선택 시 배너가 표시된다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '10' } });

      expect(screen.getByText('Goal Alpha', { selector: 'span' })).toBeInTheDocument();
    });

    it('날짜 범위가 있는 Goal 선택 시 기간 텍스트가 배너에 표시된다', () => {
      const goalWithDates = makeGanttItem({
        id: 30,
        type: 'GOAL',
        name: 'Dated Goal',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

      render(
        <WbsClient
          allItems={[goalWithDates]}
          allTickets={[makeTicket({ id: 30, type: 'GOAL', title: 'Dated Goal' })]}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '30' } });

      expect(screen.getByText(/기간/)).toBeInTheDocument();
    });
  });

  // ── 4. GanttChart 필터링 ─────────────────────────────────────────────────

  describe('GanttChart 항목 필터링', () => {
    it('전체 Goal 선택 시 모든 항목이 GanttChart에 전달된다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      expect(screen.getByTestId('gantt-item-10')).toBeInTheDocument();
      expect(screen.getByTestId('gantt-item-20')).toBeInTheDocument();
      expect(screen.getByTestId('gantt-item-100')).toBeInTheDocument();
    });

    it('특정 Goal 선택 시 해당 Goal만 GanttChart에 전달된다', () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '10' } });

      expect(screen.getByTestId('gantt-item-10')).toBeInTheDocument();
      expect(screen.queryByTestId('gantt-item-20')).not.toBeInTheDocument();
      expect(screen.queryByTestId('gantt-item-100')).not.toBeInTheDocument();
    });
  });

  // ── 5. 항목 클릭 → TicketModal ───────────────────────────────────────────

  describe('항목 클릭 → TicketModal', () => {
    it('allTickets에 해당 id가 있으면 TicketModal이 열린다', async () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      fireEvent.click(screen.getByTestId('gantt-item-100'));

      await waitFor(() => {
        expect(screen.getByTestId('ticket-modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-ticket-title')).toHaveTextContent('Task One 티켓');
      });
    });

    it('allTickets에 해당 id가 없으면 TicketModal이 열리지 않는다', () => {
      const unknownItem = makeGanttItem({ id: 999, name: '미등록 항목' });

      render(
        <WbsClient
          allItems={[unknownItem]}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      fireEvent.click(screen.getByTestId('gantt-item-999'));
      expect(screen.queryByTestId('ticket-modal')).not.toBeInTheDocument();
    });

    it('모달 닫기 버튼 클릭 시 TicketModal이 닫힌다', async () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      fireEvent.click(screen.getByTestId('gantt-item-10'));
      await waitFor(() => expect(screen.getByTestId('ticket-modal')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('modal-close'));
      await waitFor(() => expect(screen.queryByTestId('ticket-modal')).not.toBeInTheDocument());
    });
  });

  // ── 6. readOnly prop ─────────────────────────────────────────────────────

  describe('readOnly prop', () => {
    it('readOnly=true이면 TicketModal에 readOnly=true가 전달된다', async () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
          readOnly={true}
        />,
      );

      fireEvent.click(screen.getByTestId('gantt-item-100'));

      await waitFor(() => {
        const modal = screen.getByTestId('ticket-modal');
        expect(modal).toHaveAttribute('data-readonly', 'true');
      });
    });

    it('readOnly 생략(기본값 false)이면 TicketModal에 readOnly=false가 전달된다', async () => {
      render(
        <WbsClient
          allItems={allItems}
          allTickets={allTickets}
          stats={defaultStats}
          currentMemberId={1}
          workspaceName="W"
        />,
      );

      fireEvent.click(screen.getByTestId('gantt-item-100'));

      await waitFor(() => {
        const modal = screen.getByTestId('ticket-modal');
        expect(modal).toHaveAttribute('data-readonly', 'false');
      });
    });
  });

  // ── 7. 빈 데이터 렌더링 ──────────────────────────────────────────────────

  describe('빈 데이터', () => {
    it('allItems=[] 이어도 에러 없이 렌더링된다', () => {
      expect(() =>
        render(
          <WbsClient
            allItems={[]}
            allTickets={[]}
            stats={{ goal: 0, story: 0, feature: 0, task: 0, overallPct: 0 }}
            currentMemberId={null}
            workspaceName="빈 워크스페이스"
          />,
        ),
      ).not.toThrow();
    });

    it('allItems=[] 이면 드롭다운에 "전체 Goal"만 존재한다', () => {
      render(
        <WbsClient
          allItems={[]}
          allTickets={[]}
          stats={{ goal: 0, story: 0, feature: 0, task: 0, overallPct: 0 }}
          currentMemberId={null}
          workspaceName="빈 워크스페이스"
        />,
      );

      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(1);
      expect(options[0].textContent).toBe('전체 Goal');
    });
  });
});
