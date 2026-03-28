'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import type { TicketWithMeta, Ticket, Label, Member, Sprint } from '@/types/index';
import { TICKET_TYPE, TICKET_PRIORITY, TICKET_STATUS } from '@/types/index';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';
import { LABEL_MAX_PER_TICKET, CHECKLIST_MAX_ITEMS, TICKET_TYPE_META, TITLE_MAX_LENGTH } from '@/lib/constants';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/components/ui/Chips';
import { labelTextColor } from '@/components/label/LabelBadge';
import { FileText, Users, Tag, CheckSquare, Type, UserPlus, Check } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { CHEVRON_SVG, metaSelectStyle, metaDateStyle } from '@/lib/ticketMetaStyles';

/* ── Type badge config (breadcrumb.html large style) ── */
const TYPE_CONFIG = [
  { value: 'GOAL', label: 'Goal', abbr: 'G', color: '#8B5CF6' },
  { value: 'STORY', label: 'Story', abbr: 'S', color: '#3B82F6' },
  { value: 'FEATURE', label: 'Feature', abbr: 'F', color: '#10B981' },
  { value: 'TASK', label: 'Task', abbr: 'T', color: '#F59E0B' },
] as const;


/* ── Shared inline styles ── */
const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  fontSize: 13,
  fontFamily: 'inherit',
  color: 'var(--color-text-primary)',
  background: '#ffffff',
  outline: 'none',
  transition: 'border-color 0.15s',
};

/* ── Helper: determine which parent issue types are valid for a given ticket type ── */
function getParentIssueTypes(ticketType: string): string[] {
  switch (ticketType) {
    case 'STORY':
      return ['GOAL'];
    case 'FEATURE':
      return ['STORY', 'GOAL'];
    case 'TASK':
      return ['FEATURE', 'STORY', 'GOAL'];
    default:
      return [];
  }
}

/* ── Local checklist item ── */
interface LocalChecklistItem {
  tempId: string;
  text: string;
}

/* ── Props ── */
interface TicketFormProps {
  mode?: 'create' | 'edit';
  initialData?: Partial<TicketWithMeta>;
  workspaceId?: number;
  externalTitle?: string;
  onTitleChange?: (v: string) => void;
  onSubmit: (
    data: CreateTicketInput | UpdateTicketInput,
    extra?: { checklistTexts?: string[] },
  ) => Promise<void>;
  onCancel: () => void;
}

