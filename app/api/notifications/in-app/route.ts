import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInAppNotifications } from '@/db/queries/inAppNotifications';
import { inAppNotificationQuerySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = inAppNotificationQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 },
      );
    }

    const { page, limit, workspaceId, unreadOnly } = parsed.data;
    const result = await getInAppNotifications(session.user.id, {
      page,
      limit,
      workspaceId,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/notifications/in-app error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
