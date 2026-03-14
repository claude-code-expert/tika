'use client';

import { useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TicketWithMeta, TicketType } from '@/types/index';
import { AlertTriangle, Calendar, CheckSquare } from 'lucide-react';
import { TICKET_TYPE_META } from '@/lib/constants';
import { PriorityBadge } from '@/components/ui/Chips';
import { LabelBadge } from '@/components/label/LabelBadge';

const PARENT_TAG_STYLES: Record<string, { bg: string; color: string }> = {
  GOAL: { bg: '#F3E8FF', color: '#8B5CF6' },
  STORY: { bg: '#DBEAFE', color: '#3B82F6' },
  FEATURE: { bg: '#D1FAE5', color: '#10B981' },
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
  cardBg?: string;
}

function TicketCardInner({ ticket, onClick, workspaceName, cardBg }: TicketCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    router.push(`/workspace/${ticket.workspaceId}/${ticket.id}`);
  };

  const handleNavigateToParent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging || !ticket.parent) return;
    router.push(`/workspace/${ticket.workspaceId}/${ticket.parent.id}`);
  };

  const dndTransform = CSS.Transform.toString(transform);
  const mergedTransition = isDragging
    ? undefined
    : [transition, 'box-shadow 0.15s, border-color 0.15s'].filter(Boolean).join(', ');

  const completedCount = useMemo(
    () => ticket.checklistItems.filter((c) => c.isCompleted).length,
    [ticket.checklistItems],
  );
  const totalCount = ticket.checklistItems.length;
  const dueDateState = useMemo(
    () => getDueDateState(ticket.plannedEndDate, ticket.isOverdue),
    [ticket.plannedEndDate, ticket.isOverdue],
  );
  const parentStyle = ticket.parent ? PARENT_TAG_STYLES[ticket.parent.type as TicketType] : null;
  const typeIndicator = TICKET_TYPE_META[ticket.type as keyof typeof TICKET_TYPE_META] ?? TICKET_TYPE_META.TASK;
  const displayAssignees = useMemo(
    () =>
      ticket.assignees && ticket.assignees.length > 0
        ? ticket.assignees
        : ticket.assignee
          ? [ticket.assignee]
          : [],
    [ticket.assignees, ticket.assignee],
  );

  const handleClick = () => {
    if (!isDragging) onClick?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: dndTransform ?? undefined,
        transition: mergedTransition,
        opacity: isDragging ? 0.4 : 1,
        background: cardBg ?? 'var(--color-card-bg)',
        border: ticket.isOverdue ? '2px solid #DC2626' : '1px solid var(--color-border)',
        borderRadius: 7,
        padding: 12,
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
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
          onClick={handleNavigate}
          onPointerDown={(e) => e.stopPropagation()}
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
            cursor: 'pointer',
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-accent)';
            e.currentTarget.style.textDecoration = ticket.status === 'DONE' ? 'line-through' : 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = ticket.status === 'DONE' ? 'var(--color-text-muted)' : 'var(--color-text-primary)';
            e.currentTarget.style.textDecoration = ticket.status === 'DONE' ? 'line-through' : 'none';
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
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/workspace/${ticket.workspaceId}/${ticket.id}`;
              navigator.clipboard.writeText(url);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="상세 페이지 주소 복사"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              marginLeft: 'auto',
              cursor: 'pointer',
              padding: '1px 6px',
              borderRadius: 4,
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-accent-light, #E8F5F0)';
              e.currentTarget.style.color = 'var(--color-accent)';
              e.currentTarget.style.fontWeight = '600';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-muted)';
              e.currentTarget.style.fontWeight = '500';
            }}
          >
            {workspaceName}-{ticket.id}
          </span>
        )}
      </div>

      {/* Parent tag (if linked) */}
      {ticket.parent && parentStyle && (
        <div style={{ marginBottom: 6 }}>
          <span
            onClick={handleNavigateToParent}
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              background: parentStyle.bg,
              color: parentStyle.color,
              display: 'inline-block',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              textDecoration: 'none',
              textDecorationColor: parentStyle.color,
              transition: 'text-decoration 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
              e.currentTarget.style.textDecorationColor = parentStyle.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {ticket.parent.title}
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
        <PriorityBadge priority={ticket.priority} size="sm" />

        {/* Labels */}
        {ticket.labels && ticket.labels.map((label) => (
          <LabelBadge key={label.id} label={label} size="sm" />
        ))}

        {/* Due date badge */}
        {dueDateState && ticket.plannedEndDate && (
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
            <Calendar size={10} /> <span>{ticket.plannedEndDate}</span>
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

export const TicketCard = memo(TicketCardInner);
