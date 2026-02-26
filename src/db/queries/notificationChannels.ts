import { eq, and } from 'drizzle-orm';
import { db } from '@/db/index';
import { notificationChannels } from '@/db/schema';
import type { NotificationChannel, NotificationChannelType } from '@/types/index';

function toChannel(row: typeof notificationChannels.$inferSelect): NotificationChannel {
  let config: NotificationChannel['config'];
  try {
    config = JSON.parse(row.config) as NotificationChannel['config'];
  } catch {
    config = {};
  }
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    type: row.type as NotificationChannelType,
    config,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getNotificationChannels(
  workspaceId: number,
): Promise<NotificationChannel[]> {
  const rows = await db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.workspaceId, workspaceId));
  return rows.map(toChannel);
}

export async function upsertNotificationChannel(
  workspaceId: number,
  type: NotificationChannelType,
  data: { config: NotificationChannel['config']; enabled: boolean },
): Promise<NotificationChannel> {
  const configStr = JSON.stringify(data.config);
  const [row] = await db
    .insert(notificationChannels)
    .values({ workspaceId, type, config: configStr, enabled: data.enabled })
    .onConflictDoUpdate({
      target: [notificationChannels.workspaceId, notificationChannels.type],
      set: { config: configStr, enabled: data.enabled },
    })
    .returning();
  return toChannel(row);
}

export async function getNotificationChannelByType(
  workspaceId: number,
  type: NotificationChannelType,
): Promise<NotificationChannel | null> {
  const [row] = await db
    .select()
    .from(notificationChannels)
    .where(and(eq(notificationChannels.workspaceId, workspaceId), eq(notificationChannels.type, type)))
    .limit(1);
  return row ? toChannel(row) : null;
}
