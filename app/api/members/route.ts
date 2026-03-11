import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMembersWithEmailByWorkspace } from '@/db/queries/members';
import { db } from '@/db/index';
import { members } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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
    const sessionWorkspaceId = sessionUser.workspaceId as number;

    const qParam = request.nextUrl.searchParams.get('workspaceId');
    const requestedId = qParam ? parseInt(qParam, 10) : null;

    let workspaceId = sessionWorkspaceId;
    if (requestedId && requestedId !== sessionWorkspaceId) {
      // Verify membership before exposing other workspace's members
      const [membership] = await db
        .select({ id: members.id })
        .from(members)
        .where(and(eq(members.userId, userId), eq(members.workspaceId, requestedId)))
        .limit(1);
      if (!membership) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } },
          { status: 403 },
        );
      }
      workspaceId = requestedId;
    }

    const membersList = await getMembersWithEmailByWorkspace(workspaceId);

    return NextResponse.json({ members: membersList });
  } catch (error) {
    console.error('GET /api/members error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
