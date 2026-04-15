/**
 * Toast Notification System - Production Ready
 * 
 * Replaces native alert()/confirm() with polished toast notifications.
 * Supports multiple toast types, auto-dismiss, and action buttons.
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, undefined = persistent
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
  onDismiss?: () => void;
}

export interface ToastState {
  toasts: Toast[];
  
  // Actions
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

// Generate unique ID
function generateId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (toastData) => {
    const id = generateId();
    const toast: Toast = {
      ...toastData,
      id,
      duration: toastData.duration ?? 5000, // Default 5 seconds
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-dismiss if duration specified
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, toast.duration);
    }

    return id;
  },

  dismissToast: (id) => {
    set((state) => {
      const toast = state.toasts.find((t) => t.id === id);
      if (toast?.onDismiss) {
        toast.onDismiss();
      }
      return {
        toasts: state.toasts.filter((t) => t.id !== id),
      };
    });
  },

  dismissAll: () => {
    set((state) => {
      state.toasts.forEach((t) => t.onDismiss?.());
      return { toasts: [] };
    });
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },
}));

// Convenience helpers
export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().showToast({
      type: 'success',
      title,
      message,
      duration,
    }),

  error: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().showToast({
      type: 'error',
      title,
      message,
      duration: duration ?? 8000, // Errors stay longer
    }),

  warning: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().showToast({
      type: 'warning',
      title,
      message,
      duration,
    }),

  info: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().showToast({
      type: 'info',
      title,
      message,
      duration,
    }),

  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) =>
    useToastStore.getState().showToast({
      type: 'warning',
      title,
      message,
      duration: 0, // Persistent until user action
      actions: [
        {
          label: 'Confirm',
          onClick: () => {
            onConfirm();
            // Toast will be dismissed by the dismiss call in component
          },
          variant: 'danger',
        },
        {
          label: 'Cancel',
          onClick: () => {
            onCancel?.();
            // Toast will be dismissed
          },
          variant: 'secondary',
        },
      ],
    }),

  // Expose raw showToast for custom configurations
  custom: (toast: Omit<Toast, 'id'>) =>
    useToastStore.getState().showToast(toast),
};
