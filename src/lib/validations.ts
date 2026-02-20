import { z } from 'zod';
import { TICKET_PRIORITY, TICKET_STATUS } from '@/types';
import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from './constants';

// --- 티켓 생성 ---
export const createTicketSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(TITLE_MAX_LENGTH, `제목은 ${TITLE_MAX_LENGTH}자 이내로 입력해주세요`)
    .trim(),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, `설명은 ${DESCRIPTION_MAX_LENGTH}자 이내로 입력해주세요`)
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .refine(
      (date) => {
        const today = new Date().toISOString().split('T')[0];
        return date >= today;
      },
      { message: '마감일은 오늘 이후여야 합니다' },
    )
    .optional(),
});

// --- 티켓 수정 ---
export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(TITLE_MAX_LENGTH, `제목은 ${TITLE_MAX_LENGTH}자 이내로 입력해주세요`)
    .trim()
    .optional(),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, `설명은 ${DESCRIPTION_MAX_LENGTH}자 이내로 입력해주세요`)
    .nullable()
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .nullable()
    .optional(),
});

// --- 순서/상태 변경 ---
export const reorderTicketSchema = z.object({
  ticketId: z.number().int().positive('유효한 티켓 ID가 필요합니다'),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'], {
    errorMap: () => ({ message: '유효하지 않은 상태값입니다' }),
  }),
  position: z.number().int('위치는 정수여야 합니다'),
});

// --- path parameter ID ---
export const ticketIdSchema = z.object({
  id: z.coerce.number().int().positive('유효한 티켓 ID가 필요합니다'),
});
