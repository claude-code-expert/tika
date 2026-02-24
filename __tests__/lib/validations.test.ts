import {
  createTicketSchema,
  updateTicketSchema,
  reorderSchema,
  createLabelSchema,
  updateLabelSchema,
  createIssueSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from '@/lib/validations';
import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from '@/lib/constants';

describe('createTicketSchema', () => {
  it('최소 유효한 입력(title만)으로 파싱에 성공한다', () => {
    const result = createTicketSchema.safeParse({ title: '제목' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('TASK');
      expect(result.data.priority).toBe('MEDIUM');
    }
  });

  it('title이 비어 있으면 에러를 반환한다', () => {
    const result = createTicketSchema.safeParse({ title: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('제목을 입력해주세요');
    }
  });

  it('title이 공백만이면 에러를 반환한다', () => {
    const result = createTicketSchema.safeParse({ title: '   ' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('제목을 입력해주세요');
    }
  });

  it(`title이 ${TITLE_MAX_LENGTH}자를 초과하면 에러를 반환한다`, () => {
    const result = createTicketSchema.safeParse({ title: 'a'.repeat(TITLE_MAX_LENGTH + 1) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain(`${TITLE_MAX_LENGTH}자 이하여야 합니다`);
    }
  });

  it('유효하지 않은 dueDate 형식이면 에러를 반환한다', () => {
    const result = createTicketSchema.safeParse({ title: '제목', dueDate: '2026/02/24' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
    }
  });

  it('유효한 YYYY-MM-DD 형식의 dueDate는 통과한다', () => {
    const result = createTicketSchema.safeParse({ title: '제목', dueDate: '2026-03-15' });

    expect(result.success).toBe(true);
  });

  it('dueDate=null은 허용된다', () => {
    const result = createTicketSchema.safeParse({ title: '제목', dueDate: null });

    expect(result.success).toBe(true);
  });

  it('유효한 type 값은 통과한다', () => {
    for (const type of ['GOAL', 'STORY', 'FEATURE', 'TASK'] as const) {
      const result = createTicketSchema.safeParse({ title: '제목', type });
      expect(result.success).toBe(true);
    }
  });

  it('유효한 priority 값은 통과한다', () => {
    for (const priority of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const) {
      const result = createTicketSchema.safeParse({ title: '제목', priority });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateTicketSchema', () => {
  it('빈 객체도 유효하다 (모든 필드가 optional)', () => {
    const result = updateTicketSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('status 필드를 업데이트할 수 있다', () => {
    const result = updateTicketSchema.safeParse({ status: 'IN_PROGRESS' });

    expect(result.success).toBe(true);
  });

  it('유효하지 않은 status이면 에러를 반환한다', () => {
    const result = updateTicketSchema.safeParse({ status: 'INVALID' });

    expect(result.success).toBe(false);
  });

  it('labelIds 배열을 포함할 수 있다', () => {
    const result = updateTicketSchema.safeParse({ labelIds: [1, 2, 3] });

    expect(result.success).toBe(true);
  });

  it(`description이 ${DESCRIPTION_MAX_LENGTH}자를 초과하면 에러를 반환한다`, () => {
    const result = updateTicketSchema.safeParse({
      description: 'a'.repeat(DESCRIPTION_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});

describe('reorderSchema', () => {
  it('유효한 reorder 입력이 통과한다', () => {
    const result = reorderSchema.safeParse({
      ticketId: 1,
      targetStatus: 'TODO',
      targetIndex: 0,
    });

    expect(result.success).toBe(true);
  });

  it('ticketId가 없으면 에러를 반환한다', () => {
    const result = reorderSchema.safeParse({ targetStatus: 'TODO', targetIndex: 0 });

    expect(result.success).toBe(false);
  });

  it('targetIndex가 음수이면 에러를 반환한다', () => {
    const result = reorderSchema.safeParse({
      ticketId: 1,
      targetStatus: 'TODO',
      targetIndex: -1,
    });

    expect(result.success).toBe(false);
  });

  it('유효하지 않은 targetStatus이면 에러를 반환한다', () => {
    const result = reorderSchema.safeParse({
      ticketId: 1,
      targetStatus: 'UNKNOWN',
      targetIndex: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe('createLabelSchema', () => {
  it('유효한 name과 color로 파싱에 성공한다', () => {
    const result = createLabelSchema.safeParse({ name: 'Bug', color: '#fb2c36' });

    expect(result.success).toBe(true);
  });

  it('name이 비어 있으면 에러를 반환한다', () => {
    const result = createLabelSchema.safeParse({ name: '', color: '#000000' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('라벨명을 입력해주세요');
    }
  });

  it('name이 20자를 초과하면 에러를 반환한다', () => {
    const result = createLabelSchema.safeParse({ name: 'a'.repeat(21), color: '#000000' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('라벨명은 20자 이하여야 합니다');
    }
  });

  it('color 형식이 #RRGGBB가 아니면 에러를 반환한다', () => {
    const result = createLabelSchema.safeParse({ name: 'Bug', color: 'red' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('색상 코드가 올바르지 않습니다 (#RRGGBB)');
    }
  });

  it('대소문자를 모두 허용하는 hex color가 통과한다', () => {
    expect(createLabelSchema.safeParse({ name: 'X', color: '#AABBCC' }).success).toBe(true);
    expect(createLabelSchema.safeParse({ name: 'X', color: '#aabbcc' }).success).toBe(true);
  });
});

describe('updateLabelSchema', () => {
  it('빈 객체도 유효하다 (모든 필드가 optional)', () => {
    expect(updateLabelSchema.safeParse({}).success).toBe(true);
  });

  it('잘못된 color 형식이면 에러를 반환한다', () => {
    const result = updateLabelSchema.safeParse({ color: '#GGGGGG' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('색상 코드가 올바르지 않습니다 (#RRGGBB)');
    }
  });
});

describe('createIssueSchema', () => {
  it('유효한 이슈 입력이 통과한다', () => {
    const result = createIssueSchema.safeParse({ name: '기능 구현', type: 'FEATURE' });

    expect(result.success).toBe(true);
  });

  it('name이 비어 있으면 에러를 반환한다', () => {
    const result = createIssueSchema.safeParse({ name: '', type: 'GOAL' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('이슈명을 입력해주세요');
    }
  });

  it('name이 100자를 초과하면 에러를 반환한다', () => {
    const result = createIssueSchema.safeParse({ name: 'a'.repeat(101), type: 'STORY' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('이슈명은 100자 이하여야 합니다');
    }
  });

  it('유효하지 않은 type이면 에러를 반환한다', () => {
    const result = createIssueSchema.safeParse({ name: '이슈', type: 'TASK' });

    expect(result.success).toBe(false);
  });

  it('유효한 type 값(GOAL/STORY/FEATURE)은 모두 통과한다', () => {
    for (const type of ['GOAL', 'STORY', 'FEATURE'] as const) {
      const result = createIssueSchema.safeParse({ name: '이슈', type });
      expect(result.success).toBe(true);
    }
  });
});

describe('createChecklistItemSchema', () => {
  it('유효한 text로 파싱에 성공한다', () => {
    const result = createChecklistItemSchema.safeParse({ text: '항목 내용' });

    expect(result.success).toBe(true);
  });

  it('text가 비어 있으면 에러를 반환한다', () => {
    const result = createChecklistItemSchema.safeParse({ text: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('내용을 입력해주세요');
    }
  });

  it('text가 200자를 초과하면 에러를 반환한다', () => {
    const result = createChecklistItemSchema.safeParse({ text: 'a'.repeat(201) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('항목은 200자 이하여야 합니다');
    }
  });
});

describe('updateChecklistItemSchema', () => {
  it('빈 객체도 유효하다', () => {
    expect(updateChecklistItemSchema.safeParse({}).success).toBe(true);
  });

  it('isCompleted 불리언 필드가 통과한다', () => {
    expect(updateChecklistItemSchema.safeParse({ isCompleted: true }).success).toBe(true);
    expect(updateChecklistItemSchema.safeParse({ isCompleted: false }).success).toBe(true);
  });

  it('text와 isCompleted를 함께 업데이트할 수 있다', () => {
    const result = updateChecklistItemSchema.safeParse({ text: '수정된 내용', isCompleted: true });

    expect(result.success).toBe(true);
  });
});
