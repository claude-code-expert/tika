'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

const COLOR_SWATCHES = [
  '#629584',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#10B981',
];

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  initialDisplayName: string;
  initialColor: string;
  onSaved: (data: { displayName: string; color: string }) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  memberId,
  initialDisplayName,
  initialColor,
  onSaved,
}: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [color, setColor] = useState(initialColor);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const initials = displayName.slice(0, 2).toUpperCase() || '?';

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), color }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? '저장에 실패했습니다');
        return;
      }
      const data = await res.json();
      onSaved({ displayName: data.member.displayName, color: data.member.color });
      onClose();
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프로필 설정" maxWidth={400}>
      <div style={{ padding: '24px' }}>
        {/* Avatar Preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {initials}
          </div>
        </div>

        {/* Display Name Input */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="profile-display-name"
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 6,
            }}
          >
            이름 (이니셜)
          </label>
          <input
            id="profile-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            placeholder="이름을 입력하세요"
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
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Color Swatches */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 8,
            }}
          >
            색상
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: color === c ? '3px solid var(--color-text-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                  transition: 'border-color 0.15s, transform 0.15s',
                  transform: color === c ? 'scale(1.1)' : 'scale(1)',
                }}
                aria-label={`색상 ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
            onClick={handleSave}
            disabled={isSaving}
            style={{
              height: 36,
              padding: '0 16px',
              border: 'none',
              borderRadius: 6,
              background: 'var(--color-accent)',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
