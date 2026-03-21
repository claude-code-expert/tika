'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, Building2, Plus, Search } from 'lucide-react';
import { WorkspaceCreator } from './WorkspaceCreator';
import { WorkspaceFinder } from './WorkspaceFinder';

interface OnboardingWizardProps {
  userId: string;
  userName: string;
}

type MainTab = 'personal' | 'team';
type TeamTab = 'create' | 'find';

export function OnboardingWizard({ userId, userName }: OnboardingWizardProps) {
  const router = useRouter();
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState<MainTab>('personal');
  const [teamTab, setTeamTab] = useState<TeamTab>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPersonal = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/users/type', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'USER' }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? '오류가 발생했습니다.');
      }

      await update();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const mainTabStyle = (tab: MainTab): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 28px',
    background: activeTab === tab ? 'var(--color-accent, #629584)' : '#ffffff',
    color: activeTab === tab ? '#ffffff' : 'var(--color-text-muted, #6B7280)',
    border: `2px solid ${activeTab === tab ? 'var(--color-accent, #629584)' : '#E5E7EB'}`,
    borderRadius: 8,
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  const teamTabStyle = (tab: TeamTab): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${teamTab === tab ? 'var(--color-accent, #629584)' : 'transparent'}`,
    color: teamTab === tab ? 'var(--color-accent, #629584)' : 'var(--color-text-muted, #6B7280)',
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
    fontSize: 14,
    fontWeight: teamTab === tab ? 700 : 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'color 0.15s, border-color 0.15s',
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
          padding: '40px 20px',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/icon/tika-logo-header.png" alt="Tika" style={{ height: 40, objectFit: 'contain' }} />
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-text-primary, #2C3E50)',
              margin: 0,
            }}
          >
            안녕하세요, {userName}님!
          </h1>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 16,
              color: 'var(--color-text-muted, #6B7280)',
              margin: '10px 0 0',
            }}
          >
            Tika를 어떻게 시작할까요?
          </p>
        </div>

        {/* Main tab selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button onClick={() => setActiveTab('personal')} style={mainTabStyle('personal')}>
            <User size={16} />
            개인 보드
          </button>
          <button onClick={() => setActiveTab('team')} style={mainTabStyle('team')}>
            <Building2 size={16} />
            팀 워크스페이스
          </button>
        </div>

        {/* Personal tab content */}
        {activeTab === 'personal' && (
          <div
            style={{
              background: '#ffffff',
              border: '2px solid var(--color-accent, #629584)',
              borderRadius: 12,
              padding: '32px 28px',
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 4px 16px rgba(98,149,132,0.15)',
            }}
          >
            <div style={{ color: 'var(--color-accent, #629584)', marginBottom: 16 }}>
              <User size={32} />
            </div>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-text-primary, #2C3E50)',
                margin: '0 0 8px',
              }}
            >
              개인 보드
            </h2>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                fontSize: 14,
                color: 'var(--color-text-muted, #6B7280)',
                margin: '0 0 20px',
              }}
            >
              혼자 업무를 관리하는 개인 칸반 보드입니다.
            </p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {['개인 칸반 보드', '총 300개의 티켓 생성 가능', 'Goal > Story > Feature > Task 4단계 이슈 생성'].map(
                (f) => (
                  <li
                    key={f}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                      fontSize: 13,
                      color: 'var(--color-text-primary, #2C3E50)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ color: 'var(--color-accent, #629584)', fontWeight: 600 }}>✓</span>
                    {f}
                  </li>
                ),
              )}
            </ul>
            <button
              onClick={startPersonal}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 20px',
                background: 'var(--color-accent, #629584)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.5)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  처리 중...
                </>
              ) : (
                <>개인 보드 시작하기 →</>
              )}
            </button>
            {error && (
              <p
                style={{
                  marginTop: 12,
                  color: '#EF4444',
                  fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {error}
              </p>
            )}
          </div>
        )}

        {/* Team tab content */}
        {activeTab === 'team' && (
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
            {/* Sub-tabs: create / find */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--color-border, #E5E7EB)',
                padding: '0 8px',
              }}
            >
              <button onClick={() => setTeamTab('create')} style={teamTabStyle('create')}>
                <Plus size={16} />
                개설
              </button>
              <button onClick={() => setTeamTab('find')} style={teamTabStyle('find')}>
                <Search size={16} />
                찾기
              </button>
            </div>

            <div style={{ padding: '28px 32px', minHeight: 340 }}>
              {teamTab === 'create' ? (
                <WorkspaceCreator />
              ) : (
                <WorkspaceFinder userId={userId} userName={userName} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
