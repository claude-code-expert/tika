/**
 * @jest-environment node
 *
 * PATCH /api/workspaces/[id]/join-requests/[reqId] — approve or reject a join request
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/index', () => ({
  db: {
    select: jest.fn(),
  },
}));
jest.mock('@/db/schema', () => ({
  members: {},
  users: {},
}));
jest.mock('@/db/queries/joinRequests', () => ({
  getJoinRequestById: jest.fn(),
  approveJoinRequest: jest.fn(),
  rejectJoinRequest: jest.fn(),
}));
jest.mock('@/db/queries/members', () => ({
  getMemberByUserId: jest.fn(),
  getTeamWorkspaceMemberCount: jest.fn(),
}));
jest.mock('@/db/queries/workspaces', () => ({
  getWorkspaceById: jest.fn(),
}));
jest.mock('@/lib/notifications', () => ({
  sendInAppNotification: jest.fn().mockResolvedValue(undefined),
  buildJoinRequestResolvedMessage: jest.fn().mockReturnValue({ title: '', message: '' }),
}));

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/workspaces/[id]/join-requests/[reqId]/route';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { getJoinRequestById, approveJoinRequest, rejectJoinRequest } from '@/db/queries/joinRequests';
import { getMemberByUserId, getTeamWorkspaceMemberCount } from '@/db/queries/members';
import { getWorkspaceById } from '@/db/queries/workspaces';

const mockedAuth = auth as jest.Mock;
const mockedGetJoinRequestById = getJoinRequestById as jest.Mock;
const mockedApproveJoinRequest = approveJoinRequest as jest.Mock;
const mockedRejectJoinRequest = rejectJoinRequest as jest.Mock;
const mockedGetMemberByUserId = getMemberByUserId as jest.Mock;
const mockedGetTeamWorkspaceMemberCount = getTeamWorkspaceMemberCount as jest.Mock;
const mockedGetWorkspaceById = getWorkspaceById as jest.Mock;

const mockSession = { user: { id: 'user-1' } };
const WORKSPACE_ID = '5';
const REQ_ID = '10';

function makeParams(id = WORKSPACE_ID, reqId = REQ_ID) {
  return { params: Promise.resolve({ id, reqId }) };
}

function makePatchRequest(id = WORKSPACE_ID, reqId = REQ_ID, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/workspaces/${id}/join-requests/${reqId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { action: 'APPROVE' }),
  });
}

function mockOwnerCheck(isOwner: boolean) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(isOwner ? [{ id: 1 }] : []),
      }),
    }),
  });
}

// For APPROVE path: handles both owner check (1st call) and user name lookup (2nd call)
function mockOwnerAndUserLookup(isOwner: boolean, userName?: string) {
  let callCount = 0;
  (db.select as jest.Mock).mockImplementation(() => {
    callCount++;
    const rows =
      callCount === 1
        ? isOwner ? [{ id: 1 }] : []
        : userName ? [{ name: userName }] : [];
    return {
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(rows),
        }),
      }),
    };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetWorkspaceById.mockResolvedValue({ id: 5, name: '테스트 워크스페이스' });
  mockedGetTeamWorkspaceMemberCount.mockResolvedValue(0);
});

// ─── 401 ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/workspaces/[id]/join-requests/[reqId] — 401', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await PATCH(makePatchRequest(), makeParams());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});

// ─── 400 ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/workspaces/[id]/join-requests/[reqId] — 400', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 400 for invalid workspace id', async () => {
    mockOwnerCheck(true);
    const res = await PATCH(makePatchRequest('abc', REQ_ID), makeParams('abc', REQ_ID));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid reqId', async () => {
    mockOwnerCheck(true);
    const res = await PATCH(makePatchRequest(WORKSPACE_ID, 'xyz'), makeParams(WORKSPACE_ID, 'xyz'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid action in body', async () => {
    mockOwnerCheck(true);
    const res = await PATCH(makePatchRequest(WORKSPACE_ID, REQ_ID, { action: 'DELETE' }), makeParams());
    // Validation error comes AFTER owner check
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── 403 ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/workspaces/[id]/join-requests/[reqId] — 403', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 403 when caller is not OWNER', async () => {
    mockOwnerCheck(false);
    const res = await PATCH(makePatchRequest(), makeParams());
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe('FORBIDDEN');
  });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/workspaces/[id]/join-requests/[reqId] — 404', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 404 when join request not found', async () => {
    mockOwnerCheck(true);
    mockedGetJoinRequestById.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest(), makeParams());
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe('NOT_FOUND');
  });
});

// ─── 409 already processed ──────────────────────────────────────────────────

describe('PATCH /api/workspaces/[id]/join-requests/[reqId] — 409', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 409 when request is already APPROVED', async () => {
    mockOwnerCheck(true);
    mockedGetJoinRequestById.mockResolvedValue({ id: 10, userId: 'user-2', status: 'APPROVED' });

    const res = await PATCH(makePatchRequest(), makeParams());
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe('ALREADY_PROCESSED');
  });

  it('returns 409 when request is already REJECTED', async () => {
    mockOwnerCheck(true);
    mockedGetJoinRequestById.mockResolvedValue({ id: 10, userId: 'user-2', status: 'REJECTED' });

    const res = await PATCH(makePatchRequest(WORKSPACE_ID, REQ_ID, { action: 'REJECT' }), makeParams());
    expect(res.status).toBe(409);
  });
});

// ─── 200 APPROVE ────────────────────────────────────────────────────────────

describe('PATCH /api/workspaces/[id]/join-requests/[reqId] — APPROVE', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('approves a PENDING request and returns member', async () => {
    mockOwnerAndUserLookup(true, undefined); // 1st: owner check, 2nd: no name → '멤버'
    const pendingRequest = { id: 10, userId: 'user-2', workspaceId: 5, status: 'PENDING' };
    mockedGetJoinRequestById.mockResolvedValue(pendingRequest);
    const updatedRequest = { ...pendingRequest, status: 'APPROVED' };
    const newMember = { id: 99, userId: 'user-2', workspaceId: 5, role: 'MEMBER' };
    mockedApproveJoinRequest.mockResolvedValue({ joinRequest: updatedRequest, member: newMember });

    const res = await PATCH(makePatchRequest(WORKSPACE_ID, REQ_ID, { action: 'APPROVE' }), makeParams());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.joinRequest.status).toBe('APPROVED');
    expect(data.member.id).toBe(99);
    expect(mockedApproveJoinRequest).toHaveBeenCalledWith(
      10,
      5,
      1,
      { userId: 'user-2', displayName: '멤버' },
    );
  });

  it('uses user name as displayName when available', async () => {
    mockOwnerAndUserLookup(true, '김철수'); // 1st: owner, 2nd: name = '김철수'
    const pendingRequest = { id: 10, userId: 'user-2', workspaceId: 5, status: 'PENDING' };
    mockedGetJoinRequestById.mockResolvedValue(pendingRequest);
    mockedApproveJoinRequest.mockResolvedValue({
      joinRequest: { ...pendingRequest, status: 'APPROVED' },
      member: { id: 99 },
    });

    await PATCH(makePatchRequest(WORKSPACE_ID, REQ_ID, { action: 'APPROVE' }), makeParams());
    expect(mockedApproveJoinRequest).toHaveBeenCalledWith(
      10,
      5,
      1,
      { userId: 'user-2', displayName: '김철수' },
    );
  });
});

// ─── 200 REJECT ─────────────────────────────────────────────────────────────

describe('PATCH /api/workspaces/[id]/join-requests/[reqId] — REJECT', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('rejects a PENDING request and returns updated joinRequest', async () => {
    mockOwnerCheck(true);
    const pendingRequest = { id: 10, userId: 'user-2', workspaceId: 5, status: 'PENDING' };
    mockedGetJoinRequestById.mockResolvedValue(pendingRequest);
    const updatedRequest = { ...pendingRequest, status: 'REJECTED' };
    mockedRejectJoinRequest.mockResolvedValue(updatedRequest);

    const res = await PATCH(makePatchRequest(WORKSPACE_ID, REQ_ID, { action: 'REJECT' }), makeParams());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.joinRequest.status).toBe('REJECTED');
    expect(mockedRejectJoinRequest).toHaveBeenCalledWith(10, 5, 1);
  });
});
