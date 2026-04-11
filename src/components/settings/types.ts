export type SectionKey = 'general' | 'notification-preferences' | 'labels' | 'ai-key';
export type ToastType = 'success' | 'fail' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface SectionProps {
  showToast: (message: string, type?: ToastType, action?: ToastAction, duration?: number) => void;
  workspaceId: number;
}
