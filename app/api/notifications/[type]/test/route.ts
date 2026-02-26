import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNotificationChannelByType } from '@/db/queries/notificationChannels';
import type { NotificationChannelType, SlackConfig, TelegramConfig } from '@/types/index';

export async function POST(
  _request: NextRequest,
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

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
    const channel = await getNotificationChannelByType(workspaceId, type as NotificationChannelType);

    if (!channel || !channel.enabled) {
      return NextResponse.json(
        { error: { code: 'NOT_CONFIGURED', message: '채널이 설정되지 않았거나 비활성화 상태입니다' } },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      if (type === 'slack') {
        const cfg = channel.config as SlackConfig;
        if (!cfg.webhookUrl) {
          return NextResponse.json(
            { error: { code: 'NOT_CONFIGURED', message: 'Webhook URL이 설정되지 않았습니다' } },
            { status: 400 },
          );
        }
        const res = await fetch(cfg.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '[Tika 테스트] 알림 채널이 정상적으로 연결되었습니다!' }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Slack API 오류');
      } else {
        const cfg = channel.config as TelegramConfig;
        if (!cfg.botToken || !cfg.chatId) {
          return NextResponse.json(
            { error: { code: 'NOT_CONFIGURED', message: 'Bot Token 또는 Chat ID가 설정되지 않았습니다' } },
            { status: 400 },
          );
        }
        const res = await fetch(
          `https://api.telegram.org/bot${cfg.botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: cfg.chatId, text: '[Tika 테스트] 알림 채널이 정상적으로 연결되었습니다!' }),
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error('Telegram API 오류');
      }
    } finally {
      clearTimeout(timeoutId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: { code: 'EXTERNAL_ERROR', message: '요청 시간이 초과되었습니다 (5초)' } },
        { status: 502 },
      );
    }
    console.error('POST /api/notifications/[type]/test error:', error);
    return NextResponse.json(
      { error: { code: 'EXTERNAL_ERROR', message: '외부 서비스 연결에 실패했습니다' } },
      { status: 502 },
    );
  }
}
