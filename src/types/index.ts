// Onboarding: user type
export const USER_TYPE = {
  USER: 'USER',
  WORKSPACE: 'WORKSPACE',
} as const;
export type UserType = (typeof USER_TYPE)[keyof typeof USER_TYPE] | null;

// Onboarding: join request status
export const JOIN_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUS)[keyof typeof JOIN_REQUEST_STATUS];

export interface JoinRequest {
  id: number;
  workspaceId: number;
  userId: string;
  message: string | null;
  status: JoinRequestStatus;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface JoinRequestWithUser extends JoinRequest {
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
}

export interface WorkspaceSearchResult {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
}

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

// Phase 4: Team roles
export const TEAM_ROLE = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;
export type TeamRole = (typeof TEAM_ROLE)[keyof typeof TEAM_ROLE];

// Backward compat alias
export const MEMBER_ROLE = TEAM_ROLE;
export type MemberRole = TeamRole;

// Phase 4: Workspace type
export const WORKSPACE_TYPE = {
  PERSONAL: 'PERSONAL',
  TEAM: 'TEAM',
} as const;
export type WorkspaceType = (typeof WORKSPACE_TYPE)[keyof typeof WORKSPACE_TYPE];

// Phase 4: Sprint status
export const SPRINT_STATUS = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type SprintStatus = (typeof SPRINT_STATUS)[keyof typeof SPRINT_STATUS];

// Phase 4: Invite status
export const INVITE_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type InviteStatus = (typeof INVITE_STATUS)[keyof typeof INVITE_STATUS];

export interface Ticket {
  id: number;
  workspaceId: number;
  title: string;
  description: string | null;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  position: number;
  startDate: string | null; // YYYY-MM-DD
  dueDate: string | null; // YYYY-MM-DD
  parentId: number | null;
  assigneeId: number | null;
  sprintId: number | null; // Phase 4
  storyPoints: number | null; // Phase 4
  completedAt: string | null; // ISO 8601
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketWithMeta extends Ticket {
  isOverdue: boolean;
  labels: Label[];
  checklistItems: ChecklistItem[];
  parent: Ticket | null;
  assignee: Member | null;
  assignees: Member[]; // Phase 4: multi-assignee
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

export interface Member {
  id: number;
  userId: string;
  workspaceId: number;
  displayName: string;
  color: string;
  role: MemberRole;
  invitedBy: number | null; // Phase 4
  joinedAt: string | null; // Phase 4
  createdAt: string;
}

export interface MemberWithEmail extends Member {
  email: string;
}

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  ownerId: string;
  type: WorkspaceType; // Phase 4
  createdAt: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: TeamRole; // current user's role in this workspace
}

// Phase 4: Sprint
export interface Sprint {
  id: number;
  workspaceId: number;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  storyPointsTotal: number | null;
  createdAt: string;
}

export interface SprintWithTicketCount extends Sprint {
  ticketCount: number;
}

// Phase 4: WorkspaceInvite
export interface WorkspaceInvite {
  id: number;
  workspaceId: number;
  invitedBy: number;
  token: string;
  email: string;
  role: 'MEMBER' | 'VIEWER';
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

// Phase 4: TicketAssignee
export interface TicketAssignee {
  ticketId: number;
  memberId: number;
}

export interface LabelWithCount extends Label {
  ticketCount: number;
}

export const NOTIFICATION_CHANNEL_TYPE = {
  SLACK: 'slack',
  TELEGRAM: 'telegram',
} as const;
export type NotificationChannelType =
  (typeof NOTIFICATION_CHANNEL_TYPE)[keyof typeof NOTIFICATION_CHANNEL_TYPE];

export interface SlackConfig {
  webhookUrl: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface NotificationChannel {
  id: number;
  workspaceId: number;
  type: NotificationChannelType;
  config: SlackConfig | TelegramConfig | Record<string, never>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoardData {
  board: Record<TicketStatus, TicketWithMeta[]>;
  total: number;
  workspaceName?: string;
}

export interface Comment {
  id: number;
  ticketId: number;
  memberId: number | null;
  memberName: string | null;
  memberColor: string | null;
  text: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export const NOTIFICATION_STATUS = {
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

export interface NotificationLog {
  id: number;
  workspaceId: number;
  ticketId: number | null;
  channel: NotificationChannelType;
  message: string;
  status: NotificationStatus;
  sentAt: string; // ISO 8601
  errorMessage: string | null;
  isRead: boolean;
}

// Phase 4: Analytics types
export interface BurndownDataPoint {
  date: string;
  remainingTickets: number;
  remainingPoints: number;
  idealTickets: number;
}

export interface CfdDataPoint {
  date: string;
  backlog: number;
  todo: number;
  inProgress: number;
  done: number;
}

export interface VelocitySprint {
  sprintId: number;
  name: string;
  completedPoints: number;
  plannedPoints: number;
}

export interface CycleTimeDistribution {
  days: number;
  count: number;
}

export interface LabelAnalytic {
  name: string;
  color: string;
  count: number;
  percentage: number;
}

export interface MemberWorkload {
  memberId: number;
  displayName: string;
  color: string;
  role: TeamRole;
  assigned: number;
  inProgress: number;
  completed: number;
  byStatus: Record<TicketStatus, number>;
}

// Phase 4: Gantt chart item
export interface GanttItem {
  id: number;
  type: TicketType;
  name: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignees: Member[];
  startDate: string | null;
  endDate: string | null;
  children: GanttItem[];
  completionPct: number;
}
