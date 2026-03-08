'use client';

import Image from 'next/image';
import { useState } from 'react';

interface NotifyModalProps {
  type: string;
  triggerClassName?: string;
  triggerLabel?: string;
  modalTitle?: string;
  modalDescription?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function NotifyModal({
  type,
  triggerClassName,
  triggerLabel = '출시 알림 받기',
  modalTitle = '출시 알림 신청',
  modalDescription = '출시 시 이메일로 가장 먼저 알려드립니다.',
}: NotifyModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/notifications/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? '전송에 실패했습니다.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setStatus('error');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStatus('idle');
    setErrorMsg('');
    setEmail('');
  };

  const defaultTriggerClass =
    'mb-5 w-full cursor-pointer rounded-lg border-[1.5px] border-[#BFDBFE] bg-[#DBEAFE] px-2.5 py-2.5 text-center text-[13px] font-bold text-[#1D4ED8] transition-all hover:bg-[#BFDBFE]';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? defaultTriggerClass}
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}
          onClick={handleClose}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '32px 28px',
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="닫기"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#5A6B7F',
                fontSize: 20,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ✕
            </button>

            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Image
                  src="/images/icon/tika-logo-header@2x.png"
                  alt="Tika"
                  width={60}
                  height={60}
                  style={{ margin: '0 auto 12px' }}
                />
                <div
                  style={{ fontSize: 17, fontWeight: 700, color: '#2C3E50', marginBottom: 8 }}
                >
                  신청이 완료되었습니다!
                </div>
                <div style={{ fontSize: 13, color: '#5A6B7F', marginBottom: 24 }}>
                  출시 시 가장 먼저 알려드릴게요.
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: '#629584',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 28px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{ fontSize: 17, fontWeight: 800, color: '#2C3E50', marginBottom: 4 }}
                  >
                    {modalTitle}
                  </div>
                  <div style={{ fontSize: 12, color: '#5A6B7F' }}>{modalDescription}</div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="notify-email"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#2C3E50',
                      marginBottom: 5,
                    }}
                  >
                    이메일 <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    id="notify-email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1.5px solid #DFE1E6',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 13,
                      color: '#2C3E50',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {errorMsg && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#DC2626',
                      marginBottom: 12,
                      padding: '8px 12px',
                      background: '#FEF2F2',
                      borderRadius: 6,
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    width: '100%',
                    background: status === 'loading' ? '#9BA8B4' : '#1D4ED8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '11px 0',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {status === 'loading' ? '신청 중...' : '알림 신청하기'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
