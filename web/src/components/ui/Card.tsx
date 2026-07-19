import clsx from "clsx";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-soft-glow", className)}
      {...props}
    >
      {children}
    </div>
  );
}
