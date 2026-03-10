import {
  bulkCreateInAppNotifications,
  getDisabledTypesForUsers,
  type CreateInAppNotificationData,
} from '@/db/queries/inAppNotifications';
import type { NotificationType } from '@/types/index';

interface SendNotificationParams {
  workspaceId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actorId: string | null;
  recipientUserIds: string[];
  refType?: string;
  refId?: number;
}

/**
 * Core notification helper.
 * 1. Excludes the actor (self-notifications are skipped).
 * 2. Checks notification_preferences — users who disabled this type are excluded.
 * 3. Bulk inserts into in_app_notifications.
 */
export async function sendInAppNotification(params: SendNotificationParams): Promise<void> {
  const {
    workspaceId,
    type,
    title,
    message,
    link,
    actorId,
    recipientUserIds,
    refType,
    refId,
  } = params;

  // 1. Exclude actor (skip if actorId is null — system-generated notifications)
  const filtered = actorId
    ? recipientUserIds.filter((uid) => uid !== actorId)
    : [...recipientUserIds];
  if (filtered.length === 0) return;

  // 2. Check preferences — find users who disabled this type
  const disabledUsers = await getDisabledTypesForUsers(filtered, workspaceId, type);
  const finalRecipients = filtered.filter((uid) => !disabledUsers.has(uid));
  if (finalRecipients.length === 0) return;

  // 3. Bulk insert
  const items: CreateInAppNotificationData[] = finalRecipients.map((userId) => ({
    userId,
    workspaceId,
    type,
    title,
    message,
    link: link ?? null,
    actorId,
    refType: refType ?? null,
    refId: refId ?? null,
  }));

  await bulkCreateInAppNotifications(items);
}

// ─── Message Builders ───────────────────────────────────────────

export function buildTicketStatusChangedMessage(
  actorName: string,
  ticketTitle: string,
  oldStatus: string,
  newStatus: string,
) {
  return {
    title: '티켓 상태 변경',
    message: `${actorName}님이 '${ticketTitle}'을(를) ${formatStatus(oldStatus)} → ${formatStatus(newStatus)}(으)로 변경했습니다`,
  };
}

export function buildTicketCommentedMessage(actorName: string, ticketTitle: string, commentPreview: string) {
  const preview = commentPreview.length > 50 ? commentPreview.slice(0, 50) + '...' : commentPreview;
  return {
    title: '새 댓글',
    message: `${actorName}님이 '${ticketTitle}'에 댓글을 남겼습니다: "${preview}"`,
  };
}

export function buildTicketAssignedMessage(actorName: string, ticketTitle: string) {
  return {
    title: '티켓 배정',
    message: `${actorName}님이 '${ticketTitle}' 티켓을 배정했습니다`,
  };
}

export function buildTicketUnassignedMessage(actorName: string, ticketTitle: string) {
  return {
    title: '티켓 배정 해제',
    message: `${actorName}님이 '${ticketTitle}' 티켓 배정을 해제했습니다`,
  };
}

export function buildTicketDeletedMessage(actorName: string, ticketTitle: string) {
  return {
    title: '티켓 삭제',
    message: `${actorName}님이 '${ticketTitle}' 티켓을 삭제했습니다`,
  };
}

export function buildDeadlineWarningMessage(ticketTitle: string, dueDate: string) {
  return {
    title: '마감일 임박',
    message: `'${ticketTitle}' 티켓의 마감일이 내일(${dueDate})입니다`,
  };
}

export function buildInviteReceivedMessage(actorName: string, workspaceName: string) {
  return {
    title: '워크스페이스 초대',
    message: `${actorName}님이 '${workspaceName}' 워크스페이스에 초대했습니다`,
  };
}

export function buildRoleChangedMessage(workspaceName: string, oldRole: string, newRole: string) {
  return {
    title: '역할 변경',
    message: `'${workspaceName}' 워크스페이스에서 역할이 ${oldRole} → ${newRole}(으)로 변경되었습니다`,
  };
}

export function buildMemberJoinedMessage(memberName: string, workspaceName: string) {
  return {
    title: '멤버 참여',
    message: `${memberName}님이 '${workspaceName}' 워크스페이스에 참여했습니다`,
  };
}

export function buildMemberRemovedMessage(workspaceName: string) {
  return {
    title: '워크스페이스 제거',
    message: `'${workspaceName}' 워크스페이스에서 제거되었습니다`,
  };
}

export function buildJoinRequestReceivedMessage(requesterName: string, workspaceName: string) {
  return {
    title: '참여 신청',
    message: `${requesterName}님이 '${workspaceName}' 워크스페이스에 참여를 신청했습니다`,
  };
}

export function buildJoinRequestResolvedMessage(workspaceName: string, approved: boolean) {
  return {
    title: '참여 신청 결과',
    message: `'${workspaceName}' 워크스페이스 참여 신청이 ${approved ? '승인' : '거절'}되었습니다`,
  };
}

export function buildSprintStartedMessage(sprintName: string) {
  return {
    title: '스프린트 시작',
    message: `'${sprintName}' 스프린트가 시작되었습니다`,
  };
}

export function buildSprintCompletedMessage(sprintName: string) {
  return {
    title: '스프린트 완료',
    message: `'${sprintName}' 스프린트가 완료되었습니다`,
  };
}

// ─── Helpers ────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'TODO',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
