import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { requireRole, isRoleError } from '@/lib/permissions';
import { TEAM_ROLE } from '@/types/index';
import { saveGeminiKeySchema } from '@/lib/validations';
import { encryptApiKey, maskApiKey } from '@/lib/encryptionService';
import {
  getGeminiKeyMeta,
  upsertGeminiKey,
  deleteGeminiKey,
} from '@/db/queries/workspaceSettings';
import { GoogleGenAI } from '@google/genai';

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

// D-05/D-06: Probe Gemini with minimum-cost request before saving
// models.list is the lightest call — no token consumption.
async function probeGeminiKey(apiKey: string): Promise<'valid' | 'invalid' | 'network_error'> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.list({ config: { pageSize: 1 } });
    return 'valid';
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 400 || status === 403) return 'invalid';
    return 'network_error';
  }
}

// GET /api/settings/gemini-key
// Returns { data: { maskedKey, updatedAt } } for OWNER with key, { data: null } if no key.
// Returns 403 for MEMBER or VIEWER.
// CRITICAL: Never includes ciphertext, iv, or tag in response.
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;
    const roleCheck = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(roleCheck)) return roleCheck;

    const meta = await getGeminiKeyMeta(workspaceId);
    return NextResponse.json({ data: meta });
  } catch (error) {
    console.error('GET /api/settings/gemini-key error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

// POST /api/settings/gemini-key
// Validates input with Zod, probes Gemini, encrypts and upserts on valid probe.
// Returns 400 with PROBE_FAILED for invalid key, 502 with PROBE_NETWORK_ERROR on network failure.
// CRITICAL: Response contains { maskedKey, saved } only — never ciphertext/iv/tag.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;
    const roleCheck = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(roleCheck)) return roleCheck;

    const body = await request.json();
    const result = saveGeminiKeySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const { apiKey } = result.data;

    // D-05/D-06: Probe Gemini before saving — only store if key is valid
    const probeResult = await probeGeminiKey(apiKey);
    if (probeResult === 'invalid') {
      return NextResponse.json(
        {
          error: {
            code: 'PROBE_FAILED',
            message: '유효하지 않은 API 키입니다. Gemini API에 접근할 수 없었습니다.',
          },
        },
        { status: 400 },
      );
    }
    if (probeResult === 'network_error') {
      return NextResponse.json(
        {
          error: {
            code: 'PROBE_NETWORK_ERROR',
            message: '키 유효성 확인에 실패했습니다. 네트워크 연결을 확인해주세요.',
          },
        },
        { status: 502 },
      );
    }

    // Probe passed — encrypt and store (KEY-01, KEY-02, KEY-06)
    const encrypted = encryptApiKey(apiKey);
    const maskedKey = maskApiKey(apiKey);
    await upsertGeminiKey(workspaceId, {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      tag: encrypted.tag,
      maskedKey,
    });

    return NextResponse.json({ data: { maskedKey, saved: true } }, { status: 200 });
  } catch (error) {
    console.error('POST /api/settings/gemini-key error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

// DELETE /api/settings/gemini-key
// Removes the Gemini key for the workspace. Returns 204 on success.
// Returns 403 for non-OWNER.
export async function DELETE(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;
    const roleCheck = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(roleCheck)) return roleCheck;

    await deleteGeminiKey(workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/settings/gemini-key error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
