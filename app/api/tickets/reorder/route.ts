import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { reorderSchema } from '@/lib/validations';
import { db } from '@/db/index';
import { tickets } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { POSITION_GAP, REBALANCE_THRESHOLD } from '@/lib/constants';

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

async function rebalanceColumn(workspaceId: number, status: string): Promise<void> {
  const columnTickets = await db
    .select({ id: tickets.id, position: tickets.position })
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.status, status)))
    .orderBy(asc(tickets.position));

  await Promise.all(
    columnTickets.map((t, i) =>
      db
        .update(tickets)
        .set({ position: (i + 1) * POSITION_GAP })
        .where(eq(tickets.id, t.id)),
    ),
  );
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }
    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = reorderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const { ticketId, targetStatus, targetIndex } = result.data;

    // Fetch ticket and verify ownership
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.workspaceId, workspaceId)))
      .limit(1);

    if (!ticket) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    // Fetch target column tickets ordered by position
    const columnTickets = await db
      .select({ id: tickets.id, position: tickets.position })
      .from(tickets)
      .where(
        and(
          eq(tickets.workspaceId, workspaceId),
          eq(tickets.status, targetStatus),
          // Exclude the moving ticket itself
        ),
      )
      .orderBy(asc(tickets.position));

    const filtered = columnTickets.filter((t) => t.id !== ticketId);
    const clampedIndex = Math.min(targetIndex, filtered.length);

    const above = clampedIndex > 0 ? filtered[clampedIndex - 1].position : null;
    const below = clampedIndex < filtered.length ? filtered[clampedIndex].position : null;

    let newPosition: number;
    if (above === null && below === null) {
      newPosition = 0;
    } else if (above === null) {
      newPosition = (below as number) - POSITION_GAP;
    } else if (below === null) {
      newPosition = (above as number) + POSITION_GAP;
    } else {
      newPosition = Math.floor((above + below) / 2);
      // Check if gap is too small — trigger rebalance
      if (Math.abs((below as number) - (above as number)) <= REBALANCE_THRESHOLD) {
        await rebalanceColumn(workspaceId, targetStatus);
        // Recalculate after rebalance
        const rebalanced = await db
          .select({ id: tickets.id, position: tickets.position })
          .from(tickets)
          .where(
            and(eq(tickets.workspaceId, workspaceId), eq(tickets.status, targetStatus)),
          )
          .orderBy(asc(tickets.position));
        const rebalancedFiltered = rebalanced.filter((t) => t.id !== ticketId);
        const ra = clampedIndex > 0 ? rebalancedFiltered[clampedIndex - 1]?.position ?? null : null;
        const rb =
          clampedIndex < rebalancedFiltered.length
            ? rebalancedFiltered[clampedIndex]?.position ?? null
            : null;
        if (ra === null && rb === null) newPosition = 0;
        else if (ra === null) newPosition = (rb as number) - POSITION_GAP;
        else if (rb === null) newPosition = (ra as number) + POSITION_GAP;
        else newPosition = Math.floor((ra + rb) / 2);
      }
    }

    // Handle completedAt
    let completedAt: Date | null = ticket.completedAt;
    if (targetStatus === 'DONE' && ticket.status !== 'DONE') {
      completedAt = new Date();
    } else if (targetStatus !== 'DONE' && ticket.status === 'DONE') {
      completedAt = null;
    }

    const [updated] = await db
      .update(tickets)
      .set({
        status: targetStatus,
        position: newPosition,
        completedAt,
      })
      .where(eq(tickets.id, ticketId))
      .returning();

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error('PATCH /api/tickets/reorder error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
