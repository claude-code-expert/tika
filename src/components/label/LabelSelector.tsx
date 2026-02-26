'use client';

import { useState } from 'react';
import type { Label } from '@/types/index';
import { LabelBadge } from './LabelBadge';
import { LABEL_MAX_PER_TICKET } from '@/lib/constants';

interface LabelSelectorProps {
  labels: Label[];
  selectedIds: number[];
  onToggle: (labelId: number) => void;
  onCreateLabel?: (name: string, color: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#2b7fff', '#00c950', '#ad46ff', '#fb2c36', '#ffac6d',
  '#615fff', '#f59e0b', '#10b981', '#ef4444', '#6366f1',
];

export function LabelSelector({ labels, selectedIds, onToggle, onCreateLabel }: LabelSelectorProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const isAtLimit = selectedIds.length >= LABEL_MAX_PER_TICKET;

  const handleCreate = async () => {
    if (!newName.trim() || !onCreateLabel) return;
    setIsCreating(true);
    try {
      await onCreateLabel(newName.trim(), newColor);
      setNewName('');
      setShowCreate(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {isAtLimit && (
        <p style={{ fontSize: 11, color: '#C2410C' }}>
          최대 {LABEL_MAX_PER_TICKET}개까지 선택 가능합니다
        </p>
      )}

      <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {labels.map((label) => {
          const isSelected = selectedIds.includes(label.id);
          return (
            <label
              key={label.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(label.id)}
                disabled={!isSelected && isAtLimit}
                style={{
                  width: 14,
                  height: 14,
                  accentColor: 'var(--color-accent)',
                  cursor: 'pointer',
                }}
              />
              <LabelBadge label={label} size="sm" />
            </label>
          );
        })}
      </div>

      {onCreateLabel && (
        <div>
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                height: 20,
                padding: '0 10px',
                border: '1px dashed var(--color-border-hover)',
                borderRadius: 20,
                background: 'transparent',
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)';
                (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)';
                (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
              }}
            >
              + 새 라벨 만들기
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                padding: 8,
              }}
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="라벨명"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--color-accent)'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--color-border)'; }}
                aria-label="새 라벨명"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: newColor === color ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                      outline: newColor === color ? '2px solid white' : 'none',
                      outlineOffset: -3,
                      cursor: 'pointer',
                    }}
                    aria-label={`색상 선택: ${color}`}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                  style={{
                    borderRadius: 4,
                    background: 'var(--color-accent)',
                    padding: '2px 10px',
                    fontSize: 11,
                    color: '#fff',
                    border: 'none',
                    cursor: !newName.trim() || isCreating ? 'not-allowed' : 'pointer',
                    opacity: !newName.trim() || isCreating ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  생성
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
