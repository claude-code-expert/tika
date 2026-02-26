import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkspaces } from '@/db/queries/workspaces';
import { getTicketsDueTomorrow } from '@/db/queries/tickets';
import { getNotificationChannels } from '@/db/queries/notificationChannels';
import { createNotificationLog } from '@/db/queries/notificationLogs';
import type { SlackConfig, TelegramConfig } from '@/types/index';

const TIMEOUT_MS = 5000;

function buildMessage(
  tickets: Array<{ title: string; dueDate: string | null; priority: string }>,
): string {
  const lines = tickets.map((t) => `• ${t.title} — 마감일: ${t.dueDate ?? '미정'} [${t.priority}]`);
  return `[Tika] 내일 마감 예정인 티켓이 있습니다.\n${lines.join('\n')}`;
}

async function sendSlack(webhookUrl: string, message: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Slack error status=${res.status}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendTelegram(botToken: string, chatId: string, message: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { description?: string } | null;
      throw new Error(`Telegram error status=${res.status} desc=${body?.description ?? 'unknown'}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 },
    );
  }

  const workspaces = await getAllWorkspaces();
  let totalSent = 0;
  let totalFailed = 0;
  let totalProcessed = 0;

  for (const workspace of workspaces) {
    const [dueTomorrow, channels] = await Promise.all([
      getTicketsDueTomorrow(workspace.id),
      getNotificationChannels(workspace.id),
    ]);

    if (dueTomorrow.length === 0) continue;

    const enabledChannels = channels.filter((c) => c.enabled);
    if (enabledChannels.length === 0) continue;

    totalProcessed += dueTomorrow.length;
    const message = buildMessage(dueTomorrow);

    for (const channel of enabledChannels) {
      for (const ticket of dueTomorrow) {
        let errorMsg: string | undefined;
        try {
          if (channel.type === 'slack') {
            const cfg = channel.config as SlackConfig;
            await sendSlack(cfg.webhookUrl, message);
          } else if (channel.type === 'telegram') {
            const cfg = channel.config as TelegramConfig;
            await sendTelegram(cfg.botToken, cfg.chatId, message);
          }
          await createNotificationLog({
            workspaceId: workspace.id,
            ticketId: ticket.id,
            channel: channel.type,
            message,
            status: 'SENT',
          });
          totalSent++;
        } catch (err) {
          errorMsg = err instanceof Error ? err.message : String(err);
          console.error(
            `[cron/notify-due] failed workspace=${workspace.id} channel=${channel.type} ticket=${ticket.id}:`,
            errorMsg,
          );
          await createNotificationLog({
            workspaceId: workspace.id,
            ticketId: ticket.id,
            channel: channel.type,
            message,
            status: 'FAILED',
            errorMessage: errorMsg,
          });
          totalFailed++;
        }
      }
    }
  }

  console.log(
    `[cron/notify-due] done: processed=${totalProcessed} sent=${totalSent} failed=${totalFailed}`,
  );
  return NextResponse.json({ processed: totalProcessed, sent: totalSent, failed: totalFailed });
}
