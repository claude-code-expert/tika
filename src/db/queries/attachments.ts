import { eq } from 'drizzle-orm';
import { db } from '@/db/index';
import { attachments } from '@/db/schema';
import type { Attachment } from '@/types/index';

function toAttachment(row: typeof attachments.$inferSelect): Attachment {
  return {
    id: row.id,
    ticketId: row.ticketId,
    url: row.url,
    name: row.name,
    size: row.size,
    mimeType: row.mimeType ?? null,
    uploadedBy: row.uploadedBy ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAttachmentsByTicketId(ticketId: number): Promise<Attachment[]> {
  const rows = await db
    .select()
    .from(attachments)
    .where(eq(attachments.ticketId, ticketId))
    .orderBy(attachments.createdAt);
  return rows.map(toAttachment);
}

export async function createAttachment(data: {
  ticketId: number;
  url: string;
  name: string;
  size: number;
  mimeType?: string | null;
  uploadedBy?: number | null;
}): Promise<Attachment> {
  const [row] = await db.insert(attachments).values(data).returning();
  return toAttachment(row);
}

export async function getAttachmentById(id: number): Promise<Attachment | null> {
  const [row] = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
  return row ? toAttachment(row) : null;
}

export async function deleteAttachment(id: number): Promise<boolean> {
  const result = await db
    .delete(attachments)
    .where(eq(attachments.id, id))
    .returning({ id: attachments.id });
  return result.length > 0;
}
