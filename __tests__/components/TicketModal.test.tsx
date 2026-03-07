import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketModal } from '@/components/ticket/TicketModal';
import type { TicketWithMeta } from '@/types/index';

const mockOnClose = jest.fn();
const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
const mockOnDelete = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  // Default fetch mock: return empty lists for issues/members/labels/comments
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url === '/api/issues') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ issues: [] }) });
    }
    if (url === '/api/members') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [] }) });
    }
    if (url === '/api/labels') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ labels: [] }) });
    }
    if (url.includes('/comments')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ comments: [] }) });
    }
    return Promise.resolve({ ok: false });
  });
});

const ticket: TicketWithMeta = {
  id: 42,
  workspaceId: 1,
  title: '테스트 티켓',
  description: '설명 텍스트',
  type: 'TASK',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  position: 0,
  startDate: null,
  dueDate: '2026-03-15',
  parentId: null,
  assigneeId: null,
  sprintId: null,
  storyPoints: null,
  completedAt: null,
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-17T00:00:00.000Z',
  isOverdue: false,
  labels: [],
  checklistItems: [],
  parent: null,
  assignee: null,
  assignees: [],
};

describe('TicketModal', () => {
  it('isOpen=false이면 dialog가 렌더링되지 않는다', () => {
    render(
      <TicketModal ticket={ticket} isOpen={false} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('isOpen=true이면 dialog와 티켓 제목 textarea가 표시된다', () => {
    render(
      <TicketModal ticket={ticket} isOpen={true} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('제목')).toBeInTheDocument();
  });

  it('편집 가능한 필드(제목·설명·유형·상태·우선순위·종료예정일)가 표시된다', () => {
    render(
      <TicketModal ticket={ticket} isOpen={true} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );

    expect(screen.getByLabelText('제목')).toBeInTheDocument();
    expect(screen.getByLabelText('설명')).toBeInTheDocument();
    expect(screen.getByLabelText('유형')).toBeInTheDocument();
    expect(screen.getByLabelText('상태')).toBeInTheDocument();
    expect(screen.getByLabelText('우선순위')).toBeInTheDocument();
    expect(screen.getByLabelText('종료 예정일')).toBeInTheDocument();
  });

  it('헤더 닫기(X) 버튼 클릭 시 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    render(
      <TicketModal ticket={ticket} isOpen={true} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );

    // Header X button has aria-label="닫기"
    await user.click(screen.getByLabelText('닫기'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('ESC 키를 누르면 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    render(
      <TicketModal ticket={ticket} isOpen={true} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );

    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('Footer 닫기 버튼 클릭 시 onClose가 호출된다', async () => {
    const user = userEvent.setup();
    render(
      <TicketModal ticket={ticket} isOpen={true} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );

    // Footer "닫기" button (text content "닫기", no aria-label)
    // Header X button has aria-label="닫기"; footer 닫기 button only has text content
    const closeBtns = screen.getAllByRole('button', { name: '닫기' });
    await user.click(closeBtns[closeBtns.length - 1]);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('변경 없이 저장 버튼이 비활성화된다', () => {
    render(
      <TicketModal ticket={ticket} isOpen={true} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );

    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('삭제 버튼 클릭 → ConfirmDialog 표시 → 삭제 확인 → onDelete 호출', async () => {
    const user = userEvent.setup();
    render(
      <TicketModal ticket={ticket} isOpen={true} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );

    // Footer delete button (there are two delete buttons: header icon + footer)
    const deleteBtns = screen.getAllByRole('button', { name: '삭제' });
    await user.click(deleteBtns[deleteBtns.length - 1]);

    expect(screen.getByText(/"테스트 티켓" 티켓을 삭제하시겠습니까\?/)).toBeInTheDocument();

    // ConfirmDialog는 role="alertdialog", 확인 버튼은 "삭제" 텍스트
    const confirmDialog = screen.getByRole('alertdialog');
    await user.click(within(confirmDialog).getByRole('button', { name: '삭제' }));
    expect(mockOnDelete).toHaveBeenCalledWith(42);
  });

  it('삭제 확인 다이얼로그에서 취소 시 onDelete가 호출되지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <TicketModal ticket={ticket} isOpen={true} onClose={mockOnClose} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />,
    );

    const deleteBtns = screen.getAllByRole('button', { name: '삭제' });
    await user.click(deleteBtns[deleteBtns.length - 1]);

    // alertdialog 내부의 취소 버튼으로 범위 제한
    const confirmDialog = screen.getByRole('alertdialog');
    await user.click(within(confirmDialog).getByRole('button', { name: '취소' }));

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('마감 초과 티켓이면 경고 텍스트가 표시된다', () => {
    render(
      <TicketModal
        ticket={{ ...ticket, isOverdue: true }}
        isOpen={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText('마감 초과')).toBeInTheDocument();
  });
});
