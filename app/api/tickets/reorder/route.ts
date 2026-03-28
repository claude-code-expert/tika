import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { reorderSchema } from '@/lib/validations';
import { db } from '@/db/index';
import { tickets, members } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { POSITION_GAP, REBALANCE_THRESHOLD } from '@/lib/constants';
import { getAssigneesByTicket } from '@/db/queries/ticketAssignees';
import { sendInAppNotification, buildDeadlineTodayMessage, buildOverdueWarningMessage } from '@/lib/notifications';
import { NOTIFICATION_TYPE } from '@/types/index';
import { nowKST } from '@/lib/date';

async function rebalanceColumn(workspaceId: number, status: string): Promise<void> {
  const columnTickets = await db
    .select({ id: tickets.id, position: tickets.position })
    .from(tickets)
    .where(and(eq(tickets.workspaceId, workspaceId), eq(tickets.status, status), eq(tickets.deleted, false)))
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
    const sessionUser = session.user as unknown as Record<string, unknown>;
    const userId = sessionUser.id as string;
    const workspaceId = (sessionUser.workspaceId as number) ?? null;
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

    const { ticketId, targetStatus, targetIndex, workspaceId: bodyWorkspaceId } = result.data;

    // Determine effective workspaceId: prefer body (team board) over session (personal board)
    let effectiveWorkspaceId = workspaceId;
    if (bodyWorkspaceId && bodyWorkspaceId !== workspaceId) {
      // Verify the user is a member of the requested workspace
      const [membership] = await db
        .select({ id: members.id })
        .from(members)
        .where(and(eq(members.userId, userId), eq(members.workspaceId, bodyWorkspaceId)))
        .limit(1);
      if (!membership) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: '해당 워크스페이스에 접근 권한이 없습니다' } },
          { status: 403 },
        );
      }
      effectiveWorkspaceId = bodyWorkspaceId;
    }

    // Fetch ticket and verify it belongs to the effective workspace
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.workspaceId, effectiveWorkspaceId), eq(tickets.deleted, false)))
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
          eq(tickets.workspaceId, effectiveWorkspaceId),
          eq(tickets.status, targetStatus),
          eq(tickets.deleted, false),
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
        await rebalanceColumn(effectiveWorkspaceId, targetStatus);
        // Recalculate after rebalance
        const rebalanced = await db
          .select({ id: tickets.id, position: tickets.position })
          .from(tickets)
          .where(
            and(eq(tickets.workspaceId, effectiveWorkspaceId), eq(tickets.status, targetStatus), eq(tickets.deleted, false)),
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

    const isEnteringInProgress = targetStatus === 'IN_PROGRESS' && ticket.status !== 'IN_PROGRESS';

    // Handle startDate: leaving BACKLOG or entering IN_PROGRESS (if not already set)
    let startDate: string | null | undefined = undefined;
    if (
      !ticket.startDate &&
      ((targetStatus !== 'BACKLOG' && ticket.status === 'BACKLOG') || isEnteringInProgress)
    ) {
      startDate = nowKST().toISOString().slice(0, 10);
    }

    // Auto-set dueDate = plannedEndDate when entering IN_PROGRESS (if dueDate is not set)
    let dueDate: string | null | undefined = undefined;
    if (isEnteringInProgress && !ticket.dueDate && ticket.plannedEndDate) {
      dueDate = ticket.plannedEndDate;
    }

    // Handle completedAt
    let completedAt: Date | null = ticket.completedAt;
    if (targetStatus === 'DONE' && ticket.status !== 'DONE') {
      completedAt = nowKST();
      if (!ticket.startDate && startDate === undefined) {
        startDate = nowKST().toISOString().slice(0, 10);
      }
    } else if (targetStatus !== 'DONE' && ticket.status === 'DONE') {
      completedAt = null;
    }

    const [updated] = await db
      .update(tickets)
      .set({
        status: targetStatus,
        position: newPosition,
        completedAt,
        ...(startDate !== undefined ? { startDate } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      })
      .where(eq(tickets.id, ticketId))
      .returning();

    // Deadline notifications when entering IN_PROGRESS via drag-and-drop
    if (isEnteringInProgress) {
      const finalDueDate = dueDate ?? updated.dueDate;
      if (finalDueDate) {
        const today = nowKST().toISOString().slice(0, 10);
        if (finalDueDate < today || finalDueDate === today) {
          const assignees = await getAssigneesByTicket(ticketId);
          if (assignees.length > 0) {
            const isOverdue = finalDueDate < today;
            const { title, message } = isOverdue
              ? buildOverdueWarningMessage(updated.title, finalDueDate)
              : buildDeadlineTodayMessage(updated.title, finalDueDate);
            sendInAppNotification({
              workspaceId: effectiveWorkspaceId,
              type: isOverdue ? NOTIFICATION_TYPE.OVERDUE_WARNING : NOTIFICATION_TYPE.DEADLINE_TODAY,
              title,
              message,
              link: `/workspace/${effectiveWorkspaceId}/${ticketId}`,
              actorId: userId,
              recipientUserIds: assignees.map((a) => a.userId),
              refType: 'ticket',
              refId: ticketId,
            }).catch((e) => console.error('Notification error (deadline/overdue on reorder):', e));
          }
        }
      }
    }

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error('PATCH /api/tickets/reorder error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