export function TicketForm({ mode = 'create', initialData, workspaceId, externalTitle, onTitleChange, onSubmit, onCancel }: TicketFormProps) {
  const { data: session } = useSession();
  const currentMemberId = (session?.user as Record<string, unknown> | undefined)?.memberId as number | null | undefined;

  /* ── Form state ── */
  const [type, setType] = useState<string>(initialData?.type ?? 'TASK');
  const [internalTitle, setInternalTitle] = useState(initialData?.title ?? '');
  const title = externalTitle !== undefined ? externalTitle : internalTitle;
  const setTitle = (v: string) => {
    if (onTitleChange) onTitleChange(v);
    else setInternalTitle(v);
  };
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [status, setStatus] = useState<string>(initialData?.status ?? 'BACKLOG');
  const [priority, setPriority] = useState<string>(initialData?.priority ?? 'MEDIUM');
  const [startDate, setStartDate] = useState(initialData?.plannedStartDate ?? '');
  const [dueDate, setDueDate] = useState(initialData?.plannedEndDate ?? '');
  const [parentId, setParentId] = useState<number | null>(initialData?.parentId ?? null);
  const [titleError, setTitleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Labels ── */
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    initialData?.labels?.map((l) => l.id) ?? [],
  );

  /* ── Checklist (local only for create) ── */
  const [checklistItems, setChecklistItems] = useState<LocalChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const checklistInputRef = useRef<HTMLInputElement>(null);

  /* ── Parent tickets for parent selection ── */
  const [allParents, setAllParents] = useState<Ticket[]>([]);
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const parentDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Multi-assignee ── */
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>(
    initialData?.assignees?.map((a) => a.id) ?? [],
  );
  const [assigneeError, setAssigneeError] = useState('');
  const [dateError, setDateError] = useState('');
  const [assigneeInputText, setAssigneeInputText] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeInputRef = useRef<HTMLInputElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Sprint ── */
  const [sprintId, setSprintId] = useState<number | null>(initialData?.sprintId ?? null);
  const [activeSprints, setActiveSprints] = useState<Sprint[]>([]);

  /* ── Load labels, parents, members, sprints via SWR ── */
  const { data: labelsData } = useSWR<{ labels: Label[] }>('/api/labels', fetcher);
  const { data: parentsData } = useSWR<{ tickets: TicketWithMeta[] }>('/api/tickets?types=GOAL,STORY,FEATURE', fetcher);
  const { data: membersData } = useSWR<{ members: Member[] }>('/api/members', fetcher);
  const { data: sprintsData } = useSWR<{ sprints: Sprint[] }>(
    workspaceId ? `/api/workspaces/${workspaceId}/sprints` : null,
    fetcher,
  );

  useEffect(() => {
    if (labelsData?.labels) setAllLabels(labelsData.labels);
  }, [labelsData]);

  useEffect(() => {
    if (parentsData?.tickets) setAllParents(parentsData.tickets);
  }, [parentsData]);

  useEffect(() => {
    const members = membersData?.members;
    if (!members?.length) return;
    setAllMembers(members);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersData, currentMemberId]);

  useEffect(() => {
    const sprints = sprintsData?.sprints ?? [];
    const active = sprints.filter((s) => s.status === 'ACTIVE' || s.status === 'PLANNED');
    setActiveSprints(active);
  }, [sprintsData]);

  /* ── Close parent dropdown on outside click ── */
  useEffect(() => {
    if (!showParentDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(e.target as Node)) {
        setShowParentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showParentDropdown]);

  /* ── Close assignee dropdown on outside click ── */
  useEffect(() => {
    if (!showAssigneeDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
        // restore display text from selected
        const names = allMembers
          .filter((m) => selectedAssigneeIds.includes(m.id))
          .map((m) => m.displayName)
          .join(', ');
        setAssigneeInputText(names);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAssigneeDropdown, allMembers, selectedAssigneeIds]);


  /* ── Reset parentId when type changes (may invalidate parent) ── */
  useEffect(() => {
    const validTypes = getParentIssueTypes(type);
    if (validTypes.length === 0) {
      setParentId(null);
      return;
    }
    if (parentId) {
      const parentTicket = allParents.find((t) => t.id === parentId);
      if (parentTicket && !validTypes.includes(parentTicket.type)) {
        setParentId(null);
      }
    }
  }, [type, allParents, parentId]);

  /* ── Filtered parents for parent selection ── */
  const parentIssueTypes = getParentIssueTypes(type);
  const parentSearchTrimmed = parentSearch.trim();
  const isNumericSearch = /^\d+$/.test(parentSearchTrimmed);
  const isParentSearchActive = parentSearchTrimmed.length >= 2 || (isNumericSearch && parentSearchTrimmed.length >= 1);
  const filteredParents = isParentSearchActive
    ? allParents
        .filter((t) => parentIssueTypes.includes(t.type))
        .filter((t) => {
          const q = parentSearchTrimmed.toLowerCase();
          return t.title.toLowerCase().includes(q) || String(t.id).includes(q);
        })
    : [];

  const selectedParent = parentId ? allParents.find((t) => t.id === parentId) : null;

  /* ── Label toggle ── */
  const handleLabelToggle = useCallback((labelId: number) => {
    setSelectedLabelIds((prev) => {
      if (prev.includes(labelId)) return prev.filter((id) => id !== labelId);
      if (prev.length >= LABEL_MAX_PER_TICKET) return prev;
      return [...prev, labelId];
    });
  }, []);

  /* ── Checklist add ── */
  const handleAddChecklist = useCallback(() => {
    if (!newChecklistText.trim() || checklistItems.length >= CHECKLIST_MAX_ITEMS) return;
    setChecklistItems((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), text: newChecklistText.trim() },
    ]);
    setNewChecklistText('');
    checklistInputRef.current?.focus();
  }, [newChecklistText, checklistItems.length]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('제목을 입력해주세요');
      return;
    }
    setTitleError('');
    setDateError('');

    if (mode === 'create' && dueDate && dueDate < todayLocal) {
      setDateError('종료 예정일은 오늘 이전일 수 없습니다');
      return;
    }
    if (startDate && dueDate && dueDate < startDate) {
      setDateError('종료 예정일은 시작 예정일 이후여야 합니다');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedAssigneeIds.length > 3) {
        setAssigneeError('담당자는 최대 3명까지 지정할 수 있습니다');
        return;
      }

      const formData: CreateTicketInput = {
        title: title.trim(),
        type: type as (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE],
        priority: priority as (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY],
        plannedStartDate: startDate || null,
        plannedEndDate: dueDate || null,
        description: description || null,
        parentId: parentId ?? null,
        assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
        storyPoints: null,
        sprintId: sprintId ?? null,
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      };
      await onSubmit(formData, {
        checklistTexts: checklistItems.map((c) => c.text),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayLocal = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      {/* Top: Type selector */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ ...fieldLabelStyle, marginBottom: 0, flexShrink: 0 }}>
            이슈 타입 <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPE_CONFIG.map((t) => {
              const isSelected = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px 3px 5px',
                    border: `2px solid ${isSelected ? t.color : t.color + '40'}`,
                    borderRadius: 20,
                    background: isSelected ? `${t.color}22` : 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.15s, border-color 0.15s',
                    boxShadow: isSelected ? `0 0 0 3px ${t.color}20` : 'none',
                  }}
                  aria-label={`${t.label} 타입 선택`}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, fontSize: 10, fontWeight: 800, color: '#fff', background: t.color, fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
                    {t.abbr}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, color: isSelected ? t.color : 'var(--color-text-secondary)' }}>
                    {t.label}
                  </span>
                  <Check size={11} strokeWidth={3} style={{ color: t.color, flexShrink: 0, visibility: isSelected ? 'visible' : 'hidden' }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Title — single row: label + input inline */}
      {externalTitle === undefined && (
        <div style={{ padding: '0 24px', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="ticket-title" style={{ ...sectionHeaderStyle, marginBottom: 0, flexShrink: 0 }}>
              <Type size={13} style={{ opacity: 0.7 }} />
              제목 <span style={{ color: '#DC2626', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>*</span>
            </label>
            <input
              id="ticket-title" type="text" value={title}
              onChange={(e) => { setTitle(e.target.value); if (e.target.value.trim()) setTitleError(''); }}
              maxLength={TITLE_MAX_LENGTH} placeholder="업무 제목을 입력하세요" autoFocus aria-label="제목" aria-describedby={titleError ? 'ticket-title-error' : undefined}
              style={{ ...inputStyle, flex: 1, borderColor: titleError || title.length >= TITLE_MAX_LENGTH ? '#DC2626' : 'var(--color-border)' }}
              onFocus={(e) => { if (!titleError && title.length < TITLE_MAX_LENGTH) (e.target as HTMLElement).style.borderColor = 'var(--color-accent)'; }}
              onBlur={(e) => { if (!titleError && title.length < TITLE_MAX_LENGTH) (e.target as HTMLElement).style.borderColor = 'var(--color-border)'; }}
            />
          </div>
          {title.length >= TITLE_MAX_LENGTH && (
            <span style={{ fontSize: 11, color: '#DC2626', marginLeft: 52 }}>
              제목은 {TITLE_MAX_LENGTH}자 이하여야 합니다 ({title.length}/{TITLE_MAX_LENGTH})
            </span>
          )}
          {titleError && <span id="ticket-title-error" style={{ fontSize: 11, color: '#DC2626', marginLeft: 52 }}>{titleError}</span>}
        </div>
      )}

      {/* Two-panel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT: main content */}
        <div style={{ padding: '20px 24px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>

          {/* Parent Ticket */}
          {parentIssueTypes.length > 0 && (
            <div ref={parentDropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
              <div style={sectionHeaderStyle}>상위 이슈</div>
              {selectedParent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6, background: '#fff' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: TICKET_TYPE_META[selectedParent.type as keyof typeof TICKET_TYPE_META]?.bg ?? '#6B7280' }}>
                    {TICKET_TYPE_META[selectedParent.type as keyof typeof TICKET_TYPE_META]?.abbr ?? '?'}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>{selectedParent.title}</span>
                  <button type="button" onClick={() => setParentId(null)} aria-label="상위 이슈 해제"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-muted)', padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ) : (
                <input type="text" value={parentSearch}
                  onChange={(e) => { setParentSearch(e.target.value); setShowParentDropdown(true); }}
                  onFocus={() => setShowParentDropdown(true)}
                  placeholder="이슈 이름 또는 번호로 검색..."
                  style={inputStyle}
                />
              )}
              {showParentDropdown && !selectedParent && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', zIndex: 100, marginTop: 4 }}>
                  {!isParentSearchActive ? (
                    <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-muted)' }}>이름(2자 이상) 또는 번호를 입력하세요</div>
                  ) : filteredParents.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-muted)' }}>검색 결과가 없습니다</div>
                  ) : filteredParents.map((parent) => (
                    <button key={parent.id} type="button"
                      onClick={() => { setParentId(parent.id); setParentSearch(''); setShowParentDropdown(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: 'var(--color-text-primary)', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-board-bg)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: TICKET_TYPE_META[parent.type as keyof typeof TICKET_TYPE_META]?.bg ?? '#6B7280', flexShrink: 0 }}>
                        {TICKET_TYPE_META[parent.type as keyof typeof TICKET_TYPE_META]?.abbr ?? '?'}
                      </span>
                      <span style={{ flex: 1 }}>{parent.title}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>#{parent.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <div style={sectionHeaderStyle}>
              <FileText size={13} style={{ opacity: 0.7 }} />
              설명
            </div>
            <textarea
              id="ticket-desc" value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000} rows={5}
              placeholder="업무에 대한 자세한 설명을 입력하세요 (선택)"
              aria-label="설명"
              style={{ width: '100%', minHeight: 100, padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 8, fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.7, background: 'var(--color-board-bg)', outline: 'none', resize: 'vertical' }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--color-accent)'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--color-border)'; }}
            />
          </div>

          {/* Labels */}
          <div>
            <div style={sectionHeaderStyle}>
              <Tag size={13} style={{ opacity: 0.7 }} />
              라벨 <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(최대 {LABEL_MAX_PER_TICKET}개)</span>
            </div>
            {allLabels.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  const isAtLimit = selectedLabelIds.length >= LABEL_MAX_PER_TICKET;
                  return (
                    <button key={label.id} type="button"
                      onClick={() => handleLabelToggle(label.id)}
                      disabled={!isSelected && isAtLimit}
                      style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 9px', borderRadius: 4, fontSize: 11, fontWeight: isSelected ? 700 : 500, cursor: !isSelected && isAtLimit ? 'not-allowed' : 'pointer', border: isSelected ? `2px solid ${label.color}` : `1px solid ${label.color}55`, background: isSelected ? `${label.color}30` : 'transparent', color: isSelected ? label.color : '#2C3E50', fontFamily: 'inherit', transition: 'opacity 0.15s, background 0.12s, border 0.12s', opacity: !isSelected && isAtLimit ? 0.4 : 1, boxShadow: isSelected ? `0 0 0 1px ${label.color}40` : 'none' }}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                등록된 라벨이 없습니다. 설정에서 라벨을 추가하세요.
              </p>
            )}
          </div>

          {/* Checklist */}
          <div>
            <div style={sectionHeaderStyle}>
              <CheckSquare size={13} style={{ opacity: 0.7 }} />
              체크리스트
            </div>
            {checklistItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {checklistItems.map((item) => (
                  <div key={item.tempId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 5, background: 'var(--color-board-bg)' }}>
                    <span style={{ width: 14, height: 14, border: '1.5px solid var(--color-border)', borderRadius: 3, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>{item.text}</span>
                    <button type="button"
                      onClick={() => setChecklistItems((prev) => prev.filter((c) => c.tempId !== item.tempId))}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)', padding: 0, lineHeight: 1 }} aria-label="항목 삭제">✕</button>
                  </div>
                ))}
              </div>
            )}
            {checklistItems.length < CHECKLIST_MAX_ITEMS && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input ref={checklistInputRef} type="text" value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddChecklist(); } }}
                  placeholder="새 항목 입력..." maxLength={200}
                  style={{ ...inputStyle, flex: 1, padding: '4px 12px', border: '1.5px dashed var(--color-border-hover)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.borderStyle = 'solid'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-hover)'; e.target.style.borderStyle = 'dashed'; }}
                />
                <button type="button" onClick={handleAddChecklist} disabled={!newChecklistText.trim()}
                  style={{ padding: '6px 12px', background: 'var(--color-board-bg)', border: '1px solid var(--color-border)', borderRadius: 5, fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', cursor: newChecklistText.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap', fontFamily: 'inherit', opacity: !newChecklistText.trim() ? 0.5 : 1 }}>
                  + 추가
                </button>
              </div>
            )}
          </div>

        {/* ── end left panel content ── */}
        </div>
        {/* end LEFT */}

        {/* RIGHT: meta panel */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <MetaRow label="상태">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="상태"
              style={{ ...metaSelectStyle, background: `${STATUS_CONFIG[status]?.bg ?? '#F1F3F6'} ${CHEVRON_SVG}`, color: STATUS_CONFIG[status]?.color ?? '#5A6B7F', fontWeight: 600, border: 'none' }}
            >
              {Object.values(TICKET_STATUS).map((s) => (
                <option key={s} value={s}>
                  {s === 'BACKLOG' ? 'Backlog' : s === 'TODO' ? 'To Do' : s === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                </option>
              ))}
            </select>
          </MetaRow>

          <MetaRow label="우선순위">
            {(() => {
              const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
              return (
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  aria-label="우선순위"
                  style={{ ...metaSelectStyle, background: `${cfg.bg} ${CHEVRON_SVG}`, color: cfg.color, fontWeight: 600, border: 'none' }}
                >
                  {Object.values(TICKET_PRIORITY).map((p) => {
                    const c = PRIORITY_CONFIG[p];
                    return <option key={p} value={p}>{c.icon} {c.label}</option>;
                  })}
                </select>
              );
            })()}
          </MetaRow>

          <MetaRow label="시작 예정일">
            <input
              type="date" value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDateError(''); }}
              aria-label="시작 예정일"
              max={`${new Date().getFullYear() + 5}-12-31`}
              style={metaDateStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px var(--color-accent-light, #E8F5F0)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = 'var(--color-board-bg)'; e.target.style.boxShadow = 'none'; }}
            />
          </MetaRow>

          <MetaRow label="종료 예정일">
            <input
              type="date" value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); setDateError(''); }}
              aria-label="종료 예정일"
              min={mode === 'create' ? todayLocal : undefined}
              max={`${new Date().getFullYear() + 5}-12-31`}
              style={metaDateStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px var(--color-accent-light, #E8F5F0)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = 'var(--color-board-bg)'; e.target.style.boxShadow = 'none'; }}
            />
          </MetaRow>
          {dateError && (
            <div style={{ padding: '4px 0', fontSize: 11, color: '#DC2626', fontWeight: 500 }}>{dateError}</div>
          )}

          {activeSprints.length > 0 && (
            <MetaRow label="스프린트">
              <select
                value={sprintId ?? ''}
                onChange={(e) => setSprintId(e.target.value ? Number(e.target.value) : null)}
                style={metaSelectStyle}
              >
                <option value="">없음</option>
                {activeSprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </MetaRow>
          )}

          {/* Assignee — TicketModal style */}
          <div ref={assigneeDropdownRef} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                담당자
              </span>
              {currentMemberId && !selectedAssigneeIds.includes(currentMemberId) && selectedAssigneeIds.length < 3 && (
                <button
                  type="button"
                  onClick={() => setSelectedAssigneeIds((prev) => [...prev, currentMemberId])}
                  style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-accent)', background: 'var(--color-accent-light, #E8F5F0)', border: 'none', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  나에게 할당
                </button>
              )}
            </div>
            {selectedAssigneeIds.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {allMembers.filter((m) => selectedAssigneeIds.includes(m.id)).map((member) => (
                  <span
                    key={member.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
                      height: 28, padding: '0 8px', borderRadius: 5, width: '100%',
                      background: 'transparent', border: `1.5px solid ${member.color}`,
                      color: member.color, fontSize: 11, fontWeight: 600,
                    }}
                  >
                    {member.displayName}
                    <button
                      type="button"
                      onClick={() => setSelectedAssigneeIds((prev) => prev.filter((id) => id !== member.id))}
                      aria-label={`${member.displayName} 담당자 제거`}
                      style={{ width: 12, height: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 10, lineHeight: 1, padding: 0, opacity: 0.6, transition: 'opacity 0.12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
            {!showAssigneeDropdown ? (
              <button
                type="button"
                onClick={() => { setShowAssigneeDropdown(true); setAssigneeInputText(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, border: '1px dashed #9CA3AF', cursor: 'pointer', transition: 'all 0.15s', fontSize: 12, color: 'var(--color-text-muted)', background: 'transparent', fontFamily: 'inherit', width: '100%' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-accent-light, #E8F5F0)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#9CA3AF'; e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <UserPlus size={12} />
                담당자 추가
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  ref={assigneeInputRef}
                  type="text" value={assigneeInputText}
                  onChange={(e) => { setAssigneeInputText(e.target.value); }}
                  placeholder="이름으로 검색..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setShowAssigneeDropdown(false); setAssigneeInputText(''); }
                  }}
                  style={{ width: '100%', padding: '5px 10px', border: '1px solid var(--color-accent)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: 'var(--color-text-primary)', background: '#fff', outline: 'none', boxShadow: '0 0 0 3px var(--color-accent-light, #E8F5F0)' }}
                />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, boxShadow: 'var(--shadow-dropdown)', zIndex: 200, padding: 4, maxHeight: 180, overflowY: 'auto' }}>
                  {allMembers.filter((m) => !selectedAssigneeIds.includes(m.id) && m.displayName.toLowerCase().includes(assigneeInputText.toLowerCase())).length === 0 ? (
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 8px' }}>검색 결과 없음</p>
                  ) : (
                    allMembers.filter((m) => !selectedAssigneeIds.includes(m.id) && m.displayName.toLowerCase().includes(assigneeInputText.toLowerCase())).map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setSelectedAssigneeIds((prev) => [...prev, member.id]); setShowAssigneeDropdown(false); setAssigneeInputText(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s', textAlign: 'left' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-board-bg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                          {member.displayName.charAt(0)}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{member.displayName}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            {assigneeError && <span style={{ fontSize: 11, color: '#DC2626' }}>{assigneeError}</span>}
          </div>
        </div>
        {/* end RIGHT */}

      </div>
      {/* end grid */}

      {/* Footer */}
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
        <button
          type="button" onClick={onCancel}
          style={{ height: 36, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', background: '#F3F4F6', border: '1px solid #9CA3AF', color: '#374151', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#9CA3AF'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
        >
          취소
        </button>
        <button
          type="submit" disabled={isSubmitting} aria-label={mode === 'create' ? '생성' : '저장'}
          style={{ height: 36, padding: '0 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: isSubmitting ? 'not-allowed' : 'pointer', background: isSubmitting ? 'var(--color-accent-hover)' : 'var(--color-accent)', border: 'none', color: '#ffffff', transition: 'background 0.15s', opacity: isSubmitting ? 0.8 : 1 }}
          onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-hover)'; }}
          onMouseLeave={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = 'var(--color-accent)'; }}
        >
          {isSubmitting ? '처리 중...' : mode === 'create' ? '+ 새 업무 생성' : '저장'}
        </button>
      </div>
    </form>
  );
}

// ── MetaRow sub-component ──────────────────────────────────────────────────────
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 28 }}>
        {children}
      </div>
    </div>
  );
}

