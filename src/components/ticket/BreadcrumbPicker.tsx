'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import type { Ticket } from '@/types/index';

// Ancestor type hierarchy per ticket type (outermost → innermost / direct parent)
export const ANCESTOR_TYPES_MAP: Record<string, readonly string[]> = {
  TASK:    ['GOAL', 'STORY', 'FEATURE'],
  FEATURE: ['GOAL', 'STORY'],
  STORY:   ['GOAL'],
  GOAL:    [],
};

const TYPE_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  GOAL:    { bg: '#EDE9FE', color: '#6D28D9' },
  STORY:   { bg: '#DBEAFE', color: '#1D4ED8' },
  FEATURE: { bg: '#D1FAE5', color: '#065F46' },
  TASK:    { bg: '#FEF3C7', color: '#92400E' },
};

export interface BreadcrumbPickerProps {
  /** The type of the ticket being edited (determines which ancestor levels to show) */
  ticketType: string;
  /** Current parentId of the ticket */
  parentId: number | null;
  /** Already-resolved parent object (used as fallback before allParents loads) */
  parent?: { id: number; title: string; type: string; parentId?: number | null } | null;
  /** Full list of potential ancestor tickets (GOAL / STORY / FEATURE) */
  allParents: Ticket[];
  /** Called whenever the effective selected parentId changes */
  onChange: (parentId: number | null) => void;
}

