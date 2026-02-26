/**
 * @jest-environment node
 *
 * PATCH /api/workspaces/[id] 테스트
 * TC-WS 설정 기능: 워크스페이스 이름/설명 수정
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/queries/workspaces', () => ({
  getWorkspaceById: jest.fn(),
  updateWorkspace: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/workspaces/[id]/route';
import { auth } from '@/lib/auth';
import { getWorkspaceById, updateWorkspace } from '@/db/queries/workspaces';

const mockedAuth = auth as jest.Mock;
const mockedGetWorkspaceById = getWorkspaceById as jest.Mock;
const mockedUpdateWorkspace = updateWorkspace as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };
const mockWorkspace = { id: 1, name: '내 워크스페이스', description: null, ownerId: 'user-1', createdAt: '2026-01-01T00:00:00.000Z' };

function makePatchRequest(id: string, body: unknown): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/workspaces/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return [req, { params: Promise.resolve({ id }) }];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PATCH /api/workspaces/[id]', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const [req, ctx] = makePatchRequest('1', { name: '새 이름' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('잘못된 id 형식은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePatchRequest('abc', { name: '새 이름' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('다른 워크스페이스 수정 시도는 403을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user-1', workspaceId: 2 } });
    const [req, ctx] = makePatchRequest('1', { name: '새 이름' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('존재하지 않는 워크스페이스는 404를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetWorkspaceById.mockResolvedValueOnce(null);
    const [req, ctx] = makePatchRequest('1', { name: '새 이름' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('유효성 검증 실패는 400을 반환한다 (빈 바디)', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockWorkspace);
    const [req, ctx] = makePatchRequest('1', {});
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('이름 50자 초과는 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockWorkspace);
    const [req, ctx] = makePatchRequest('1', { name: 'a'.repeat(51) });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('이름만 수정하면 200과 업데이트된 워크스페이스를 반환한다', async () => {
    const updated = { ...mockWorkspace, name: '새 프로젝트 이름' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockWorkspace);
    mockedUpdateWorkspace.mockResolvedValueOnce(updated);
    const [req, ctx] = makePatchRequest('1', { name: '새 프로젝트 이름' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.workspace.name).toBe('새 프로젝트 이름');
  });

  it('설명 수정 및 null 설정이 가능하다', async () => {
    const updated = { ...mockWorkspace, description: null };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockWorkspace);
    mockedUpdateWorkspace.mockResolvedValueOnce(updated);
    const [req, ctx] = makePatchRequest('1', { name: '이름', description: null });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.workspace.description).toBeNull();
  });

  it('설명 200자 초과는 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockWorkspace);
    const [req, ctx] = makePatchRequest('1', { name: '이름', description: 'a'.repeat(201) });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('DB 오류 시 500을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockWorkspace);
    mockedUpdateWorkspace.mockRejectedValueOnce(new Error('DB error'));
    const [req, ctx] = makePatchRequest('1', { name: '새 이름' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
