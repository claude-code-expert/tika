'use client';

import { useState } from 'react';
import type { TicketWithMeta } from '@/types/index';

interface GoalProgressRowProps {
  goals: TicketWithMeta[];
  allTickets: TicketWithMeta[];
}

const TYPE_BADGE: Record<string, { bg: string; color: string; abbr: string }> = {
  GOAL:    { bg: '#8B5CF6', color: '#fff', abbr: 'G' },
  STORY:   { bg: '#3B82F6', color: '#fff', abbr: 'S' },
  FEATURE: { bg: '#10B981', color: '#fff', abbr: 'F' },
  TASK:    { bg: '#F59E0B', color: '#fff', abbr: 'T' },
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  BACKLOG:     { bg: '#F1F3F6', color: '#5A6B7F', label: 'Backlog' },
  TODO:        { bg: '#DBEAFE', color: '#1E40AF', label: 'To Do' },
  IN_PROGRESS: { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
  DONE:        { bg: '#D1FAE5', color: '#065F46', label: 'Done' },
};

const TYPE_ORDER: Record<string, number> = { STORY: 0, FEATURE: 1, TASK: 2 };

function getDescendants(goalId: number, allTickets: TicketWithMeta[]): TicketWithMeta[] {
  const result: TicketWithMeta[] = [];
  const queue = allTickets.filter((t) => t.parentId === goalId);
  while (queue.length > 0) {
    const t = queue.shift()!;
    result.push(t);
    allTickets.filter((c) => c.parentId === t.id).forEach((c) => queue.push(c));
  }
  return result.sort((a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9));
}

export function GoalProgressRow({ goals, allTickets }: GoalProgressRowProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (goals.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '16px 0' }}>
        Goal 티켓 없음
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {goals.slice(0, 5).map((goal) => {
        // Use ALL descendants (recursive) for progress — not just direct children
        const allDescendants = getDescendants(goal.id, allTickets);
        const done = allDescendants.filter((t) => t.status === 'DONE').length;
        const total = allDescendants.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : (goal.status === 'DONE' ? 100 : 0);
        const isExpanded = expandedId === goal.id;
        const descendants = isExpanded ? allDescendants : [];

        return (
          <div
            key={goal.id}
            style={{
              borderRadius: 8,
              background: 'var(--color-card-bg, #fff)',
              border: `1px solid ${isExpanded ? '#8B5CF6' : 'var(--color-border, #DFE1E6)'}`,
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
          >
            {/* Header row — clickable */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedId(isExpanded ? null : goal.id)}
              onKeyDown={(e) => e.key === 'Enter' && setExpandedId(isExpanded ? null : goal.id)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 16, height: 16, borderRadius: 3,
                      fontSize: 9, fontWeight: 700, color: '#fff', background: '#8B5CF6', flexShrink: 0,
                    }}
                  >
                    G
                  </span>
                  <span
                    style={{
                      fontSize: 12, fontWeight: 600, color: '#374151',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {goal.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? '#629584' : '#374151' }}>
                    {pct}%
                  </span>
                  <span style={{ fontSize: 10, color: '#9CA3AF', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▾
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%', borderRadius: 3,
                    background: pct >= 100 ? '#629584' : '#8B5CF6',
                    width: `${pct}%`, transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
                {done}/{total} 항목 완료
              </div>
            </div>

            {/* Drilldown — child ticket list */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid #F1F3F6' }}>
                {descendants.length === 0 ? (
                  <div style={{ padding: '10px 14px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                    하위 항목 없음
                  </div>
                ) : (
                  descendants.map((t) => {
                    const tb = TYPE_BADGE[t.type] ?? TYPE_BADGE.TASK;
                    const sb = STATUS_STYLE[t.status] ?? STATUS_STYLE.BACKLOG;
                    const firstAssignee = t.assignees?.[0];
                    const depth = t.parentId === goal.id ? 0 : 1;
                    return (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: `6px 14px 6px ${14 + depth * 16}px`,
                          borderBottom: '1px solid #F8F9FB',
                          fontSize: 11,
                        }}
                      >
                        {/* depth indicator */}
                        {depth > 0 && (
                          <span style={{ color: '#D1D5DB', fontSize: 10, flexShrink: 0 }}>└</span>
                        )}
                        {/* type badge */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 14, height: 14, borderRadius: 2,
                          fontSize: 8, fontWeight: 700, color: tb.color, background: tb.bg, flexShrink: 0,
                        }}>
                          {tb.abbr}
                        </span>
                        {/* title */}
                        <span style={{
                          flex: 1, color: '#374151', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {t.title}
                        </span>
                        {/* assignee */}
                        {firstAssignee && (
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: firstAssignee.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 7, fontWeight: 700, color: '#fff', flexShrink: 0,
                          }} title={firstAssignee.displayName}>
                            {firstAssignee.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* status badge */}
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
                          background: sb.bg, color: sb.color, whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {sb.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
