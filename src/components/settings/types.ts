export type SectionKey = 'general' | 'notification-preferences' | 'labels';
export type ToastType = 'success' | 'fail' | 'info';

export interface SectionProps {
  showToast: (message: string, type?: ToastType) => void;
  workspaceId: number;
}
