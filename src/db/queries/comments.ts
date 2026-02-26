import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db/index';
import { comments, members } from '@/db/schema';
import type { Comment } from '@/types/index';

function toComment(
  row: typeof comments.$inferSelect,
  member?: { displayName: string; color: string } | null,
): Comment {
  return {
    id: row.id,
    ticketId: row.ticketId,
    memberId: row.memberId ?? null,
    memberName: member?.displayName ?? null,
    memberColor: member?.color ?? null,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCommentsByTicketId(ticketId: number): Promise<Comment[]> {
  const rows = await db
    .select({
      comment: comments,
      memberName: members.displayName,
      memberColor: members.color,
    })
    .from(comments)
    .leftJoin(members, eq(comments.memberId, members.id))
    .where(eq(comments.ticketId, ticketId))
    .orderBy(desc(comments.createdAt));

  return rows.map((r) =>
    toComment(r.comment, r.memberName ? { displayName: r.memberName, color: r.memberColor! } : null),
  );
}

export async function createComment(
  ticketId: number,
  memberId: number | null,
  text: string,
): Promise<Comment> {
  const [inserted] = await db
    .insert(comments)
    .values({ ticketId, memberId, text })
    .returning();

  let member: { displayName: string; color: string } | null = null;
  if (memberId) {
    const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
    if (m) member = { displayName: m.displayName, color: m.color };
  }

  return toComment(inserted, member);
}

export async function updateComment(
  id: number,
  memberId: number,
  text: string,
): Promise<Comment | null> {
  const [updated] = await db
    .update(comments)
    .set({ text })
    .where(and(eq(comments.id, id), eq(comments.memberId, memberId)))
    .returning();
  if (!updated) return null;

  const [m] = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  return toComment(updated, m ? { displayName: m.displayName, color: m.color } : null);
}

export async function deleteComment(id: number, memberId: number): Promise<boolean> {
  const result = await db
    .delete(comments)
    .where(and(eq(comments.id, id), eq(comments.memberId, memberId)))
    .returning({ id: comments.id });
  return result.length > 0;
}
