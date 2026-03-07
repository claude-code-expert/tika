import type { TeamRole } from '@/types/index';

interface RoleBadgeProps {
  role: TeamRole;
  size?: 'sm' | 'md';
}

const ROLE_STYLES: Record<TeamRole, { background: string; color: string; label: string }> = {
  OWNER: { background: '#EDE9FE', color: '#7C3AED', label: '관리자' },
  MEMBER: { background: '#DBEAFE', color: '#1D4ED8', label: '멤버' },
  VIEWER: { background: '#F1F3F6', color: '#8993A4', label: '뷰어' },
};

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.VIEWER;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        borderRadius: 999,
        fontSize: size === 'sm' ? 9 : 10,
        fontWeight: 600,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        background: style.background,
        color: style.color,
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {style.label}
    </span>
  );
}
