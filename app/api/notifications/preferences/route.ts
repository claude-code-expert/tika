import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getNotificationPreferences,
  upsertNotificationPreference,
} from '@/db/queries/inAppNotifications';
import { updateNotificationPreferenceSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const workspaceIdParam = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceIdParam) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'workspaceId가 필요합니다' } },
        { status: 400 },
      );
    }

    const workspaceId = parseInt(workspaceIdParam, 10);
    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 workspaceId입니다' } },
        { status: 400 },
      );
    }

    const preferences = await getNotificationPreferences(session.user.id, workspaceId);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('GET /api/notifications/preferences error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = updateNotificationPreferenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
        { status: 400 },
      );
    }

    const { workspaceId, type, inAppEnabled } = parsed.data;
    await upsertNotificationPreference(session.user.id, workspaceId, type, inAppEnabled);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/notifications/preferences error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
