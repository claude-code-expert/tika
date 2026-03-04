'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TicketWithMeta, IssueType } from '@/types/index';
import { AlertTriangle, Calendar, CheckSquare } from 'lucide-react';

const TICKET_TYPE_INDICATOR: Record<string, { bg: string; abbr: string }> = {
  GOAL: { bg: '#8B5CF6', abbr: 'G' },
  STORY: { bg: '#3B82F6', abbr: 'S' },
  FEATURE: { bg: '#10B981', abbr: 'F' },
  TASK: { bg: '#F59E0B', abbr: 'T' },
};

const ISSUE_TAG_STYLES: Record<IssueType, { bg: string; color: string }> = {
  GOAL: { bg: '#F3E8FF', color: '#8B5CF6' },
  STORY: { bg: '#DBEAFE', color: '#3B82F6' },
  FEATURE: { bg: '#D1FAE5', color: '#10B981' },
};

const PRIORITY_STYLES = {
  CRITICAL: { bg: '#FEE2E2', color: '#DC2626', label: 'Critical' },
  HIGH: { bg: '#FFEDD5', color: '#C2410C', label: 'High' },
  MEDIUM: { bg: '#FEF9C3', color: '#A16207', label: 'Medium' },
  LOW: { bg: '#F3F4F6', color: '#6B7280', label: 'Low' },
};

const DUE_BADGE_STYLES = {
  normal: { bg: '#F0FDF4', color: '#16A34A' },
  soon: { bg: '#FEF9C3', color: '#A16207' },
  overdue: { bg: '#FEE2E2', color: '#DC2626' },
};

function getDueDateState(
  dueDate: string | null,
  isOverdue: boolean,
): 'normal' | 'soon' | 'overdue' | null {
  if (!dueDate) return null;
  if (isOverdue) return 'overdue';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 3) return 'soon';
  return 'normal';
}


interface TicketCardProps {
  ticket: TicketWithMeta;
  onClick?: () => void;
  workspaceName?: string;
}

export function TicketCard({ ticket, onClick, workspaceName }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedCount = ticket.checklistItems.filter((c) => c.isCompleted).length;
  const totalCount = ticket.checklistItems.length;
  const dueDateState = getDueDateState(ticket.dueDate, ticket.isOverdue);
  const issueStyle = ticket.issue ? ISSUE_TAG_STYLES[ticket.issue.type] : null;
  const priorityStyle = PRIORITY_STYLES[ticket.priority];
  const typeIndicator = TICKET_TYPE_INDICATOR[ticket.type] ?? TICKET_TYPE_INDICATOR.TASK;

  const handleClick = () => {
    if (!isDragging) onClick?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--color-card-bg)',
        border: ticket.isOverdue ? '2px solid #DC2626' : '1px solid var(--color-border)',
        borderRadius: 7,
        padding: 12,
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        transition: isDragging ? undefined : 'box-shadow 0.15s, border-color 0.15s',
      }}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDragging) handleClick();
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
          if (!ticket.isOverdue) {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)';
          }
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
        if (!ticket.isOverdue) {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
        }
      }}
      aria-label={`티켓: ${ticket.title}`}
    >
      {/* Row 1: Type icon + Title (truncated) + overdue warning */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, minWidth: 0 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            background: typeIndicator.bg,
            flexShrink: 0,
          }}
        >
          {typeIndicator.abbr}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: ticket.status === 'DONE' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            textDecoration: ticket.status === 'DONE' ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {ticket.title}
        </span>
        {ticket.isOverdue && (
          <span
            aria-label="마감 초과"
            style={{ color: '#DC2626', flexShrink: 0, display: 'flex' }}
          >
            <AlertTriangle size={12} />
          </span>
        )}
        {workspaceName && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            {workspaceName}-{ticket.id}
          </span>
        )}
      </div>

      {/* Issue tag (if linked) */}
      {ticket.issue && issueStyle && (
        <div style={{ marginBottom: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              background: issueStyle.bg,
              color: issueStyle.color,
              display: 'inline-block',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ticket.issue.name}
          </span>
        </div>
      )}

      {/* Description */}
      {ticket.description && (
        <div
          style={
            {
              fontSize: 11,
              color: 'var(--color-text-muted)',
              lineHeight: 1.5,
              marginBottom: 10,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as React.CSSProperties
          }
        >
          {ticket.description}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Priority badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 4,
            background: priorityStyle.bg,
            color: priorityStyle.color,
          }}
        >
          {priorityStyle.label}
        </span>

        {/* Labels */}
        {ticket.labels && ticket.labels.map((label) => (
          <span
            key={label.id}
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 3,
              background: label.color,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            {label.name}
          </span>
        ))}

        {/* Due date badge */}
        {dueDateState && ticket.dueDate && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              color: ticket.isOverdue ? '#DC2626' : 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            <Calendar size={10} /> <span>{ticket.dueDate}</span>
          </span>
        )}

        {/* Checklist badge */}
        {totalCount > 0 && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <CheckSquare size={10} /> <span>{completedCount}/{totalCount}</span>
          </span>
        )}

        {/* Assignee avatars — show multi-assignees if present, fallback to single assignee */}
        {(() => {
          const displayAssignees = (ticket.assignees && ticket.assignees.length > 0)
            ? ticket.assignees
            : ticket.assignee ? [ticket.assignee] : [];
          if (displayAssignees.length === 0) return null;
          const visible = displayAssignees.slice(0, 3);
          const extra = displayAssignees.length - 3;
          return (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
                {extra > 0 && (
                  <div
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', background: '#8993A4',
                      border: '2px solid #fff',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    +{extra}
                  </div>
                )}
                {[...visible].reverse().map((a) => (
                  <div
                    key={a.id}
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', background: a.color,
                      border: '2px solid #fff',
                      marginRight: -6,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    title={a.displayName}
                  >
                    {a.displayName.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
