export const TICKET_STATUS = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

export const TICKET_TYPE = {
  GOAL: 'GOAL',
  STORY: 'STORY',
  FEATURE: 'FEATURE',
  TASK: 'TASK',
} as const;
export type TicketType = (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE];

export const ISSUE_TYPE = {
  GOAL: 'GOAL',
  STORY: 'STORY',
  FEATURE: 'FEATURE',
} as const;
export type IssueType = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE];

export interface Ticket {
  id: number;
  workspaceId: number;
  title: string;
  description: string | null;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  position: number;
  dueDate: string | null; // YYYY-MM-DD
  issueId: number | null;
  assigneeId: number | null;
  completedAt: string | null; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export interface TicketWithMeta extends Ticket {
  isOverdue: boolean;
  labels: Label[];
  checklistItems: ChecklistItem[];
  issue: Issue | null;
  assignee: Member | null;
}

export interface ChecklistItem {
  id: number;
  ticketId: number;
  text: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
}

export interface Label {
  id: number;
  workspaceId: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface Issue {
  id: number;
  workspaceId: number;
  name: string;
  type: IssueType;
  parentId: number | null;
  createdAt: string;
}

export interface Member {
  id: number;
  userId: string;
  workspaceId: number;
  displayName: string;
  color: string;
  createdAt: string;
}

export interface Workspace {
  id: number;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface BoardData {
  board: Record<TicketStatus, TicketWithMeta[]>;
  total: number;
}
