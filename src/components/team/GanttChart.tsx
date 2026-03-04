'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { Member } from '@/types/index';

export interface GanttItem {
  id: number;
  type: 'GOAL' | 'STORY' | 'FEATURE' | 'TASK';
  name: string;
  status: string;
  priority: string;
  assignees: Member[];
  startDate: string | null;
  endDate: string | null;
  children?: GanttItem[];
  depth?: number;
}

interface GanttChartProps {
  items: GanttItem[];
  dateRange: { start: string; end: string };
}

const TYPE_COLORS: Record<string, { bg: string; abbr: string }> = {
  GOAL: { bg: '#8B5CF6', abbr: 'G' },
  STORY: { bg: '#3B82F6', abbr: 'S' },
  FEATURE: { bg: '#10B981', abbr: 'F' },
  TASK: { bg: '#F59E0B', abbr: 'T' },
};

const STATUS_BAR_COLORS: Record<string, string> = {
  BACKLOG: '#D1D5DB',
  TODO: '#93C5FD',
  IN_PROGRESS: '#FCD34D',
  DONE: '#6EE7B7',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#C2410C',
  MEDIUM: '#A16207',
  LOW: '#6B7280',
};

const ROW_H = 36;
const TREE_W = 220;
const RIGHT_W = 200;
const HEADER_H = 40;
const MIN_BAR_W = 8;

function flattenItems(items: GanttItem[], depth = 0): GanttItem[] {
  const result: GanttItem[] = [];
  for (const item of items) {
    result.push({ ...item, depth });
    if (item.children && item.children.length > 0) {
      result.push(...flattenItems(item.children, depth + 1));
    }
  }
  return result;
}

