import { eq, and, desc, count, lt, sql, inArray } from 'drizzle-orm';
import { db } from '@/db/index';
import { inAppNotifications, notificationPreferences, users } from '@/db/schema';
import type { InAppNotification, NotificationType } from '@/types/index';

function toNotification(
  row: typeof inAppNotifications.$inferSelect,
  actorName?: string | null,
): InAppNotification {
  return {
    id: row.id,
    userId: row.userId,
    workspaceId: row.workspaceId ?? null,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    link: row.link ?? null,
    actorId: row.actorId ?? null,
    actorName: actorName ?? null,
    refType: row.refType ?? null,
    refId: row.refId ?? null,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

// ----- Create -----

export interface CreateInAppNotificationData {
  userId: string;
  workspaceId?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  actorId?: string | null;
  refType?: string | null;
  refId?: number | null;
}

export async function bulkCreateInAppNotifications(
  items: CreateInAppNotificationData[],
): Promise<void> {
  if (items.length === 0) return;
  await db.insert(inAppNotifications).values(
    items.map((item) => ({
      userId: item.userId,
      workspaceId: item.workspaceId ?? null,
      type: item.type,
      title: item.title,
      message: item.message,
      link: item.link ?? null,
      actorId: item.actorId ?? null,
      refType: item.refType ?? null,
      refId: item.refId ?? null,
    })),
  );
}

// ----- Read -----

export async function getInAppNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    workspaceId?: number;
    unreadOnly?: boolean;
  } = {},
): Promise<{ notifications: InAppNotification[]; total: number; hasMore: boolean }> {
  const { page = 1, limit = 20, workspaceId, unreadOnly = false } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(inAppNotifications.userId, userId)];
  if (workspaceId) conditions.push(eq(inAppNotifications.workspaceId, workspaceId));
  if (unreadOnly) conditions.push(eq(inAppNotifications.isRead, false));

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [rows, [totalResult]] = await Promise.all([
    db
      .select({
        notification: inAppNotifications,
        actorName: users.name,
      })
      .from(inAppNotifications)
      .leftJoin(users, eq(inAppNotifications.actorId, users.id))
      .where(where)
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(inAppNotifications)
      .where(where),
  ]);

  const total = Number(totalResult.value);
  return {
    notifications: rows.map((r) => toNotification(r.notification, r.actorName)),
    total,
    hasMore: offset + limit < total,
  };
}

const MEMBER_ALERT_TYPES = [
  'JOIN_REQUEST_RECEIVED',
  'MEMBER_JOINED',
  'MEMBER_REMOVED',
  'ROLE_CHANGED',
] as const;

export async function getInAppMemberAlertCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(inAppNotifications)
    .where(
      and(
        eq(inAppNotifications.userId, userId),
        eq(inAppNotifications.isRead, false),
        inArray(inAppNotifications.type, [...MEMBER_ALERT_TYPES]),
      ),
    );
  return Number(result.value);
}

export async function getInAppUnreadCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(inAppNotifications)
    .where(
      and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.isRead, false)),
    );
  return Number(result.value);
}

// ----- Update -----

export async function markInAppNotificationAsRead(
  notificationId: number,
  userId: string,
): Promise<boolean> {
  const result = await db
    .update(inAppNotifications)
    .set({ isRead: true })
    .where(
      and(eq(inAppNotifications.id, notificationId), eq(inAppNotifications.userId, userId)),
    )
    .returning({ id: inAppNotifications.id });
  return result.length > 0;
}

export async function markAllInAppNotificationsAsRead(userId: string): Promise<number> {
  const result = await db
    .update(inAppNotifications)
    .set({ isRead: true })
    .where(
      and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.isRead, false)),
    )
    .returning({ id: inAppNotifications.id });
  return result.length;
}

// ----- Cleanup -----

export async function deleteOldInAppNotifications(daysOld = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = await db
    .delete(inAppNotifications)
    .where(lt(inAppNotifications.createdAt, cutoff))
    .returning({ id: inAppNotifications.id });
  return result.length;
}

// ----- Preferences -----

export async function getNotificationPreferences(
  userId: string,
  workspaceId: number,
): Promise<Record<string, boolean>> {
  const rows = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.workspaceId, workspaceId),
      ),
    );

  const prefs: Record<string, boolean> = {};
  for (const row of rows) {
    prefs[row.type] = row.inAppEnabled;
  }
  return prefs;
}

export async function upsertNotificationPreference(
  userId: string,
  workspaceId: number,
  type: string,
  inAppEnabled: boolean,
): Promise<void> {
  await db
    .insert(notificationPreferences)
    .values({ userId, workspaceId, type, inAppEnabled })
    .onConflictDoUpdate({
      target: [
        notificationPreferences.userId,
        notificationPreferences.workspaceId,
        notificationPreferences.type,
      ],
      set: { inAppEnabled },
    });
}

export async function getDisabledTypesForUsers(
  userIds: string[],
  workspaceId: number,
  type: string,
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const rows = await db
    .select({ userId: notificationPreferences.userId })
    .from(notificationPreferences)
    .where(
      and(
        sql`${notificationPreferences.userId} IN (${sql.join(
          userIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
        eq(notificationPreferences.workspaceId, workspaceId),
        eq(notificationPreferences.type, type),
        eq(notificationPreferences.inAppEnabled, false),
      ),
    );

  return new Set(rows.map((r) => r.userId));
}
