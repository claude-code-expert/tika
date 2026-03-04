'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TicketWithMeta, Issue, Label, Member, Sprint } from '@/types/index';
import { TICKET_TYPE, TICKET_PRIORITY, TICKET_STATUS } from '@/types/index';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';
import { LABEL_MAX_PER_TICKET, CHECKLIST_MAX_ITEMS } from '@/lib/constants';

/* ── Type badge config (breadcrumb.html large style) ── */
const TYPE_CONFIG = [
  { value: 'GOAL', label: 'Goal', abbr: 'G', color: '#8B5CF6' },
  { value: 'STORY', label: 'Story', abbr: 'S', color: '#3B82F6' },
  { value: 'FEATURE', label: 'Feature', abbr: 'F', color: '#10B981' },
  { value: 'TASK', label: 'Task', abbr: 'T', color: '#F59E0B' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'TODO',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

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
      return ['GOAL', 'STORY'];
    case 'TASK':
      return ['GOAL', 'STORY', 'FEATURE'];
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

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* 1. 이슈 타입 — Inline label + badge buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ ...fieldLabelStyle, marginBottom: 0, flexShrink: 0 }}>
            이슈 타입 <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>
          </label>
          <select
            aria-label="유형"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 1,
              height: 1,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
            tabIndex={-1}
          >
            {TYPE_CONFIG.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TYPE_CONFIG.map((t) => {
              const isSelected = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px 5px 6px',
                    border: `1.5px solid ${isSelected ? t.color : t.color + '55'}`,
                    borderRadius: 20,
                    background: isSelected ? `${t.color}18` : `${t.color}08`,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  aria-label={`${t.label} 타입 선택`}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      background: t.color,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {t.abbr}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? t.color : 'var(--color-text-secondary)',
                    }}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 상위 이슈 (조건부) */}
        {parentIssueTypes.length > 0 && (
          <div
            ref={issueDropdownRef}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}
          >
            <label style={{ ...fieldLabelStyle, marginBottom: 0, paddingTop: 9, flexShrink: 0 }}>상위 이슈</label>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
            {selectedIssue ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  background: '#ffffff',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    background: issueBadgeColor[selectedIssue.type] ?? '#6B7280',
                  }}
                >
                  {issueBadgeAbbr[selectedIssue.type] ?? '?'}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>
                  {selectedIssue.name}
                </span>
                <button
                  type="button"
                  onClick={() => setIssueId(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: 'var(--color-text-muted)',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label="상위 이슈 해제"
                >
                  ✕
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={issueSearch}
                onChange={(e) => {
                  setIssueSearch(e.target.value);
                  setShowIssueDropdown(true);
                }}
                onFocus={() => setShowIssueDropdown(true)}
                placeholder="이슈 이름 또는 번호로 검색..."
                style={inputStyle}
              />
            )}
            {showIssueDropdown && !selectedIssue && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  maxHeight: 200,
                  overflowY: 'auto',
                  zIndex: 100,
                  marginTop: 4,
                }}
              >
                {filteredIssues.length === 0 ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    검색 결과가 없습니다
                  </div>
                ) : (
                  filteredIssues.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => {
                        setIssueId(issue.id);
                        setIssueSearch('');
                        setShowIssueDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        color: 'var(--color-text-primary)',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--color-board-bg)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#fff',
                          background: issueBadgeColor[issue.type] ?? '#6B7280',
                          flexShrink: 0,
                        }}
                      >
                        {issueBadgeAbbr[issue.type] ?? '?'}
                      </span>
                      <span style={{ flex: 1 }}>{issue.name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        #{issue.id}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            </div>
          </div>
        )}

        {/* 3. 제목 — externalTitle로 제어 중이면 헤더에서 렌더링하므로 숨김 */}
        {externalTitle === undefined && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="ticket-title" style={fieldLabelStyle}>
            제목 <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>
          </label>
          <input
            id="ticket-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError('');
            }}
            maxLength={200}
            placeholder="업무 제목을 입력하세요"
            autoFocus
            style={{
              ...inputStyle,
              borderColor: titleError ? '#DC2626' : 'var(--color-border)',
            }}
            onFocus={(e) => {
              if (!titleError) (e.target as HTMLElement).style.borderColor = 'var(--color-accent)';
            }}
            onBlur={(e) => {
              if (!titleError) (e.target as HTMLElement).style.borderColor = 'var(--color-border)';
            }}
          />
          {titleError && <span style={{ fontSize: 11, color: '#DC2626' }}>{titleError}</span>}
        </div>}

        {/* 4. 내용 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="ticket-desc" style={fieldLabelStyle}>
            내용
          </label>
          <textarea
            id="ticket-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="업무에 대한 자세한 설명을 입력하세요 (선택)"
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: 80,
              lineHeight: 1.6,
            }}
            onFocus={(e) =>
              ((e.target as HTMLElement).style.borderColor = 'var(--color-accent)')
            }
            onBlur={(e) =>
              ((e.target as HTMLElement).style.borderColor = 'var(--color-border)')
            }
          />
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

        {/* 5. 체크리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={fieldLabelStyle}>체크리스트</label>
          {checklistItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {checklistItems.map((item) => (
                <div
                  key={item.tempId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 5,
                    background: 'var(--color-board-bg)',
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '1.5px solid var(--color-border)',
                      borderRadius: 3,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setChecklistItems((prev) => prev.filter((c) => c.tempId !== item.tempId))
                    }
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--color-text-muted)',
                      padding: 0,
                      lineHeight: 1,
                    }}
                    aria-label="항목 삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          {checklistItems.length < CHECKLIST_MAX_ITEMS && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                ref={checklistInputRef}
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                placeholder="새 항목 입력..."
                maxLength={200}
                style={{
                  ...inputStyle,
                  flex: 1,
                  padding: '4px 12px',
                  border: '1.5px dashed var(--color-border-hover)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-accent)';
                  e.target.style.borderStyle = 'solid';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border-hover)';
                  e.target.style.borderStyle = 'dashed';
                }}
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                disabled={!newChecklistText.trim()}
                style={{
                  padding: '6px 12px',
                  background: 'var(--color-board-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  cursor: newChecklistText.trim() ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  opacity: !newChecklistText.trim() ? 0.5 : 1,
                }}
              >
                + 추가
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

        {/* 6. 라벨 선택 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={fieldLabelStyle}>
            라벨 선택{' '}
            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>
              (최대 {LABEL_MAX_PER_TICKET}개)
            </span>
          </label>
          {allLabels.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allLabels.map((label) => {
                const isSelected = selectedLabelIds.includes(label.id);
                const isAtLimit = selectedLabelIds.length >= LABEL_MAX_PER_TICKET;
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleLabelToggle(label.id)}
                    disabled={!isSelected && isAtLimit}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: !isSelected && isAtLimit ? 'not-allowed' : 'pointer',
                      border: isSelected
                        ? `2px solid ${label.color}`
                        : '2px solid transparent',
                      background: isSelected ? label.color : `${label.color}20`,
                      color: isSelected ? '#fff' : '#1a1a1a',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      opacity: !isSelected && isAtLimit ? 0.4 : 1,
                    }}
                  >
                    {isSelected && '✓ '}
                    {label.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              등록된 라벨이 없습니다. 설정에서 라벨을 추가하세요.
            </p>
          )}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

        {/* 7. 상태 / 우선순위 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={fieldLabelStyle}>상태</label>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap' }}>
              {(Object.values(TICKET_STATUS) as string[]).map((s) => {
                const statusColors: Record<string, { bg: string; color: string }> = {
                  BACKLOG: { bg: '#F3F4F6', color: '#6B7280' },
                  TODO: { bg: '#DBEAFE', color: '#1D4ED8' },
                  IN_PROGRESS: { bg: '#FEF3C7', color: '#B45309' },
                  DONE: { bg: '#D1FAE5', color: '#065F46' },
                };
                const sc = statusColors[s] ?? { bg: '#F3F4F6', color: '#6B7280' };
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    style={{
                      flex: 1,
                      padding: '3px 4px',
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 600,
                      border: `1.5px solid ${isActive ? sc.color : 'transparent'}`,
                      background: sc.bg,
                      color: isActive ? sc.color : sc.color + 'aa',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={fieldLabelStyle}>우선순위</label>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap' }}>
              {(Object.values(TICKET_PRIORITY) as string[]).map((p) => {
                const priorityColors: Record<string, { bg: string; color: string }> = {
                  LOW: { bg: '#9CA3AF', color: '#111827' },
                  MEDIUM: { bg: '#60A5FA', color: '#111827' },
                  HIGH: { bg: '#F87171', color: '#111827' },
                  CRITICAL: { bg: '#FCD34D', color: '#111827' },
                };
                const pc = priorityColors[p] ?? { bg: '#F3F4F6', color: '#6B7280' };
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1,
                      padding: '3px 4px',
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 600,
                      border: `1.5px solid ${isActive ? '#374151' : 'transparent'}`,
                      background: pc.bg,
                      color: '#111827',
                      opacity: isActive ? 1 : 0.6,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 8. 시작 예정일 / 종료 예정일 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="ticket-start-date" style={fieldLabelStyle}>
              시작 예정일
            </label>
            <input
              id="ticket-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
              onFocus={(e) =>
                ((e.target as HTMLElement).style.borderColor = 'var(--color-accent)')
              }
              onBlur={(e) =>
                ((e.target as HTMLElement).style.borderColor = 'var(--color-border)')
              }
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="ticket-due-date" style={fieldLabelStyle}>
              종료 예정일
            </label>
            <input
              id="ticket-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
              onFocus={(e) =>
                ((e.target as HTMLElement).style.borderColor = 'var(--color-accent)')
              }
              onBlur={(e) =>
                ((e.target as HTMLElement).style.borderColor = 'var(--color-border)')
              }
            />
          </div>
        </div>

        {/* 9. 담당자 + 스토리 포인트 (1열 배치) */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* 담당자 (70%) — autocomplete input */}
          <div ref={assigneeDropdownRef} style={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
            <label style={fieldLabelStyle}>담당자</label>
            <input
              ref={assigneeInputRef}
              type="text"
              value={assigneeInputText}
              placeholder="담당자 이름 입력..."
              onClick={() => {
                setAssigneeInputText('');
                setShowAssigneeDropdown(true);
              }}
              onChange={(e) => {
                setAssigneeInputText(e.target.value);
                setShowAssigneeDropdown(true);
              }}
              style={{ ...inputStyle }}
              onFocus={(e) => ((e.target as HTMLElement).style.borderColor = 'var(--color-accent)')}
              onBlur={(e) => ((e.target as HTMLElement).style.borderColor = 'var(--color-border)')}
            />
            {showAssigneeDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: '#fff', border: '1px solid var(--color-border)',
                borderRadius: 6, boxShadow: 'var(--shadow-card)', maxHeight: 160, overflowY: 'auto',
                marginTop: 2,
              }}>
                {allMembers
                  .filter((m) => m.displayName.toLowerCase().includes(assigneeInputText.toLowerCase()))
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedAssigneeIds([m.id]);
                        setAssigneeInputText(m.displayName);
                        setShowAssigneeDropdown(false);
                      }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', background: 'none', border: 'none',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      }}
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
            {assigneeError && (
              <span style={{ fontSize: 11, color: '#DC2626' }}>{assigneeError}</span>
            )}
          </div>

          {/* 스토리 포인트 (나머지) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={fieldLabelStyle}>스토리 포인트</label>
            <input
              type="number"
              min={1}
              max={100}
              placeholder="1–100"
              value={storyPoints}
              onChange={(e) => {
                setStoryPointsManuallyEdited(true);
                setStoryPoints(e.target.value);
              }}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
        </div>

        {/* 11. Sprint (only when sprints available) */}
        {activeSprints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={fieldLabelStyle}>스프린트</label>
            <select
              value={sprintId ?? ''}
              onChange={(e) => setSprintId(e.target.value ? Number(e.target.value) : null)}
              style={{ ...inputStyle, width: '100%', appearance: 'auto' }}
            >
              <option value="">스프린트 없음</option>
              {activeSprints.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            height: 36,
            padding: '0 18px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            background: '#F3F4F6',
            border: '1px solid #9CA3AF',
            color: '#374151',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)';
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
          }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label={mode === 'create' ? '생성' : '저장'}
          style={{
            height: 36,
            padding: '0 18px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            background: isSubmitting ? 'var(--color-accent-hover)' : 'var(--color-accent)',
            border: 'none',
            color: '#ffffff',
            transition: 'background 0.15s',
            opacity: isSubmitting ? 0.8 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting)
              (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-hover)';
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting)
              (e.currentTarget as HTMLElement).style.background = 'var(--color-accent)';
          }}
        >
          {isSubmitting ? '처리 중...' : mode === 'create' ? '업무 생성' : '저장'}
        </button>
      </div>
    </form>
  );
}
