import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { permanentDeleteTicket, restoreTicket } from '@/db/queries/tickets';

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 });
    }
    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } }, { status: 401 });
    }
    const { id } = await params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 티켓 ID입니다' } }, { status: 400 });
    }
    const restored = await restoreTicket(ticketId, workspaceId);
    if (!restored) {
      return NextResponse.json({ error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/tickets/trash/:id error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 티켓 ID입니다' } },
        { status: 400 },
      );
    }

    const deleted = await permanentDeleteTicket(ticketId, workspaceId);
    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/tickets/trash/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
