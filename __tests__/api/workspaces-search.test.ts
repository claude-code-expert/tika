/**
 * @jest-environment node
 *
 * GET /api/workspaces/search?q= — search public TEAM workspaces
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

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/workspaces/search/route';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';

const mockedAuth = auth as jest.Mock;

const mockSession = { user: { id: 'user-1' } };

function makeGetRequest(q?: string): NextRequest {
  const url = q !== undefined
    ? `http://localhost/api/workspaces/search?q=${encodeURIComponent(q)}`
    : 'http://localhost/api/workspaces/search';
  return new NextRequest(url, { method: 'GET' });
}

function mockDbChain(result: unknown[]) {
  (db.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      leftJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(result),
          }),
        }),
      }),
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── 401 ─────────────────────────────────────────────────────────────────────

describe('GET /api/workspaces/search — 401', () => {
  it('returns 401 when no session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(makeGetRequest('test'));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});

// ─── 400 Validation ─────────────────────────────────────────────────────────

describe('GET /api/workspaces/search — 400', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns 400 for empty q', async () => {
    mockDbChain([]);
    const res = await GET(makeGetRequest(''));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for q longer than 50 chars', async () => {
    mockDbChain([]);
    const res = await GET(makeGetRequest('a'.repeat(51)));
    expect(res.status).toBe(400);
  });
});

// ─── 200 Results ─────────────────────────────────────────────────────────────

describe('GET /api/workspaces/search — 200', () => {
  beforeEach(() => mockedAuth.mockResolvedValue(mockSession));

  it('returns matching workspaces', async () => {
    const mockWorkspaces = [
      { id: 1, name: '마케팅팀', description: null, memberCount: 5 },
      { id: 2, name: '마케팅 스쿼드', description: '광고팀', memberCount: 3 },
    ];
    mockDbChain(mockWorkspaces);

    const res = await GET(makeGetRequest('마케팅'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.workspaces).toHaveLength(2);
    expect(data.workspaces[0].name).toBe('마케팅팀');
  });

  it('returns empty array when no matches', async () => {
    mockDbChain([]);

    const res = await GET(makeGetRequest('존재하지않는팀'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.workspaces).toEqual([]);
  });
});
