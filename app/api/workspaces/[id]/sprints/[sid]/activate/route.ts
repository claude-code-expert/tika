import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole, isRoleError } from '@/lib/permissions';
import { getSprintById, hasActiveSprint, activateSprint } from '@/db/queries/sprints';
import { getMembersByWorkspace } from '@/db/queries/members';
import { NOTIFICATION_TYPE } from '@/types/index';
import { sendInAppNotification, buildSprintStartedMessage } from '@/lib/notifications';

type RouteParams = { params: Promise<{ id: string; sid: string }> };

// POST /api/workspaces/[id]/sprints/[sid]/activate — PLANNED → ACTIVE
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id, sid } = await params;
    const workspaceId = Number(id);
    const sprintId = Number(sid);
    if (Number.isNaN(workspaceId) || Number.isNaN(sprintId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const check = await requireRole(userId, workspaceId, 'OWNER');
    if (isRoleError(check)) return check;

    const sprint = await getSprintById(sprintId, workspaceId);
    if (!sprint) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '스프린트를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    if (sprint.status !== 'PLANNED') {
      return NextResponse.json(
        { error: { code: 'SPRINT_NOT_PLANNED', message: 'PLANNED 상태의 스프린트만 활성화할 수 있습니다' } },
        { status: 400 },
      );
    }

    // Check if another sprint is already active in this workspace
    const alreadyActive = await hasActiveSprint(workspaceId, sprintId);
    if (alreadyActive) {
      return NextResponse.json(
        { error: { code: 'ACTIVE_SPRINT_EXISTS', message: '이미 활성 스프린트가 있습니다. 완료 후 새 스프린트를 시작하세요' } },
        { status: 409 },
      );
    }

    const updated = await activateSprint(sprintId, workspaceId);

    // Notify all workspace members
    const wsMembers = await getMembersByWorkspace(workspaceId);
    const { title, message } = buildSprintStartedMessage(sprint.name);
    sendInAppNotification({
      workspaceId,
      type: NOTIFICATION_TYPE.SPRINT_STARTED,
      title,
      message,
      link: `/workspace/${workspaceId}/board`,
      actorId: userId,
      recipientUserIds: wsMembers.map((m) => m.userId),
      refType: 'sprint',
      refId: sprintId,
    }).catch((e) => console.error('Notification error (sprint started):', e));

    return NextResponse.json({ sprint: updated });
  } catch (error) {
    console.error('POST /api/workspaces/[id]/sprints/[sid]/activate error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
