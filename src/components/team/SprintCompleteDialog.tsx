'use client';

import { useState, useEffect } from 'react';
import type { Sprint, Ticket } from '@/types/index';

interface TicketMove {
  ticketId: number;
  destination: 'backlog' | 'sprint';
  targetSprintId?: number;
}

interface SprintCompleteDialogProps {
  sprint: Sprint;
  workspaceId: number;
  plannedSprints: Sprint[];
  onClose: () => void;
  onComplete: () => void;
}

export function SprintCompleteDialog({
  sprint,
  workspaceId,
  plannedSprints,
  onClose,
  onComplete,
}: SprintCompleteDialogProps) {
  const [incompleteTickets, setIncompleteTickets] = useState<Ticket[]>([]);
  const [moves, setMoves] = useState<Record<number, TicketMove>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch incomplete tickets in this sprint
    fetch(`/api/tickets?sprintId=${sprint.id}&status=!DONE`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { tickets?: Ticket[] } | null) => {
        const tickets = data?.tickets ?? [];
        setIncompleteTickets(tickets);
        // Default: move all to backlog
        const defaultMoves: Record<number, TicketMove> = {};
        for (const t of tickets) {
          defaultMoves[t.id] = { ticketId: t.id, destination: 'backlog' };
        }
        setMoves(defaultMoves);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sprint.id]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/sprints/${sprint.id}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketMoves: Object.values(moves) }),
        },
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message: string } };
        setError(data.error?.message ?? '스프린트 완료에 실패했습니다');
        setSubmitting(false);
        return;
      }
      onComplete();
    } catch {
      setError('오류가 발생했습니다');
      setSubmitting(false);
    }
  }

  function setMove(ticketId: number, destination: 'backlog' | 'sprint', targetSprintId?: number) {
    setMoves((prev) => ({ ...prev, [ticketId]: { ticketId, destination, targetSprintId } }));
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(9,30,66,0.54)',
        zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,.2)',
          padding: 24,
          maxWidth: 560,
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#2C3E50', marginBottom: 4 }}>
            스프린트 완료
          </h2>
          <p style={{ fontSize: 13, color: '#8993A4' }}>
            <strong>{sprint.name}</strong> 스프린트를 완료합니다.
            미완료 티켓의 이동 위치를 선택하세요.
          </p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 6, padding: '10px 14px', fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#8993A4', fontSize: 13 }}>
              로딩 중...
            </div>
          ) : incompleteTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#8993A4', fontSize: 13 }}>
              미완료 티켓이 없습니다. 스프린트를 완료할 수 있습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {incompleteTickets.map((ticket) => {
                const move = moves[ticket.id] ?? { ticketId: ticket.id, destination: 'backlog' };
                return (
                  <div
                    key={ticket.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: '#F8F9FB',
                      borderRadius: 8,
                      border: '1px solid #DFE1E6',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#2C3E50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#8993A4' }}>
                        {ticket.status} · {ticket.priority}
                      </div>
                    </div>
                    <select
                      value={move.destination === 'sprint' ? `sprint:${move.targetSprintId ?? ''}` : 'backlog'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'backlog') {
                          setMove(ticket.id, 'backlog');
                        } else {
                          const sid = Number(val.split(':')[1]);
                          setMove(ticket.id, 'sprint', sid);
                        }
                      }}
                      style={{
                        height: 30,
                        padding: '0 8px',
                        borderRadius: 6,
                        border: '1px solid #DFE1E6',
                        fontSize: 12,
                        color: '#2C3E50',
                        background: '#fff',
                        cursor: 'pointer',
                        flexShrink: 0,
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      <option value="backlog">백로그로 이동</option>
                      {plannedSprints.map((s) => (
                        <option key={s.id} value={`sprint:${s.id}`}>
                          {s.name}으로 이동
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              height: 36, padding: '0 16px',
              borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              background: '#fff', border: '1px solid #DFE1E6', color: '#5A6B7F',
              opacity: submitting ? 0.6 : 1,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            style={{
              height: 36, padding: '0 16px',
              borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: '#629584', border: 'none', color: '#fff',
              opacity: submitting ? 0.7 : 1,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {submitting ? '처리 중...' : '스프린트 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}
