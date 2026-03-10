/**
 * @jest-environment node
 *
 * POST /api/tickets — RBAC and ticket limit tests
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/queries/tickets', () => ({
  getBoardData: jest.fn(),
  createTicket: jest.fn(),
  getTicketCount: jest.fn(),
  getWbsTickets: jest.fn(),
}));
jest.mock('@/db/queries/workspaces', () => ({
  getWorkspaceById: jest.fn(),
}));
jest.mock('@/db/queries/members', () => ({
  getMemberByUserId: jest.fn(),
}));
jest.mock('@/db/queries/ticketAssignees', () => ({
  setAssignees: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/tickets/route';
import { auth } from '@/lib/auth';
import { createTicket, getTicketCount } from '@/db/queries/tickets';
import { getWorkspaceById } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';
import { TICKET_MAX_TEAM_WORKSPACE, TICKET_MAX_PER_WORKSPACE, TICKET_WARNING_TEAM } from '@/lib/constants';

const mockedAuth = auth as jest.Mock;
const mockedCreateTicket = createTicket as jest.Mock;
const mockedGetTicketCount = getTicketCount as jest.Mock;
const mockedGetWorkspaceById = getWorkspaceById as jest.Mock;
const mockedGetMemberByUserId = getMemberByUserId as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };
const mockTeamWorkspace = { id: 1, name: '팀 워크스페이스', type: 'TEAM', ownerId: 'user-1' };
const mockPersonalWorkspace = { id: 1, name: '내 워크스페이스', type: 'PERSONAL', ownerId: 'user-1' };
const mockOwnerMember = { id: 1, userId: 'user-1', workspaceId: 1, displayName: '홍길동', color: '#629584', role: 'OWNER', invitedBy: null, joinedAt: null, createdAt: '2026-01-01T00:00:00.000Z' };
const mockMemberMember = { ...mockOwnerMember, role: 'MEMBER' };
const mockViewerMember = { ...mockOwnerMember, role: 'VIEWER' };
const newTicket = { id: 1, workspaceId: 1, title: '새 티켓', status: 'BACKLOG', position: 1024, type: 'TASK', priority: 'MEDIUM' };

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

describe('POST /api/tickets — RBAC', () => {
  it('403 when VIEWER role tries to create ticket', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockViewerMember);

    const res = await POST(makePostRequest({ title: '새 티켓' }));
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('201 when MEMBER role creates ticket', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockMemberMember);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockPersonalWorkspace);
    mockedGetTicketCount.mockResolvedValueOnce(0);
    mockedCreateTicket.mockResolvedValueOnce(newTicket);

    const res = await POST(makePostRequest({ title: '새 티켓' }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.ticket).toEqual(newTicket);
  });
});

describe('POST /api/tickets — limits', () => {
  it('400 TICKET_LIMIT_EXCEEDED when at team limit (1000)', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockTeamWorkspace);
    mockedGetTicketCount.mockResolvedValueOnce(TICKET_MAX_TEAM_WORKSPACE);

    const res = await POST(makePostRequest({ title: '새 티켓' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('TICKET_LIMIT_EXCEEDED');
    expect(body.error.message).toContain('1000');
  });

  it('400 TICKET_LIMIT_EXCEEDED when at personal limit (300)', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockPersonalWorkspace);
    mockedGetTicketCount.mockResolvedValueOnce(TICKET_MAX_PER_WORKSPACE);

    const res = await POST(makePostRequest({ title: '새 티켓' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('TICKET_LIMIT_EXCEEDED');
    expect(body.error.message).toContain('300');
  });

  it('201 with warning field when ticket count >= 900 for team workspace', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockTeamWorkspace);
    mockedGetTicketCount.mockResolvedValueOnce(TICKET_WARNING_TEAM); // 900
    mockedCreateTicket.mockResolvedValueOnce(newTicket);

    const res = await POST(makePostRequest({ title: '새 티켓' }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.ticket).toEqual(newTicket);
    expect(body.warning).toBeDefined();
    expect(typeof body.warning).toBe('string');
  });

  it('201 without warning field when below warning threshold', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockTeamWorkspace);
    mockedGetTicketCount.mockResolvedValueOnce(10);
    mockedCreateTicket.mockResolvedValueOnce(newTicket);

    const res = await POST(makePostRequest({ title: '새 티켓' }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.warning).toBeUndefined();
  });
});
