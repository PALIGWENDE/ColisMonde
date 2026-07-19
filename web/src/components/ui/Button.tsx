import { forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "outline" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-gradient text-on-primary hover:opacity-90 shadow-md shadow-primary/10",
  outline: "border-2 border-primary text-primary hover:bg-primary/5",
  secondary: "bg-secondary text-on-secondary hover:opacity-90",
  ghost: "text-primary hover:bg-primary-container/10",
  danger: "bg-error text-on-error hover:opacity-90",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-6 py-3 text-label-md font-label-md rounded-xl",
  lg: "px-8 py-4 text-label-md font-label-md rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
      </button>
    );
  },
);
Button.displayName = "Button";
