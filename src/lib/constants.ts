// ============================================================
// Tika - 상수 정의
// ============================================================

// 칼럼별 색상 (Tailwind 클래스)
export const COLUMN_COLORS: Record<string, string> = {
  BACKLOG: 'bg-gray-50 border-gray-200',
  TODO: 'bg-blue-50 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 border-amber-200',
  DONE: 'bg-green-50 border-green-200',
};

// 우선순위 뱃지 색상
export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-red-100 text-red-700',
};

// 우선순위 라벨
export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

// Position 간격 (새 카드 삽입 시)
export const POSITION_GAP = 1024;

// 입력 제한
export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 1000;
