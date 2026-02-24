/**
 * @jest-environment node
 *
 * PATCH /api/tickets/reorder Route Handler 테스트
 * next-auth ESM 이슈 방지: @/lib/auth를 mock해서 next-auth가 로드되지 않도록 함
 */

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

// reorder route는 drizzle db를 직접 사용하므로 db 자체를 mock
jest.mock('@/db/index', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
}));

// drizzle-orm 헬퍼 함수들은 단순 패스스루로 mock
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((col: unknown, val: unknown) => ({ col, val })),
  and: jest.fn((...args: unknown[]) => args),
  asc: jest.fn((col: unknown) => col),
}));

jest.mock('@/db/schema', () => ({
  tickets: { id: 'id', workspaceId: 'workspaceId', status: 'status', position: 'position' },
}));

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/tickets/reorder/route';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';

const mockedAuth = auth as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };

/** drizzle 체인 mock: select().from().where().limit() 패턴 */
function createSelectChain(resolvedValue: unknown[]) {
  const chain = {
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockResolvedValue(resolvedValue);
  chain.limit.mockResolvedValue(resolvedValue);
  return chain;
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/tickets/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PATCH /api/tickets/reorder — 인증', () => {
  it('인증되지 않으면 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const response = await PATCH(makeRequest({ ticketId: 1, targetStatus: 'TODO', targetIndex: 0 }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('workspaceId 없는 세션이면 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const response = await PATCH(makeRequest({ ticketId: 1, targetStatus: 'TODO', targetIndex: 0 }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('PATCH /api/tickets/reorder — 유효성 검사', () => {
  it('ticketId가 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const response = await PATCH(makeRequest({ targetStatus: 'TODO', targetIndex: 0 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('targetStatus가 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const response = await PATCH(makeRequest({ ticketId: 1, targetIndex: 0 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('유효하지 않은 targetStatus이면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const response = await PATCH(makeRequest({ ticketId: 1, targetStatus: 'INVALID', targetIndex: 0 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('targetIndex가 음수이면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const response = await PATCH(makeRequest({ ticketId: 1, targetStatus: 'TODO', targetIndex: -1 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/tickets/reorder — 비즈니스 로직', () => {
  it('존재하지 않는 ticketId이면 404 TICKET_NOT_FOUND를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    // 첫 번째 select (티켓 조회)가 빈 배열을 반환 → ticket not found
    const selectChain = createSelectChain([]);
    (db.select as jest.Mock).mockReturnValue(selectChain);

    const response = await PATCH(makeRequest({ ticketId: 99999, targetStatus: 'TODO', targetIndex: 0 }));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
    expect(body.error.message).toBe('티켓을 찾을 수 없습니다');
  });
});
