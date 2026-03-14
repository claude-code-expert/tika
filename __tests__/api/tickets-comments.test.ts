/**
 * @jest-environment node
 *
 * POST /api/tickets/[id]/comments — auth + VIEWER role block tests
 * GET  /api/tickets/[id]/comments — basic retrieve
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/queries/comments', () => ({
  getCommentsByTicketId: jest.fn(),
  createComment: jest.fn(),
}));
jest.mock('@/lib/permissions', () => ({
  requireRole: jest.fn(),
  isRoleError: jest.fn(),
}));
jest.mock('@/lib/notifications', () => ({
  sendInAppNotification: jest.fn().mockResolvedValue(undefined),
  buildTicketCommentedMessage: jest.fn().mockReturnValue({ title: '', message: '' }),
}));
jest.mock('@/db/queries/ticketAssignees', () => ({
  getAssigneesByTicket: jest.fn(),
}));
jest.mock('@/db/queries/tickets', () => ({
  getTicketById: jest.fn(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/tickets/[id]/comments/route';
import { auth } from '@/lib/auth';
import { getCommentsByTicketId, createComment } from '@/db/queries/comments';
import { requireRole, isRoleError } from '@/lib/permissions';
import { getAssigneesByTicket } from '@/db/queries/ticketAssignees';
import { getTicketById } from '@/db/queries/tickets';

const mockedAuth = auth as jest.Mock;
const mockedGetComments = getCommentsByTicketId as jest.Mock;
const mockedCreateComment = createComment as jest.Mock;
const mockedRequireRole = requireRole as jest.Mock;
const mockedIsRoleError = isRoleError as jest.Mock;
const mockedGetAssignees = getAssigneesByTicket as jest.Mock;
const mockedGetTicketById = getTicketById as jest.Mock;

const TICKET_ID = '42';
const mockSession = { user: { id: 'user-1', workspaceId: 1, memberId: 5, name: '홍길동' } };

function makeParams(id = TICKET_ID) {
  return { params: Promise.resolve({ id }) };
}

function makePostRequest(body: unknown, id = TICKET_ID): NextRequest {
  return new NextRequest(`http://localhost/api/tickets/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(id = TICKET_ID): NextRequest {
  return new NextRequest(`http://localhost/api/tickets/${id}/comments`);
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: MEMBER role — no error
  mockedRequireRole.mockResolvedValue({ id: 5, role: 'MEMBER' });
  mockedIsRoleError.mockReturnValue(false);
  // Default: empty assignees + comments + no ticket (non-blocking notification path)
  mockedGetAssignees.mockResolvedValue([]);
  mockedGetComments.mockResolvedValue([]);
  mockedGetTicketById.mockResolvedValue(null);
});

// ─── GET — basic retrieve ────────────────────────────────────────────────────

describe('GET /api/tickets/[id]/comments', () => {
  it('returns 401 when unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(401);
  });

  it('returns 200 with comment list', async () => {
    mockedAuth.mockResolvedValue(mockSession);
    const comments = [{ id: 1, text: '댓글' }];
    mockedGetComments.mockResolvedValue(comments);

    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comments).toEqual(comments);
  });
});

// ─── POST — 401 ──────────────────────────────────────────────────────────────

describe('POST /api/tickets/[id]/comments — 401', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(makePostRequest({ text: '댓글' }), makeParams());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// ─── POST — 403 (VIEWER blocked) ─────────────────────────────────────────────

describe('POST /api/tickets/[id]/comments — 403', () => {
  it('returns 403 when VIEWER role tries to post a comment', async () => {
    mockedAuth.mockResolvedValue(mockSession);
    // Simulate VIEWER: requireRole returns a 403 NextResponse
    mockedRequireRole.mockResolvedValue(
      NextResponse.json({ error: { code: 'FORBIDDEN', message: '권한이 없습니다' } }, { status: 403 }),
    );
    mockedIsRoleError.mockReturnValue(true);

    const res = await POST(makePostRequest({ text: '댓글' }), makeParams());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ─── POST — 201 (MEMBER success) ─────────────────────────────────────────────

describe('POST /api/tickets/[id]/comments — 201', () => {
  it('creates a comment and returns 201 for MEMBER role', async () => {
    mockedAuth.mockResolvedValue(mockSession);
    const newComment = { id: 10, ticketId: 42, memberId: 5, text: '새 댓글' };
    mockedCreateComment.mockResolvedValue(newComment);

    const res = await POST(makePostRequest({ text: '새 댓글' }), makeParams());
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.comment).toEqual(newComment);
    expect(mockedCreateComment).toHaveBeenCalledWith(42, 5, '새 댓글');
  });

  it('returns 400 when comment text is empty', async () => {
    mockedAuth.mockResolvedValue(mockSession);

    const res = await POST(makePostRequest({ text: '' }), makeParams());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
