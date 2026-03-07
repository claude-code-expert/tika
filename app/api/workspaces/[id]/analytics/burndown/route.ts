import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getBurndownData } from '@/db/queries/analytics';
import { getSprintsByWorkspace } from '@/db/queries/sprints';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
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

    const userId = session.user.id as string;
    const allowed = await requireRole(userId, workspaceId, 'VIEWER');
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const sprintIdParam = searchParams.get('sprintId');

    let sprintId: number | undefined;
    if (sprintIdParam) {
      sprintId = Number(sprintIdParam);
      if (isNaN(sprintId)) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 스프린트 ID입니다' } },
          { status: 400 },
        );
      }
    } else {
      // Default to active sprint
      const allSprints = await getSprintsByWorkspace(workspaceId);
      const active = allSprints.find((s) => s.status === 'ACTIVE');
      if (active) sprintId = active.id;
    }

    if (!sprintId) {
      return NextResponse.json({ meta: null, data: [] });
    }

    const data = await getBurndownData(workspaceId, sprintId);
    // First data point has the initial remaining count (total)
    const storyPointsTotal = data.length > 0 ? data[0].remainingPoints : 0;

    return NextResponse.json({
      meta: { sprintId, storyPointsTotal },
      data,
    });
  } catch (error) {
    console.error('GET /api/workspaces/:id/analytics/burndown error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
