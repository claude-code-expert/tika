'use client';

import Image from 'next/image';
import { useState } from 'react';

const SUBJECTS = [
  { value: 'enterprise', label: 'Enterprise 도입 문의' },
  { value: 'pro', label: 'Team Pro 출시 문의' },
  { value: 'partnership', label: '파트너십 / 제휴' },
  { value: 'feature', label: '기능 요청' },
  { value: 'bug', label: '버그 제보' },
  { value: 'other', label: '기타 문의' },
];

interface FormState {
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

interface ContactModalProps {
  defaultSubject?: string;
  triggerClassName?: string;
  triggerLabel?: string;
}

export function ContactModal({
  defaultSubject = 'enterprise',
  triggerClassName,
  triggerLabel = '도입 문의하기',
}: ContactModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    email: '',
    phone: '',
    subject: defaultSubject,
    message: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    setForm({ email: '', phone: '', subject: defaultSubject, message: '' });
  };

  const defaultTriggerClass =
    'mb-5 w-full cursor-pointer rounded-lg border-[1.5px] border-[#2C3E50] bg-[#2C3E50] px-2.5 py-2.5 text-center text-[13px] font-bold text-white transition-all hover:bg-[#1a2530]';

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
              maxWidth: 480,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
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
                  문의가 접수되었습니다
                </div>
                <div style={{ fontSize: 13, color: '#5A6B7F', marginBottom: 24 }}>
                  빠른 시일 내에 답변 드리겠습니다.
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
                    문의하기
                  </div>
                  <div style={{ fontSize: 12, color: '#5A6B7F' }}>
                    문의 내용을 남겨주시면 검토 후 연락드리겠습니다.
                  </div>
                </div>

                {/* Email */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="contact-email"
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
                    id="contact-email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    style={{
                      width: '100%',
                      border: '1.5px solid #DFE1E6',
                      borderRadius: 8,
                      padding: '9px 12px',
                      fontSize: 13,
                      color: '#2C3E50',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Phone */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="contact-phone"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#2C3E50',
                      marginBottom: 5,
                    }}
                  >
                    연락처 <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    required
                    placeholder="010-0000-0000"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      border: '1.5px solid #DFE1E6',
                      borderRadius: 8,
                      padding: '9px 12px',
                      fontSize: 13,
                      color: '#2C3E50',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    htmlFor="contact-subject"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#2C3E50',
                      marginBottom: 5,
                    }}
                  >
                    문의 유형 <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    id="contact-subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    style={{
                      width: '100%',
                      border: '1.5px solid #DFE1E6',
                      borderRadius: 8,
                      padding: '9px 12px',
                      fontSize: 13,
                      color: '#2C3E50',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#fff',
                    }}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div style={{ marginBottom: 18 }}>
                  <label
                    htmlFor="contact-message"
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#2C3E50',
                      marginBottom: 5,
                    }}
                  >
                    내용 <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    minLength={10}
                    placeholder="문의 내용을 자유롭게 적어주세요. (최소 10자)"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    rows={4}
                    style={{
                      width: '100%',
                      border: '1.5px solid #DFE1E6',
                      borderRadius: 8,
                      padding: '9px 12px',
                      fontSize: 13,
                      color: '#2C3E50',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
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
                    background: status === 'loading' ? '#9BA8B4' : '#629584',
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
                  {status === 'loading' ? '전송 중...' : '문의 보내기'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
