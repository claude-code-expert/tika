'use client';

import { Header } from './Header';
import { Footer } from './Footer';
import { TeamSidebar } from '@/components/team/TeamSidebar';
import type { TeamRole } from '@/types/index';

interface TeamShellProps {
  workspaceId: number;
  role: TeamRole;
  children: React.ReactNode;
}

export function TeamShell({ workspaceId, role, children }: TeamShellProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#F8F9FB',
      }}
    >
      <Header />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <TeamSidebar workspaceId={workspaceId} role={role} />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#E8EDF2',
          }}
        >
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
