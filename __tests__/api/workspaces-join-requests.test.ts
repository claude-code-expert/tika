/**
 * @jest-environment node
 *
 * POST /api/workspaces/[id]/join-requests — submit a join request
 * GET  /api/workspaces/[id]/join-requests — list join requests (OWNER only)
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/index', () => ({
  db: {
    select: jest.fn(),
  },
}));
jest.mock('@/db/schema', () => ({
  workspaces: {},
  members: {},
}));
jest.mock('@/db/queries/joinRequests', () => ({
  getJoinRequests: jest.fn(),
  createJoinRequest: jest.fn(),
  getPendingRequestByUser: jest.fn(),
}));
jest.mock('@/db/queries/members', () => ({
  getMembersByWorkspace: jest.fn(),
  getTeamWorkspaceMemberCount: jest.fn(),
}));
jest.mock('@/db/queries/workspaces', () => ({
  getWorkspaceById: jest.fn(),
}));
jest.mock('@/lib/notifications', () => ({
  sendInAppNotification: jest.fn().mockResolvedValue(undefined),
  buildJoinRequestReceivedMessage: jest.fn().mockReturnValue({ title: '', message: '' }),
}));

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/workspaces/[id]/join-requests/route';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { getJoinRequests, createJoinRequest, getPendingRequestByUser } from '@/db/queries/joinRequests';
import { getMembersByWorkspace, getTeamWorkspaceMemberCount } from '@/db/queries/members';
import { getWorkspaceById } from '@/db/queries/workspaces';

const mockedAuth = auth as jest.Mock;
const mockedGetJoinRequests = getJoinRequests as jest.Mock;
const mockedCreateJoinRequest = createJoinRequest as jest.Mock;
const mockedGetPendingRequestByUser = getPendingRequestByUser as jest.Mock;
const mockedGetMembersByWorkspace = getMembersByWorkspace as jest.Mock;
const mockedGetTeamWorkspaceMemberCount = getTeamWorkspaceMemberCount as jest.Mock;
const mockedGetWorkspaceById = getWorkspaceById as jest.Mock;

const mockSession = { user: { id: 'user-1' } };
const WORKSPACE_ID = '5';

function makeParams(id = WORKSPACE_ID) {
  return { params: Promise.resolve({ id }) };
}

function makePostRequest(id = WORKSPACE_ID, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/workspaces/${id}/join-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeGetRequest(id = WORKSPACE_ID, status?: string): NextRequest {
  const url = status
    ? `http://localhost/api/workspaces/${id}/join-requests?status=${status}`
    : `http://localhost/api/workspaces/${id}/join-requests`;
  return new NextRequest(url, { method: 'GET' });
}

function mockDbSelectChain(rows: unknown[]) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(rows),
      }),
    }),
  });
}

function mockDbSelectSequence(sequences: unknown[][]) {
  let callCount = 0;
  (db.select as jest.Mock).mockImplementation(() => {
    const rows = sequences[callCount] ?? [];
    callCount++;
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
  // Default: safe fallbacks for post-create notification calls
  mockedGetMembersByWorkspace.mockResolvedValue([]);
  mockedGetWorkspaceById.mockResolvedValue({ id: 5, name: '테스트' });
  mockedGetTeamWorkspaceMemberCount.mockResolvedValue(0);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/workspaces/[id]/join-requests
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/workspaces/[id]/join-requests — 401', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(makePostRequest(), makeParams());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/workspaces/[id]/join-requests — 400', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 400 for non-numeric workspace id', async () => {
    const res = await POST(makePostRequest('abc'), makeParams('abc'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/workspaces/[id]/join-requests — 404', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 404 when workspace does not exist', async () => {
    mockDbSelectChain([]); // workspace not found
    const res = await POST(makePostRequest(), makeParams());
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/workspaces/[id]/join-requests — 403', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 403 for PERSONAL workspace', async () => {
    mockDbSelectChain([{ id: 5, type: 'PERSONAL' }]);
    const res = await POST(makePostRequest(), makeParams());
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe('FORBIDDEN');
  });
});

describe('POST /api/workspaces/[id]/join-requests — 409', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 409 when already a member', async () => {
    // workspace exists → member check → already member
    mockDbSelectSequence([[{ id: 5, type: 'TEAM' }], [{ id: 1 }]]);
    const res = await POST(makePostRequest(), makeParams());
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe('ALREADY_MEMBER');
  });

  it('returns 409 when already has pending request', async () => {
    // workspace exists, not a member, but pending request exists
    mockDbSelectSequence([[{ id: 5, type: 'TEAM' }], []]);
    mockedGetPendingRequestByUser.mockResolvedValue({ id: 99 });
    const res = await POST(makePostRequest(), makeParams());
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe('ALREADY_REQUESTED');
  });
});

describe('POST /api/workspaces/[id]/join-requests — 201', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('creates join request and returns 201', async () => {
    mockDbSelectSequence([[{ id: 5, type: 'TEAM' }], []]);
    mockedGetPendingRequestByUser.mockResolvedValue(null);
    const mockJoinRequest = { id: 10, workspaceId: 5, userId: 'user-1', status: 'PENDING' };
    mockedCreateJoinRequest.mockResolvedValue(mockJoinRequest);

    const res = await POST(makePostRequest(), makeParams());
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.joinRequest.id).toBe(10);
    expect(data.joinRequest.status).toBe('PENDING');
  });

  it('creates join request with optional message', async () => {
    mockDbSelectSequence([[{ id: 5, type: 'TEAM' }], []]);
    mockedGetPendingRequestByUser.mockResolvedValue(null);
    const mockJoinRequest = { id: 11, workspaceId: 5, userId: 'user-1', status: 'PENDING', message: '안녕하세요' };
    mockedCreateJoinRequest.mockResolvedValue(mockJoinRequest);

    const res = await POST(makePostRequest(WORKSPACE_ID, { message: '안녕하세요' }), makeParams());
    expect(res.status).toBe(201);
    expect(mockedCreateJoinRequest).toHaveBeenCalledWith(5, 'user-1', '안녕하세요');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GET /api/workspaces/[id]/join-requests
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/workspaces/[id]/join-requests — 401', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(401);
  });
});

describe('GET /api/workspaces/[id]/join-requests — 403', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 403 when caller is not OWNER', async () => {
    mockDbSelectChain([]); // not an owner
    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe('FORBIDDEN');
  });
});

describe('GET /api/workspaces/[id]/join-requests — 200', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns join requests for OWNER', async () => {
    mockDbSelectChain([{ id: 1 }]); // owner check passes
    const mockRequests = [
      { id: 10, userId: 'user-2', workspaceId: 5, status: 'PENDING', createdAt: new Date().toISOString() },
    ];
    mockedGetJoinRequests.mockResolvedValue(mockRequests);

    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.joinRequests).toHaveLength(1);
    expect(data.joinRequests[0].id).toBe(10);
  });

  it('filters by APPROVED status when requested', async () => {
    mockDbSelectChain([{ id: 1 }]);
    mockedGetJoinRequests.mockResolvedValue([]);

    const res = await GET(makeGetRequest(WORKSPACE_ID, 'APPROVED'), makeParams());
    expect(res.status).toBe(200);
    expect(mockedGetJoinRequests).toHaveBeenCalledWith(5, 'APPROVED');
  });
});
