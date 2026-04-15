/**
 * Tooltip Component - Production Ready
 * 
 * Provides contextual information on hover for disabled buttons
 * and other UI elements that need explanation.
 */

import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  position = "top",
  delay = 200,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsMounted(true);
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 10);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setTimeout(() => setIsMounted(false), 150);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isMounted && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-surface-highest border border-white/10 rounded shadow-lg whitespace-nowrap pointer-events-none transition-all duration-150",
            positionClasses[position],
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-0 h-0 border-4 border-surface-highest",
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * DisabledButtonWithTooltip - A button that shows why it's disabled
 */
interface DisabledButtonProps {
  label: string;
  icon?: string;
  reason: string;
  className?: string;
}

export function DisabledButtonWithTooltip({
  label,
  icon,
  reason,
  className,
}: DisabledButtonProps) {
  return (
    <Tooltip content={reason} position="top">
      <button
        disabled
        className={cn(
          "opacity-50 cursor-not-allowed px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 bg-surface-container text-zinc-400",
          className
        )}
      >
        {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
        {label}
      </button>
    </Tooltip>
  );
}
