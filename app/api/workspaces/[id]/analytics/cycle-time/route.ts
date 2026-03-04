import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { getCycleTimeData } from '@/db/queries/analytics';

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

    const distribution = await getCycleTimeData(workspaceId);

    const total = distribution.reduce((s, d) => s + d.count, 0);
    const sorted = [...distribution].sort((a, b) => a.days - b.days);

    let cumulative = 0;
    let median = 0;
    let average = 0;

    if (total > 0) {
      average =
        Math.round(
          (distribution.reduce((s, d) => s + d.days * d.count, 0) / total) * 10,
        ) / 10;

      const midpoint = Math.ceil(total / 2);
      for (const d of sorted) {
        cumulative += d.count;
        if (cumulative >= midpoint) {
          median = d.days;
          break;
        }
      }
    }

    return NextResponse.json({ average, median, distribution });
  } catch (error) {
    console.error('GET /api/workspaces/:id/analytics/cycle-time error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
