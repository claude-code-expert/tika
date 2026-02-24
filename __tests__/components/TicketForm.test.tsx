import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketForm } from '@/components/ticket/TicketForm';
import type { TicketWithMeta } from '@/types/index';

const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
const mockOnCancel = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

const editTicket: Partial<TicketWithMeta> = {
  title: '기존 티켓 제목',
  description: '기존 설명 텍스트',
  type: 'FEATURE',
  priority: 'HIGH',
  dueDate: '2026-06-15',
};

describe('TicketForm', () => {
  it('생성 모드에서 빈 필드와 기본값(TASK/MEDIUM)으로 렌더링된다', () => {
    render(<TicketForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/제목/)).toHaveValue('');
    expect(screen.getByLabelText('유형')).toHaveValue('TASK');
    expect(screen.getByLabelText('우선순위')).toHaveValue('MEDIUM');
    expect(screen.getByLabelText('마감일')).toHaveValue('');
    expect(screen.getByLabelText('설명')).toHaveValue('');
  });

  it('생성 모드에서 "생성" 버튼이 표시된다', () => {
    render(<TicketForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByRole('button', { name: '생성' })).toBeInTheDocument();
  });

  it('수정 모드에서 initialData가 각 필드에 반영된다', () => {
    render(
      <TicketForm mode="edit" initialData={editTicket} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    );

    expect(screen.getByLabelText(/제목/)).toHaveValue('기존 티켓 제목');
    expect(screen.getByLabelText('설명')).toHaveValue('기존 설명 텍스트');
    expect(screen.getByLabelText('유형')).toHaveValue('FEATURE');
    expect(screen.getByLabelText('우선순위')).toHaveValue('HIGH');
    expect(screen.getByLabelText('마감일')).toHaveValue('2026-06-15');
  });

  it('수정 모드에서 "저장" 버튼이 표시된다', () => {
    render(<TicketForm mode="edit" initialData={editTicket} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('빈 제목으로 제출하면 에러 메시지가 표시되고 onSubmit이 호출되지 않는다', async () => {
    const user = userEvent.setup();
    render(<TicketForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('정상 제출 시 onSubmit이 올바른 데이터와 함께 호출된다', async () => {
    const user = userEvent.setup();
    render(<TicketForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText(/제목/), '새 티켓 제목');
    await user.selectOptions(screen.getByLabelText('유형'), 'GOAL');
    await user.selectOptions(screen.getByLabelText('우선순위'), 'HIGH');
    await user.type(screen.getByLabelText('설명'), '상세 설명입니다');

    await user.click(screen.getByRole('button', { name: '생성' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '새 티켓 제목',
          type: 'GOAL',
          priority: 'HIGH',
          description: '상세 설명입니다',
        }),
      );
    });
  });

  it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
    const user = userEvent.setup();
    render(<TicketForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('유형 선택지에 Goal/Story/Feature/Task가 포함된다', () => {
    render(<TicketForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const typeSelect = screen.getByLabelText('유형');
    expect(typeSelect).toBeInTheDocument();
    // 실제 option 텍스트는 Go/Story/Feature/Task (Pascal case)
    ['Goal', 'Story', 'Feature', 'Task'].forEach((label) => {
      expect(typeSelect).toContainElement(screen.getByRole('option', { name: label }));
    });
  });

  it('우선순위 선택지에 CRITICAL이 포함된다', () => {
    render(<TicketForm mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByRole('option', { name: 'Critical' })).toBeInTheDocument();
  });
});
