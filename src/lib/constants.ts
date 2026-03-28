// ─── Ticket type / priority display metadata ──────────────────────────────────
export const TICKET_TYPE_META = {
  GOAL:    { bg: '#8B5CF6', abbr: 'G', label: 'Goal' },
  STORY:   { bg: '#3B82F6', abbr: 'S', label: 'Story' },
  FEATURE: { bg: '#10B981', abbr: 'F', label: 'Feature' },
  TASK:    { bg: '#F59E0B', abbr: 'T', label: 'Task' },
} as const;

export const PRIORITY_META = {
  CRITICAL: { bg: '#FEE2E2', color: '#DC2626', label: 'Critical' },
  HIGH:     { bg: '#FFEDD5', color: '#C2410C', label: 'High' },
  MEDIUM:   { bg: '#FEF9C3', color: '#A16207', label: 'Medium' },
  LOW:      { bg: '#F3F4F6', color: '#6B7280', label: 'Low' },
} as const;

export const POSITION_GAP = 1024;
export const REBALANCE_THRESHOLD = 2;
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const CHECKLIST_MAX_ITEMS = 20;
export const LABEL_MAX_PER_TICKET = 3;
export const LABEL_MAX_PER_WORKSPACE = 20;
export const TICKET_MAX_PER_WORKSPACE = 300;
export const TICKET_MAX_TEAM_WORKSPACE = 1000;
export const TICKET_WARNING_TEAM = 900;
export const TICKET_WARNING_PERSONAL = 270;

export const DEFAULT_LABELS = [
  { name: 'Plan',     color: '#2b7fff' },
  { name: 'Frontend', color: '#615fff' },
  { name: 'Backend',  color: '#00c950' },
  { name: 'Analyze',  color: '#ad46ff' },
  { name: 'Test',     color: '#ffac6d' },
  { name: 'Debug',    color: '#fb2c36' },
  { name: 'Design',   color: '#ff29d3' },
  { name: 'Infra',    color: '#89d0f0' },
  { name: 'QA',       color: '#46e264' },
] as const;
