'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TicketWithMeta, Issue, Label, Member, Sprint } from '@/types/index';
import { TICKET_TYPE, TICKET_PRIORITY, TICKET_STATUS } from '@/types/index';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';
import { LABEL_MAX_PER_TICKET, CHECKLIST_MAX_ITEMS } from '@/lib/constants';
import { PRIORITY_CONFIG } from '@/components/ui/Chips';
import { labelTextColor } from '@/components/label/LabelBadge';
import { FileText, Users, Tag, CheckSquare } from 'lucide-react';

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
      return ['STORY'];
    case 'TASK':
      return ['FEATURE'];
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
  const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '');
  const [issueId, setIssueId] = useState<number | null>(initialData?.issueId ?? null);
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

  /* ── Issues for parent selection ── */
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [issueSearch, setIssueSearch] = useState('');
  const [showIssueDropdown, setShowIssueDropdown] = useState(false);
  const issueDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Multi-assignee ── */
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>(
    initialData?.assignees?.map((a) => a.id) ?? [],
  );
  const [assigneeError, setAssigneeError] = useState('');
  const [assigneeInputText, setAssigneeInputText] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeInputRef = useRef<HTMLInputElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Story points & sprint ── */
  const [storyPoints, setStoryPoints] = useState<string>(
    initialData?.storyPoints != null ? String(initialData.storyPoints) : '',
  );
  const [sprintId, setSprintId] = useState<number | null>(initialData?.sprintId ?? null);
  const [activeSprints, setActiveSprints] = useState<Sprint[]>([]);

  /* ── Fetch labels, issues, members on mount ── */
  useEffect(() => {
    fetch('/api/labels')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setAllLabels(data.labels))
      .catch(() => {});
    fetch('/api/issues')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setAllIssues(data.issues))
      .catch(() => {});
    fetch('/api/members')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { members?: Member[] } | null) => {
        if (data?.members) {
          setAllMembers(data.members);
          // default to self if no assignee set yet
          if (selectedAssigneeIds.length === 0 && data.members.length > 0 && mode === 'create') {
            const self = data.members[0];
            setSelectedAssigneeIds([self.id]);
            setAssigneeInputText(self.displayName);
          } else if (initialData?.assignees?.length) {
            setAssigneeInputText(initialData.assignees.map((a) => a.displayName).join(', '));
          }
        }
      })
      .catch(() => {});
    if (workspaceId) {
      fetch(`/api/workspaces/${workspaceId}/sprints`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { sprints?: Sprint[] } | null) => {
          if (data?.sprints) setActiveSprints(data.sprints.filter((s) => s.status === 'ACTIVE' || s.status === 'PLANNED'));
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  /* ── Close issue dropdown on outside click ── */
  useEffect(() => {
    if (!showIssueDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(e.target as Node)) {
        setShowIssueDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showIssueDropdown]);

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

  /* ── Auto-calculate story points from date range (weekdays only) ── */
  const [storyPointsManuallyEdited, setStoryPointsManuallyEdited] = useState(false);
  useEffect(() => {
    if (storyPointsManuallyEdited) return;
    if (!startDate || !dueDate) return;
    const start = new Date(startDate);
    const end = new Date(dueDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return;
    let weekdays = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) weekdays++;
      cur.setDate(cur.getDate() + 1);
    }
    setStoryPoints(String(Math.min(weekdays, 100)));
  }, [startDate, dueDate, storyPointsManuallyEdited]);

  /* ── Reset issueId when type changes (may invalidate parent) ── */
  useEffect(() => {
    const validTypes = getParentIssueTypes(type);
    if (validTypes.length === 0) {
      setIssueId(null);
      return;
    }
    if (issueId) {
      const parentIssue = allIssues.find((i) => i.id === issueId);
      if (parentIssue && !validTypes.includes(parentIssue.type)) {
        setIssueId(null);
      }
    }
  }, [type, allIssues, issueId]);

  /* ── Filtered issues for parent selection ── */
  const parentIssueTypes = getParentIssueTypes(type);
  const filteredIssues = allIssues
    .filter((i) => parentIssueTypes.includes(i.type))
    .filter((i) => {
      if (!issueSearch.trim()) return true;
      const q = issueSearch.toLowerCase();
      return i.name.toLowerCase().includes(q) || String(i.id).includes(q);
    });

  const selectedIssue = issueId ? allIssues.find((i) => i.id === issueId) : null;

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
    setIsSubmitting(true);
    try {
      if (selectedAssigneeIds.length > 5) {
        setAssigneeError('담당자는 최대 5명까지 지정할 수 있습니다');
        return;
      }

      const spParsed = storyPoints.trim() ? Number(storyPoints.trim()) : null;
      const formData: CreateTicketInput = {
        title: title.trim(),
        type: type as (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE],
        priority: priority as (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY],
        startDate: startDate || null,
        dueDate: dueDate || null,
        description: description || null,
        issueId: issueId ?? null,
        assigneeId: selectedAssigneeIds[0] ?? null,
        assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
        storyPoints: spParsed,
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

  const issueBadgeColor: Record<string, string> = {
    GOAL: '#8B5CF6',
    STORY: '#3B82F6',
    FEATURE: '#10B981',
  };
  const issueBadgeAbbr: Record<string, string> = {
    GOAL: 'G',
    STORY: 'S',
    FEATURE: 'F',
  };

  /* ── Meta panel styles (mirrors TicketModal) ── */
  const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E") no-repeat right 6px center`;
  const metaSelectStyle: React.CSSProperties = {
    width: '100%', height: 28, padding: '0 24px 0 8px',
    border: '1px solid var(--color-border)', borderRadius: 6,
    fontFamily: 'inherit', fontSize: 12, color: 'var(--color-text-primary)',
    background: `var(--color-board-bg) ${CHEVRON_SVG}`,
    outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
  };
  const metaDateStyle: React.CSSProperties = {
    width: '100%', height: 28, padding: '0 8px',
    border: '1px solid var(--color-border)', borderRadius: 6,
    fontFamily: 'inherit', fontSize: 12, color: 'var(--color-text-primary)',
    background: 'var(--color-board-bg)', outline: 'none', cursor: 'pointer',
  };
  const STATUS_META: Record<string, { bg: string; color: string }> = {
    BACKLOG: { bg: '#F1F3F6', color: '#5A6B7F' },
    TODO: { bg: '#DBEAFE', color: '#1E40AF' },
    IN_PROGRESS: { bg: '#FEF3C7', color: '#92400E' },
    DONE: { bg: '#D1FAE5', color: '#065F46' },
  };
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
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TYPE_CONFIG.map((t) => {
              const isSelected = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px 5px 6px',
                    border: `1.5px solid ${isSelected ? t.color : t.color + '55'}`,
                    borderRadius: 20,
                    background: isSelected ? `${t.color}18` : `${t.color}08`,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  aria-label={`${t.label} 타입 선택`}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: t.color, fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
                    {t.abbr}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isSelected ? t.color : 'var(--color-text-secondary)' }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two-panel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* LEFT: main content */}
        <div style={{ padding: '20px 24px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
          {/* Title */}
          {externalTitle === undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="ticket-title" style={fieldLabelStyle}>
                제목 <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>
              </label>
              <input
                id="ticket-title" type="text" value={title}
                onChange={(e) => { setTitle(e.target.value); if (e.target.value.trim()) setTitleError(''); }}
                maxLength={200} placeholder="업무 제목을 입력하세요" autoFocus
                style={{ ...inputStyle, borderColor: titleError ? '#DC2626' : 'var(--color-border)' }}
                onFocus={(e) => { if (!titleError) (e.target as HTMLElement).style.borderColor = 'var(--color-accent)'; }}
                onBlur={(e) => { if (!titleError) (e.target as HTMLElement).style.borderColor = 'var(--color-border)'; }}
              />
              {titleError && <span style={{ fontSize: 11, color: '#DC2626' }}>{titleError}</span>}
            </div>
          )}

          {/* Parent Issue */}
          {parentIssueTypes.length > 0 && (
            <div ref={issueDropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
              <div style={sectionHeaderStyle}>상위 이슈</div>
              {selectedIssue ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6, background: '#fff' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: issueBadgeColor[selectedIssue.type] ?? '#6B7280' }}>
                    {issueBadgeAbbr[selectedIssue.type] ?? '?'}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>{selectedIssue.name}</span>
                  <button type="button" onClick={() => setIssueId(null)} aria-label="상위 이슈 해제"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-muted)', padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ) : (
                <input type="text" value={issueSearch}
                  onChange={(e) => { setIssueSearch(e.target.value); setShowIssueDropdown(true); }}
                  onFocus={() => setShowIssueDropdown(true)}
                  placeholder="이슈 이름 또는 번호로 검색..."
                  style={inputStyle}
                />
              )}
              {showIssueDropdown && !selectedIssue && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', zIndex: 100, marginTop: 4 }}>
                  {filteredIssues.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-muted)' }}>검색 결과가 없습니다</div>
                  ) : filteredIssues.map((issue) => (
                    <button key={issue.id} type="button"
                      onClick={() => { setIssueId(issue.id); setIssueSearch(''); setShowIssueDropdown(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: 'var(--color-text-primary)', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-board-bg)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#fff', background: issueBadgeColor[issue.type] ?? '#6B7280', flexShrink: 0 }}>
                        {issueBadgeAbbr[issue.type] ?? '?'}
                      </span>
                      <span style={{ flex: 1 }}>{issue.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>#{issue.id}</span>
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
                      style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 9px', borderRadius: 10, fontSize: 11, fontWeight: 500, cursor: !isSelected && isAtLimit ? 'not-allowed' : 'pointer', border: 'none', background: label.color, color: labelTextColor(label.color), fontFamily: 'inherit', transition: 'opacity 0.15s', opacity: !isSelected && isAtLimit ? 0.4 : 1, boxShadow: isSelected ? `0 0 0 2px #fff, 0 0 0 4px ${label.color}` : 'none' }}
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

          {/* Assignee */}
          <div ref={assigneeDropdownRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <div style={sectionHeaderStyle}>
              <Users size={13} style={{ opacity: 0.7 }} />
              담당자
            </div>
            {selectedAssigneeIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allMembers.filter((m) => selectedAssigneeIds.includes(m.id)).map((m) => (
                  <span key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 12, background: m.color + '22', border: `1px solid ${m.color}55`, fontSize: 12, color: 'var(--color-text-primary)' }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.displayName.charAt(0).toUpperCase()}
                    </span>
                    {m.displayName}
                    <button type="button"
                      onClick={() => setSelectedAssigneeIds((prev) => prev.filter((id) => id !== m.id))}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--color-text-muted)', lineHeight: 1, fontSize: 12 }}
                      aria-label={`${m.displayName} 담당자 제거`}>×</button>
                  </span>
                ))}
              </div>
            )}
            <input ref={assigneeInputRef} type="text" value={assigneeInputText}
              placeholder="담당자 이름 입력..."
              onClick={() => { setAssigneeInputText(''); setShowAssigneeDropdown(true); }}
              onChange={(e) => { setAssigneeInputText(e.target.value); setShowAssigneeDropdown(true); }}
              style={{ ...inputStyle }}
              onFocus={(e) => ((e.target as HTMLElement).style.borderColor = 'var(--color-accent)')}
              onBlur={(e) => ((e.target as HTMLElement).style.borderColor = 'var(--color-border)')}
            />
            {showAssigneeDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 6, boxShadow: 'var(--shadow-card)', maxHeight: 160, overflowY: 'auto', marginTop: 2 }}>
                {allMembers.filter((m) => m.displayName.toLowerCase().includes(assigneeInputText.toLowerCase())).map((m) => (
                  <button key={m.id} type="button"
                    onMouseDown={(e) => { e.preventDefault(); setSelectedAssigneeIds([m.id]); setAssigneeInputText(m.displayName); setShowAssigneeDropdown(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--color-sidebar-bg)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.color, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {m.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>{m.displayName}</span>
                  </button>
                ))}
                {allMembers.filter((m) => m.displayName.toLowerCase().includes(assigneeInputText.toLowerCase())).length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>일치하는 멤버 없음</div>
                )}
              </div>
            )}
            {assigneeError && <span style={{ fontSize: 11, color: '#DC2626' }}>{assigneeError}</span>}
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
              style={{ ...metaSelectStyle, background: `${STATUS_META[status]?.bg ?? '#F1F3F6'} ${CHEVRON_SVG}`, color: STATUS_META[status]?.color ?? '#5A6B7F', fontWeight: 600, border: 'none' }}
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
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="시작 예정일"
              style={metaDateStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px var(--color-accent-light, #E8F5F0)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = 'var(--color-board-bg)'; e.target.style.boxShadow = 'none'; }}
            />
          </MetaRow>

          <MetaRow label="종료 예정일">
            <input
              type="date" value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="종료 예정일"
              style={metaDateStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px var(--color-accent-light, #E8F5F0)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = 'var(--color-board-bg)'; e.target.style.boxShadow = 'none'; }}
            />
          </MetaRow>

          <MetaRow label="스토리 포인트">
            <input
              type="number" min={1} max={100} placeholder="1–100"
              value={storyPoints}
              onChange={(e) => { setStoryPointsManuallyEdited(true); setStoryPoints(e.target.value); }}
              style={metaDateStyle}
            />
          </MetaRow>

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

