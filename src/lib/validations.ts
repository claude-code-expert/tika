import { z } from 'zod';
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_TYPE,
  TEAM_ROLE,
  NOTIFICATION_TYPE,
} from '@/types/index';
import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from './constants';

const ticketStatusValues = Object.values(TICKET_STATUS) as [string, ...string[]];
const ticketPriorityValues = Object.values(TICKET_PRIORITY) as [string, ...string[]];
const ticketTypeValues = Object.values(TICKET_TYPE) as [string, ...string[]];

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
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .nullable()
    .optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .nullable()
    .optional(),
  plannedStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .nullable()
    .optional(),
  plannedEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .nullable()
    .optional(),
  parentId: z.number().int().positive().nullable().optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
  assigneeIds: z.array(z.number().int().positive()).max(5, '담당자는 최대 5명까지 배정할 수 있습니다').optional(),
  sprintId: z.number().int().positive().nullable().optional(),
  storyPoints: z.number().int().min(1).max(100).nullable().optional(),
  labelIds: z.array(z.number().int().positive()).optional(),
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
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .nullable()
    .optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .nullable()
    .optional(),
  plannedStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .nullable()
    .optional(),
  plannedEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .nullable()
    .optional(),
  parentId: z.number().int().positive().nullable().optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
  assigneeIds: z.array(z.number().int().positive()).max(5, '담당자는 최대 5명까지 배정할 수 있습니다').optional(),
  sprintId: z.number().int().positive().nullable().optional(),
  storyPoints: z.number().int().min(1).max(100).nullable().optional(),
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

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, '워크스페이스 이름을 입력해주세요')
    .max(100, '워크스페이스 이름은 100자 이하여야 합니다'),
  description: z.string().max(200, '설명은 200자 이하여야 합니다').nullable().optional(),
});

export const updateWorkspaceSchema = z
  .object({
    name: z.string().min(1, '이름은 1자 이상 입력해야 합니다').max(100, '이름은 100자 이하여야 합니다').optional(),
    description: z.string().max(200, '설명은 200자 이하여야 합니다').nullable().optional(),
    iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '올바른 HEX 색상 코드를 입력해주세요').nullable().optional(),
    isSearchable: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.iconColor !== undefined ||
      data.isSearchable !== undefined,
    { message: '수정할 항목이 없습니다' },
  );

export const deleteWorkspaceSchema = z.object({
  confirmName: z.string().min(1, '워크스페이스 이름을 입력해주세요'),
});

export const upsertNotificationChannelSchema = z
  .object({
    type: z.enum(['slack', 'telegram']),
    config: z.union([
      z.object({ webhookUrl: z.string() }),
      z.object({ botToken: z.string(), chatId: z.string() }),
      z.object({}),
    ]),
    enabled: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.enabled) return true;
      if (data.type === 'slack') {
        const cfg = data.config as { webhookUrl?: string };
        return !!cfg.webhookUrl?.trim();
      }
      if (data.type === 'telegram') {
        const cfg = data.config as { botToken?: string; chatId?: string };
        return !!cfg.botToken?.trim() && !!cfg.chatId?.trim();
      }
      return true;
    },
    { message: '활성화된 채널에는 설정 값이 필요합니다', path: ['config'] },
  );

// Member role schema (Phase 4: updated to OWNER/MEMBER/VIEWER)
export const updateMemberRoleSchema = z.object({
  role: z.enum([TEAM_ROLE.OWNER, TEAM_ROLE.MEMBER, TEAM_ROLE.VIEWER]),
});

// Invite schemas
export const createInviteSchema = z.object({
  role: z.enum([TEAM_ROLE.MEMBER, TEAM_ROLE.VIEWER]),
});

// Sprint schemas
export const createSprintSchema = z.object({
  name: z
    .string()
    .min(1, '스프린트 이름을 입력해주세요')
    .max(100, '스프린트 이름은 100자 이하여야 합니다'),
  goal: z.string().max(500, '목표는 500자 이하여야 합니다').nullable().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .nullable()
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)')
    .nullable()
    .optional(),
  storyPointsTotal: z.number().int().min(0).nullable().optional(),
});

export const updateSprintSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    goal: z.string().max(500).nullable().optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
      .nullable()
      .optional(),
    storyPointsTotal: z.number().int().min(0).nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.goal !== undefined ||
      data.startDate !== undefined ||
      data.endDate !== undefined ||
      data.storyPointsTotal !== undefined,
    { message: '수정할 항목이 없습니다' },
  );

export const completeSprintSchema = z.object({
  ticketMoves: z.array(
    z
      .object({
        ticketId: z.number().int().positive(),
        destination: z.enum(['backlog', 'sprint']),
        targetSprintId: z.number().int().positive().optional(),
      })
      .refine(
        (item) => item.destination !== 'sprint' || item.targetSprintId !== undefined,
        { message: 'sprint 목적지에는 targetSprintId가 필요합니다' },
      ),
  ),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type CompleteSprintInput = z.infer<typeof completeSprintSchema>;

// Onboarding schemas
export const patchUserTypeSchema = z.object({
  userType: z.enum(['USER', 'WORKSPACE']),
});

export const postJoinRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

export const patchJoinRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});

export const workspaceSearchSchema = z.object({
  q: z.string().min(1).max(50),
});

export const withdrawAccountSchema = z.object({
  confirmEmail: z.string().email('올바른 이메일을 입력해주세요'),
});

export const transferOwnerSchema = z.object({
  targetMemberId: z.number().int().positive(),
});

export const resetWorkspaceSchema = z.object({
  confirmName: z.string().min(1),
});

// In-App notification schemas
const notificationTypeValues = Object.values(NOTIFICATION_TYPE) as [string, ...string[]];

export const inAppNotificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  workspaceId: z.coerce.number().int().positive().optional(),
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export const updateNotificationPreferenceSchema = z.object({
  workspaceId: z.number().int().positive(),
  type: z.enum(notificationTypeValues),
  inAppEnabled: z.boolean(),
});

export type InAppNotificationQueryInput = z.infer<typeof inAppNotificationQuerySchema>;
export type UpdateNotificationPreferenceInput = z.infer<typeof updateNotificationPreferenceSchema>;

export type PatchUserTypeInput = z.infer<typeof patchUserTypeSchema>;
export type PostJoinRequestInput = z.infer<typeof postJoinRequestSchema>;
export type PatchJoinRequestInput = z.infer<typeof patchJoinRequestSchema>;
export type WithdrawAccountInput = z.infer<typeof withdrawAccountSchema>;
