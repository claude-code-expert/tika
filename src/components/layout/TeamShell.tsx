'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { TeamSidebar } from '@/components/team/TeamSidebar';
import { TicketForm } from '@/components/ticket/TicketForm';
import type { TeamRole } from '@/types/index';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';
import { BoardRefreshContext } from '@/lib/board-refresh-context';
import { SearchQueryContext } from '@/lib/search-query-context';

interface TeamShellProps {
  workspaceId: number;
  role: TeamRole;
  workspaceName?: string;
  iconColor?: string | null;
  children: React.ReactNode;
}

export function TeamShell({ workspaceId, role, workspaceName, iconColor, children }: TeamShellProps) {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Sync isPrimary so that navigating to "/" redirects back to this workspace
  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/primary`, { method: 'PATCH' }).catch(() => {});
  }, [workspaceId]);
  const fetchBoardRef = useRef<(() => Promise<void>) | null>(null);

  const boardRefreshCtx = useMemo(
    () => ({ register: (fn: () => Promise<void>) => { fetchBoardRef.current = fn; } }),
    [],
  );

  const handleNewTask = useCallback(() => {
    setIsNewTicketOpen(true);
  }, []);

  const handleTicketSubmit = useCallback(
    async (data: CreateTicketInput | UpdateTicketInput) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, workspaceId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.warning) setWarningMsg(json.warning);
      }
      setIsNewTicketOpen(false);
      router.push(`/workspace/${workspaceId}/board`);
      await fetchBoardRef.current?.();
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
      <Header onNewTask={role === 'VIEWER' ? undefined : handleNewTask} searchQuery={searchQuery} onSearch={setSearchQuery} />

      {/* Ticket limit warning banner */}
      {warningMsg && (
        <div
          style={{
            background: '#FEF3C7',
            borderBottom: '1px solid #FCD34D',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#92400E',
            flexShrink: 0,
          }}
        >
          <span>⚠️ {warningMsg}</span>
          <button
            onClick={() => setWarningMsg(null)}
            aria-label="경고 닫기"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

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
        <TeamSidebar workspaceId={workspaceId} role={role} workspaceName={workspaceName} iconColor={iconColor} />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#E8EDF2',
          }}
        >
          <SearchQueryContext.Provider value={{ searchQuery }}>
            <BoardRefreshContext.Provider value={boardRefreshCtx}>
              {children}
            </BoardRefreshContext.Provider>
          </SearchQueryContext.Provider>
        </main>
      </div>

      <Footer />
    </div>
  );
}
