'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { useResizable } from '@/hooks/useResizable';
import type { TeamRole } from '@/types/index';

const SIDEBAR_MIN = 50;
const SIDEBAR_MAX = 360;
const SIDEBAR_DEFAULT = 270;
const SIDEBAR_ICON_THRESHOLD = 120; // below this width → icon-only mode

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface TeamSidebarProps {
  workspaceId: number;
  role: TeamRole;
  workspaceName?: string;
}

function DashboardIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="11" rx="1" />
      <rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  );
}

function WbsIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}


export function TeamSidebar({ workspaceId, role, workspaceName }: TeamSidebarProps) {
  const pathname = usePathname();
  const base = `/team/${workspaceId}`;

  const { width, handleResizeStart, isResizing } = useResizable(SIDEBAR_DEFAULT, SIDEBAR_MIN, SIDEBAR_MAX);
  const iconOnly = width < SIDEBAR_ICON_THRESHOLD;

  const navItems: NavItem[] = [
    { href: base, label: '대시보드', icon: <DashboardIcon /> },
    { href: `${base}/board`, label: '칸반보드', icon: <BoardIcon /> },
    { href: `${base}/members`, label: '멤버관리', icon: <MembersIcon /> },
    { href: `${base}/wbs`, label: 'WBS', icon: <WbsIcon /> },
    { href: `${base}/analytics`, label: '분석', icon: <AnalyticsIcon /> },
  ];

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        overflow: 'visible',
      }}
    >
      <aside
        style={{
          width,
          minWidth: SIDEBAR_MIN,
          maxWidth: SIDEBAR_MAX,
          transition: 'none',
          background: '#F1F3F6',
          borderRight: '1px solid #DFE1E6',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Workspace selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: iconOnly ? 'center' : 'flex-start',
            gap: 8,
            padding: iconOnly ? '0' : '0 12px',
            borderBottom: '1px solid #DFE1E6',
            height: 48,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {iconOnly ? (
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: '#629584',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
              title={workspaceName}
            >
              {(workspaceName ?? 'W').slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <>
              <WorkspaceSwitcher
                currentWorkspaceId={workspaceId}
                currentWorkspaceName={workspaceName}
              />
              <RoleBadge role={role} />
            </>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {!iconOnly && (
            <div
              style={{
                padding: '8px 16px',
                fontSize: 10,
                fontWeight: 600,
                color: '#8993A4',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              팀 메뉴
            </div>
          )}

          {navItems.map(({ href, label, icon }) => {
            const isActive = href === base ? pathname === base : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={iconOnly ? label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: iconOnly ? 'center' : 'flex-start',
                  gap: iconOnly ? 0 : 8,
                  padding: iconOnly ? '10px 0' : '8px 16px',
                  fontSize: 13,
                  color: isActive ? '#629584' : '#5A6B7F',
                  fontWeight: isActive ? 500 : 400,
                  background: isActive ? '#E8F5F0' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.1s, color 0.1s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#E2E5EA';
                    e.currentTarget.style.color = '#2C3E50';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#5A6B7F';
                  }
                }}
              >
                <span style={{ color: isActive ? '#629584' : '#8993A4', display: 'inline-flex', flexShrink: 0 }}>
                  {icon}
                </span>
                {!iconOnly && label}
              </Link>
            );
          })}
        </nav>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            top: 0,
            right: -3,
            width: 6,
            height: '100%',
            cursor: 'col-resize',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#629584';
            (e.currentTarget as HTMLElement).style.opacity = '0.3';
          }}
          onMouseLeave={(e) => {
            if (!isResizing.current) {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }
          }}
          aria-label="사이드바 크기 조절"
          role="separator"
        />
      </aside>
    </div>
  );
}
