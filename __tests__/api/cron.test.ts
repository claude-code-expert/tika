/**
 * @jest-environment node
 *
 * Cron D-1 notification API tests
 * TC-CRON: GET /api/cron/notify-due
 */

jest.mock('@/db/queries/workspaces', () => ({ getAllWorkspaces: jest.fn() }));
jest.mock('@/db/queries/tickets', () => ({ getTicketsDueTomorrow: jest.fn() }));
jest.mock('@/db/queries/notificationChannels', () => ({
  getNotificationChannels: jest.fn(),
}));
jest.mock('@/db/queries/notificationLogs', () => ({ createNotificationLog: jest.fn() }));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/notify-due/route';
import { getAllWorkspaces } from '@/db/queries/workspaces';
import { getTicketsDueTomorrow } from '@/db/queries/tickets';
import { getNotificationChannels } from '@/db/queries/notificationChannels';
import { createNotificationLog } from '@/db/queries/notificationLogs';
import type { Workspace, Ticket, NotificationChannel } from '@/types/index';

const mockedGetWorkspaces = getAllWorkspaces as jest.Mock;
const mockedGetDueTomorrow = getTicketsDueTomorrow as jest.Mock;
const mockedGetChannels = getNotificationChannels as jest.Mock;
const mockedCreateLog = createNotificationLog as jest.Mock;

const CRON_SECRET = 'test-secret';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = CRON_SECRET;
});

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost/api/cron/notify-due', { headers });
}

const mockWorkspace: Workspace = {
  id: 1,
  name: '테스트 워크스페이스',
  description: null,
  ownerId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockTicket: Ticket = {
  id: 10,
  workspaceId: 1,
  title: '내일 마감 티켓',
  description: null,
  type: 'TASK',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  position: 0,
  startDate: null,
  dueDate: '2026-02-27',
  issueId: null,
  assigneeId: null,
  completedAt: null,
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
};

const mockSlackChannel: NotificationChannel = {
  id: 1,
  workspaceId: 1,
  type: 'slack',
  config: { webhookUrl: 'https://hooks.slack.com/services/T/B/X' },
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('GET /api/cron/notify-due', () => {
  it('Authorization 헤더 없으면 401을 반환한다', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('잘못된 CRON_SECRET이면 401을 반환한다', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('마감 티켓이 없으면 sent=0, failed=0을 반환한다', async () => {
    mockedGetWorkspaces.mockResolvedValueOnce([mockWorkspace]);
    mockedGetDueTomorrow.mockResolvedValueOnce([]);
    mockedGetChannels.mockResolvedValueOnce([mockSlackChannel]);

    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`));
    expect(res.status).toBe(200);
    const body = await res.json() as { processed: number; sent: number; failed: number };
    expect(body.sent).toBe(0);
    expect(body.failed).toBe(0);
    expect(mockedCreateLog).not.toHaveBeenCalled();
  });

  it('Slack 발송 성공 → SENT 로그를 생성한다', async () => {
    mockedGetWorkspaces.mockResolvedValueOnce([mockWorkspace]);
    mockedGetDueTomorrow.mockResolvedValueOnce([mockTicket]);
    mockedGetChannels.mockResolvedValueOnce([mockSlackChannel]);
    mockedCreateLog.mockResolvedValue({});

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });

    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`));
    expect(res.status).toBe(200);
    const body = await res.json() as { sent: number; failed: number };
    expect(body.sent).toBe(1);
    expect(body.failed).toBe(0);
    expect(mockedCreateLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'SENT', channel: 'slack', ticketId: 10 }),
    );
  });

  it('외부 API 실패 → FAILED 로그를 생성한다', async () => {
    mockedGetWorkspaces.mockResolvedValueOnce([mockWorkspace]);
    mockedGetDueTomorrow.mockResolvedValueOnce([mockTicket]);
    mockedGetChannels.mockResolvedValueOnce([mockSlackChannel]);
    mockedCreateLog.mockResolvedValue({});

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });

    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`));
    expect(res.status).toBe(200);
    const body = await res.json() as { sent: number; failed: number };
    expect(body.sent).toBe(0);
    expect(body.failed).toBe(1);
    expect(mockedCreateLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED', channel: 'slack', ticketId: 10 }),
    );
  });
});
