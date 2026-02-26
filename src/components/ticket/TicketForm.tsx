'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TicketWithMeta, Issue, Label, Member } from '@/types/index';
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
  onSubmit: (
    data: CreateTicketInput | UpdateTicketInput,
    extra?: { checklistTexts?: string[] },
  ) => Promise<void>;
  onCancel: () => void;
}

export function TicketForm({ mode = 'create', initialData, onSubmit, onCancel }: TicketFormProps) {
  /* ── Form state ── */
  const [type, setType] = useState<string>(initialData?.type ?? 'TASK');
  const [title, setTitle] = useState(initialData?.title ?? '');
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

  /* ── Assignee (current user, disabled) ── */
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

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
      .then((data) => {
        if (data?.members?.length > 0) {
          setCurrentMember(data.members[0]);
        }
      })
      .catch(() => {});
  }, []);

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
      const formData: CreateTicketInput = {
        title: title.trim(),
        type: type as (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE],
        priority: priority as (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY],
        startDate: startDate || null,
        dueDate: dueDate || null,
        description: description || null,
        issueId: issueId ?? null,
        assigneeId: currentMember?.id ?? null,
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
        {/* 1. 이슈 타입 — Large badge style */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={fieldLabelStyle}>
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
          <div style={{ display: 'flex', gap: 8 }}>
            {TYPE_CONFIG.map((t) => {
              const isSelected = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    border: isSelected
                      ? `2px solid ${t.color}`
                      : '2px solid var(--color-border)',
                    borderRadius: 8,
                    background: isSelected ? `${t.color}12` : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                  aria-label={`${t.label} 타입 선택`}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#fff',
                      background: t.color,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {t.abbr}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
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
            style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}
          >
            <label style={fieldLabelStyle}>상위 이슈</label>
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
        )}

        {/* 3. 제목 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        </div>

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
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                placeholder="새 항목 입력..."
                maxLength={200}
                style={{
                  ...inputStyle,
                  flex: 1,
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
                      color: isSelected ? '#fff' : label.color,
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
            <label htmlFor="ticket-status" style={fieldLabelStyle}>
              상태
            </label>
            <select
              id="ticket-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
              onFocus={(e) =>
                ((e.target as HTMLElement).style.borderColor = 'var(--color-accent)')
              }
              onBlur={(e) =>
                ((e.target as HTMLElement).style.borderColor = 'var(--color-border)')
              }
            >
              {Object.values(TICKET_STATUS).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="ticket-priority" style={fieldLabelStyle}>
              우선순위
            </label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={inputStyle}
              onFocus={(e) =>
                ((e.target as HTMLElement).style.borderColor = 'var(--color-accent)')
              }
              onBlur={(e) =>
                ((e.target as HTMLElement).style.borderColor = 'var(--color-border)')
              }
            >
              {Object.values(TICKET_PRIORITY).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
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

        {/* 9. 담당자 (disabled) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={fieldLabelStyle}>담당자</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: '#F8F9FB',
              opacity: 0.8,
            }}
          >
            {currentMember ? (
              <>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: currentMember.color ?? 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  {currentMember.displayName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
                  {currentMember.displayName}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                로딩 중...
              </span>
            )}
          </div>
        </div>
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
            background: 'var(--color-board-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
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
