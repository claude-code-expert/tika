'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { TeamRole } from '@/types/index';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface TeamSidebarProps {
  workspaceId: number;
  role: TeamRole;
}

function DashboardIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
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

function BurndownIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function TeamSidebar({ workspaceId, role }: TeamSidebarProps) {
  const pathname = usePathname();
  const base = `/team/${workspaceId}`;

  const navItems: NavItem[] = [
    { href: base, label: '대시보드', icon: <DashboardIcon /> },
    { href: `${base}/wbs`, label: 'WBS / 간트', icon: <WbsIcon /> },
    { href: `${base}/members`, label: '멤버', icon: <MembersIcon /> },
    { href: `${base}/analytics`, label: '분석', icon: <AnalyticsIcon /> },
    { href: `${base}/burndown`, label: '번다운', icon: <BurndownIcon /> },
  ];

  return (
    <aside
      style={{
        width: 240,
        background: '#F1F3F6',
        borderRight: '1px solid #DFE1E6',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Workspace selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid #DFE1E6',
          minHeight: 52,
        }}
      >
        <WorkspaceSwitcher currentWorkspaceId={workspaceId} />
        <RoleBadge role={role} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
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

        {navItems.map(({ href, label, icon }) => {
          const isActive = href === base ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                fontSize: 13,
                color: isActive ? '#629584' : '#5A6B7F',
                fontWeight: isActive ? 500 : 400,
                background: isActive ? '#E8F5F0' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.1s',
                whiteSpace: 'nowrap',
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
              <span style={{ color: isActive ? '#629584' : '#8993A4', display: 'inline-flex' }}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
