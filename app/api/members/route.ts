import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMembersWithEmailByWorkspace } from '@/db/queries/members';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
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
