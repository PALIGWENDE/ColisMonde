import clsx from "clsx";

interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
}

/** Enveloppe Material Symbols Outlined, fidèle à l'iconographie du design Stitch. */
export function Icon({ name, filled, className, size }: IconProps) {
  return (
    <span
      className={clsx("material-symbols-outlined", filled && "filled", className)}
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
