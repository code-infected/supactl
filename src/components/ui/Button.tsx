import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-glow",
      secondary:
        "bg-surface-high border border-DEFAULT text-white hover:bg-surface active:bg-surface-low",
      ghost: "text-muted hover:text-white hover:bg-white/5 active:bg-white/10",
      danger:
        "bg-error/10 border border-error/20 text-error hover:bg-error/20 active:bg-error/30",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded",
      md: "px-4 py-2 text-sm rounded",
      lg: "px-6 py-2.5 text-base rounded",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="material-symbols-outlined animate-spin text-[1em]">
            autorenew
          </span>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
