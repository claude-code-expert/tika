'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function WorkspaceCreator() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setError(null);

    if (!name.trim()) {
      setNameError('워크스페이스 이름을 입력해주세요.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name.trim())) {
      setNameError('영문, 숫자, -, _ 만 사용할 수 있습니다. 띄어쓰기는 허용되지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? '오류가 발생했습니다.');
      }

      router.push(`/workspace/${data.workspace.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label
          htmlFor="ws-name"
          style={{
            display: 'block',
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary, #2C3E50)',
            marginBottom: 6,
          }}
        >
          워크스페이스 이름 <span style={{ color: '#EF4444' }}>*</span>{' '}
          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--color-text-muted, #6B7280)' }}>(영문으로 입력하세요)</span>
        </label>
        <input
          id="ws-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
          maxLength={100}
          placeholder="예: marketing-team, dev_squad (영문·숫자·-·_ 사용 가능)"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: `1px solid ${nameError ? '#EF4444' : 'var(--color-border, #E5E7EB)'}`,
            borderRadius: 8,
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-primary, #2C3E50)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {nameError && (
          <p
            style={{
              marginTop: 4,
              fontSize: 12,
              color: '#EF4444',
              fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            }}
          >
            {nameError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="ws-description"
          style={{
            display: 'block',
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary, #2C3E50)',
            marginBottom: 6,
          }}
        >
          설명{' '}
          <span style={{ fontWeight: 400, color: 'var(--color-text-muted, #6B7280)' }}>
            (선택)
          </span>
        </label>
        <textarea
          id="ws-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="워크스페이스에 대해 간략히 설명해주세요"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid var(--color-border, #E5E7EB)',
            borderRadius: 8,
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-primary, #2C3E50)',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <p
          style={{
            fontSize: 14,
            color: '#EF4444',
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '12px 20px',
          background: loading ? 'var(--color-accent, #629584)' : 'var(--color-accent, #629584)',
          color: '#ffffff',
          border: 'none',
          borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          width: '100%',
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
            생성 중...
          </>
        ) : (
          '워크스페이스 만들기'
        )}
      </button>
    </form>
  );
}
