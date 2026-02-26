'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChecklistItem } from '@/types/index';
import { CHECKLIST_MAX_ITEMS } from '@/lib/constants';

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onAdd: (text: string) => Promise<void>;
  onToggle: (itemId: number, isCompleted: boolean) => Promise<void>;
  onDelete: (itemId: number) => Promise<void>;
}

export function ChecklistSection({ items, onAdd, onToggle, onDelete }: ChecklistSectionProps) {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = items.filter((i) => i.isCompleted).length;
  const isAtLimit = items.length >= CHECKLIST_MAX_ITEMS;
  const progressPct = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setIsAdding(true);
    try {
      await onAdd(newText.trim());
      setNewText('');
      inputRef.current?.focus();
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ☑ 체크리스트
          {items.length > 0 && (
            <span
              style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400 }}
            >
              {completedCount} / {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div
          style={{
            height: 4,
            background: 'var(--color-border)',
            borderRadius: 2,
            marginBottom: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'var(--color-accent)',
              borderRadius: 2,
              width: `${progressPct}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 10px',
              borderRadius: 6,
              background: hoveredId === item.id ? 'var(--color-board-bg)' : 'transparent',
              transition: 'background 0.1s',
            }}
          >
            <input
              type="checkbox"
              checked={item.isCompleted}
              onChange={(e) => onToggle(item.id, e.target.checked)}
              style={{
                width: 15,
                height: 15,
                accentColor: 'var(--color-accent)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label={item.text}
            />
            <span
              style={{
                flex: 1,
                fontSize: 13,
                color: item.isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                lineHeight: 1.4,
                textDecoration: item.isCompleted ? 'line-through' : 'none',
              }}
            >
              {item.text}
            </span>
            <button
              onClick={() => onDelete(item.id)}
              style={{
                width: 22,
                height: 22,
                border: 'none',
                background: 'transparent',
                borderRadius: 4,
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: hoveredId === item.id ? 1 : 0,
                transition: 'opacity 0.1s, background 0.1s, color 0.1s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FEE2E2';
                (e.currentTarget as HTMLElement).style.color = '#DC2626';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
              }}
              aria-label="항목 삭제"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add input */}
      {!isAtLimit ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="새 항목 입력..."
            maxLength={200}
            style={{
              flex: 1,
              padding: '6px 10px',
              border: '1.5px dashed var(--color-border-hover)',
              borderRadius: 5,
              fontSize: 13,
              fontFamily: 'inherit',
              color: 'var(--color-text-primary)',
              background: '#fff',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-accent)';
              e.target.style.borderStyle = 'solid';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border-hover)';
              e.target.style.borderStyle = 'dashed';
            }}
            disabled={isAdding}
            aria-label="새 체크리스트 항목"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim() || isAdding}
            style={{
              padding: '6px 12px',
              background: 'var(--color-board-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              cursor: newText.trim() && !isAdding ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              opacity: !newText.trim() || isAdding ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (newText.trim() && !isAdding) {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)';
                (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
            }}
          >
            + 추가
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
          최대 {CHECKLIST_MAX_ITEMS}개 제한
        </p>
      )}
    </div>
  );
}
