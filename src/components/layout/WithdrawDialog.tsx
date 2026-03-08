'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Modal } from '@/components/ui/Modal';

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function WithdrawDialog({ isOpen, onClose, userEmail }: WithdrawDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isMatch = confirmEmail === userEmail;

  const handleWithdraw = async () => {
    if (!isMatch || isSubmitting) return;
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail }),
      });
      if (res.ok) {
        await signOut({ callbackUrl: '/login' });
        return;
      }
      const data = await res.json();
      setError(data.error?.message ?? '탈퇴 처리에 실패했습니다.');
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="계정 탈퇴" maxWidth={420}>
      <div style={{ padding: '20px 24px 24px' }}>
        {/* Warning */}
        <div
          style={{
            padding: '12px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, margin: '0 0 6px' }}>
            주의: 이 작업은 되돌릴 수 없습니다.
          </p>
          <p style={{ fontSize: 12, color: '#7F1D1D', margin: 0, lineHeight: 1.6 }}>
            탈퇴하면 계정 정보가 영구적으로 익명화되며, 동일한 계정으로 다시 로그인해도 기존 데이터를 복구할 수 없습니다.
          </p>
        </div>

        {/* Email confirmation */}
        <label
          htmlFor="withdraw-email"
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
          }}
        >
          확인을 위해 이메일을 입력하세요
        </label>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
          {userEmail}
        </p>
        <input
          id="withdraw-email"
          type="email"
          value={confirmEmail}
          onChange={(e) => { setConfirmEmail(e.target.value); setError(''); }}
          placeholder="이메일을 입력하세요"
          autoComplete="off"
          style={{
            width: '100%',
            height: 38,
            padding: '0 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'inherit',
            color: 'var(--color-text-primary)',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#DC2626')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isMatch) handleWithdraw();
          }}
        />

        {/* Error */}
        {error && (
          <p style={{ color: '#DC2626', fontSize: 13, marginTop: 8, marginBottom: 0 }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 36,
              padding: '0 16px',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: '#fff',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={!isMatch || isSubmitting}
            style={{
              height: 36,
              padding: '0 16px',
              border: 'none',
              borderRadius: 6,
              background: isMatch ? '#DC2626' : '#E5E7EB',
              fontSize: 13,
              fontWeight: 600,
              color: isMatch ? '#fff' : '#9CA3AF',
              cursor: isMatch && !isSubmitting ? 'pointer' : 'default',
              fontFamily: 'inherit',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? '처리 중...' : '탈퇴하기'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
