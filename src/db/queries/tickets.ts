import { eq, asc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import type { TicketStatus, TicketPriority } from '@/types';
import { POSITION_GAP } from '@/lib/constants';

// --- 전체 조회 (보드용) ---
export async function getAllTickets() {
  return db.select().from(tickets).orderBy(asc(tickets.position));
}

// --- 단건 조회 ---
export async function getTicketById(id: number) {
  const results = await db.select().from(tickets).where(eq(tickets.id, id));
  return results[0] ?? null;
}

// --- 생성 ---
export async function createTicket(data: {
  title: string;
  description?: string;
  priority?: TicketPriority;
  dueDate?: string;
}) {
  // 현재 BACKLOG 칼럼의 최소 position 조회
  const minResult = await db
    .select({ minPos: sql<number>`COALESCE(MIN(${tickets.position}), ${POSITION_GAP})` })
    .from(tickets)
    .where(eq(tickets.status, 'BACKLOG'));

  const newPosition = (minResult[0]?.minPos ?? POSITION_GAP) - POSITION_GAP;

  const result = await db
    .insert(tickets)
    .values({
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? 'MEDIUM',
      dueDate: data.dueDate ?? null,
      status: 'BACKLOG',
      position: newPosition,
    })
    .returning();

  return result[0];
}

// --- 수정 ---
export async function updateTicket(
  id: number,
  data: {
    title?: string;
    description?: string | null;
    priority?: TicketPriority;
    dueDate?: string | null;
  },
) {
  const result = await db
    .update(tickets)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, id))
    .returning();

  return result[0] ?? null;
}

// --- 삭제 ---
export async function deleteTicket(id: number) {
  const result = await db.delete(tickets).where(eq(tickets.id, id)).returning({ id: tickets.id });
  return result[0] ?? null;
}

// --- 순서/상태 변경 (드래그앤드롭) ---
export async function reorderTicket(data: {
  ticketId: number;
  status: TicketStatus;
  position: number;
}) {
  const { ticketId, status, position: targetIndex } = data;

  // 현재 티켓 조회
  const ticket = await getTicketById(ticketId);
  if (!ticket) return null;

  // 대상 칼럼의 티켓 목록 (이동할 티켓 제외)
  const columnTickets = await db
    .select()
    .from(tickets)
    .where(eq(tickets.status, status))
    .orderBy(asc(tickets.position));

  const filtered = columnTickets.filter((t) => t.id !== ticketId);

  // 새 position 계산
  let newPosition: number;
  if (filtered.length === 0) {
    newPosition = 0;
  } else if (targetIndex <= 0) {
    newPosition = filtered[0].position - POSITION_GAP;
  } else if (targetIndex >= filtered.length) {
    newPosition = filtered[filtered.length - 1].position + POSITION_GAP;
  } else {
    newPosition = Math.floor(
      (filtered[targetIndex - 1].position + filtered[targetIndex].position) / 2,
    );
  }

  // completedAt 처리
  const completedAt =
    status === 'DONE' ? new Date() : ticket.status === 'DONE' ? null : ticket.completedAt;

  // 티켓 업데이트
  const result = await db
    .update(tickets)
    .set({
      status,
      position: newPosition,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();

  return result[0] ?? null;
}
