'use client';

import { useState } from 'react';

interface Workspace {
  id: number;
  name: string;
  type: string;
  iconColor?: string | null;
}

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}

export function CreateTeamModal({ isOpen, onClose, onCreated }: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    setError('');
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        setError(data.error?.message ?? '팀 생성에 실패했습니다');
        return;
      }
      const data = (await res.json()) as { workspace: Workspace };
      setName('');
      setDescription('');
      onCreated(data.workspace);
      onClose();
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: '32px 28px',
          width: '100%', maxWidth: 440,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)', position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute', top: 16, right: 16, background: 'none',
            border: 'none', cursor: 'pointer', color: '#5A6B7F', fontSize: 20, lineHeight: 1, padding: 4,
          }}
        >✕</button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#2C3E50', marginBottom: 4 }}>새 팀 만들기</div>
          <div style={{ fontSize: 12, color: '#5A6B7F' }}>팀 워크스페이스는 최대 3개까지 생성할 수 있습니다.</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="team-name" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2C3E50', marginBottom: 5 }}>
              팀 이름 <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="team-name"
              type="text"
              required
              maxLength={50}
              placeholder="팀 이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%', border: '1.5px solid #DFE1E6', borderRadius: 8,
                padding: '9px 12px', fontSize: 13, color: '#2C3E50', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="team-desc" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2C3E50', marginBottom: 5 }}>
              설명 <span style={{ color: '#5A6B7F', fontWeight: 400 }}>(선택)</span>
            </label>
            <textarea
              id="team-desc"
              maxLength={200}
              placeholder="팀에 대한 간단한 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                width: '100%', border: '1.5px solid #DFE1E6', borderRadius: 8,
                padding: '9px 12px', fontSize: 13, color: '#2C3E50', outline: 'none',
                resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 12, padding: '8px 12px', background: '#FEF2F2', borderRadius: 6 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating || !name.trim()}
            style={{
              width: '100%', background: isCreating || !name.trim() ? '#9BA8B4' : '#629584',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '11px 0', fontSize: 14, fontWeight: 700,
              cursor: isCreating || !name.trim() ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
            }}
          >
            {isCreating ? '생성 중...' : '팀 만들기'}
          </button>
        </form>
      </div>
    </div>
  );
}
