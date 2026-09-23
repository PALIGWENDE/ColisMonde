import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { shadows } from "@/theme/shadows";

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  actions?: ReactNode;
}

export function TopAppBar({ title, showBack, actions }: TopAppBarProps) {
  return (
    <SafeAreaView edges={["top"]} className="flex-row items-center justify-between bg-surface px-container-padding-mobile py-4" style={shadows.softGlow}>
      <View className="flex-row items-center gap-3">
        {showBack && (
          <Pressable onPress={() => router.back()} accessibilityLabel="Retour" className="active:scale-95">
            <Icon name="arrow_back" className="text-primary" />
          </Pressable>
        )}
        {title && <Text className="font-headline-md text-headline-md font-bold text-primary">{title}</Text>}
      </View>
      <View className="flex-row items-center gap-4">{actions}</View>
    </SafeAreaView>
  );
}
