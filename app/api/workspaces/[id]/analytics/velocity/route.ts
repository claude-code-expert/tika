import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getVelocityData } from '@/db/queries/analytics';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const workspaceId = Number(id);
    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const allowed = await requireRole(userId, workspaceId, 'VIEWER');
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } },
        { status: 403 },
      );
    }

    const sprints = await getVelocityData(workspaceId);
    return NextResponse.json({ sprints });
  } catch (error) {
    console.error('GET /api/workspaces/:id/analytics/velocity error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
