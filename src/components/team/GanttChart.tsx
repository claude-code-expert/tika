'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { Member } from '@/types/index';
import { PriorityBadge, StatusBadge } from '@/components/ui/Chips';

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
  onItemClick?: (item: GanttItem) => void;
}

const DAY_W = 28;
const ROW_H = 36;
const LEFT_W = 220;
const RIGHT_W = 260;
const HEADER_H = 52; // 22 (month) + 30 (day)
const BAR_H = 22;
const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const TYPE_BADGE: Record<string, { bg: string; color: string; abbr: string }> = {
  GOAL:    { bg: '#E0E7FF', color: '#4338CA', abbr: 'G' },
  STORY:   { bg: '#DBEAFE', color: '#1D4ED8', abbr: 'S' },
  FEATURE: { bg: '#D1FAE5', color: '#065F46', abbr: 'F' },
  TASK:    { bg: '#F3F4F6', color: '#6B7280', abbr: 'T' },
};


function parseDateStr(s: string | null): Date | null {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekdays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(23, 59, 59, 999);
  while (d <= e) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function flattenItems(items: GanttItem[], depth = 0): GanttItem[] {
  const result: GanttItem[] = [];
  for (const item of items) {
    result.push({ ...item, depth });
    if (item.children?.length) result.push(...flattenItems(item.children, depth + 1));
  }
  return result;
}

function buildMonthGroups(weekdays: Date[]): { label: string; count: number }[] {
  const groups: { label: string; count: number }[] = [];
  let curKey = '';
  for (const d of weekdays) {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key !== curKey) {
      groups.push({ label: `${d.getFullYear()}년 ${MONTHS_KO[d.getMonth()]}`, count: 1 });
      curKey = key;
    } else {
      groups[groups.length - 1].count++;
    }
  }
  return groups;
}

function getBarColor(item: GanttItem, todayStr: string) {
  if (item.status === 'DONE') return { bg: '#86EFAC', border: '#22C55E' };
  if (item.endDate && item.endDate < todayStr) return { bg: '#FCA5A5', border: '#EF4444' };
  if (item.status === 'IN_PROGRESS') return { bg: '#FCD34D', border: '#F59E0B' };
  if (item.status === 'TODO')        return { bg: '#93C5FD', border: '#3B82F6' };
  return { bg: '#E5E7EB', border: '#D1D5DB' };
}

interface TooltipState {
  item: GanttItem;
  x: number;
  y: number;
}

