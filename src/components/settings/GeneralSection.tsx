'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from './SettingsShell';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data: { workspaces?: Workspace[] }) => {
        const ws = data.workspaces?.[0] ?? null;
        if (ws) {
          setWorkspace(ws);
          setName(ws.name);
          setDescription(ws.description ?? '');
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
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
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

      {/* 환경 설정 */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={12} cy={12} r={10} />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#2C3E50' }}>환경 설정</span>
        </div>
        <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 16, lineHeight: 1.5 }}>시간대, 언어, 날짜 형식 등 프로젝트의 환경 설정을 관리합니다.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {[
            { label: '시간대', defaultValue: 'Asia/Seoul (UTC+9)', options: ['Asia/Seoul (UTC+9)', 'Asia/Tokyo (UTC+9)', 'America/New_York (UTC-5)', 'America/Los_Angeles (UTC-8)', 'Europe/London (UTC+0)'] },
            { label: '언어', defaultValue: '한국어', options: ['한국어', 'English', '日本語'] },
            { label: '날짜 형식', defaultValue: 'YYYY-MM-DD', options: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY'] },
            { label: '주간 시작일', defaultValue: '월요일', options: ['월요일', '일요일'] },
          ].map(({ label, options }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ minWidth: 110, fontSize: 12, color: '#5A6B7F', fontWeight: 500, flexShrink: 0 }}>{label}</span>
              <select style={{ ...fieldInputStyle, cursor: 'pointer' }}>
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => showToast('환경 설정이 저장되었습니다', 'success')}
            style={{ height: 32, padding: '0 14px', borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#629584', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            저장
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
        {[
          { label: '프로젝트 데이터 초기화', desc: '모든 티켓, 라벨, 활동 내역이 삭제됩니다. 되돌릴 수 없습니다.', btn: '초기화' },
          { label: '프로젝트 삭제', desc: '프로젝트 및 관련 모든 데이터가 영구 삭제됩니다.', btn: '삭제' },
        ].map(({ label, desc, btn }, i, arr) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #FEE2E2' : 'none', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#991B1B' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>{desc}</div>
            </div>
            <button
              onClick={() => showToast('이 기능은 아직 구현 중입니다', 'info')}
              style={{ height: 32, padding: '0 14px', borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', border: '1px solid #FECACA', color: '#DC2626', display: 'inline-flex', alignItems: 'center' }}
            >
              {btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
