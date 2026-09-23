import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-headline-md text-headline-md text-on-background">{title}</Text>
      {typeof children === "string" ? <Text className="font-body-md text-body-md text-on-surface-variant">{children}</Text> : children}
    </View>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <Text className="font-body-md text-body-md text-on-surface-variant">{children}</Text>;
}
