/**
 * @jest-environment node
 *
 * Notification logs API tests
 * TC-NOTIF-LOGS: GET /api/notifications/logs, POST /api/notifications/logs
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/queries/notificationLogs', () => ({
  getNotificationLogs: jest.fn(),
  getUnreadNotificationCount: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/notifications/logs/route';
import { auth } from '@/lib/auth';
import {
  getNotificationLogs,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
} from '@/db/queries/notificationLogs';
import type { NotificationLog } from '@/types/index';

const mockedAuth = auth as jest.Mock;
const mockedGetLogs = getNotificationLogs as jest.Mock;
const mockedGetCount = getUnreadNotificationCount as jest.Mock;
const mockedMarkRead = markAllNotificationsAsRead as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };

const mockLog: NotificationLog = {
  id: 1,
  workspaceId: 1,
  ticketId: 10,
  channel: 'slack',
  message: '[Tika] 내일 마감 예정인 티켓이 있습니다.',
  status: 'SENT',
  sentAt: '2026-02-26T00:00:00.000Z',
  errorMessage: null,
  isRead: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

const makeGetRequest = (params?: string) =>
  new NextRequest(`http://localhost/api/notifications/logs${params ? `?${params}` : ''}`);

describe('GET /api/notifications/logs', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('로그 목록과 미읽음 수를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetLogs.mockResolvedValueOnce([mockLog]);
    mockedGetCount.mockResolvedValueOnce(1);

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json() as { logs: NotificationLog[]; unreadCount: number };
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].id).toBe(1);
    expect(body.unreadCount).toBe(1);
  });
});

describe('POST /api/notifications/logs', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/notifications/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('잘못된 action이면 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const req = new NextRequest('http://localhost/api/notifications/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unknown' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('markAllRead action은 업데이트 수를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedMarkRead.mockResolvedValueOnce(3);
    const req = new NextRequest('http://localhost/api/notifications/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { updated: number };
    expect(body.updated).toBe(3);
    expect(mockedMarkRead).toHaveBeenCalledWith(1);
  });
});
