'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { TeamSidebar } from '@/components/team/TeamSidebar';
import { TicketForm } from '@/components/ticket/TicketForm';
import type { TeamRole } from '@/types/index';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';

interface TeamShellProps {
  workspaceId: number;
  role: TeamRole;
  workspaceName?: string;
  children: React.ReactNode;
}

export function TeamShell({ workspaceId, role, workspaceName, children }: TeamShellProps) {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const router = useRouter();

  const handleNewTask = useCallback(() => setIsNewTicketOpen(true), []);

  const handleTicketSubmit = useCallback(
    async (data: CreateTicketInput | UpdateTicketInput) => {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, workspaceId }),
      });
      setIsNewTicketOpen(false);
      router.push(`/team/${workspaceId}/board`);
    },
    [workspaceId, router],
  );

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
      <Header onNewTask={handleNewTask} />

      {/* New ticket modal */}
      {isNewTicketOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsNewTicketOpen(false); }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '100%',
              maxWidth: 800,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            }}
          >
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 16, color: '#2C3E50', fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
              새 업무 만들기
            </div>
            <TicketForm
              mode="create"
              workspaceId={workspaceId}
              onSubmit={handleTicketSubmit}
              onCancel={() => setIsNewTicketOpen(false)}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <TeamSidebar workspaceId={workspaceId} role={role} workspaceName={workspaceName} />

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
