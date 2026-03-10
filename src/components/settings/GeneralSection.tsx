'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from './types';
import type { Workspace } from '@/types/index';

const fieldInputStyle: React.CSSProperties = {
  flex: 1,
  height: 36,
  padding: '0 12px',
  border: '1px solid #DFE1E6',
  borderRadius: 6,
  fontFamily: "'Noto Sans KR', sans-serif",
  fontSize: 12,
  color: '#2C3E50',
  outline: 'none',
  background: '#fff',
};

export function GeneralSection({ showToast }: SectionProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconColor, setIconColor] = useState('#629584');
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmName, setResetConfirmName] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data: { workspaces?: Workspace[] }) => {
        const ws = data.workspaces?.[0] ?? null;
        if (ws) {
          setWorkspace(ws);
          setName(ws.name);
          setDescription(ws.description ?? '');
          setIconColor(ws.iconColor ?? '#629584');
        }
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (!workspace) return;
    if (!name.trim()) {
      showToast('프로젝트 이름을 입력하세요', 'fail');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, iconColor }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '저장 실패', 'fail');
        return;
      }
      showToast('프로젝트 정보가 저장되었습니다', 'success');
    } catch {
      showToast('저장 중 오류가 발생했습니다', 'fail');
    } finally {
      setSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!workspace || deleteConfirmName !== workspace.name) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: deleteConfirmName }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '삭제 실패', 'fail');
        return;
      }
      window.location.href = '/';
    } catch {
      showToast('삭제 중 오류가 발생했습니다', 'fail');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = async () => {
    if (!workspace || resetConfirmName !== workspace.name) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/reset`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: resetConfirmName }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '초기화 실패', 'fail');
        return;
      }
      showToast('데이터가 초기화되었습니다', 'success');
      setShowResetConfirm(false);
      setResetConfirmName('');
    } catch {
      showToast('초기화 중 오류가 발생했습니다', 'fail');
    } finally {
      setIsResetting(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #DFE1E6',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
  };

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: '#2C3E50' }}>
          일반 설정
        </h2>
      </div>
      <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 20, lineHeight: 1.6 }}>
        프로젝트의 기본 정보와 환경을 설정합니다.
      </p>

      {/* 프로젝트 정보 */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#E8F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#629584" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#2C3E50' }}>프로젝트 정보</span>
        </div>
        <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 16, lineHeight: 1.5 }}>프로젝트의 기본 식별 정보를 관리합니다.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ minWidth: 110, fontSize: 12, color: '#5A6B7F', fontWeight: 500, flexShrink: 0 }}>프로젝트 이름</span>
            <input
              style={fieldInputStyle}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="프로젝트 이름"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ minWidth: 110, fontSize: 12, color: '#5A6B7F', fontWeight: 500, flexShrink: 0, marginTop: 10 }}>프로젝트 설명</span>
            <textarea
              style={{ ...fieldInputStyle, height: 'auto', minHeight: 60, padding: '10px 12px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="프로젝트 설명"
            />
          </div>
          <div style={{ fontSize: 11, color: '#8993A4', marginTop: -4, paddingLeft: 122 }}>
            프로젝트 설명은 사이드바와 초대 이메일에 표시됩니다.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ minWidth: 110, fontSize: 12, color: '#5A6B7F', fontWeight: 500, flexShrink: 0 }}>아이콘 색상</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {['#629584', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#ffa8d3', '#c7c758', '#50bef0'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setIconColor(c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: iconColor === c ? '2px solid #2C3E50' : '2px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                    outline: 'none',
                    transition: 'border-color 0.15s, transform 0.15s',
                    transform: iconColor === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                  aria-label={`아이콘 색상 ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ height: 32, padding: '0 14px', borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', background: '#629584', color: '#fff', border: 'none', opacity: saving ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>



      {/* 위험 영역 */}
      <div style={{ border: '1px solid #FECACA', borderRadius: 8, padding: 20, background: '#FFFBFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#DC2626' }}>위험 영역</span>
        </div>
        {/* 데이터 초기화 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #FEE2E2', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#991B1B' }}>프로젝트 데이터 초기화</div>
            <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>모든 티켓, 라벨, 활동 내역이 삭제됩니다. 되돌릴 수 없습니다.</div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{ height: 32, padding: '0 14px', borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', border: '1px solid #FECACA', color: '#DC2626', display: 'inline-flex', alignItems: 'center' }}
          >
            초기화
          </button>
        </div>
        {/* 프로젝트 삭제 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#991B1B' }}>프로젝트 삭제</div>
            <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>프로젝트 및 관련 모든 데이터가 영구 삭제됩니다.</div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{ height: 32, padding: '0 14px', borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', border: '1px solid #FECACA', color: '#DC2626', display: 'inline-flex', alignItems: 'center' }}
          >
            삭제
          </button>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}
          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 800, color: '#2C3E50', marginBottom: 8 }}>워크스페이스 삭제</div>
            <p style={{ fontSize: 13, color: '#5A6B7F', marginBottom: 16 }}>
              이 작업은 되돌릴 수 없습니다. 삭제를 확인하려면 워크스페이스 이름{' '}
              <strong style={{ color: '#2C3E50' }}>{workspace?.name}</strong>을(를) 입력하세요.
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="워크스페이스 이름 입력"
              style={{ width: '100%', border: '1.5px solid #DFE1E6', borderRadius: 8, padding: '9px 12px', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }}
                style={{ padding: '9px 20px', border: '1.5px solid #DFE1E6', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer' }}
              >취소</button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmName !== workspace?.name}
                style={{
                  padding: '9px 20px', border: 'none', borderRadius: 8,
                  background: isDeleting || deleteConfirmName !== workspace?.name ? '#9BA8B4' : '#DC2626',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: isDeleting || deleteConfirmName !== workspace?.name ? 'not-allowed' : 'pointer',
                }}
              >{isDeleting ? '삭제 중...' : '삭제'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}
          onClick={() => { setShowResetConfirm(false); setResetConfirmName(''); }}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 800, color: '#2C3E50', marginBottom: 8 }}>데이터 초기화</div>
            <p style={{ fontSize: 13, color: '#5A6B7F', marginBottom: 16 }}>
              모든 티켓, 라벨, 스프린트가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.{' '}
              확인하려면 워크스페이스 이름 <strong style={{ color: '#2C3E50' }}>{workspace?.name}</strong>을(를) 입력하세요.
            </p>
            <input
              type="text"
              value={resetConfirmName}
              onChange={(e) => setResetConfirmName(e.target.value)}
              placeholder="워크스페이스 이름 입력"
              style={{ width: '100%', border: '1.5px solid #DFE1E6', borderRadius: 8, padding: '9px 12px', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { setShowResetConfirm(false); setResetConfirmName(''); }}
                style={{ padding: '9px 20px', border: '1.5px solid #DFE1E6', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer' }}
              >취소</button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting || resetConfirmName !== workspace?.name}
                style={{
                  padding: '9px 20px', border: 'none', borderRadius: 8,
                  background: isResetting || resetConfirmName !== workspace?.name ? '#9BA8B4' : '#F59E0B',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: isResetting || resetConfirmName !== workspace?.name ? 'not-allowed' : 'pointer',
                }}
              >{isResetting ? '초기화 중...' : '초기화'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
