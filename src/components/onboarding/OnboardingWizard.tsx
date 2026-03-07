'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, Building2 } from 'lucide-react';

interface OnboardingWizardProps {
  userId: string;
  userName: string;
}

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  isLoading: boolean;
  isActive: boolean;
  onClick: () => void;
}

function OptionCard({ icon, title, description, features, isLoading, isActive, onClick }: OptionCardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: `2px solid ${isActive ? 'var(--color-accent, #629584)' : 'var(--color-border, #E5E7EB)'}`,
        borderRadius: 12,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flex: '1 1 260px',
        maxWidth: 340,
        boxShadow: isActive ? '0 4px 16px rgba(98,149,132,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: isLoading ? 'not-allowed' : 'default',
        opacity: isLoading && !isActive ? 0.5 : 1,
      }}
    >
      <div style={{ color: 'var(--color-accent, #629584)' }}>{icon}</div>
      <div>
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-text-primary, #2C3E50)',
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-muted, #6B7280)',
            margin: '6px 0 0',
          }}
        >
          {description}
        </p>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {features.map((f) => (
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
        ))}
      </ul>
      <button
        onClick={onClick}
        disabled={isLoading}
        style={{
          marginTop: 8,
          padding: '10px 20px',
          background: 'var(--color-accent, #629584)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
          transition: 'opacity 0.15s',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading && isActive ? (
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
          <>시작하기 →</>
        )}
      </button>
    </div>
  );
}

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState<'USER' | 'WORKSPACE' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (userType: 'USER' | 'WORKSPACE') => {
    if (loading) return;
    setLoading(userType);
    setError(null);

    try {
      const res = await fetch('/api/users/type', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? '오류가 발생했습니다.');
      }

      // Refresh JWT so userType is updated in the session
      await update();

      router.push(userType === 'USER' ? '/' : '/onboarding/workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
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
        {/* Logo area */}
        <div style={{ marginBottom: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/tika-logo-combo.png" alt="Tika" style={{ height: 40, objectFit: 'contain' }} />
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--color-text-primary, #2C3E50)',
              margin: 0,
            }}
          >
            👋 {userName}님, Tika에 오신 것을 환영합니다!
          </h1>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 16,
              color: 'var(--color-text-muted, #6B7280)',
              marginTop: 10,
            }}
          >
            어떤 방식으로 사용하실 건가요?
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 760,
            width: '100%',
          }}
        >
          <OptionCard
            icon={<User size={32} />}
            title="개인용"
            description="나 혼자 사용하는 칸반 보드"
            features={['개인 칸반 보드', '총 300개의 티켓 생성 가능', 'Goal > Story > Feature > Task 4단계 이슈 생성']}
            isLoading={loading !== null}
            isActive={loading === 'USER'}
            onClick={() => handleSelect('USER')}
          />
          <OptionCard
            icon={<Building2 size={32} />}
            title="워크스페이스"
            description="팀과 함께 협업하는 공간"
            features={['멤버 초대 & 협업', '개인과 분리되는 팀 워크스페이스 제공', '번다운, 간트 차트, 팀 WBS 차트 및 통합 대시보드']}
            isLoading={loading !== null}
            isActive={loading === 'WORKSPACE'}
            onClick={() => handleSelect('WORKSPACE')}
          />
        </div>

        {error && (
          <p
            style={{
              marginTop: 24,
              color: '#EF4444',
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 14,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </>
  );
}
