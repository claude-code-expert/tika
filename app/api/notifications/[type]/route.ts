import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { upsertNotificationChannelSchema } from '@/lib/validations';
import { upsertNotificationChannel } from '@/db/queries/notificationChannels';
import type { NotificationChannelType, NotificationChannel } from '@/types/index';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { type } = await params;
    if (type !== 'slack' && type !== 'telegram') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '지원하지 않는 채널 타입입니다' } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = upsertNotificationChannelSchema.safeParse({ ...body, type });
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message ?? '입력 오류' } },
        { status: 400 },
      );
    }

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
    const channel = await upsertNotificationChannel(workspaceId, type as NotificationChannelType, {
      config: parsed.data.config as NotificationChannel['config'],
      enabled: parsed.data.enabled,
    });

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('PUT /api/notifications/[type] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
