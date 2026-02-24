/**
 * @jest-environment node
 *
 * GET/PATCH/DELETE /api/tickets/[id] Route Handler 테스트
 * next-auth ESM 이슈 방지: @/lib/auth를 mock해서 next-auth가 로드되지 않도록 함
 */

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/db/queries/tickets', () => ({
  getTicketById: jest.fn(),
  updateTicket: jest.fn(),
  deleteTicket: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/tickets/[id]/route';
import { auth } from '@/lib/auth';
import { getTicketById, updateTicket, deleteTicket } from '@/db/queries/tickets';

const mockedAuth = auth as jest.Mock;
const mockedGetTicketById = getTicketById as jest.Mock;
const mockedUpdateTicket = updateTicket as jest.Mock;
const mockedDeleteTicket = deleteTicket as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };

const mockTicket = {
  id: 1,
  workspaceId: 1,
  title: '테스트 티켓',
  status: 'TODO',
  priority: 'MEDIUM',
  position: 1024,
};

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makePatchRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/tickets/:id', () => {
  it('인증되지 않으면 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const request = new NextRequest('http://localhost/api/tickets/1');

    const response = await GET(request, makeContext('1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('잘못된 id 형식이면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const request = new NextRequest('http://localhost/api/tickets/abc');

    const response = await GET(request, makeContext('abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('존재하지 않는 티켓이면 404 TICKET_NOT_FOUND를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetTicketById.mockResolvedValueOnce(null);
    const request = new NextRequest('http://localhost/api/tickets/99999');

    const response = await GET(request, makeContext('99999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
    expect(body.error.message).toBe('티켓을 찾을 수 없습니다');
  });

  it('티켓을 찾으면 200으로 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetTicketById.mockResolvedValueOnce(mockTicket);
    const request = new NextRequest('http://localhost/api/tickets/1');

    const response = await GET(request, makeContext('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ticket).toEqual(mockTicket);
    expect(mockedGetTicketById).toHaveBeenCalledWith(1, 1);
  });
});

describe('PATCH /api/tickets/:id', () => {
  it('인증되지 않으면 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const response = await PATCH(makePatchRequest('1', { title: '수정' }), makeContext('1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('잘못된 id 형식이면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const response = await PATCH(makePatchRequest('abc', { title: '수정' }), makeContext('abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('존재하지 않는 티켓 수정 시 404를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpdateTicket.mockResolvedValueOnce(null);

    const response = await PATCH(makePatchRequest('99999', { title: '수정' }), makeContext('99999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
  });

  it('유효한 수정 요청에 200과 수정된 티켓을 반환한다', async () => {
    const updatedTicket = { ...mockTicket, title: '수정된 제목' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpdateTicket.mockResolvedValueOnce(updatedTicket);

    const response = await PATCH(makePatchRequest('1', { title: '수정된 제목' }), makeContext('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ticket.title).toBe('수정된 제목');
  });

  it('status를 DONE으로 변경 시 completedAt이 설정된다', async () => {
    const updatedTicket = { ...mockTicket, status: 'DONE', completedAt: new Date().toISOString() };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpdateTicket.mockResolvedValueOnce(updatedTicket);

    const response = await PATCH(makePatchRequest('1', { status: 'DONE' }), makeContext('1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    // updateTicket이 completedAt과 함께 호출됐는지 확인
    expect(mockedUpdateTicket).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ completedAt: expect.any(Date) }),
    );
  });
});

describe('DELETE /api/tickets/:id', () => {
  it('인증되지 않으면 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const request = new NextRequest('http://localhost/api/tickets/1', { method: 'DELETE' });

    const response = await DELETE(request, makeContext('1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('잘못된 id 형식이면 400 VALIDATION_ERROR를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const request = new NextRequest('http://localhost/api/tickets/abc', { method: 'DELETE' });

    const response = await DELETE(request, makeContext('abc'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('존재하지 않는 티켓 삭제 시 404를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedDeleteTicket.mockResolvedValueOnce(null);
    const request = new NextRequest('http://localhost/api/tickets/99999', { method: 'DELETE' });

    const response = await DELETE(request, makeContext('99999'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
  });

  it('성공적인 삭제 시 204를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedDeleteTicket.mockResolvedValueOnce(mockTicket);
    const request = new NextRequest('http://localhost/api/tickets/1', { method: 'DELETE' });

    const response = await DELETE(request, makeContext('1'));

    expect(response.status).toBe(204);
  });
});
