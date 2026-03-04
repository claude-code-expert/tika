import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getWorkspacesByMemberId,
  createWorkspace,
  getTeamWorkspaceCountByOwner,
} from '@/db/queries/workspaces';
import { createMember } from '@/db/queries/members';
import { createWorkspaceSchema } from '@/lib/validations';

// GET /api/workspaces — list all workspaces where user is a member (PERSONAL + TEAM)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const workspaces = await getWorkspacesByMemberId(userId);

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('GET /api/workspaces error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

// POST /api/workspaces — create a new TEAM workspace (max 3 per owner)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const displayName = ((session.user as Record<string, unknown>).name as string) ?? '사용자';

    const body = await request.json();
    const result = createWorkspaceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: result.error.errors[0]?.message ?? '입력 오류',
          },
        },
        { status: 400 },
      );
    }

    // Enforce max 3 TEAM workspaces per owner
    const teamCount = await getTeamWorkspaceCountByOwner(userId);
    if (teamCount >= 3) {
      return NextResponse.json(
        {
          error: {
            code: 'WORKSPACE_LIMIT_EXCEEDED',
            message: '팀 워크스페이스는 최대 3개까지 생성할 수 있습니다',
          },
        },
        { status: 409 },
      );
    }

    const workspace = await createWorkspace({
      name: result.data.name,
      description: result.data.description ?? null,
      ownerId: userId,
      type: 'TEAM',
    });

    // Auto-create OWNER member record for the workspace creator
    await createMember({
      userId,
      workspaceId: workspace.id,
      displayName,
      color: '#7EB4A2',
      role: 'OWNER',
      invitedBy: null,
      joinedAt: null,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
