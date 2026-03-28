import type { TicketPriority, TicketStatus, TicketType } from '@/types/index';

// ─── Priority ──────────────────────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  string,
  { bg: string; color: string; icon: string; label: string }
> = {
  CRITICAL: { bg: '#FEE2E2', color: '#DC2626', icon: '!!', label: 'Critical' },
  HIGH:     { bg: '#FFEDD5', color: '#C2410C', icon: '↑',  label: 'High' },
  MEDIUM:   { bg: '#FEF9C3', color: '#A16207', icon: '—',  label: 'Medium' },
  LOW:      { bg: '#F3F4F6', color: '#6B7280', icon: '↓',  label: 'Low' },
};

interface PriorityBadgeProps {
  priority: TicketPriority | string;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  const sizeStyle =
    size === 'md'
      ? { height: 24, fontSize: 11, padding: '0 9px', borderRadius: 5, gap: 4 }
      : { height: 20, fontSize: 10, padding: '0 7px', borderRadius: 4, gap: 3 };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 700,
        whiteSpace: 'nowrap' as const,
        background: cfg.bg,
        color: cfg.color,
        ...sizeStyle,
      }}
    >
      <span style={{ fontWeight: 800, letterSpacing: -0.5 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  BACKLOG:     { bg: '#F1F3F6', color: '#5A6B7F', label: 'Backlog' },
  TODO:        { bg: '#DBEAFE', color: '#1E40AF', label: 'To Do' },
  IN_PROGRESS: { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
  DONE:        { bg: '#D1FAE5', color: '#065F46', label: 'Done' },
};

interface StatusBadgeProps {
  status: TicketStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.BACKLOG;
  const sizeStyle =
    size === 'md'
      ? { height: 24, fontSize: 11, padding: '0 9px', borderRadius: 5 }
      : { height: 20, fontSize: 10, padding: '0 7px', borderRadius: 4 };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
        background: cfg.bg,
        color: cfg.color,
        ...sizeStyle,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Issue / Ticket Type ───────────────────────────────────────────────────────

export const ISSUE_TYPE_CONFIG: Record<
  string,
  { bg: string; abbr: string; label: string }
> = {
  GOAL:    { bg: '#8B5CF6', abbr: 'G', label: 'Goal' },
  STORY:   { bg: '#3B82F6', abbr: 'S', label: 'Story' },
  FEATURE: { bg: '#10B981', abbr: 'F', label: 'Feature' },
  TASK:    { bg: '#F59E0B', abbr: 'T', label: 'Task' },
};

interface IssueTypeBadgeProps {
  type: TicketType | string;
  size?: number;
  showLabel?: boolean;
}

export function IssueTypeBadge({ type, size = 18, showLabel = false }: IssueTypeBadgeProps) {
  const cfg = ISSUE_TYPE_CONFIG[type] ?? { bg: '#9CA3AF', abbr: '?', label: type };
  const fontSize = Math.round(size * 0.55);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: cfg.bg,
          color: '#fff',
          fontSize,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {cfg.abbr}
      </span>
      {showLabel && (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {cfg.label}
        </span>
      )}
    </span>
  );
}

