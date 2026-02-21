// ============================================================
// Tika - 공유 TypeScript 타입 정의
// ============================================================

// --- 상태(칼럼) ---
export const TICKET_STATUS = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

// --- 우선순위 ---
export const TICKET_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

// --- 칼럼 순서 & 라벨 ---
export const COLUMN_ORDER: TicketStatus[] = [
  TICKET_STATUS.BACKLOG,
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.DONE,
];

export const COLUMN_LABELS: Record<TicketStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'TODO',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

// --- 티켓 엔티티 ---
export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  position: number;
  dueDate: string | null; // ISO 8601 date (YYYY-MM-DD)
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 파생 필드 포함 (프론트엔드 표시용)
export interface TicketWithMeta extends Ticket {
  isOverdue: boolean; // dueDate < today && status !== DONE
}

// --- API 요청 타입 ---
export interface CreateTicketInput {
  title: string;
  description?: string;
  priority?: TicketPriority;
  dueDate?: string; // YYYY-MM-DD
}

export interface UpdateTicketInput {
  title?: string;
  description?: string | null;
  priority?: TicketPriority;
  dueDate?: string | null;
}

export interface ReorderTicketInput {
  ticketId: number;
  status: TicketStatus;
  position: number;
}

// --- 보드 데이터 구조 ---
export type BoardData = Record<TicketStatus, TicketWithMeta[]>;

// --- API 에러 응답 ---
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
