'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, Building2, Check } from 'lucide-react';

interface OnboardingWizardProps {
  userId: string;
  userName: string;
}

type Step = 1 | 2;

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { label: '개인 워크스페이스' },
    { label: '팀 워크스페이스 (선택)' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 40,
      }}
    >
      {steps.map((s, i) => {
        const idx = i + 1;
        const isDone = idx < step;
        const isActive = idx === step;
        return (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isDone
                    ? 'var(--color-accent, #629584)'
                    : isActive
                      ? 'var(--color-accent, #629584)'
                      : '#E5E7EB',
                  color: isDone || isActive ? '#fff' : '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  transition: 'background 0.2s',
                }}
              >
                {isDone ? <Check size={16} /> : idx}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  color: isActive ? 'var(--color-accent, #629584)' : isDone ? '#374151' : '#9CA3AF',
                  fontWeight: isActive ? 700 : 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 80,
                  height: 2,
                  background: isDone ? 'var(--color-accent, #629584)' : '#E5E7EB',
                  margin: '0 8px',
                  marginBottom: 24,
                  transition: 'background 0.2s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPersonalWorkspace = async () => {
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
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const goToTeamWorkspace = () => {
    router.push('/onboarding/workspace');
  };

  const goToPersonalBoard = () => {
    router.push('/');
  };

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
        <div style={{ marginBottom: 48 }}>
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
            {step === 1 ? `👋 ${userName}님, Tika에 오신 것을 환영합니다!` : '팀 워크스페이스를 만드시겠어요?'}
          </h1>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
              fontSize: 16,
              color: 'var(--color-text-muted, #6B7280)',
              marginTop: 10,
            }}
          >
            {step === 1
              ? '먼저 개인 워크스페이스를 생성합니다.'
              : '개인 워크스페이스가 생성되었습니다. 팀 협업 공간도 만들어 보세요.'}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Step 1 content */}
        {step === 1 && (
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
              개인 워크스페이스
            </h2>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                fontSize: 14,
                color: 'var(--color-text-muted, #6B7280)',
                margin: '0 0 20px',
              }}
            >
              나 혼자 사용하는 칸반 보드
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['개인 칸반 보드', '총 300개의 티켓 생성 가능', 'Goal > Story > Feature > Task 4단계 이슈 생성'].map((f) => (
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
              onClick={createPersonalWorkspace}
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
                <>개인 워크스페이스 생성하기 →</>
              )}
            </button>
          </div>
        )}

        {/* Step 2 content */}
        {step === 2 && (
          <div
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: 720,
              width: '100%',
            }}
          >
            {/* Skip card */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid var(--color-border, #E5E7EB)',
                borderRadius: 12,
                padding: '28px 24px',
                flex: '1 1 260px',
                maxWidth: 320,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ color: '#9CA3AF', marginBottom: 14 }}>
                  <User size={28} />
                </div>
                <h2
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #2C3E50)',
                    margin: '0 0 6px',
                  }}
                >
                  개인 보드로 시작
                </h2>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                    fontSize: 13,
                    color: 'var(--color-text-muted, #6B7280)',
                    margin: '0 0 16px',
                  }}
                >
                  지금 바로 개인 보드에서 작업을 시작합니다. 팀 워크스페이스는 언제든지 나중에 만들 수 있습니다.
                </p>
              </div>
              <button
                onClick={goToPersonalBoard}
                style={{
                  width: '100%',
                  padding: '9px 16px',
                  background: 'transparent',
                  color: 'var(--color-text-muted, #6B7280)',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                개인 보드로 바로 시작
              </button>
            </div>

            {/* Team workspace card */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid var(--color-border, #E5E7EB)',
                borderRadius: 12,
                padding: '28px 24px',
                flex: '1 1 260px',
                maxWidth: 320,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ color: 'var(--color-accent, #629584)', marginBottom: 14 }}>
                <Building2 size={28} />
              </div>
              <h2
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #2C3E50)',
                  margin: '0 0 6px',
                }}
              >
                팀 워크스페이스 만들기
              </h2>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  fontSize: 13,
                  color: 'var(--color-text-muted, #6B7280)',
                  margin: '0 0 16px',
                }}
              >
                팀과 함께 협업하는 공간
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['멤버 초대 & 협업', '팀 전용 대시보드', '번다운, 간트 차트 제공'].map((f) => (
                  <li
                    key={f}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                      fontSize: 12,
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
                onClick={goToTeamWorkspace}
                style={{
                  width: '100%',
                  padding: '9px 16px',
                  background: 'var(--color-accent, #629584)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                팀 워크스페이스 만들기 →
              </button>
            </div>
          </div>
        )}

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
