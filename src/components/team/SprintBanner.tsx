import Link from 'next/link';
import type { Sprint } from '@/types/index';

interface SprintBannerProps {
  sprint: Sprint;
  workspaceId: number;
  completedTickets: number;
  totalTickets: number;
  completedPoints: number;
  totalPoints: number;
}

function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function SprintBanner({
  sprint,
  workspaceId,
  completedTickets,
  totalTickets,
  completedPoints,
  totalPoints,
}: SprintBannerProps) {
  const remaining = daysRemaining(sprint.endDate);
  const progress = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DFE1E6',
        borderRadius: 8,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
      }}
    >
      {/* Sprint icon */}
      <div
        style={{
          width: 40,
          height: 40,
          background: '#E8F5F0',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#629584',
          flexShrink: 0,
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>

      {/* Sprint info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: '#2C3E50',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sprint.name}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 999,
              background: '#D1FAE5',
              color: '#059669',
              flexShrink: 0,
            }}
          >
            ACTIVE
          </span>
          {remaining !== null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: remaining <= 3 ? '#DC2626' : '#629584',
                flexShrink: 0,
              }}
            >
              {remaining > 0 ? `D-${remaining}` : remaining === 0 ? '오늘 마감' : '마감 초과'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#5A6B7F' }}>
          {sprint.goal && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sprint.goal}
            </span>
          )}
          {(sprint.startDate || sprint.endDate) && (
            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              {sprint.startDate} ~ {sprint.endDate}
            </span>
          )}
          <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            {completedTickets} / {totalTickets} 완료
          </span>
          {totalPoints > 0 && (
            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              {completedPoints} / {totalPoints} SP
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: 160, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#8993A4' }}>진행률</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#629584' }}>{progress}%</span>
        </div>
        <div
          style={{
            height: 6,
            background: '#E8EDF2',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#629584',
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Burndown link */}
      <Link
        href={`/workspace/${workspaceId}/burndown?sprintId=${sprint.id}`}
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          color: '#629584',
          border: '1px solid #629584',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        번다운 차트 →
      </Link>
    </div>
  );
}
