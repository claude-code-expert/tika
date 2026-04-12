'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TicketForm } from '@/components/ticket/TicketForm';
import { GeneralSection } from './GeneralSection';
import { NotificationPreferencesSection } from './NotificationPreferencesSection';
import { LabelSection } from './LabelSection';
import type { SectionKey, ToastType } from './types';
import type { TeamRole } from '@/types/index';

const VIEWER_ALLOWED_SECTIONS: SectionKey[] = ['general'];
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';

interface ToastState {
  message: string;
  type: ToastType;
}

const NAV_ITEMS: { key: SectionKey; label: string; icon: ReactNode }[] = [
  {
    key: 'general',
    label: '일반 설정',
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={12} r={3} />
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      </svg>
    ),
  },
  {
    key: 'notification-preferences',
    label: '알림 설정',
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    key: 'labels',
    label: '라벨 관리',
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1={7} y1={7} x2={7.01} y2={7} />
      </svg>
    ),
  },
];

export function SettingsShell({ workspaceId, role }: { workspaceId: number; role: TeamRole }) {
  const isViewer = role === 'VIEWER';
  const visibleNavItems = isViewer
    ? NAV_ITEMS.filter((item) => VIEWER_ALLOWED_SECTIONS.includes(item.key))
    : NAV_ITEMS;

  const searchParams = useSearchParams();
  const router = useRouter();
  const rawSection = (searchParams.get('section') as SectionKey) ?? 'general';
  const initialSection =
    isViewer && !VIEWER_ALLOWED_SECTIONS.includes(rawSection) ? 'general' : rawSection;
  const [activeSection, setActiveSection] = useState<SectionKey>(initialSection);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewTask = useCallback(() => setIsNewTicketOpen(true), []);

  const handleTicketSubmit = useCallback(
    async (data: CreateTicketInput | UpdateTicketInput) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, workspaceId }),
      });
      if (!res.ok) {
        showToast('업무 생성에 실패했습니다.', 'fail');
      }
      setIsNewTicketOpen(false);
      router.push(`/workspace/${workspaceId}/board`);
    },
    [workspaceId, router],
  );

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const sectionRenderers: Record<SectionKey, ReactNode> = {
    general: <GeneralSection showToast={showToast} workspaceId={workspaceId} />,
    'notification-preferences': <NotificationPreferencesSection showToast={showToast} workspaceId={workspaceId} />,
    labels: <LabelSection showToast={showToast} workspaceId={workspaceId} />,
  };

  const toastEl = toast ? (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', top: 80, right: 20, padding: '10px 16px', borderRadius: 6,
        fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 500,
        display: 'flex', alignItems: 'center', gap: 6, animation: 'toastIn 0.2s ease',
        ...(toast.type === 'success'
          ? { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }
          : toast.type === 'fail'
            ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }
            : { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }),
      }}
    >
      {toast.type === 'success' ? '✓' : toast.type === 'fail' ? '✕' : 'ℹ'} {toast.message}
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8F9FB', fontFamily: "'Noto Sans KR', 'Plus Jakarta Sans', sans-serif" }}>
      <Header onNewTask={isViewer ? undefined : handleNewTask} searchQuery={searchQuery} onSearch={setSearchQuery} />

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

      {/* Body */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Side Nav */}
        <nav style={{ width: 220, background: '#F1F3F6', borderRight: '1px solid #DFE1E6', padding: '20px 0', flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8993A4', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 20px', marginBottom: 8 }}>설정</div>
          {visibleNavItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px',
                  fontSize: 12,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  outline: 'none',
                  transition: 'all 0.15s',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  ...(isActive
                    ? { borderLeft: '3px solid #629584', background: '#E8F5F0', color: '#629584', fontWeight: 500 }
                    : { borderLeft: '3px solid transparent', background: 'transparent', color: '#5A6B7F', fontWeight: 400 }),
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, padding: '32px 40px', maxWidth: 840, overflowY: 'auto' }}>
          {sectionRenderers[activeSection]}
        </main>
      </div>

      <Footer />

      {toastEl}
    </div>
  );
}
