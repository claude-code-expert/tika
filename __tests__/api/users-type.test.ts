/**
 * @jest-environment node
 *
 * PATCH /api/users/type — onboarding user type selection
 * 401 unauth, 400 validation, USER creates workspace, WORKSPACE no workspace
 */

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
  createPersonalWorkspace: jest.fn(),
}));
jest.mock('@/db/index', () => ({
  db: {
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    set: jest.fn().mockReturnThis(),
  },
}));
jest.mock('@/db/schema', () => ({
  users: {},
  workspaces: {},
}));

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/users/type/route';
import { auth, createPersonalWorkspace } from '@/lib/auth';
import { db } from '@/db/index';

const mockedAuth = auth as jest.Mock;
const mockedCreatePersonalWorkspace = createPersonalWorkspace as jest.Mock;
// db chain mocks — update().set().where() returns a promise
const mockedDb = db as jest.Mocked<typeof db>;

const mockSession = { user: { id: 'user-1', name: '홍길동' } };

function makePatchRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/users/type', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: update chain resolves
  (mockedDb.update as jest.Mock).mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    }),
  });
  // Default: no existing workspace
  (mockedDb.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
  });
});

// ─── 401 Unauthorized ───────────────────────────────────────────────────────

describe('PATCH /api/users/type — 401', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await PATCH(makePatchRequest({ userType: 'USER' }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});

// ─── 400 Validation ─────────────────────────────────────────────────────────

describe('PATCH /api/users/type — 400', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 400 for invalid userType', async () => {
    const res = await PATCH(makePatchRequest({ userType: 'ADMIN' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing userType', async () => {
    const res = await PATCH(makePatchRequest({}));
    expect(res.status).toBe(400);
  });
});

// ─── 200 USER type ──────────────────────────────────────────────────────────

describe('PATCH /api/users/type — USER type', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('creates personal workspace when none exists', async () => {
    mockedCreatePersonalWorkspace.mockResolvedValue({ id: 42 });

    const res = await PATCH(makePatchRequest({ userType: 'USER' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.userType).toBe('USER');
    expect(data.workspace.id).toBe(42);
    expect(mockedCreatePersonalWorkspace).toHaveBeenCalledWith('user-1', '홍길동');
  });

  it('reuses existing workspace when one exists', async () => {
    (mockedDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ id: 10 }]),
        }),
      }),
    });

    const res = await PATCH(makePatchRequest({ userType: 'USER' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.workspace.id).toBe(10);
    expect(mockedCreatePersonalWorkspace).not.toHaveBeenCalled();
  });
});

// ─── 200 WORKSPACE type ─────────────────────────────────────────────────────

describe('PATCH /api/users/type — WORKSPACE type', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns null workspace for WORKSPACE type', async () => {
    const res = await PATCH(makePatchRequest({ userType: 'WORKSPACE' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.userType).toBe('WORKSPACE');
    expect(data.workspace).toBeNull();
    expect(mockedCreatePersonalWorkspace).not.toHaveBeenCalled();
  });
});
