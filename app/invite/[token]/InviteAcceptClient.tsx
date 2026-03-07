'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface InviteAcceptClientProps {
  token: string;
  isLoggedIn: boolean;
  userEmail: string | null;
}

export function InviteAcceptClient({ token, isLoggedIn, userEmail }: InviteAcceptClientProps) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setState('loading');
    setError(null);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' });
      const data = (await res.json()) as { workspaceId?: number; error?: { code?: string; message: string } };
      if (!res.ok) {
        setError(data.error?.message ?? '수락에 실패했습니다');
        setState('idle');
        return;
      }
      setState('done');
      router.push(`/team/${data.workspaceId}`);
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      setState('idle');
    }
  }

  async function handleReject() {
    setState('loading');
    setError(null);
    try {
      await fetch(`/api/invites/${token}/reject`, { method: 'POST' });
      router.push('/login');
    } catch {
      setState('idle');
    }
  }

  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 16 }}>
          초대를 수락하려면 Google 계정으로 로그인해야 합니다.
        </p>
        <button
          onClick={() => signIn('google', { callbackUrl: `/invite/${token}` })}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            width: '100%', height: 44,
            background: '#fff', border: '1px solid #DFE1E6',
            borderRadius: 8, fontSize: 14, fontWeight: 500,
            color: '#2C3E50', cursor: 'pointer', justifyContent: 'center',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 로그인하여 수락
        </button>
      </div>
    );
  }

  if (userEmail) {
    return (
      <div>
        <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 16, textAlign: 'center' }}>
          {userEmail} 계정으로 로그인되어 있습니다.
        </p>
        {error && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 6, padding: '10px 14px', fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleReject}
            disabled={state !== 'idle'}
            style={{
              flex: 1, height: 44,
              background: '#fff', border: '1px solid #DFE1E6',
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: '#5A6B7F', cursor: state !== 'idle' ? 'not-allowed' : 'pointer',
              opacity: state !== 'idle' ? 0.6 : 1,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            거절
          </button>
          <button
            onClick={handleAccept}
            disabled={state !== 'idle'}
            style={{
              flex: 2, height: 44,
              background: '#629584', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: '#fff', cursor: state !== 'idle' ? 'not-allowed' : 'pointer',
              opacity: state !== 'idle' ? 0.7 : 1,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {state === 'loading' ? '처리 중...' : '초대 수락'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
