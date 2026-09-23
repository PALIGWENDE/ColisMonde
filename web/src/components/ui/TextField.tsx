import { forwardRef } from "react";
import clsx from "clsx";
import { Icon } from "./Icon";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, icon, error, className, id, ...props }, ref) => {
    const fieldId = id ?? props.name;
    const errorId = error && fieldId ? `${fieldId}-error` : undefined;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="block font-label-md text-label-md text-on-surface-variant">
            {label}
          </label>
        )}
        <div
          className={clsx(
            "flex items-center gap-3 rounded-xl border bg-surface p-3 transition-colors focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/25",
            error ? "border-error" : "border-outline-variant/40",
          )}
        >
          {icon && <Icon name={icon} className="text-on-surface-variant" />}
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={errorId}
            className={clsx("w-full border-none bg-transparent font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-0", className)}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} aria-live="polite" className="font-label-sm text-label-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
TextField.displayName = "TextField";
