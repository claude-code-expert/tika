import { eq, desc, count, and } from 'drizzle-orm';
import { db } from '@/db/index';
import { notificationLogs } from '@/db/schema';
import type { NotificationLog, NotificationChannelType, NotificationStatus } from '@/types/index';

function toLog(row: typeof notificationLogs.$inferSelect): NotificationLog {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    ticketId: row.ticketId ?? null,
    channel: row.channel as NotificationChannelType,
    message: row.message,
    status: row.status as NotificationStatus,
    sentAt: row.sentAt.toISOString(),
    errorMessage: row.errorMessage ?? null,
    isRead: row.isRead,
  };
}

export async function createNotificationLog(data: {
  workspaceId: number;
  ticketId?: number | null;
  channel: NotificationChannelType;
  message: string;
  status: NotificationStatus;
  errorMessage?: string | null;
}): Promise<NotificationLog> {
  const [inserted] = await db
    .insert(notificationLogs)
    .values({
      workspaceId: data.workspaceId,
      ticketId: data.ticketId ?? null,
      channel: data.channel,
      message: data.message,
      status: data.status,
      errorMessage: data.errorMessage ?? null,
    })
    .returning();
  return toLog(inserted);
}

export async function getNotificationLogs(
  workspaceId: number,
  limit = 20,
): Promise<NotificationLog[]> {
  const rows = await db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.workspaceId, workspaceId))
    .orderBy(desc(notificationLogs.sentAt))
    .limit(limit);
  return rows.map(toLog);
}

export async function getUnreadNotificationCount(workspaceId: number): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(notificationLogs)
    .where(and(eq(notificationLogs.workspaceId, workspaceId), eq(notificationLogs.isRead, false)));
  return Number(result.value);
}

export async function markAllNotificationsAsRead(workspaceId: number): Promise<number> {
  const result = await db
    .update(notificationLogs)
    .set({ isRead: true })
    .where(and(eq(notificationLogs.workspaceId, workspaceId), eq(notificationLogs.isRead, false)))
    .returning({ id: notificationLogs.id });
  return result.length;
}
