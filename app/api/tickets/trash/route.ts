import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { getDeletedTickets, bulkPermanentDeleteTickets } from '@/db/queries/tickets';

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 });
    }
    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } }, { status: 401 });
    }
    const body = await request.json();
    const ids: number[] = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === 'number') : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: '삭제할 티켓 ID가 없습니다' } }, { status: 400 });
    }
    const count = await bulkPermanentDeleteTickets(ids, workspaceId);
    return NextResponse.json({ deleted: count });
  } catch (error) {
    console.error('DELETE /api/tickets/trash error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } }, { status: 500 });
  }
}

export async function GET() {
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

    const tickets = await getDeletedTickets(workspaceId);
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('GET /api/tickets/trash error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
