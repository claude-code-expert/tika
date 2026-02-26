/**
 * @jest-environment node
 *
 * 알림 채널 API 테스트
 * TC-NOTIF: GET /api/notifications, PUT /api/notifications/[type]
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/queries/notificationChannels', () => ({
  getNotificationChannels: jest.fn(),
  upsertNotificationChannel: jest.fn(),
  getNotificationChannelByType: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/notifications/route';
import { PUT } from '@/app/api/notifications/[type]/route';
import { auth } from '@/lib/auth';
import {
  getNotificationChannels,
  upsertNotificationChannel,
} from '@/db/queries/notificationChannels';
import type { NotificationChannel } from '@/types/index';

const mockedAuth = auth as jest.Mock;
const mockedGetChannels = getNotificationChannels as jest.Mock;
const mockedUpsert = upsertNotificationChannel as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };

const mockSlackChannel: NotificationChannel = {
  id: 1,
  workspaceId: 1,
  type: 'slack',
  config: { webhookUrl: 'https://hooks.slack.com/services/T/B/X' },
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makePutRequest(type: string, body: unknown): [NextRequest, { params: Promise<{ type: string }> }] {
  const req = new NextRequest(`http://localhost/api/notifications/${type}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return [req, { params: Promise.resolve({ type }) }];
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
//  GET /api/notifications
// ─────────────────────────────────────────────
describe('GET /api/notifications', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('채널 목록을 200으로 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetChannels.mockResolvedValueOnce([mockSlackChannel]);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(body.channels)).toBe(true);
    expect(body.channels).toHaveLength(1);
    expect(body.channels[0].type).toBe('slack');
  });

  it('채널이 없으면 빈 배열을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetChannels.mockResolvedValueOnce([]);
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.channels).toEqual([]);
  });

  it('DB 오류 시 500을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetChannels.mockRejectedValueOnce(new Error('DB error'));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ─────────────────────────────────────────────
//  PUT /api/notifications/[type]
// ─────────────────────────────────────────────
describe('PUT /api/notifications/[type]', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const [req, ctx] = makePutRequest('slack', { config: { webhookUrl: 'https://hooks.slack.com/x' }, enabled: true });
    const res = await PUT(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('지원하지 않는 채널 타입은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePutRequest('email', { config: {}, enabled: false });
    const res = await PUT(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Slack: 유효한 설정 저장 시 200을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpsert.mockResolvedValueOnce(mockSlackChannel);
    const [req, ctx] = makePutRequest('slack', {
      config: { webhookUrl: 'https://hooks.slack.com/services/T/B/X' },
      enabled: true,
    });
    const res = await PUT(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.channel.type).toBe('slack');
    expect(body.channel.enabled).toBe(true);
  });

  it('Slack: enabled=true일 때 빈 webhookUrl은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePutRequest('slack', {
      config: { webhookUrl: '' },
      enabled: true,
    });
    const res = await PUT(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Telegram: 유효한 설정 저장 시 200을 반환한다', async () => {
    const telegramChannel: NotificationChannel = {
      ...mockSlackChannel,
      id: 2,
      type: 'telegram',
      config: { botToken: '123456:ABC', chatId: '-100123456789' },
    };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpsert.mockResolvedValueOnce(telegramChannel);
    const [req, ctx] = makePutRequest('telegram', {
      config: { botToken: '123456:ABC', chatId: '-100123456789' },
      enabled: false,
    });
    const res = await PUT(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.channel.type).toBe('telegram');
  });

  it('Telegram: botToken 누락은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePutRequest('telegram', {
      config: { chatId: '-100123456789' },
      enabled: true,
    });
    const res = await PUT(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('enabled 필드 누락은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePutRequest('slack', {
      config: { webhookUrl: 'https://hooks.slack.com/services/T/B/X' },
    });
    const res = await PUT(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('DB 오류 시 500을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpsert.mockRejectedValueOnce(new Error('DB error'));
    const [req, ctx] = makePutRequest('slack', {
      config: { webhookUrl: 'https://hooks.slack.com/services/T/B/X' },
      enabled: false,
    });
    const res = await PUT(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
