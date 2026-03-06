'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { JoinRequestWithUser } from '@/types/index';

interface JoinRequestListProps {
  workspaceId: number;
  initialRequests: JoinRequestWithUser[];
}

interface RowState {
  loadingApprove: boolean;
  loadingReject: boolean;
  error: string | null;
}

export function JoinRequestList({ workspaceId, initialRequests }: JoinRequestListProps) {
  const [requests, setRequests] = useState<JoinRequestWithUser[]>(initialRequests);
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});

  if (requests.length === 0) return null;

  const setRowState = (id: number, partial: Partial<RowState>) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { loadingApprove: false, loadingReject: false, error: null }), ...partial },
    }));
  };

  const handleAction = async (req: JoinRequestWithUser, action: 'APPROVE' | 'REJECT') => {
    const isApprove = action === 'APPROVE';
    setRowState(req.id, isApprove ? { loadingApprove: true } : { loadingReject: true });

    // Optimistic remove
    setRequests((prev) => prev.filter((r) => r.id !== req.id));

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/join-requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? '오류가 발생했습니다.');
      }

      // Success — row stays removed
      setRowStates((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
    } catch (err) {
      // Rollback: re-insert request
      setRequests((prev) => {
        const exists = prev.some((r) => r.id === req.id);
        if (exists) return prev;
        const idx = initialRequests.findIndex((r) => r.id === req.id);
        const next = [...prev];
        next.splice(idx, 0, req);
        return next;
      });
      setRowState(req.id, {
        loadingApprove: false,
        loadingReject: false,
        error: err instanceof Error ? err.message : '오류가 발생했습니다.',
      });
    }
  };

  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #DFE1E6',
        borderRadius: 10,
        padding: '16px 18px',
        marginTop: 24,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#6B7280',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        가입 신청
        <span
          style={{
            background: 'var(--color-accent, #629584)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 10,
            padding: '1px 7px',
            textTransform: 'none',
            letterSpacing: 0,
          }}
        >
          {requests.length}건
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {requests.map((req) => {
          const state = rowStates[req.id];
          const isAnyLoading = state?.loadingApprove || state?.loadingReject;

          return (
            <div key={req.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: '#F9FAFB',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--color-accent, #629584)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    backgroundImage: req.userAvatarUrl ? `url(${req.userAvatarUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!req.userAvatarUrl && (req.userName?.charAt(0).toUpperCase() ?? '?')}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {req.userName ?? '알 수 없음'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {req.userEmail ?? ''} · {new Date(req.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleAction(req, 'REJECT')}
                    disabled={isAnyLoading}
                    title="거절"
                    style={{
                      padding: '5px 12px',
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6B7280',
                      cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                      opacity: isAnyLoading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                    }}
                  >
                    {state?.loadingReject ? (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          border: '2px solid #d1d5db',
                          borderTopColor: '#6B7280',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                        }}
                      />
                    ) : (
                      <XCircle size={13} />
                    )}
                    거절
                  </button>

                  <button
                    onClick={() => handleAction(req, 'APPROVE')}
                    disabled={isAnyLoading}
                    title="승인"
                    style={{
                      padding: '5px 12px',
                      background: 'var(--color-accent, #629584)',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#fff',
                      cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                      opacity: isAnyLoading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                    }}
                  >
                    {state?.loadingApprove ? (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite',
                        }}
                      />
                    ) : (
                      <CheckCircle size={13} />
                    )}
                    승인
                  </button>
                </div>
              </div>

              {state?.error && (
                <p
                  style={{
                    fontSize: 11,
                    color: '#EF4444',
                    margin: '2px 10px 6px',
                    fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  }}
                >
                  {state.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