export function GanttChart({ items, dateRange, onItemClick }: GanttChartProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Center split: header (horizontal-only, hidden overflow) + body (full scroll)
  const centerHeaderRef  = useRef<HTMLDivElement>(null);
  const centerBodyRef    = useRef<HTMLDivElement>(null);
  const leftBodyRef      = useRef<HTMLDivElement>(null);
  const rightBodyRef     = useRef<HTMLDivElement>(null);
  const syncingRef       = useRef(false);
  const isDraggingRef    = useRef(false);
  const dragStartXRef    = useRef(0);
  const dragScrollLeftRef = useRef(0);
  const todayIdxRef      = useRef(-1);

  const startDate  = parseDateStr(dateRange.start) ?? new Date();
  const endDate    = parseDateStr(dateRange.end)   ?? new Date();
  const weekdays   = getWeekdays(startDate, endDate);
  const flatItems  = flattenItems(items);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr  = dateKey(today);
  const todayIdx  = weekdays.findIndex((d) => dateKey(d) === todayStr);
  todayIdxRef.current = todayIdx;

  const timelineW   = Math.max(weekdays.length * DAY_W, 1);
  const monthGroups = buildMonthGroups(weekdays);
  const rowsH       = flatItems.length * ROW_H;

  function getBarBounds(item: GanttItem) {
    if (!item.startDate || !item.endDate) return null;
    const startD = parseDateStr(item.startDate);
    const endD   = parseDateStr(item.endDate);
    if (!startD || !endD) return null;

    let startIdx = -1;
    for (let i = 0; i < weekdays.length; i++) {
      if (weekdays[i] >= startD) { startIdx = i; break; }
    }
    let endIdx = -1;
    for (let i = weekdays.length - 1; i >= 0; i--) {
      if (weekdays[i] <= endD) { endIdx = i; break; }
    }
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return null;

    return {
      x: startIdx * DAY_W + 3,
      w: (endIdx - startIdx + 1) * DAY_W - 6,
      startIdx,
      endIdx,
      startClipped: startD < weekdays[0],
      endClipped:   endD   > weekdays[weekdays.length - 1],
    };
  }

  function getBorderRadius(b: NonNullable<ReturnType<typeof getBarBounds>>) {
    const r = 10;
    if (!b.startClipped && !b.endClipped) return r;
    if (!b.startClipped) return `${r}px 0 0 ${r}px`;
    if (!b.endClipped)   return `0 ${r}px ${r}px 0`;
    return 0;
  }

  // ── Scroll sync ──
  const handleCenterBodyScroll = useCallback(() => {
    // Sync header horizontal scroll
    if (centerHeaderRef.current) {
      centerHeaderRef.current.scrollLeft = centerBodyRef.current?.scrollLeft ?? 0;
    }
    // Sync vertical with left/right panels
    if (syncingRef.current) return;
    syncingRef.current = true;
    const t = centerBodyRef.current?.scrollTop ?? 0;
    if (leftBodyRef.current)  leftBodyRef.current.scrollTop  = t;
    if (rightBodyRef.current) rightBodyRef.current.scrollTop = t;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  const handleLeftScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const t = leftBodyRef.current?.scrollTop ?? 0;
    if (centerBodyRef.current) centerBodyRef.current.scrollTop = t;
    if (rightBodyRef.current)  rightBodyRef.current.scrollTop  = t;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  const handleRightScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    const t = rightBodyRef.current?.scrollTop ?? 0;
    if (centerBodyRef.current) centerBodyRef.current.scrollTop = t;
    if (leftBodyRef.current)   leftBodyRef.current.scrollTop   = t;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  useEffect(() => {
    const c = centerBodyRef.current;
    const l = leftBodyRef.current;
    const r = rightBodyRef.current;
    if (c) c.addEventListener('scroll', handleCenterBodyScroll);
    if (l) l.addEventListener('scroll', handleLeftScroll);
    if (r) r.addEventListener('scroll', handleRightScroll);
    return () => {
      if (c) c.removeEventListener('scroll', handleCenterBodyScroll);
      if (l) l.removeEventListener('scroll', handleLeftScroll);
      if (r) r.removeEventListener('scroll', handleRightScroll);
    };
  }, [handleCenterBodyScroll, handleLeftScroll, handleRightScroll]);

  // ── Drag-to-scroll ──
  useEffect(() => {
    const el = centerBodyRef.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('select,button,a,input')) return;
      isDraggingRef.current    = true;
      el.style.cursor          = 'grabbing';
      dragStartXRef.current    = e.pageX - el.offsetLeft;
      dragScrollLeftRef.current = el.scrollLeft;
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      el.scrollLeft = dragScrollLeftRef.current - (e.pageX - el.offsetLeft - dragStartXRef.current) * 1.5;
    };
    const onUp = () => {
      if (isDraggingRef.current) { isDraggingRef.current = false; el.style.cursor = 'grab'; }
    };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── Auto-scroll to today ──
  useEffect(() => {
    setTimeout(() => {
      const el = centerBodyRef.current;
      if (!el || todayIdxRef.current === -1) return;
      el.scrollLeft = Math.max(0, todayIdxRef.current * DAY_W - el.clientWidth / 2);
    }, 60);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (flatItems.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#9CA3AF', fontSize: 14 }}>
        이슈 또는 티켓 데이터 없음
      </div>
    );
  }

  const containerH = Math.min(612, HEADER_H + rowsH + 12);
  const hRow = (i: number): React.CSSProperties =>
    hoveredRow === i ? { background: '#F1F3F6' } : {};

  return (
    <div
      style={{
        display: 'flex',
        border: '1px solid #DFE1E6',
        borderRadius: 8,
        overflow: 'hidden',
        height: containerH,
        background: '#fff',
        fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
      }}
    >
      {/* ══ LEFT PANEL ══ */}
      <div style={{ width: LEFT_W, flexShrink: 0, borderRight: '2px solid #DFE1E6', display: 'flex', flexDirection: 'column', zIndex: 10, background: '#fff' }}>
        {/* Header */}
        <div style={{ height: HEADER_H, display: 'flex', alignItems: 'center', padding: '0 12px', background: '#F8F9FB', borderBottom: '1px solid #DFE1E6', fontSize: '11px', fontWeight: 600, color: '#5A6B7F', flexShrink: 0 }}>
          작업 항목
        </div>
        {/* Body */}
        <div ref={leftBodyRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {flatItems.map((item, i) => {
            const badge     = TYPE_BADGE[item.type] ?? TYPE_BADGE.TASK;
            const pl        = 12 + (item.depth ?? 0) * 16;
            const clickable = !!onItemClick;
            return (
              <div
                key={`left-${item.id}-${i}`}
                style={{ height: ROW_H, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: pl, paddingRight: 8, borderBottom: '1px solid #F1F3F6', cursor: clickable ? 'pointer' : 'default', ...hRow(i) }}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => clickable && onItemClick(item)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: 3, fontSize: 9, fontWeight: 700, color: badge.color, background: badge.bg, flexShrink: 0, letterSpacing: '0.3px' }}>
                  {badge.abbr}
                </span>
                <span
                  style={{ fontSize: 11, color: clickable ? '#629584' : '#2C3E50', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, textDecoration: clickable ? 'underline' : 'none', textDecorationColor: 'rgba(98,149,132,.4)' }}
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ CENTER PANEL — header + body split ══ */}
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Date header — overflow hidden, horizontally synced with body */}
        <div
          ref={centerHeaderRef}
          style={{ height: HEADER_H, overflowX: 'hidden', overflowY: 'hidden', flexShrink: 0, borderBottom: '1px solid #DFE1E6', background: '#F8F9FB' }}
        >
          <div style={{ width: timelineW }}>
            {/* Month row */}
            <div style={{ display: 'flex', height: 22, borderBottom: '1px solid #DFE1E6' }}>
              {monthGroups.map((mg, i) => {
                const isPartialFirst = i === 0 && weekdays[0].getDate() !== 1;
                return (
                  <div key={i} style={{ width: mg.count * DAY_W, minWidth: mg.count * DAY_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: isPartialFirst ? '#C4C9D4' : '#5A6B7F', borderRight: '1px solid #DFE1E6', flexShrink: 0 }}>
                    {isPartialFirst ? '이전' : mg.label}
                  </div>
                );
              })}
            </div>
            {/* Day row */}
            <div style={{ display: 'flex', height: 30 }}>
              {weekdays.map((d, i) => {
                const isToday  = dateKey(d) === todayStr;
                const isMonday = d.getDay() === 1;
                return (
                  <div key={i} style={{ width: DAY_W, minWidth: DAY_W, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#629584' : '#9CA3AF', borderRight: isToday ? '2px solid #629584' : '1px solid rgba(223,225,230,.5)', borderLeft: isToday ? '2px solid #629584' : (isMonday ? '1px solid #DFE1E6' : undefined), borderTop: isToday ? '2px solid #629584' : undefined, background: isToday ? 'rgba(98,149,132,.15)' : undefined, position: 'relative', flexShrink: 0, boxSizing: 'border-box' }}>
                    {d.getDate()}
                    {isToday && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#629584' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gantt body — full scroll (x + y) */}
        <div
          ref={centerBodyRef}
          style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', cursor: 'grab', minHeight: 0 }}
        >
          <div style={{ position: 'relative', width: timelineW, height: rowsH }}>
            {/* Today column highlight */}
            {todayIdx !== -1 && (
              <div style={{ position: 'absolute', left: todayIdx * DAY_W, top: 0, width: DAY_W, height: rowsH, background: 'rgba(98,149,132,.04)', zIndex: 0, pointerEvents: 'none' }} />
            )}
            {/* Monday grid lines */}
            {weekdays.map((d, i) =>
              d.getDay() === 1 ? (
                <div key={`gl-${i}`} style={{ position: 'absolute', left: i * DAY_W, top: 0, width: 1, height: rowsH, background: 'rgba(223,225,230,.6)', zIndex: 0, pointerEvents: 'none' }} />
              ) : null,
            )}
            {/* Rows */}
            {flatItems.map((item, i) => {
              const bounds   = getBarBounds(item);
              const barColor = getBarColor(item, todayStr);
              return (
                <div
                  key={`cr-${item.id}-${i}`}
                  style={{ height: ROW_H, borderBottom: '1px solid #F1F3F6', position: 'relative', zIndex: 1, ...hRow(i) }}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => { setHoveredRow(null); setTooltip(null); }}
                  onMouseMove={bounds ? (e) => setTooltip({ item, x: e.clientX, y: e.clientY }) : undefined}
                >
                  {bounds && Array.from({ length: bounds.endIdx - bounds.startIdx + 1 }, (_, di) => {
                    const idx = bounds.startIdx + di;
                    const isFirst = di === 0;
                    const isLast = di === bounds.endIdx - bounds.startIdx;
                    const r = 4;
                    const borderRadius = isFirst && isLast ? r
                      : isFirst ? `${r}px 0 0 ${r}px`
                      : isLast ? `0 ${r}px ${r}px 0`
                      : 0;
                    return (
                      <div
                        key={`bar-${item.id}-${di}`}
                        style={{ position: 'absolute', left: idx * DAY_W + 2, width: DAY_W - 4, top: (ROW_H - BAR_H) / 2, height: BAR_H, background: barColor.bg, border: `1px solid ${barColor.border}`, borderRadius, zIndex: 2 }}
                        title={`${item.name}: ${item.startDate} ~ ${item.endDate}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ TOOLTIP ══ */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            zIndex: 9999,
            background: '#1F2937',
            color: '#F9FAFB',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,.25)',
            pointerEvents: 'none',
            maxWidth: 260,
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tooltip.item.name}
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 4 }}>
            {tooltip.item.startDate ?? '?'} ~ {tooltip.item.endDate ?? '?'}
          </div>
          {tooltip.item.assignees.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              {tooltip.item.assignees.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}
                  title={a.displayName}
                >
                  {a.displayName.charAt(0).toUpperCase()}
                </div>
              ))}
              {tooltip.item.assignees.length > 3 && (
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>+{tooltip.item.assignees.length - 3}</span>
              )}
              <span style={{ fontSize: 11, color: '#D1D5DB', marginLeft: 4 }}>
                {tooltip.item.assignees.slice(0, 3).map((a) => a.displayName).join(', ')}
                {tooltip.item.assignees.length > 3 ? ` 외 ${tooltip.item.assignees.length - 3}명` : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ══ RIGHT PANEL ══ */}
      <div style={{ width: RIGHT_W, flexShrink: 0, borderLeft: '2px solid #DFE1E6', display: 'flex', flexDirection: 'column', zIndex: 10, background: '#fff' }}>
        {/* Header */}
        <div style={{ height: HEADER_H, display: 'flex', alignItems: 'center', background: '#F8F9FB', borderBottom: '1px solid #DFE1E6', flexShrink: 0 }}>
          {[{ label: '담당자', w: 90 }, { label: '우선순위', w: 82 }, { label: '상태', w: 88 }].map((col) => (
            <div key={col.label} style={{ width: col.w, minWidth: col.w, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: '#5A6B7F' }}>
              {col.label}
            </div>
          ))}
        </div>
        {/* Body */}
        <div ref={rightBodyRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {flatItems.map((item, i) => {
            const first = item.assignees[0];
            const extra = item.assignees.length - 1;
            return (
              <div
                key={`rr-${item.id}-${i}`}
                style={{ height: ROW_H, display: 'flex', alignItems: 'center', borderBottom: '1px solid #F1F3F6', ...hRow(i) }}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Assignee */}
                <div style={{ width: 90, minWidth: 90, display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 8, overflow: 'visible' }}>
                  {!first ? (
                    <span style={{ fontSize: 10, color: '#C4C9D4' }}>—</span>
                  ) : (
                    <>
                      <div style={{ position: 'relative', flexShrink: 0, width: 18, height: 18 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: first.color }}>
                          {first.displayName.charAt(0).toUpperCase()}
                        </div>
                        {extra > 0 && (
                          <div style={{ position: 'absolute', top: -3, right: -9, width: 14, height: 14, borderRadius: '50%', fontSize: 7, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#8993A4', border: '1px solid #fff', zIndex: 1 }}>
                            +{extra}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: '#5A6B7F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {first.displayName}
                      </span>
                    </>
                  )}
                </div>
                {/* Priority */}
                <div style={{ width: 82, minWidth: 82, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PriorityBadge priority={item.priority} size="sm" />
                </div>
                {/* Status */}
                <div style={{ width: 88, minWidth: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StatusBadge status={item.status} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
