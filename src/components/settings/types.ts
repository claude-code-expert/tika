// Phase 4: 'notifications' 키를 복원 시 추가 — REQUIREMENT-Phase4.md 참조
export type SectionKey = 'general' | 'labels' | 'members';
export type ToastType = 'success' | 'fail' | 'info';

export interface SectionProps {
  showToast: (message: string, type?: ToastType) => void;
}
