import { z } from 'zod';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_TYPE,
  ISSUE_TYPE,
} from '@/types/index';
import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from './constants';

const ticketStatusValues = Object.values(TICKET_STATUS) as [string, ...string[]];
const ticketPriorityValues = Object.values(TICKET_PRIORITY) as [string, ...string[]];
const ticketTypeValues = Object.values(TICKET_TYPE) as [string, ...string[]];
const issueTypeValues = Object.values(ISSUE_TYPE) as [string, ...string[]];

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(TITLE_MAX_LENGTH, `제목은 ${TITLE_MAX_LENGTH}자 이하여야 합니다`)
    .refine((v) => v.trim().length > 0, '제목을 입력해주세요'),
  description: z
    .string()
    .max(DESCRIPTION_MAX_LENGTH, `설명은 ${DESCRIPTION_MAX_LENGTH}자 이하여야 합니다`)
    .nullable()
    .optional(),
  type: z.enum(ticketTypeValues as [string, ...string[]]).optional().default('TASK'),
  priority: z.enum(ticketPriorityValues as [string, ...string[]]).optional().default('MEDIUM'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .nullable()
    .optional(),
  issueId: z.number().int().positive().nullable().optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
});

export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(TITLE_MAX_LENGTH)
    .refine((v) => v.trim().length > 0, '제목을 입력해주세요')
    .optional(),
  description: z.string().max(DESCRIPTION_MAX_LENGTH).nullable().optional(),
  type: z.enum(ticketTypeValues as [string, ...string[]]).optional(),
  status: z.enum(ticketStatusValues as [string, ...string[]]).optional(),
  priority: z.enum(ticketPriorityValues as [string, ...string[]]).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .nullable()
    .optional(),
  issueId: z.number().int().positive().nullable().optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
  labelIds: z.array(z.number().int().positive()).optional(),
});

export const reorderSchema = z.object({
  ticketId: z.number().int().positive(),
  targetStatus: z.enum(ticketStatusValues as [string, ...string[]]),
  targetIndex: z.number().int().min(0),
});

export const createLabelSchema = z.object({
  name: z
    .string()
    .min(1, '라벨명을 입력해주세요')
    .max(20, '라벨명은 20자 이하여야 합니다'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, '색상 코드가 올바르지 않습니다 (#RRGGBB)'),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(20).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, '색상 코드가 올바르지 않습니다 (#RRGGBB)')
    .optional(),
});

export const createIssueSchema = z.object({
  name: z
    .string()
    .min(1, '이슈명을 입력해주세요')
    .max(100, '이슈명은 100자 이하여야 합니다'),
  type: z.enum(issueTypeValues as [string, ...string[]]),
  parentId: z.number().int().positive().nullable().optional(),
});

export const updateIssueSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.number().int().positive().nullable().optional(),
});

export const createChecklistItemSchema = z.object({
  text: z
    .string()
    .min(1, '내용을 입력해주세요')
    .max(200, `항목은 200자 이하여야 합니다`),
});

export const updateChecklistItemSchema = z.object({
  text: z.string().min(1).max(200).optional(),
  isCompleted: z.boolean().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
