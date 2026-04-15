/**
 * Toast Container Component
 * 
 * Displays toast notifications with animations and actions.
 * Mount at app root level.
 */

import { useToastStore } from "../../store/toastStore";
import { cn } from "../../lib/utils";

const typeStyles = {
  success: {
    icon: "check_circle",
    bg: "bg-primary/10",
    border: "border-primary/20",
    iconColor: "text-primary",
  },
  error: {
    icon: "error",
    bg: "bg-error/10",
    border: "border-error/20",
    iconColor: "text-error",
  },
  warning: {
    icon: "warning",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-500",
  },
  info: {
    icon: "info",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-500",
  },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const styles = typeStyles[toast.type];
        
        return (
          <div
            key={toast.id}
            className={cn(
              "flex flex-col gap-2 p-4 rounded-lg border shadow-lg backdrop-blur-sm",
              "animate-in slide-in-from-right fade-in duration-200",
              styles.bg,
              styles.border
            )}
          >
            <div className="flex items-start gap-3">
              <span className={cn("material-symbols-outlined text-[20px]", styles.iconColor)}>
                {styles.icon}
              </span>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">{toast.title}</h4>
                {toast.message && (
                  <p className="text-xs text-slate-300 mt-1">{toast.message}</p>
                )}
              </div>
              
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {toast.actions && toast.actions.length > 0 && (
              <div className="flex gap-2 mt-2 ml-8">
                {toast.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      action.onClick();
                      dismissToast(toast.id);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                      action.variant === 'danger' && "bg-error/20 text-error hover:bg-error/30",
                      action.variant === 'primary' && "bg-primary/20 text-primary hover:bg-primary/30",
                      action.variant === 'secondary' && "bg-surface-high text-slate-300 hover:bg-surface-highest",
                      !action.variant && "bg-surface-high text-slate-300 hover:bg-surface-highest"
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
