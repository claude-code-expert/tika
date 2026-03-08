'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import type { TicketWithMeta } from '@/types/index';

interface PersonalTicketShellProps {
  backlogTickets: TicketWithMeta[];
  workspaceName: string;
  workspaceId: number;
  children: React.ReactNode;
}

export function PersonalTicketShell({
  backlogTickets,
  workspaceName,
  workspaceId,
  children,
}: PersonalTicketShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Reorder backlog via API
    await fetch('/api/tickets/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId: Number(active.id),
        status: 'BACKLOG',
        targetId: Number(over.id),
        workspaceId,
      }),
    });
  }, [workspaceId]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-app-bg)',
      }}
    >
      <Header
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        accessibility={{ container: typeof document !== 'undefined' ? document.body : undefined }}
      >
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            backlogTickets={backlogTickets}
            isLoading={false}
            workspaceName={workspaceName}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />

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
      </DndContext>

      <Footer />
    </div>
  );
}
