import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import clsx from "clsx";
import { shadows } from "@/theme/shadows";

interface CardProps extends ViewProps {
  children: ReactNode;
}

export function Card({ className, style, children, ...props }: CardProps) {
  return (
    <View
      className={clsx("rounded-2xl border border-outline-variant/10 bg-surface-container-lowest", className)}
      style={[shadows.softGlow, style]}
      {...props}
    >
      {children}
    </View>
  );
}
