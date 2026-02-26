export type SectionKey = 'general' | 'notifications' | 'labels' | 'members';
export type ToastType = 'success' | 'fail' | 'info';

export interface SectionProps {
  showToast: (message: string, type?: ToastType) => void;
}
