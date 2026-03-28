'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Search, CheckCircle, AlertTriangle, DatabaseSearch } from 'lucide-react';
import type { WorkspaceSearchResult } from '@/types/index';

interface WorkspaceFinderProps {
  userId: string;
  userName: string;
}

// Pattern: /invite/<uuid-token>
const INVITE_PATTERN = /\/invite\/([0-9a-f-]{36})/i;
// Pattern: /workspace/<number>
const TEAM_URL_PATTERN = /\/workspace\/(\d+)/;

type SearchState = 'idle' | 'loading' | 'results' | 'no-results' | 'invite-success' | 'error';

interface WorkspaceCardProps {
  workspace: WorkspaceSearchResult;
  onJoinRequest: (id: number) => void;
  requested: boolean;
  loading: boolean;
}

function WorkspaceCard({ workspace, onJoinRequest, requested, loading }: WorkspaceCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--color-border, #E5E7EB)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: workspace.iconColor ?? '#629584',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Building2 size={20} color="#ffffff" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary, #2C3E50)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {workspace.name}
        </p>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 12,
            color: 'var(--color-text-muted, #6B7280)',
            margin: '2px 0 0',
          }}
        >
          멤버 {workspace.memberCount}명
        </p>
      </div>

      {requested ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--color-accent, #629584)',
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <CheckCircle size={16} />
          신청 완료
        </div>
      ) : (
        <button
          onClick={() => onJoinRequest(workspace.id)}
          disabled={loading}
          style={{
            padding: '6px 14px',
            background: '#ffffff',
            color: '#2b7fff',
            border: '1.5px solid #2b7fff',
            borderRadius: 6,
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            flexShrink: 0,
            transition: 'opacity 0.15s',
          }}
        >
          가입신청
        </button>
      )}
    </div>
  );
}

export function WorkspaceFinder({}: WorkspaceFinderProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [state, setState] = useState<SearchState>('idle');
  const [results, setResults] = useState<WorkspaceSearchResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<number | null>(null);
  const [goingPersonal, setGoingPersonal] = useState(false);

  const handleSearch = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setErrorMsg(null);
    setState('loading');

    // Case 1: Invite link /invite/<token>
    const inviteMatch = trimmed.match(INVITE_PATTERN);
    if (inviteMatch) {
      const token = inviteMatch[1];
      try {
        const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' });
        const data = await res.json();

        if (!res.ok) {
          const msg =
            res.status === 410 || (data.error?.code === 'INVITE_EXPIRED')
              ? '초대 링크가 만료되었습니다. 오너에게 새 링크를 요청하세요.'
              : data.error?.message ?? '초대 링크 처리 중 오류가 발생했습니다.';
          setErrorMsg(msg);
          setState('error');
          return;
        }

        setInviteWorkspaceId(data.workspaceId ?? null);
        setState('invite-success');

        // Auto-redirect to the team workspace
        if (data.workspaceId) {
          setTimeout(() => router.push(`/workspace/${data.workspaceId}`), 1500);
        }
      } catch {
        setErrorMsg('초대 링크 처리 중 오류가 발생했습니다.');
        setState('error');
      }
      return;
    }

    // Case 2: /workspace/<id> URL — submit join request directly
    const teamMatch = trimmed.match(TEAM_URL_PATTERN);
    if (teamMatch) {
      const wsId = parseInt(teamMatch[1], 10);
      try {
        const res = await fetch(`/api/workspaces/${wsId}/join-requests`, { method: 'POST' });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error?.message ?? '가입 신청 중 오류가 발생했습니다.');
          setState('error');
          return;
        }

        setRequestedIds(new Set([wsId]));
        setResults([]);
        setState('invite-success');
      } catch {
        setErrorMsg('가입 신청 중 오류가 발생했습니다.');
        setState('error');
      }
      return;
    }

    // Case 3: Plain text search
    try {
      const res = await fetch(`/api/workspaces/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message ?? '검색 중 오류가 발생했습니다.');
        setState('error');
        return;
      }

      const workspaceList: WorkspaceSearchResult[] = data.workspaces ?? [];
      setResults(workspaceList);
      setState(workspaceList.length === 0 ? 'no-results' : 'results');
    } catch {
      setErrorMsg('검색 중 오류가 발생했습니다.');
      setState('error');
    }
  };

  const handleJoinRequest = async (wsId: number) => {
    setJoiningId(wsId);
    try {
      const res = await fetch(`/api/workspaces/${wsId}/join-requests`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error?.message ?? '가입 신청 중 오류가 발생했습니다.');
      } else {
        setRequestedIds((prev) => new Set([...prev, wsId]));
      }
    } catch {
      setErrorMsg('가입 신청 중 오류가 발생했습니다.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleGoPersonal = async () => {
    setGoingPersonal(true);
    try {
      await fetch('/api/users/type', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'USER' }),
      });
      router.push('/');
    } catch {
      setGoingPersonal(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="워크스페이스 이름 또는 초대 링크"
          disabled={state === 'loading'}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--color-border, #E5E7EB)',
            borderRadius: 8,
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-primary, #2C3E50)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSearch}
          disabled={state === 'loading' || !input.trim()}
          style={{
            padding: '10px 16px',
            background: 'var(--color-accent, #629584)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: state === 'loading' || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: state === 'loading' || !input.trim() ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
            transition: 'opacity 0.15s',
          }}
        >
          {state === 'loading' ? (
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.5)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          ) : (
            <Search size={16} />
          )}
          검색
        </button>
      </div>

      {/* Search results */}
      {state === 'results' && results.length > 0 && (
        <div>
          {results.map((ws) => (
            <WorkspaceCard
              key={ws.id}
              workspace={ws}
              onJoinRequest={handleJoinRequest}
              requested={requestedIds.has(ws.id)}
              loading={joiningId === ws.id}
            />
          ))}
          {requestedIds.size > 0 && (
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                fontSize: 12,
                color: 'var(--color-text-muted, #6B7280)',
                margin: '12px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckCircle size={13} color="#629584" />
              가입 승인 시 자동으로 팀 워크스페이스에 접근할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {/* No results */}
      {state === 'no-results' && (
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-muted, #6B7280)',
            textAlign: 'center',
            padding: '16px 0',
          }}
        >
          워크스페이스가 없습니다. 초대 링크로 진입하세요.
        </p>
      )}

      {/* Invite success */}
      {state === 'invite-success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-accent, #629584)',
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <CheckCircle size={18} />
            {inviteWorkspaceId
              ? '✅ 워크스페이스에 참여했습니다! 이동 중...'
              : '✅ 가입 신청이 완료되었습니다.'}
          </div>
          {!inviteWorkspaceId && (
            <button
              onClick={handleGoPersonal}
              disabled={goingPersonal}
              style={{
                padding: '9px 16px',
                background: 'transparent',
                color: 'var(--color-text-muted, #6B7280)',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: goingPersonal ? 'not-allowed' : 'pointer',
                opacity: goingPersonal ? 0.7 : 1,
                alignSelf: 'flex-start',
              }}
            >
              {goingPersonal ? '이동 중...' : '개인 보드로 이동 →'}
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {(state === 'error' || errorMsg) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            color: '#EF4444',
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          {errorMsg}
        </div>
      )}

      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
          fontSize: 12,
          color: 'var(--color-text-muted, #6B7280)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <DatabaseSearch size={14} />
        워크스페이스 이름으로 검색하거나, 초대 링크를 붙여넣기 하세요.
      </p>
    </div>
  );
}
