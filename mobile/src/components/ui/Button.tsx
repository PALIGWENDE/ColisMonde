import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import clsx from "clsx";

type Variant = "primary" | "outline" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-6 py-3 rounded-xl",
  lg: "px-8 py-4 rounded-2xl",
};

const CONTAINER_CLASSES: Record<Exclude<Variant, "primary">, string> = {
  outline: "border-2 border-primary-container bg-transparent",
  secondary: "bg-secondary",
  ghost: "bg-transparent",
  danger: "bg-error",
};

const TEXT_CLASSES: Record<Variant, string> = {
  primary: "text-on-primary",
  outline: "text-primary-container",
  secondary: "text-on-secondary",
  ghost: "text-primary",
  danger: "text-on-error",
};

/** Web utilise bg-brand-gradient (dégradé rouge→vert), non traduisible en className RN — LinearGradient pour la variante primary. */
export function Button({ variant = "primary", size = "md", fullWidth, loading, disabled, className, style, children, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  const content = loading ? (
    <ActivityIndicator color={variant === "primary" || variant === "secondary" || variant === "danger" ? "#ffffff" : "#046A38"} />
  ) : typeof children === "string" ? (
    <Text className={clsx("font-label-md text-label-md font-semibold", TEXT_CLASSES[variant])}>{children}</Text>
  ) : (
    children
  );

  if (variant === "primary") {
    return (
      <Pressable disabled={isDisabled} className={clsx(fullWidth && "w-full", isDisabled && "opacity-50")} style={style} {...props}>
        <LinearGradient
          colors={["#EF2B2D", "#009E49"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={clsx("flex-row items-center justify-center gap-2", SIZE_CLASSES[size])}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={isDisabled}
      className={clsx(
        "flex-row items-center justify-center gap-2",
        SIZE_CLASSES[size],
        CONTAINER_CLASSES[variant],
        fullWidth && "w-full",
        isDisabled && "opacity-50",
        className,
      )}
      style={style}
      {...props}
    >
      {content}
    </Pressable>
  );
}
