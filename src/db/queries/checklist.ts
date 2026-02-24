import { eq, max, count } from 'drizzle-orm';
import { db } from '@/db/index';
import { checklistItems } from '@/db/schema';
import type { ChecklistItem } from '@/types/index';
import { CHECKLIST_MAX_ITEMS } from '@/lib/constants';

function toChecklistItem(row: typeof checklistItems.$inferSelect): ChecklistItem {
  return {
    id: row.id,
    ticketId: row.ticketId,
    text: row.text,
    isCompleted: row.isCompleted,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getChecklistByTicket(ticketId: number): Promise<ChecklistItem[]> {
  const rows = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.ticketId, ticketId));
  return rows.map(toChecklistItem);
}

export async function addChecklistItem(
  ticketId: number,
  text: string,
): Promise<ChecklistItem | { error: 'LIMIT_EXCEEDED' }> {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(checklistItems)
    .where(eq(checklistItems.ticketId, ticketId));

  if (Number(cnt) >= CHECKLIST_MAX_ITEMS) {
    return { error: 'LIMIT_EXCEEDED' };
  }

  const [{ maxPos }] = await db
    .select({ maxPos: max(checklistItems.position) })
    .from(checklistItems)
    .where(eq(checklistItems.ticketId, ticketId));

  const [inserted] = await db
    .insert(checklistItems)
    .values({ ticketId, text, position: (maxPos ?? 0) + 1 })
    .returning();

  return toChecklistItem(inserted);
}

export async function toggleChecklistItem(
  itemId: number,
  isCompleted: boolean,
): Promise<ChecklistItem | null> {
  const [updated] = await db
    .update(checklistItems)
    .set({ isCompleted })
    .where(eq(checklistItems.id, itemId))
    .returning();
  return updated ? toChecklistItem(updated) : null;
}

export async function updateChecklistItem(
  itemId: number,
  data: { text?: string; isCompleted?: boolean },
): Promise<ChecklistItem | null> {
  const [updated] = await db
    .update(checklistItems)
    .set(data)
    .where(eq(checklistItems.id, itemId))
    .returning();
  return updated ? toChecklistItem(updated) : null;
}

export async function deleteChecklistItem(itemId: number): Promise<boolean> {
  const result = await db
    .delete(checklistItems)
    .where(eq(checklistItems.id, itemId))
    .returning({ id: checklistItems.id });
  return result.length > 0;
}
