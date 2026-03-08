'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { WorkspaceCreator } from './WorkspaceCreator';
import { WorkspaceFinder } from './WorkspaceFinder';

interface WorkspaceOnboardingProps {
  userId: string;
  userName: string;
}

type Tab = 'create' | 'find';

export function WorkspaceOnboarding({ userId, userName }: WorkspaceOnboardingProps) {
  const [activeTab, setActiveTab] = useState<Tab>('create');

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${activeTab === tab ? 'var(--color-accent, #629584)' : 'transparent'}`,
    color:
      activeTab === tab
        ? 'var(--color-accent, #629584)'
        : 'var(--color-text-muted, #6B7280)',
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
    fontSize: 14,
    fontWeight: activeTab === tab ? 700 : 500,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          minHeight: '100vh',
          background: '#F8F9FB',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 20px',
        }}
      >
        {/* Logo — heading 바로 위, 중앙 */}
        <div style={{ marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/icon/tika-logo-header.png" alt="Tika" style={{ height: 36, objectFit: 'contain' }} />
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--color-text-primary, #2C3E50)',
              margin: 0,
            }}
          >
            워크스페이스 설정
          </h1>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 15,
              color: 'var(--color-text-muted, #6B7280)',
              marginTop: 8,
            }}
          >
            새 워크스페이스를 만들거나, 기존 워크스페이스에 참여하세요
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border, #E5E7EB)',
            borderRadius: 12,
            width: '100%',
            maxWidth: 520,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--color-border, #E5E7EB)',
              padding: '0 8px',
            }}
          >
            <button style={tabStyle('create')} onClick={() => setActiveTab('create')}>
              <Plus size={16} />
              개설
            </button>
            <button style={tabStyle('find')} onClick={() => setActiveTab('find')}>
              <Search size={16} />
              찾기
            </button>
          </div>

          {/* Tab Content — minHeight 고정으로 탭 전환 시 카드 크기 변동 없음 */}
          <div style={{ padding: '28px 32px', minHeight: 340 }}>
            {activeTab === 'create' ? (
              <WorkspaceCreator />
            ) : (
              <WorkspaceFinder userId={userId} userName={userName} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
