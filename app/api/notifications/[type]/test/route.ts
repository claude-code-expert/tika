import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNotificationChannelByType } from '@/db/queries/notificationChannels';
import type { NotificationChannelType, SlackConfig, TelegramConfig } from '@/types/index';

export async function POST(
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

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
    console.log(`[notification/test] workspaceId=${workspaceId} type=${type}`);

    // 1. request body에서 config 읽기 (저장 전 테스트 지원)
    const body = await request.json().catch(() => ({})) as Record<string, string>;
    console.log(`[notification/test] received body:`, JSON.stringify(body));

    let webhookUrl: string | undefined;
    let botToken: string | undefined;
    let chatId: string | undefined;

    if (type === 'slack') {
      webhookUrl = body.webhookUrl;

      // 2. body에 없으면 DB fallback
      if (!webhookUrl) {
        const channel = await getNotificationChannelByType(workspaceId, 'slack' as NotificationChannelType);
        webhookUrl = (channel?.config as SlackConfig | undefined)?.webhookUrl;
        console.log(`[notification/test] slack DB fallback: channel=${channel?.id ?? 'null'}`);
      }

      console.log(`[notification/test] slack webhookUrl:`, webhookUrl ? `${webhookUrl.substring(0, 40)}...` : null);

      if (!webhookUrl) {
        return NextResponse.json(
          { error: { code: 'NOT_CONFIGURED', message: 'Webhook URL이 설정되지 않았습니다. 먼저 Webhook URL을 입력해주세요' } },
          { status: 400 },
        );
      }
    } else {
      botToken = body.botToken;
      chatId = body.chatId;

      // 2. body에 없으면 DB fallback
      if (!botToken || !chatId) {
        const channel = await getNotificationChannelByType(workspaceId, 'telegram' as NotificationChannelType);
        const cfg = channel?.config as TelegramConfig | undefined;
        botToken = botToken || cfg?.botToken;
        chatId = chatId || cfg?.chatId;
        console.log(`[notification/test] telegram DB fallback: channel=${channel?.id ?? 'null'}`);
      }

      console.log(`[notification/test] telegram:`, { hasBotToken: !!botToken, hasChatId: !!chatId });

      if (!botToken || !chatId) {
        return NextResponse.json(
          { error: { code: 'NOT_CONFIGURED', message: 'Bot Token 또는 Chat ID가 설정되지 않았습니다' } },
          { status: 400 },
        );
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      if (type === 'slack') {
        const res = await fetch(webhookUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '[Tika 테스트] 알림 채널이 정상적으로 연결되었습니다!' }),
          signal: controller.signal,
        });
        console.log(`[notification/test] slack response: status=${res.status} ok=${res.ok}`);
        if (!res.ok) throw new Error(`Slack API 오류 (status=${res.status})`);
      } else {
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: '[Tika 테스트] 알림 채널이 정상적으로 연결되었습니다!' }),
            signal: controller.signal,
          },
        );
        const telegramBody = await res.json().catch(() => null) as { ok: boolean; description?: string } | null;
        console.log(`[notification/test] telegram response: status=${res.status} ok=${res.ok} body=`, JSON.stringify(telegramBody));
        if (!res.ok) {
          const desc = telegramBody?.description ?? '';
          if (desc.includes('chat not found')) {
            return NextResponse.json(
              { error: { code: 'INVALID_CONFIG', message: 'Chat ID를 찾을 수 없습니다. 봇에게 먼저 메시지를 보낸 후 getUpdates API로 올바른 Chat ID를 확인하세요.' } },
              { status: 400 },
            );
          }
          if (desc.includes('Unauthorized') || desc.includes('bot was blocked')) {
            return NextResponse.json(
              { error: { code: 'INVALID_CONFIG', message: 'Bot Token이 유효하지 않거나 봇이 차단되었습니다.' } },
              { status: 400 },
            );
          }
          throw new Error(`Telegram API 오류 (status=${res.status}, description=${desc || 'unknown'})`);
        }
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
