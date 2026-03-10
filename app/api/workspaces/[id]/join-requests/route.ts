import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { workspaces, members } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { postJoinRequestSchema } from '@/lib/validations';
import {
  getJoinRequests,
  createJoinRequest,
  getPendingRequestByUser,
} from '@/db/queries/joinRequests';
import type { JoinRequestStatus } from '@/types/index';
import { NOTIFICATION_TYPE } from '@/types/index';
import { getMembersByWorkspace } from '@/db/queries/members';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { sendInAppNotification, buildJoinRequestReceivedMessage } from '@/lib/notifications';

// POST /api/workspaces/[id]/join-requests — submit a join request
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    const { id: idStr } = await params;
    const workspaceId = parseInt(idStr, 10);
    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다.' } },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // Check workspace exists and is a TEAM workspace
    const [workspace] = await db
      .select({ id: workspaces.id, type: workspaces.type })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '워크스페이스를 찾을 수 없습니다.' } },
        { status: 404 },
      );
    }

    if (workspace.type !== 'TEAM') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '개인 워크스페이스에는 가입 신청할 수 없습니다.' } },
        { status: 403 },
      );
    }

    // Check user is not already a member
    const [existingMember] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.userId, userId), eq(members.workspaceId, workspaceId)))
      .limit(1);

    if (existingMember) {
      return NextResponse.json(
        { error: { code: 'ALREADY_MEMBER', message: '이미 이 워크스페이스의 멤버입니다.' } },
        { status: 409 },
      );
    }

    // Check for existing PENDING request
    const existingRequest = await getPendingRequestByUser(workspaceId, userId);
    if (existingRequest) {
      return NextResponse.json(
        { error: { code: 'ALREADY_REQUESTED', message: '이미 가입 신청이 접수되어 있습니다.' } },
        { status: 409 },
      );
    }

    // Parse optional message from body
    let message: string | undefined;
    try {
      const body = await request.json().catch(() => ({}));
      const parsed = postJoinRequestSchema.safeParse(body);
      if (parsed.success) message = parsed.data.message;
    } catch {
      // No body is fine
    }

    const joinRequest = await createJoinRequest(workspaceId, userId, message);

    // Notify workspace owners about the join request
    const [wsData, wsMembers] = await Promise.all([
      getWorkspaceById(workspaceId),
      getMembersByWorkspace(workspaceId),
    ]);
    const ownerUserIds = wsMembers.filter((m) => m.role === 'OWNER').map((m) => m.userId);
    const requesterName = (session.user.name as string | null) ?? '사용자';
    const { title: nTitle, message: nMessage } = buildJoinRequestReceivedMessage(
      requesterName, wsData?.name ?? '워크스페이스',
    );
    sendInAppNotification({
      workspaceId,
      type: NOTIFICATION_TYPE.JOIN_REQUEST_RECEIVED,
      title: nTitle,
      message: nMessage,
      link: `/workspace/${workspaceId}/members`,
      actorId: userId,
      recipientUserIds: ownerUserIds,
    }).catch((e) => console.error('Notification error (join request):', e));

    return NextResponse.json({ joinRequest }, { status: 201 });
  } catch (err) {
    console.error('POST /api/workspaces/[id]/join-requests error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}

// GET /api/workspaces/[id]/join-requests — list join requests (OWNER only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    const { id: idStr } = await params;
    const workspaceId = parseInt(idStr, 10);
    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다.' } },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // Verify caller is OWNER
    const [ownerMember] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(eq(members.userId, userId), eq(members.workspaceId, workspaceId), eq(members.role, 'OWNER')),
      )
      .limit(1);

    if (!ownerMember) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '워크스페이스 OWNER만 가입 신청 목록을 조회할 수 있습니다.' } },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') ?? 'PENDING';
    const status = (['PENDING', 'APPROVED', 'REJECTED'].includes(statusParam)
      ? statusParam
      : 'PENDING') as JoinRequestStatus;

    const joinRequests = await getJoinRequests(workspaceId, status);

    return NextResponse.json({ joinRequests });
  } catch (err) {
    console.error('GET /api/workspaces/[id]/join-requests error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