export function BreadcrumbPicker({
  ticketType,
  parentId,
  parent,
  allParents,
  onChange,
}: BreadcrumbPickerProps) {
  const ancestorTypes = ANCESTOR_TYPES_MAP[ticketType] ?? [];

  // chainIds[i] = selected ticket id at ancestor level i (null = not selected)
  const [chainIds, setChainIds] = useState<(number | null)[]>(() => {
    const levels = ancestorTypes.length;
    const chain: (number | null)[] = Array(levels).fill(null);
    // Place parentId at the slot matching the parent's actual type (if known via `parent` prop)
    if (parentId && parent) {
      const idx = ancestorTypes.indexOf(parent.type);
      if (idx !== -1) chain[idx] = parentId;
    } else if (parentId) {
      chain[levels - 1] = parentId; // fallback before parent prop loads
    }
    return chain;
  });

  const [pickerOpenLevel, setPickerOpenLevel] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const breadcrumbBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const breadcrumbPickerRef = useRef<HTMLDivElement | null>(null);

  // When allParents loads, traverse ancestor chain and place each ticket at its type-correct slot
  useEffect(() => {
    if (!allParents.length) return;
    const chain: (number | null)[] = Array(ancestorTypes.length).fill(null);
    let id: number | null = parentId ?? null;
    while (id !== null) {
      const p = allParents.find((t) => t.id === id);
      if (!p) break;
      const idx = ancestorTypes.indexOf(p.type);
      if (idx !== -1) chain[idx] = p.id;
      id = p.parentId ?? null;
    }
    setChainIds(chain);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allParents]);

  // Outside click: close picker (exclude breadcrumb buttons themselves)
  useEffect(() => {
    if (pickerOpenLevel === null) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOnDropdown = breadcrumbPickerRef.current?.contains(target);
      const isOnBtn = breadcrumbBtnRefs.current.some((btn) => btn?.contains(target));
      if (!isOnDropdown && !isOnBtn) {
        setPickerOpenLevel(null);
        setDropdownPos(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpenLevel]);

  const handleChainSelect = (levelIdx: number, selectedId: number) => {
    const newChain: (number | null)[] = Array(ancestorTypes.length).fill(null);
    newChain[levelIdx] = selectedId;

    // Propagate upward: auto-fill ancestor levels from the selected item's parent chain
    let cur = allParents.find((t) => t.id === selectedId);
    for (let i = levelIdx - 1; i >= 0 && cur?.parentId; i--) {
      const p = allParents.find((t) => t.id === cur!.parentId);
      if (!p) break;
      newChain[i] = p.id;
      cur = p;
    }

    // Preserve levels below if still valid (their parentId still matches new selection)
    for (let i = levelIdx + 1; i < ancestorTypes.length; i++) {
      const existingId = chainIds[i];
      if (!existingId) continue;
      const item = allParents.find((t) => t.id === existingId);
      if (item && item.parentId === newChain[i - 1]) newChain[i] = existingId;
    }

    setChainIds(newChain);
    setPickerOpenLevel(null);
    setDropdownPos(null);

    const deepest = [...newChain].reverse().find((id) => id !== null) ?? null;
    onChange(deepest);
  };

  if (ancestorTypes.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'nowrap' }}>
      {ancestorTypes.map((levelType, idx) => {
        const selectedId = chainIds[idx] ?? null;
        const selectedItem =
          allParents.find((t) => t.id === selectedId) ??
          (!allParents.length && parent && ancestorTypes.indexOf(parent.type) === idx
            ? (parent as unknown as Ticket)
            : undefined);

        const parentSelectionId = idx > 0 ? (chainIds[idx - 1] ?? null) : null;
        const options = allParents.filter((t) => {
          if (t.type !== levelType) return false;
          if (idx === 0) return true;
          if (!parentSelectionId) return false;
          return t.parentId === parentSelectionId;
        });

        const isOpen = pickerOpenLevel === idx;
        const isDisabled = options.length === 0 && !selectedItem;
        const badgeStyle = TYPE_BADGE_STYLES[levelType];

        return (
          <Fragment key={levelType + idx}>
            {idx > 0 && (
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>›</span>
            )}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                ref={(el) => { breadcrumbBtnRefs.current[idx] = el; }}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  if (isOpen) {
                    setPickerOpenLevel(null);
                    setDropdownPos(null);
                  } else {
                    const btn = breadcrumbBtnRefs.current[idx];
                    if (btn) {
                      const rect = btn.getBoundingClientRect();
                      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                    }
                    setPickerOpenLevel(idx);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: (selectedItem || !isDisabled) ? '#fff' : 'var(--color-board-bg)',
                  color: 'var(--color-text-primary)',
                  border: isDisabled ? '1px dashed var(--color-border)' : '1px solid var(--color-border)',
                  borderRadius: 5,
                  padding: '2px 6px 2px 3px',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: isDisabled ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  maxWidth: 180,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: badgeStyle?.bg,
                    color: badgeStyle?.color,
                    fontSize: 9,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {levelType.charAt(0)}
                </span>
                {selectedItem ? (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>
                    {selectedItem.title}
                  </span>
                ) : (
                  <span style={{ color: isDisabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)', fontStyle: isDisabled ? 'italic' : 'normal', fontSize: 10 }}>
                    선택하세요
                  </span>
                )}
                {!isDisabled && <span style={{ fontSize: 9, opacity: 0.4, flexShrink: 0 }}>▾</span>}
              </button>

              {isOpen && dropdownPos && (
                <div
                  ref={breadcrumbPickerRef}
                  style={{
                    position: 'fixed',
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    zIndex: 9999,
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: 220,
                    maxWidth: 320,
                    maxHeight: 240,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ overflowY: 'auto', padding: '4px 0' }}>
                    {options.length === 0 ? (
                      <p style={{ margin: 0, padding: '10px 14px', fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        항목 없음
                      </p>
                    ) : options.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleChainSelect(idx, t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          width: '100%',
                          textAlign: 'left',
                          padding: '7px 12px',
                          border: 'none',
                          background: 'none',
                          fontSize: 12,
                          color: 'var(--color-text-primary)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          backgroundColor: t.id === selectedId ? 'var(--color-board-bg)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-board-bg)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = t.id === selectedId ? 'var(--color-board-bg)' : 'transparent'; }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, padding: '1px 5px', borderRadius: 3, background: badgeStyle?.bg, color: badgeStyle?.color }}>
                          {levelType.charAt(0)}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
