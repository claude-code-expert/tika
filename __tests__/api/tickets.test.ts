/**
 * @jest-environment node
 *
 * GET /api/tickets, POST /api/tickets Route Handler 테스트
 * next-auth ESM 이슈 방지: @/lib/auth를 mock해서 next-auth가 로드되지 않도록 함
 */

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/db/queries/tickets', () => ({
  getBoardData: jest.fn(),
  createTicket: jest.fn(),
  getTicketCount: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tickets/route';
import { auth } from '@/lib/auth';
import { getBoardData, createTicket, getTicketCount } from '@/db/queries/tickets';
import { TICKET_MAX_PER_WORKSPACE } from '@/lib/constants';
import type { BoardData } from '@/types/index';

const mockedAuth = auth as jest.Mock;
const mockedGetBoardData = getBoardData as jest.Mock;
const mockedCreateTicket = createTicket as jest.Mock;
const mockedGetTicketCount = getTicketCount as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };

const mockBoardData: BoardData = {
  board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] },
  total: 0,
};

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/tickets', () => {
  it('인증되지 않으면 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('workspaceId 없는 세션이면 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('인증된 요청에 board 데이터를 200으로 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetBoardData.mockResolvedValueOnce(mockBoardData);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockBoardData);
    expect(mockedGetBoardData).toHaveBeenCalledWith(1);
  });

  it('DB 오류 시 500 INTERNAL_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetBoardData.mockRejectedValueOnce(new Error('DB connection error'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('POST /api/tickets', () => {
  it('인증되지 않으면 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const response = await POST(makePostRequest({ title: '테스트' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('title이 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const response = await POST(makePostRequest({ title: '' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('제목을 입력해주세요');
  });

  it('title이 200자를 초과하면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const response = await POST(makePostRequest({ title: 'a'.repeat(201) }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('dueDate 형식이 잘못되면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const response = await POST(makePostRequest({ title: '제목', dueDate: '2026/02/24' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
  });

  it('티켓 수 한도 초과 시 400 TICKET_LIMIT_EXCEEDED를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetTicketCount.mockResolvedValueOnce(TICKET_MAX_PER_WORKSPACE);

    const response = await POST(makePostRequest({ title: '제목' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('TICKET_LIMIT_EXCEEDED');
  });

  it('유효한 요청에 201과 생성된 티켓을 반환한다', async () => {
    const newTicket = { id: 1, workspaceId: 1, title: '새 티켓', status: 'BACKLOG', position: 1024 };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetTicketCount.mockResolvedValueOnce(0);
    mockedCreateTicket.mockResolvedValueOnce(newTicket);

    const response = await POST(makePostRequest({ title: '새 티켓', priority: 'HIGH' }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ticket).toEqual(newTicket);
    expect(mockedCreateTicket).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ title: '새 티켓', priority: 'HIGH' }),
    );
  });

  it('DB 오류 시 500 INTERNAL_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetTicketCount.mockResolvedValueOnce(0);
    mockedCreateTicket.mockRejectedValueOnce(new Error('DB error'));

    const response = await POST(makePostRequest({ title: '새 티켓' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
