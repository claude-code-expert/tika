import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { members } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { patchJoinRequestSchema } from '@/lib/validations';
import {
  getJoinRequestById,
  approveJoinRequest,
  rejectJoinRequest,
} from '@/db/queries/joinRequests';
import { getMemberByUserId } from '@/db/queries/members';

// PATCH /api/workspaces/[id]/join-requests/[reqId] — approve or reject a join request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    const { id: idStr, reqId: reqIdStr } = await params;
    const workspaceId = parseInt(idStr, 10);
    const reqId = parseInt(reqIdStr, 10);

    if (isNaN(workspaceId) || isNaN(reqId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 요청입니다.' } },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // Verify caller is OWNER of this workspace
    const [ownerMember] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.userId, userId),
          eq(members.workspaceId, workspaceId),
          eq(members.role, 'OWNER'),
        ),
      )
      .limit(1);

    if (!ownerMember) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: '워크스페이스 OWNER만 가입 신청을 처리할 수 있습니다.',
          },
        },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = patchJoinRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      );
    }

    // Fetch the join request
    const joinRequest = await getJoinRequestById(reqId, workspaceId);
    if (!joinRequest) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '가입 신청을 찾을 수 없습니다.' } },
        { status: 404 },
      );
    }

    // Only PENDING requests can be processed
    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: { code: 'ALREADY_PROCESSED', message: '이미 처리된 가입 신청입니다.' } },
        { status: 409 },
      );
    }

    const { action } = parsed.data;

    if (action === 'APPROVE') {
      // Look up the applicant's display name from users table
      const applicantMember = await getMemberByUserId(joinRequest.userId, workspaceId);
      // If already a member (race condition), still mark approved
      const displayName = applicantMember?.displayName ?? '멤버';

      const { joinRequest: updated, member } = await approveJoinRequest(
        reqId,
        workspaceId,
        ownerMember.id,
        { userId: joinRequest.userId, displayName },
      );

      return NextResponse.json({ joinRequest: updated, member });
    }

    // action === 'REJECT'
    const updated = await rejectJoinRequest(reqId, workspaceId, ownerMember.id);
    return NextResponse.json({ joinRequest: updated });
  } catch (err) {
    console.error('PATCH /api/workspaces/[id]/join-requests/[reqId] error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
