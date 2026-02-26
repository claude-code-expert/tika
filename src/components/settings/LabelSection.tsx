'use client';

import { useState, useEffect, useRef } from 'react';
import type { SectionProps } from './types';
import type { LabelWithCount } from '@/types/index';

const PALETTE = [
  '#fb2c36', '#615fff', '#00c950', '#2b7fff', '#ad46ff', '#ff29d3',
  '#a0628c', '#89d0f0', '#71e4bf', '#46e264', '#caee68', '#fffe92',
  '#ffac6d', '#f7d1d1', '#f7a2ff', '#c1d1ff', '#c5dbdc',
];

function hexLum(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
function labelTextColor(bg: string): string {
  return hexLum(bg) > 160 ? '#333' : '#fff';
}

function ColorSwatches({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {PALETTE.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          style={{
            width: 18, height: 18, borderRadius: '50%', background: c, flexShrink: 0,
            border: c === selected ? '2px solid #2C3E50' : '2px solid transparent',
            cursor: 'pointer', padding: 0,
            transform: c === selected ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.1s, border-color 0.1s',
          }}
          aria-label={c}
        />
      ))}
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,.2)', padding: 24, maxWidth: 380, width: '90%' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#5A6B7F', lineHeight: 1.6, marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', border: '1px solid #DFE1E6', color: '#5A6B7F' }}>취소</button>
          <button onClick={onConfirm} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', border: '1px solid #FECACA', color: '#DC2626' }}>삭제</button>
        </div>
      </div>
    </div>
  );
}

export function LabelSection({ showToast }: SectionProps) {
  const [labels, setLabels] = useState<LabelWithCount[]>([]);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[3]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(PALETTE[0]);
  const [confirmDelete, setConfirmDelete] = useState<LabelWithCount | null>(null);
  const newNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLabels();
  }, []);

  async function fetchLabels() {
    try {
      const res = await fetch('/api/labels');
      const data = (await res.json()) as { labels?: LabelWithCount[] };
      setLabels(data.labels ?? []);
    } catch {
      // ignore
    }
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) { showToast('라벨 이름을 입력하세요', 'fail'); return; }
    if (labels.length >= 20) { showToast('최대 20개까지 생성 가능합니다', 'fail'); return; }
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: newColor }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '추가 실패', 'fail');
        return;
      }
      await fetchLabels();
      setNewName('');
      setCreatorOpen(false);
      showToast(`"${name}" 라벨이 추가되었습니다`, 'success');
    } catch {
      showToast('추가 중 오류가 발생했습니다', 'fail');
    }
  }

  async function handleSaveEdit() {
    if (editingId === null) return;
    const name = editName.trim();
    if (!name) { showToast('라벨 이름을 입력하세요', 'fail'); return; }
    try {
      const res = await fetch(`/api/labels/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: editColor }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '수정 실패', 'fail');
        return;
      }
      await fetchLabels();
      setEditingId(null);
      showToast('라벨이 수정되었습니다', 'success');
    } catch {
      showToast('수정 중 오류가 발생했습니다', 'fail');
    }
  }

  async function handleDelete(label: LabelWithCount) {
    try {
      await fetch(`/api/labels/${label.id}`, { method: 'DELETE' });
      await fetchLabels();
      setConfirmDelete(null);
      showToast(`"${label.name}" 라벨이 삭제되었습니다`, 'success');
    } catch {
      showToast('삭제 중 오류가 발생했습니다', 'fail');
    }
  }

  function startEdit(label: LabelWithCount) {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  }

  const leInput: React.CSSProperties = {
    height: 30, padding: '0 8px', border: '1px solid #DFE1E6', borderRadius: 4,
    fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, outline: 'none', background: '#fff', color: '#2C3E50',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: '#2C3E50', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          라벨 관리
          <span style={{ fontSize: 12, fontWeight: 400, color: '#8993A4' }}>({labels.length}/20)</span>
        </h2>
        <button
          onClick={() => { setCreatorOpen((v) => !v); setTimeout(() => newNameRef.current?.focus(), 50); }}
          style={{ height: 32, padding: '0 14px', borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#629584', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> 새 라벨 추가
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 20, lineHeight: 1.6 }}>
        티켓에 사용할 라벨을 관리합니다. 최대 20개까지 생성할 수 있으며, 라벨 삭제 시 연결된 티켓에서 자동으로 제거됩니다.
      </p>

      {/* Creator */}
      {creatorOpen && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 14, background: '#F1F3F6', border: '1px dashed #C4C9D1', borderRadius: 8, marginBottom: 12 }}>
          <input
            ref={newNameRef}
            style={{ ...leInput, width: 140 }}
            type="text"
            placeholder="라벨 이름"
            maxLength={20}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setCreatorOpen(false); }}
          />
          <ColorSwatches selected={newColor} onSelect={setNewColor} />
          {newName.trim() && (
            <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 11, fontSize: 11, fontWeight: 500, background: newColor, color: labelTextColor(newColor) }}>
              {newName.trim()}
            </span>
          )}
          <button onClick={handleAdd} style={{ ...leInput, height: 30, padding: '0 12px', cursor: 'pointer', background: '#629584', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500 }}>추가</button>
          <button onClick={() => setCreatorOpen(false)} style={{ ...leInput, height: 30, padding: '0 8px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#8993A4' }}>취소</button>
        </div>
      )}

      {/* Label List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {labels.map((label) => {
          const tc = labelTextColor(label.color);
          if (editingId === label.id) {
            return (
              <div key={label.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#E8F5F0', border: '2px solid #629584', borderRadius: 6 }}>
                <input
                  autoFocus
                  style={{ ...leInput, width: 140 }}
                  type="text"
                  maxLength={20}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                />
                <ColorSwatches selected={editColor} onSelect={setEditColor} />
                <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 11, fontSize: 11, fontWeight: 500, background: editColor, color: labelTextColor(editColor) }}>
                  {editName || '미리보기'}
                </span>
                <button onClick={handleSaveEdit} style={{ height: 28, padding: '0 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: '#629584', color: '#fff', border: 'none' }}>저장</button>
                <button onClick={() => setEditingId(null)} style={{ height: 28, padding: '0 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', background: 'transparent', border: 'none', color: '#8993A4' }}>취소</button>
              </div>
            );
          }
          return (
            <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: label.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 11, fontSize: 11, fontWeight: 500, background: label.color, color: tc, flexShrink: 0 }}>
                {label.name}
              </span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, minWidth: 0 }}>{label.name}</span>
              <span style={{ fontSize: 11, color: '#8993A4', fontFamily: 'monospace', minWidth: 60 }}>{label.color}</span>
              <span style={{ fontSize: 11, color: '#8993A4', whiteSpace: 'nowrap' }}>{label.ticketCount}개 티켓</span>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button onClick={() => startEdit(label)} title="편집" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 4, color: '#8993A4', cursor: 'pointer' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                  </svg>
                </button>
                <button onClick={() => setConfirmDelete(label)} title="삭제" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 4, color: '#8993A4', cursor: 'pointer' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
        {labels.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: '#8993A4' }}>
            아직 라벨이 없습니다. 새 라벨을 추가해보세요.
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="라벨 삭제"
          message={`"${confirmDelete.name}" 라벨을 삭제하시겠습니까?\n이 라벨이 적용된 ${confirmDelete.ticketCount}개 티켓에서 자동으로 제거됩니다.`}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