function parseDateStr(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function GanttChart({ items, dateRange }: GanttChartProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const flatItems = flattenItems(items);
  const totalH = HEADER_H + flatItems.length * ROW_H;

  const startDate = parseDateStr(dateRange.start) ?? new Date();
  const endDate = parseDateStr(dateRange.end) ?? new Date(Date.now() + 30 * 86400000);
  const totalDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000),
  );

  // Build day columns — show every 7th day label
  const dayColW = 28;
  const timelineW = totalDays * dayColW;

  const dayLabels: { label: string; x: number }[] = [];
  for (let d = 0; d < totalDays; d += 7) {
    const date = new Date(startDate.getTime() + d * 86400000);
    dayLabels.push({ label: `${date.getMonth() + 1}/${date.getDate()}`, x: d * dayColW });
  }

  const xForDate = (dateStr: string | null): number | null => {
    const d = parseDateStr(dateStr);
    if (!d) return null;
    const days = Math.ceil((d.getTime() - startDate.getTime()) / 86400000);
    return Math.max(0, days) * dayColW;
  };

  // Sync scroll between timeline and tree/right panels
  const handleTimelineScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const scrollTop = timelineRef.current?.scrollTop ?? 0;
    if (treeScrollRef.current) treeScrollRef.current.scrollTop = scrollTop;
    if (rightScrollRef.current) rightScrollRef.current.scrollTop = scrollTop;
    syncingRef.current = false;
  }, []);

  const handleTreeScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const scrollTop = treeScrollRef.current?.scrollTop ?? 0;
    if (timelineRef.current) timelineRef.current.scrollTop = scrollTop;
    if (rightScrollRef.current) rightScrollRef.current.scrollTop = scrollTop;
    syncingRef.current = false;
  }, []);

  useEffect(() => {
    const tlEl = timelineRef.current;
    const treeEl = treeScrollRef.current;
    if (tlEl) tlEl.addEventListener('scroll', handleTimelineScroll);
    if (treeEl) treeEl.addEventListener('scroll', handleTreeScroll);
    return () => {
      if (tlEl) tlEl.removeEventListener('scroll', handleTimelineScroll);
      if (treeEl) treeEl.removeEventListener('scroll', handleTreeScroll);
    };
  }, [handleTimelineScroll, handleTreeScroll]);

  if (flatItems.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          color: 'var(--color-text-muted)',
          fontSize: 14,
        }}
      >
        이슈 또는 티켓 데이터 없음
      </div>
    );
  }

  const containerH = Math.min(600, HEADER_H + flatItems.length * ROW_H + 20);

  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        overflow: 'hidden',
        height: containerH,
        background: 'var(--color-card-bg)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Left: Tree panel */}
      <div style={{ width: TREE_W, flexShrink: 0, borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            height: HEADER_H,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            borderBottom: '1px solid #E5E7EB',
            background: '#F9FAFB',
            fontSize: 11,
            fontWeight: 600,
            color: '#6B7280',
            flexShrink: 0,
          }}
        >
          이슈 / 티켓
        </div>
        {/* Rows */}
        <div ref={treeScrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {flatItems.map((item, i) => {
            const typeStyle = TYPE_COLORS[item.type] ?? TYPE_COLORS.TASK;
            return (
              <div
                key={`tree-${item.id}-${i}`}
                style={{
                  height: ROW_H,
                  display: 'flex',
                  alignItems: 'center',
                  padding: `0 8px 0 ${8 + (item.depth ?? 0) * 14}px`,
                  borderBottom: '1px solid #F9FAFB',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    fontSize: 8,
                    fontWeight: 700,
                    color: '#fff',
                    background: typeStyle.bg,
                    flexShrink: 0,
                  }}
                >
                  {typeStyle.abbr}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center: Timeline */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header with date labels */}
        <div
          style={{
            height: HEADER_H,
            overflowX: 'hidden',
            borderBottom: '1px solid #E5E7EB',
            background: '#F9FAFB',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div style={{ width: timelineW, height: '100%', position: 'relative' }}>
            {dayLabels.map((dl) => (
              <div
                key={dl.x}
                style={{
                  position: 'absolute',
                  left: dl.x,
                  top: 0,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 9,
                  color: '#9CA3AF',
                  paddingLeft: 3,
                  borderLeft: '1px solid #F3F4F6',
                }}
              >
                {dl.label}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable timeline rows */}
        <div
          ref={timelineRef}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}
        >
          <div style={{ width: timelineW, minHeight: totalH - HEADER_H }}>
            {/* Today line */}
            {(() => {
              const todayX = xForDate(new Date().toISOString().slice(0, 10));
              if (todayX === null) return null;
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: todayX,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: '#EF4444',
                    opacity: 0.5,
                    zIndex: 2,
                  }}
                />
              );
            })()}

            {flatItems.map((item, i) => {
              const x1 = xForDate(item.startDate);
              const x2 = xForDate(item.endDate);
              const barColor = STATUS_BAR_COLORS[item.status] ?? '#D1D5DB';
              const hasBar = x1 !== null && x2 !== null;
              const barX = x1 ?? 0;
              const barW = hasBar ? Math.max(MIN_BAR_W, (x2 ?? barX) - barX) : 0;

              return (
                <div
                  key={`tl-${item.id}-${i}`}
                  style={{
                    height: ROW_H,
                    borderBottom: '1px solid #F9FAFB',
                    position: 'relative',
                    background: i % 2 === 0 ? 'transparent' : '#FAFBFC',
                  }}
                >
                  {/* Vertical grid lines */}
                  {dayLabels.map((dl) => (
                    <div
                      key={dl.x}
                      style={{
                        position: 'absolute',
                        left: dl.x,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: '#F3F4F6',
                      }}
                    />
                  ))}

                  {/* Bar */}
                  {hasBar && (
                    <div
                      style={{
                        position: 'absolute',
                        left: barX,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: 16,
                        width: barW,
                        borderRadius: 4,
                        background: barColor,
                        border: `1px solid ${barColor}`,
                        opacity: 0.9,
                        zIndex: 1,
                      }}
                      title={`${item.name}: ${item.startDate} ~ ${item.endDate}`}
                    />
                  )}

                  {/* If no date range, show a dot at center */}
                  {!hasBar && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#E5E7EB',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Details panel */}
      <div style={{ width: RIGHT_W, flexShrink: 0, borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            height: HEADER_H,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            borderBottom: '1px solid #E5E7EB',
            background: '#F9FAFB',
            fontSize: 11,
            fontWeight: 600,
            color: '#6B7280',
            flexShrink: 0,
          }}
        >
          담당자 · 우선순위 · 상태
        </div>
        {/* Rows */}
        <div ref={rightScrollRef} style={{ flex: 1, overflowY: 'auto' }}>
          {flatItems.map((item, i) => {
            const priorityColor = PRIORITY_COLORS[item.priority] ?? '#9CA3AF';
            const visible = item.assignees.slice(0, 3);
            const extra = item.assignees.length - 3;

            return (
              <div
                key={`right-${item.id}-${i}`}
                style={{
                  height: ROW_H,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  borderBottom: '1px solid #F9FAFB',
                  gap: 6,
                }}
              >
                {/* Assignee avatars */}
                <div style={{ display: 'flex', flexDirection: 'row-reverse', marginRight: 4 }}>
                  {extra > 0 && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        fontSize: 8,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        background: '#8993A4',
                        border: '1.5px solid #fff',
                      }}
                    >
                      +{extra}
                    </div>
                  )}
                  {[...visible].reverse().map((a) => (
                    <div
                      key={a.id}
                      title={a.displayName}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        fontSize: 8,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        background: a.color,
                        border: '1.5px solid #fff',
                        marginRight: -4,
                      }}
                    >
                      {a.displayName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>

                {/* Priority */}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: priorityColor,
                    minWidth: 24,
                  }}
                >
                  {item.priority.slice(0, 4)}
                </span>

                {/* Status */}
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 5px',
                    borderRadius: 3,
                    background: STATUS_BAR_COLORS[item.status] ?? '#E5E7EB',
                    color: '#374151',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
