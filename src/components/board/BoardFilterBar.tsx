'use client';

import { Settings, X } from 'lucide-react';
import type { BoardFilterState } from '@/hooks/useBoardFilter';
import type { TicketPriority, TicketType } from '@/types/index';
import { TICKET_TYPE_META } from '@/lib/constants';
import { PRIORITY_CONFIG } from '@/components/ui/Chips';

interface BoardFilterBarProps {
  filter: BoardFilterState;
}

export function BoardFilterBar({ filter }: BoardFilterBarProps) {
  const {
    activeFilter,
    setActiveFilter,
    showAdvancedFilter,
    toggleAdvancedFilter,
    activePriorities,
    togglePriority,
    activeTypes,
    toggleType,
    dueDateFrom,
    setDueDateFrom,
    dueDateTo,
    setDueDateTo,
    hasActiveFilters,
    clearAllFilters,
    todayDueCount,
    overdueCount,
    weekDoneCount,
    total,
  } = filter;

  const advancedFilterCount =
    activePriorities.length + activeTypes.length + (dueDateFrom || dueDateTo ? 1 : 0);

  return (
    <>
      {/* Chip bar */}
      <div className="filter-bar">
        <button
          className="chip"
          data-active={activeFilter === 'all' ? 'true' : undefined}
          onClick={() => setActiveFilter('all')}
        >
          전체
          <span className="chip-count">{total}</span>
        </button>
        <button
          className="chip"
          data-active={activeFilter === 'today_due' ? 'true' : undefined}
          onClick={() => setActiveFilter('today_due')}
        >
          오늘 마감
          <span className="chip-count">{todayDueCount}</span>
        </button>
        <button
          className="chip"
          data-active={activeFilter === 'overdue' ? 'true' : undefined}
          onClick={() => setActiveFilter('overdue')}
        >
          오버듀
          <span className="chip-count">{overdueCount}</span>
        </button>
        <button
          className="chip"
          data-active={activeFilter === 'week_done' ? 'true' : undefined}
          onClick={() => setActiveFilter('week_done')}
        >
          이번 주
          <span className="chip-count">{weekDoneCount}</span>
        </button>

        <button
          className="chip"
          data-active={showAdvancedFilter ? 'true' : undefined}
          onClick={toggleAdvancedFilter}
          title="고급 필터"
        >
          <Settings size={12} /> 필터
          {advancedFilterCount > 0 && (
            <span
              className="chip-count"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              {advancedFilterCount}
            </span>
          )}
        </button>

        {(hasActiveFilters) && (
          <button
            className="chip"
            onClick={clearAllFilters}
            style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
          >
            <X size={12} /> 초기화
          </button>
        )}
      </div>

      {/* Advanced filter panel */}
      {showAdvancedFilter && (
        <div
          style={{
            padding: '7px 16px 10px',
            background: 'var(--color-sidebar-bg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            gap: 20,
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {/* Type filter */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
              }}
            >
              이슈 타입
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(Object.entries(TICKET_TYPE_META) as [TicketType, (typeof TICKET_TYPE_META)[TicketType]][]).map(
                ([type, style]) => {
                  const isActive = activeTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: isActive ? style.bg : style.bg + '22',
                        color: isActive ? '#fff' : style.bg,
                        border: `1px solid ${isActive ? style.bg : 'transparent'}`,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      {style.label}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Priority filter */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
              }}
            >
              우선순위
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map((p) => {
                const isActive = activePriorities.includes(p);
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      background: isActive ? cfg.color : cfg.bg,
                      color: isActive ? '#fff' : cfg.color,
                      border: `1px solid ${isActive ? cfg.color : 'transparent'}`,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontWeight: 800 }}>{cfg.icon}</span>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range filter */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
              }}
            >
              마감일 범위
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="date"
                value={dueDateFrom}
                onChange={(e) => setDueDateFrom(e.target.value)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  background: '#fff',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
                aria-label="마감일 시작"
              />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>~</span>
              <input
                type="date"
                value={dueDateTo}
                onChange={(e) => setDueDateTo(e.target.value)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  background: '#fff',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
                aria-label="마감일 종료"
              />
              {(dueDateFrom || dueDateTo) && (
                <button
                  onClick={() => {
                    setDueDateFrom('');
                    setDueDateTo('');
                  }}
                  style={{
                    display: 'flex',
                    color: 'var(--color-text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
