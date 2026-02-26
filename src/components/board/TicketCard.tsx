'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TicketWithMeta, IssueType } from '@/types/index';

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
  CRITICAL: { bg: '#FEE2E2', color: '#DC2626', label: 'Crit' },
  HIGH: { bg: '#FFEDD5', color: '#C2410C', label: 'High' },
  MEDIUM: { bg: '#FEF9C3', color: '#A16207', label: 'Med' },
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
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
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
      {/* Type indicator + Issue tag row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
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
        {ticket.issue && issueStyle && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: issueStyle.color,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ticket.issue.name}
          </span>
        )}
        {ticket.isOverdue && (
          <span
            aria-label="마감 초과"
            style={{ marginLeft: 'auto', fontSize: 12, color: '#DC2626' }}
          >
            ⚠
          </span>
        )}
      </div>

      {/* Labels */}
      {ticket.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 7 }}>
          {ticket.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 4,
                background: label.color,
                color: '#fff',
                whiteSpace: 'nowrap',
              }}
            >
              {label.name}
            </span>
          ))}
          {ticket.labels.length > 3 && (
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              +{ticket.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          lineHeight: 1.4,
          marginBottom: ticket.description ? 5 : 10,
        }}
      >
        {ticket.title}
      </div>

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

        {/* Due date badge */}
        {dueDateState && ticket.dueDate && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: DUE_BADGE_STYLES[dueDateState].bg,
              color: DUE_BADGE_STYLES[dueDateState].color,
            }}
          >
            📅 <span>{ticket.dueDate}</span>
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
            ☑ <span>{completedCount}/{totalCount}</span>
          </span>
        )}

        {/* Assignee mini-avatar */}
        {ticket.assignee && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                background: ticket.assignee.color,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              title={ticket.assignee.displayName}
            >
              {ticket.assignee.displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
